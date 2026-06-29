-- Migration 0001: auth identity table for self-hosted Google OAuth.
-- Replaces the Mocha Users Service. The app uses users.id as the user_id across
-- all other tables (user_profiles.user_id, listings.user_id, etc.).
-- Apply AFTER importing migration/d1_dump.sql.

CREATE TABLE IF NOT EXISTS users (
  id                TEXT PRIMARY KEY,
  email             TEXT NOT NULL,
  google_sub        TEXT NOT NULL UNIQUE,
  google_user_data  TEXT,            -- JSON { name, given_name, family_name, picture, email, email_verified, ... }
  created_at        TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at        TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  last_signed_in_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub);

-- Seed the identities exported from Mocha, PRESERVING original ids so existing
-- rows (e.g. the admin's user_arcade_stats) stay linked. Login upserts by google_sub.
INSERT OR IGNORE INTO users (id, email, google_sub, google_user_data, created_at, updated_at, last_signed_in_at) VALUES
  ('019c8233-914f-7da4-9ba4-d5917b2a42b2', 'mathbm2513@gmail.com', '117168847290239370967', '{"name":"Matheus Batista Marques","hd":null,"sub":"117168847290239370967","email":"mathbm2513@gmail.com","email_verified":true,"family_name":"Batista Marques","given_name":"Matheus","picture":"https://lh3.googleusercontent.com/a/ACg8ocJuT9JUBXsj0DhjhsDdl_MRHxtAlJ1Sp5tFWMVdDMdn2x2yCg=s96-c"}', '2026-02-21T21:55:43Z', '2026-02-21T21:55:43Z', '2026-02-21T21:55:43Z'),
  ('019c84ba-c974-7f2d-8642-2c9cda27e7b1', 'matheusbmarques13@gmail.com', '118036498503531510651', '{"name":"Matheus Batista Marques","hd":null,"sub":"118036498503531510651","email":"matheusbmarques13@gmail.com","email_verified":true,"family_name":"Batista Marques","given_name":"Matheus","picture":"https://lh3.googleusercontent.com/a/ACg8ocKNM01m5p277aGZK4-E3Kyy5eZv_aNOtuc4rPiaFAf4YqHMxQ=s96-c"}', '2026-02-22T09:42:39Z', '2026-03-22T11:53:48Z', '2026-03-22T11:53:48Z'),
  ('019c805a-3295-78be-83f7-350e706be0c7', 'retromynd@gmail.com', '118205663441854214578', '{"name":"retromynd","hd":null,"sub":"118205663441854214578","email":"retromynd@gmail.com","email_verified":true,"family_name":null,"given_name":"retromynd","picture":"https://lh3.googleusercontent.com/a/ACg8ocIeaaX66FPAExAb4byz9jvfUaryr5qBZusHv7pWilGSH5u2_Vk=s96-c"}', '2026-02-21T13:18:40Z', '2026-03-22T20:05:54Z', '2026-03-22T20:05:54Z');
