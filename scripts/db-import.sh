#!/usr/bin/env bash
# Import the exported Mocha database into your own Cloudflare D1, then add the
# auth `users` table. Run AFTER `wrangler d1 create retromynd-db` and after you've
# put the returned database_id into wrangler.json.
#
# Usage:
#   ./scripts/db-import.sh            # import into REMOTE D1 (production)
#   ./scripts/db-import.sh --local    # import into the LOCAL dev D1 (for `npm run dev`)
set -euo pipefail

DB_NAME="retromynd-db"
TARGET="--remote"
if [[ "${1:-}" == "--local" ]]; then TARGET="--local"; fi

echo ">> Importing full schema + seed data ($TARGET) ..."
npx wrangler d1 execute "$DB_NAME" $TARGET --file=migration/d1_dump.sql

echo ">> Creating + seeding the auth users table ($TARGET) ..."
npx wrangler d1 execute "$DB_NAME" $TARGET --file=migrations/0001_users.sql

echo ">> Done. Quick check:"
npx wrangler d1 execute "$DB_NAME" $TARGET --command "SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM arcade_badges) AS badges, (SELECT COUNT(*) FROM arcade_rewards) AS rewards;"
