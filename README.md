# StayInsight AI

StayInsight AI is a modern web application that helps businesses analyze customer reviews using AI-powered insights. The platform provides a clean dashboard, review management system, and responsive user interface designed to transform customer feedback into actionable information.

> **Week 8 final completion deliverables:** [`FEATURES.md`](./FEATURES.md) (full feature inventory) · [`TESTING_CHECKLIST.md`](./TESTING_CHECKLIST.md) (manual QA checklist) · [`BUGFIXES.md`](./BUGFIXES.md) (bugs found & fixed this pass) · [`COMMIT_MESSAGES.md`](./COMMIT_MESSAGES.md) (suggested commit history) · [`DEPLOYMENT.md`](./DEPLOYMENT.md) (step-by-step deploy guide) · [`PROMPTS.md`](./PROMPTS.md) (Gemini prompt design notes)

---

## 🚀 Features

### Week 2 Features
- Responsive Navbar
- Hero Section with Call-to-Action
- Reusable Review Card Component
- Footer Component
- React Router Navigation
- Multiple Page Routes
- Responsive Design with Tailwind CSS

### Week 3 Features
- Reusable UI Component Library (Button, Input, Modal, Toast, Loader)
- Dark/Light Mode Toggle
- Theme Persistence using Local Storage
- Responsive Layout Support
- UI Showcase Page

### Week 4 Features (Backend)
- Node.js + Express REST API
- ~~In-memory data store~~ *(replaced in Week 5 — see below)*
- Full CRUD for Reviews
- Authentication endpoint
- Dashboard stats endpoint
- Search endpoint
- CORS enabled
- dotenv configuration
- Proper HTTP status codes (200, 201, 204, 400, 401, 404, 500)
- JSON error responses `{ success, message }`
- Request logger middleware
- Global error handler middleware

### Week 5 Features (Database Integration)
- **Real PostgreSQL database, hosted on Supabase**
- **Prisma ORM** for schema, migrations, and type-safe queries
- Three relational models: `User`, `Review`, `Analysis`
  - `User` 1—many `Review`
  - `Review` 1—1 `Analysis`
- Full CRUD for **Users** and **Analyses** (new endpoints)
- Reviews, Users, Auth, and Dashboard all rewired off Prisma — the old `backend/data/store.js` in-memory array is gone
- Prisma error codes (`P2002`, `P2025`, `P2003`, `P2014`) mapped to correct HTTP status codes in the global error handler
- Indexes on `reviews.property` and `reviews.userId` for query performance
- `createdAt`/`updatedAt` timestamps on every model
- Seed script (`prisma/seed.js`) to populate demo data
- Graceful shutdown that closes the Prisma connection pool

### Week 6 Features (Authentication & Security)
**Backend**
- `bcryptjs` password hashing on registration (10 salt rounds); passwords are never returned in any API response
- Real JWT issuance (`jsonwebtoken`) on register/login, verified by a `verifyToken` middleware on every protected route
- **Google OAuth 2.0** via Passport.js (`passport-google-oauth20`), stateless (no server-side sessions) — first-time Google sign-in auto-creates a user, returning users are logged straight in, and an existing password account with a matching email gets the Google ID linked to it automatically
- `express-validator` input validation on register, login, reviews, and analyses, with clean `{ success, message, errors[] }` JSON error responses
- `express-rate-limit` on `POST /api/register` and `POST /api/login` — 5 requests / 15 minutes per IP, returns `429`
- `POST /api/reviews`, `DELETE /api/reviews/:id`, all of `/api/analyses/*`, `/api/dashboard`, and all of `/api/users/*` now require a valid JWT (`401` otherwise)
- CORS restricted to a single configurable `FRONTEND_ORIGIN` (no more `origin: '*'`)
- `GET /api/me` — returns the authenticated user's profile (used by the frontend right after a Google OAuth redirect)

**Frontend**
- Login & Register pages wired to the real API, with client-side validation, loading states, and inline + toast error handling
- "Continue with Google" button on both Login and Register (full-page redirect into the backend OAuth flow)
- `/oauth-callback` page that exchanges the token Google OAuth hands back for the user's profile, then redirects to the Dashboard
- A shared Axios instance (`src/api/axios.js`) that automatically attaches the JWT to every request and automatically logs the user out + redirects to `/login` on any `401`
- `ProtectedRoute` component guarding `/dashboard` and `/reviews` — unauthenticated visitors are redirected to `/login`
- Navbar shows **Reviews / Dashboard / Profile / Sign out** when logged in, and **Sign in / Register** when logged out

### Week 7 Features (AI Review Analysis)
**Backend**
- **Google Gemini integration** — `POST /api/ai/analyze` sends a guest review to Gemini and returns structured JSON: `sentiment`, `overallScore`, `positivePoints`, `negativePoints`, `improvementSuggestions`, and a suggested `hostResponse`
- Accepts either a raw `comment` (+ optional `guestName`/`property`/`rating`) or a `reviewId` to analyze an existing stored review
- API key lives only in `backend/.env` (`GEMINI_API_KEY`) — never hardcoded, never logged, never returned in any response
- Request timeout (`GEMINI_TIMEOUT_MS`, default 15s) via `AbortController`
- Automatic retry with exponential backoff (`GEMINI_MAX_RETRIES`, default 2) on timeouts, network errors, `429`, and `5xx` — non-retryable errors (e.g. bad request, blocked content) fail fast
- Response shape validation — a malformed or incomplete AI response is rejected rather than passed through to the client
- `express-validator` input validation, `verifyToken` auth, and a dedicated rate limit (15 requests / 15 minutes per IP) to bound cost/abuse
- Structured request/response logging (`[AI] ...`) including duration and outcome, without ever logging the API key or full review text

### Week 8 Features (Optimization, Security & Deployment)
**Performance**
- `GET /api/dashboard` rewritten to aggregate in PostgreSQL (`count` / `aggregate` / `groupBy`, run concurrently via `Promise.all`) instead of pulling every review row into Node and reducing it in JavaScript — scales correctly as the table grows, and `recentReviews` now `select`s only the columns the dashboard actually renders
- `compression` (gzip) on every API response
- Frontend: route-level code splitting via `React.lazy` + `Suspense` in `App.jsx` — every page below the landing page ships as its own chunk
- `React.memo` on every pure presentational component (`ReviewCard`, `ScoreMeter`, `SentimentBadge`, `AIAnalysisCard`, `StatCard`, `SentimentDonut`, `RatingTrend`, `AIAnalysisSkeleton`) and `useMemo` for derived dashboard data, so they only re-render when their own props actually change

**Security**
- `helmet` for standard security headers (`X-Content-Type-Options`, `X-Frame-Options`, HSTS, etc.)
- A generous global rate limiter on every `/api/*` route (300 req / 15 min / IP) as defense in depth on top of the existing stricter auth (5/15min) and AI (15/15min) limiters
- Request body size capped at `100kb` (the largest accepted field, a review comment, is itself capped at 5000 characters)
- Server now fails fast at startup if `JWT_SECRET` is missing, instead of silently signing/verifying tokens with `undefined`
- Fixed `PUT /api/reviews/:id`, which had been the only unauthenticated write endpoint on the reviews router (inconsistent with `POST`/`DELETE`) — now requires a valid JWT like its siblings
- `trust proxy` enabled so rate limiting sees the real client IP behind a reverse proxy (Render, etc.)

**Deployment**
- `vercel.json` (SPA rewrites so client-side routes like `/dashboard` don't 404 on refresh, plus long-lived caching for hashed assets)
- `render.yaml` Blueprint for the backend (`rootDir: backend`, `npm install && npx prisma migrate deploy`, secrets left for the dashboard rather than committed)
- Frontend API base URL is now configurable via `VITE_API_URL` (`.env.example` at the project root) instead of a hardcoded `/api`, since the deployed frontend and backend live on different origins

**Documentation**
- `PROMPTS.md` — the exact production Gemini prompt, two alternative approaches considered (chain-of-thought, `systemInstruction` split) and why they weren't chosen, plus a sample request/response

### Week 8 — Final Completion (Polish, Full Audit & Security Hardening)

This pass was a full regression test of every Week 1–8 requirement (auth, Google login, CRUD, dashboard, analytics, the AI feature, responsiveness, API error/loading handling, protected routes, forms/validation) plus a line-by-line code audit of every file, backend and frontend. Everything that was found missing or broken has been implemented or fixed.

**New — Profile page (was missing)**
- `GET`-equivalent already existed (`/api/me`); added `PUT /api/me` so a logged-in user can update their own **name** and **password** without needing admin access
- Google-only accounts (no password set) get a "set a password" flow instead of "change password" — the safe user object now includes a `hasPassword` flag so the frontend knows which to show
- New `src/pages/Profile.jsx`, added to routing as a protected route and linked from the Navbar (desktop avatar + mobile menu)
- `AuthContext` gained `updateUser()` so the Navbar/avatar reflect a profile edit immediately, no reload needed

**Fixed — authorization gap (security)**
- `/api/users/*` previously only required *any* valid JWT — any logged-in user could view, create, edit, or delete **any other user's account** (including changing their role or password) just by guessing IDs. Added a `requireAdmin` middleware; that whole router is now admin-only account management. Regular users manage their own account via `PUT /api/me` instead.

**Fixed — real bugs found during the audit**
- `index.html` had no logic to set dark mode before React mounts, so a returning dark-mode user saw a flash of light mode on every page load — added a small blocking inline script that applies the `dark` class from `localStorage` before first paint
- Footer component (rendered on every page) had **no dark-mode styling at all** — dark mode was breaking site-wide
- Home page and its Features section were also missing dark-mode classes entirely
- Hero section's eyebrow badge showed the wrong text (a miscopied fragment of the footer's copyright line) instead of a real tagline
- Reviews page: card edit/delete buttons were `opacity-0` until hover, making them **unreachable on touch devices** (375px/mobile) — now always visible on small screens, hover-fade only for pointer devices
- `geminiService.js`: the header comment promised a request timeout via `AbortController`, but the actual Gemini SDK call had no timeout wired up at all — an unresponsive Gemini API call could hang indefinitely. Added a real `withTimeout()` race against `GEMINI_TIMEOUT_MS`.
- `geminiService.js` had a duplicate `sleep()` function declaration and two dead symbols (`GEMINI_BASE_URL`, `extractJsonText`) left over from before the switch to the `@google/genai` SDK, plus stray debug `console.log`s — removed
- In-code fallback default for `GEMINI_MODEL` (`gemini-2.5-flash`) didn't match the documented/`.env.example` default (`gemini-2.0-flash`) — aligned
- `backend/data/store.js`, the Week 4 in-memory array, was still sitting in the repo as 216 lines of fully dead code (nothing required it — Week 5 rewired everything onto Prisma, but the file itself was never deleted) — removed
- Removed unused leftover Vite scaffolding (`src/App.css`, `src/assets/react.svg`, `src/assets/vite.svg`, an unused `hero.png`) that wasn't imported anywhere

**Added — resilience & polish**
- `ErrorBoundary` component, wrapping the whole app in `main.jsx` and individually around each Dashboard chart, so a bad data point can't take down the page
- Reusable `Skeleton` primitives (`SkeletonCard`, `SkeletonStatRow`, `SkeletonBarList`, `SkeletonListRows`, etc.) and an `EmptyState` component — Dashboard, Reviews, and Home now show shape-matching loading skeletons and consistent empty states instead of plain spinners/ad-hoc text

**Verified clean**
- Every backend `.js` file passes `node --check` (zero syntax errors)
- Every frontend `.jsx`/`.js` file passes a TypeScript JSX parse check (zero syntax errors)
- Every relative `import`/`require` in the project resolves to a real file (verified programmatically)
- No unused imports or dead exports remain in any touched file

---

## 🗄️ Database Choice: Supabase (PostgreSQL)

This project uses [Supabase](https://supabase.com) as the PostgreSQL provider. Supabase gives you a free hosted Postgres database plus a connection pooler (PgBouncer), which is why the schema uses **two** connection strings:

- **`DATABASE_URL`** — the pooled connection (port 6543), used by the running app. Pooling matters because serverless/short-lived connections (and even a normal Express app under load) can otherwise exhaust Postgres's connection limit.
- **`DIRECT_URL`** — the direct connection (port 5432), used only by Prisma when running migrations. Migrations need a direct connection because the pooler doesn't support all the session-level features Prisma's migration engine relies on.

### Supabase Setup
1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → Database → Connection string**.
3. Copy the **URI** (pooled, port 6543) into `DATABASE_URL`, and the **Direct connection** (port 5432) into `DIRECT_URL` in `backend/.env`.

---

## 🔺 Prisma Setup & Migration Commands

```bash
cd backend
npm install                          # installs prisma + @prisma/client, and
                                      # runs `prisma generate` automatically (postinstall)

npx prisma generate                  # (re)generate the Prisma Client — safe to re-run anytime
npx prisma migrate dev --name init   # creates the tables in your Supabase database
npx prisma db seed                   # populates demo users/reviews/analyses
npx prisma studio                    # optional: opens a GUI to browse your data
```

The migration in `backend/prisma/migrations/20260705000000_init/` was written to match `schema.prisma` exactly and verified by applying it to a real local PostgreSQL instance during development — but it has not yet been run against your actual Supabase project. `npx prisma migrate dev --name init` will do that (and will create a *new* migration folder only if your local schema and the database drift apart, which they shouldn't on a first run).

---

## 🧬 Schema Diagram

```
┌────────────────┐         ┌──────────────────┐         ┌───────────────────┐
│      User       │        │      Review        │        │      Analysis       │
├────────────────┤        ├──────────────────┤        ├───────────────────┤
│ id          PK  │───┐    │ id            PK   │───┐    │ id             PK   │
│ name            │   │    │ guestName          │   │    │ reviewId  FK  UQ    │
│ email       UQ  │   └───▶│ property (idx)     │   └───▶│ summary             │
│ password        │        │ rating             │        │ keywords[]          │
│ role            │        │ sentiment          │        │ recommendation      │
│ createdAt       │        │ comment            │        │ createdAt           │
│ updatedAt       │        │ theme              │        │ updatedAt           │
└────────────────┘        │ tags[]             │        └───────────────────┘
                            │ createdAt          │
                            │ updatedAt          │
                            │ userId (idx) FK    │
                            └──────────────────┘

User.id  1───────* Review.userId     (ON DELETE SET NULL)
Review.id 1───────1 Analysis.reviewId (ON DELETE CASCADE)
```

---



## 📂 Project Structure

```text
StayInsight AI/
├── backend/                  ← Node.js/Express backend
│   ├── server.js             ← Entry point (helmet, compression, global rate limit, JWT_SECRET fail-fast check)
│   ├── .env.example          ← Environment variable template
│   ├── package.json
│   ├── config/
│   │   └── passport.js       ← Week 6: Google OAuth2 strategy
│   ├── lib/
│   │   └── prisma.js         ← Prisma Client singleton
│   ├── prisma/
│   │   ├── schema.prisma     ← User (+ googleId), Review, Analysis models
│   │   ├── seed.js
│   │   └── migrations/
│   │       ├── 20260705000000_init/
│   │       └── 20260712000000_add_google_oauth/
│   ├── routes/
│   │   ├── auth.js           ← POST /register, /login, GET+PUT /me, /auth/google(/callback)
│   │   ├── dashboard.js      ← GET /api/dashboard (protected)
│   │   ├── reviews.js        ← CRUD + search (create/update/delete protected)
│   │   ├── users.js          ← CRUD for users (admin-only — Week 8 final: requireAdmin)
│   │   ├── analyses.js       ← CRUD for analyses (protected)
│   │   └── ai.js              ← Week 7: POST /api/ai/analyze (protected + rate-limited)
│   ├── controllers/
│   │   ├── authController.js       ← register, login, googleCallback, me
│   │   ├── dashboardController.js  ← Week 8: DB-level aggregation (count/aggregate/groupBy)
│   │   ├── reviewsController.js
│   │   ├── usersController.js
│   │   ├── analysisController.js
│   │   └── aiController.js         ← Week 7: analyzeReviewHandler
│   ├── services/
│   │   └── geminiService.js  ← Week 7: Gemini API call, retry/timeout/validation; Week 8 final: real AbortController-style timeout race
│   └── middleware/
│       ├── auth.js           ← Week 6: verifyToken (JWT); Week 8 final: requireAdmin
│       ├── validators.js     ← Week 6: express-validator chains (+ Week 7: aiAnalyzeValidation, Week 8 final: updateMeValidation)
│       ├── rateLimiter.js    ← Week 6: authLimiter, aiLimiter (+ Week 8: apiLimiter)
│       ├── errorHandler.js
│       └── requestLogger.js
│
├── vercel.json                ← Week 8: frontend SPA rewrites + asset caching
├── render.yaml                ← Week 8: backend Blueprint
├── .env.example                ← Week 8: frontend env template (VITE_API_URL)
├── PROMPTS.md                  ← Week 8: Gemini prompt design notes
│
└── src/                      ← React frontend
    ├── api/
    │   ├── axios.js          ← Week 6: shared Axios instance (JWT attach + 401 auto-logout); Week 8: VITE_API_URL
    │   └── api.js            ← Endpoint helpers (AuthAPI, ReviewsAPI, DashboardAPI, AIApi)
    ├── hooks/                 ← Week 8: split out of context files for React Fast Refresh
    │   ├── useAuth.js
    │   ├── useTheme.js
    │   └── useToast.js
    ├── components/
    │   ├── Navbar.jsx        ← Week 6: auth-aware links; Week 8 final: Profile link
    │   ├── ProtectedRoute.jsx ← Week 6: route guard
    │   ├── ErrorBoundary.jsx ← Week 8 final: catches render errors app-wide + per-widget
    │   ├── GoogleButton.jsx  ← Week 6: "Continue with Google"
    │   ├── Hero.jsx
    │   ├── ReviewCard.jsx
    │   ├── Footer.jsx
    │   ├── ai/                ← AI Review Analysis UI
    │   │   ├── AIAnalysisCard.jsx    ← sentiment, score meter, points, host reply
    │   │   ├── AIAnalysisSkeleton.jsx
    │   │   ├── ScoreMeter.jsx
    │   │   └── SentimentBadge.jsx
    │   ├── dashboard/          ← Dashboard charts
    │   │   ├── StatCard.jsx
    │   │   ├── SentimentDonut.jsx
    │   │   └── RatingTrend.jsx
    │   └── ui/
    │       ├── Button.jsx
    │       ├── Input.jsx
    │       ├── Modal.jsx
    │       ├── Toast.jsx
    │       ├── Loader.jsx
    │       ├── Skeleton.jsx   ← Week 8 final: loading-state primitives
    │       ├── EmptyState.jsx ← Week 8 final: shared empty-state UI
    │       └── index.js
    ├── pages/                  ← Week 8: all routes below Home are React.lazy-loaded in App.jsx
    │   ├── Home.jsx
    │   ├── Dashboard.jsx      ← protected; stat cards, sentiment donut, rating trend
    │   ├── Reviews.jsx        ← protected; Analyse (real Gemini call) + Browse tabs
    │   ├── Profile.jsx        ← Week 8 final: protected; view/edit name + password
    │   ├── Login.jsx
    │   ├── Register.jsx       ← Week 6: new
    │   ├── OAuthCallback.jsx  ← Week 6: new
    │   └── UIShowcase.jsx
    ├── context/                ← Provider components only — hooks live in src/hooks/
    │   ├── AuthContext.jsx    /  authContext.js
    │   └── ThemeContext.jsx   /  themeContext.js
    ├── App.jsx                 ← Week 8: React.lazy + Suspense route splitting
    └── main.jsx
```

> Note: `backend/data/store.js` (the Week 4 in-memory array) has been **removed** — all data now lives in PostgreSQL via Prisma.

---

## 🛠️ Running Locally

### Prerequisites
- Node.js v18+
- A free [Supabase](https://supabase.com) project (see Database Choice section above)

### 1. Install Dependencies
```bash
cd backend
npm install
```
This also runs `prisma generate` automatically via the `postinstall` script.

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env: paste in your Supabase DATABASE_URL and DIRECT_URL
```

### 3. Create the Database Tables
```bash
npx prisma migrate dev --name init
```

### 4. (Optional) Seed Demo Data
```bash
npx prisma db seed
```

### 5. Run Backend

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The API will be available at `http://localhost:5000`.

---

## 🔐 Environment Variables (backend/.env)

Copy `backend/.env.example` to `backend/.env` and fill in real values:

| Variable | Required | Description |
|---|---|---|
| `PORT` | No (default `5000`) | Port the Express server listens on |
| `DATABASE_URL` | Yes | Pooled Supabase Postgres connection string |
| `DIRECT_URL` | Yes | Direct Supabase Postgres connection string (migrations) |
| `JWT_SECRET` | Yes | Long random string used to sign/verify JWTs |
| `JWT_EXPIRES_IN` | No (default `1d`) | Token lifetime, e.g. `1d`, `12h`, `30m` |
| `FRONTEND_ORIGIN` | No (default `http://localhost:5173`) | The only origin CORS allows, and where OAuth redirects land |
| `GOOGLE_CLIENT_ID` | Only for Google OAuth | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Only for Google OAuth | From Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | Only for Google OAuth | Must exactly match the redirect URI registered in Google Cloud Console |
| `GEMINI_API_KEY` | Only for AI analysis | From [Google AI Studio](https://aistudio.google.com/app/apikey); leave blank to disable `POST /api/ai/analyze` (responds `503`) |
| `GEMINI_MODEL` | No (default `gemini-2.0-flash`) | Which Gemini model to call |
| `GEMINI_TIMEOUT_MS` | No (default `15000`) | Per-request timeout before aborting |
| `GEMINI_MAX_RETRIES` | No (default `2`) | Retries after the first attempt for timeouts/network errors/`429`/`5xx` |

Generate a `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

If `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are left blank, every other endpoint keeps working normally — `GET /api/auth/google` simply responds `503` instead of starting the OAuth flow.

### Environment Variables (project root `.env`, frontend)

Copy `.env.example` (project root) to `.env` if you need to override the API base URL — most local dev setups don't need this at all, since `vite.config.js` already proxies `/api` to `http://localhost:5000`.

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Only in production | Absolute base URL of the deployed backend API, **including** the `/api` suffix (e.g. `https://your-backend.onrender.com/api`). Unset locally — falls back to `/api`, which the Vite dev proxy forwards to `localhost:5000`. |

> ⚠️ **Never commit a real `.env` file.** Both `.env` files in this repo are already listed in `.gitignore` — only the `*.env.example` templates should be tracked. If a real secret (a database password, `JWT_SECRET`, API key, etc.) is ever accidentally committed or shared, treat it as compromised and rotate it immediately rather than just removing it from the file, since removing it from a later commit doesn't erase it from history.

---

## 🔑 Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and create (or select) a project.
2. **Create Credentials → OAuth client ID → Web application.**
3. Add an **Authorized redirect URI** that exactly matches `GOOGLE_CALLBACK_URL`, e.g. for local dev:
   `http://localhost:5000/api/auth/google/callback`
4. Copy the generated **Client ID** and **Client secret** into `backend/.env` as `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
5. Restart the backend. The "Continue with Google" button on `/login` and `/register` will now work.

**Flow:** clicking the button navigates the browser to `GET /api/auth/google` → Google's consent screen → `GET /api/auth/google/callback` (Passport verifies the profile, auto-creates or links the `User` row) → the backend redirects to `FRONTEND_ORIGIN/oauth-callback?token=<jwt>` → the frontend stores the token, calls `GET /api/me`, and lands the user on `/dashboard`.

---

---

## 🌐 REST API Endpoints

| Method | Endpoint                        | Auth required | Description              |
|--------|---------------------------------|:--------------:|--------------------------|
| GET    | `/`                             | –              | API health check         |
| POST   | `/api/register`                 | – *(rate-limited)* | Create an account, returns JWT |
| POST   | `/api/login`                    | – *(rate-limited)* | Authenticate, returns JWT |
| GET    | `/api/me`                       | ✅             | Current user's profile   |
| PUT    | `/api/me`                       | ✅             | Update your own name / password |
| GET    | `/api/auth/google`              | –              | Start Google OAuth       |
| GET    | `/api/auth/google/callback`     | –              | Google OAuth callback    |
| GET    | `/api/dashboard`                | ✅             | Dashboard statistics     |
| GET    | `/api/reviews`                  | –              | List all reviews         |
| GET    | `/api/reviews/search?q=<query>` | –              | Search reviews           |
| GET    | `/api/reviews/:id`              | –              | Get single review        |
| POST   | `/api/reviews`                  | ✅             | Create a review          |
| PUT    | `/api/reviews/:id`              | ✅             | Update a review          |
| DELETE | `/api/reviews/:id`              | ✅             | Delete a review          |
| GET    | `/api/users`                    | ✅ *(admin only)* | List all users              |
| GET    | `/api/users/:id`                | ✅ *(admin only)* | Get single user             |
| POST   | `/api/users`                    | ✅ *(admin only)* | Create a user               |
| PUT    | `/api/users/:id`                | ✅ *(admin only)* | Update a user               |
| DELETE | `/api/users/:id`                | ✅ *(admin only)* | Delete a user               |
| GET    | `/api/analyses`                 | ✅             | List all analyses           |
| GET    | `/api/analyses/:id`             | ✅             | Get single analysis         |
| POST   | `/api/analyses`                 | ✅             | Create an analysis          |
| PUT    | `/api/analyses/:id`             | ✅             | Update an analysis          |
| DELETE | `/api/analyses/:id`             | ✅             | Delete an analysis          |
| POST   | `/api/ai/analyze`               | ✅ *(+ rate-limited)* | Analyze a review with Gemini AI |

Protected routes (✅) require an `Authorization: Bearer <token>` header and return `401` without one.

### AI Analysis Request/Response (POST /api/ai/analyze)
```json
// Request — either a reviewId...
{ "reviewId": 3 }
// ...or a raw comment
{ "comment": "Amazing stay! The host was incredibly attentive.", "guestName": "Alice", "property": "Ocean View Villa", "rating": 5 }
```
```json
// Response
{
  "success": true,
  "message": "Review analyzed successfully.",
  "data": {
    "sentiment": "positive",
    "overallScore": 91,
    "positivePoints": ["Attentive host", "Great location"],
    "negativePoints": [],
    "improvementSuggestions": ["Add a self-check-in guide for late arrivals"],
    "hostResponse": "Thank you so much for the kind words, Alice — we're thrilled you enjoyed your stay!"
  }
}
```

### Register (POST /api/register)
```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "password123" }
```

### Demo Credentials (POST /api/login)
```json
{ "email": "admin@stayinsight.ai", "password": "password123" }
```

### Create Review Body (POST /api/reviews)
```json
{
  "guestName": "Jane Doe",
  "property": "Ocean View Villa",
  "rating": 5,
  "comment": "Amazing stay!",
  "tags": ["cleanliness", "location"],
  "sentiment": "positive"
}
```

---

## ✅ Verification Notes (how Week 5 & 6 were tested)

- **Schema correctness:** `prisma/schema.prisma` was translated into `prisma/migrations/20260705000000_init/migration.sql` and applied against a real local PostgreSQL 16 instance. All three tables, the unique constraints (`users.email`, `analyses.reviewId`), the indexes (`reviews.property`, `reviews.userId`), and both foreign keys (`ON DELETE SET NULL` / `ON DELETE CASCADE`) were confirmed via `\d` to be created exactly as designed.
- **API/route logic:** Every controller (reviews, users, analyses, auth, dashboard) was smoke-tested end-to-end — create, read, update, delete, search, validation failures, and 404/401 paths — against a mock data layer that mirrors the Prisma Client API, confirming the Express wiring, status codes, and response shapes are correct.
- **Not run against your Supabase project:** `npx prisma generate` and `npx prisma migrate dev` could not be executed against the real Prisma engine in the build environment used to prepare this ZIP, because that environment's network is restricted to package registries and can't reach `binaries.prisma.sh` (which Prisma needs to download its query engine). **You need to run `npm install`, then `npx prisma migrate dev --name init`, then `npx prisma db seed` yourself** with your real Supabase credentials in `backend/.env` — this is a normal first-time setup step and should work without any manual intervention.

### Week 6 verification

- **Auth logic (register/login/JWT/validation/rate limiting/protected routes):** exercised end-to-end against a live Express server running with an in-memory mock of the Prisma `User` model (same shape as the real client). Confirmed: successful + duplicate registration (`201`/`409`), bcrypt-hashed passwords, password never present in any response, successful + failed login (`200`/`401`), `GET /api/me` and `GET /api/dashboard` returning `401` with no token and succeeding with a valid one, `400` + a clean `errors[]` array on bad input, and `429` once the 5-request/15-minute limit on `/register` + `/login` is exceeded.
- **Google OAuth account logic:** the Passport verify callback (new user → auto-create, returning Google user → log in as the same row, existing password account with matching email → `googleId` gets linked rather than a duplicate user being created) was unit-tested against the same mock data layer. The full browser consent-screen round trip can't be exercised without live Google credentials and a real network — set `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` in `.env` and test that leg manually once deployed.
- **Frontend:** `npm run build` and `npx eslint src` both pass cleanly on every new/changed file (`Login.jsx`, `Register.jsx`, `OAuthCallback.jsx`, `GoogleButton.jsx`, `ProtectedRoute.jsx`, `Navbar.jsx`, `App.jsx`, `src/api/*`). The Axios request/response interceptors (JWT attach, 401 auto-logout-and-redirect) were unit-tested in isolation with a mocked adapter.

---

## 🚢 Deployment

This is a two-part deployment: the frontend (static Vite build) and the backend (long-running Express server) go to **different** platforms.

### Frontend → Vercel

1. Import the repo into [Vercel](https://vercel.com/new). Vercel auto-detects Vite from `vercel.json` / `package.json` at the project root — build command `npm run build`, output directory `dist`.
2. Set the environment variable **`VITE_API_URL`** to your deployed backend's URL **including** `/api`, e.g. `https://stayinsight-ai-backend.onrender.com/api`.
3. Deploy. `vercel.json` includes a catch-all rewrite to `index.html`, so client-side routes (`/dashboard`, `/reviews`, etc.) work correctly on a hard refresh or direct link instead of 404ing.

### Backend → Render

**Option A — Blueprint (recommended):** the repo includes `render.yaml`. In the Render dashboard, choose **New → Blueprint**, point it at this repo, and Render will read `render.yaml` and provision a web service with `rootDir: backend`, `npm install && npx prisma migrate deploy` as the build command, and `npm start` as the start command.

**Option B — Manual web service:**
1. **New → Web Service**, connect the repo, set **Root Directory** to `backend`.
2. Build command: `npm install && npx prisma migrate deploy`
3. Start command: `npm start`
4. Add every variable from `backend/.env.example` in the **Environment** tab (Render's dashboard, not `render.yaml` — never commit real secrets). At minimum: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `FRONTEND_ORIGIN` (set this to your Vercel URL).

### After both are deployed

- Set the backend's `FRONTEND_ORIGIN` to the exact Vercel URL (CORS is intentionally restricted to one origin — see `server.js`).
- If using Google OAuth, update `GOOGLE_CALLBACK_URL` (both in Render's env vars and in the Google Cloud Console's Authorized redirect URIs) to `https://<your-render-service>.onrender.com/api/auth/google/callback`.
- Render's free tier spins down idle services — the first request after idle may take ~30-60s while it wakes up; this is a platform characteristic, not an app bug.

---

## 🤖 AI Prompt Design

See **[`PROMPTS.md`](./PROMPTS.md)** for the exact production prompt sent to Gemini, two alternative prompt strategies that were tried and why they weren't used, and a sample request/response pair for `POST /api/ai/analyze`.

---

## 🧰 Tech Stack

**Frontend:** React 19, React Router 7, Vite, Tailwind CSS, Axios
**Backend:** Node.js, Express 4, Prisma ORM, PostgreSQL (Supabase), `helmet`, `compression`
**Auth:** JWT (`jsonwebtoken`), `bcryptjs`, Passport.js + `passport-google-oauth20` (Google OAuth 2.0), `express-validator`, `express-rate-limit`, `cors`

---

## 💻 Run Frontend

```bash
# From project root (StayInsight AI/)
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` by default, and proxies `/api/*` requests to the backend on `http://localhost:5000` (see `vite.config.js`).

**Auth pages:** `/login`, `/register`, `/oauth-callback` (Google OAuth landing page — not meant to be visited directly). Visiting a protected page (`/dashboard`, `/reviews`) while logged out redirects to `/login`.

**Build for production:**
```bash
npm run build    # outputs to dist/
```
