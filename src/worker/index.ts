import { Hono } from "hono";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  SESSION_COOKIE_NAME,
} from "./auth";
import { getCookie, setCookie } from "hono/cookie";
import { GoogleGenAI } from "@google/genai";
import Stripe from "stripe";
import Firecrawl from "@mendable/firecrawl-js";

// Extend Env with app-specific bindings
declare global {
  interface Env {
    ADMIN_EMAILS?: string;
    R2_BUCKET: R2Bucket;
    GEMINI_API_KEY?: string;
    STRIPE_SECRET_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    FIRECRAWL_API_KEY?: string;
    PRINTIFY_API_TOKEN?: string;
    PRINTIFY_SHOP_ID?: string;
    // Self-hosted Google OAuth + session (see src/worker/auth.ts)
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    GOOGLE_REDIRECT_URI?: string;
    SESSION_SECRET?: string;
  }
}

type Variables = {
  user: {
    id: string;
    email: string;
    google_user_data?: unknown;
  };
  isAdmin: boolean;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Admin middleware - checks if user is authenticated AND is an admin
const adminMiddleware = async (c: Parameters<typeof authMiddleware>[0], next: () => Promise<void>) => {
  // First run auth middleware
  const authResult = await new Promise<Response | null>((resolve) => {
    authMiddleware(c, async () => {
      resolve(null);
    }).catch(() => {
      resolve(c.json({ error: "Not authenticated" }, 401));
    });
  });
  
  if (authResult) {
    return authResult;
  }
  
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Not authenticated" }, 401);
  }
  const adminEmails = (c.env.ADMIN_EMAILS || "").split(",").map((e: string) => e.trim().toLowerCase()).filter(Boolean);
  
  if (!adminEmails.includes(user.email.toLowerCase())) {
    return c.json({ error: "Admin access required" }, 403);
  }
  
  c.set("isAdmin", true);
  await next();
};

// Obtain the Google OAuth consent URL (see src/worker/auth.ts)
app.get("/api/oauth/google/redirect_url", async (c) => {
  const redirectUrl = getOAuthRedirectUrl(c.env);

  return c.json({ redirectUrl }, 200);
});

// Exchange the code for a session token
app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, c.env);

  setCookie(c, SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

// Get the current user object for the frontend
app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

// Log out the user
app.get("/api/logout", async (c) => {
  const sessionToken = getCookie(c, SESSION_COOKIE_NAME);

  if (typeof sessionToken === "string") {
    await deleteSession(sessionToken);
  }

  setCookie(c, SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// ============ USER PROFILE ENDPOINTS ============

// Avatar presets available in the system
const AVATAR_PRESETS = [
  { id: 'gameboy', name: 'Gameboy', icon: 'Gamepad2' },
  { id: 'rocket', name: 'Rocket', icon: 'Rocket' },
  { id: 'star', name: 'Star', icon: 'Star' },
  { id: 'controller', name: 'Controller', icon: 'Joystick' },
  { id: 'ghost', name: 'Ghost', icon: 'Ghost' },
  { id: 'robot', name: 'Robot', icon: 'Bot' },
  { id: 'alien', name: 'Alien', icon: 'Skull' },
  { id: 'ninja', name: 'Ninja', icon: 'Swords' },
  { id: 'wizard', name: 'Wizard', icon: 'Wand2' },
  { id: 'dragon', name: 'Dragon', icon: 'Flame' },
  { id: 'unicorn', name: 'Unicorn', icon: 'Sparkles' },
  { id: 'crown', name: 'Crown', icon: 'Crown' },
  { id: 'fire', name: 'Fire', icon: 'Zap' },
  { id: 'diamond', name: 'Diamond', icon: 'Gem' },
  { id: 'skull', name: 'Skull', icon: 'Skull' },
  { id: 'cat', name: 'Cat', icon: 'Cat' },
];

// Get avatar presets list
app.get("/api/profile/avatars", async (c) => {
  return c.json({ avatars: AVATAR_PRESETS });
});

// Get current user's profile
app.get("/api/profile", authMiddleware, async (c) => {
  const user = c.get("user");
  
  // Get or create profile
  let profile = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE user_id = ?"
  ).bind(user.id).first();
  
  if (!profile) {
    // Create default profile
    const defaultUsername = `user_${user.id.slice(0, 8)}`;
    await c.env.DB.prepare(
      `INSERT INTO user_profiles (user_id, username, display_name, avatar_preset, theme_color)
       VALUES (?, ?, ?, 'gameboy', '#E673AA')`
    ).bind(user.id, defaultUsername, user.email.split('@')[0]).run();
    
    profile = await c.env.DB.prepare(
      "SELECT * FROM user_profiles WHERE user_id = ?"
    ).bind(user.id).first();
  }
  
  // Get arcade stats
  const arcadeStats = await c.env.DB.prepare(
    "SELECT * FROM user_arcade_stats WHERE user_id = ?"
  ).bind(user.id).first();
  
  // Get earned badges
  const badges = await c.env.DB.prepare(
    `SELECT ub.*, ab.name, ab.description, ab.icon, ab.rarity
     FROM user_badges ub
     LEFT JOIN arcade_badges ab ON ub.badge_id = ab.id
     WHERE ub.user_id = ?
     ORDER BY ub.earned_at DESC`
  ).bind(user.id).all();
  
  // Get shopping badges
  const shoppingBadges = await c.env.DB.prepare(
    "SELECT * FROM user_badges WHERE user_id = ? AND badge_id LIKE 'shopping_%'"
  ).bind(user.id).all();
  
  // Get game sessions stats
  const gameSessions = await c.env.DB.prepare(
    `SELECT game_type, MAX(score) as high_score, COUNT(*) as times_played, SUM(tickets_earned) as total_tickets
     FROM game_sessions
     WHERE user_id = ?
     GROUP BY game_type
     ORDER BY high_score DESC`
  ).bind(user.id).all();
  
  return c.json({
    profile,
    arcadeStats: arcadeStats || { total_tickets: 0, tickets_spent: 0, games_played: 0 },
    badges: badges.results || [],
    shoppingBadges: shoppingBadges.results || [],
    gameSessions: gameSessions.results || [],
    email: user.email
  });
});

// Update current user's profile
app.put("/api/profile", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  
  const { username, display_name, bio, avatar_preset, avatar_url, theme_color, favorite_game, display_badges, is_public } = body;
  
  // Check if username is taken (if changing)
  if (username) {
    const existing = await c.env.DB.prepare(
      "SELECT id FROM user_profiles WHERE username = ? AND user_id != ?"
    ).bind(username, user.id).first();
    
    if (existing) {
      return c.json({ error: "Username already taken" }, 400);
    }
    
    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return c.json({ error: "Username must be 3-20 characters, letters, numbers and underscore only" }, 400);
    }
  }
  
  // Ensure profile exists
  const existingProfile = await c.env.DB.prepare(
    "SELECT id FROM user_profiles WHERE user_id = ?"
  ).bind(user.id).first();
  
  if (!existingProfile) {
    // Create profile first
    await c.env.DB.prepare(
      `INSERT INTO user_profiles (user_id, username, display_name, avatar_preset, theme_color)
       VALUES (?, ?, ?, 'gameboy', '#E673AA')`
    ).bind(user.id, username || `user_${user.id.slice(0, 8)}`, display_name || user.email.split('@')[0]).run();
  }
  
  // Build update query dynamically
  const updates: string[] = [];
  const values: (string | number | null)[] = [];
  
  if (username !== undefined) { updates.push("username = ?"); values.push(username); }
  if (display_name !== undefined) { updates.push("display_name = ?"); values.push(display_name); }
  if (bio !== undefined) { updates.push("bio = ?"); values.push(bio); }
  if (avatar_preset !== undefined) { updates.push("avatar_preset = ?"); values.push(avatar_preset); }
  if (avatar_url !== undefined) { updates.push("avatar_url = ?"); values.push(avatar_url); }
  if (theme_color !== undefined) { updates.push("theme_color = ?"); values.push(theme_color); }
  if (favorite_game !== undefined) { updates.push("favorite_game = ?"); values.push(favorite_game); }
  if (display_badges !== undefined) { updates.push("display_badges = ?"); values.push(JSON.stringify(display_badges)); }
  if (is_public !== undefined) { updates.push("is_public = ?"); values.push(is_public ? 1 : 0); }
  
  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(user.id);
  
  if (updates.length > 1) {
    await c.env.DB.prepare(
      `UPDATE user_profiles SET ${updates.join(", ")} WHERE user_id = ?`
    ).bind(...values).run();
  }
  
  // Return updated profile
  const profile = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE user_id = ?"
  ).bind(user.id).first();
  
  return c.json({ profile });
});

// Get public profile by username
app.get("/api/profile/:username", async (c) => {
  const username = c.req.param("username");
  
  const profile = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE username = ? AND is_public = 1"
  ).bind(username).first();
  
  if (!profile) {
    return c.json({ error: "Profile not found" }, 404);
  }
  
  // Increment view count
  await c.env.DB.prepare(
    "UPDATE user_profiles SET profile_views = profile_views + 1 WHERE username = ?"
  ).bind(username).run();
  
  // Get arcade stats
  const arcadeStats = await c.env.DB.prepare(
    "SELECT total_tickets, games_played, high_scores FROM user_arcade_stats WHERE user_id = ?"
  ).bind(profile.user_id).first();
  
  // Get earned badges (public info only)
  const badges = await c.env.DB.prepare(
    `SELECT ub.badge_id, ub.earned_at, ab.name, ab.description, ab.icon, ab.rarity
     FROM user_badges ub
     LEFT JOIN arcade_badges ab ON ub.badge_id = ab.id
     WHERE ub.user_id = ?
     ORDER BY ub.earned_at DESC
     LIMIT 20`
  ).bind(profile.user_id).all();
  
  // Get top game sessions
  const topGames = await c.env.DB.prepare(
    `SELECT game_type, MAX(score) as high_score, COUNT(*) as times_played
     FROM game_sessions
     WHERE user_id = ?
     GROUP BY game_type
     ORDER BY high_score DESC
     LIMIT 10`
  ).bind(profile.user_id).all();
  
  // Get shopping badges count
  const shoppingBadgesCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM user_badges WHERE user_id = ? AND badge_id LIKE 'shopping_%'"
  ).bind(profile.user_id).first();
  
  return c.json({
    profile: {
      username: profile.username,
      display_name: profile.display_name,
      avatar_preset: profile.avatar_preset,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
      theme_color: profile.theme_color,
      favorite_game: profile.favorite_game,
      display_badges: profile.display_badges,
      total_games_played: profile.total_games_played,
      total_score: profile.total_score,
      profile_views: profile.profile_views,
      created_at: profile.created_at
    },
    arcadeStats: arcadeStats || { total_tickets: 0, games_played: 0 },
    badges: badges.results || [],
    topGames: topGames.results || [],
    shoppingBadgesCount: (shoppingBadgesCount as Record<string, number>)?.count || 0
  });
});

// Check username availability
app.get("/api/profile/check-username/:username", async (c) => {
  const username = c.req.param("username");
  
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return c.json({ available: false, error: "Invalid format" });
  }
  
  const existing = await c.env.DB.prepare(
    "SELECT id FROM user_profiles WHERE username = ?"
  ).bind(username).first();
  
  return c.json({ available: !existing });
});

// ============ ADMIN ENDPOINTS ============

// Check if current user is admin
app.get("/api/admin/check", authMiddleware, async (c) => {
  const user = c.get("user");
  const adminEmails = (c.env.ADMIN_EMAILS || "").split(",").map((e: string) => e.trim().toLowerCase()).filter(Boolean);
  const isAdmin = adminEmails.includes(user.email.toLowerCase());
  
  return c.json({ isAdmin, email: user.email });
});

// Get all products (admin)
app.get("/api/admin/products", adminMiddleware, async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT * FROM products ORDER BY created_at DESC"
  ).all();
  
  return c.json({ products: result.results || [] });
});

// Get single product with variants (admin)
app.get("/api/admin/products/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  
  const product = await c.env.DB.prepare(
    "SELECT * FROM products WHERE id = ?"
  ).bind(id).first();
  
  if (!product) {
    return c.json({ error: "Product not found" }, 404);
  }
  
  const variants = await c.env.DB.prepare(
    "SELECT * FROM product_variants WHERE product_id = ? ORDER BY id ASC"
  ).bind(id).all();
  
  return c.json({ product, variants: variants.results || [] });
});

// Create product (admin)
app.post("/api/admin/products", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const { name, description, base_price_cents, category, images, is_featured, is_active, variants } = body;
  
  if (!name || !base_price_cents || !category) {
    return c.json({ error: "Missing required fields: name, base_price_cents, category" }, 400);
  }
  
  const result = await c.env.DB.prepare(
    `INSERT INTO products (name, description, base_price_cents, category, images, is_featured, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    name,
    description || null,
    base_price_cents,
    category,
    images ? JSON.stringify(images) : null,
    is_featured ? 1 : 0,
    is_active !== false ? 1 : 0
  ).run();
  
  const productId = result.meta.last_row_id;
  
  // Create variants if provided
  if (variants && Array.isArray(variants) && variants.length > 0) {
    for (const variant of variants) {
      await c.env.DB.prepare(
        `INSERT INTO product_variants (product_id, name, size, color, color_hex, sku, price_cents, stock_quantity, is_available)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        productId,
        variant.name || null,
        variant.size || null,
        variant.color || null,
        variant.color_hex || null,
        variant.sku || null,
        variant.price_cents || null,
        variant.stock_quantity || 0,
        variant.is_available !== false ? 1 : 0
      ).run();
    }
  }
  
  return c.json({ success: true, productId }, 201);
});

// Update product (admin)
app.put("/api/admin/products/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { name, description, base_price_cents, category, images, is_featured, is_active } = body;
  
  const existing = await c.env.DB.prepare(
    "SELECT id FROM products WHERE id = ?"
  ).bind(id).first();
  
  if (!existing) {
    return c.json({ error: "Product not found" }, 404);
  }
  
  await c.env.DB.prepare(
    `UPDATE products SET 
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      base_price_cents = COALESCE(?, base_price_cents),
      category = COALESCE(?, category),
      images = COALESCE(?, images),
      is_featured = COALESCE(?, is_featured),
      is_active = COALESCE(?, is_active),
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(
    name || null,
    description || null,
    base_price_cents || null,
    category || null,
    images ? JSON.stringify(images) : null,
    is_featured !== undefined ? (is_featured ? 1 : 0) : null,
    is_active !== undefined ? (is_active ? 1 : 0) : null,
    id
  ).run();
  
  return c.json({ success: true });
});

// Delete product (admin)
app.delete("/api/admin/products/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  
  // Delete variants first
  await c.env.DB.prepare(
    "DELETE FROM product_variants WHERE product_id = ?"
  ).bind(id).run();
  
  // Delete product
  await c.env.DB.prepare(
    "DELETE FROM products WHERE id = ?"
  ).bind(id).run();
  
  return c.json({ success: true });
});

// ============ VARIANT ENDPOINTS (Admin) ============

// Add variant to product
app.post("/api/admin/products/:productId/variants", adminMiddleware, async (c) => {
  const productId = c.req.param("productId");
  const body = await c.req.json();
  const { name, size, color, color_hex, sku, price_cents, stock_quantity, is_available } = body;
  
  const result = await c.env.DB.prepare(
    `INSERT INTO product_variants (product_id, name, size, color, color_hex, sku, price_cents, stock_quantity, is_available)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    productId,
    name || null,
    size || null,
    color || null,
    color_hex || null,
    sku || null,
    price_cents || null,
    stock_quantity || 0,
    is_available !== false ? 1 : 0
  ).run();
  
  return c.json({ success: true, variantId: result.meta.last_row_id }, 201);
});

// Update variant
app.put("/api/admin/variants/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { name, size, color, color_hex, sku, price_cents, stock_quantity, is_available } = body;
  
  await c.env.DB.prepare(
    `UPDATE product_variants SET 
      name = COALESCE(?, name),
      size = COALESCE(?, size),
      color = COALESCE(?, color),
      color_hex = COALESCE(?, color_hex),
      sku = COALESCE(?, sku),
      price_cents = COALESCE(?, price_cents),
      stock_quantity = COALESCE(?, stock_quantity),
      is_available = COALESCE(?, is_available),
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(
    name || null,
    size || null,
    color || null,
    color_hex || null,
    sku || null,
    price_cents || null,
    stock_quantity || null,
    is_available !== undefined ? (is_available ? 1 : 0) : null,
    id
  ).run();
  
  return c.json({ success: true });
});

// Delete variant
app.delete("/api/admin/variants/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id");
  
  await c.env.DB.prepare(
    "DELETE FROM product_variants WHERE id = ?"
  ).bind(id).run();
  
  return c.json({ success: true });
});

// ============ PUBLIC PRODUCT ENDPOINTS ============

// Get active products (public storefront)
app.get("/api/products", async (c) => {
  const category = c.req.query("category");
  const featured = c.req.query("featured");
  
  let query = "SELECT * FROM products WHERE is_active = 1";
  const params: (string | number)[] = [];
  
  if (category && category !== "all") {
    query += " AND category = ?";
    params.push(category);
  }
  
  if (featured === "true") {
    query += " AND is_featured = 1";
  }
  
  query += " ORDER BY created_at DESC";
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ products: result.results || [] });
});

// Get single product with variants (public)
app.get("/api/products/:id", async (c) => {
  const id = c.req.param("id");
  
  const product = await c.env.DB.prepare(
    "SELECT * FROM products WHERE id = ? AND is_active = 1"
  ).bind(id).first();
  
  if (!product) {
    return c.json({ error: "Product not found" }, 404);
  }
  
  const variants = await c.env.DB.prepare(
    "SELECT * FROM product_variants WHERE product_id = ? AND is_available = 1 ORDER BY id ASC"
  ).bind(id).all();
  
  return c.json({ product, variants: variants.results || [] });
});

// ============ WISHLIST ENDPOINTS ============

// Get user's wishlist
app.get("/api/wishlist", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const result = await c.env.DB.prepare(
    "SELECT product_id FROM wishlists WHERE user_id = ? ORDER BY created_at DESC"
  ).bind(user.id).all();
  
  const productIds = (result.results || []).map((row) => row.product_id as string);
  
  return c.json({ productIds });
});

// Add product to wishlist
app.post("/api/wishlist/:productId", authMiddleware, async (c) => {
  const user = c.get("user");
  const productId = c.req.param("productId");
  
  try {
    await c.env.DB.prepare(
      "INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)"
    ).bind(user.id, productId).run();
    
    return c.json({ success: true });
  } catch (error: unknown) {
    // If it's a unique constraint error, the item is already in wishlist
    if (error instanceof Error && error.message.includes("UNIQUE constraint")) {
      return c.json({ success: true, message: "Already in wishlist" });
    }
    throw error;
  }
});

// Remove product from wishlist
app.delete("/api/wishlist/:productId", authMiddleware, async (c) => {
  const user = c.get("user");
  const productId = c.req.param("productId");
  
  await c.env.DB.prepare(
    "DELETE FROM wishlists WHERE user_id = ? AND product_id = ?"
  ).bind(user.id, productId).run();
  
  return c.json({ success: true });
});

// ============ PRICE ALERTS ENDPOINTS ============

// Get user's price alerts
app.get("/api/price-alerts", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const result = await c.env.DB.prepare(`
    SELECT pa.*, l.title, l.price_cents as current_price_cents, l.images, l.status
    FROM price_alerts pa
    JOIN listings l ON pa.listing_id = l.id
    WHERE pa.user_id = ?
    ORDER BY pa.created_at DESC
  `).bind(user.id).all();
  
  return c.json({ alerts: result.results || [] });
});

// Get alert for specific listing
app.get("/api/price-alerts/listing/:listingId", authMiddleware, async (c) => {
  const user = c.get("user");
  const listingId = c.req.param("listingId");
  
  const alert = await c.env.DB.prepare(`
    SELECT * FROM price_alerts 
    WHERE user_id = ? AND listing_id = ? AND is_active = 1
  `).bind(user.id, listingId).first();
  
  return c.json({ alert: alert || null });
});

// Create price alert
app.post("/api/price-alerts", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { listing_id, target_price_cents } = body;
  
  if (!listing_id || !target_price_cents) {
    return c.json({ error: "Missing listing_id or target_price_cents" }, 400);
  }
  
  // Check if listing exists
  const listing = await c.env.DB.prepare(
    "SELECT id, price_cents FROM listings WHERE id = ?"
  ).bind(listing_id).first();
  
  if (!listing) {
    return c.json({ error: "Listing not found" }, 404);
  }
  
  // Check if alert already exists for this listing
  const existingAlert = await c.env.DB.prepare(
    "SELECT id FROM price_alerts WHERE user_id = ? AND listing_id = ? AND is_active = 1"
  ).bind(user.id, listing_id).first();
  
  if (existingAlert) {
    // Update existing alert
    await c.env.DB.prepare(
      "UPDATE price_alerts SET target_price_cents = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(target_price_cents, existingAlert.id).run();
    
    return c.json({ success: true, updated: true });
  }
  
  // Create new alert
  await c.env.DB.prepare(`
    INSERT INTO price_alerts (user_id, listing_id, target_price_cents)
    VALUES (?, ?, ?)
  `).bind(user.id, listing_id, target_price_cents).run();
  
  return c.json({ success: true, created: true });
});

// Delete price alert
app.delete("/api/price-alerts/:alertId", authMiddleware, async (c) => {
  const user = c.get("user");
  const alertId = c.req.param("alertId");
  
  await c.env.DB.prepare(
    "DELETE FROM price_alerts WHERE id = ? AND user_id = ?"
  ).bind(alertId, user.id).run();
  
  return c.json({ success: true });
});

// Delete alert by listing ID
app.delete("/api/price-alerts/listing/:listingId", authMiddleware, async (c) => {
  const user = c.get("user");
  const listingId = c.req.param("listingId");
  
  await c.env.DB.prepare(
    "DELETE FROM price_alerts WHERE listing_id = ? AND user_id = ?"
  ).bind(listingId, user.id).run();
  
  return c.json({ success: true });
});

// Check triggered alerts (call this periodically or on listing update)
app.get("/api/price-alerts/check", authMiddleware, async (c) => {
  const user = c.get("user");
  
  // Find alerts where current price <= target price
  const triggered = await c.env.DB.prepare(`
    SELECT pa.*, l.title, l.price_cents as current_price_cents, l.images
    FROM price_alerts pa
    JOIN listings l ON pa.listing_id = l.id
    WHERE pa.user_id = ? 
    AND pa.is_active = 1
    AND l.price_cents <= pa.target_price_cents
    AND l.status = 'active'
  `).bind(user.id).all();
  
  return c.json({ triggered: triggered.results || [] });
});

// ============ LISTINGS ENDPOINTS ============

// Upload image to R2 (authenticated)
app.post("/api/upload", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  
  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }
  
  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" }, 400);
  }
  
  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return c.json({ error: "File too large. Maximum size: 5MB" }, 400);
  }
  
  // Generate unique key
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const extension = file.name.split(".").pop() || "jpg";
  const key = `listings/${user.id}/${timestamp}-${randomId}.${extension}`;
  
  // Upload to R2
  await c.env.R2_BUCKET.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
  });
  
  return c.json({ 
    success: true, 
    key,
    url: `/api/images/${key}`
  });
});

// Get image from R2 (public)
app.get("/api/images/*", async (c) => {
  const key = c.req.path.replace("/api/images/", "");
  
  const object = await c.env.R2_BUCKET.get(key);
  
  if (!object) {
    return c.json({ error: "Image not found" }, 404);
  }
  
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000");
  
  return new Response(object.body, { headers });
});

// Get all active listings (public)
app.get("/api/listings", async (c) => {
  const category = c.req.query("category");
  const search = c.req.query("search");
  const listingType = c.req.query("listing_type");
  const gamePlatform = c.req.query("game_platform");
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");
  
  let query = "SELECT * FROM listings WHERE status = 'active'";
  const params: (string | number)[] = [];
  
  if (listingType && listingType !== "all") {
    query += " AND listing_type = ?";
    params.push(listingType);
  }
  
  if (category && category !== "all") {
    query += " AND category = ?";
    params.push(category);
  }
  
  if (gamePlatform && gamePlatform !== "all") {
    query += " AND game_platform = ?";
    params.push(gamePlatform);
  }
  
  if (search) {
    query += " AND (title LIKE ? OR description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ 
    listings: result.results || [],
    hasMore: (result.results?.length || 0) === limit
  });
});

// Get single listing (public)
app.get("/api/listings/:id", async (c) => {
  const id = c.req.param("id");
  
  const result = await c.env.DB.prepare(
    "SELECT * FROM listings WHERE id = ?"
  ).bind(id).first();
  
  if (!result) {
    return c.json({ error: "Listing not found" }, 404);
  }
  
  return c.json({ listing: result });
});

// Get user's own listings (authenticated)
app.get("/api/my-listings", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const result = await c.env.DB.prepare(
    "SELECT * FROM listings WHERE user_id = ? ORDER BY created_at DESC"
  ).bind(user.id).all();
  
  return c.json({ listings: result.results || [] });
});

// Create new listing (authenticated)
app.post("/api/listings", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  
  const { 
    title, description, price_cents, category, condition, images, location,
    listing_type, game_platform, account_level, account_rank, account_server
  } = body;
  
  if (!title || !price_cents || !category || !condition) {
    return c.json({ error: "Missing required fields" }, 400);
  }
  
  // Validate account listings have required fields
  if (listing_type === "account" && !game_platform) {
    return c.json({ error: "Account listings require a game/platform" }, 400);
  }
  
  const result = await c.env.DB.prepare(
    `INSERT INTO listings (user_id, title, description, price_cents, category, condition, images, location, listing_type, game_platform, account_level, account_rank, account_server)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    user.id,
    title,
    description || null,
    price_cents,
    category,
    condition,
    images ? JSON.stringify(images) : null,
    location || null,
    listing_type || "item",
    game_platform || null,
    account_level || null,
    account_rank || null,
    account_server || null
  ).run();
  
  return c.json({ 
    success: true, 
    listingId: result.meta.last_row_id 
  }, 201);
});

// Update listing (authenticated, owner only)
app.put("/api/listings/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json();
  
  // Check ownership
  const existing = await c.env.DB.prepare(
    "SELECT user_id FROM listings WHERE id = ?"
  ).bind(id).first();
  
  if (!existing) {
    return c.json({ error: "Listing not found" }, 404);
  }
  
  if (existing.user_id !== user.id) {
    return c.json({ error: "Not authorized" }, 403);
  }
  
  const { 
    title, description, price_cents, category, condition, images, location, status,
    listing_type, game_platform, account_level, account_rank, account_server
  } = body;
  
  await c.env.DB.prepare(
    `UPDATE listings SET 
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      price_cents = COALESCE(?, price_cents),
      category = COALESCE(?, category),
      condition = COALESCE(?, condition),
      images = COALESCE(?, images),
      location = COALESCE(?, location),
      status = COALESCE(?, status),
      listing_type = COALESCE(?, listing_type),
      game_platform = COALESCE(?, game_platform),
      account_level = COALESCE(?, account_level),
      account_rank = COALESCE(?, account_rank),
      account_server = COALESCE(?, account_server),
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(
    title || null,
    description || null,
    price_cents || null,
    category || null,
    condition || null,
    images ? JSON.stringify(images) : null,
    location || null,
    status || null,
    listing_type || null,
    game_platform || null,
    account_level || null,
    account_rank || null,
    account_server || null,
    id
  ).run();
  
  return c.json({ success: true });
});

// Get seller profile with their listings (public)
app.get("/api/sellers/:userId", async (c) => {
  const userId = c.req.param("userId");
  
  // Get seller's active listings
  const listingsResult = await c.env.DB.prepare(
    "SELECT * FROM listings WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC"
  ).bind(userId).all();
  
  // Get listing stats
  const statsResult = await c.env.DB.prepare(
    `SELECT 
      COUNT(*) as total_listings,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active_listings,
      COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_listings,
      MIN(created_at) as member_since
     FROM listings WHERE user_id = ?`
  ).bind(userId).first();
  
  return c.json({ 
    sellerId: userId,
    listings: listingsResult.results || [],
    stats: {
      totalListings: statsResult?.total_listings || 0,
      activeListings: statsResult?.active_listings || 0,
      soldListings: statsResult?.sold_listings || 0,
      memberSince: statsResult?.member_since || null
    }
  });
});

// ============ MESSAGING ENDPOINTS ============

// Get user's conversations
app.get("/api/conversations", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const result = await c.env.DB.prepare(`
    SELECT 
      c.*,
      l.title as listing_title,
      l.images as listing_images,
      l.price_cents as listing_price,
      (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
      (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) as unread_count
    FROM conversations c
    JOIN listings l ON c.listing_id = l.id
    WHERE c.buyer_id = ? OR c.seller_id = ?
    ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
  `).bind(user.id, user.id, user.id).all();
  
  return c.json({ conversations: result.results || [] });
});

// Get or create conversation for a listing
app.post("/api/conversations", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { listing_id } = body;
  
  if (!listing_id) {
    return c.json({ error: "listing_id is required" }, 400);
  }
  
  // Get the listing to find the seller
  const listing = await c.env.DB.prepare(
    "SELECT user_id FROM listings WHERE id = ?"
  ).bind(listing_id).first();
  
  if (!listing) {
    return c.json({ error: "Listing not found" }, 404);
  }
  
  if (listing.user_id === user.id) {
    return c.json({ error: "Cannot message yourself" }, 400);
  }
  
  // Check if conversation already exists
  const existing = await c.env.DB.prepare(
    "SELECT id FROM conversations WHERE listing_id = ? AND buyer_id = ?"
  ).bind(listing_id, user.id).first();
  
  if (existing) {
    return c.json({ conversationId: existing.id });
  }
  
  // Create new conversation
  const result = await c.env.DB.prepare(
    "INSERT INTO conversations (listing_id, buyer_id, seller_id) VALUES (?, ?, ?)"
  ).bind(listing_id, user.id, listing.user_id).run();
  
  return c.json({ conversationId: result.meta.last_row_id }, 201);
});

// Get messages in a conversation
app.get("/api/conversations/:id/messages", authMiddleware, async (c) => {
  const user = c.get("user");
  const conversationId = c.req.param("id");
  
  // Verify user is part of conversation
  const conversation = await c.env.DB.prepare(
    "SELECT * FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)"
  ).bind(conversationId, user.id, user.id).first();
  
  if (!conversation) {
    return c.json({ error: "Conversation not found" }, 404);
  }
  
  // Get messages
  const messages = await c.env.DB.prepare(
    "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC"
  ).bind(conversationId).all();
  
  // Mark messages from other party as read
  await c.env.DB.prepare(
    "UPDATE messages SET is_read = 1, updated_at = CURRENT_TIMESTAMP WHERE conversation_id = ? AND sender_id != ?"
  ).bind(conversationId, user.id).run();
  
  // Get listing info
  const listing = await c.env.DB.prepare(
    "SELECT id, title, images, price_cents FROM listings WHERE id = ?"
  ).bind(conversation.listing_id).first();
  
  return c.json({ 
    conversation,
    listing,
    messages: messages.results || [] 
  });
});

// Send a message
app.post("/api/conversations/:id/messages", authMiddleware, async (c) => {
  const user = c.get("user");
  const conversationId = c.req.param("id");
  const body = await c.req.json();
  const { content } = body;
  
  if (!content || !content.trim()) {
    return c.json({ error: "Message content is required" }, 400);
  }
  
  // Verify user is part of conversation
  const conversation = await c.env.DB.prepare(
    "SELECT * FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)"
  ).bind(conversationId, user.id, user.id).first();
  
  if (!conversation) {
    return c.json({ error: "Conversation not found" }, 404);
  }
  
  // Insert message
  const result = await c.env.DB.prepare(
    "INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)"
  ).bind(conversationId, user.id, content.trim()).run();
  
  // Update conversation last_message_at
  await c.env.DB.prepare(
    "UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(conversationId).run();
  
  return c.json({ 
    success: true, 
    messageId: result.meta.last_row_id 
  }, 201);
});

// Get unread message count
app.get("/api/messages/unread-count", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const result = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE (c.buyer_id = ? OR c.seller_id = ?)
    AND m.sender_id != ?
    AND m.is_read = 0
  `).bind(user.id, user.id, user.id).first();
  
  return c.json({ count: result?.count || 0 });
});

// ============ RETRO INTELLIGENCE AI ENDPOINTS ============

// AI Chatbot - Retro Intelligence Assistant
app.post("/api/ai/chat", async (c) => {
  if (!c.env.GEMINI_API_KEY) {
    return c.json({ error: "AI service not configured" }, 500);
  }
  
  const body = await c.req.json();
  const { message, history } = body;
  
  if (!message) {
    return c.json({ error: "Message is required" }, 400);
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });
    
    const systemPrompt = `You are "Retro Intelligence", the AI assistant for retromynd - a geek culture e-commerce store.

CRITICAL RULES:
1. LANGUAGE: Always respond in the user's language (Portuguese, English, Spanish, etc.)
2. BE CONCISE: Max 2-3 short sentences per response. No fluff. Direct answers only.
3. DATES: Only give dates you're 100% certain about. If unsure, say "não tenho certeza da data exata" instead of guessing.
4. Use 1-2 emojis max per response.

VERIFIED GAMING FACTS:
- Nintendo: Famicom 1983, NES 1985, SNES 1990, N64 1996, GameCube 2001, Wii 2006, Wii U 2012, Switch 2017
- PlayStation: PS1 1994, PS2 2000, PS3 2006, PS4 2013, PS5 2020
- Xbox: Original 2001, 360 2005, One 2013, Series X/S 2020
- Game Boy 1989, GBA 2001, DS 2004, 3DS 2011
- Zelda: Ocarina of Time 1998, Majora's Mask 2000, Wind Waker 2002, Twilight Princess 2006, Skyward Sword 2011, BOTW 2017, TOTK 2023
- Mario: Super Mario Bros 1985, SMB3 1988, Super Mario World 1990, SM64 1996, Sunshine 2002, Galaxy 2007, Odyssey 2017
- Pokemon: Red/Blue 1996 (JP), 1998 (US), Gold/Silver 1999, Ruby/Sapphire 2002, Diamond/Pearl 2006, X/Y 2013, Sun/Moon 2016, Sword/Shield 2019, Scarlet/Violet 2022
- Final Fantasy: FF1 1987, FF6 1994, FF7 1997, FF8 1999, FF9 2000, FF10 2001, FF15 2016, FF16 2023
- Sonic: Sonic 1 1991, Sonic 2 1992, Sonic 3 1994, Adventure 1998, Adventure 2 2001
- Dark Souls 2011, DS2 2014, DS3 2016, Elden Ring 2022, Bloodborne 2015, Sekiro 2019
- GTA: GTA3 2001, Vice City 2002, San Andreas 2004, GTA4 2008, GTA5 2013
- Minecraft 2011, Fortnite 2017, Among Us 2018 (viral 2020)
- League of Legends 2009, Valorant 2020, CS:GO 2012, CS2 2023
- Genshin Impact 2020, Honkai Star Rail 2023

VERIFIED ANIME/MANGA FACTS:
- Dragon Ball: manga 1984, anime 1986, DBZ 1989-1996, GT 1996-1997, Super 2015
- Naruto: manga 1999, anime 2002-2007, Shippuden 2007-2017, Boruto 2017
- One Piece: manga 1997, anime 1999, ainda em publicação
- Bleach: manga 2001-2016, anime 2004-2012, TYBW 2022
- Attack on Titan: manga 2009-2021, anime 2013-2023
- Demon Slayer: manga 2016-2020, anime 2019
- My Hero Academia: manga 2014, anime 2016
- Jujutsu Kaisen: manga 2018, anime 2020
- Chainsaw Man: manga 2018, anime 2022
- Death Note: manga 2003-2006, anime 2006-2007
- Fullmetal Alchemist: manga 2001-2010, Brotherhood 2009-2010
- Hunter x Hunter: manga 1998, anime 2011
- Evangelion: anime 1995-1996, End of Eva 1997, Rebuilds 2007-2021
- Studio Ghibli: Nausicaä 1984, Totoro 1988, Kiki 1989, Mononoke 1997, Spirited Away 2001, Howl 2004
- Akira 1988, Ghost in the Shell 1995, Cowboy Bebop 1998

VERIFIED MOVIES/TV:
- Star Wars: IV 1977, V 1980, VI 1983, I 1999, II 2002, III 2005, VII 2015, VIII 2017, IX 2019
- MCU: Iron Man 2008, Avengers 2012, Endgame 2019, No Way Home 2021
- LOTR: Fellowship 2001, Two Towers 2002, Return 2003
- Matrix 1999, Reloaded/Revolutions 2003, Resurrections 2021
- Back to the Future 1985, BTTF2 1989, BTTF3 1990
- Jurassic Park 1993, Terminator 1984, T2 1991
- Stranger Things 2016, The Witcher 2019, The Last of Us 2023

SITE FEATURES (be brief):
- Loja: produtos geek, wishlist (coração), categorias
- Marketplace (/marketplace): compra/venda de contas de jogos e itens
- Vender: /marketplace/sell
- Login: Google (/login)
- Configurações: idioma e tema no header

RESPONSE STYLE:
- Responda em 1-3 frases curtas
- Vá direto ao ponto
- Se não souber algo, diga honestamente
- Não invente datas ou fatos`;

    const chatHistory = (history || []).map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));
    
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        thinkingConfig: { thinkingBudget: 0 }
      },
      history: chatHistory
    });
    
    const response = await chat.sendMessage({ message });
    
    return c.json({ 
      success: true, 
      response: response.text 
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return c.json({ error: "Failed to process message" }, 500);
  }
});

// AI: Generate product description
app.post("/api/ai/generate-description", async (c) => {
  if (!c.env.GEMINI_API_KEY) {
    return c.json({ error: "AI service not configured" }, 500);
  }
  
  const body = await c.req.json();
  const { title, category, condition, listingType, gamePlatform, accountLevel, accountRank } = body;
  
  if (!title) {
    return c.json({ error: "Title is required" }, 400);
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });
    
    let prompt = "";
    
    if (listingType === "account") {
      const platform = gamePlatform || "game";
      prompt = `Write a compelling marketplace listing description for a ${platform} game account.

Title: ${title}
Platform: ${platform}
${accountLevel ? `Level/AR: ${accountLevel}` : ""}
${accountRank ? `Rank: ${accountRank}` : ""}
${condition ? `Access Type: ${condition}` : ""}

Create an engaging description that:
- Highlights the account's value and achievements
- Mentions what buyers can expect
- Is honest and trustworthy
- Uses a friendly, geek-culture tone
- Is 2-3 sentences max
- Does NOT include placeholder text like [insert X here]

Write only the description, no quotes or extra formatting.`;
    } else {
      prompt = `Write a compelling marketplace listing description for a physical item.

Title: ${title}
Category: ${category || "General"}
Condition: ${condition || "Good"}

Create an engaging description that:
- Highlights the item's features and appeal
- Is perfect for geek culture enthusiasts
- Uses a friendly, nostalgic tone
- Is 2-3 sentences max
- Does NOT include placeholder text like [insert X here]

Write only the description, no quotes or extra formatting.`;
    }
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    
    return c.json({ 
      success: true, 
      description: response.text?.trim() || ""
    });
  } catch (error) {
    console.error("AI description error:", error);
    return c.json({ error: "Failed to generate description" }, 500);
  }
});

// AI: Extract product from URL using Firecrawl
app.post("/api/ai/extract-product", async (c) => {
  if (!c.env.FIRECRAWL_API_KEY) {
    return c.json({ error: "Firecrawl não configurado. Adicione FIRECRAWL_API_KEY nas configurações." }, 500);
  }
  
  const body = await c.req.json();
  const { url } = body;
  
  if (!url) {
    return c.json({ error: "URL é obrigatória" }, 400);
  }
  
  try {
    const firecrawl = new Firecrawl({ apiKey: c.env.FIRECRAWL_API_KEY });
    
    // Scrape the product page with structured extraction
    const result = await firecrawl.scrape(url, {
      formats: [
        "markdown",
        {
          type: "json",
          prompt: `Extract product information from this e-commerce page. Focus on the main product being sold. 
          
For prices: 
- Extract the CURRENT/SALE price (not original price)
- Convert to number without currency symbols
- If multiple prices shown, use the lowest one that's the actual sale price

For images:
- Find ALL product images in the carousel/gallery
- Include main image and all thumbnail/variant images
- Use full resolution URLs when possible
- Extract at least 3-5 images if available`,
          schema: {
            type: "object",
            properties: {
              name: { 
                type: "string",
                description: "Product title/name"
              },
              description: { 
                type: "string",
                description: "Full product description"
              },
              price: { 
                type: "number",
                description: "Current selling price as a number (no currency symbols)"
              },
              originalPrice: {
                type: "number",
                description: "Original price before discount, if any"
              },
              currency: {
                type: "string",
                description: "Currency code (USD, BRL, EUR, CNY)"
              },
              images: { 
                type: "array",
                items: { type: "string" },
                description: "Array of ALL product image URLs from the gallery/carousel"
              },
              category: {
                type: "string",
                description: "Product category"
              },
              variants: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    value: { type: "string" },
                    price: { type: "number" }
                  }
                },
                description: "Product variants (colors, sizes, etc)"
              },
              specifications: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    key: { type: "string" },
                    value: { type: "string" }
                  }
                },
                description: "Technical specifications"
              },
              seller: {
                type: "string",
                description: "Seller/store name"
              },
              rating: {
                type: "number",
                description: "Product rating (0-5)"
              },
              reviewCount: {
                type: "number",
                description: "Number of reviews"
              },
              inStock: {
                type: "boolean",
                description: "Whether product is in stock"
              },
              sku: {
                type: "string",
                description: "Product SKU or ID"
              }
            },
            required: ["name", "price", "images"]
          }
        }
      ],
      onlyMainContent: true,
      waitFor: 3000, // Wait for JS to load images
      timeout: 45000
    });

    // Get the extracted JSON data
    const productData = (result as any).json || {};
    
    // Convert price to cents (BRL)
    let costCents = 0;
    if (productData.price) {
      // If currency is CNY (Chinese Yuan), convert to BRL
      // Approximate rate: 1 CNY ≈ 0.70 BRL
      const price = parseFloat(String(productData.price)) || 0;
      if (productData.currency === "CNY" || url.includes("aliexpress") || url.includes("cjdropshipping")) {
        costCents = Math.round(price * 0.70 * 100);
      } else if (productData.currency === "USD") {
        // 1 USD ≈ 5.00 BRL
        costCents = Math.round(price * 5.00 * 100);
      } else {
        // Assume BRL or convert directly
        costCents = Math.round(price * 100);
      }
    }
    
    // Clean up images - filter valid URLs and remove duplicates
    let images: string[] = [];
    if (Array.isArray(productData.images)) {
      const filtered = productData.images
        .filter((img: any) => typeof img === "string" && img.startsWith("http"))
        .map((img: string) => img.split("?")[0].replace(/_\d+x\d+\./g, "."));
      images = Array.from(new Set<string>(filtered));
    }
    
    // If no images found in JSON, try to extract from markdown
    if (images.length === 0 && (result as any).markdown) {
      const mdImages = ((result as any).markdown as string).match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/g) || [];
      const extracted = mdImages
        .map((m: string) => m.match(/\((https?:\/\/[^\s)]+)\)/)?.[1])
        .filter((url: string | undefined): url is string => !!url);
      images = Array.from(new Set<string>(extracted));
    }
    
    // Extract external ID from URL
    let externalId = "";
    const idMatch = url.match(/item\/(\d+)|product\/(\d+)|pid=(\d+)|id=(\d+)/i);
    if (idMatch) {
      externalId = idMatch[1] || idMatch[2] || idMatch[3] || idMatch[4] || "";
    }
    
    // Build variants array
    const variants: { name: string; sku: string; stock: number }[] = [];
    if (Array.isArray(productData.variants)) {
      productData.variants.forEach((v: any, i: number) => {
        variants.push({
          name: v.name || v.value || `Variant ${i + 1}`,
          sku: `VAR-${externalId || Date.now()}-${i}`,
          stock: 99
        });
      });
    }
    
    return c.json({
      success: true,
      name: productData.name || "Produto Importado",
      description: productData.description || "",
      category: productData.category || "",
      cost_cents: costCents,
      images: images,
      external_url: url,
      external_id: externalId || `EXT-${Date.now()}`,
      variants: variants,
      specifications: productData.specifications || [],
      seller: productData.seller || "",
      rating: productData.rating || 0,
      reviewCount: productData.reviewCount || 0,
      inStock: productData.inStock !== false,
      originalPrice: productData.originalPrice,
      currency: productData.currency || "BRL"
    });
  } catch (error: any) {
    console.error("Firecrawl extract error:", error);
    return c.json({ 
      error: `Falha ao extrair produto: ${error.message || "Erro desconhecido"}` 
    }, 500);
  }
});

// AI: Image search - analyze image and return search keywords
app.post("/api/ai/image-search", async (c) => {
  if (!c.env.GEMINI_API_KEY) {
    return c.json({ error: "AI service not configured" }, 500);
  }
  
  const body = await c.req.json();
  const { imageBase64, imageUrl } = body;
  
  if (!imageBase64 && !imageUrl) {
    return c.json({ error: "Image is required (base64 or URL)" }, 400);
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });
    
    const prompt = `You are a product search assistant for a geek culture marketplace (gaming, collectibles, retro tech, comics, etc).

Analyze this image and identify what product(s) it shows. Then provide:
1. A short search query (2-5 words) that would find this or similar products
2. The most relevant category from: gaming, collectibles, retro, comics, electronics, other
3. For game accounts: identify the game/platform if visible (genshin, lol, valorant, csgo, fortnite, minecraft, roblox, playstation, xbox, nintendo, steam, epic)

Respond in JSON format only:
{
  "searchQuery": "...",
  "category": "...",
  "gamePlatform": "..." or null,
  "isGameAccount": true/false,
  "confidence": "high" | "medium" | "low",
  "description": "Brief description of what you see"
}`;

    let contents: any[];
    
    if (imageBase64) {
      // Remove data URL prefix if present
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      contents = [
        { text: prompt },
        { inlineData: { mimeType: "image/jpeg", data: base64Data } }
      ];
    } else {
      contents = [
        { text: prompt },
        { fileData: { fileUri: imageUrl, mimeType: "image/jpeg" } }
      ];
    }
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    
    const responseText = response.text?.trim() || "";
    
    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return c.json({ 
        success: true,
        ...result
      });
    }
    
    return c.json({ error: "Could not analyze image" }, 500);
  } catch (error) {
    console.error("AI image search error:", error);
    return c.json({ error: "Failed to analyze image" }, 500);
  }
});

// AI: Smart pricing suggestions
app.post("/api/ai/smart-pricing", async (c) => {
  if (!c.env.GEMINI_API_KEY) {
    return c.json({ error: "AI service not configured" }, 500);
  }
  
  const body = await c.req.json();
  const { title, category, condition, listingType, gamePlatform, accountLevel, accountRank } = body;
  
  if (!title) {
    return c.json({ error: "Title is required" }, 400);
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });
    
    let prompt = "";
    
    if (listingType === "account") {
      const platform = gamePlatform || "game";
      prompt = `You are a marketplace pricing expert for game accounts. Analyze this listing and suggest a fair market price in USD.

Title: ${title}
Platform: ${platform}
${accountLevel ? `Level/AR: ${accountLevel}` : ""}
${accountRank ? `Rank: ${accountRank}` : ""}
${condition ? `Access Type: ${condition}` : ""}

Consider:
- Account progression and rarity of items
- Time investment to achieve this level
- Current market trends for ${platform} accounts
- Risk factors (account security, transferability)

Respond in JSON format only:
{
  "suggestedPrice": <number in cents>,
  "minPrice": <minimum reasonable price in cents>,
  "maxPrice": <maximum reasonable price in cents>,
  "confidence": "high" | "medium" | "low",
  "reasoning": "<brief 1-2 sentence explanation>"
}`;
    } else {
      prompt = `You are a marketplace pricing expert for geek culture items. Analyze this listing and suggest a fair market price in USD.

Title: ${title}
Category: ${category || "General"}
Condition: ${condition || "Good"}

Consider:
- Item rarity and collectibility
- Condition impact on value
- Current market demand for similar items
- Typical resale values in geek culture marketplaces

Respond in JSON format only:
{
  "suggestedPrice": <number in cents>,
  "minPrice": <minimum reasonable price in cents>,
  "maxPrice": <maximum reasonable price in cents>,
  "confidence": "high" | "medium" | "low",
  "reasoning": "<brief 1-2 sentence explanation>"
}`;
    }
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    
    const responseText = response.text?.trim() || "";
    
    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return c.json({ 
        success: true,
        ...result
      });
    }
    
    return c.json({ error: "Could not generate pricing suggestion" }, 500);
  } catch (error) {
    console.error("AI pricing error:", error);
    return c.json({ error: "Failed to generate pricing suggestion" }, 500);
  }
});

// AI: Automatic game account valuation
app.post("/api/ai/account-valuation", async (c) => {
  if (!c.env.GEMINI_API_KEY) {
    return c.json({ error: "AI service not configured" }, 500);
  }
  
  const body = await c.req.json();
  const { gamePlatform, accountLevel, accountRank, accountServer, features } = body;
  
  if (!gamePlatform) {
    return c.json({ error: "Game platform is required" }, 400);
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });
    
    const prompt = `You are an expert game account appraiser for a marketplace. Analyze this game account and provide a detailed valuation.

Game/Platform: ${gamePlatform}
${accountLevel ? `Level/Adventure Rank: ${accountLevel}` : ""}
${accountRank ? `Competitive Rank: ${accountRank}` : ""}
${accountServer ? `Server/Region: ${accountServer}` : ""}
${features ? `Additional Features: ${features}` : ""}

Based on current market conditions for ${gamePlatform} accounts, provide:

1. ESTIMATED VALUE: A fair market price range in USD
2. VALUE FACTORS: What makes this account valuable or less valuable
3. MARKET DEMAND: Current demand level for this type of account
4. RISK ASSESSMENT: Potential concerns for buyers
5. RECOMMENDATIONS: How to maximize value when selling

Respond in JSON format only:
{
  "estimatedValue": {
    "low": <number in USD>,
    "mid": <number in USD>,
    "high": <number in USD>
  },
  "marketDemand": "high" | "medium" | "low",
  "confidence": "high" | "medium" | "low",
  "valueFactors": {
    "positive": ["<factor 1>", "<factor 2>"],
    "negative": ["<factor 1>"]
  },
  "riskLevel": "low" | "medium" | "high",
  "riskFactors": ["<risk 1>", "<risk 2>"],
  "recommendations": ["<tip 1>", "<tip 2>"],
  "summary": "<2-3 sentence market analysis>"
}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    
    const responseText = response.text?.trim() || "";
    
    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return c.json({ 
        success: true,
        valuation: result
      });
    }
    
    return c.json({ error: "Could not generate account valuation" }, 500);
  } catch (error) {
    console.error("AI valuation error:", error);
    return c.json({ error: "Failed to generate account valuation" }, 500);
  }
});

// AI: Fraud detection for account screenshots
app.post("/api/ai/fraud-detection", async (c) => {
  if (!c.env.GEMINI_API_KEY) {
    return c.json({ error: "AI service not configured" }, 500);
  }
  
  const body = await c.req.json();
  const { imageUrl, gamePlatform } = body;
  
  if (!imageUrl) {
    return c.json({ error: "Image URL is required" }, 400);
  }
  
  try {
    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return c.json({ error: "Could not fetch image" }, 400);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
    
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    
    const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });
    
    const prompt = `You are an expert fraud detection specialist for a game account marketplace. Analyze this screenshot and look for signs of manipulation, editing, or fraud.

${gamePlatform ? `This is supposedly a screenshot from: ${gamePlatform}` : ""}

Carefully examine the image for:
1. EDITING ARTIFACTS: Signs of Photoshop/editing (blur inconsistencies, clone stamp patterns, misaligned pixels, unnatural edges, compression artifacts around text/numbers)
2. FONT INCONSISTENCIES: Text that doesn't match the game's official UI fonts, spacing issues, wrong colors
3. UI MISMATCHES: Elements that don't match the actual game interface, wrong icons, outdated UI versions
4. SUSPICIOUS NUMBERS: Stats that seem impossibly high, currency amounts with wrong formatting
5. WATERMARKS: Other seller watermarks, website URLs, or marketplace logos that might indicate stolen images
6. SCREENSHOT QUALITY: Signs this might be a photo of a screen (moire patterns), or screenshot of another screenshot
7. INSPECT ELEMENT: Signs of browser developer tools being used to modify displayed values
8. DATE/TIME ISSUES: Timestamps that seem wrong or inconsistent

Respond ONLY with a JSON object (no markdown, no code blocks):
{
  "riskScore": <number 0-100, where 0=definitely legitimate, 100=definitely fraudulent>,
  "riskLevel": "<low|medium|high|critical>",
  "isLikelyAuthentic": <boolean>,
  "findings": [
    {
      "type": "<category of issue>",
      "severity": "<low|medium|high>",
      "description": "<what was found>",
      "location": "<where in image, if applicable>"
    }
  ],
  "authenticityIndicators": ["<list of things that suggest the image is real>"],
  "redFlags": ["<list of specific concerns>"],
  "recommendation": "<brief advice for the buyer>",
  "summary": "<2-3 sentence overall assessment>"
}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: prompt },
        {
          inlineData: {
            mimeType: contentType,
            data: base64Image
          }
        }
      ],
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    
    const responseText = response.text?.trim() || "";
    
    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return c.json({ 
        success: true,
        analysis: result
      });
    }
    
    return c.json({ error: "Could not analyze image" }, 500);
  } catch (error) {
    console.error("AI fraud detection error:", error);
    return c.json({ error: "Failed to analyze image" }, 500);
  }
});

// AI: Rarity checker
app.post("/api/ai/rarity-check", async (c) => {
  if (!c.env.GEMINI_API_KEY) {
    return c.json({ error: "AI service not configured" }, 500);
  }
  
  const body = await c.req.json();
  const { title, description, category, condition, gamePlatform, listingType, accountLevel, accountRank } = body;
  
  if (!title) {
    return c.json({ error: "Title is required" }, 400);
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });
    
    const isAccount = listingType === "account";
    
    const prompt = `You are an expert appraiser specializing in ${isAccount ? "game accounts" : "geek culture collectibles and merchandise"}. Analyze this listing and assess its rarity and collectibility.

Title: ${title}
${description ? `Description: ${description}` : ""}
${category ? `Category: ${category}` : ""}
${condition ? `Condition: ${condition}` : ""}
${isAccount && gamePlatform ? `Game/Platform: ${gamePlatform}` : ""}
${isAccount && accountLevel ? `Level: ${accountLevel}` : ""}
${isAccount && accountRank ? `Rank: ${accountRank}` : ""}

Assess:
${isAccount ? `
1. Account achievement rarity (top % of players)
2. Exclusive/limited items (skins, characters, items that are no longer obtainable)
3. Time investment to achieve this level
4. Competitive rank rarity
5. In-game currency/resources value
` : `
1. Production scarcity (limited editions, discontinued items)
2. Age and historical significance
3. Condition impact on collectibility
4. Brand/franchise popularity and demand
5. Special features (signatures, variants, first editions)
`}

Respond ONLY with a JSON object:
{
  "rarityScore": <number 1-100, where 100 is extremely rare>,
  "rarityTier": "<common|uncommon|rare|epic|legendary>",
  "estimatedScarcity": "<how many similar items exist, e.g. 'Top 1% of players' or 'Fewer than 10,000 produced'>",
  "rarityFactors": [
    {
      "factor": "<what makes it rare/common>",
      "impact": "<positive|negative>",
      "explanation": "<brief explanation>"
    }
  ],
  "collectibilityScore": <number 1-100>,
  "demandLevel": "<low|medium|high|very-high>",
  "investmentPotential": "<poor|fair|good|excellent>",
  "comparables": ["<similar items and their typical rarity/value>"],
  "authenticityTips": ["<what to verify to confirm rarity claims>"],
  "summary": "<2-3 sentence assessment of rarity and collectibility>"
}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    
    const responseText = response.text?.trim() || "";
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return c.json({ 
        success: true,
        analysis: result
      });
    }
    
    return c.json({ error: "Could not analyze rarity" }, 500);
  } catch (error) {
    console.error("AI rarity check error:", error);
    return c.json({ error: "Failed to check rarity" }, 500);
  }
});

// Delete listing (authenticated, owner only)
app.delete("/api/listings/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  
  // Check ownership
  const existing = await c.env.DB.prepare(
    "SELECT user_id FROM listings WHERE id = ?"
  ).bind(id).first();
  
  if (!existing) {
    return c.json({ error: "Listing not found" }, 404);
  }
  
  if (existing.user_id !== user.id) {
    return c.json({ error: "Not authorized" }, 403);
  }
  
  await c.env.DB.prepare(
    "DELETE FROM listings WHERE id = ?"
  ).bind(id).run();
  
  return c.json({ success: true });
});

// Chat Translator - translate messages in real-time
app.post("/api/ai/translate", async (c) => {
  try {
    const apiKey = c.env.GEMINI_API_KEY;
    if (!apiKey) {
      return c.json({ error: "AI service not configured" }, 500);
    }

    const { text, targetLanguage, sourceLanguage } = await c.req.json();
    
    if (!text || !targetLanguage) {
      return c.json({ error: "Text and target language are required" }, 400);
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const languageNames: Record<string, string> = {
      "en": "English",
      "es": "Spanish",
      "fr": "French",
      "de": "German",
      "ja": "Japanese",
      "pt-BR": "Brazilian Portuguese",
      "zh": "Chinese (Simplified)",
      "ko": "Korean",
      "it": "Italian",
      "ru": "Russian",
      "ar": "Arabic"
    };

    const targetLangName = languageNames[targetLanguage] || targetLanguage;
    const sourceLangHint = sourceLanguage ? `The source language is ${languageNames[sourceLanguage] || sourceLanguage}.` : "Auto-detect the source language.";

    const prompt = `You are a professional translator. Translate the following text to ${targetLangName}. ${sourceLangHint}

IMPORTANT RULES:
1. Preserve the tone and intent of the original message (casual, formal, friendly, etc.)
2. Keep any emojis, slang, or internet expressions but adapt them appropriately for the target language
3. If the text contains product names, brand names, or proper nouns, keep them unchanged
4. Return ONLY the translated text, nothing else - no explanations, no quotes, no labels

Text to translate:
${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
    });

    const translatedText = response.text?.trim() || "";
    
    // Detect source language
    const detectPrompt = `What language is this text written in? Reply with ONLY the language code (en, es, fr, de, ja, pt-BR, zh, ko, it, ru, ar, or other). Text: "${text.substring(0, 100)}"`;
    
    const detectResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: detectPrompt,
    });
    
    const detectedLanguage = detectResponse.text?.trim().toLowerCase() || "unknown";

    return c.json({
      translatedText,
      sourceLanguage: sourceLanguage || detectedLanguage,
      targetLanguage,
      originalText: text
    });
  } catch (error) {
    console.error("Translation error:", error);
    return c.json({ error: "Translation failed" }, 500);
  }
});

// ============ DROPSHIPPING SUPPLIERS ============

// Get all suppliers (admin only)
app.get("/api/admin/suppliers", adminMiddleware, async (c) => {
  const suppliers = await c.env.DB.prepare(
    "SELECT * FROM suppliers ORDER BY created_at DESC"
  ).all();
  return c.json(suppliers.results || []);
});

// Get single supplier
app.get("/api/admin/suppliers/:id", adminMiddleware, async (c) => {
  const { id } = c.req.param();
  const supplier = await c.env.DB.prepare(
    "SELECT * FROM suppliers WHERE id = ?"
  ).bind(id).first();
  if (!supplier) {
    return c.json({ error: "Supplier not found" }, 404);
  }
  return c.json(supplier);
});

// Create supplier
app.post("/api/admin/suppliers", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const { name, type, api_key, api_secret, base_url, default_margin_percent, shipping_days_min, shipping_days_max, settings } = body;
  
  if (!name || !type) {
    return c.json({ error: "Name and type are required" }, 400);
  }
  
  const result = await c.env.DB.prepare(
    `INSERT INTO suppliers (name, type, api_key, api_secret, base_url, default_margin_percent, shipping_days_min, shipping_days_max, settings)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    name, type, api_key || null, api_secret || null, base_url || null,
    default_margin_percent || 30, shipping_days_min || 7, shipping_days_max || 21,
    settings ? JSON.stringify(settings) : null
  ).run();
  
  return c.json({ success: true, id: result.meta.last_row_id });
});

// Update supplier
app.put("/api/admin/suppliers/:id", adminMiddleware, async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const { name, type, api_key, api_secret, base_url, default_margin_percent, shipping_days_min, shipping_days_max, is_active, settings } = body;
  
  await c.env.DB.prepare(
    `UPDATE suppliers SET name = ?, type = ?, api_key = ?, api_secret = ?, base_url = ?,
     default_margin_percent = ?, shipping_days_min = ?, shipping_days_max = ?, is_active = ?, settings = ?,
     updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(
    name, type, api_key || null, api_secret || null, base_url || null,
    default_margin_percent || 30, shipping_days_min || 7, shipping_days_max || 21,
    is_active ? 1 : 0, settings ? JSON.stringify(settings) : null, id
  ).run();
  
  return c.json({ success: true });
});

// Delete supplier
app.delete("/api/admin/suppliers/:id", adminMiddleware, async (c) => {
  const { id } = c.req.param();
  await c.env.DB.prepare("DELETE FROM suppliers WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// ============ DROPSHIP PRODUCTS ============

// Get all dropship products (public - for store)
app.get("/api/dropship/products", async (c) => {
  const category = c.req.query("category");
  const search = c.req.query("search");
  const supplier_id = c.req.query("supplier_id");
  
  let query = "SELECT dp.*, s.name as supplier_name FROM dropship_products dp JOIN suppliers s ON dp.supplier_id = s.id WHERE dp.is_active = 1 AND s.is_active = 1";
  const params: (string | number)[] = [];
  
  if (category) {
    query += " AND dp.category = ?";
    params.push(category);
  }
  if (search) {
    query += " AND (dp.name LIKE ? OR dp.description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  if (supplier_id) {
    query += " AND dp.supplier_id = ?";
    params.push(supplier_id);
  }
  
  query += " ORDER BY dp.created_at DESC";
  
  const stmt = c.env.DB.prepare(query);
  const products = await (params.length > 0 ? stmt.bind(...params) : stmt).all();
  return c.json(products.results || []);
});

// Get single product
app.get("/api/dropship/products/:id", async (c) => {
  const { id } = c.req.param();
  const product = await c.env.DB.prepare(
    `SELECT dp.*, s.name as supplier_name, s.shipping_days_min, s.shipping_days_max 
     FROM dropship_products dp JOIN suppliers s ON dp.supplier_id = s.id WHERE dp.id = ?`
  ).bind(id).first();
  if (!product) {
    return c.json({ error: "Product not found" }, 404);
  }
  return c.json(product);
});

// Admin: Create dropship product
app.post("/api/admin/dropship/products", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const { supplier_id, external_id, name, description, category, cost_cents, margin_percent, images, variants, stock_quantity, external_url } = body;
  
  if (!supplier_id || !name || !cost_cents) {
    return c.json({ error: "supplier_id, name, and cost_cents are required" }, 400);
  }
  
  // Get supplier default margin if not provided
  let finalMargin = margin_percent;
  if (finalMargin === undefined) {
    const supplier = await c.env.DB.prepare("SELECT default_margin_percent FROM suppliers WHERE id = ?").bind(supplier_id).first() as { default_margin_percent: number } | null;
    finalMargin = supplier?.default_margin_percent || 30;
  }
  
  const price_cents = Math.round(cost_cents * (1 + finalMargin / 100));
  
  const result = await c.env.DB.prepare(
    `INSERT INTO dropship_products (supplier_id, external_id, name, description, category, cost_cents, price_cents, margin_percent, images, variants, stock_quantity, external_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    supplier_id, external_id || null, name, description || null, category || null,
    cost_cents, price_cents, finalMargin, images ? JSON.stringify(images) : null,
    variants ? JSON.stringify(variants) : null, stock_quantity || 0, external_url || null
  ).run();
  
  return c.json({ success: true, id: result.meta.last_row_id, price_cents });
});

// Admin: Update dropship product
app.put("/api/admin/dropship/products/:id", adminMiddleware, async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const { name, description, category, cost_cents, margin_percent, images, variants, stock_quantity, is_active, external_url } = body;
  
  const price_cents = Math.round(cost_cents * (1 + (margin_percent || 30) / 100));
  
  await c.env.DB.prepare(
    `UPDATE dropship_products SET name = ?, description = ?, category = ?, cost_cents = ?, price_cents = ?,
     margin_percent = ?, images = ?, variants = ?, stock_quantity = ?, is_active = ?, external_url = ?,
     updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(
    name, description || null, category || null, cost_cents, price_cents,
    margin_percent || 30, images ? JSON.stringify(images) : null,
    variants ? JSON.stringify(variants) : null, stock_quantity || 0,
    is_active ? 1 : 0, external_url || null, id
  ).run();
  
  return c.json({ success: true, price_cents });
});

// Admin: Delete dropship product
app.delete("/api/admin/dropship/products/:id", adminMiddleware, async (c) => {
  const { id } = c.req.param();
  await c.env.DB.prepare("DELETE FROM dropship_products WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Admin: Get all dropship products
app.get("/api/admin/dropship/products", adminMiddleware, async (c) => {
  const products = await c.env.DB.prepare(
    `SELECT dp.*, s.name as supplier_name FROM dropship_products dp 
     LEFT JOIN suppliers s ON dp.supplier_id = s.id ORDER BY dp.created_at DESC`
  ).all();
  return c.json(products.results || []);
});

// ============== ORDER ROUTING SYSTEM ==============

// Create order (with automatic supplier routing)
app.post("/api/orders", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { items, shipping } = body;
  
  if (!items || items.length === 0) {
    return c.json({ error: "No items in order" }, 400);
  }
  
  // Fetch product details and calculate totals
  let subtotalCents = 0;
  let totalCostCents = 0;
  const orderItems: Array<{
    product_id: number;
    supplier_id: number;
    quantity: number;
    unit_price_cents: number;
    unit_cost_cents: number;
    variant_info: string | null;
  }> = [];
  
  for (const item of items) {
    const product = await c.env.DB.prepare(
      "SELECT id, supplier_id, price_cents, cost_cents FROM dropship_products WHERE id = ? AND is_active = 1"
    ).bind(item.product_id).first() as { id: number; supplier_id: number; price_cents: number; cost_cents: number } | null;
    
    if (!product) {
      return c.json({ error: `Product ${item.product_id} not found or unavailable` }, 400);
    }
    
    const qty = item.quantity || 1;
    subtotalCents += product.price_cents * qty;
    totalCostCents += product.cost_cents * qty;
    
    orderItems.push({
      product_id: product.id,
      supplier_id: product.supplier_id,
      quantity: qty,
      unit_price_cents: product.price_cents,
      unit_cost_cents: product.cost_cents,
      variant_info: item.variant_info ? JSON.stringify(item.variant_info) : null
    });
  }
  
  const shippingCents = 0; // Can be calculated based on supplier
  const totalCents = subtotalCents + shippingCents;
  const profitCents = subtotalCents - totalCostCents;
  
  // Create order
  const orderResult = await c.env.DB.prepare(
    `INSERT INTO orders (user_id, status, subtotal_cents, shipping_cents, total_cents, profit_cents,
     shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    user.id, "pending", subtotalCents, shippingCents, totalCents, profitCents,
    shipping?.name || null, shipping?.address || null, shipping?.city || null,
    shipping?.state || null, shipping?.zip || null, shipping?.country || null
  ).run();
  
  const orderId = orderResult.meta.last_row_id;
  
  // Insert order items
  for (const item of orderItems) {
    await c.env.DB.prepare(
      `INSERT INTO order_items (order_id, product_id, supplier_id, quantity, unit_price_cents, unit_cost_cents, variant_info, supplier_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(orderId, item.product_id, item.supplier_id, item.quantity, item.unit_price_cents, item.unit_cost_cents, item.variant_info, "pending");
  }
  
  return c.json({ success: true, orderId, totalCents, profitCents }, 201);
});

// Get user's orders
app.get("/api/orders", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const orders = await c.env.DB.prepare(
    "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC"
  ).bind(user.id).all();
  
  const ordersWithItems = await Promise.all(
    (orders.results || []).map(async (order: Record<string, unknown>) => {
      const items = await c.env.DB.prepare(
        `SELECT oi.*, dp.name as product_name, dp.images, s.name as supplier_name
         FROM order_items oi
         LEFT JOIN dropship_products dp ON oi.product_id = dp.id
         LEFT JOIN suppliers s ON oi.supplier_id = s.id
         WHERE oi.order_id = ?`
      ).bind(order.id).all();
      return { ...order, items: items.results || [] };
    })
  );
  
  return c.json(ordersWithItems);
});

// Get single order
app.get("/api/orders/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const { id } = c.req.param();
  
  const order = await c.env.DB.prepare(
    "SELECT * FROM orders WHERE id = ? AND user_id = ?"
  ).bind(id, user.id).first();
  
  if (!order) {
    return c.json({ error: "Order not found" }, 404);
  }
  
  const items = await c.env.DB.prepare(
    `SELECT oi.*, dp.name as product_name, dp.images, s.name as supplier_name
     FROM order_items oi
     LEFT JOIN dropship_products dp ON oi.product_id = dp.id
     LEFT JOIN suppliers s ON oi.supplier_id = s.id
     WHERE oi.order_id = ?`
  ).bind(id).all();
  
  return c.json({ ...order, items: items.results || [] });
});

// Admin: Get all orders
app.get("/api/admin/orders", adminMiddleware, async (c) => {
  const status = c.req.query("status");
  
  let query = "SELECT * FROM orders";
  const params: string[] = [];
  
  if (status) {
    query += " WHERE status = ?";
    params.push(status);
  }
  query += " ORDER BY created_at DESC";
  
  const orders = await c.env.DB.prepare(query).bind(...params).all();
  
  const ordersWithItems = await Promise.all(
    (orders.results || []).map(async (order: Record<string, unknown>) => {
      const items = await c.env.DB.prepare(
        `SELECT oi.*, dp.name as product_name, dp.images, s.name as supplier_name
         FROM order_items oi
         LEFT JOIN dropship_products dp ON oi.product_id = dp.id
         LEFT JOIN suppliers s ON oi.supplier_id = s.id
         WHERE oi.order_id = ?`
      ).bind(order.id).all();
      return { ...order, items: items.results || [] };
    })
  );
  
  return c.json(ordersWithItems);
});

// Admin: Get orders grouped by supplier
app.get("/api/admin/orders/by-supplier", adminMiddleware, async (c) => {
  const suppliers = await c.env.DB.prepare(
    "SELECT id, name, type FROM suppliers WHERE is_active = 1 ORDER BY name"
  ).all();
  
  const supplierOrders = await Promise.all(
    (suppliers.results || []).map(async (supplier: Record<string, unknown>) => {
      const items = await c.env.DB.prepare(
        `SELECT oi.*, o.id as order_id, o.user_id, o.status as order_status, o.shipping_name, 
         o.shipping_address, o.shipping_city, o.shipping_state, o.shipping_zip, o.shipping_country,
         dp.name as product_name, dp.images, dp.external_id, dp.external_url
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         LEFT JOIN dropship_products dp ON oi.product_id = dp.id
         WHERE oi.supplier_id = ? AND oi.supplier_status != 'delivered'
         ORDER BY o.created_at DESC`
      ).bind(supplier.id).all();
      
      return {
        ...supplier,
        items: items.results || [],
        pendingCount: (items.results || []).filter((i: Record<string, unknown>) => i.supplier_status === "pending").length,
        processingCount: (items.results || []).filter((i: Record<string, unknown>) => i.supplier_status === "processing").length,
        shippedCount: (items.results || []).filter((i: Record<string, unknown>) => i.supplier_status === "shipped").length
      };
    })
  );
  
  return c.json(supplierOrders);
});

// Admin: Update order item status/tracking
app.put("/api/admin/orders/:orderId/item/:itemId", adminMiddleware, async (c) => {
  const { orderId, itemId } = c.req.param();
  const body = await c.req.json();
  const { supplier_status, supplier_order_id, tracking_number, tracking_url } = body;
  
  const item = await c.env.DB.prepare(
    "SELECT * FROM order_items WHERE id = ? AND order_id = ?"
  ).bind(itemId, orderId).first();
  
  if (!item) {
    return c.json({ error: "Order item not found" }, 404);
  }
  
  await c.env.DB.prepare(
    `UPDATE order_items SET supplier_status = ?, supplier_order_id = ?, tracking_number = ?, tracking_url = ?,
     updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(supplier_status || item.supplier_status, supplier_order_id || item.supplier_order_id, 
    tracking_number || item.tracking_number, tracking_url || item.tracking_url, itemId).run();
  
  // Check if all items are delivered to update order status
  const allItems = await c.env.DB.prepare(
    "SELECT supplier_status FROM order_items WHERE order_id = ?"
  ).bind(orderId).all();
  
  const allDelivered = (allItems.results || []).every((i: Record<string, unknown>) => i.supplier_status === "delivered");
  const anyShipped = (allItems.results || []).some((i: Record<string, unknown>) => i.supplier_status === "shipped" || i.supplier_status === "delivered");
  
  let newOrderStatus = "pending";
  if (allDelivered) newOrderStatus = "delivered";
  else if (anyShipped) newOrderStatus = "shipped";
  else if ((allItems.results || []).some((i: Record<string, unknown>) => i.supplier_status === "processing")) newOrderStatus = "processing";
  
  await c.env.DB.prepare(
    "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(newOrderStatus, orderId).run();
  
  return c.json({ success: true, orderStatus: newOrderStatus });
});

// Admin: Update full order status
app.put("/api/admin/orders/:id", adminMiddleware, async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const { status } = body;
  
  await c.env.DB.prepare(
    "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(status, id).run();
  
  return c.json({ success: true });
});

// Admin: Profit Dashboard (#26)
app.get("/api/admin/profit-dashboard", adminMiddleware, async (c) => {
  // Summary stats
  const summaryResult = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_orders,
      SUM(CASE WHEN status = 'completed' OR status = 'shipped' OR status = 'processing' THEN 1 ELSE 0 END) as successful_orders,
      SUM(CASE WHEN status = 'completed' OR status = 'shipped' OR status = 'processing' THEN total_cents ELSE 0 END) as total_revenue,
      SUM(CASE WHEN status = 'completed' OR status = 'shipped' OR status = 'processing' THEN profit_cents ELSE 0 END) as total_profit,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders
    FROM orders
  `).first();
  
  // Orders by day (last 30 days)
  const dailyStats = await c.env.DB.prepare(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as orders,
      SUM(total_cents) as revenue,
      SUM(profit_cents) as profit
    FROM orders
    WHERE created_at >= DATE('now', '-30 days')
      AND (status = 'completed' OR status = 'shipped' OR status = 'processing')
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `).all();
  
  // Profit by supplier
  const supplierStats = await c.env.DB.prepare(`
    SELECT 
      s.id,
      s.name,
      s.type,
      COUNT(DISTINCT o.id) as order_count,
      SUM(oi.quantity) as items_sold,
      SUM(oi.price_cents * oi.quantity) as revenue,
      SUM((oi.price_cents - oi.cost_cents) * oi.quantity) as profit
    FROM suppliers s
    LEFT JOIN order_items oi ON oi.supplier_id = s.id
    LEFT JOIN orders o ON o.id = oi.order_id AND (o.status = 'completed' OR o.status = 'shipped' OR o.status = 'processing')
    GROUP BY s.id
    ORDER BY profit DESC
  `).all();
  
  // Top products by profit
  const topProducts = await c.env.DB.prepare(`
    SELECT 
      dp.id,
      dp.name,
      dp.supplier_id,
      s.name as supplier_name,
      dp.cost_cents,
      dp.price_cents,
      (dp.price_cents - dp.cost_cents) as margin_cents,
      ROUND((dp.price_cents - dp.cost_cents) * 100.0 / dp.price_cents, 1) as margin_percent,
      COALESCE(SUM(oi.quantity), 0) as total_sold,
      COALESCE(SUM((oi.price_cents - oi.cost_cents) * oi.quantity), 0) as total_profit
    FROM dropship_products dp
    JOIN suppliers s ON s.id = dp.supplier_id
    LEFT JOIN order_items oi ON oi.product_id = dp.id
    LEFT JOIN orders o ON o.id = oi.order_id AND (o.status = 'completed' OR o.status = 'shipped' OR o.status = 'processing')
    GROUP BY dp.id
    ORDER BY total_profit DESC
    LIMIT 20
  `).all();
  
  // Margin distribution
  const marginDistribution = await c.env.DB.prepare(`
    SELECT 
      CASE 
        WHEN margin_percent < 10 THEN '0-10%'
        WHEN margin_percent < 20 THEN '10-20%'
        WHEN margin_percent < 30 THEN '20-30%'
        WHEN margin_percent < 50 THEN '30-50%'
        ELSE '50%+'
      END as margin_range,
      COUNT(*) as product_count
    FROM (
      SELECT ROUND((price_cents - cost_cents) * 100.0 / price_cents, 1) as margin_percent
      FROM dropship_products
      WHERE price_cents > 0
    )
    GROUP BY margin_range
    ORDER BY margin_range
  `).all();
  
  return c.json({
    summary: {
      totalOrders: summaryResult?.total_orders || 0,
      successfulOrders: summaryResult?.successful_orders || 0,
      pendingOrders: summaryResult?.pending_orders || 0,
      cancelledOrders: summaryResult?.cancelled_orders || 0,
      totalRevenue: summaryResult?.total_revenue || 0,
      totalProfit: summaryResult?.total_profit || 0,
      avgMargin: summaryResult?.total_revenue ? Math.round((summaryResult.total_profit as number) * 100 / (summaryResult.total_revenue as number)) : 0
    },
    dailyStats: dailyStats.results,
    supplierStats: supplierStats.results,
    topProducts: topProducts.results,
    marginDistribution: marginDistribution.results
  });
});

// AI: Market Trends (#11)
app.post("/api/ai/market-trends", async (c) => {
  const apiKey = c.env.GEMINI_API_KEY;
  if (!apiKey) return c.json({ error: "AI not configured" }, 500);

  const { category, gamePlatform } = await c.req.json();
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a market analyst for a geek culture marketplace. Analyze market trends for ${category || "all categories"}${gamePlatform ? ` specifically for ${gamePlatform}` : ""}.

Return JSON with:
- trendingItems: array of {name, category, priceChange (percentage), demandLevel (high/medium/low)}
- marketInsights: array of short insight strings
- hotCategories: array of category names trending up
- priceDirection: "up", "down", or "stable"
- seasonalFactors: relevant seasonal influences
- recommendation: brief advice for buyers/sellers

Respond ONLY with valid JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  const text = response.text?.replace(/```json\n?|\n?```/g, "").trim() || "{}";

  try {
    return c.json(JSON.parse(text));
  } catch {
    return c.json({ error: "Failed to parse trends" }, 500);
  }
});

// AI: Price Comparison (#12)
app.post("/api/ai/price-comparison", async (c) => {
  const apiKey = c.env.GEMINI_API_KEY;
  if (!apiKey) return c.json({ error: "AI not configured" }, 500);

  const { itemName, category, currentPrice, condition } = await c.req.json();
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a price comparison expert for geek/gaming items. Analyze pricing for: "${itemName}" (${category}, condition: ${condition || "unspecified"}, listed at $${(currentPrice / 100).toFixed(2)}).

Return JSON with:
- priceVerdict: "great_deal", "fair_price", "overpriced", or "needs_research"
- marketRange: {low, average, high} in cents
- confidenceScore: 0-100
- comparables: array of {name, price (cents), source (e.g. "eBay", "Amazon", "GameStop")}
- savings: potential savings in cents if overpriced
- recommendation: brief advice

Respond ONLY with valid JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  const text = response.text?.replace(/```json\n?|\n?```/g, "").trim() || "{}";

  try {
    return c.json(JSON.parse(text));
  } catch {
    return c.json({ error: "Failed to compare prices" }, 500);
  }
});

// AI: Negotiation Assistant (#13)
app.post("/api/ai/negotiation", async (c) => {
  const apiKey = c.env.GEMINI_API_KEY;
  if (!apiKey) return c.json({ error: "AI not configured" }, 500);

  const { itemName, askingPrice, yourBudget, itemCondition, marketDemand } = await c.req.json();
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a negotiation coach for a geek marketplace. Help negotiate for: "${itemName}" asking $${(askingPrice / 100).toFixed(2)}, buyer budget: $${(yourBudget / 100).toFixed(2)}.
Condition: ${itemCondition || "unknown"}, Market demand: ${marketDemand || "unknown"}.

Return JSON with:
- suggestedOffer: initial offer in cents
- counterOffers: array of escalating offers [{amount (cents), reasoning}]
- negotiationTips: array of tip strings
- leveragePoints: things to mention that help your position
- walkAwayPrice: max you should pay in cents
- successLikelihood: percentage chance of success
- openingMessage: suggested first message to seller

Respond ONLY with valid JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  const text = response.text?.replace(/```json\n?|\n?```/g, "").trim() || "{}";

  try {
    return c.json(JSON.parse(text));
  } catch {
    return c.json({ error: "Failed to generate negotiation advice" }, 500);
  }
});

// AI: Reputation Analysis (#14)
app.post("/api/ai/reputation-analysis", async (c) => {
  const apiKey = c.env.GEMINI_API_KEY;
  if (!apiKey) return c.json({ error: "AI not configured" }, 500);

  const { sellerName, reviews, transactionCount, accountAge } = await c.req.json();
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Analyze seller reputation for "${sellerName}":
- Reviews: ${JSON.stringify(reviews || [])}
- Transaction count: ${transactionCount || "unknown"}
- Account age: ${accountAge || "unknown"}

Return JSON with:
- trustScore: 0-100
- trustLevel: "highly_trusted", "trusted", "neutral", "caution", "avoid"
- positiveIndicators: array of good signs
- redFlags: array of concerns
- reviewSummary: brief summary of review sentiment
- recommendation: should buyer proceed?
- suggestedPrecautions: safety tips for this seller

Respond ONLY with valid JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  const text = response.text?.replace(/```json\n?|\n?```/g, "").trim() || "{}";

  try {
    return c.json(JSON.parse(text));
  } catch {
    return c.json({ error: "Failed to analyze reputation" }, 500);
  }
});

// AI: Tag Suggestions (#15)
app.post("/api/ai/tag-suggestions", async (c) => {
  const apiKey = c.env.GEMINI_API_KEY;
  if (!apiKey) return c.json({ error: "AI not configured" }, 500);

  const { title, description, category, gamePlatform } = await c.req.json();
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Suggest optimal tags for this marketplace listing:
Title: "${title}"
Description: "${description || ""}"
Category: ${category || "general"}
Game/Platform: ${gamePlatform || "none"}

Return JSON with:
- primaryTags: array of 5 most important tags
- secondaryTags: array of 5 additional relevant tags
- trendingTags: array of currently popular tags that apply
- searchTerms: common search terms buyers might use
- seoScore: 0-100 rating of listing searchability
- improvementTips: how to make listing more discoverable

Respond ONLY with valid JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  const text = response.text?.replace(/```json\n?|\n?```/g, "").trim() || "{}";

  try {
    return c.json(JSON.parse(text));
  } catch {
    return c.json({ error: "Failed to generate tags" }, 500);
  }
});

// AI: Collection Builder (#16)
app.post("/api/ai/collection-builder", async (c) => {
  const apiKey = c.env.GEMINI_API_KEY;
  if (!apiKey) return c.json({ error: "AI not configured" }, 500);

  const { ownedItems, category, interests } = await c.req.json();
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a collection advisor for geek culture items. User owns: ${JSON.stringify(ownedItems || [])}.
Category focus: ${category || "general"}
Interests: ${interests || "gaming, collectibles"}

Return JSON with:
- collectionName: suggested name for their collection
- completionPercentage: estimated collection completeness
- missingEssentials: array of {name, estimatedPrice (cents), priority (high/medium/low), reason}
- rareFinds: items that would make collection special
- upcomingReleases: new items to watch for
- collectionValue: {current, potential} in cents
- nextSteps: prioritized list of what to acquire next

Respond ONLY with valid JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  const text = response.text?.replace(/```json\n?|\n?```/g, "").trim() || "{}";

  try {
    return c.json(JSON.parse(text));
  } catch {
    return c.json({ error: "Failed to build collection" }, 500);
  }
});

// AI: Trade Matcher (#17)
app.post("/api/ai/trade-matcher", async (c) => {
  const apiKey = c.env.GEMINI_API_KEY;
  if (!apiKey) return c.json({ error: "AI not configured" }, 500);

  const { haveItems, wantItems, flexibleOn } = await c.req.json();
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a trade advisor for a geek marketplace.
User has: ${JSON.stringify(haveItems || [])}
User wants: ${JSON.stringify(wantItems || [])}
Flexible on: ${flexibleOn || "open to suggestions"}

Return JSON with:
- fairTrades: array of {give, receive, fairnessScore (0-100)}
- tradeValue: estimated value of user's tradeable items in cents
- demandAnalysis: which of their items are most tradeable
- suggestedWants: items similar to their wants that might be easier to trade for
- tradeTips: advice for successful trades
- marketingMessage: suggested post to find trade partners

Respond ONLY with valid JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  const text = response.text?.replace(/```json\n?|\n?```/g, "").trim() || "{}";

  try {
    return c.json(JSON.parse(text));
  } catch {
    return c.json({ error: "Failed to find trade matches" }, 500);
  }
});

// AI: Value Prediction (#18)
app.post("/api/ai/value-prediction", async (c) => {
  const apiKey = c.env.GEMINI_API_KEY;
  if (!apiKey) return c.json({ error: "AI not configured" }, 500);

  const { itemName, category, currentPrice, condition, rarity } = await c.req.json();
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Predict future value for: "${itemName}" (${category})
Current price: $${((currentPrice || 0) / 100).toFixed(2)}
Condition: ${condition || "unknown"}
Rarity: ${rarity || "unknown"}

Return JSON with:
- prediction6Months: {value (cents), confidence (0-100), trend ("up"/"down"/"stable")}
- prediction1Year: {value (cents), confidence (0-100), trend}
- prediction5Years: {value (cents), confidence (0-100), trend}
- appreciationFactors: why it might increase in value
- depreciationRisks: why it might decrease
- investmentRating: "strong_buy", "buy", "hold", "sell", "strong_sell"
- comparableAppreciations: similar items that increased in value
- recommendation: investment advice

Respond ONLY with valid JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  const text = response.text?.replace(/```json\n?|\n?```/g, "").trim() || "{}";

  try {
    return c.json(JSON.parse(text));
  } catch {
    return c.json({ error: "Failed to predict value" }, 500);
  }
});

// AI Shop Filter Assistant
app.post("/api/ai/shop-filter", async (c) => {
  const apiKey = c.env.GEMINI_API_KEY;
  if (!apiKey) return c.json({ error: "AI not configured" }, 500);

  const { query } = await c.req.json();
  if (!query) return c.json({ error: "Query required" }, 400);

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a shop filter assistant for a geek/retro culture store (gaming, collectibles, retro tech, comics, anime).
User query: "${query}"

Parse this query and suggest filters. Return JSON with:
{
  "query": "${query}",
  "filters": {
    "category": (one of: "gaming", "collectibles", "retroTech", "comics", "music" or null),
    "priceRange": { "min": number, "max": number } or null,
    "keywords": ["array", "of", "search", "terms"] or []
  },
  "explanation": "Brief explanation in the same language as the query of what filters were applied and why"
}

Examples:
- "retro games under $50" → category: "gaming", priceRange: {min: 0, max: 50}, keywords: ["retro"]
- "collectible figurines" → category: "collectibles", keywords: ["figurines"]
- "cheap comics" → category: "comics", priceRange: {min: 0, max: 25}, keywords: []

Respond ONLY with valid JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  const text = response.text?.replace(/```json\n?|\n?```/g, "").trim() || "{}";

  try {
    const suggestion = JSON.parse(text);
    return c.json({ success: true, suggestion });
  } catch {
    return c.json({ success: true, suggestion: { query, filters: {}, explanation: "Could not parse filters" } });
  }
});

// ============ STRIPE CHECKOUT ============

// Create checkout session for an order
app.post("/api/checkout", authMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!c.env.STRIPE_SECRET_KEY) {
    return c.json({ error: "Stripe not configured" }, 500);
  }
  
  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
  const body = await c.req.json();
  const { items, shipping } = body;
  
  if (!items || items.length === 0) {
    return c.json({ error: "No items in order" }, 400);
  }
  
  // Fetch product details and build line items
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  let subtotalCents = 0;
  let totalCostCents = 0;
  const orderItemsData: Array<{
    product_id: number;
    supplier_id: number;
    quantity: number;
    unit_price_cents: number;
    unit_cost_cents: number;
    variant_info: string | null;
    name: string;
  }> = [];
  
  for (const item of items) {
    const product = await c.env.DB.prepare(
      "SELECT id, supplier_id, name, price_cents, cost_cents FROM dropship_products WHERE id = ? AND is_active = 1"
    ).bind(item.product_id).first() as { id: number; supplier_id: number; name: string; price_cents: number; cost_cents: number } | null;
    
    if (!product) {
      return c.json({ error: `Product ${item.product_id} not found or unavailable` }, 400);
    }
    
    const qty = item.quantity || 1;
    subtotalCents += product.price_cents * qty;
    totalCostCents += product.cost_cents * qty;
    
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: product.name },
        unit_amount: product.price_cents,
      },
      quantity: qty,
    });
    
    orderItemsData.push({
      product_id: product.id,
      supplier_id: product.supplier_id,
      quantity: qty,
      unit_price_cents: product.price_cents,
      unit_cost_cents: product.cost_cents,
      variant_info: item.variant_info ? JSON.stringify(item.variant_info) : null,
      name: product.name,
    });
  }
  
  const shippingCents = 0;
  const totalCents = subtotalCents + shippingCents;
  const profitCents = subtotalCents - totalCostCents;
  
  // Create pending order first
  const orderResult = await c.env.DB.prepare(
    `INSERT INTO orders (user_id, status, subtotal_cents, shipping_cents, total_cents, profit_cents,
     shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    user.id, "pending_payment", subtotalCents, shippingCents, totalCents, profitCents,
    shipping?.name || null, shipping?.address || null, shipping?.city || null,
    shipping?.state || null, shipping?.zip || null, shipping?.country || null
  ).run();
  
  const orderId = orderResult.meta.last_row_id;
  
  // Insert order items
  for (const item of orderItemsData) {
    await c.env.DB.prepare(
      `INSERT INTO order_items (order_id, product_id, supplier_id, quantity, unit_price_cents, unit_cost_cents, variant_info, supplier_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(orderId, item.product_id, item.supplier_id, item.quantity, item.unit_price_cents, item.unit_cost_cents, item.variant_info, "pending");
  }
  
  // Get base URL for success/cancel redirects
  const origin = new URL(c.req.url).origin;
  
  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${origin}/checkout/success?order_id=${orderId}`,
    cancel_url: `${origin}/checkout/cancel?order_id=${orderId}`,
    metadata: {
      orderId: String(orderId),
      userId: user.id,
    },
  });
  
  return c.json({ url: session.url, orderId });
});

// ============ ARCADE & BADGES SYSTEM ============

// Badge definitions (placed before webhook so it can be referenced)
const BADGES = [
  { id: "bronze", name: "Bronze Gamer", requirement: 5000, tickets: 10, tier: 1 },
  { id: "silver", name: "Silver Gamer", requirement: 15000, tickets: 30, tier: 2 },
  { id: "gold", name: "Gold Gamer", requirement: 30000, tickets: 75, tier: 3 },
  { id: "platinum", name: "Platinum Master", requirement: 50000, tickets: 150, tier: 4 },
  { id: "diamond", name: "Diamond Legend", requirement: 100000, tickets: 350, tier: 5 },
];

// Helper function to check and award badges for a user
async function checkAndAwardBadges(db: D1Database, userId: string): Promise<{ awarded: typeof BADGES; ticketsEarned: number }> {
  // Get total spent
  const spentResult = await db.prepare(`
    SELECT COALESCE(SUM(total_cents), 0) as total_spent
    FROM orders 
    WHERE user_id = ? AND status IN ('paid', 'processing', 'shipped', 'completed', 'delivered')
  `).bind(userId).first() as { total_spent: number } | null;
  
  const totalSpentCents = spentResult?.total_spent || 0;
  
  // Get already earned badges
  const existingBadges = await db.prepare(
    "SELECT badge_id FROM user_badges WHERE user_id = ?"
  ).bind(userId).all();
  const earnedIds = (existingBadges.results || []).map((b: Record<string, unknown>) => b.badge_id);
  
  // Find new badges to award
  const newBadges: typeof BADGES = [];
  let totalNewTickets = 0;
  
  for (const badge of BADGES) {
    if (!earnedIds.includes(badge.id) && totalSpentCents >= badge.requirement) {
      // Award badge
      await db.prepare(
        `INSERT INTO user_badges (user_id, badge_id, total_spent_at_earn, tickets_awarded)
         VALUES (?, ?, ?, ?)`
      ).bind(userId, badge.id, totalSpentCents, badge.tickets).run();
      
      // Record ticket transaction
      await db.prepare(
        `INSERT INTO ticket_transactions (user_id, amount, transaction_type, description, reference_id)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(userId, badge.tickets, "badge_reward", `Earned ${badge.name} badge`, badge.id).run();
      
      totalNewTickets += badge.tickets;
      newBadges.push(badge);
    }
  }
  
  // Update user's arcade stats if they earned any tickets
  if (totalNewTickets > 0) {
    // Check if stats record exists
    const statsCheck = await db.prepare(
      "SELECT id FROM user_arcade_stats WHERE user_id = ?"
    ).bind(userId).first();
    
    if (statsCheck) {
      await db.prepare(
        `UPDATE user_arcade_stats 
         SET total_tickets = total_tickets + ?, total_purchase_amount = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = ?`
      ).bind(totalNewTickets, totalSpentCents, userId).run();
    } else {
      await db.prepare(
        "INSERT INTO user_arcade_stats (user_id, total_tickets, total_purchase_amount) VALUES (?, ?, ?)"
      ).bind(userId, totalNewTickets, totalSpentCents).run();
    }
  }
  
  return { awarded: newBadges, ticketsEarned: totalNewTickets };
}

// Stripe webhook handler
app.post("/api/webhooks/stripe", async (c) => {
  if (!c.env.STRIPE_SECRET_KEY || !c.env.STRIPE_WEBHOOK_SECRET) {
    return c.json({ error: "Stripe not configured" }, 500);
  }
  
  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
  const body = await c.req.text();
  const sig = c.req.header("stripe-signature") || "";
  
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, c.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return c.text("Invalid signature", 400);
  }
  
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    const userId = session.metadata?.userId;
    
    if (orderId) {
      // Update order status to paid
      await c.env.DB.prepare(
        "UPDATE orders SET status = ?, stripe_payment_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind("paid", session.payment_intent as string, orderId).run();
      
      // Update order items to processing
      await c.env.DB.prepare(
        "UPDATE order_items SET supplier_status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?"
      ).bind("processing", orderId).run();
      
      // Check and award badges after successful payment
      if (userId) {
        const badgeResult = await checkAndAwardBadges(c.env.DB, userId);
        if (badgeResult.awarded.length > 0) {
          console.log(`Awarded ${badgeResult.awarded.length} badges to user ${userId}: ${badgeResult.awarded.map(b => b.name).join(", ")}`);
        }
      }
    }
  }
  
  return c.text("ok", 200);
});

// Get all badge definitions
app.get("/api/badges", async (c) => {
  return c.json({ badges: BADGES });
});

// Get user's arcade stats (badges, tickets, etc)
app.get("/api/arcade/stats", authMiddleware, async (c) => {
  const user = c.get("user");
  
  // Get or create user arcade stats
  let stats = await c.env.DB.prepare(
    "SELECT * FROM user_arcade_stats WHERE user_id = ?"
  ).bind(user.id).first();
  
  if (!stats) {
    // Create initial stats record
    await c.env.DB.prepare(
      "INSERT INTO user_arcade_stats (user_id) VALUES (?)"
    ).bind(user.id).run();
    stats = { total_tickets: 0, tickets_spent: 0, total_purchase_amount: 0, games_played: 0, high_scores: null };
  }
  
  // Get user's earned badges
  const badges = await c.env.DB.prepare(
    "SELECT * FROM user_badges WHERE user_id = ? ORDER BY earned_at ASC"
  ).bind(user.id).all();
  
  // Calculate total spent from successful orders
  const spentResult = await c.env.DB.prepare(`
    SELECT COALESCE(SUM(total_cents), 0) as total_spent
    FROM orders 
    WHERE user_id = ? AND status IN ('paid', 'processing', 'shipped', 'completed', 'delivered')
  `).bind(user.id).first() as { total_spent: number } | null;
  
  const totalSpentCents = spentResult?.total_spent || 0;
  
  // Update stats with current total
  await c.env.DB.prepare(
    "UPDATE user_arcade_stats SET total_purchase_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
  ).bind(totalSpentCents, user.id).run();
  
  // Calculate next badge progress
  const earnedBadgeIds = (badges.results || []).map((b: Record<string, unknown>) => b.badge_id);
  const nextBadge = BADGES.find(b => !earnedBadgeIds.includes(b.id));
  
  const availableTickets = (stats.total_tickets as number || 0) - (stats.tickets_spent as number || 0);
  
  return c.json({
    stats: {
      totalTickets: stats.total_tickets || 0,
      ticketsSpent: stats.tickets_spent || 0,
      availableTickets,
      totalPurchaseAmount: totalSpentCents,
      gamesPlayed: stats.games_played || 0,
      highScores: stats.high_scores ? JSON.parse(stats.high_scores as string) : {}
    },
    badges: badges.results || [],
    earnedBadgeIds,
    nextBadge: nextBadge ? {
      ...nextBadge,
      progress: Math.min(100, Math.round((totalSpentCents / nextBadge.requirement) * 100)),
      remaining: Math.max(0, nextBadge.requirement - totalSpentCents)
    } : null,
    allBadges: BADGES.map(b => ({
      ...b,
      earned: earnedBadgeIds.includes(b.id),
      progress: Math.min(100, Math.round((totalSpentCents / b.requirement) * 100))
    }))
  });
});

// Check and award badges based on purchase history
app.post("/api/arcade/check-badges", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const result = await checkAndAwardBadges(c.env.DB, user.id);
  
  // Get current total spent for response
  const spentResult = await c.env.DB.prepare(`
    SELECT COALESCE(SUM(total_cents), 0) as total_spent
    FROM orders 
    WHERE user_id = ? AND status IN ('paid', 'processing', 'shipped', 'completed', 'delivered')
  `).bind(user.id).first() as { total_spent: number } | null;
  
  return c.json({
    awarded: result.awarded,
    ticketsEarned: result.ticketsEarned,
    totalSpent: spentResult?.total_spent || 0
  });
});

// Get user's ticket transaction history
app.get("/api/arcade/transactions", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const transactions = await c.env.DB.prepare(
    "SELECT * FROM ticket_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50"
  ).bind(user.id).all();
  
  return c.json({ transactions: transactions.results || [] });
});

// Record game play (update stats)
app.post("/api/arcade/play", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { gameId, score } = body;
  
  if (!gameId) {
    return c.json({ error: "gameId is required" }, 400);
  }
  
  // Get current stats
  let stats = await c.env.DB.prepare(
    "SELECT * FROM user_arcade_stats WHERE user_id = ?"
  ).bind(user.id).first();
  
  if (!stats) {
    await c.env.DB.prepare(
      "INSERT INTO user_arcade_stats (user_id, games_played, high_scores) VALUES (?, 1, ?)"
    ).bind(user.id, JSON.stringify({ [gameId]: score || 0 })).run();
    return c.json({ success: true, gamesPlayed: 1, isHighScore: true });
  }
  
  const highScores = stats.high_scores ? JSON.parse(stats.high_scores as string) : {};
  const isHighScore = !highScores[gameId] || (score && score > highScores[gameId]);
  
  if (isHighScore && score) {
    highScores[gameId] = score;
  }
  
  await c.env.DB.prepare(
    `UPDATE user_arcade_stats 
     SET games_played = games_played + 1, high_scores = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE user_id = ?`
  ).bind(JSON.stringify(highScores), user.id).run();
  
  return c.json({ 
    success: true, 
    gamesPlayed: (stats.games_played as number || 0) + 1,
    isHighScore,
    highScore: highScores[gameId] || score || 0
  });
});

// Cancel unpaid order
app.post("/api/orders/:id/cancel", authMiddleware, async (c) => {
  const user = c.get("user");
  const orderId = c.req.param("id");
  
  const order = await c.env.DB.prepare(
    "SELECT * FROM orders WHERE id = ? AND user_id = ?"
  ).bind(orderId, user.id).first();
  
  if (!order) {
    return c.json({ error: "Order not found" }, 404);
  }
  
  if (order.status !== "pending_payment") {
    return c.json({ error: "Only pending orders can be cancelled" }, 400);
  }
  
  await c.env.DB.prepare(
    "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind("cancelled", orderId).run();
  
  return c.json({ success: true });
});

// ============ ARCADE BADGES API ============

// Get all available badges
app.get("/api/arcade/badges", async (c) => {
  const badges = await c.env.DB.prepare(
    "SELECT * FROM arcade_badges ORDER BY rarity DESC, name ASC"
  ).all();
  return c.json(badges.results || []);
});

// Get user's arcade stats and earned badges
app.get("/api/arcade/user-stats", authMiddleware, async (c) => {
  const user = c.get("user");
  
  // Get or create user stats
  let stats = await c.env.DB.prepare(
    "SELECT * FROM user_arcade_stats WHERE user_id = ?"
  ).bind(user.id).first();
  
  if (!stats) {
    await c.env.DB.prepare(
      "INSERT INTO user_arcade_stats (user_id) VALUES (?)"
    ).bind(user.id).run();
    stats = { total_tickets: 0, tickets_spent: 0, games_played: 0, high_scores: "{}" };
  }
  
  // Get earned badges
  const earnedBadges = await c.env.DB.prepare(
    `SELECT ub.*, ab.name, ab.description, ab.icon, ab.rarity
     FROM user_badges ub
     JOIN arcade_badges ab ON ub.badge_id = ab.id
     WHERE ub.user_id = ?
     ORDER BY ub.earned_at DESC`
  ).bind(user.id).all();
  
  // Get recent game sessions
  const recentSessions = await c.env.DB.prepare(
    `SELECT * FROM game_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`
  ).bind(user.id).all();
  
  return c.json({
    stats: {
      totalTickets: stats.total_tickets,
      ticketsSpent: stats.tickets_spent,
      availableTickets: (stats.total_tickets as number) - (stats.tickets_spent as number),
      gamesPlayed: stats.games_played,
      highScores: JSON.parse((stats.high_scores as string) || "{}")
    },
    earnedBadges: earnedBadges.results || [],
    recentSessions: recentSessions.results || []
  });
});

// Record a game session and award tickets
app.post("/api/arcade/game-session", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { gameType, score, durationSeconds } = body;
  
  if (!gameType) {
    return c.json({ error: "Game type is required" }, 400);
  }
  
  // Calculate tickets earned based on score
  let ticketsEarned = 1; // Base ticket for playing
  if (score) {
    if (score >= 100) ticketsEarned += 10;
    else if (score >= 50) ticketsEarned += 5;
    else if (score >= 20) ticketsEarned += 3;
    else if (score >= 10) ticketsEarned += 2;
  }
  
  // Record the session
  await c.env.DB.prepare(
    `INSERT INTO game_sessions (user_id, game_type, score, tickets_earned, duration_seconds)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(user.id, gameType, score || 0, ticketsEarned, durationSeconds || null).run();
  
  // Update user stats
  let stats = await c.env.DB.prepare(
    "SELECT * FROM user_arcade_stats WHERE user_id = ?"
  ).bind(user.id).first();
  
  if (!stats) {
    await c.env.DB.prepare(
      "INSERT INTO user_arcade_stats (user_id, total_tickets, games_played) VALUES (?, ?, 1)"
    ).bind(user.id, ticketsEarned).run();
  } else {
    const highScores = JSON.parse((stats.high_scores as string) || "{}");
    if (!highScores[gameType] || score > highScores[gameType]) {
      highScores[gameType] = score;
    }
    
    await c.env.DB.prepare(
      `UPDATE user_arcade_stats 
       SET total_tickets = total_tickets + ?, games_played = games_played + 1, 
           high_scores = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = ?`
    ).bind(ticketsEarned, JSON.stringify(highScores), user.id).run();
  }
  
  // Record ticket transaction
  await c.env.DB.prepare(
    `INSERT INTO ticket_transactions (user_id, amount, transaction_type, description, reference_id)
     VALUES (?, ?, 'earn', ?, ?)`
  ).bind(user.id, ticketsEarned, `Jogou ${gameType} - Score: ${score || 0}`, gameType).run();
  
  return c.json({
    success: true,
    ticketsEarned,
    score: score || 0
  });
});

// Check and award badges
app.post("/api/arcade/check-badges", authMiddleware, async (c) => {
  const user = c.get("user");
  
  // Get user stats
  const stats = await c.env.DB.prepare(
    "SELECT * FROM user_arcade_stats WHERE user_id = ?"
  ).bind(user.id).first();
  
  if (!stats) {
    return c.json({ newBadges: [] });
  }
  
  const highScores = JSON.parse((stats.high_scores as string) || "{}");
  const gamesPlayed = stats.games_played as number;
  const totalTickets = stats.total_tickets as number;
  
  // Get all badges
  const badges = await c.env.DB.prepare("SELECT * FROM arcade_badges").all();
  
  // Get already earned badges
  const earnedBadgeIds = await c.env.DB.prepare(
    "SELECT badge_id FROM user_badges WHERE user_id = ?"
  ).bind(user.id).all();
  const earnedSet = new Set((earnedBadgeIds.results || []).map((b) => (b as { badge_id: number }).badge_id));
  
  const newBadges: { id: number; name: string; description: string; icon: string; rarity: string }[] = [];
  
  for (const badge of (badges.results || [])) {
    if (earnedSet.has(badge.id as number)) continue;
    
    let earned = false;
    
    // Check games_required
    if (badge.games_required && gamesPlayed >= (badge.games_required as number)) {
      earned = true;
    }
    
    // Check tickets_required
    if (badge.tickets_required && totalTickets >= (badge.tickets_required as number)) {
      if (!badge.games_required || gamesPlayed >= (badge.games_required as number)) {
        earned = true;
      }
    }
    
    // Check game-specific score
    if (badge.game_type && badge.score_required) {
      const gameScore = highScores[badge.game_type as string] || 0;
      if (gameScore >= (badge.score_required as number)) {
        earned = true;
      }
    }
    
    if (earned) {
      await c.env.DB.prepare(
        "INSERT OR IGNORE INTO user_badges (user_id, badge_id, total_spent_at_earn, tickets_awarded) VALUES (?, ?, 0, 0)"
      ).bind(user.id, badge.id).run();
      
      newBadges.push({
        id: badge.id as number,
        name: badge.name as string,
        description: badge.description as string,
        icon: badge.icon as string,
        rarity: badge.rarity as string
      });
    }
  }
  
  return c.json({ newBadges });
});

// Get leaderboard for a specific game (legacy endpoint)
app.get("/api/arcade/leaderboard/:gameType", async (c) => {
  const { gameType } = c.req.param();
  
  const sessions = await c.env.DB.prepare(
    `SELECT user_id, MAX(score) as high_score, COUNT(*) as games_played
     FROM game_sessions
     WHERE game_type = ?
     GROUP BY user_id
     ORDER BY high_score DESC
     LIMIT 20`
  ).bind(gameType).all();
  
  return c.json(sessions.results || []);
});

// Get comprehensive leaderboard with period filtering
app.get("/api/arcade/leaderboards", async (c) => {
  const period = c.req.query("period") || "all"; // day, week, month, year, all
  const gameType = c.req.query("game"); // optional: filter by specific game
  
  // Calculate date filter based on period
  let dateFilter = "";
  
  switch (period) {
    case "day":
      dateFilter = `AND created_at >= datetime('now', '-1 day')`;
      break;
    case "week":
      dateFilter = `AND created_at >= datetime('now', '-7 days')`;
      break;
    case "month":
      dateFilter = `AND created_at >= datetime('now', '-30 days')`;
      break;
    case "year":
      dateFilter = `AND created_at >= datetime('now', '-365 days')`;
      break;
    default:
      dateFilter = ""; // all time
  }
  
  // Get overall leaderboard (total accumulated scores across all games)
  // Include RetroPass customization data for premium members
  const overallLeaderboard = await c.env.DB.prepare(
    `SELECT gs.user_id, 
            SUM(gs.score) as total_score, 
            COUNT(*) as games_played,
            SUM(gs.tickets_earned) as total_tickets,
            rp.leaderboard_icon,
            rp.leaderboard_color,
            rp.display_title,
            CASE WHEN rp.status = 'active' THEN 1 ELSE 0 END as has_retropass
     FROM game_sessions gs
     LEFT JOIN retropass_subscriptions rp ON gs.user_id = rp.user_id
     WHERE 1=1 ${dateFilter}
     GROUP BY gs.user_id
     ORDER BY total_score DESC
     LIMIT 50`
  ).all();
  
  // Get per-game leaderboards (accumulated scores per game)
  // Include RetroPass customization data for premium members
  let perGameLeaderboard;
  if (gameType) {
    perGameLeaderboard = await c.env.DB.prepare(
      `SELECT gs.user_id, 
              gs.game_type,
              SUM(gs.score) as total_score,
              MAX(gs.score) as high_score,
              COUNT(*) as games_played,
              rp.leaderboard_icon,
              rp.leaderboard_color,
              rp.display_title,
              CASE WHEN rp.status = 'active' THEN 1 ELSE 0 END as has_retropass
       FROM game_sessions gs
       LEFT JOIN retropass_subscriptions rp ON gs.user_id = rp.user_id
       WHERE gs.game_type = ? ${dateFilter}
       GROUP BY gs.user_id
       ORDER BY total_score DESC
       LIMIT 50`
    ).bind(gameType).all();
  } else {
    // Get top players for each game type
    perGameLeaderboard = await c.env.DB.prepare(
      `SELECT gs.user_id, 
              gs.game_type,
              SUM(gs.score) as total_score,
              MAX(gs.score) as high_score,
              COUNT(*) as games_played,
              rp.leaderboard_icon,
              rp.leaderboard_color,
              rp.display_title,
              CASE WHEN rp.status = 'active' THEN 1 ELSE 0 END as has_retropass
       FROM game_sessions gs
       LEFT JOIN retropass_subscriptions rp ON gs.user_id = rp.user_id
       WHERE 1=1 ${dateFilter}
       GROUP BY gs.user_id, gs.game_type
       ORDER BY gs.game_type, total_score DESC`
    ).all();
  }
  
  // Get available games with activity
  const activeGames = await c.env.DB.prepare(
    `SELECT DISTINCT game_type, COUNT(*) as total_sessions, SUM(score) as total_score
     FROM game_sessions
     WHERE 1=1 ${dateFilter}
     GROUP BY game_type
     ORDER BY total_sessions DESC`
  ).all();
  
  return c.json({
    period,
    overall: overallLeaderboard.results || [],
    perGame: perGameLeaderboard.results || [],
    activeGames: activeGames.results || []
  });
});

// Get user's personal stats and rankings
app.get("/api/arcade/my-rankings", authMiddleware, async (c) => {
  const user = c.get("user");
  const period = c.req.query("period") || "all";
  
  let dateFilter = "";
  switch (period) {
    case "day":
      dateFilter = `AND created_at >= datetime('now', '-1 day')`;
      break;
    case "week":
      dateFilter = `AND created_at >= datetime('now', '-7 days')`;
      break;
    case "month":
      dateFilter = `AND created_at >= datetime('now', '-30 days')`;
      break;
    case "year":
      dateFilter = `AND created_at >= datetime('now', '-365 days')`;
      break;
    default:
      dateFilter = "";
  }
  
  // Get user's overall stats for this period
  const userOverallStats = await c.env.DB.prepare(
    `SELECT SUM(score) as total_score, 
            COUNT(*) as games_played,
            SUM(tickets_earned) as total_tickets
     FROM game_sessions
     WHERE user_id = ? ${dateFilter}`
  ).bind(user.id).first();
  
  // Get user's per-game stats for this period
  const userGameStats = await c.env.DB.prepare(
    `SELECT game_type,
            SUM(score) as total_score,
            MAX(score) as high_score,
            COUNT(*) as games_played
     FROM game_sessions
     WHERE user_id = ? ${dateFilter}
     GROUP BY game_type
     ORDER BY total_score DESC`
  ).bind(user.id).all();
  
  // Calculate user's overall rank
  const overallRank = await c.env.DB.prepare(
    `SELECT COUNT(*) + 1 as rank
     FROM (
       SELECT user_id, SUM(score) as total_score
       FROM game_sessions
       WHERE 1=1 ${dateFilter}
       GROUP BY user_id
       HAVING total_score > (
         SELECT COALESCE(SUM(score), 0)
         FROM game_sessions
         WHERE user_id = ? ${dateFilter}
       )
     )`
  ).bind(user.id).first();
  
  return c.json({
    period,
    overallStats: userOverallStats || { total_score: 0, games_played: 0, total_tickets: 0 },
    overallRank: (overallRank?.rank as number) || 1,
    gameStats: userGameStats.results || []
  });
});

// ============ TICKET REDEMPTION SYSTEM ============

// Get available rewards
app.get("/api/arcade/rewards", async (c) => {
  const rewards = await c.env.DB.prepare(
    `SELECT * FROM arcade_rewards WHERE is_active = 1 ORDER BY ticket_cost ASC`
  ).all();
  
  return c.json({ rewards: rewards.results || [] });
});

// Get user's redeemed rewards
app.get("/api/arcade/my-rewards", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const redemptions = await c.env.DB.prepare(
    `SELECT r.*, ar.name, ar.description, ar.reward_type, ar.icon, ar.rarity
     FROM reward_redemptions r
     JOIN arcade_rewards ar ON r.reward_id = ar.id
     WHERE r.user_id = ?
     ORDER BY r.created_at DESC`
  ).bind(user.id).all();
  
  return c.json({ rewards: redemptions.results || [] });
});

// Redeem a reward
app.post("/api/arcade/rewards/:rewardId/redeem", authMiddleware, async (c) => {
  const user = c.get("user");
  const rewardId = c.req.param("rewardId");
  
  // Get the reward
  const reward = await c.env.DB.prepare(
    "SELECT * FROM arcade_rewards WHERE id = ? AND is_active = 1"
  ).bind(rewardId).first() as any;
  
  if (!reward) {
    return c.json({ error: "Reward not found or unavailable" }, 404);
  }
  
  // Check stock if limited
  if (reward.stock_limit !== null && reward.stock_remaining <= 0) {
    return c.json({ error: "Reward is out of stock" }, 400);
  }
  
  // Get user's current tickets
  const stats = await c.env.DB.prepare(
    "SELECT total_tickets, tickets_spent FROM user_arcade_stats WHERE user_id = ?"
  ).bind(user.id).first() as any;
  
  const availableTickets = (stats?.total_tickets || 0) - (stats?.tickets_spent || 0);
  
  if (availableTickets < reward.ticket_cost) {
    return c.json({ error: "Not enough tickets", required: reward.ticket_cost, available: availableTickets }, 400);
  }
  
  // Generate code for coupons
  let redeemedCode = null;
  let expiresAt = null;
  
  if (reward.reward_type === "coupon") {
    redeemedCode = `RETRO${reward.reward_value}-${Date.now().toString(36).toUpperCase()}`;
    // Coupons expire in 30 days
    expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  } else if (reward.reward_type === "boost") {
    redeemedCode = `BOOST-${Date.now().toString(36).toUpperCase()}`;
    // Boosts expire in 7 days
    expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  }
  
  // Create redemption record
  const rewardSnapshot = JSON.stringify({
    name: reward.name,
    type: reward.reward_type,
    value: reward.reward_value,
    icon: reward.icon,
    rarity: reward.rarity
  });
  
  await c.env.DB.prepare(
    `INSERT INTO reward_redemptions (user_id, reward_id, reward_snapshot, redeemed_code, expires_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  ).bind(user.id, rewardId, rewardSnapshot, redeemedCode, expiresAt).run();
  
  // Deduct tickets
  if (stats) {
    await c.env.DB.prepare(
      "UPDATE user_arcade_stats SET tickets_spent = tickets_spent + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
    ).bind(reward.ticket_cost, user.id).run();
  } else {
    await c.env.DB.prepare(
      `INSERT INTO user_arcade_stats (user_id, total_tickets, tickets_spent, created_at, updated_at)
       VALUES (?, 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    ).bind(user.id, reward.ticket_cost).run();
  }
  
  // Log the transaction
  await c.env.DB.prepare(
    `INSERT INTO ticket_transactions (user_id, amount, transaction_type, description, reference_id, created_at, updated_at)
     VALUES (?, ?, 'redemption', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  ).bind(user.id, -reward.ticket_cost, `Redeemed: ${reward.name}`, rewardId.toString()).run();
  
  // Update stock if limited
  if (reward.stock_limit !== null) {
    await c.env.DB.prepare(
      "UPDATE arcade_rewards SET stock_remaining = stock_remaining - 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(rewardId).run();
  }
  
  return c.json({
    success: true,
    message: `Successfully redeemed: ${reward.name}`,
    redemption: {
      reward_type: reward.reward_type,
      reward_value: reward.reward_value,
      redeemed_code: redeemedCode,
      expires_at: expiresAt
    },
    ticketsSpent: reward.ticket_cost,
    ticketsRemaining: availableTickets - reward.ticket_cost
  });
});

// ============ SECURE ACCOUNT TRANSACTIONS (ESCROW) ============

// Platform fee percentage (e.g., 10% = 1000 basis points)
const PLATFORM_FEE_BPS = 1000; // 10%

// Auto-release timeout in hours (buyer has X hours to confirm or dispute after delivery)
const AUTO_RELEASE_HOURS = 48;

// Save account credentials when creating a listing
app.post("/api/listings/:listingId/credentials", authMiddleware, async (c) => {
  const user = c.get("user");
  const listingId = c.req.param("listingId");
  const body = await c.req.json();
  
  // Verify listing ownership
  const listing = await c.env.DB.prepare(
    "SELECT user_id, listing_type FROM listings WHERE id = ?"
  ).bind(listingId).first();
  
  if (!listing) {
    return c.json({ error: "Listing not found" }, 404);
  }
  
  if (listing.user_id !== user.id) {
    return c.json({ error: "Not authorized" }, 403);
  }
  
  if (listing.listing_type !== "account") {
    return c.json({ error: "Only account listings can have credentials" }, 400);
  }
  
  const { login_email, login_username, login_password, recovery_email, recovery_phone, additional_info } = body;
  
  // Check if credentials already exist
  const existing = await c.env.DB.prepare(
    "SELECT id FROM account_credentials WHERE listing_id = ?"
  ).bind(listingId).first();
  
  if (existing) {
    // Update existing
    await c.env.DB.prepare(
      `UPDATE account_credentials SET 
        login_email = ?, login_username = ?, login_password = ?,
        recovery_email = ?, recovery_phone = ?, additional_info = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE listing_id = ?`
    ).bind(
      login_email || null, login_username || null, login_password || null,
      recovery_email || null, recovery_phone || null, additional_info || null,
      listingId
    ).run();
  } else {
    // Insert new
    await c.env.DB.prepare(
      `INSERT INTO account_credentials 
        (listing_id, login_email, login_username, login_password, recovery_email, recovery_phone, additional_info)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      listingId,
      login_email || null, login_username || null, login_password || null,
      recovery_email || null, recovery_phone || null, additional_info || null
    ).run();
  }
  
  return c.json({ success: true });
});

// Check if listing has credentials saved (for seller UI)
app.get("/api/listings/:listingId/credentials/status", authMiddleware, async (c) => {
  const user = c.get("user");
  const listingId = c.req.param("listingId");
  
  // Verify listing ownership
  const listing = await c.env.DB.prepare(
    "SELECT user_id FROM listings WHERE id = ?"
  ).bind(listingId).first();
  
  if (!listing || listing.user_id !== user.id) {
    return c.json({ error: "Not authorized" }, 403);
  }
  
  const credentials = await c.env.DB.prepare(
    "SELECT id, login_email, login_username, is_revealed FROM account_credentials WHERE listing_id = ?"
  ).bind(listingId).first();
  
  return c.json({
    hasCredentials: !!credentials,
    hasEmail: !!credentials?.login_email,
    hasUsername: !!credentials?.login_username,
    isRevealed: !!credentials?.is_revealed
  });
});

// Initiate account purchase (creates escrow transaction)
app.post("/api/account-transactions", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { listing_id } = body;
  
  if (!listing_id) {
    return c.json({ error: "listing_id is required" }, 400);
  }
  
  // Get listing details
  const listing = await c.env.DB.prepare(
    "SELECT * FROM listings WHERE id = ? AND status = 'active' AND listing_type = 'account'"
  ).bind(listing_id).first();
  
  if (!listing) {
    return c.json({ error: "Listing not found or not available" }, 404);
  }
  
  if (listing.user_id === user.id) {
    return c.json({ error: "Cannot purchase your own listing" }, 400);
  }
  
  // Check if credentials exist
  const credentials = await c.env.DB.prepare(
    "SELECT id FROM account_credentials WHERE listing_id = ?"
  ).bind(listing_id).first();
  
  if (!credentials) {
    return c.json({ error: "Seller has not provided account credentials yet" }, 400);
  }
  
  // Check for existing active transaction
  const existingTx = await c.env.DB.prepare(
    `SELECT id FROM account_transactions 
     WHERE listing_id = ? AND buyer_id = ? 
     AND status NOT IN ('completed', 'cancelled', 'refunded')`
  ).bind(listing_id, user.id).first();
  
  if (existingTx) {
    return c.json({ error: "You already have an active transaction for this listing", transactionId: existingTx.id }, 400);
  }
  
  // Calculate fees
  const amountCents = listing.price_cents as number;
  const platformFeeCents = Math.round(amountCents * PLATFORM_FEE_BPS / 10000);
  const sellerPayoutCents = amountCents - platformFeeCents;
  
  // Create transaction in pending_payment state
  const result = await c.env.DB.prepare(
    `INSERT INTO account_transactions 
      (listing_id, buyer_id, seller_id, amount_cents, platform_fee_cents, seller_payout_cents, status)
     VALUES (?, ?, ?, ?, ?, ?, 'pending_payment')`
  ).bind(
    listing_id, user.id, listing.user_id,
    amountCents, platformFeeCents, sellerPayoutCents
  ).run();
  
  const transactionId = result.meta.last_row_id;
  
  // Add system message
  await c.env.DB.prepare(
    `INSERT INTO transaction_messages (transaction_id, sender_id, message_type, content, is_system)
     VALUES (?, ?, 'system', ?, 1)`
  ).bind(transactionId, user.id, "Transaction created. Awaiting payment from buyer.").run();
  
  return c.json({ 
    success: true, 
    transactionId,
    amount_cents: amountCents,
    platform_fee_cents: platformFeeCents,
    seller_payout_cents: sellerPayoutCents
  });
});

// Create Stripe checkout for account transaction
app.post("/api/account-transactions/:id/checkout", authMiddleware, async (c) => {
  const user = c.get("user");
  const transactionId = c.req.param("id");
  
  if (!c.env.STRIPE_SECRET_KEY) {
    return c.json({ error: "Stripe not configured" }, 500);
  }
  
  // Get transaction
  const transaction = await c.env.DB.prepare(
    `SELECT at.*, l.title, l.images, l.game_platform 
     FROM account_transactions at
     JOIN listings l ON at.listing_id = l.id
     WHERE at.id = ? AND at.buyer_id = ?`
  ).bind(transactionId, user.id).first();
  
  if (!transaction) {
    return c.json({ error: "Transaction not found" }, 404);
  }
  
  if (transaction.status !== "pending_payment") {
    return c.json({ error: "Transaction already paid or cancelled" }, 400);
  }
  
  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
  const origin = new URL(c.req.url).origin;
  
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: {
          name: `Account: ${transaction.title}`,
          description: `${transaction.game_platform || "Digital Account"} - Secure Escrow Purchase`,
        },
        unit_amount: transaction.amount_cents as number,
      },
      quantity: 1,
    }],
    success_url: `${origin}/marketplace/transaction/${transactionId}?payment=success`,
    cancel_url: `${origin}/marketplace/transaction/${transactionId}?payment=cancelled`,
    metadata: {
      type: "account_transaction",
      transactionId: String(transactionId),
      buyerId: user.id,
      sellerId: transaction.seller_id as string,
    },
  });
  
  return c.json({ url: session.url });
});

// Get user's transactions (as buyer or seller)
app.get("/api/account-transactions", authMiddleware, async (c) => {
  const user = c.get("user");
  const role = c.req.query("role"); // 'buyer', 'seller', or undefined for all
  
  let query = `
    SELECT at.*, 
           l.title, l.images, l.game_platform, l.account_level, l.account_rank,
           (SELECT COUNT(*) FROM transaction_messages WHERE transaction_id = at.id AND is_read = 0 AND sender_id != ?) as unread_count
    FROM account_transactions at
    JOIN listings l ON at.listing_id = l.id
    WHERE `;
  
  const params: (string | number)[] = [user.id];
  
  if (role === "buyer") {
    query += "at.buyer_id = ?";
    params.push(user.id);
  } else if (role === "seller") {
    query += "at.seller_id = ?";
    params.push(user.id);
  } else {
    query += "(at.buyer_id = ? OR at.seller_id = ?)";
    params.push(user.id, user.id);
  }
  
  query += " ORDER BY at.updated_at DESC";
  
  const transactions = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ transactions: transactions.results || [] });
});

// Get single transaction details
app.get("/api/account-transactions/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const transactionId = c.req.param("id");
  
  const transaction = await c.env.DB.prepare(
    `SELECT at.*, 
            l.title, l.description, l.images, l.game_platform, l.account_level, l.account_rank, l.account_server
     FROM account_transactions at
     JOIN listings l ON at.listing_id = l.id
     WHERE at.id = ? AND (at.buyer_id = ? OR at.seller_id = ?)`
  ).bind(transactionId, user.id, user.id).first();
  
  if (!transaction) {
    return c.json({ error: "Transaction not found" }, 404);
  }
  
  const isBuyer = transaction.buyer_id === user.id;
  const isSeller = transaction.seller_id === user.id;
  
  // Get credentials only if paid and revealed (or if seller)
  let credentials = null;
  if (isSeller || (isBuyer && transaction.status !== "pending_payment" && transaction.delivered_at)) {
    const creds = await c.env.DB.prepare(
      "SELECT * FROM account_credentials WHERE listing_id = ?"
    ).bind(transaction.listing_id).first();
    
    if (creds) {
      if (isSeller) {
        credentials = creds;
      } else if (isBuyer && creds.is_revealed) {
        credentials = creds;
      }
    }
  }
  
  // Check for dispute
  const dispute = await c.env.DB.prepare(
    "SELECT * FROM transaction_disputes WHERE transaction_id = ?"
  ).bind(transactionId).first();
  
  return c.json({
    transaction,
    credentials,
    dispute,
    isBuyer,
    isSeller,
    canConfirm: isBuyer && transaction.status === "in_delivery",
    canDispute: (isBuyer || isSeller) && ["paid", "in_delivery"].includes(transaction.status as string) && !dispute,
    canDeliver: isSeller && transaction.status === "paid"
  });
});

// Get transaction messages (secure chat)
app.get("/api/account-transactions/:id/messages", authMiddleware, async (c) => {
  const user = c.get("user");
  const transactionId = c.req.param("id");
  
  // Verify user is part of transaction
  const transaction = await c.env.DB.prepare(
    "SELECT buyer_id, seller_id FROM account_transactions WHERE id = ?"
  ).bind(transactionId).first();
  
  if (!transaction || (transaction.buyer_id !== user.id && transaction.seller_id !== user.id)) {
    return c.json({ error: "Not authorized" }, 403);
  }
  
  const messages = await c.env.DB.prepare(
    "SELECT * FROM transaction_messages WHERE transaction_id = ? ORDER BY created_at ASC"
  ).bind(transactionId).all();
  
  // Mark messages as read
  await c.env.DB.prepare(
    "UPDATE transaction_messages SET is_read = 1 WHERE transaction_id = ? AND sender_id != ?"
  ).bind(transactionId, user.id).run();
  
  return c.json({ messages: messages.results || [] });
});

// Send message in transaction chat
app.post("/api/account-transactions/:id/messages", authMiddleware, async (c) => {
  const user = c.get("user");
  const transactionId = c.req.param("id");
  const body = await c.req.json();
  const { content } = body;
  
  if (!content?.trim()) {
    return c.json({ error: "Message content required" }, 400);
  }
  
  // Verify user is part of transaction and it's active
  const transaction = await c.env.DB.prepare(
    "SELECT buyer_id, seller_id, status FROM account_transactions WHERE id = ?"
  ).bind(transactionId).first();
  
  if (!transaction || (transaction.buyer_id !== user.id && transaction.seller_id !== user.id)) {
    return c.json({ error: "Not authorized" }, 403);
  }
  
  if (["completed", "cancelled", "refunded"].includes(transaction.status as string)) {
    return c.json({ error: "Cannot send messages in closed transactions" }, 400);
  }
  
  const result = await c.env.DB.prepare(
    "INSERT INTO transaction_messages (transaction_id, sender_id, message_type, content) VALUES (?, ?, 'text', ?)"
  ).bind(transactionId, user.id, content.trim()).run();
  
  // Update transaction updated_at
  await c.env.DB.prepare(
    "UPDATE account_transactions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(transactionId).run();
  
  return c.json({ success: true, messageId: result.meta.last_row_id });
});

// Seller delivers account (reveals credentials)
app.post("/api/account-transactions/:id/deliver", authMiddleware, async (c) => {
  const user = c.get("user");
  const transactionId = c.req.param("id");
  
  const transaction = await c.env.DB.prepare(
    "SELECT * FROM account_transactions WHERE id = ? AND seller_id = ?"
  ).bind(transactionId, user.id).first();
  
  if (!transaction) {
    return c.json({ error: "Transaction not found" }, 404);
  }
  
  if (transaction.status !== "paid") {
    return c.json({ error: "Can only deliver paid transactions" }, 400);
  }
  
  const now = new Date();
  const autoReleaseAt = new Date(now.getTime() + AUTO_RELEASE_HOURS * 60 * 60 * 1000);
  
  // Update transaction status
  await c.env.DB.prepare(
    `UPDATE account_transactions SET 
      status = 'in_delivery', 
      delivered_at = ?,
      auto_release_at = ?,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(now.toISOString(), autoReleaseAt.toISOString(), transactionId).run();
  
  // Reveal credentials
  await c.env.DB.prepare(
    `UPDATE account_credentials SET 
      is_revealed = 1, 
      revealed_at = ?,
      updated_at = CURRENT_TIMESTAMP
     WHERE listing_id = ?`
  ).bind(now.toISOString(), transaction.listing_id).run();
  
  // Add system message
  await c.env.DB.prepare(
    `INSERT INTO transaction_messages (transaction_id, sender_id, message_type, content, is_system)
     VALUES (?, ?, 'system', ?, 1)`
  ).bind(
    transactionId, 
    user.id, 
    `Account credentials delivered. Buyer has ${AUTO_RELEASE_HOURS} hours to confirm receipt or open a dispute. Auto-release at: ${autoReleaseAt.toISOString()}`
  ).run();
  
  return c.json({ 
    success: true, 
    auto_release_at: autoReleaseAt.toISOString()
  });
});

// Buyer confirms receipt (releases payment to seller)
app.post("/api/account-transactions/:id/confirm", authMiddleware, async (c) => {
  const user = c.get("user");
  const transactionId = c.req.param("id");
  
  const transaction = await c.env.DB.prepare(
    "SELECT * FROM account_transactions WHERE id = ? AND buyer_id = ?"
  ).bind(transactionId, user.id).first();
  
  if (!transaction) {
    return c.json({ error: "Transaction not found" }, 404);
  }
  
  if (transaction.status !== "in_delivery") {
    return c.json({ error: "Can only confirm delivered transactions" }, 400);
  }
  
  // Check for active dispute
  const dispute = await c.env.DB.prepare(
    "SELECT id FROM transaction_disputes WHERE transaction_id = ? AND status = 'open'"
  ).bind(transactionId).first();
  
  if (dispute) {
    return c.json({ error: "Cannot confirm while dispute is open" }, 400);
  }
  
  const now = new Date();
  
  // Update transaction to completed
  await c.env.DB.prepare(
    `UPDATE account_transactions SET 
      status = 'completed', 
      confirmed_at = ?,
      completed_at = ?,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(now.toISOString(), now.toISOString(), transactionId).run();
  
  // Mark listing as sold
  await c.env.DB.prepare(
    "UPDATE listings SET status = 'sold', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(transaction.listing_id).run();
  
  // Add system message
  await c.env.DB.prepare(
    `INSERT INTO transaction_messages (transaction_id, sender_id, message_type, content, is_system)
     VALUES (?, ?, 'system', ?, 1)`
  ).bind(transactionId, user.id, "Buyer confirmed receipt. Transaction completed. Payment released to seller.").run();
  
  return c.json({ success: true });
});

// Open dispute
app.post("/api/account-transactions/:id/dispute", authMiddleware, async (c) => {
  const user = c.get("user");
  const transactionId = c.req.param("id");
  const body = await c.req.json();
  const { reason, description } = body;
  
  if (!reason?.trim()) {
    return c.json({ error: "Reason is required" }, 400);
  }
  
  const transaction = await c.env.DB.prepare(
    "SELECT * FROM account_transactions WHERE id = ? AND (buyer_id = ? OR seller_id = ?)"
  ).bind(transactionId, user.id, user.id).first();
  
  if (!transaction) {
    return c.json({ error: "Transaction not found" }, 404);
  }
  
  if (!["paid", "in_delivery"].includes(transaction.status as string)) {
    return c.json({ error: "Can only dispute paid or in-delivery transactions" }, 400);
  }
  
  // Check for existing dispute
  const existingDispute = await c.env.DB.prepare(
    "SELECT id FROM transaction_disputes WHERE transaction_id = ?"
  ).bind(transactionId).first();
  
  if (existingDispute) {
    return c.json({ error: "Dispute already exists" }, 400);
  }
  
  // Create dispute
  const result = await c.env.DB.prepare(
    `INSERT INTO transaction_disputes (transaction_id, opened_by, reason, description)
     VALUES (?, ?, ?, ?)`
  ).bind(transactionId, user.id, reason.trim(), description?.trim() || null).run();
  
  // Update transaction status
  await c.env.DB.prepare(
    "UPDATE account_transactions SET status = 'disputed', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(transactionId).run();
  
  // Add system message
  await c.env.DB.prepare(
    `INSERT INTO transaction_messages (transaction_id, sender_id, message_type, content, is_system)
     VALUES (?, ?, 'system', ?, 1)`
  ).bind(transactionId, user.id, `Dispute opened: ${reason.trim()}. A moderator will review this case.`).run();
  
  return c.json({ success: true, disputeId: result.meta.last_row_id });
});

// Cancel transaction (only if pending payment)
app.post("/api/account-transactions/:id/cancel", authMiddleware, async (c) => {
  const user = c.get("user");
  const transactionId = c.req.param("id");
  const body = await c.req.json();
  const { reason } = body;
  
  const transaction = await c.env.DB.prepare(
    "SELECT * FROM account_transactions WHERE id = ? AND (buyer_id = ? OR seller_id = ?)"
  ).bind(transactionId, user.id, user.id).first();
  
  if (!transaction) {
    return c.json({ error: "Transaction not found" }, 404);
  }
  
  if (transaction.status !== "pending_payment") {
    return c.json({ error: "Can only cancel pending transactions" }, 400);
  }
  
  await c.env.DB.prepare(
    `UPDATE account_transactions SET 
      status = 'cancelled', 
      cancelled_at = CURRENT_TIMESTAMP,
      cancellation_reason = ?,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(reason?.trim() || "Cancelled by user", transactionId).run();
  
  // Add system message
  await c.env.DB.prepare(
    `INSERT INTO transaction_messages (transaction_id, sender_id, message_type, content, is_system)
     VALUES (?, ?, 'system', ?, 1)`
  ).bind(transactionId, user.id, "Transaction cancelled.").run();
  
  return c.json({ success: true });
});

// Admin: Get all disputes
app.get("/api/admin/disputes", adminMiddleware, async (c) => {
  const disputes = await c.env.DB.prepare(
    `SELECT td.*, at.amount_cents, at.buyer_id, at.seller_id, at.status as transaction_status,
            l.title as listing_title, l.game_platform
     FROM transaction_disputes td
     JOIN account_transactions at ON td.transaction_id = at.id
     JOIN listings l ON at.listing_id = l.id
     ORDER BY td.created_at DESC`
  ).all();
  
  return c.json({ disputes: disputes.results || [] });
});

// Admin: Resolve dispute
app.post("/api/admin/disputes/:id/resolve", adminMiddleware, async (c) => {
  const user = c.get("user");
  const disputeId = c.req.param("id");
  const body = await c.req.json();
  const { resolution, refund_buyer } = body;
  
  if (!resolution?.trim()) {
    return c.json({ error: "Resolution is required" }, 400);
  }
  
  const dispute = await c.env.DB.prepare(
    "SELECT * FROM transaction_disputes WHERE id = ?"
  ).bind(disputeId).first();
  
  if (!dispute) {
    return c.json({ error: "Dispute not found" }, 404);
  }
  
  if (dispute.status !== "open") {
    return c.json({ error: "Dispute already resolved" }, 400);
  }
  
  // Update dispute
  await c.env.DB.prepare(
    `UPDATE transaction_disputes SET 
      status = 'resolved',
      resolution = ?,
      resolved_by = ?,
      resolved_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(resolution.trim(), user.id, disputeId).run();
  
  // Update transaction status based on resolution
  const newStatus = refund_buyer ? "refunded" : "completed";
  
  await c.env.DB.prepare(
    `UPDATE account_transactions SET 
      status = ?,
      completed_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(newStatus, dispute.transaction_id).run();
  
  // If completed (not refunded), mark listing as sold
  if (!refund_buyer) {
    const transaction = await c.env.DB.prepare(
      "SELECT listing_id FROM account_transactions WHERE id = ?"
    ).bind(dispute.transaction_id).first();
    
    if (transaction) {
      await c.env.DB.prepare(
        "UPDATE listings SET status = 'sold', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(transaction.listing_id).run();
    }
  }
  
  // Add system message
  await c.env.DB.prepare(
    `INSERT INTO transaction_messages (transaction_id, sender_id, message_type, content, is_system)
     VALUES (?, ?, 'system', ?, 1)`
  ).bind(
    dispute.transaction_id, 
    user.id, 
    `Dispute resolved by admin. Resolution: ${resolution.trim()}. ${refund_buyer ? "Buyer refunded." : "Payment released to seller."}`
  ).run();
  
  return c.json({ success: true });
});

// Webhook handler for account transaction payments
app.post("/api/webhooks/stripe-account", async (c) => {
  if (!c.env.STRIPE_SECRET_KEY || !c.env.STRIPE_WEBHOOK_SECRET) {
    return c.json({ error: "Stripe not configured" }, 500);
  }
  
  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
  const body = await c.req.text();
  const sig = c.req.header("stripe-signature") || "";
  
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, c.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return c.text("Invalid signature", 400);
  }
  
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Check if this is an account transaction
    if (session.metadata?.type === "account_transaction") {
      const transactionId = session.metadata.transactionId;
      
      // Update transaction status to paid
      await c.env.DB.prepare(
        `UPDATE account_transactions SET 
          status = 'paid', 
          stripe_payment_intent_id = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).bind(session.payment_intent as string, transactionId).run();
      
      // Add system message
      await c.env.DB.prepare(
        `INSERT INTO transaction_messages (transaction_id, sender_id, message_type, content, is_system)
         VALUES (?, ?, 'system', ?, 1)`
      ).bind(transactionId, session.metadata.buyerId, "Payment received. Funds held in escrow. Waiting for seller to deliver account credentials.").run();
    }
  }
  
  return c.text("ok", 200);
});

// Check for auto-release (run this periodically or via cron)
app.post("/api/admin/process-auto-releases", adminMiddleware, async (c) => {
  const now = new Date().toISOString();
  
  // Find transactions past auto-release time
  const transactions = await c.env.DB.prepare(
    `SELECT id, listing_id FROM account_transactions 
     WHERE status = 'in_delivery' 
     AND auto_release_at IS NOT NULL 
     AND auto_release_at <= ?`
  ).bind(now).all();
  
  let processed = 0;
  
  for (const tx of (transactions.results || [])) {
    // Check no open dispute
    const dispute = await c.env.DB.prepare(
      "SELECT id FROM transaction_disputes WHERE transaction_id = ? AND status = 'open'"
    ).bind(tx.id).first();
    
    if (!dispute) {
      // Auto-complete
      await c.env.DB.prepare(
        `UPDATE account_transactions SET 
          status = 'completed', 
          completed_at = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).bind(now, tx.id).run();
      
      // Mark listing as sold
      await c.env.DB.prepare(
        "UPDATE listings SET status = 'sold', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(tx.listing_id).run();
      
      // Add system message
      await c.env.DB.prepare(
        `INSERT INTO transaction_messages (transaction_id, sender_id, message_type, content, is_system)
         VALUES (?, 'system', 'system', ?, 1)`
      ).bind(tx.id, "Auto-release triggered. Buyer did not dispute within the allowed time. Transaction completed.").run();
      
      processed++;
    }
  }
  
  return c.json({ success: true, processed });
});

// Spend tickets
app.post("/api/arcade/spend-tickets", authMiddleware, async (c) => {
  const user = c.get("user");
  const { amount, description } = await c.req.json();
  
  if (!amount || amount <= 0) {
    return c.json({ error: "Invalid amount" }, 400);
  }
  
  const stats = await c.env.DB.prepare(
    "SELECT * FROM user_arcade_stats WHERE user_id = ?"
  ).bind(user.id).first();
  
  if (!stats) {
    return c.json({ error: "No arcade stats found" }, 404);
  }
  
  const available = (stats.total_tickets as number) - (stats.tickets_spent as number);
  if (amount > available) {
    return c.json({ error: "Insufficient tickets" }, 400);
  }
  
  await c.env.DB.prepare(
    `UPDATE user_arcade_stats SET tickets_spent = tickets_spent + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`
  ).bind(amount, user.id).run();
  
  await c.env.DB.prepare(
    `INSERT INTO ticket_transactions (user_id, amount, transaction_type, description)
     VALUES (?, ?, 'spend', ?)`
  ).bind(user.id, -amount, description || "Ticket redemption").run();
  
  return c.json({
    success: true,
    ticketsSpent: amount,
    newBalance: available - amount
  });
});

// ============================================
// Printify API Integration - Custom Products
// ============================================

const PRINTIFY_BASE_URL = "https://api.printify.com/v1";

// Helper function for Printify API requests
async function printifyFetch(
  env: Env,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = env.PRINTIFY_API_TOKEN;
  if (!token) {
    throw new Error("PRINTIFY_API_TOKEN not configured");
  }

  const url = `${PRINTIFY_BASE_URL}${endpoint}`;
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "retromynd-store",
    ...options.headers,
  };

  return fetch(url, { ...options, headers });
}

// Get Printify shops (admin)
app.get("/api/printify/shops", adminMiddleware, async (c) => {
  try {
    const response = await printifyFetch(c.env, "/shops.json");
    if (!response.ok) {
      const error = await response.text();
      return c.json({ error: "Failed to fetch shops", details: error }, 500);
    }
    const shops = await response.json() as Record<string, unknown>;
    return c.json(shops);
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Helper endpoint to find Shop ID (no auth required for setup)
app.get("/api/printify/find-shop-id", async (c) => {
  try {
    const response = await printifyFetch(c.env, "/shops.json");
    if (!response.ok) {
      const error = await response.text();
      return c.json({ 
        error: "Failed to fetch shops", 
        details: error,
        hint: "Make sure your API token has 'shops.read' permission enabled"
      }, 500);
    }
    const shops = await response.json() as unknown as Array<{ id: number; title: string; sales_channel: string }>;
    
    if (!Array.isArray(shops) || shops.length === 0) {
      return c.json({ 
        error: "No shops found",
        hint: "You need to create a shop in Printify first, or connect an existing store"
      }, 404);
    }
    
    return c.json({
      message: "Found your Printify shops! Copy the 'id' value and paste it as PRINTIFY_SHOP_ID in your app secrets.",
      shops: shops.map(s => ({
        id: s.id,
        title: s.title,
        sales_channel: s.sales_channel
      }))
    });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Get catalog blueprints (product types)
app.get("/api/printify/blueprints", async (c) => {
  try {
    const page = c.req.query("page") || "1";
    const limit = c.req.query("limit") || "20";
    const response = await printifyFetch(c.env, `/catalog/blueprints.json?page=${page}&limit=${limit}`);
    if (!response.ok) {
      const error = await response.text();
      return c.json({ error: "Failed to fetch blueprints", details: error }, 500);
    }
    const blueprints = await response.json() as Record<string, unknown>;
    return c.json(blueprints);
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Get specific blueprint details
app.get("/api/printify/blueprints/:id", async (c) => {
  try {
    const blueprintId = c.req.param("id");
    const response = await printifyFetch(c.env, `/catalog/blueprints/${blueprintId}.json`);
    if (!response.ok) {
      const error = await response.text();
      return c.json({ error: "Failed to fetch blueprint", details: error }, 500);
    }
    const blueprint = await response.json() as Record<string, unknown>;
    return c.json(blueprint);
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Get print providers for a blueprint
app.get("/api/printify/blueprints/:id/providers", async (c) => {
  try {
    const blueprintId = c.req.param("id");
    const response = await printifyFetch(c.env, `/catalog/blueprints/${blueprintId}/print_providers.json`);
    if (!response.ok) {
      const error = await response.text();
      return c.json({ error: "Failed to fetch providers", details: error }, 500);
    }
    const providers = await response.json() as Record<string, unknown>;
    return c.json(providers);
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Get variants for a blueprint and provider
app.get("/api/printify/blueprints/:blueprintId/providers/:providerId/variants", async (c) => {
  try {
    const blueprintId = c.req.param("blueprintId");
    const providerId = c.req.param("providerId");
    const response = await printifyFetch(
      c.env,
      `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`
    );
    if (!response.ok) {
      const error = await response.text();
      return c.json({ error: "Failed to fetch variants", details: error }, 500);
    }
    const variants = await response.json() as Record<string, unknown>;
    return c.json(variants);
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Get shipping info for a blueprint and provider
app.get("/api/printify/blueprints/:blueprintId/providers/:providerId/shipping", async (c) => {
  try {
    const blueprintId = c.req.param("blueprintId");
    const providerId = c.req.param("providerId");
    const response = await printifyFetch(
      c.env,
      `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/shipping.json`
    );
    if (!response.ok) {
      const error = await response.text();
      return c.json({ error: "Failed to fetch shipping", details: error }, 500);
    }
    const shipping = await response.json() as Record<string, unknown>;
    return c.json(shipping);
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Upload image to Printify
app.post("/api/printify/uploads", authMiddleware, async (c) => {
  try {
    const shopId = c.env.PRINTIFY_SHOP_ID;
    if (!shopId) {
      return c.json({ error: "PRINTIFY_SHOP_ID not configured" }, 500);
    }

    const { image_url, file_name } = await c.req.json();
    
    if (!image_url) {
      return c.json({ error: "image_url is required" }, 400);
    }

    const response = await printifyFetch(c.env, "/uploads/images.json", {
      method: "POST",
      body: JSON.stringify({
        file_name: file_name || "design.png",
        url: image_url
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return c.json({ error: "Failed to upload image", details: error }, 500);
    }

    const upload = await response.json() as Record<string, unknown>;
    return c.json(upload);
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Create product in Printify
app.post("/api/printify/products", authMiddleware, async (c) => {
  try {
    const shopId = c.env.PRINTIFY_SHOP_ID;
    if (!shopId) {
      return c.json({ error: "PRINTIFY_SHOP_ID not configured" }, 500);
    }

    const productData = await c.req.json();
    
    const response = await printifyFetch(c.env, `/shops/${shopId}/products.json`, {
      method: "POST",
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const error = await response.text();
      return c.json({ error: "Failed to create product", details: error }, 500);
    }

    const product = await response.json() as Record<string, unknown>;
    return c.json(product);
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Create order in Printify (for checkout)
app.post("/api/printify/orders", authMiddleware, async (c) => {
  try {
    const shopId = c.env.PRINTIFY_SHOP_ID;
    if (!shopId) {
      return c.json({ error: "PRINTIFY_SHOP_ID not configured" }, 500);
    }

    const user = c.get("user");
    const orderData = await c.req.json();

    // Add external_id if not provided
    if (!orderData.external_id) {
      orderData.external_id = `rm-${user.id}-${Date.now()}`;
    }

    const response = await printifyFetch(c.env, `/shops/${shopId}/orders.json`, {
      method: "POST",
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const error = await response.text();
      return c.json({ error: "Failed to create order", details: error }, 500);
    }

    const order = await response.json() as Record<string, unknown>;
    return c.json(order);
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Get shop products
app.get("/api/printify/products", async (c) => {
  try {
    const shopId = c.env.PRINTIFY_SHOP_ID;
    if (!shopId) {
      return c.json({ error: "PRINTIFY_SHOP_ID not configured" }, 500);
    }

    const page = c.req.query("page") || "1";
    const limit = c.req.query("limit") || "20";
    
    const response = await printifyFetch(c.env, `/shops/${shopId}/products.json?page=${page}&limit=${limit}`);
    if (!response.ok) {
      const error = await response.text();
      return c.json({ error: "Failed to fetch products", details: error }, 500);
    }
    const products = await response.json() as Record<string, unknown>;
    return c.json(products);
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Get single product
app.get("/api/printify/products/:id", async (c) => {
  try {
    const shopId = c.env.PRINTIFY_SHOP_ID;
    if (!shopId) {
      return c.json({ error: "PRINTIFY_SHOP_ID not configured" }, 500);
    }

    const productId = c.req.param("id");
    const response = await printifyFetch(c.env, `/shops/${shopId}/products/${productId}.json`);
    if (!response.ok) {
      const error = await response.text();
      return c.json({ error: "Failed to fetch product", details: error }, 500);
    }
    const product = await response.json() as Record<string, unknown>;
    return c.json(product);
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Calculate order cost (for checkout preview)
app.post("/api/printify/calculate-shipping", async (c) => {
  try {
    const shopId = c.env.PRINTIFY_SHOP_ID;
    if (!shopId) {
      return c.json({ error: "PRINTIFY_SHOP_ID not configured" }, 500);
    }

    const data = await c.req.json();
    
    const response = await printifyFetch(c.env, `/shops/${shopId}/orders/shipping.json`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      return c.json({ error: "Failed to calculate shipping", details: error }, 500);
    }

    const shipping = await response.json() as Record<string, unknown>;
    return c.json(shipping);
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// ==================== RETROPASS SUBSCRIPTION SYSTEM ====================

// Helper to generate unique coupon codes
function generateCouponCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "RETRO-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Check RetroPass subscription status
app.get("/api/retropass/status", authMiddleware, async (c) => {
  const user = c.get("user");
  
  try {
    const subscription = await c.env.DB.prepare(
      "SELECT * FROM retropass_subscriptions WHERE user_id = ? AND status = 'active'"
    ).bind(user.id).first();
    
    if (!subscription) {
      return c.json({ 
        hasRetroPass: false,
        subscription: null
      });
    }
    
    // Get unused coupons count
    const couponsResult = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM retropass_coupons WHERE user_id = ? AND is_used = 0 AND expires_at > datetime('now')"
    ).bind(user.id).first() as { count: number } | null;
    
    // Get user's arcade stats for ticket balance
    const arcadeStats = await c.env.DB.prepare(
      "SELECT total_tickets, tickets_spent FROM user_arcade_stats WHERE user_id = ?"
    ).bind(user.id).first() as { total_tickets: number; tickets_spent: number } | null;
    
    return c.json({
      hasRetroPass: true,
      subscription: {
        ...subscription,
        availableCoupons: couponsResult?.count || 0,
        ticketBalance: arcadeStats ? (arcadeStats.total_tickets - arcadeStats.tickets_spent) : 0
      }
    });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Create RetroPass subscription checkout session
app.post("/api/retropass/subscribe", authMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!c.env.STRIPE_SECRET_KEY) {
    return c.json({ error: "Stripe not configured" }, 500);
  }
  
  try {
    // Check if already subscribed
    const existing = await c.env.DB.prepare(
      "SELECT * FROM retropass_subscriptions WHERE user_id = ? AND status = 'active'"
    ).bind(user.id).first();
    
    if (existing) {
      return c.json({ error: "Already subscribed to RetroPass" }, 400);
    }
    
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
    
    // Create or get Stripe customer
    let customerId: string;
    const existingSub = await c.env.DB.prepare(
      "SELECT stripe_customer_id FROM retropass_subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1"
    ).bind(user.id).first() as { stripe_customer_id: string } | null;
    
    if (existingSub?.stripe_customer_id) {
      customerId = existingSub.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
    }
    
    // Create checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: "RetroPass Premium",
            description: "5000 tickets/mês, 5 cupons, insígnia diamante, customização exclusiva",
            images: [`${c.req.header("origin")}/assets/retromynd-gameboy-3d-1.png`]
          },
          unit_amount: 499, // $4.99
          recurring: {
            interval: "month"
          }
        },
        quantity: 1
      }],
      metadata: {
        user_id: user.id,
        type: "retropass"
      },
      success_url: `${c.req.header("origin")}/retropass?success=true`,
      cancel_url: `${c.req.header("origin")}/retropass?cancelled=true`
    });
    
    return c.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Cancel RetroPass subscription
app.post("/api/retropass/cancel", authMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!c.env.STRIPE_SECRET_KEY) {
    return c.json({ error: "Stripe not configured" }, 500);
  }
  
  try {
    const subscription = await c.env.DB.prepare(
      "SELECT * FROM retropass_subscriptions WHERE user_id = ? AND status = 'active'"
    ).bind(user.id).first() as { stripe_subscription_id: string } | null;
    
    if (!subscription) {
      return c.json({ error: "No active subscription found" }, 404);
    }
    
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
    
    // Cancel at period end (user keeps benefits until period ends)
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true
    });
    
    await c.env.DB.prepare(
      "UPDATE retropass_subscriptions SET cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND status = 'active'"
    ).bind(user.id).run();
    
    return c.json({ success: true, message: "Subscription will be cancelled at end of billing period" });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Get user's RetroPass coupons
app.get("/api/retropass/coupons", authMiddleware, async (c) => {
  const user = c.get("user");
  
  try {
    const coupons = await c.env.DB.prepare(
      `SELECT * FROM retropass_coupons 
       WHERE user_id = ? 
       ORDER BY is_used ASC, expires_at ASC`
    ).bind(user.id).all();
    
    return c.json({ coupons: coupons.results });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Apply coupon to get discount
app.post("/api/retropass/apply-coupon", authMiddleware, async (c) => {
  const user = c.get("user");
  const { code, orderTotalCents } = await c.req.json();
  
  try {
    const coupon = await c.env.DB.prepare(
      `SELECT * FROM retropass_coupons 
       WHERE code = ? AND user_id = ? AND is_used = 0 AND expires_at > datetime('now')`
    ).bind(code, user.id).first() as {
      id: number;
      discount_percent: number;
      discount_type: string;
      min_purchase_cents: number;
      max_discount_cents: number | null;
    } | null;
    
    if (!coupon) {
      return c.json({ error: "Invalid or expired coupon" }, 400);
    }
    
    if (orderTotalCents < coupon.min_purchase_cents) {
      return c.json({ error: `Minimum purchase of ${coupon.min_purchase_cents / 100} required` }, 400);
    }
    
    let discountCents = 0;
    if (coupon.discount_type === "percent") {
      discountCents = Math.floor(orderTotalCents * (coupon.discount_percent / 100));
      if (coupon.max_discount_cents && discountCents > coupon.max_discount_cents) {
        discountCents = coupon.max_discount_cents;
      }
    }
    
    return c.json({
      valid: true,
      couponId: coupon.id,
      discountCents,
      discountPercent: coupon.discount_percent,
      finalTotalCents: orderTotalCents - discountCents
    });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Mark coupon as used
app.post("/api/retropass/use-coupon", authMiddleware, async (c) => {
  const user = c.get("user");
  const { couponId, orderId } = await c.req.json();
  
  try {
    await c.env.DB.prepare(
      `UPDATE retropass_coupons 
       SET is_used = 1, used_at = CURRENT_TIMESTAMP, used_on_order_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ? AND is_used = 0`
    ).bind(orderId, couponId, user.id).run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Customize leaderboard appearance
app.post("/api/retropass/customize", authMiddleware, async (c) => {
  const user = c.get("user");
  const { icon, color, title } = await c.req.json();
  
  try {
    // Verify user has active RetroPass
    const subscription = await c.env.DB.prepare(
      "SELECT id FROM retropass_subscriptions WHERE user_id = ? AND status = 'active'"
    ).bind(user.id).first();
    
    if (!subscription) {
      return c.json({ error: "RetroPass subscription required" }, 403);
    }
    
    await c.env.DB.prepare(
      `UPDATE retropass_subscriptions 
       SET leaderboard_icon = ?, leaderboard_color = ?, display_title = ?, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND status = 'active'`
    ).bind(icon || null, color || null, title || null, user.id).run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Get customization options
app.get("/api/retropass/customization-options", async (c) => {
  const icons = [
    { id: "crown", icon: "Crown", name: "Crown" },
    { id: "diamond", icon: "Gem", name: "Diamond" },
    { id: "fire", icon: "Flame", name: "Fire" },
    { id: "star", icon: "Star", name: "Star" },
    { id: "rocket", icon: "Rocket", name: "Rocket" },
    { id: "lightning", icon: "Zap", name: "Lightning" },
    { id: "trophy", icon: "Trophy", name: "Trophy" },
    { id: "gem", icon: "Diamond", name: "Gem" },
    { id: "sparkles", icon: "Sparkles", name: "Sparkles" },
    { id: "gamepad", icon: "Gamepad2", name: "Gamepad" },
    { id: "joystick", icon: "Joystick", name: "Joystick" },
    { id: "alien", icon: "Ghost", name: "Alien" },
    { id: "dragon", icon: "Flame", name: "Dragon" },
    { id: "phoenix", icon: "Bird", name: "Phoenix" },
    { id: "skull", icon: "Skull", name: "Skull" },
    { id: "ninja", icon: "Swords", name: "Ninja" }
  ];
  
  const colors = [
    { id: "gold", hex: "#FFD700", name: "Gold" },
    { id: "diamond", hex: "#B9F2FF", name: "Diamond" },
    { id: "ruby", hex: "#E0115F", name: "Ruby" },
    { id: "emerald", hex: "#50C878", name: "Emerald" },
    { id: "sapphire", hex: "#0F52BA", name: "Sapphire" },
    { id: "amethyst", hex: "#9966CC", name: "Amethyst" },
    { id: "fire", hex: "#FF4500", name: "Fire" },
    { id: "neon", hex: "#39FF14", name: "Neon" },
    { id: "electric", hex: "#7DF9FF", name: "Electric" },
    { id: "sunset", hex: "#FF6B6B", name: "Sunset" }
  ];
  
  const titles = [
    { id: "legend", name: "Legend" },
    { id: "champion", name: "Champion" },
    { id: "master", name: "Master" },
    { id: "elite", name: "Elite" },
    { id: "pro", name: "Pro" },
    { id: "ace", name: "Ace" },
    { id: "hero", name: "Hero" },
    { id: "wizard", name: "Wizard" },
    { id: "phantom", name: "Phantom" },
    { id: "titan", name: "Titan" }
  ];
  
  return c.json({ icons, colors, titles });
});

// Stripe webhook for RetroPass subscription events
app.post("/api/webhooks/retropass", async (c) => {
  if (!c.env.STRIPE_SECRET_KEY || !c.env.STRIPE_WEBHOOK_SECRET) {
    return c.json({ error: "Stripe not configured" }, 500);
  }
  
  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
  const body = await c.req.text();
  const sig = c.req.header("stripe-signature") || "";
  
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, c.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return c.json({ error: "Invalid signature" }, 400);
  }
  
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.metadata?.type !== "retropass") break;
        
        const userId = session.metadata.user_id;
        const subscriptionId = session.subscription as string;
        
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as { current_period_start: number; current_period_end: number };
        
        // Create subscription record
        await c.env.DB.prepare(
          `INSERT INTO retropass_subscriptions 
           (user_id, stripe_subscription_id, stripe_customer_id, status, current_period_start, current_period_end, tickets_granted_this_period, coupons_granted_this_period)
           VALUES (?, ?, ?, 'active', datetime(?, 'unixepoch'), datetime(?, 'unixepoch'), 5000, 5)`
        ).bind(
          userId,
          subscriptionId,
          session.customer as string,
          subscription.current_period_start,
          subscription.current_period_end
        ).run();
        
        // Grant 5000 tickets
        const existingStats = await c.env.DB.prepare(
          "SELECT id FROM user_arcade_stats WHERE user_id = ?"
        ).bind(userId).first();
        
        if (existingStats) {
          await c.env.DB.prepare(
            "UPDATE user_arcade_stats SET total_tickets = total_tickets + 5000, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
          ).bind(userId).run();
        } else {
          await c.env.DB.prepare(
            "INSERT INTO user_arcade_stats (user_id, total_tickets) VALUES (?, 5000)"
          ).bind(userId).run();
        }
        
        // Record ticket transaction
        await c.env.DB.prepare(
          "INSERT INTO ticket_transactions (user_id, amount, transaction_type, description) VALUES (?, 5000, 'retropass_bonus', 'RetroPass monthly bonus')"
        ).bind(userId).run();
        
        // Generate 5 coupons
        const expiresAt = new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000);
        for (let i = 0; i < 5; i++) {
          const code = generateCouponCode();
          await c.env.DB.prepare(
            `INSERT INTO retropass_coupons 
             (user_id, subscription_id, code, discount_percent, expires_at)
             VALUES (?, ?, ?, 15, ?)`
          ).bind(userId, subscriptionId, code, expiresAt.toISOString()).run();
        }
        
        // Auto-grant diamond badge
        const diamondBadge = await c.env.DB.prepare(
          "SELECT id FROM user_badges WHERE user_id = ? AND badge_id = 'diamond'"
        ).bind(userId).first();
        
        if (!diamondBadge) {
          await c.env.DB.prepare(
            "INSERT INTO user_badges (user_id, badge_id, total_spent_at_earn, tickets_awarded) VALUES (?, 'diamond', 0, 0)"
          ).bind(userId).run();
        }
        
        break;
      }
      
      case "invoice.paid": {
        // Subscription renewal - grant monthly benefits
        const invoice = event.data.object as unknown as { subscription: string };
        const subscriptionId = invoice.subscription;
        
        const sub = await c.env.DB.prepare(
          "SELECT * FROM retropass_subscriptions WHERE stripe_subscription_id = ? AND status = 'active'"
        ).bind(subscriptionId).first() as { user_id: string; id: number } | null;
        
        if (!sub) break;
        
        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as { current_period_start: number; current_period_end: number };
        
        // Update period and reset granted amounts
        await c.env.DB.prepare(
          `UPDATE retropass_subscriptions 
           SET current_period_start = datetime(?, 'unixepoch'),
               current_period_end = datetime(?, 'unixepoch'),
               tickets_granted_this_period = 5000,
               coupons_granted_this_period = 5,
               updated_at = CURRENT_TIMESTAMP
           WHERE stripe_subscription_id = ?`
        ).bind(subscription.current_period_start, subscription.current_period_end, subscriptionId).run();
        
        // Grant 5000 tickets
        await c.env.DB.prepare(
          "UPDATE user_arcade_stats SET total_tickets = total_tickets + 5000, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
        ).bind(sub.user_id).run();
        
        await c.env.DB.prepare(
          "INSERT INTO ticket_transactions (user_id, amount, transaction_type, description) VALUES (?, 5000, 'retropass_renewal', 'RetroPass monthly renewal bonus')"
        ).bind(sub.user_id).run();
        
        // Generate 5 new coupons
        const renewalExpiresAt = new Date(subscription.current_period_end * 1000);
        for (let i = 0; i < 5; i++) {
          const code = generateCouponCode();
          await c.env.DB.prepare(
            `INSERT INTO retropass_coupons 
             (user_id, subscription_id, code, discount_percent, expires_at)
             VALUES (?, ?, ?, 15, ?)`
          ).bind(sub.user_id, sub.id, code, renewalExpiresAt.toISOString()).run();
        }
        
        break;
      }
      
      case "customer.subscription.deleted": {
        // Subscription cancelled/expired
        const subscription = event.data.object as Stripe.Subscription;
        
        await c.env.DB.prepare(
          "UPDATE retropass_subscriptions SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE stripe_subscription_id = ?"
        ).bind(subscription.id).run();
        
        break;
      }
    }
    
    return c.json({ received: true });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Admin: Get all RetroPass subscriptions
app.get("/api/admin/retropass/subscriptions", adminMiddleware, async (c) => {
  try {
    const subscriptions = await c.env.DB.prepare(
      `SELECT rs.*, 
              (SELECT COUNT(*) FROM retropass_coupons WHERE subscription_id = rs.id AND is_used = 1) as coupons_used
       FROM retropass_subscriptions rs 
       ORDER BY rs.created_at DESC`
    ).all();
    
    return c.json({ subscriptions: subscriptions.results });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// ==========================================
// MYSTERY BOX SYSTEM
// ==========================================

// Get current month's mystery box
app.get("/api/retropass/mystery-box", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Check if user has active RetroPass
    const subscription = await c.env.DB.prepare(
      `SELECT * FROM retropass_subscriptions WHERE user_id = ? AND status = 'active'`
    ).bind(user.id).first();
    
    if (!subscription) {
      return c.json({ error: "RetroPass subscription required" }, 403);
    }
    
    // Get or create mystery box for this month
    let box = await c.env.DB.prepare(
      `SELECT * FROM mystery_boxes WHERE user_id = ? AND month_year = ?`
    ).bind(user.id, monthYear).first();
    
    if (!box) {
      // Create new mystery box for this month
      await c.env.DB.prepare(
        `INSERT INTO mystery_boxes (user_id, subscription_id, month_year) VALUES (?, ?, ?)`
      ).bind(user.id, subscription.id, monthYear).run();
      
      box = await c.env.DB.prepare(
        `SELECT * FROM mystery_boxes WHERE user_id = ? AND month_year = ?`
      ).bind(user.id, monthYear).first();
    }
    
    return c.json({ box });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Open mystery box
app.post("/api/retropass/mystery-box/open", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const box = await c.env.DB.prepare(
      `SELECT * FROM mystery_boxes WHERE user_id = ? AND month_year = ? AND is_opened = 0`
    ).bind(user.id, monthYear).first();
    
    if (!box) {
      return c.json({ error: "No unopened mystery box available" }, 404);
    }
    
    // Generate random reward
    const rewards = [
      { type: 'tickets', value: '500', chance: 25 },
      { type: 'tickets', value: '1000', chance: 20 },
      { type: 'tickets', value: '2500', chance: 10 },
      { type: 'tickets', value: '5000', chance: 5 },
      { type: 'coupon', value: '10', chance: 15 },
      { type: 'coupon', value: '20', chance: 10 },
      { type: 'coupon', value: '25', chance: 5 },
      { type: 'badge', value: 'mystery_opener', chance: 5 },
      { type: 'frame', value: 'golden_mystery', chance: 3 },
      { type: 'title', value: 'Lucky One', chance: 2 },
    ];
    
    const roll = Math.random() * 100;
    let cumulative = 0;
    let selectedReward = rewards[0];
    
    for (const reward of rewards) {
      cumulative += reward.chance;
      if (roll < cumulative) {
        selectedReward = reward;
        break;
      }
    }
    
    // Apply reward
    if (selectedReward.type === 'tickets') {
      await c.env.DB.prepare(
        `UPDATE user_arcade_stats SET tickets = tickets + ? WHERE user_id = ?`
      ).bind(parseInt(selectedReward.value), user.id).run();
    } else if (selectedReward.type === 'coupon') {
      const code = `MYSTERY${Date.now().toString(36).toUpperCase()}`;
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await c.env.DB.prepare(
        `INSERT INTO retropass_coupons (user_id, subscription_id, code, discount_percent, expires_at) 
         VALUES (?, ?, ?, ?, ?)`
      ).bind(user.id, box.subscription_id, code, parseInt(selectedReward.value), expiresAt).run();
    }
    
    // Update box as opened
    await c.env.DB.prepare(
      `UPDATE mystery_boxes SET is_opened = 1, reward_type = ?, reward_value = ?, opened_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`
    ).bind(selectedReward.type, selectedReward.value, box.id).run();
    
    return c.json({ 
      success: true, 
      reward: selectedReward 
    });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Get mystery box history
app.get("/api/retropass/mystery-box/history", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    
    const boxes = await c.env.DB.prepare(
      `SELECT * FROM mystery_boxes WHERE user_id = ? ORDER BY created_at DESC LIMIT 12`
    ).bind(user.id).all();
    
    return c.json({ boxes: boxes.results });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// ==========================================
// LOGIN STREAK SYSTEM
// ==========================================

// Check in for daily login
app.post("/api/retropass/login-streak/checkin", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const today = new Date().toISOString().split('T')[0];
    
    // Check RetroPass subscription
    const subscription = await c.env.DB.prepare(
      `SELECT * FROM retropass_subscriptions WHERE user_id = ? AND status = 'active'`
    ).bind(user.id).first();
    
    if (!subscription) {
      return c.json({ error: "RetroPass subscription required" }, 403);
    }
    
    // Get or create streak record
    let streak = await c.env.DB.prepare(
      `SELECT * FROM login_streaks WHERE user_id = ?`
    ).bind(user.id).first() as { id: number; user_id: string; current_streak: number; longest_streak: number; last_login_date: string; total_logins: number; tickets_earned: number } | null;
    
    if (!streak) {
      await c.env.DB.prepare(
        `INSERT INTO login_streaks (user_id, current_streak, last_login_date, total_logins) VALUES (?, 1, ?, 1)`
      ).bind(user.id, today).run();
      streak = { id: 0, user_id: user.id, current_streak: 1, longest_streak: 1, last_login_date: today, total_logins: 1, tickets_earned: 0 };
    } else {
      const lastLogin = streak.last_login_date;
      
      if (lastLogin === today) {
        return c.json({ 
          message: "Already checked in today", 
          streak: streak,
          alreadyCheckedIn: true 
        });
      }
      
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      let newStreak = streak.current_streak;
      
      if (lastLogin === yesterday) {
        newStreak = streak.current_streak + 1;
      } else {
        newStreak = 1; // Reset streak
      }
      
      const longestStreak = Math.max(newStreak, streak.longest_streak);
      
      await c.env.DB.prepare(
        `UPDATE login_streaks SET current_streak = ?, longest_streak = ?, last_login_date = ?, total_logins = total_logins + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`
      ).bind(newStreak, longestStreak, today, user.id).run();
      
      streak.current_streak = newStreak;
      streak.longest_streak = longestStreak;
      streak.last_login_date = today;
    }
    
    // Calculate reward based on streak day
    const streakDay = streak.current_streak;
    let rewardType = 'tickets';
    let rewardValue = 50; // Base daily reward
    
    if (streakDay % 30 === 0) {
      rewardType = 'title';
      rewardValue = 1;
    } else if (streakDay % 7 === 0) {
      rewardType = 'tickets';
      rewardValue = 500; // Weekly bonus
    } else if (streakDay >= 100) {
      rewardValue = 200;
    } else if (streakDay >= 30) {
      rewardValue = 150;
    } else if (streakDay >= 7) {
      rewardValue = 100;
    }
    
    // Grant reward
    if (rewardType === 'tickets') {
      await c.env.DB.prepare(
        `UPDATE user_arcade_stats SET tickets = tickets + ? WHERE user_id = ?`
      ).bind(rewardValue, user.id).run();
      
      await c.env.DB.prepare(
        `UPDATE login_streaks SET tickets_earned = tickets_earned + ? WHERE user_id = ?`
      ).bind(rewardValue, user.id).run();
    }
    
    // Log the reward
    await c.env.DB.prepare(
      `INSERT INTO login_rewards (user_id, reward_date, streak_day, reward_type, reward_value, is_claimed) VALUES (?, ?, ?, ?, ?, 1)`
    ).bind(user.id, today, streakDay, rewardType, rewardValue).run();
    
    return c.json({ 
      success: true, 
      streak: streak,
      reward: { type: rewardType, value: rewardValue },
      streakDay: streakDay
    });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Get login streak status
app.get("/api/retropass/login-streak", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    
    const streak = await c.env.DB.prepare(
      `SELECT * FROM login_streaks WHERE user_id = ?`
    ).bind(user.id).first();
    
    const today = new Date().toISOString().split('T')[0];
    const canCheckIn = !streak || streak.last_login_date !== today;
    
    // Get recent rewards
    const recentRewards = await c.env.DB.prepare(
      `SELECT * FROM login_rewards WHERE user_id = ? ORDER BY reward_date DESC LIMIT 7`
    ).bind(user.id).all();
    
    return c.json({ 
      streak: streak || { current_streak: 0, longest_streak: 0, total_logins: 0, tickets_earned: 0 },
      canCheckIn,
      recentRewards: recentRewards.results
    });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// ==========================================
// AVATAR FRAMES SYSTEM
// ==========================================

// Get available avatar frames
app.get("/api/retropass/frames", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    
    // Check RetroPass subscription
    const subscription = await c.env.DB.prepare(
      `SELECT * FROM retropass_subscriptions WHERE user_id = ? AND status = 'active'`
    ).bind(user.id).first();
    
    // Predefined animated frames
    const frames = [
      { id: 'none', name: 'No Frame', frame_type: 'none', css_animation: '', colors: '', is_premium: false },
      { id: 'fire', name: 'Inferno', frame_type: 'animated', css_animation: 'fire-glow', colors: '#ff6b35,#f7931e,#ff0000', is_premium: true },
      { id: 'electric', name: 'Lightning', frame_type: 'animated', css_animation: 'electric-pulse', colors: '#00d4ff,#0099ff,#ffffff', is_premium: true },
      { id: 'rainbow', name: 'Rainbow', frame_type: 'animated', css_animation: 'rainbow-rotate', colors: 'rainbow', is_premium: true },
      { id: 'cosmic', name: 'Cosmic', frame_type: 'animated', css_animation: 'cosmic-glow', colors: '#9b59b6,#3498db,#1abc9c', is_premium: true },
      { id: 'golden', name: 'Golden Aura', frame_type: 'animated', css_animation: 'golden-shimmer', colors: '#ffd700,#ffb347,#ff8c00', is_premium: true },
      { id: 'neon', name: 'Neon Pulse', frame_type: 'animated', css_animation: 'neon-pulse', colors: '#ff00ff,#00ffff,#ff00ff', is_premium: true },
      { id: 'shadow', name: 'Dark Shadow', frame_type: 'animated', css_animation: 'shadow-pulse', colors: '#2c3e50,#34495e,#1a1a2e', is_premium: true },
      { id: 'emerald', name: 'Emerald', frame_type: 'animated', css_animation: 'emerald-glow', colors: '#00ff88,#00cc6a,#009955', is_premium: true },
      { id: 'sakura', name: 'Sakura', frame_type: 'animated', css_animation: 'sakura-fall', colors: '#ffb7c5,#ff69b4,#ff1493', is_premium: true },
      { id: 'ice', name: 'Frozen', frame_type: 'animated', css_animation: 'ice-crystal', colors: '#a5f3fc,#67e8f9,#22d3ee', is_premium: true },
    ];
    
    return c.json({ 
      frames,
      hasRetroPass: !!subscription,
      currentFrame: subscription?.leaderboard_icon || 'none'
    });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Set avatar frame
app.post("/api/retropass/frames/set", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const { frameId } = await c.req.json();
    
    const subscription = await c.env.DB.prepare(
      `SELECT * FROM retropass_subscriptions WHERE user_id = ? AND status = 'active'`
    ).bind(user.id).first();
    
    if (!subscription && frameId !== 'none') {
      return c.json({ error: "RetroPass subscription required for premium frames" }, 403);
    }
    
    // Update user profile with frame
    await c.env.DB.prepare(
      `UPDATE user_profiles SET avatar_preset = ? WHERE user_id = ?`
    ).bind(frameId, user.id).run();
    
    return c.json({ success: true, frameId });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// ==========================================
// TOURNAMENT SYSTEM
// ==========================================

// Get active and upcoming tournaments
app.get("/api/retropass/tournaments", async (c) => {
  try {
    const now = new Date().toISOString();
    
    const tournaments = await c.env.DB.prepare(
      `SELECT t.*, 
              (SELECT COUNT(*) FROM tournament_entries WHERE tournament_id = t.id) as participant_count
       FROM tournaments t 
       WHERE t.end_date > ? OR t.status = 'active'
       ORDER BY t.start_date ASC`
    ).bind(now).all();
    
    return c.json({ tournaments: tournaments.results });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Get tournament details with rankings
app.get("/api/retropass/tournaments/:id", async (c) => {
  try {
    const { id } = c.req.param();
    
    const tournament = await c.env.DB.prepare(
      `SELECT * FROM tournaments WHERE id = ?`
    ).bind(id).first();
    
    if (!tournament) {
      return c.json({ error: "Tournament not found" }, 404);
    }
    
    const rankings = await c.env.DB.prepare(
      `SELECT te.*, up.display_name, up.avatar_preset,
              rs.leaderboard_icon, rs.leaderboard_color
       FROM tournament_entries te
       LEFT JOIN user_profiles up ON te.user_id = up.user_id
       LEFT JOIN retropass_subscriptions rs ON te.user_id = rs.user_id AND rs.status = 'active'
       WHERE te.tournament_id = ?
       ORDER BY te.best_score DESC
       LIMIT 100`
    ).bind(id).all();
    
    return c.json({ tournament, rankings: rankings.results });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Join tournament
app.post("/api/retropass/tournaments/:id/join", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const { id } = c.req.param();
    
    const tournament = await c.env.DB.prepare(
      `SELECT * FROM tournaments WHERE id = ?`
    ).bind(id).first() as { id: number; is_retropass_only: number; max_participants: number; status: string } | null;
    
    if (!tournament) {
      return c.json({ error: "Tournament not found" }, 404);
    }
    
    if (tournament.status !== 'active' && tournament.status !== 'upcoming') {
      return c.json({ error: "Tournament is not accepting entries" }, 400);
    }
    
    // Check RetroPass requirement
    if (tournament.is_retropass_only) {
      const subscription = await c.env.DB.prepare(
        `SELECT * FROM retropass_subscriptions WHERE user_id = ? AND status = 'active'`
      ).bind(user.id).first();
      
      if (!subscription) {
        return c.json({ error: "RetroPass subscription required" }, 403);
      }
    }
    
    // Check if already joined
    const existing = await c.env.DB.prepare(
      `SELECT * FROM tournament_entries WHERE tournament_id = ? AND user_id = ?`
    ).bind(id, user.id).first();
    
    if (existing) {
      return c.json({ message: "Already joined", entry: existing });
    }
    
    // Check max participants
    if (tournament.max_participants) {
      const count = await c.env.DB.prepare(
        `SELECT COUNT(*) as count FROM tournament_entries WHERE tournament_id = ?`
      ).bind(id).first() as { count: number };
      
      if (count.count >= tournament.max_participants) {
        return c.json({ error: "Tournament is full" }, 400);
      }
    }
    
    // Join tournament
    await c.env.DB.prepare(
      `INSERT INTO tournament_entries (tournament_id, user_id) VALUES (?, ?)`
    ).bind(id, user.id).run();
    
    const entry = await c.env.DB.prepare(
      `SELECT * FROM tournament_entries WHERE tournament_id = ? AND user_id = ?`
    ).bind(id, user.id).first();
    
    return c.json({ success: true, entry });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Submit tournament score
app.post("/api/retropass/tournaments/:id/score", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const { id } = c.req.param();
    const { score } = await c.req.json();
    
    const tournament = await c.env.DB.prepare(
      `SELECT * FROM tournaments WHERE id = ? AND status = 'active'`
    ).bind(id).first();
    
    if (!tournament) {
      return c.json({ error: "Tournament not active" }, 400);
    }
    
    const entry = await c.env.DB.prepare(
      `SELECT * FROM tournament_entries WHERE tournament_id = ? AND user_id = ?`
    ).bind(id, user.id).first() as { id: number; best_score: number } | null;
    
    if (!entry) {
      return c.json({ error: "Not joined in tournament" }, 400);
    }
    
    // Update if better score
    if (score > entry.best_score) {
      await c.env.DB.prepare(
        `UPDATE tournament_entries SET best_score = ?, attempts = attempts + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).bind(score, entry.id).run();
    } else {
      await c.env.DB.prepare(
        `UPDATE tournament_entries SET attempts = attempts + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).bind(entry.id).run();
    }
    
    return c.json({ success: true, newBest: score > entry.best_score, score });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Get user's tournament entries
app.get("/api/retropass/my-tournaments", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    
    const entries = await c.env.DB.prepare(
      `SELECT te.*, t.name, t.game_type, t.status, t.prize_tickets, t.prize_badge, t.prize_title, t.end_date
       FROM tournament_entries te
       JOIN tournaments t ON te.tournament_id = t.id
       WHERE te.user_id = ?
       ORDER BY t.end_date DESC`
    ).bind(user.id).all();
    
    return c.json({ entries: entries.results });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Admin: Create tournament
app.post("/api/admin/tournaments", adminMiddleware, async (c) => {
  try {
    const data = await c.req.json();
    
    await c.env.DB.prepare(
      `INSERT INTO tournaments (name, description, game_type, start_date, end_date, prize_tickets, prize_badge, prize_title, max_participants, is_retropass_only)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      data.name,
      data.description || '',
      data.game_type,
      data.start_date,
      data.end_date,
      data.prize_tickets || 0,
      data.prize_badge || null,
      data.prize_title || null,
      data.max_participants || null,
      data.is_retropass_only ? 1 : 0
    ).run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Admin: End tournament and distribute prizes
app.post("/api/admin/tournaments/:id/end", adminMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    
    const tournament = await c.env.DB.prepare(
      `SELECT * FROM tournaments WHERE id = ?`
    ).bind(id).first() as { id: number; prize_tickets: number; prize_badge: string; prize_title: string } | null;
    
    if (!tournament) {
      return c.json({ error: "Tournament not found" }, 404);
    }
    
    // Update rankings
    const entries = await c.env.DB.prepare(
      `SELECT * FROM tournament_entries WHERE tournament_id = ? ORDER BY best_score DESC`
    ).bind(id).all();
    
    let rank = 1;
    for (const entry of entries.results as { id: number; user_id: string }[]) {
      await c.env.DB.prepare(
        `UPDATE tournament_entries SET rank_position = ? WHERE id = ?`
      ).bind(rank, entry.id).run();
      
      // Award prizes to top 3
      if (rank <= 3) {
        const ticketMultiplier = rank === 1 ? 1 : rank === 2 ? 0.5 : 0.25;
        const tickets = Math.floor(tournament.prize_tickets * ticketMultiplier);
        
        if (tickets > 0) {
          await c.env.DB.prepare(
            `UPDATE user_arcade_stats SET tickets = tickets + ? WHERE user_id = ?`
          ).bind(tickets, entry.user_id).run();
        }
        
        // Award badge/title to winner
        if (rank === 1) {
          if (tournament.prize_badge) {
            await c.env.DB.prepare(
              `INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)`
            ).bind(entry.user_id, tournament.prize_badge).run();
          }
        }
      }
      
      rank++;
    }
    
    // Update tournament status
    await c.env.DB.prepare(
      `UPDATE tournaments SET status = 'ended', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(id).run();
    
    return c.json({ success: true, totalParticipants: entries.results.length });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// ==================== ONLINE ARENA ENDPOINTS ====================

// Generate 6-character room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Check if user has RetroPass (required for online play)
async function checkRetroPass(db: D1Database, userId: string): Promise<boolean> {
  const sub = await db.prepare(
    `SELECT id FROM retropass_subscriptions WHERE user_id = ? AND status = 'active'`
  ).bind(userId).first();
  return !!sub;
}

// Join matchmaking queue
app.post("/api/online/matchmaking/join", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const userId = user?.id;
    const { gameType } = await c.req.json<{ gameType: string }>();
    
    if (!gameType) {
      return c.json({ error: "Game type required" }, 400);
    }
    
    // Check RetroPass
    const hasRetroPass = await checkRetroPass(c.env.DB, userId);
    if (!hasRetroPass) {
      return c.json({ error: "RetroPass subscription required for online play" }, 403);
    }
    
    // Check if already in queue
    const existing = await c.env.DB.prepare(
      `SELECT id FROM online_matchmaking_queue WHERE user_id = ? AND status = 'searching'`
    ).bind(userId).first();
    
    if (existing) {
      return c.json({ error: "Already in queue" }, 400);
    }
    
    // Try to find a match
    const opponent = await c.env.DB.prepare(
      `SELECT id, user_id FROM online_matchmaking_queue 
       WHERE game_type = ? AND status = 'searching' AND user_id != ?
       ORDER BY created_at ASC LIMIT 1`
    ).bind(gameType, userId).first() as { id: number; user_id: string } | null;
    
    if (opponent) {
      // Match found! Create room
      const roomCode = generateRoomCode();
      
      // Create room
      await c.env.DB.prepare(
        `INSERT INTO online_game_rooms (room_code, game_type, status, player1_id, player2_id, game_state)
         VALUES (?, ?, 'playing', ?, ?, ?)`
      ).bind(roomCode, gameType, opponent.user_id, userId, JSON.stringify({ turn: 1, board: null })).run();
      
      // Update opponent queue status
      await c.env.DB.prepare(
        `UPDATE online_matchmaking_queue SET status = 'matched', matched_room_code = ? WHERE id = ?`
      ).bind(roomCode, opponent.id).run();
      
      // Add current user to queue as matched
      await c.env.DB.prepare(
        `INSERT INTO online_matchmaking_queue (user_id, game_type, status, matched_room_code)
         VALUES (?, ?, 'matched', ?)`
      ).bind(userId, gameType, roomCode).run();
      
      return c.json({ matched: true, roomCode, opponentId: opponent.user_id });
    }
    
    // No match, add to queue
    await c.env.DB.prepare(
      `INSERT INTO online_matchmaking_queue (user_id, game_type, status)
       VALUES (?, ?, 'searching')`
    ).bind(userId, gameType).run();
    
    return c.json({ matched: false, message: "Searching for opponent..." });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Leave matchmaking queue
app.post("/api/online/matchmaking/leave", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const userId = user?.id;
    
    await c.env.DB.prepare(
      `UPDATE online_matchmaking_queue SET status = 'cancelled' WHERE user_id = ? AND status = 'searching'`
    ).bind(userId).run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Check matchmaking status
app.get("/api/online/matchmaking/status", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const userId = user?.id;
    
    const entry = await c.env.DB.prepare(
      `SELECT status, game_type, matched_room_code FROM online_matchmaking_queue 
       WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`
    ).bind(userId).first() as { status: string; game_type: string; matched_room_code: string | null } | null;
    
    if (!entry) {
      return c.json({ inQueue: false });
    }
    
    if (entry.status === 'matched' && entry.matched_room_code) {
      return c.json({ inQueue: false, matched: true, roomCode: entry.matched_room_code });
    }
    
    if (entry.status === 'searching') {
      // Count players in queue for this game type
      const queueCount = await c.env.DB.prepare(
        `SELECT COUNT(*) as count FROM online_matchmaking_queue WHERE game_type = ? AND status = 'searching'`
      ).bind(entry.game_type).first() as { count: number };
      
      return c.json({ inQueue: true, gameType: entry.game_type, playersInQueue: queueCount.count });
    }
    
    return c.json({ inQueue: false });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Create private room
app.post("/api/online/rooms", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const userId = user?.id;
    const { gameType } = await c.req.json<{ gameType: string }>();
    
    if (!gameType) {
      return c.json({ error: "Game type required" }, 400);
    }
    
    const hasRetroPass = await checkRetroPass(c.env.DB, userId);
    if (!hasRetroPass) {
      return c.json({ error: "RetroPass subscription required" }, 403);
    }
    
    const roomCode = generateRoomCode();
    
    await c.env.DB.prepare(
      `INSERT INTO online_game_rooms (room_code, game_type, status, player1_id, game_state)
       VALUES (?, ?, 'waiting', ?, ?)`
    ).bind(roomCode, gameType, userId, JSON.stringify({ turn: 1, board: null })).run();
    
    return c.json({ roomCode, gameType });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Join room by code
app.post("/api/online/rooms/:code/join", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const userId = user?.id;
    const { code } = c.req.param();
    
    const hasRetroPass = await checkRetroPass(c.env.DB, userId);
    if (!hasRetroPass) {
      return c.json({ error: "RetroPass subscription required" }, 403);
    }
    
    const room = await c.env.DB.prepare(
      `SELECT * FROM online_game_rooms WHERE room_code = ?`
    ).bind(code).first() as { id: number; status: string; player1_id: string; player2_id: string | null; game_type: string } | null;
    
    if (!room) {
      return c.json({ error: "Room not found" }, 404);
    }
    
    if (room.status !== 'waiting') {
      return c.json({ error: "Room is not available" }, 400);
    }
    
    if (room.player1_id === userId) {
      return c.json({ error: "Cannot join your own room" }, 400);
    }
    
    // Join room
    await c.env.DB.prepare(
      `UPDATE online_game_rooms SET player2_id = ?, status = 'playing', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(userId, room.id).run();
    
    return c.json({ success: true, gameType: room.game_type, opponentId: room.player1_id });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Get room state
app.get("/api/online/rooms/:code", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const userId = user?.id;
    const { code } = c.req.param();
    
    const room = await c.env.DB.prepare(
      `SELECT * FROM online_game_rooms WHERE room_code = ?`
    ).bind(code).first();
    
    if (!room) {
      return c.json({ error: "Room not found" }, 404);
    }
    
    // Get player profiles
    const player1Profile = await c.env.DB.prepare(
      `SELECT username, display_name, avatar_preset FROM user_profiles WHERE user_id = ?`
    ).bind(room.player1_id).first();
    
    let player2Profile = null;
    if (room.player2_id) {
      player2Profile = await c.env.DB.prepare(
        `SELECT username, display_name, avatar_preset FROM user_profiles WHERE user_id = ?`
      ).bind(room.player2_id).first();
    }
    
    return c.json({
      roomCode: room.room_code,
      gameType: room.game_type,
      status: room.status,
      player1: { id: room.player1_id, ...player1Profile },
      player2: room.player2_id ? { id: room.player2_id, ...player2Profile } : null,
      gameState: JSON.parse(room.game_state as string || '{}'),
      winnerId: room.winner_id,
      isPlayer1: room.player1_id === userId,
      isPlayer2: room.player2_id === userId,
      isYourTurn: room.status === 'playing' && (
        (JSON.parse(room.game_state as string || '{}').turn === 1 && room.player1_id === userId) ||
        (JSON.parse(room.game_state as string || '{}').turn === 2 && room.player2_id === userId)
      )
    });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Make a move
app.post("/api/online/rooms/:code/move", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const userId = user?.id;
    const { code } = c.req.param();
    const { move } = await c.req.json<{ move: unknown }>();
    
    const room = await c.env.DB.prepare(
      `SELECT * FROM online_game_rooms WHERE room_code = ?`
    ).bind(code).first() as { 
      id: number; 
      status: string; 
      player1_id: string; 
      player2_id: string | null; 
      game_type: string;
      game_state: string;
    } | null;
    
    if (!room) {
      return c.json({ error: "Room not found" }, 404);
    }
    
    if (room.status !== 'playing') {
      return c.json({ error: "Game is not in progress" }, 400);
    }
    
    const isPlayer1 = room.player1_id === userId;
    const isPlayer2 = room.player2_id === userId;
    
    if (!isPlayer1 && !isPlayer2) {
      return c.json({ error: "You are not a player in this game" }, 403);
    }
    
    const gameState = JSON.parse(room.game_state || '{}');
    const playerNumber = isPlayer1 ? 1 : 2;
    
    if (gameState.turn !== playerNumber) {
      return c.json({ error: "Not your turn" }, 400);
    }
    
    // Update game state with move
    gameState.lastMove = move;
    gameState.turn = playerNumber === 1 ? 2 : 1;
    gameState.moves = (gameState.moves || 0) + 1;
    
    // The actual game logic validation would be done on client side
    // Server just stores the state and broadcasts
    
    await c.env.DB.prepare(
      `UPDATE online_game_rooms SET game_state = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(JSON.stringify(gameState), room.id).run();
    
    return c.json({ success: true, gameState });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// End game (report winner)
app.post("/api/online/rooms/:code/end", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const userId = user?.id;
    const { code } = c.req.param();
    const { winnerId, isDraw } = await c.req.json<{ winnerId?: string; isDraw?: boolean }>();
    
    const room = await c.env.DB.prepare(
      `SELECT * FROM online_game_rooms WHERE room_code = ?`
    ).bind(code).first() as { 
      id: number; 
      player1_id: string; 
      player2_id: string | null; 
      game_type: string;
    } | null;
    
    if (!room) {
      return c.json({ error: "Room not found" }, 404);
    }
    
    const isPlayer = room.player1_id === userId || room.player2_id === userId;
    if (!isPlayer) {
      return c.json({ error: "Not a player in this game" }, 403);
    }
    
    // Update room
    await c.env.DB.prepare(
      `UPDATE online_game_rooms SET status = 'ended', winner_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(isDraw ? null : winnerId, room.id).run();
    
    // Record match history
    const player1Result = isDraw ? 'draw' : (winnerId === room.player1_id ? 'win' : 'loss');
    const player2Result = isDraw ? 'draw' : (winnerId === room.player2_id ? 'win' : 'loss');
    
    await c.env.DB.prepare(
      `INSERT INTO online_match_history (room_id, user_id, game_type, opponent_id, result, rating_change)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(room.id, room.player1_id, room.game_type, room.player2_id, player1Result, player1Result === 'win' ? 25 : player1Result === 'loss' ? -20 : 0).run();
    
    if (room.player2_id) {
      await c.env.DB.prepare(
        `INSERT INTO online_match_history (room_id, user_id, game_type, opponent_id, result, rating_change)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(room.id, room.player2_id, room.game_type, room.player1_id, player2Result, player2Result === 'win' ? 25 : player2Result === 'loss' ? -20 : 0).run();
    }
    
    // Update player stats
    for (const [playerId, result] of [[room.player1_id, player1Result], [room.player2_id, player2Result]] as [string, string][]) {
      if (!playerId) continue;
      
      const existing = await c.env.DB.prepare(
        `SELECT id FROM online_player_stats WHERE user_id = ? AND game_type = ?`
      ).bind(playerId, room.game_type).first();
      
      if (existing) {
        const winIncrement = result === 'win' ? 1 : 0;
        const lossIncrement = result === 'loss' ? 1 : 0;
        const drawIncrement = result === 'draw' ? 1 : 0;
        const ratingChange = result === 'win' ? 25 : result === 'loss' ? -20 : 0;
        
        await c.env.DB.prepare(
          `UPDATE online_player_stats SET 
           wins = wins + ?, losses = losses + ?, draws = draws + ?, rating = MAX(0, rating + ?), 
           updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND game_type = ?`
        ).bind(winIncrement, lossIncrement, drawIncrement, ratingChange, playerId, room.game_type).run();
      } else {
        await c.env.DB.prepare(
          `INSERT INTO online_player_stats (user_id, game_type, wins, losses, draws, rating)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(playerId, room.game_type, result === 'win' ? 1 : 0, result === 'loss' ? 1 : 0, result === 'draw' ? 1 : 0, 1000 + (result === 'win' ? 25 : result === 'loss' ? -20 : 0)).run();
      }
    }
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Get player's online stats
app.get("/api/online/stats", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const userId = user?.id;
    
    const stats = await c.env.DB.prepare(
      `SELECT * FROM online_player_stats WHERE user_id = ?`
    ).bind(userId).all();
    
    const recentMatches = await c.env.DB.prepare(
      `SELECT omh.*, up.username, up.display_name, up.avatar_preset 
       FROM online_match_history omh
       LEFT JOIN user_profiles up ON up.user_id = omh.opponent_id
       WHERE omh.user_id = ?
       ORDER BY omh.created_at DESC LIMIT 10`
    ).bind(userId).all();
    
    // Calculate totals
    let totalWins = 0, totalLosses = 0, totalDraws = 0;
    for (const stat of stats.results as { wins: number; losses: number; draws: number }[]) {
      totalWins += stat.wins;
      totalLosses += stat.losses;
      totalDraws += stat.draws;
    }
    
    return c.json({
      gameStats: stats.results,
      recentMatches: recentMatches.results,
      totals: { wins: totalWins, losses: totalLosses, draws: totalDraws, games: totalWins + totalLosses + totalDraws }
    });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Get online leaderboard for a specific game
app.get("/api/online/leaderboard/:gameType", async (c) => {
  try {
    const { gameType } = c.req.param();
    
    const leaderboard = await c.env.DB.prepare(
      `SELECT ops.*, up.username, up.display_name, up.avatar_preset
       FROM online_player_stats ops
       LEFT JOIN user_profiles up ON up.user_id = ops.user_id
       WHERE ops.game_type = ?
       ORDER BY ops.rating DESC
       LIMIT 50`
    ).bind(gameType).all();
    
    return c.json({ leaderboard: leaderboard.results });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

export default app;
