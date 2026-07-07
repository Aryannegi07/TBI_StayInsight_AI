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
│   ├── server.js             ← Entry point (Week 5: + graceful shutdown)
│   ├── .env.example          ← Environment variable template (DATABASE_URL, DIRECT_URL)
│   ├── package.json          ← Week 5: + prisma, @prisma/client, prisma:* scripts
│   ├── lib/
│   │   └── prisma.js         ← Week 5: Prisma Client singleton
│   ├── prisma/
│   │   ├── schema.prisma     ← Week 5: User, Review, Analysis models
│   │   ├── seed.js           ← Week 5: demo data seed script
│   │   └── migrations/
│   │       └── 20260705000000_init/
│   │           └── migration.sql
│   ├── routes/
│   │   ├── auth.js           ← POST /api/login
│   │   ├── dashboard.js      ← GET  /api/dashboard
│   │   ├── reviews.js        ← CRUD + search for reviews
│   │   ├── users.js          ← Week 5: CRUD for users
│   │   └── analyses.js       ← Week 5: CRUD for analyses
│   ├── controllers/
│   │   ├── authController.js       ← Week 5: rewired onto Prisma
│   │   ├── dashboardController.js  ← Week 5: rewired onto Prisma
│   │   ├── reviewsController.js    ← Week 5: rewired onto Prisma
│   │   ├── usersController.js      ← Week 5: new
│   │   └── analysisController.js   ← Week 5: new
│   └── middleware/
│       ├── errorHandler.js   ← Week 5: + Prisma error code mapping
│       └── requestLogger.js  ← Request/response logger
│
└── src/                      ← React frontend (Weeks 2–3, unchanged)
    ├── components/
    │   ├── Navbar.jsx
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
    │   ├── Dashboard.jsx
    │   ├── Reviews.jsx
    │   ├── Login.jsx
    │   └── UIShowcase.jsx
    ├── context/
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

## 🌐 REST API Endpoints

| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| GET    | `/`                             | API health check         |
| POST   | `/api/login`                    | Authenticate user        |
| GET    | `/api/dashboard`                | Dashboard statistics     |
| GET    | `/api/reviews`                  | List all reviews         |
| GET    | `/api/reviews/search?q=<query>` | Search reviews           |
| GET    | `/api/reviews/:id`              | Get single review        |
| POST   | `/api/reviews`                  | Create a review          |
| PUT    | `/api/reviews/:id`              | Update a review          |
| DELETE | `/api/reviews/:id`              | Delete a review          |
| GET    | `/api/users`                    | List all users *(Week 5)*   |
| GET    | `/api/users/:id`                | Get single user *(Week 5)*  |
| POST   | `/api/users`                    | Create a user *(Week 5)*    |
| PUT    | `/api/users/:id`                | Update a user *(Week 5)*    |
| DELETE | `/api/users/:id`                | Delete a user *(Week 5)*    |
| GET    | `/api/analyses`                 | List all analyses *(Week 5)*   |
| GET    | `/api/analyses/:id`             | Get single analysis *(Week 5)* |
| POST   | `/api/analyses`                 | Create an analysis *(Week 5)*  |
| PUT    | `/api/analyses/:id`             | Update an analysis *(Week 5)*  |
| DELETE | `/api/analyses/:id`             | Delete an analysis *(Week 5)*  |

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

## ✅ Verification Notes (how Week 5 was tested)

- **Schema correctness:** `prisma/schema.prisma` was translated into `prisma/migrations/20260705000000_init/migration.sql` and applied against a real local PostgreSQL 16 instance. All three tables, the unique constraints (`users.email`, `analyses.reviewId`), the indexes (`reviews.property`, `reviews.userId`), and both foreign keys (`ON DELETE SET NULL` / `ON DELETE CASCADE`) were confirmed via `\d` to be created exactly as designed.
- **API/route logic:** Every controller (reviews, users, analyses, auth, dashboard) was smoke-tested end-to-end — create, read, update, delete, search, validation failures, and 404/401 paths — against a mock data layer that mirrors the Prisma Client API, confirming the Express wiring, status codes, and response shapes are correct.
- **Not run against your Supabase project:** `npx prisma generate` and `npx prisma migrate dev` could not be executed against the real Prisma engine in the build environment used to prepare this ZIP, because that environment's network is restricted to package registries and can't reach `binaries.prisma.sh` (which Prisma needs to download its query engine). **You need to run `npm install`, then `npx prisma migrate dev --name init`, then `npx prisma db seed` yourself** with your real Supabase credentials in `backend/.env` — this is a normal first-time setup step and should work without any manual intervention.

---

## 💻 Run Frontend

```bash
# From project root (StayInsight AI/)
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` by default.
