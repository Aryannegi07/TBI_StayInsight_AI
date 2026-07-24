# StayInsight AI — Testing Checklist (Week 8 Final)

How to use this: this checklist covers every area called out for Week 8 final testing. Boxes are unchecked because they need to be run against a live instance (real Supabase DB + `npm install`) — this build environment has no network access, so everything here was verified by full static/code audit (syntax checks, import-resolution checks, and manual logic tracing of every route/controller/component) rather than by executing the app. Treat this as your run-through script for a local or staged environment.

## 0. Setup
- [ ] `cd backend && npm install` completes without errors
- [ ] `cp backend/.env.example backend/.env` and fill in `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` (at minimum)
- [ ] `npx prisma migrate dev --name init` creates all three tables in Supabase
- [ ] `npx prisma db seed` populates demo users/reviews/analyses
- [ ] `npm run dev` (backend) starts on `:5000` with no errors
- [ ] `cd .. && npm install && npm run dev` (frontend) starts on `:5173` with no errors
- [ ] Visiting `http://localhost:5173` loads the Home page with no console errors

## 1. Authentication
- [ ] Register a new account with a valid name/email/password → redirected to Dashboard, JWT stored
- [ ] Register with a duplicate email → `409` + inline error, no crash
- [ ] Register with a short password (<6 chars) → inline validation error, no network request sent
- [ ] Register with an invalid email format → inline validation error
- [ ] Login with correct demo credentials (`admin@stayinsight.ai` / `password123`) → redirected to Dashboard
- [ ] Login with wrong password → `401` + inline error, password field doesn't leak in any response
- [ ] Login with a non-existent email → same generic error (no user enumeration)
- [ ] 6 rapid login attempts within 15 minutes → 6th returns `429`
- [ ] Refreshing the page after login keeps you logged in (token persisted)

## 2. Google Login
- [ ] "Continue with Google" on `/login` redirects to Google's consent screen
- [ ] "Continue with Google" on `/register` does the same
- [ ] First-time Google sign-in creates a new user and lands on `/dashboard`
- [ ] Returning Google user logs in as the same account (no duplicate created)
- [ ] Signing in with Google using an email that already has a password account links the accounts (one row, `googleId` populated) rather than erroring or duplicating
- [ ] `/oauth-callback` briefly shows a loading state, then redirects — no flash of broken UI

## 3. CRUD (Reviews)
- [ ] Create a review with all fields filled → appears in Browse tab and Dashboard recent list
- [ ] Create a review missing a required field → inline + server validation error
- [ ] Edit a review → changes persist after refresh
- [ ] Delete a review → disappears from list; confirm a delete confirmation step exists
- [ ] Search reviews by keyword → filters correctly; clearing search restores full list
- [ ] Attempting create/update/delete while logged out → redirected to login or `401` handled gracefully (not a blank screen)

## 4. Dashboard & Analytics
- [ ] Stat tiles show correct totals/averages matching the underlying review data
- [ ] Sentiment donut renders and matches the actual sentiment split
- [ ] Rating trend chart renders with no console errors on a dataset of 1 review, 0 reviews, and many reviews
- [ ] Property performance panel shows an `EmptyState` (not a broken chart) when there's no data
- [ ] Refresh button re-fetches without a full page reload
- [ ] Loading state on first load shows skeleton placeholders, not a blank page or layout jump

## 5. AI Feature
- [ ] Paste a clearly positive review and analyze → sentiment "positive", plausible score/points/host reply
- [ ] Paste a clearly negative review and analyze → sentiment "negative", improvement suggestions present
- [ ] Analyze an existing review by ID (not just raw text)
- [ ] Submit an empty comment → validation error, no request sent
- [ ] Temporarily unset `GEMINI_API_KEY` → `POST /api/ai/analyze` returns `503` instead of crashing, and the frontend shows a clear error rather than hanging
- [ ] Force a slow/failing Gemini response (or exceed the AI rate limit — 15 req/15min) → the app either falls back to the mock analysis or shows a clear error, never an infinite spinner (this pass added a real timeout — verify it actually fires under a simulated hang)

## 6. Responsive Design
Test each of the following pages at **375px, 768px, 1024px, and 1440px** widths (or Chrome DevTools device presets):
- [ ] Home
- [ ] Login / Register
- [ ] Dashboard
- [ ] Reviews (both tabs)
- [ ] Profile
- [ ] Navbar collapses to a mobile menu below the `md` breakpoint and the menu is fully usable
- [ ] Review card edit/delete buttons are tappable at 375px (this pass fixed a hover-only bug here — confirm the fix by testing on an actual touch device or DevTools touch emulation, not just mouse hover)
- [ ] No horizontal scroll/overflow on any page at 375px

## 7. API Calls (network layer)
- [ ] Every mutating request includes `Authorization: Bearer <token>` when logged in
- [ ] A request with an expired/invalid token gets a `401` and the frontend auto-logs-out and redirects to `/login`
- [ ] Network failure (e.g. backend stopped) shows a friendly error + retry button, not a raw stack trace
- [ ] Loading indicators appear during every async fetch (Dashboard, Reviews list, AI analysis, Profile save)

## 8. Protected Routes
- [ ] Logged out, visiting `/dashboard` directly → redirected to `/login`
- [ ] Logged out, visiting `/reviews` directly → redirected to `/login`
- [ ] Logged out, visiting `/profile` directly → redirected to `/login`
- [ ] Logged in, all three routes render normally
- [ ] Logged in as a non-admin user, calling `/api/users` directly (e.g. via curl/Postman) → `403`

## 9. Profile (new this pass)
- [ ] View page shows correct name/email/role/avatar (or initials if no picture)
- [ ] Edit display name → saves, Navbar updates immediately
- [ ] Change password with correct current password → succeeds
- [ ] Change password with wrong current password → `401` + inline error, nothing is changed
- [ ] Google-only account (no password set) sees "Set a password" (not "Change password") and can set one without entering a current password
- [ ] Save button is disabled when nothing has changed

## 10. Logout
- [ ] Sign out clears the token and redirects appropriately
- [ ] After logout, visiting a protected route redirects to `/login` (session is truly gone, not just hidden in the UI)

## 11. Error Handling
- [ ] Every page that fetches data has a distinct error state with a retry action
- [ ] A thrown render error anywhere in the tree is caught by `ErrorBoundary` and shows a friendly fallback instead of a blank white screen
- [ ] 404 for an unknown API route returns clean JSON, not an HTML stack trace
- [ ] Global error handler maps Prisma error codes (`P2002`, `P2025`, `P2003`, `P2014`) to sensible HTTP statuses (409/404/409/400 respectively — verify against `errorHandler.js`)

## 12. Loading States
- [ ] Dashboard shows skeleton tiles/panels on first load
- [ ] Reviews Browse tab shows a skeleton card grid while fetching
- [ ] Home's featured reviews show a skeleton grid while fetching
- [ ] AI analysis shows its dedicated `AIAnalysisSkeleton` while streaming/analyzing
- [ ] Profile save button shows a spinner + disables inputs while saving

## 13. Forms & Validation (cross-cutting)
- [ ] Every form (Register, Login, Profile, Review create/edit) blocks submission client-side on invalid input
- [ ] Every form's server-side validation matches its client-side rules (test by bypassing the frontend, e.g. curl with bad data)
- [ ] Validation error messages are specific and field-level, not just a generic "something went wrong"

## 14. Regression (things fixed this pass — re-verify they stay fixed)
- [ ] Set dark mode, then hard-refresh the page — no flash of light mode before dark mode applies
- [ ] Dark mode toggle applies correctly on Home and Footer (previously broken)
- [ ] Hero eyebrow badge shows real tagline copy, not leftover footer text
- [ ] `/api/users/*` rejects a non-admin JWT with `403`
- [ ] `PUT /api/me` works for both password and Google-only accounts
- [ ] `backend/data/store.js` no longer exists and nothing references it
