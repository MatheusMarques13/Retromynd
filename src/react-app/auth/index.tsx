// Self-hosted auth context — drop-in replacement for Mocha's users-service React client.
//
// Exposes the exact same surface the app already consumes:
//   const { user, isPending, redirectToLogin, exchangeCodeForSessionToken, logout } = useAuth();
// and <AuthProvider> at the app root. It talks to the same worker endpoints
// (/api/users/me, /api/oauth/google/redirect_url, /api/sessions, /api/logout),
// which are now backed by src/worker/auth.ts (Google OAuth + session JWT).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type GoogleUserData = {
  name?: string;
  hd?: string | null;
  sub?: string;
  email?: string;
  email_verified?: boolean;
  family_name?: string | null;
  given_name?: string;
  picture?: string;
};

export type User = {
  id: string;
  email: string;
  google_user_data: GoogleUserData;
};

type AuthContextValue = {
  user: User | null;
  isPending: boolean;
  redirectToLogin: () => Promise<void>;
  exchangeCodeForSessionToken: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isPending, setIsPending] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/users/me", { credentials: "include" });
      setUser(res.ok ? ((await res.json()) as User) : null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      await fetchUser();
      if (active) setIsPending(false);
    })();
    return () => {
      active = false;
    };
  }, [fetchUser]);

  const redirectToLogin = useCallback(async () => {
    const res = await fetch("/api/oauth/google/redirect_url", { credentials: "include" });
    if (!res.ok) throw new Error("Failed to obtain login URL");
    const { redirectUrl } = (await res.json()) as { redirectUrl: string };
    window.location.href = redirectUrl;
  }, []);

  const exchangeCodeForSessionToken = useCallback(async () => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) throw new Error("No authorization code found in the URL");
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code }),
    });
    if (!res.ok) throw new Error("Failed to exchange authorization code");
    await fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/logout", { credentials: "include" });
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isPending, redirectToLogin, exchangeCodeForSessionToken, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
