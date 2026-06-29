# RetroMynd — migração da Mocha para o Cloudflare

Este repositório é o RetroMynd exportado da Mocha e adaptado para rodar na **sua
própria conta Cloudflare**, no domínio **retromynd.com**, sem depender de nada da Mocha.

A arquitetura foi mantida (menor risco, nada se perde): **Cloudflare Worker (Hono) +
D1 (SQLite) + R2**. Só os pontos amarrados à Mocha foram substituídos.

---

## O que mudou em relação ao export da Mocha

| Antes (Mocha) | Agora |
|---|---|
| Login via `@getmocha/users-service` | Google OAuth próprio + sessão JWT — `src/worker/auth.ts` (backend) e `src/react-app/auth/` (frontend). Mesma interface (`useAuth`, `AuthProvider`), então as ~21 telas não mudaram de lógica. |
| Imagens em `*.mochausercontent.com` | Servidas localmente em `/assets/...` (pasta `public/assets/`). Baixe os arquivos com `scripts/download-assets.mjs`. |
| `@getmocha/vite-plugins` no build | Removido do `vite.config.ts`. |
| Binding `EMAILS` (emails-service) | Removido do `wrangler.json` (não era usado pelo código). |
| IDs Mocha em `wrangler.json` | Placeholders (`retromynd`, `retromynd-db`, `retromynd-uploads`) — preenchidos no deploy. |
| Identidades dos usuários na Mocha | Tabela `users` no D1 (`migrations/0001_users.sql`), com os 3 usuários originais e **os mesmos IDs** (mantém o vínculo com `user_arcade_stats` etc.). |

Material de referência do export fica em `migration/` (dump do banco, lista de assets,
`users.json`, README original da Mocha). **Não** contém segredos.

---

## Passo a passo para colocar no ar

### 0. Pré-requisitos
- Node 20+, conta Cloudflare (plano grátis serve), Wrangler (`npx wrangler`).
- `npm install`

### 1. Baixar os assets da Mocha (URGENTE — antes da Mocha desligar)
Em uma máquina com internet aberta (o ambiente do Claude bloqueia o CDN da Mocha):
```bash
node scripts/download-assets.mjs   # baixa ~115 imagens para public/assets/
```

### 2. Criar credenciais do Google OAuth
No [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services →
Credentials → Create OAuth client ID → **Web application**. Em **Authorized redirect URIs**:
- `https://retromynd.com/auth/callback` (produção)
- `http://localhost:5173/auth/callback` (dev)

Guarde o **Client ID** e o **Client Secret**.

### 3. Configurar segredos
Copie `.env.example` para `.dev.vars` (dev local) e preencha. Gere o `SESSION_SECRET`:
```bash
openssl rand -base64 48
```
> ⚠️ **Rotacione TODAS as chaves** que vieram no export (Stripe, Gemini, Firecrawl,
> Printify) — elas vazaram no zip. A senha em texto puro do `.env` antigo foi
> **descartada**: admin é definido só por `ADMIN_EMAILS` (`retromynd@gmail.com`).

### 4. Rodar local
```bash
npm run dev      # http://localhost:5173  (o cloudflare/vite plugin lê .dev.vars)
```
Para o banco local: `wrangler d1 create retromynd-db` (uma vez), cole o `database_id`
em `wrangler.json`, depois `./scripts/db-import.sh --local`.

### 5. Deploy na Cloudflare
```bash
npx wrangler d1 create retromynd-db          # cole o database_id no wrangler.json
npx wrangler r2 bucket create retromynd-uploads
./scripts/db-import.sh                        # importa dump + tabela users (remoto)

# Segredos de produção (um por vez):
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GOOGLE_REDIRECT_URI   # https://retromynd.com/auth/callback
npx wrangler secret put SESSION_SECRET
npx wrangler secret put ADMIN_EMAILS
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put FIRECRAWL_API_KEY
npx wrangler secret put PRINTIFY_API_TOKEN
npx wrangler secret put PRINTIFY_SHOP_ID

npm run build && npx wrangler deploy
```

### 6. Apontar o domínio retromynd.com
- Desvincule `retromynd.com` da Mocha.
- No painel Cloudflare → Workers & Pages → `retromynd` → Settings → Domains & Routes →
  **Add Custom Domain** → `retromynd.com` (TLS é automático).
- Se o DNS do domínio já está na Cloudflare (provável, via Mocha), é direto.

### 7. Stripe (3 webhooks)
No dashboard Stripe, aponte os 3 endpoints para o novo domínio e gere os signing secrets:
- `https://retromynd.com/api/webhooks/stripe`
- `https://retromynd.com/api/webhooks/stripe-account`
- `https://retromynd.com/api/webhooks/retropass`

---

## Verificação
1. `npm run build` — compila sem erro (✅ já validado nesta migração).
2. Login Google: `/login` → consentimento → `/auth/callback` → home logado.
3. `GET /api/users/me` retorna `{ id, email, google_user_data }`.
4. Admin (`retromynd@gmail.com`) recebe `isAdmin: true` em `/api/admin/check`.
5. `/arcade` carrega as capas de `/assets/...`.

## Integrações que continuam (portáveis)
Stripe (pagamentos/assinatura), Google Gemini (IA), Firecrawl (scraping), Printify
(print-on-demand). Só precisam das chaves nos segredos.
