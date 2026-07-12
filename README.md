# StayInsight AI

StayInsight AI is a modern web application that helps businesses analyze customer reviews using AI-powered insights. The platform provides a clean dashboard, review management system, and responsive user interface designed to transform customer feedback into actionable information.

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
- Navbar shows **Reviews / Dashboard / Sign out** when logged in, and **Sign in / Register** when logged out

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
│   ├── server.js             ← Entry point (Week 6: + passport.initialize())
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
│   │   ├── auth.js           ← POST /register, /login, GET /me, /auth/google(/callback)
│   │   ├── dashboard.js      ← GET /api/dashboard (protected)
│   │   ├── reviews.js        ← CRUD + search (create/delete protected)
│   │   ├── users.js          ← CRUD for users (protected)
│   │   └── analyses.js       ← CRUD for analyses (protected)
│   ├── controllers/
│   │   ├── authController.js       ← register, login, googleCallback, me
│   │   ├── dashboardController.js
│   │   ├── reviewsController.js
│   │   ├── usersController.js
│   │   └── analysisController.js
│   └── middleware/
│       ├── auth.js           ← Week 6: verifyToken (JWT)
│       ├── validators.js     ← Week 6: express-validator chains
│       ├── rateLimiter.js    ← Week 6: express-rate-limit (auth routes)
│       ├── errorHandler.js
│       └── requestLogger.js
│
└── src/                      ← React frontend
    ├── api/
    │   ├── axios.js          ← Week 6: shared Axios instance (JWT attach + 401 auto-logout)
    │   └── api.js            ← Endpoint helpers (AuthAPI, ReviewsAPI, DashboardAPI)
    ├── components/
    │   ├── Navbar.jsx        ← Week 6: auth-aware links
    │   ├── ProtectedRoute.jsx ← Week 6: route guard
    │   ├── GoogleButton.jsx  ← Week 6: "Continue with Google"
    │   ├── Hero.jsx
    │   ├── ReviewCard.jsx
    │   ├── Footer.jsx
    │   └── ui/
    │       ├── Button.jsx
    │       ├── Input.jsx
    │       ├── Modal.jsx
    │       ├── Toast.jsx
    │       ├── Loader.jsx
    │       └── index.js
    ├── pages/
    │   ├── Home.jsx
    │   ├── Dashboard.jsx      ← protected
    │   ├── Reviews.jsx        ← protected
    │   ├── Login.jsx
    │   ├── Register.jsx       ← Week 6: new
    │   ├── OAuthCallback.jsx  ← Week 6: new
    │   └── UIShowcase.jsx
    ├── context/
    │   ├── AuthContext.jsx
    │   └── ThemeContext.jsx
    ├── App.jsx
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

Generate a `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

If `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are left blank, every other endpoint keeps working normally — `GET /api/auth/google` simply responds `503` instead of starting the OAuth flow.

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
| GET    | `/api/auth/google`              | –              | Start Google OAuth       |
| GET    | `/api/auth/google/callback`     | –              | Google OAuth callback    |
| GET    | `/api/dashboard`                | ✅             | Dashboard statistics     |
| GET    | `/api/reviews`                  | –              | List all reviews         |
| GET    | `/api/reviews/search?q=<query>` | –              | Search reviews           |
| GET    | `/api/reviews/:id`              | –              | Get single review        |
| POST   | `/api/reviews`                  | ✅             | Create a review          |
| PUT    | `/api/reviews/:id`              | –              | Update a review          |
| DELETE | `/api/reviews/:id`              | ✅             | Delete a review          |
| GET    | `/api/users`                    | ✅             | List all users              |
| GET    | `/api/users/:id`                | ✅             | Get single user             |
| POST   | `/api/users`                    | ✅             | Create a user               |
| PUT    | `/api/users/:id`                | ✅             | Update a user               |
| DELETE | `/api/users/:id`                | ✅             | Delete a user               |
| GET    | `/api/analyses`                 | ✅             | List all analyses           |
| GET    | `/api/analyses/:id`             | ✅             | Get single analysis         |
| POST   | `/api/analyses`                 | ✅             | Create an analysis          |
| PUT    | `/api/analyses/:id`             | ✅             | Update an analysis          |
| DELETE | `/api/analyses/:id`             | ✅             | Delete an analysis          |

Protected routes (✅) require an `Authorization: Bearer <token>` header and return `401` without one.

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

## 🧰 Tech Stack

**Frontend:** React 19, React Router 7, Vite, Tailwind CSS, Axios
**Backend:** Node.js, Express 4, Prisma ORM, PostgreSQL (Supabase)
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
