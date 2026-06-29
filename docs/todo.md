# Todo

## SVG Icon Migration - Replace All Emojis
- #108: Replace emojis in translations.ts (ai.welcome, footer.madeIn90s for all 6 languages) ✓ DONE
- #109: Replace emojis in products.ts and Marketplace.tsx category icons ✓ DONE
- #110: Replace avatar emojis in worker/index.ts (AVATAR_PRESETS, LEADERBOARD_ICONS) ✓ DONE
- #111: Replace emojis in RetroPass.tsx (DEMO_CUSTOM_OPTIONS, icon displays) ✓ DONE
- #112: Replace emojis in UserProfile.tsx (DEMO_BADGES, avatar displays) ✓ DONE
- #113: Replace emojis in OnlineGame.tsx and OnlineLobby.tsx (avatar mapping, game types) ✓ DONE
- #114: Replace emojis in game components (MemoryGame cards, lives, win messages) ✓ DONE
- #115: Replace remaining emojis (Arcade.tsx, Header.tsx, Home.tsx, etc.) ✓ DONE

## Anime Arena - Turn-Based Online Games (RetroPass Exclusive)
- #101: Create AnimeCardBattle.tsx - Yu-Gi-Oh style card game with monsters, spells, traps ✓ DONE
- #102: Add card battle to OnlineGame.tsx with full game logic
- #103: Create AnimeTurnBattle.tsx - RPG-style 1v1 battles with skills and elements
- #104: Create AnimeQuizBattle.tsx - Anime trivia competitive mode
- #105: Add Anime Arena section to Arcade.tsx (separate from retro Online Arena)
- #106: Generate anime game cover art
- #107: Add anime arena translations to all 6 languages

## Online Arena - Multiplayer RetroPass Exclusive
- #92: Database migration (online_game_rooms, online_matchmaking_queue, online_match_history, online_player_stats) ✓ DONE
- #93: API endpoints for matchmaking, rooms, moves, stats, leaderboards ✓ DONE
- #94: Online Arena section in Arcade.tsx ✓ DONE
- #95: Create OnlineLobby.tsx page (matchmaking UI, room code entry) ✓ DONE
- #96: Create OnlineGame.tsx wrapper page with polling/state sync
- #97: Implement TicTacToeOnline.tsx (first turn-based online game)
- #98: Implement PongOnline.tsx (first real-time online game)
- #99: Add online arena translations to all 6 languages
- #100: Connect online stats to user profile

## RetroPass - Novas Features Premium
- #85: Database migration (mystery_boxes, login_streaks, avatar_frames, tournaments) ✓ DONE
- #86: API endpoints para todas as 4 features ✓ DONE
- #87: UI - Mystery Box section no RetroPass.tsx
- #88: UI - Login Streak com calendário e recompensas
- #89: UI - Avatar Frames selector com preview animado
- #90: UI - Tournaments list e rankings
- #91: Translations para todas as novas features (6 idiomas)

## RetroPass - Sistema de Assinatura Premium
- #78: Database migration (retropass_subscriptions, retropass_coupons) ✓ DONE
- #79: API endpoints (subscribe, cancel, status, coupons, customize, webhook) ✓ DONE
- #80: RetroPass.tsx premium page ✓ DONE
- #81: Add /retropass route to App.tsx ✓ DONE
- #82: Add RetroPass link to Arcade page ✓ DONE (golden button with Crown icon)
- #83: Integrate RetroPass status with leaderboard (show custom icons/colors) ✓ DONE
- #84: RetroPass translations for all 6 languages ✓ DONE

## Shadow Hunter - Isometric Roguelike Game
- #69: Create game canvas with character visible ✓ DONE
- #76: Add premium game card to Arcade page ✓ DONE
- #70: Add enemies and combat system
- #71: Create procedural dungeon rooms
- #72: Add curse/blessing system (Curse of the Dead Gods style)
- #73: Add boss fights
- #74: Add game menu and progression
- #75: Add game translations for all 6 languages

## RetroLab - Template TV para Redes Sociais
- #63: Template estático vertical gerado ✓ DONE
- #64: RetroLab.tsx página criada ✓ DONE
- #65: Adicionar traduções do RetroLab para 6 idiomas ✓ DONE
- #66: Restringir acesso RetroLab apenas para admins ✓ DONE
- #67: Video recording + share modal ✓ DONE
- #68: Add retrolab video/share translations to all 6 languages

## User Profile System
- #58: Database migration - user_profiles table ✓ DONE
- #59: API endpoints for profile CRUD ✓ DONE
- #60: Profile page UI (UserProfile.tsx) ✓ DONE
- #61: Achievement/badge display section in profile ✓ DONE
- #62: Profile translations for all 6 languages (profile.*, header.profile) ✓ DONE
- #56: Create CustomProducts.tsx page with Printify catalog integration ✓ DONE
- #57: Add Printify API endpoints for products, variants, and order creation ✓ DONE

## Secure Account Transaction System (Escrow)
- #48: Database + API endpoints ✓ DONE (account_transactions, account_credentials, transaction_messages, transaction_disputes tables + 15 API endpoints)
- #49: Create TransactionRoom.tsx page - secure chat + delivery flow UI ✓ DONE
- #50: Add credential input form to CreateListing.tsx for account listings ✓ DONE
- #51: Add "Buy Now (Escrow)" button to ListingDetail.tsx for accounts ✓ DONE
- #52: Create MyTransactions.tsx page - list buyer/seller transactions ✓ DONE
- #53: Add transaction translations to all 6 languages ✓ DONE
- #54: Admin disputes panel (AdminDisputes.tsx) ✓ DONE
- #55: Add link to MyTransactions from Header or Marketplace page ✓ DONE
- #37: Implement remaining 2 arcade games (SolitaireGame, ReversiGame) ✓ DONE
- #38: Connect all 30 new game components to Arcade.tsx modal ✓ DONE
- #39: Generate remaining game covers ✓ DONE (all 30 covers generated)
- #40: Update Arcade.tsx GAMES array with all new cover URLs ✓ DONE

## Leaderboard System - COMPLETO
- #41: API endpoints for leaderboard ✓ DONE (GET /api/arcade/leaderboards, GET /api/arcade/my-rankings)
- #42: Leaderboard UI component in Arcade.tsx ✓ DONE (period filters, user stats, per-game rankings)
- #43: Leaderboard translations for all 6 languages ✓ DONE

## Dropshipping Multi-Fornecedor - COMPLETO
- #20: Criar tabelas de banco (fornecedores, produtos_dropship, pedidos) ✓ DONE
- #21: Painel admin de fornecedores (CRUD) ✓ DONE
- #22: Sistema de importação de produtos ✓ DONE
- #23: Carrinho e checkout com Stripe ✓ DONE
- #24: Roteamento de pedidos por fornecedor ✓ DONE
- #25: Sistema de rastreamento ✓ DONE
- #26: Dashboard de lucros e margens ✓ DONE (needs translations)

## Importação Automática de Produtos
- #34: Backend Firecrawl extract-product endpoint ✓ DONE
- #35: UI melhorada com carrossel de imagens e preview detalhado ✓ DONE

## AI Features - Completo
- #11-18: All UI complete ✓

## Remaining Polish
- #27: Add profit dashboard translations to all 6 languages ✓ DONE
- #28: Retro Radio ✓ DONE (SomaFM + Listen.moe channels with full i18n)

## Arcade & Badges System
- #29: Arcade page with synthwave visual ✓ DONE
- #30: Badge database tables and API endpoints ✓ DONE
- #31: Connect badges to Stripe checkout (earn badges on purchase) ✓ DONE
- #32: Implement playable HTML5 games ✓ DONE
- #33: Ticket redemption system (exchange tickets for rewards) ✓ DONE

## Arcade Sound Effects
- #44: useGameSounds hook created ✓ DONE (Web Audio API synthesized retro sounds)
- #45: Sounds added to: Game2048, SnakeGame, TetrisGame, BreakoutGame, MemoryGame, FlappyGame ✓ DONE
- #46: Sounds added to: PongGame, AsteroidsGame, InvadersGame, PacmanGame, FroggerGame, DinoGame, MinesweeperGame, SudokuGame, WordleGame ✓ DONE
- #47: Add sounds to all 36 arcade games ✓ DONE
