PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE _mocha_migrations (
number     INTEGER UNIQUE,
up_sql     TEXT NOT NULL,
down_sql   TEXT NOT NULL,
applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(1,replace('\nCREATE TABLE wishlists (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id TEXT NOT NULL,\n  product_id TEXT NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE UNIQUE INDEX idx_wishlists_user_product ON wishlists(user_id, product_id);\nCREATE INDEX idx_wishlists_user_id ON wishlists(user_id);\n','\n',char(10)),replace('\nDROP INDEX idx_wishlists_user_id;\nDROP INDEX idx_wishlists_user_product;\nDROP TABLE wishlists;\n','\n',char(10)),'2026-02-21 12:37:01');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(2,replace('\nCREATE TABLE listings (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id TEXT NOT NULL,\n  title TEXT NOT NULL,\n  description TEXT,\n  price_cents INTEGER NOT NULL,\n  category TEXT NOT NULL,\n  condition TEXT NOT NULL,\n  images TEXT,\n  status TEXT DEFAULT ''active'',\n  location TEXT,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_listings_user_id ON listings(user_id);\nCREATE INDEX idx_listings_category ON listings(category);\nCREATE INDEX idx_listings_status ON listings(status);\nCREATE INDEX idx_listings_created_at ON listings(created_at);\n','\n',char(10)),replace('\nDROP INDEX idx_listings_created_at;\nDROP INDEX idx_listings_status;\nDROP INDEX idx_listings_category;\nDROP INDEX idx_listings_user_id;\nDROP TABLE listings;\n','\n',char(10)),'2026-02-21 12:37:02');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(3,replace('\nCREATE TABLE conversations (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  listing_id INTEGER NOT NULL,\n  buyer_id TEXT NOT NULL,\n  seller_id TEXT NOT NULL,\n  last_message_at TIMESTAMP,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_conversations_buyer ON conversations(buyer_id);\nCREATE INDEX idx_conversations_seller ON conversations(seller_id);\nCREATE INDEX idx_conversations_listing ON conversations(listing_id);\n\nCREATE TABLE messages (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  conversation_id INTEGER NOT NULL,\n  sender_id TEXT NOT NULL,\n  content TEXT NOT NULL,\n  is_read INTEGER DEFAULT 0,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_messages_conversation ON messages(conversation_id);\nCREATE INDEX idx_messages_sender ON messages(sender_id);\n','\n',char(10)),replace('\nDROP INDEX idx_messages_sender;\nDROP INDEX idx_messages_conversation;\nDROP TABLE messages;\n\nDROP INDEX idx_conversations_listing;\nDROP INDEX idx_conversations_seller;\nDROP INDEX idx_conversations_buyer;\nDROP TABLE conversations;\n','\n',char(10)),'2026-02-21 12:37:02');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(4,replace('\nCREATE TABLE products (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  description TEXT,\n  base_price_cents INTEGER NOT NULL,\n  category TEXT NOT NULL,\n  images TEXT,\n  is_featured BOOLEAN DEFAULT 0,\n  is_active BOOLEAN DEFAULT 1,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_products_category ON products(category);\nCREATE INDEX idx_products_is_active ON products(is_active);\nCREATE INDEX idx_products_is_featured ON products(is_featured);\n','\n',char(10)),replace('\nDROP INDEX idx_products_is_featured;\nDROP INDEX idx_products_is_active;\nDROP INDEX idx_products_category;\nDROP TABLE products;\n','\n',char(10)),'2026-02-21 12:37:02');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(5,replace('\nCREATE TABLE product_variants (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  product_id INTEGER NOT NULL,\n  name TEXT,\n  size TEXT,\n  color TEXT,\n  color_hex TEXT,\n  sku TEXT,\n  price_cents INTEGER,\n  stock_quantity INTEGER DEFAULT 0,\n  is_available BOOLEAN DEFAULT 1,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_variants_product_id ON product_variants(product_id);\nCREATE INDEX idx_variants_sku ON product_variants(sku);\nCREATE INDEX idx_variants_is_available ON product_variants(is_available);\n','\n',char(10)),replace('\nDROP INDEX idx_variants_is_available;\nDROP INDEX idx_variants_sku;\nDROP INDEX idx_variants_product_id;\nDROP TABLE product_variants;\n','\n',char(10)),'2026-02-21 12:37:02');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(6,replace('\nALTER TABLE listings ADD COLUMN listing_type TEXT DEFAULT ''item'';\nALTER TABLE listings ADD COLUMN game_platform TEXT;\nALTER TABLE listings ADD COLUMN account_level TEXT;\nALTER TABLE listings ADD COLUMN account_rank TEXT;\nALTER TABLE listings ADD COLUMN account_server TEXT;\n\nCREATE INDEX idx_listings_type ON listings(listing_type);\n','\n',char(10)),replace('\nDROP INDEX idx_listings_type;\nALTER TABLE listings DROP COLUMN account_server;\nALTER TABLE listings DROP COLUMN account_rank;\nALTER TABLE listings DROP COLUMN account_level;\nALTER TABLE listings DROP COLUMN game_platform;\nALTER TABLE listings DROP COLUMN listing_type;\n','\n',char(10)),'2026-02-21 12:37:02');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(7,replace('\nCREATE TABLE price_alerts (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id TEXT NOT NULL,\n  listing_id INTEGER NOT NULL,\n  target_price_cents INTEGER NOT NULL,\n  is_active BOOLEAN DEFAULT 1,\n  triggered_at DATETIME,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_price_alerts_user ON price_alerts(user_id);\nCREATE INDEX idx_price_alerts_listing ON price_alerts(listing_id);\nCREATE INDEX idx_price_alerts_active ON price_alerts(is_active);\n','\n',char(10)),replace('\nDROP INDEX idx_price_alerts_active;\nDROP INDEX idx_price_alerts_listing;\nDROP INDEX idx_price_alerts_user;\nDROP TABLE price_alerts;\n','\n',char(10)),'2026-02-21 12:37:02');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(8,replace('\nCREATE TABLE suppliers (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  type TEXT NOT NULL,\n  api_key TEXT,\n  api_secret TEXT,\n  base_url TEXT,\n  default_margin_percent INTEGER DEFAULT 30,\n  shipping_days_min INTEGER DEFAULT 7,\n  shipping_days_max INTEGER DEFAULT 21,\n  is_active BOOLEAN DEFAULT 1,\n  settings TEXT,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE TABLE dropship_products (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  supplier_id INTEGER NOT NULL,\n  external_id TEXT NOT NULL,\n  name TEXT NOT NULL,\n  description TEXT,\n  category TEXT,\n  cost_cents INTEGER NOT NULL,\n  price_cents INTEGER NOT NULL,\n  margin_percent INTEGER,\n  images TEXT,\n  variants TEXT,\n  stock_quantity INTEGER DEFAULT 0,\n  is_active BOOLEAN DEFAULT 1,\n  external_url TEXT,\n  last_synced_at TIMESTAMP,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE TABLE orders (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id TEXT NOT NULL,\n  status TEXT DEFAULT ''pending'',\n  subtotal_cents INTEGER NOT NULL,\n  shipping_cents INTEGER DEFAULT 0,\n  total_cents INTEGER NOT NULL,\n  profit_cents INTEGER DEFAULT 0,\n  shipping_name TEXT,\n  shipping_address TEXT,\n  shipping_city TEXT,\n  shipping_state TEXT,\n  shipping_zip TEXT,\n  shipping_country TEXT,\n  stripe_payment_id TEXT,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE TABLE order_items (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  order_id INTEGER NOT NULL,\n  product_id INTEGER NOT NULL,\n  supplier_id INTEGER NOT NULL,\n  quantity INTEGER NOT NULL,\n  unit_price_cents INTEGER NOT NULL,\n  unit_cost_cents INTEGER NOT NULL,\n  variant_info TEXT,\n  supplier_order_id TEXT,\n  supplier_status TEXT,\n  tracking_number TEXT,\n  tracking_url TEXT,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_suppliers_active ON suppliers(is_active);\nCREATE INDEX idx_dropship_products_supplier ON dropship_products(supplier_id);\nCREATE INDEX idx_dropship_products_category ON dropship_products(category);\nCREATE INDEX idx_dropship_products_active ON dropship_products(is_active);\nCREATE INDEX idx_orders_user ON orders(user_id);\nCREATE INDEX idx_orders_status ON orders(status);\nCREATE INDEX idx_order_items_order ON order_items(order_id);\nCREATE INDEX idx_order_items_supplier ON order_items(supplier_id);\n','\n',char(10)),replace('\nDROP INDEX idx_order_items_supplier;\nDROP INDEX idx_order_items_order;\nDROP INDEX idx_orders_status;\nDROP INDEX idx_orders_user;\nDROP INDEX idx_dropship_products_active;\nDROP INDEX idx_dropship_products_category;\nDROP INDEX idx_dropship_products_supplier;\nDROP INDEX idx_suppliers_active;\nDROP TABLE order_items;\nDROP TABLE orders;\nDROP TABLE dropship_products;\nDROP TABLE suppliers;\n','\n',char(10)),'2026-02-21 12:37:02');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(9,replace('\n-- User badges earned\nCREATE TABLE user_badges (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id TEXT NOT NULL,\n  badge_id TEXT NOT NULL,\n  earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n  total_spent_at_earn REAL NOT NULL,\n  tickets_awarded INTEGER NOT NULL,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n  UNIQUE(user_id, badge_id)\n);\n\nCREATE INDEX idx_user_badges_user ON user_badges(user_id);\n\n-- User ticket balance and stats\nCREATE TABLE user_arcade_stats (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id TEXT NOT NULL UNIQUE,\n  total_tickets INTEGER DEFAULT 0,\n  tickets_spent INTEGER DEFAULT 0,\n  total_purchase_amount REAL DEFAULT 0,\n  games_played INTEGER DEFAULT 0,\n  high_scores TEXT,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_user_arcade_stats_user ON user_arcade_stats(user_id);\n\n-- Ticket transactions history\nCREATE TABLE ticket_transactions (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id TEXT NOT NULL,\n  amount INTEGER NOT NULL,\n  transaction_type TEXT NOT NULL,\n  description TEXT,\n  reference_id TEXT,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_ticket_transactions_user ON ticket_transactions(user_id);\n','\n',char(10)),replace('\nDROP INDEX idx_ticket_transactions_user;\nDROP TABLE ticket_transactions;\nDROP INDEX idx_user_arcade_stats_user;\nDROP TABLE user_arcade_stats;\nDROP INDEX idx_user_badges_user;\nDROP TABLE user_badges;\n','\n',char(10)),'2026-02-21 12:37:02');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(10,replace('\n-- Badges available in the arcade\nCREATE TABLE arcade_badges (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  description TEXT,\n  icon TEXT NOT NULL,\n  rarity TEXT NOT NULL DEFAULT ''common'',\n  tickets_required INTEGER NOT NULL DEFAULT 0,\n  game_type TEXT,\n  score_required INTEGER,\n  games_required INTEGER,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Game session history\nCREATE TABLE game_sessions (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id TEXT NOT NULL,\n  game_type TEXT NOT NULL,\n  score INTEGER NOT NULL DEFAULT 0,\n  tickets_earned INTEGER NOT NULL DEFAULT 0,\n  duration_seconds INTEGER,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Indexes\nCREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);\nCREATE INDEX idx_game_sessions_game_type ON game_sessions(game_type);\n\n-- Seed initial badges\nINSERT INTO arcade_badges (name, description, icon, rarity, tickets_required, game_type, score_required, games_required) VALUES\n(''Primeiro Passo'', ''Jogue seu primeiro jogo no arcade'', ''gamepad-2'', ''common'', 0, NULL, NULL, 1),\n(''Colecionador de Tickets'', ''Acumule 100 tickets'', ''ticket'', ''common'', 100, NULL, NULL, NULL),\n(''Mestre do 2048'', ''Alcance 2048 no jogo'', ''square'', ''rare'', 0, ''2048'', 2048, NULL),\n(''Serpente Veloz'', ''Consiga 50 pontos no Snake'', ''zap'', ''uncommon'', 0, ''snake'', 50, NULL),\n(''Destruidor de Blocos'', ''Complete 3 níveis no Breakout'', ''layout-grid'', ''uncommon'', 0, ''breakout'', 3, NULL),\n(''Memória Perfeita'', ''Complete o Memory Match sem erros'', ''brain'', ''rare'', 0, ''memory'', 100, NULL),\n(''Pássaro Voador'', ''Passe 20 obstáculos no Pixel Bird'', ''bird'', ''uncommon'', 0, ''flappy'', 20, NULL),\n(''Tetris Master'', ''Limpe 10 linhas no Neon Blocks'', ''layers'', ''uncommon'', 0, ''tetris'', 10, NULL),\n(''Viciado em Jogos'', ''Jogue 50 partidas'', ''flame'', ''rare'', 0, NULL, NULL, 50),\n(''Lenda do Arcade'', ''Jogue 100 partidas e acumule 500 tickets'', ''crown'', ''legendary'', 500, NULL, NULL, 100),\n(''Rico em Tickets'', ''Acumule 1000 tickets'', ''gem'', ''epic'', 1000, NULL, NULL, NULL),\n(''Maratonista'', ''Jogue 10 partidas em um dia'', ''timer'', ''uncommon'', 0, NULL, NULL, 10);\n','\n',char(10)),replace('\nDROP INDEX idx_game_sessions_game_type;\nDROP INDEX idx_game_sessions_user_id;\nDROP TABLE game_sessions;\nDROP TABLE arcade_badges;\n','\n',char(10)),'2026-02-21 21:53:03');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(11,replace('\n-- Secure account transactions with escrow system\nCREATE TABLE account_transactions (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  listing_id INTEGER NOT NULL,\n  buyer_id TEXT NOT NULL,\n  seller_id TEXT NOT NULL,\n  amount_cents INTEGER NOT NULL,\n  platform_fee_cents INTEGER DEFAULT 0,\n  seller_payout_cents INTEGER NOT NULL,\n  status TEXT DEFAULT ''pending_payment'',\n  stripe_payment_intent_id TEXT,\n  stripe_transfer_id TEXT,\n  delivery_deadline_at DATETIME,\n  auto_release_at DATETIME,\n  delivered_at DATETIME,\n  confirmed_at DATETIME,\n  completed_at DATETIME,\n  cancelled_at DATETIME,\n  cancellation_reason TEXT,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_account_transactions_buyer ON account_transactions(buyer_id);\nCREATE INDEX idx_account_transactions_seller ON account_transactions(seller_id);\nCREATE INDEX idx_account_transactions_status ON account_transactions(status);\nCREATE INDEX idx_account_transactions_listing ON account_transactions(listing_id);\n\n-- Secure account credentials (revealed only after payment)\nCREATE TABLE account_credentials (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  listing_id INTEGER NOT NULL UNIQUE,\n  login_email TEXT,\n  login_username TEXT,\n  login_password TEXT,\n  recovery_email TEXT,\n  recovery_phone TEXT,\n  additional_info TEXT,\n  is_revealed BOOLEAN DEFAULT 0,\n  revealed_at DATETIME,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_account_credentials_listing ON account_credentials(listing_id);\n\n-- Secure transaction messages\nCREATE TABLE transaction_messages (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  transaction_id INTEGER NOT NULL,\n  sender_id TEXT NOT NULL,\n  message_type TEXT DEFAULT ''text'',\n  content TEXT NOT NULL,\n  is_system BOOLEAN DEFAULT 0,\n  is_read BOOLEAN DEFAULT 0,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_transaction_messages_transaction ON transaction_messages(transaction_id);\n\n-- Transaction disputes\nCREATE TABLE transaction_disputes (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  transaction_id INTEGER NOT NULL UNIQUE,\n  opened_by TEXT NOT NULL,\n  reason TEXT NOT NULL,\n  description TEXT,\n  evidence_urls TEXT,\n  status TEXT DEFAULT ''open'',\n  resolution TEXT,\n  resolved_by TEXT,\n  resolved_at DATETIME,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_transaction_disputes_transaction ON transaction_disputes(transaction_id);\nCREATE INDEX idx_transaction_disputes_status ON transaction_disputes(status);\n','\n',char(10)),replace('\nDROP INDEX idx_transaction_disputes_status;\nDROP INDEX idx_transaction_disputes_transaction;\nDROP TABLE transaction_disputes;\n\nDROP INDEX idx_transaction_messages_transaction;\nDROP TABLE transaction_messages;\n\nDROP INDEX idx_account_credentials_listing;\nDROP TABLE account_credentials;\n\nDROP INDEX idx_account_transactions_listing;\nDROP INDEX idx_account_transactions_status;\nDROP INDEX idx_account_transactions_seller;\nDROP INDEX idx_account_transactions_buyer;\nDROP TABLE account_transactions;\n','\n',char(10)),'2026-02-21 21:53:03');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(12,replace('\nCREATE TABLE user_profiles (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id TEXT NOT NULL UNIQUE,\n  username TEXT UNIQUE,\n  display_name TEXT,\n  avatar_url TEXT,\n  avatar_preset TEXT DEFAULT ''gameboy'',\n  bio TEXT,\n  theme_color TEXT DEFAULT ''#E673AA'',\n  favorite_game TEXT,\n  display_badges TEXT,\n  is_public BOOLEAN DEFAULT 1,\n  total_games_played INTEGER DEFAULT 0,\n  total_score INTEGER DEFAULT 0,\n  profile_views INTEGER DEFAULT 0,\n  last_seen_at DATETIME,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);\nCREATE INDEX idx_user_profiles_username ON user_profiles(username);\n','\n',char(10)),replace('\nDROP INDEX idx_user_profiles_username;\nDROP INDEX idx_user_profiles_user_id;\nDROP TABLE user_profiles;\n','\n',char(10)),'2026-02-23 02:42:22');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(13,replace('\n-- RetroPass subscriptions table\nCREATE TABLE retropass_subscriptions (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id TEXT NOT NULL UNIQUE,\n  stripe_subscription_id TEXT,\n  stripe_customer_id TEXT,\n  status TEXT DEFAULT ''active'',\n  plan_type TEXT DEFAULT ''monthly'',\n  price_cents INTEGER DEFAULT 499,\n  current_period_start DATETIME,\n  current_period_end DATETIME,\n  tickets_granted_this_period INTEGER DEFAULT 0,\n  coupons_granted_this_period INTEGER DEFAULT 0,\n  leaderboard_icon TEXT,\n  leaderboard_color TEXT,\n  display_title TEXT,\n  cancelled_at DATETIME,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n-- RetroPass coupons table\nCREATE TABLE retropass_coupons (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id TEXT NOT NULL,\n  subscription_id INTEGER NOT NULL,\n  code TEXT NOT NULL UNIQUE,\n  discount_percent INTEGER DEFAULT 10,\n  discount_type TEXT DEFAULT ''percent'',\n  min_purchase_cents INTEGER DEFAULT 0,\n  max_discount_cents INTEGER,\n  is_used BOOLEAN DEFAULT 0,\n  used_at DATETIME,\n  used_on_order_id INTEGER,\n  expires_at DATETIME NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Index for fast lookups\nCREATE INDEX idx_retropass_subscriptions_user ON retropass_subscriptions(user_id);\nCREATE INDEX idx_retropass_subscriptions_status ON retropass_subscriptions(status);\nCREATE INDEX idx_retropass_coupons_user ON retropass_coupons(user_id);\nCREATE INDEX idx_retropass_coupons_code ON retropass_coupons(code);\n','\n',char(10)),replace('\nDROP INDEX idx_retropass_coupons_code;\nDROP INDEX idx_retropass_coupons_user;\nDROP INDEX idx_retropass_subscriptions_status;\nDROP INDEX idx_retropass_subscriptions_user;\nDROP TABLE retropass_coupons;\nDROP TABLE retropass_subscriptions;\n','\n',char(10)),'2026-02-23 02:42:22');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(14,replace('\n-- Mystery Box System\nCREATE TABLE mystery_boxes (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id TEXT NOT NULL,\n  subscription_id INTEGER,\n  month_year TEXT NOT NULL,\n  is_opened INTEGER DEFAULT 0,\n  reward_type TEXT,\n  reward_value TEXT,\n  reward_data TEXT,\n  opened_at DATETIME,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_mystery_boxes_user ON mystery_boxes(user_id);\nCREATE INDEX idx_mystery_boxes_month ON mystery_boxes(month_year);\n\n-- Login Streak System\nCREATE TABLE login_streaks (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id TEXT NOT NULL UNIQUE,\n  current_streak INTEGER DEFAULT 0,\n  longest_streak INTEGER DEFAULT 0,\n  last_login_date DATE,\n  total_logins INTEGER DEFAULT 0,\n  tickets_earned INTEGER DEFAULT 0,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_login_streaks_user ON login_streaks(user_id);\n\nCREATE TABLE login_rewards (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id TEXT NOT NULL,\n  reward_date DATE NOT NULL,\n  streak_day INTEGER NOT NULL,\n  reward_type TEXT NOT NULL,\n  reward_value INTEGER NOT NULL,\n  is_claimed INTEGER DEFAULT 0,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_login_rewards_user ON login_rewards(user_id);\nCREATE INDEX idx_login_rewards_date ON login_rewards(reward_date);\n\n-- Avatar Frames for RetroPass subscribers\nCREATE TABLE avatar_frames (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  frame_type TEXT NOT NULL,\n  css_animation TEXT,\n  colors TEXT,\n  is_premium INTEGER DEFAULT 1,\n  unlock_requirement TEXT,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Tournament System\nCREATE TABLE tournaments (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  description TEXT,\n  game_type TEXT NOT NULL,\n  start_date DATETIME NOT NULL,\n  end_date DATETIME NOT NULL,\n  status TEXT DEFAULT ''upcoming'',\n  prize_tickets INTEGER DEFAULT 0,\n  prize_badge TEXT,\n  prize_title TEXT,\n  max_participants INTEGER,\n  is_retropass_only INTEGER DEFAULT 1,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_tournaments_status ON tournaments(status);\nCREATE INDEX idx_tournaments_dates ON tournaments(start_date, end_date);\n\nCREATE TABLE tournament_entries (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  tournament_id INTEGER NOT NULL,\n  user_id TEXT NOT NULL,\n  best_score INTEGER DEFAULT 0,\n  attempts INTEGER DEFAULT 0,\n  rank_position INTEGER,\n  prize_claimed INTEGER DEFAULT 0,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_tournament_entries_tournament ON tournament_entries(tournament_id);\nCREATE INDEX idx_tournament_entries_user ON tournament_entries(user_id);\nCREATE UNIQUE INDEX idx_tournament_entries_unique ON tournament_entries(tournament_id, user_id);\n','\n',char(10)),replace('\nDROP INDEX IF EXISTS idx_tournament_entries_unique;\nDROP INDEX IF EXISTS idx_tournament_entries_user;\nDROP INDEX IF EXISTS idx_tournament_entries_tournament;\nDROP TABLE IF EXISTS tournament_entries;\n\nDROP INDEX IF EXISTS idx_tournaments_dates;\nDROP INDEX IF EXISTS idx_tournaments_status;\nDROP TABLE IF EXISTS tournaments;\n\nDROP TABLE IF EXISTS avatar_frames;\n\nDROP INDEX IF EXISTS idx_login_rewards_date;\nDROP INDEX IF EXISTS idx_login_rewards_user;\nDROP TABLE IF EXISTS login_rewards;\n\nDROP INDEX IF EXISTS idx_login_streaks_user;\nDROP TABLE IF EXISTS login_streaks;\n\nDROP INDEX IF EXISTS idx_mystery_boxes_month;\nDROP INDEX IF EXISTS idx_mystery_boxes_user;\nDROP TABLE IF EXISTS mystery_boxes;\n','\n',char(10)),'2026-02-23 02:42:22');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(15,replace('\n-- Online game rooms for multiplayer matches\nCREATE TABLE online_game_rooms (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  room_code TEXT NOT NULL UNIQUE,\n  game_type TEXT NOT NULL,\n  status TEXT NOT NULL DEFAULT ''waiting'',\n  player1_id TEXT NOT NULL,\n  player1_username TEXT,\n  player2_id TEXT,\n  player2_username TEXT,\n  current_turn TEXT,\n  game_state TEXT,\n  winner_id TEXT,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  started_at TIMESTAMP,\n  finished_at TIMESTAMP\n);\n\nCREATE INDEX idx_game_rooms_status ON online_game_rooms(status);\nCREATE INDEX idx_game_rooms_player1 ON online_game_rooms(player1_id);\nCREATE INDEX idx_game_rooms_player2 ON online_game_rooms(player2_id);\nCREATE INDEX idx_game_rooms_code ON online_game_rooms(room_code);\n\n-- Matchmaking queue for finding opponents\nCREATE TABLE online_matchmaking_queue (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id TEXT NOT NULL,\n  username TEXT,\n  game_type TEXT NOT NULL,\n  status TEXT NOT NULL DEFAULT ''searching'',\n  matched_room_id INTEGER,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_matchmaking_status ON online_matchmaking_queue(status, game_type);\nCREATE INDEX idx_matchmaking_user ON online_matchmaking_queue(user_id);\n\n-- Online match history\nCREATE TABLE online_match_history (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  room_id INTEGER NOT NULL,\n  game_type TEXT NOT NULL,\n  player1_id TEXT NOT NULL,\n  player1_username TEXT,\n  player2_id TEXT NOT NULL,\n  player2_username TEXT,\n  winner_id TEXT,\n  is_draw BOOLEAN DEFAULT 0,\n  duration_seconds INTEGER,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_match_history_player1 ON online_match_history(player1_id);\nCREATE INDEX idx_match_history_player2 ON online_match_history(player2_id);\n\n-- Online player stats\nCREATE TABLE online_player_stats (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id TEXT NOT NULL,\n  game_type TEXT NOT NULL,\n  wins INTEGER DEFAULT 0,\n  losses INTEGER DEFAULT 0,\n  draws INTEGER DEFAULT 0,\n  rating INTEGER DEFAULT 1000,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  UNIQUE(user_id, game_type)\n);\n\nCREATE INDEX idx_player_stats_user ON online_player_stats(user_id);\nCREATE INDEX idx_player_stats_rating ON online_player_stats(game_type, rating DESC);\n','\n',char(10)),replace('\nDROP INDEX idx_player_stats_rating;\nDROP INDEX idx_player_stats_user;\nDROP TABLE online_player_stats;\nDROP INDEX idx_match_history_player2;\nDROP INDEX idx_match_history_player1;\nDROP TABLE online_match_history;\nDROP INDEX idx_matchmaking_user;\nDROP INDEX idx_matchmaking_status;\nDROP TABLE online_matchmaking_queue;\nDROP INDEX idx_game_rooms_code;\nDROP INDEX idx_game_rooms_player2;\nDROP INDEX idx_game_rooms_player1;\nDROP INDEX idx_game_rooms_status;\nDROP TABLE online_game_rooms;\n','\n',char(10)),'2026-02-23 02:42:22');
INSERT INTO "_mocha_migrations" ("number","up_sql","down_sql","applied_at") VALUES(16,replace('\nCREATE TABLE arcade_rewards (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  description TEXT,\n  reward_type TEXT NOT NULL,\n  reward_value TEXT,\n  ticket_cost INTEGER NOT NULL,\n  icon TEXT,\n  rarity TEXT DEFAULT ''common'',\n  stock_limit INTEGER,\n  stock_remaining INTEGER,\n  is_active BOOLEAN DEFAULT 1,\n  is_retropass_only BOOLEAN DEFAULT 0,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE TABLE reward_redemptions (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id TEXT NOT NULL,\n  reward_id INTEGER NOT NULL,\n  reward_snapshot TEXT,\n  redeemed_code TEXT,\n  is_used BOOLEAN DEFAULT 0,\n  used_at DATETIME,\n  expires_at DATETIME,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_arcade_rewards_active ON arcade_rewards(is_active);\nCREATE INDEX idx_reward_redemptions_user ON reward_redemptions(user_id);\n\nINSERT INTO arcade_rewards (name, description, reward_type, reward_value, ticket_cost, icon, rarity, is_active) VALUES\n  (''5% Discount Coupon'', ''Get 5% off your next purchase'', ''coupon'', ''5'', 500, ''ticket'', ''common'', 1),\n  (''10% Discount Coupon'', ''Get 10% off your next purchase'', ''coupon'', ''10'', 1000, ''ticket-percent'', ''uncommon'', 1),\n  (''15% Discount Coupon'', ''Get 15% off your next purchase'', ''coupon'', ''15'', 2000, ''badge-percent'', ''rare'', 1),\n  (''Pixel Warrior Avatar'', ''Exclusive 8-bit warrior avatar'', ''avatar'', ''pixel-warrior'', 800, ''user'', ''common'', 1),\n  (''Retro Robot Avatar'', ''Classic robot companion avatar'', ''avatar'', ''retro-robot'', 1200, ''bot'', ''uncommon'', 1),\n  (''Neon Samurai Avatar'', ''Cyberpunk samurai avatar'', ''avatar'', ''neon-samurai'', 2500, ''sword'', ''rare'', 1),\n  (''Arcade Champion Title'', ''Show off your gaming skills'', ''title'', ''Arcade Champion'', 3000, ''trophy'', ''rare'', 1),\n  (''Pixel Master Title'', ''For true retro enthusiasts'', ''title'', ''Pixel Master'', 5000, ''crown'', ''epic'', 1),\n  (''Legend Status Title'', ''The ultimate gaming title'', ''title'', ''Gaming Legend'', 10000, ''sparkles'', ''legendary'', 1),\n  (''Mystery Box Key'', ''Unlock a mystery box with random rewards'', ''mystery'', ''box'', 1500, ''gift'', ''uncommon'', 1),\n  (''Double Tickets Boost'', ''2x tickets for your next 5 games'', ''boost'', ''double_5'', 2000, ''zap'', ''rare'', 1),\n  (''Golden Frame'', ''Premium golden profile frame'', ''frame'', ''golden'', 7500, ''frame'', ''epic'', 1);\n','\n',char(10)),replace('\nDROP INDEX IF EXISTS idx_reward_redemptions_user;\nDROP INDEX IF EXISTS idx_arcade_rewards_active;\nDROP TABLE IF EXISTS reward_redemptions;\nDROP TABLE IF EXISTS arcade_rewards;\n','\n',char(10)),'2026-03-22 11:52:45');
CREATE TABLE wishlists (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id TEXT NOT NULL,
product_id TEXT NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE listings (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id TEXT NOT NULL,
title TEXT NOT NULL,
description TEXT,
price_cents INTEGER NOT NULL,
category TEXT NOT NULL,
condition TEXT NOT NULL,
images TEXT,
status TEXT DEFAULT 'active',
location TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
, listing_type TEXT DEFAULT 'item', game_platform TEXT, account_level TEXT, account_rank TEXT, account_server TEXT);
CREATE TABLE conversations (
id INTEGER PRIMARY KEY AUTOINCREMENT,
listing_id INTEGER NOT NULL,
buyer_id TEXT NOT NULL,
seller_id TEXT NOT NULL,
last_message_at TIMESTAMP,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE messages (
id INTEGER PRIMARY KEY AUTOINCREMENT,
conversation_id INTEGER NOT NULL,
sender_id TEXT NOT NULL,
content TEXT NOT NULL,
is_read INTEGER DEFAULT 0,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE products (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
description TEXT,
base_price_cents INTEGER NOT NULL,
category TEXT NOT NULL,
images TEXT,
is_featured BOOLEAN DEFAULT 0,
is_active BOOLEAN DEFAULT 1,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE product_variants (
id INTEGER PRIMARY KEY AUTOINCREMENT,
product_id INTEGER NOT NULL,
name TEXT,
size TEXT,
color TEXT,
color_hex TEXT,
sku TEXT,
price_cents INTEGER,
stock_quantity INTEGER DEFAULT 0,
is_available BOOLEAN DEFAULT 1,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE price_alerts (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id TEXT NOT NULL,
listing_id INTEGER NOT NULL,
target_price_cents INTEGER NOT NULL,
is_active BOOLEAN DEFAULT 1,
triggered_at DATETIME,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE suppliers (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
type TEXT NOT NULL,
api_key TEXT,
api_secret TEXT,
base_url TEXT,
default_margin_percent INTEGER DEFAULT 30,
shipping_days_min INTEGER DEFAULT 7,
shipping_days_max INTEGER DEFAULT 21,
is_active BOOLEAN DEFAULT 1,
settings TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE dropship_products (
id INTEGER PRIMARY KEY AUTOINCREMENT,
supplier_id INTEGER NOT NULL,
external_id TEXT NOT NULL,
name TEXT NOT NULL,
description TEXT,
category TEXT,
cost_cents INTEGER NOT NULL,
price_cents INTEGER NOT NULL,
margin_percent INTEGER,
images TEXT,
variants TEXT,
stock_quantity INTEGER DEFAULT 0,
is_active BOOLEAN DEFAULT 1,
external_url TEXT,
last_synced_at TIMESTAMP,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE orders (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id TEXT NOT NULL,
status TEXT DEFAULT 'pending',
subtotal_cents INTEGER NOT NULL,
shipping_cents INTEGER DEFAULT 0,
total_cents INTEGER NOT NULL,
profit_cents INTEGER DEFAULT 0,
shipping_name TEXT,
shipping_address TEXT,
shipping_city TEXT,
shipping_state TEXT,
shipping_zip TEXT,
shipping_country TEXT,
stripe_payment_id TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE order_items (
id INTEGER PRIMARY KEY AUTOINCREMENT,
order_id INTEGER NOT NULL,
product_id INTEGER NOT NULL,
supplier_id INTEGER NOT NULL,
quantity INTEGER NOT NULL,
unit_price_cents INTEGER NOT NULL,
unit_cost_cents INTEGER NOT NULL,
variant_info TEXT,
supplier_order_id TEXT,
supplier_status TEXT,
tracking_number TEXT,
tracking_url TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE user_badges (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id TEXT NOT NULL,
badge_id TEXT NOT NULL,
earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
total_spent_at_earn REAL NOT NULL,
tickets_awarded INTEGER NOT NULL,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
UNIQUE(user_id, badge_id)
);
CREATE TABLE user_arcade_stats (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id TEXT NOT NULL UNIQUE,
total_tickets INTEGER DEFAULT 0,
tickets_spent INTEGER DEFAULT 0,
total_purchase_amount REAL DEFAULT 0,
games_played INTEGER DEFAULT 0,
high_scores TEXT,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "user_arcade_stats" ("id","user_id","total_tickets","tickets_spent","total_purchase_amount","games_played","high_scores","created_at","updated_at") VALUES(1,'019c805a-3295-78be-83f7-350e706be0c7',0,0,0,0,NULL,'2026-03-22 20:06:09','2026-03-23 22:11:48');
CREATE TABLE ticket_transactions (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id TEXT NOT NULL,
amount INTEGER NOT NULL,
transaction_type TEXT NOT NULL,
description TEXT,
reference_id TEXT,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE arcade_badges (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
description TEXT,
icon TEXT NOT NULL,
rarity TEXT NOT NULL DEFAULT 'common',
tickets_required INTEGER NOT NULL DEFAULT 0,
game_type TEXT,
score_required INTEGER,
games_required INTEGER,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "arcade_badges" ("id","name","description","icon","rarity","tickets_required","game_type","score_required","games_required","created_at","updated_at") VALUES(1,'Primeiro Passo','Jogue seu primeiro jogo no arcade','gamepad-2','common',0,NULL,NULL,1,'2026-02-21 21:53:03','2026-02-21 21:53:03');
INSERT INTO "arcade_badges" ("id","name","description","icon","rarity","tickets_required","game_type","score_required","games_required","created_at","updated_at") VALUES(2,'Colecionador de Tickets','Acumule 100 tickets','ticket','common',100,NULL,NULL,NULL,'2026-02-21 21:53:03','2026-02-21 21:53:03');
INSERT INTO "arcade_badges" ("id","name","description","icon","rarity","tickets_required","game_type","score_required","games_required","created_at","updated_at") VALUES(3,'Mestre do 2048','Alcance 2048 no jogo','square','rare',0,'2048',2048,NULL,'2026-02-21 21:53:03','2026-02-21 21:53:03');
INSERT INTO "arcade_badges" ("id","name","description","icon","rarity","tickets_required","game_type","score_required","games_required","created_at","updated_at") VALUES(4,'Serpente Veloz','Consiga 50 pontos no Snake','zap','uncommon',0,'snake',50,NULL,'2026-02-21 21:53:03','2026-02-21 21:53:03');
INSERT INTO "arcade_badges" ("id","name","description","icon","rarity","tickets_required","game_type","score_required","games_required","created_at","updated_at") VALUES(5,'Destruidor de Blocos','Complete 3 níveis no Breakout','layout-grid','uncommon',0,'breakout',3,NULL,'2026-02-21 21:53:03','2026-02-21 21:53:03');
INSERT INTO "arcade_badges" ("id","name","description","icon","rarity","tickets_required","game_type","score_required","games_required","created_at","updated_at") VALUES(6,'Memória Perfeita','Complete o Memory Match sem erros','brain','rare',0,'memory',100,NULL,'2026-02-21 21:53:03','2026-02-21 21:53:03');
INSERT INTO "arcade_badges" ("id","name","description","icon","rarity","tickets_required","game_type","score_required","games_required","created_at","updated_at") VALUES(7,'Pássaro Voador','Passe 20 obstáculos no Pixel Bird','bird','uncommon',0,'flappy',20,NULL,'2026-02-21 21:53:03','2026-02-21 21:53:03');
INSERT INTO "arcade_badges" ("id","name","description","icon","rarity","tickets_required","game_type","score_required","games_required","created_at","updated_at") VALUES(8,'Tetris Master','Limpe 10 linhas no Neon Blocks','layers','uncommon',0,'tetris',10,NULL,'2026-02-21 21:53:03','2026-02-21 21:53:03');
INSERT INTO "arcade_badges" ("id","name","description","icon","rarity","tickets_required","game_type","score_required","games_required","created_at","updated_at") VALUES(9,'Viciado em Jogos','Jogue 50 partidas','flame','rare',0,NULL,NULL,50,'2026-02-21 21:53:03','2026-02-21 21:53:03');
INSERT INTO "arcade_badges" ("id","name","description","icon","rarity","tickets_required","game_type","score_required","games_required","created_at","updated_at") VALUES(10,'Lenda do Arcade','Jogue 100 partidas e acumule 500 tickets','crown','legendary',500,NULL,NULL,100,'2026-02-21 21:53:03','2026-02-21 21:53:03');
INSERT INTO "arcade_badges" ("id","name","description","icon","rarity","tickets_required","game_type","score_required","games_required","created_at","updated_at") VALUES(11,'Rico em Tickets','Acumule 1000 tickets','gem','epic',1000,NULL,NULL,NULL,'2026-02-21 21:53:03','2026-02-21 21:53:03');
INSERT INTO "arcade_badges" ("id","name","description","icon","rarity","tickets_required","game_type","score_required","games_required","created_at","updated_at") VALUES(12,'Maratonista','Jogue 10 partidas em um dia','timer','uncommon',0,NULL,NULL,10,'2026-02-21 21:53:03','2026-02-21 21:53:03');
CREATE TABLE game_sessions (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id TEXT NOT NULL,
game_type TEXT NOT NULL,
score INTEGER NOT NULL DEFAULT 0,
tickets_earned INTEGER NOT NULL DEFAULT 0,
duration_seconds INTEGER,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE account_transactions (
id INTEGER PRIMARY KEY AUTOINCREMENT,
listing_id INTEGER NOT NULL,
buyer_id TEXT NOT NULL,
seller_id TEXT NOT NULL,
amount_cents INTEGER NOT NULL,
platform_fee_cents INTEGER DEFAULT 0,
seller_payout_cents INTEGER NOT NULL,
status TEXT DEFAULT 'pending_payment',
stripe_payment_intent_id TEXT,
stripe_transfer_id TEXT,
delivery_deadline_at DATETIME,
auto_release_at DATETIME,
delivered_at DATETIME,
confirmed_at DATETIME,
completed_at DATETIME,
cancelled_at DATETIME,
cancellation_reason TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE account_credentials (
id INTEGER PRIMARY KEY AUTOINCREMENT,
listing_id INTEGER NOT NULL UNIQUE,
login_email TEXT,
login_username TEXT,
login_password TEXT,
recovery_email TEXT,
recovery_phone TEXT,
additional_info TEXT,
is_revealed BOOLEAN DEFAULT 0,
revealed_at DATETIME,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE transaction_messages (
id INTEGER PRIMARY KEY AUTOINCREMENT,
transaction_id INTEGER NOT NULL,
sender_id TEXT NOT NULL,
message_type TEXT DEFAULT 'text',
content TEXT NOT NULL,
is_system BOOLEAN DEFAULT 0,
is_read BOOLEAN DEFAULT 0,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE transaction_disputes (
id INTEGER PRIMARY KEY AUTOINCREMENT,
transaction_id INTEGER NOT NULL UNIQUE,
opened_by TEXT NOT NULL,
reason TEXT NOT NULL,
description TEXT,
evidence_urls TEXT,
status TEXT DEFAULT 'open',
resolution TEXT,
resolved_by TEXT,
resolved_at DATETIME,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE user_profiles (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id TEXT NOT NULL UNIQUE,
username TEXT UNIQUE,
display_name TEXT,
avatar_url TEXT,
avatar_preset TEXT DEFAULT 'gameboy',
bio TEXT,
theme_color TEXT DEFAULT '#E673AA',
favorite_game TEXT,
display_badges TEXT,
is_public BOOLEAN DEFAULT 1,
total_games_played INTEGER DEFAULT 0,
total_score INTEGER DEFAULT 0,
profile_views INTEGER DEFAULT 0,
last_seen_at DATETIME,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE retropass_subscriptions (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id TEXT NOT NULL UNIQUE,
stripe_subscription_id TEXT,
stripe_customer_id TEXT,
status TEXT DEFAULT 'active',
plan_type TEXT DEFAULT 'monthly',
price_cents INTEGER DEFAULT 499,
current_period_start DATETIME,
current_period_end DATETIME,
tickets_granted_this_period INTEGER DEFAULT 0,
coupons_granted_this_period INTEGER DEFAULT 0,
leaderboard_icon TEXT,
leaderboard_color TEXT,
display_title TEXT,
cancelled_at DATETIME,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE retropass_coupons (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id TEXT NOT NULL,
subscription_id INTEGER NOT NULL,
code TEXT NOT NULL UNIQUE,
discount_percent INTEGER DEFAULT 10,
discount_type TEXT DEFAULT 'percent',
min_purchase_cents INTEGER DEFAULT 0,
max_discount_cents INTEGER,
is_used BOOLEAN DEFAULT 0,
used_at DATETIME,
used_on_order_id INTEGER,
expires_at DATETIME NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE mystery_boxes (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id TEXT NOT NULL,
subscription_id INTEGER,
month_year TEXT NOT NULL,
is_opened INTEGER DEFAULT 0,
reward_type TEXT,
reward_value TEXT,
reward_data TEXT,
opened_at DATETIME,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE login_streaks (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id TEXT NOT NULL UNIQUE,
current_streak INTEGER DEFAULT 0,
longest_streak INTEGER DEFAULT 0,
last_login_date DATE,
total_logins INTEGER DEFAULT 0,
tickets_earned INTEGER DEFAULT 0,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE login_rewards (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id TEXT NOT NULL,
reward_date DATE NOT NULL,
streak_day INTEGER NOT NULL,
reward_type TEXT NOT NULL,
reward_value INTEGER NOT NULL,
is_claimed INTEGER DEFAULT 0,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE avatar_frames (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
frame_type TEXT NOT NULL,
css_animation TEXT,
colors TEXT,
is_premium INTEGER DEFAULT 1,
unlock_requirement TEXT,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE tournaments (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
description TEXT,
game_type TEXT NOT NULL,
start_date DATETIME NOT NULL,
end_date DATETIME NOT NULL,
status TEXT DEFAULT 'upcoming',
prize_tickets INTEGER DEFAULT 0,
prize_badge TEXT,
prize_title TEXT,
max_participants INTEGER,
is_retropass_only INTEGER DEFAULT 1,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE tournament_entries (
id INTEGER PRIMARY KEY AUTOINCREMENT,
tournament_id INTEGER NOT NULL,
user_id TEXT NOT NULL,
best_score INTEGER DEFAULT 0,
attempts INTEGER DEFAULT 0,
rank_position INTEGER,
prize_claimed INTEGER DEFAULT 0,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE online_game_rooms (
id INTEGER PRIMARY KEY AUTOINCREMENT,
room_code TEXT NOT NULL UNIQUE,
game_type TEXT NOT NULL,
status TEXT NOT NULL DEFAULT 'waiting',
player1_id TEXT NOT NULL,
player1_username TEXT,
player2_id TEXT,
player2_username TEXT,
current_turn TEXT,
game_state TEXT,
winner_id TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
started_at TIMESTAMP,
finished_at TIMESTAMP
);
CREATE TABLE online_matchmaking_queue (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id TEXT NOT NULL,
username TEXT,
game_type TEXT NOT NULL,
status TEXT NOT NULL DEFAULT 'searching',
matched_room_id INTEGER,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE online_match_history (
id INTEGER PRIMARY KEY AUTOINCREMENT,
room_id INTEGER NOT NULL,
game_type TEXT NOT NULL,
player1_id TEXT NOT NULL,
player1_username TEXT,
player2_id TEXT NOT NULL,
player2_username TEXT,
winner_id TEXT,
is_draw BOOLEAN DEFAULT 0,
duration_seconds INTEGER,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE online_player_stats (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id TEXT NOT NULL,
game_type TEXT NOT NULL,
wins INTEGER DEFAULT 0,
losses INTEGER DEFAULT 0,
draws INTEGER DEFAULT 0,
rating INTEGER DEFAULT 1000,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
UNIQUE(user_id, game_type)
);
CREATE TABLE arcade_rewards (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
description TEXT,
reward_type TEXT NOT NULL,
reward_value TEXT,
ticket_cost INTEGER NOT NULL,
icon TEXT,
rarity TEXT DEFAULT 'common',
stock_limit INTEGER,
stock_remaining INTEGER,
is_active BOOLEAN DEFAULT 1,
is_retropass_only BOOLEAN DEFAULT 0,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "arcade_rewards" ("id","name","description","reward_type","reward_value","ticket_cost","icon","rarity","stock_limit","stock_remaining","is_active","is_retropass_only","created_at","updated_at") VALUES(1,'5% Discount Coupon','Get 5% off your next purchase','coupon','5',500,'ticket','common',NULL,NULL,1,0,'2026-03-22 11:52:45','2026-03-22 11:52:45');
INSERT INTO "arcade_rewards" ("id","name","description","reward_type","reward_value","ticket_cost","icon","rarity","stock_limit","stock_remaining","is_active","is_retropass_only","created_at","updated_at") VALUES(2,'10% Discount Coupon','Get 10% off your next purchase','coupon','10',1000,'ticket-percent','uncommon',NULL,NULL,1,0,'2026-03-22 11:52:45','2026-03-22 11:52:45');
INSERT INTO "arcade_rewards" ("id","name","description","reward_type","reward_value","ticket_cost","icon","rarity","stock_limit","stock_remaining","is_active","is_retropass_only","created_at","updated_at") VALUES(3,'15% Discount Coupon','Get 15% off your next purchase','coupon','15',2000,'badge-percent','rare',NULL,NULL,1,0,'2026-03-22 11:52:45','2026-03-22 11:52:45');
INSERT INTO "arcade_rewards" ("id","name","description","reward_type","reward_value","ticket_cost","icon","rarity","stock_limit","stock_remaining","is_active","is_retropass_only","created_at","updated_at") VALUES(4,'Pixel Warrior Avatar','Exclusive 8-bit warrior avatar','avatar','pixel-warrior',800,'user','common',NULL,NULL,1,0,'2026-03-22 11:52:45','2026-03-22 11:52:45');
INSERT INTO "arcade_rewards" ("id","name","description","reward_type","reward_value","ticket_cost","icon","rarity","stock_limit","stock_remaining","is_active","is_retropass_only","created_at","updated_at") VALUES(5,'Retro Robot Avatar','Classic robot companion avatar','avatar','retro-robot',1200,'bot','uncommon',NULL,NULL,1,0,'2026-03-22 11:52:45','2026-03-22 11:52:45');
INSERT INTO "arcade_rewards" ("id","name","description","reward_type","reward_value","ticket_cost","icon","rarity","stock_limit","stock_remaining","is_active","is_retropass_only","created_at","updated_at") VALUES(6,'Neon Samurai Avatar','Cyberpunk samurai avatar','avatar','neon-samurai',2500,'sword','rare',NULL,NULL,1,0,'2026-03-22 11:52:45','2026-03-22 11:52:45');
INSERT INTO "arcade_rewards" ("id","name","description","reward_type","reward_value","ticket_cost","icon","rarity","stock_limit","stock_remaining","is_active","is_retropass_only","created_at","updated_at") VALUES(7,'Arcade Champion Title','Show off your gaming skills','title','Arcade Champion',3000,'trophy','rare',NULL,NULL,1,0,'2026-03-22 11:52:45','2026-03-22 11:52:45');
INSERT INTO "arcade_rewards" ("id","name","description","reward_type","reward_value","ticket_cost","icon","rarity","stock_limit","stock_remaining","is_active","is_retropass_only","created_at","updated_at") VALUES(8,'Pixel Master Title','For true retro enthusiasts','title','Pixel Master',5000,'crown','epic',NULL,NULL,1,0,'2026-03-22 11:52:45','2026-03-22 11:52:45');
INSERT INTO "arcade_rewards" ("id","name","description","reward_type","reward_value","ticket_cost","icon","rarity","stock_limit","stock_remaining","is_active","is_retropass_only","created_at","updated_at") VALUES(9,'Legend Status Title','The ultimate gaming title','title','Gaming Legend',10000,'sparkles','legendary',NULL,NULL,1,0,'2026-03-22 11:52:45','2026-03-22 11:52:45');
INSERT INTO "arcade_rewards" ("id","name","description","reward_type","reward_value","ticket_cost","icon","rarity","stock_limit","stock_remaining","is_active","is_retropass_only","created_at","updated_at") VALUES(10,'Mystery Box Key','Unlock a mystery box with random rewards','mystery','box',1500,'gift','uncommon',NULL,NULL,1,0,'2026-03-22 11:52:45','2026-03-22 11:52:45');
INSERT INTO "arcade_rewards" ("id","name","description","reward_type","reward_value","ticket_cost","icon","rarity","stock_limit","stock_remaining","is_active","is_retropass_only","created_at","updated_at") VALUES(11,'Double Tickets Boost','2x tickets for your next 5 games','boost','double_5',2000,'zap','rare',NULL,NULL,1,0,'2026-03-22 11:52:45','2026-03-22 11:52:45');
INSERT INTO "arcade_rewards" ("id","name","description","reward_type","reward_value","ticket_cost","icon","rarity","stock_limit","stock_remaining","is_active","is_retropass_only","created_at","updated_at") VALUES(12,'Golden Frame','Premium golden profile frame','frame','golden',7500,'frame','epic',NULL,NULL,1,0,'2026-03-22 11:52:45','2026-03-22 11:52:45');
CREATE TABLE reward_redemptions (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id TEXT NOT NULL,
reward_id INTEGER NOT NULL,
reward_snapshot TEXT,
redeemed_code TEXT,
is_used BOOLEAN DEFAULT 0,
used_at DATETIME,
expires_at DATETIME,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('arcade_badges',12);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('arcade_rewards',12);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('user_arcade_stats',1);
CREATE UNIQUE INDEX idx_wishlists_user_product ON wishlists(user_id, product_id);
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_created_at ON listings(created_at);
CREATE INDEX idx_conversations_buyer ON conversations(buyer_id);
CREATE INDEX idx_conversations_seller ON conversations(seller_id);
CREATE INDEX idx_conversations_listing ON conversations(listing_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);
CREATE INDEX idx_variants_is_available ON product_variants(is_available);
CREATE INDEX idx_listings_type ON listings(listing_type);
CREATE INDEX idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX idx_price_alerts_listing ON price_alerts(listing_id);
CREATE INDEX idx_price_alerts_active ON price_alerts(is_active);
CREATE INDEX idx_suppliers_active ON suppliers(is_active);
CREATE INDEX idx_dropship_products_supplier ON dropship_products(supplier_id);
CREATE INDEX idx_dropship_products_category ON dropship_products(category);
CREATE INDEX idx_dropship_products_active ON dropship_products(is_active);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_supplier ON order_items(supplier_id);
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_arcade_stats_user ON user_arcade_stats(user_id);
CREATE INDEX idx_ticket_transactions_user ON ticket_transactions(user_id);
CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_game_type ON game_sessions(game_type);
CREATE INDEX idx_account_transactions_buyer ON account_transactions(buyer_id);
CREATE INDEX idx_account_transactions_seller ON account_transactions(seller_id);
CREATE INDEX idx_account_transactions_status ON account_transactions(status);
CREATE INDEX idx_account_transactions_listing ON account_transactions(listing_id);
CREATE INDEX idx_account_credentials_listing ON account_credentials(listing_id);
CREATE INDEX idx_transaction_messages_transaction ON transaction_messages(transaction_id);
CREATE INDEX idx_transaction_disputes_transaction ON transaction_disputes(transaction_id);
CREATE INDEX idx_transaction_disputes_status ON transaction_disputes(status);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_retropass_subscriptions_user ON retropass_subscriptions(user_id);
CREATE INDEX idx_retropass_subscriptions_status ON retropass_subscriptions(status);
CREATE INDEX idx_retropass_coupons_user ON retropass_coupons(user_id);
CREATE INDEX idx_retropass_coupons_code ON retropass_coupons(code);
CREATE INDEX idx_mystery_boxes_user ON mystery_boxes(user_id);
CREATE INDEX idx_mystery_boxes_month ON mystery_boxes(month_year);
CREATE INDEX idx_login_streaks_user ON login_streaks(user_id);
CREATE INDEX idx_login_rewards_user ON login_rewards(user_id);
CREATE INDEX idx_login_rewards_date ON login_rewards(reward_date);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_dates ON tournaments(start_date, end_date);
CREATE INDEX idx_tournament_entries_tournament ON tournament_entries(tournament_id);
CREATE INDEX idx_tournament_entries_user ON tournament_entries(user_id);
CREATE UNIQUE INDEX idx_tournament_entries_unique ON tournament_entries(tournament_id, user_id);
CREATE INDEX idx_game_rooms_status ON online_game_rooms(status);
CREATE INDEX idx_game_rooms_player1 ON online_game_rooms(player1_id);
CREATE INDEX idx_game_rooms_player2 ON online_game_rooms(player2_id);
CREATE INDEX idx_game_rooms_code ON online_game_rooms(room_code);
CREATE INDEX idx_matchmaking_status ON online_matchmaking_queue(status, game_type);
CREATE INDEX idx_matchmaking_user ON online_matchmaking_queue(user_id);
CREATE INDEX idx_match_history_player1 ON online_match_history(player1_id);
CREATE INDEX idx_match_history_player2 ON online_match_history(player2_id);
CREATE INDEX idx_player_stats_user ON online_player_stats(user_id);
CREATE INDEX idx_player_stats_rating ON online_player_stats(game_type, rating DESC);
CREATE INDEX idx_arcade_rewards_active ON arcade_rewards(is_active);
CREATE INDEX idx_reward_redemptions_user ON reward_redemptions(user_id);
