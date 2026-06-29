DROP TABLE IF EXISTS wishlists;
DROP TABLE IF EXISTS listings;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS product_variants;
DROP TABLE IF EXISTS price_alerts;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS dropship_products;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS user_badges;
DROP TABLE IF EXISTS user_arcade_stats;
DROP TABLE IF EXISTS ticket_transactions;
DROP TABLE IF EXISTS arcade_badges;
DROP TABLE IF EXISTS game_sessions;
DROP TABLE IF EXISTS account_transactions;
DROP TABLE IF EXISTS account_credentials;
DROP TABLE IF EXISTS transaction_messages;
DROP TABLE IF EXISTS transaction_disputes;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS retropass_subscriptions;
DROP TABLE IF EXISTS retropass_coupons;
DROP TABLE IF EXISTS mystery_boxes;
DROP TABLE IF EXISTS login_streaks;
DROP TABLE IF EXISTS login_rewards;
DROP TABLE IF EXISTS avatar_frames;
DROP TABLE IF EXISTS tournaments;
DROP TABLE IF EXISTS tournament_entries;
DROP TABLE IF EXISTS online_game_rooms;
DROP TABLE IF EXISTS online_matchmaking_queue;
DROP TABLE IF EXISTS online_match_history;
DROP TABLE IF EXISTS online_player_stats;
DROP TABLE IF EXISTS arcade_rewards;
DROP TABLE IF EXISTS reward_redemptions;
DROP TABLE IF EXISTS users;
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
CREATE TABLE users (
id TEXT PRIMARY KEY,
email TEXT NOT NULL,
google_sub TEXT NOT NULL UNIQUE,
google_user_data TEXT,
created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
last_signed_in_at TEXT
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_sub ON users(google_sub);
INSERT INTO users (id, email, google_sub, google_user_data, created_at, updated_at, last_signed_in_at) VALUES
('019c8233-914f-7da4-9ba4-d5917b2a42b2', 'mathbm2513@gmail.com', '117168847290239370967', '{"name":"Matheus Batista Marques","hd":null,"sub":"117168847290239370967","email":"mathbm2513@gmail.com","email_verified":true,"family_name":"Batista Marques","given_name":"Matheus","picture":"https://lh3.googleusercontent.com/a/ACg8ocJuT9JUBXsj0DhjhsDdl_MRHxtAlJ1Sp5tFWMVdDMdn2x2yCg=s96-c"}', '2026-02-21T21:55:43Z', '2026-02-21T21:55:43Z', '2026-02-21T21:55:43Z'),
('019c84ba-c974-7f2d-8642-2c9cda27e7b1', 'matheusbmarques13@gmail.com', '118036498503531510651', '{"name":"Matheus Batista Marques","hd":null,"sub":"118036498503531510651","email":"matheusbmarques13@gmail.com","email_verified":true,"family_name":"Batista Marques","given_name":"Matheus","picture":"https://lh3.googleusercontent.com/a/ACg8ocKNM01m5p277aGZK4-E3Kyy5eZv_aNOtuc4rPiaFAf4YqHMxQ=s96-c"}', '2026-02-22T09:42:39Z', '2026-03-22T11:53:48Z', '2026-03-22T11:53:48Z'),
('019c805a-3295-78be-83f7-350e706be0c7', 'retromynd@gmail.com', '118205663441854214578', '{"name":"retromynd","hd":null,"sub":"118205663441854214578","email":"retromynd@gmail.com","email_verified":true,"family_name":null,"given_name":"retromynd","picture":"https://lh3.googleusercontent.com/a/ACg8ocIeaaX66FPAExAb4byz9jvfUaryr5qBZusHv7pWilGSH5u2_Vk=s96-c"}', '2026-02-21T13:18:40Z', '2026-03-22T20:05:54Z', '2026-03-22T20:05:54Z')