# StayInsight AI — Deployment Instructions

Two-part deployment: the frontend (static Vite build) and backend (long-running Express + PostgreSQL) go to **different** platforms. This doc is self-contained; see `README.md` for deeper background on the database and environment variables.

## Prerequisites
- A GitHub (or similar) repo containing this project
- A free [Supabase](https://supabase.com) project (PostgreSQL + connection pooler)
- A [Vercel](https://vercel.com) account (frontend)
- A [Render](https://render.com) account (backend) — or any other Node host that supports a `render.yaml`-style Blueprint or a manual Node web service
- (Optional) A [Google Cloud Console](https://console.cloud.google.com/apis/credentials) OAuth client, if you want Google login live in production
- (Optional) A [Google AI Studio](https://aistudio.google.com/app/apikey) API key, if you want the AI analysis feature live in production

## 1. Database (Supabase)
1. Create a free project at supabase.com.
2. **Project Settings → Database → Connection string.**
3. Copy the **pooled** URI (port `6543`) — this becomes `DATABASE_URL`.
4. Copy the **direct** connection (port `5432`) — this becomes `DIRECT_URL`.
5. Keep both handy for step 3 below.

## 2. Backend → Render

**Option A — Blueprint (recommended):**
1. In the Render dashboard: **New → Blueprint**.
2. Point it at this repo. Render reads `render.yaml` and provisions a web service with:
   - `rootDir: backend`
   - Build: `npm install && npx prisma migrate deploy`
   - Start: `npm start`
3. Fill in the environment variables Render prompts for (see the table below).

**Option B — Manual web service:**
1. **New → Web Service**, connect the repo, set **Root Directory** to `backend`.
2. Build command: `npm install && npx prisma migrate deploy`
3. Start command: `npm start`
4. Add environment variables in the **Environment** tab.

### Required backend environment variables
| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Pooled Supabase connection string (port 6543) |
| `DIRECT_URL` | Yes | Direct Supabase connection string (port 5432), used only for migrations |
| `JWT_SECRET` | Yes | Long random string. Generate with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | No (default `1d`) | Token lifetime |
| `FRONTEND_ORIGIN` | Yes in production | Set to your exact Vercel URL once you have it (step 3) — CORS is restricted to this one origin |
| `PORT` | No | Render sets this automatically; don't hardcode it |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Only for Google login | From Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | Only for Google login | `https://<your-render-service>.onrender.com/api/auth/google/callback` — must exactly match the Authorized redirect URI in Google Cloud Console |
| `GEMINI_API_KEY` | Only for AI analysis | From Google AI Studio; leave unset to have `/api/ai/analyze` respond `503` instead of erroring |
| `GEMINI_MODEL` | No (default `gemini-2.0-flash`) | |
| `GEMINI_TIMEOUT_MS` | No (default `15000`) | |
| `GEMINI_MAX_RETRIES` | No (default `2`) | |

⚠️ Never commit real values for any of these — only `.env.example` files are tracked in git. Set real secrets directly in Render's dashboard.

5. Deploy. Note the resulting backend URL (e.g. `https://stayinsight-ai-backend.onrender.com`).
6. (Optional, first deploy only) Seed demo data by running `npx prisma db seed` from a Render shell, or locally against the same `DATABASE_URL`/`DIRECT_URL`.

> Render's free tier spins down idle services — the first request after idle may take ~30–60s to wake up. This is a platform characteristic, not an app bug.

## 3. Frontend → Vercel
1. Import the repo at [vercel.com/new](https://vercel.com/new). Vercel auto-detects Vite (build command `npm run build`, output directory `dist`) via `vercel.json` / `package.json` at the project root.
2. Set the environment variable **`VITE_API_URL`** to your Render backend URL **including** the `/api` suffix, e.g.:
   ```
   VITE_API_URL=https://stayinsight-ai-backend.onrender.com/api
   ```
3. Deploy. `vercel.json` includes a catch-all SPA rewrite, so client-side routes (`/dashboard`, `/reviews`, `/profile`, etc.) work on a hard refresh or direct link instead of 404ing.
4. Note the resulting frontend URL (e.g. `https://stayinsight-ai.vercel.app`).

## 4. Wire the two together
1. Back in Render, set `FRONTEND_ORIGIN` to the exact Vercel URL from step 3 (no trailing slash), then redeploy the backend so CORS picks it up.
2. If using Google OAuth, update `GOOGLE_CALLBACK_URL` in **both** Render's env vars and the Google Cloud Console's Authorized redirect URIs to match the Render backend URL exactly.
3. Visit the Vercel URL and do a full smoke test:
   - Register a new account
   - Log in
   - "Continue with Google" (if configured)
   - Create a review, analyze it with AI (if `GEMINI_API_KEY` is set)
   - View the Dashboard
   - Visit `/profile`, edit your name
   - Toggle dark mode
   - Log out

## 5. Post-deploy checklist
- [ ] `https://<backend>/` (root) returns the API health-check JSON, not an error
- [ ] `https://<frontend>` loads with no console errors
- [ ] Registering/logging in works end-to-end against the real database
- [ ] Refreshing on `/dashboard` (or any client-side route) doesn't 404
- [ ] CORS isn't blocking requests (check the Network tab for CORS errors if the frontend can't reach the backend)
- [ ] If Google OAuth is enabled, the full consent-screen round trip works
- [ ] If the AI feature is enabled, an end-to-end analysis returns real Gemini output (not just the mock fallback)

## Rolling back / redeploying
- Both Vercel and Render redeploy automatically on a push to the connected branch (unless you've disabled that).
- Database schema changes: update `prisma/schema.prisma`, run `npx prisma migrate dev --name <description>` locally against a dev database first, commit the generated migration folder, then let Render's build command (`npx prisma migrate deploy`) apply it in production on the next deploy. Never edit a migration file that's already been applied to production.
