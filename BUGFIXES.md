# StayInsight AI — Bugs Found & Fixed (Week 8 Final Pass)

Found via a full audit of every backend and frontend file (not just the files that were recently touched). Ordered roughly by severity.

## Security

### 1. Authorization gap on `/api/users/*`
**Before:** every route in `routes/users.js` only required `verifyToken` — i.e. *any* logged-in user (even the seeded demo "viewer" account) could `GET`, `POST`, `PUT`, or `DELETE` **any user's account**, including admin accounts, just by guessing sequential IDs. Authentication (who you are) was being used where authorization (what you're allowed to do) was needed.
**Fix:** added a `requireAdmin` middleware (checks `req.user.role === 'admin'` from the JWT payload) and applied it to every route in that router. Regular users now manage their own account exclusively through the new `PUT /api/me`.
**Files:** `backend/middleware/auth.js`, `backend/routes/users.js`

## Functional bugs

### 2. Gemini request timeout was documented but not implemented
**Before:** the header comment in `geminiService.js` claimed "Enforce a request timeout (`AbortController`)", but the actual SDK call (`ai.models.generateContent(...)`) had no timeout logic wired to it at all. A hung/slow Gemini response would block the request indefinitely (up to the platform's own connection timeout, if any).
**Fix:** added a `withTimeout()` helper that races the SDK call against `GEMINI_TIMEOUT_MS` and rejects with a retryable `AIServiceError` if it's exceeded.
**File:** `backend/services/geminiService.js`

### 3. Review card action buttons unreachable on touch devices
**Before:** the edit/delete buttons on each review card in `Reviews.jsx` were `opacity-0` and only became visible on `:hover` / `:focus-within`. Touch devices (phones, tablets — i.e. most of the 375px breakpoint) have no persistent hover state, so these buttons were effectively invisible and untappable on mobile.
**Fix:** buttons are now always visible below the `sm` breakpoint, and hover-fade only kicks in on pointer/desktop devices (`opacity-100 sm:opacity-0 sm:group-hover:opacity-100`).
**File:** `src/pages/Reviews.jsx`

## Visual / UX bugs

### 4. Flash of light mode on page load (FOUC)
**Before:** `index.html` had no logic to apply the dark class before React mounts. `ThemeContext`'s `useEffect` only adds the `dark` class to `<html>` *after* React has rendered once — so a user who previously chose dark mode would see a flash of the light-mode page for a frame (or longer, on a slow connection) before it switched to dark.
**Fix:** added a small blocking inline `<script>` in `index.html`'s `<head>` that reads the same `si-theme` localStorage key `ThemeContext` uses and applies the `dark` class immediately, before first paint.
**File:** `index.html`

### 5. Dark mode broken site-wide via the Footer
**Before:** `Footer.jsx` (rendered on every single page) had zero `dark:` Tailwind variants — background, borders, and text all stayed light-mode colors regardless of the active theme.
**Fix:** added the missing `dark:` variants throughout.
**File:** `src/components/Footer.jsx`

### 6. Home page ignored dark mode
**Before:** the page wrapper and the entire Features section on `Home.jsx` had no `dark:` classes, so the top-level background and that section stayed white/light-only even in dark mode, clashing with the rest of the app.
**Fix:** added `dark:` variants to the wrapper, headings, body text, card backgrounds, and borders.
**File:** `src/pages/Home.jsx`

### 7. Miscopied hero badge text
**Before:** the small "eyebrow" badge above the hero headline read *"2026 StayInsight AI. All rights reserved"* — clearly a copy-paste artifact from the Footer's copyright line, not an intentional tagline.
**Fix:** replaced with real copy ("Powered by AI-driven guest analytics") and added the missing dark-mode variants on the same element.
**File:** `src/components/Hero.jsx`

## Missing functionality

### 8. No way to view or edit your own profile
**Before:** the Navbar displayed a user's avatar and name, but there was no page or endpoint for a user to see their full account details, change their display name, or change their password — despite this being one of the explicit Week 8 requirements to verify.
**Fix:** added `PUT /api/me` (backend) and a new `/profile` page (frontend), wired into routing and the Navbar.
**Files:** `backend/controllers/authController.js`, `backend/routes/auth.js`, `backend/middleware/validators.js`, `src/pages/Profile.jsx`, `src/context/AuthContext.jsx`, `src/App.jsx`, `src/components/Navbar.jsx`

## Dead code / cleanliness

### 9. `backend/data/store.js` — 216 lines of unreferenced Week 4 code
The README already claimed (as far back as the Week 5 changelog entry) that this file had been removed once everything moved to Prisma/PostgreSQL. It hadn't been — it was still sitting in the repo, fully dead (only a code *comment* elsewhere referenced its old name, not an actual `require`). Deleted.

### 10. Duplicate `sleep()` function + two unused symbols in `geminiService.js`
Leftover from an earlier version of the file that called the Gemini REST API directly via `fetch` before it was migrated to the `@google/genai` SDK: `GEMINI_BASE_URL` (a URL string, never used since the SDK handles its own endpoint) and `extractJsonText()` (parsed a raw REST response shape the SDK never produces) were both dead. There was also an accidental duplicate `sleep()` function declaration. All removed; stray debug `console.log`s in the same function were removed too (the meaningful `console.error`/`console.warn` logging was kept).

### 11. Unused Vite scaffolding
`src/App.css`, `src/assets/react.svg`, `src/assets/vite.svg`, and an unused `hero.png` were leftover from the initial Vite template and never imported anywhere in the app. Deleted.

### 12. `GEMINI_MODEL` default mismatch
The in-code fallback (`process.env.GEMINI_MODEL || "gemini-2.5-flash"`) didn't match the model documented as the default in both `README.md` and `backend/.env.example` (`gemini-2.0-flash`). Since `.env.example` sets the variable explicitly, this had no runtime effect for anyone following the setup docs — but it was a real inconsistency that would only surface if `GEMINI_MODEL` were ever unset. Aligned the code default to match the documentation.

---

**Not a bug, but worth noting:** none of the above were caught by an automated test suite, because this project doesn't have one yet (no Jest/Vitest/Supertest configured). Everything above was found via manual, file-by-file code audit. Adding an automated test suite covering at least auth, CRUD, and the AI fallback path would be the natural next step after this pass — see `TESTING_CHECKLIST.md` for what such a suite should cover first.
