// Self-hosted authentication, drop-in replacement for @getmocha/users-service.
//
// The original app used Mocha's Users Service for Google sign-in. Mocha is shutting
// down, so this module re-implements the exact same surface the worker imported
// (getOAuthRedirectUrl, exchangeCodeForSessionToken, authMiddleware, deleteSession,
// SESSION_COOKIE_NAME) using a direct Google OAuth 2.0 flow plus our own signed
// session JWT. The worker (src/worker/index.ts) only changes its import line and the
// few auth route bodies; everything else keeps working unchanged.
//
// Required env (set as wrangler secrets / .dev.vars):
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, SESSION_SECRET

import { SignJWT, jwtVerify } from "jose";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import type { Context, Next } from "hono";

// Cookie that carries our signed session JWT (replaces MOCHA_SESSION_TOKEN_COOKIE_NAME).
export const SESSION_COOKIE_NAME = "retromynd_session";

const SESSION_TTL = "60d";

type GoogleProfile = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string | null;
  picture?: string;
  hd?: string | null;
};

// Shape the frontend reads (Header.tsx uses user.google_user_data.picture / given_name).
export type GoogleUserData = {
  name?: string;
  hd: string | null;
  sub: string;
  email: string;
  email_verified?: boolean;
  family_name: string | null;
  given_name?: string;
  picture?: string;
};

export type AuthUser = {
  id: string;
  email: string;
  google_user_data: GoogleUserData;
};

function secretKey(env: Env): Uint8Array {
  if (!env.SESSION_SECRET) {
    throw new HTTPException(500, { message: "SESSION_SECRET is not configured" });
  }
  return new TextEncoder().encode(env.SESSION_SECRET);
}

/**
 * Build the Google OAuth consent URL the browser should be sent to.
 * Mirrors getOAuthRedirectUrl("google", ...) from the Mocha SDK.
 */
export function getOAuthRedirectUrl(env: Env): string {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: env.GOOGLE_REDIRECT_URI ?? "",
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange the OAuth `code` for a signed session token.
 * Upserts the user into the D1 `users` table keyed by google_sub, preserving any
 * pre-seeded id (so existing rows like user_arcade_stats stay linked).
 */
export async function exchangeCodeForSessionToken(code: string, env: Env): Promise<string> {
  // 1) Exchange the authorization code for Google tokens.
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID ?? "",
      client_secret: env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: env.GOOGLE_REDIRECT_URI ?? "",
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    throw new HTTPException(401, { message: "Failed to exchange authorization code with Google" });
  }
  const tokens = (await tokenRes.json()) as { access_token?: string };

  // 2) Fetch the user's Google profile.
  const infoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token ?? ""}` },
  });
  if (!infoRes.ok) {
    throw new HTTPException(401, { message: "Failed to fetch Google profile" });
  }
  const profile = (await infoRes.json()) as GoogleProfile;
  if (!profile.sub || !profile.email) {
    throw new HTTPException(401, { message: "Invalid Google profile" });
  }

  const googleUserData: GoogleUserData = {
    name: profile.name,
    hd: profile.hd ?? null,
    sub: profile.sub,
    email: profile.email,
    email_verified: profile.email_verified,
    family_name: profile.family_name ?? null,
    given_name: profile.given_name,
    picture: profile.picture,
  };

  // 3) Upsert by google_sub (preserve existing id).
  const now = new Date().toISOString();
  const existing = await env.DB.prepare("SELECT id FROM users WHERE google_sub = ?")
    .bind(profile.sub)
    .first<{ id: string }>();

  let userId: string;
  if (existing) {
    userId = existing.id;
    await env.DB.prepare(
      "UPDATE users SET email = ?, google_user_data = ?, updated_at = ?, last_signed_in_at = ? WHERE id = ?",
    )
      .bind(profile.email, JSON.stringify(googleUserData), now, now, userId)
      .run();
  } else {
    userId = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO users (id, email, google_sub, google_user_data, created_at, updated_at, last_signed_in_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(userId, profile.email, profile.sub, JSON.stringify(googleUserData), now, now, now)
      .run();
  }

  // 4) Mint the session JWT (carries the data the frontend needs, so authMiddleware
  //    needs no DB round-trip per request).
  return await new SignJWT({ email: profile.email, gud: googleUserData })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(secretKey(env));
}

/**
 * Hono middleware that validates the session cookie and populates c.get("user").
 * Throws HTTPException(401) when unauthenticated — this both yields a clean 401 on
 * protected routes and satisfies the manual `.catch()` usage in adminMiddleware.
 */
export const authMiddleware = async (c: Context<any>, next: Next): Promise<void> => {
  const token = getCookie(c, SESSION_COOKIE_NAME);
  if (!token) {
    throw new HTTPException(401, { message: "Not authenticated" });
  }
  let payload: Record<string, unknown>;
  try {
    const result = await jwtVerify(token, secretKey(c.env as Env));
    payload = result.payload as Record<string, unknown>;
  } catch {
    throw new HTTPException(401, { message: "Invalid or expired session" });
  }

  const user: AuthUser = {
    id: String(payload.sub ?? ""),
    email: String(payload.email ?? ""),
    google_user_data: (payload.gud as GoogleUserData) ?? {
      hd: null,
      sub: String(payload.sub ?? ""),
      email: String(payload.email ?? ""),
      family_name: null,
    },
  };
  if (!user.id) {
    throw new HTTPException(401, { message: "Invalid session" });
  }

  c.set("user", user);
  await next();
};

/**
 * Stateless sessions (JWT) have nothing server-side to revoke; the /api/logout route
 * clears the cookie. Kept for signature compatibility with the old Mocha import.
 */
export async function deleteSession(_token?: string): Promise<void> {
  // no-op
}
