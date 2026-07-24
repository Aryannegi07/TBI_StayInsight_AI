# StayInsight AI — Implemented Features

Complete feature inventory as of the Week 8 final completion pass. Organized by area, not by week (see `README.md` for the week-by-week changelog).

## Authentication & Accounts
- Register with name/email/password (bcrypt-hashed, 10 salt rounds)
- Login with email/password, returns a signed JWT (`JWT_EXPIRES_IN`, default 1 day)
- "Continue with Google" (Google OAuth 2.0 via Passport.js) on both Login and Register
  - First-time Google sign-in auto-creates a user
  - Returning Google users log straight in
  - An existing password account with a matching email gets the Google ID linked automatically instead of creating a duplicate
- `GET /api/me` — fetch the current user's profile from a JWT
- `PUT /api/me` — **new this pass**: update your own display name, and change/set your password
  - Password change requires the current password (except for Google-only accounts setting a password for the first time)
- Logout (clears the token client-side, redirects to Home)
- Auto-logout on any `401` response (Axios response interceptor)
- Rate limiting on register/login (5 requests / 15 min / IP)

## Authorization
- Every write endpoint (create/update/delete reviews, all of users/analyses, dashboard, AI analyze) requires a valid JWT
- **New this pass**: `/api/users/*` is now admin-only (`requireAdmin` middleware) — closes a gap where any logged-in user could manage any other account
- Self-service profile editing (`/api/me`) available to any authenticated user for their own account only

## Reviews (CRUD)
- List all reviews, get a single review, search by keyword (`GET /api/reviews/search?q=`)
- Create, update, delete a review (all three require auth)
- Fields: guest name, property, star rating (1–5), comment, sentiment, tags
- Frontend: dedicated Reviews page with two tabs — **Analyse** (run the AI on a new/existing review) and **Browse** (search, view, create, edit, delete)

## Users & Analyses (CRUD)
- Full CRUD for `Analysis` records (one-to-one with a `Review`)
- Full CRUD for `User` records — admin-only (see Authorization above)

## Dashboard & Analytics
- Aggregate stats computed at the database level (PostgreSQL `count`/`aggregate`/`groupBy`, run concurrently via `Promise.all`) rather than pulled into Node and reduced in JS
- Stat tiles: total reviews, average rating, sentiment split, etc.
- Sentiment donut chart
- Rating trend chart
- Per-property performance breakdown
- Recent reviews list

## AI Review Analysis (Google Gemini)
- `POST /api/ai/analyze` — send a raw comment or an existing `reviewId`, get back structured JSON: sentiment, overall score, confidence, positive/negative points, improvement suggestions, and a suggested host reply
- Streaming variant that emits partial text as Gemini generates it, for a live "typing" UI
- Retry with exponential backoff on timeouts/network errors/`429`/`5xx`
- **Fixed this pass**: a real request timeout (previously documented but not actually implemented) now bounds every Gemini call
- Response-shape validation — a malformed AI response is rejected rather than passed through
- Deterministic keyword-based **fallback analysis** (`mockAiService.js`) used automatically if Gemini is rate-limited/unavailable, so the feature degrades gracefully instead of failing
- Dedicated rate limit (15 requests / 15 min / IP) to bound cost/abuse
- API key never logged, never returned in any response

## Frontend UI/UX
- Responsive layout tested at 375px / 768px / 1024px / 1440px
- Dark / light mode with persistence (localStorage) — **fixed this pass**: Footer and Home page had no dark-mode styling at all; now consistent site-wide
- Reusable component library: Button, Input, Modal, Toast, Loader, **Skeleton** (new), **EmptyState** (new)
- Loading states: skeleton placeholders that mirror the eventual layout (Dashboard, Reviews, Home) instead of a bare spinner
- Empty states: consistent icon + title + description + action pattern across Dashboard, Reviews, Home
- Error states: retry buttons on every data-fetching panel
- `ErrorBoundary` (new) wraps the whole app and individually wraps each Dashboard chart, so a bad data point can't crash the page
- Route-level code splitting (`React.lazy` + `Suspense`) — every page below the landing page ships as its own chunk
- `React.memo` on pure presentational components; `useMemo` for derived dashboard data
- Toast notifications for success/error feedback across every mutating action

## Forms & Validation
- Client-side validation with inline field errors: Register, Login, Profile, Review create/edit
- Server-side validation (`express-validator`) mirrors client-side rules (e.g. password ≥ 6 characters) so the API is safe even if the frontend is bypassed
- Consistent `{ success, message, errors[] }` JSON shape for validation failures

## Protected Routes
- `/dashboard`, `/reviews`, `/profile` require authentication — unauthenticated visitors are redirected to `/login`
- `ProtectedRoute` component wraps each

## Profile (new this pass)
- View account summary: avatar/initials, name, email, role
- Edit display name
- Change password (or set one, for Google-only accounts)
- Changes reflected immediately across the app (Navbar avatar/name) without a reload

## Security Hardening
- `helmet` security headers
- Tiered rate limiting: strict on auth (5/15min) and AI (15/15min), generous global limit on all of `/api/*` (300/15min) as defense in depth
- Request body size capped (100kb; review comment itself capped at 5000 characters)
- CORS restricted to a single configurable `FRONTEND_ORIGIN`
- Server fails fast at startup if `JWT_SECRET` is missing
- `requireAdmin` gate on user-management endpoints (new this pass)
- Prisma error codes mapped to correct HTTP status codes globally

## Deployment
- `vercel.json` — SPA rewrites + asset caching for the frontend
- `render.yaml` — Blueprint for the backend, including `prisma migrate deploy` on build
- Configurable API base URL (`VITE_API_URL`) so frontend/backend can live on different origins
