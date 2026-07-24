# Suggested Git Commit Messages — Week 8 Final Completion

Recommended as separate, atomic commits (in this order) rather than one giant commit, so the history stays reviewable:

1. **`fix(security): restrict user management API to admins`**
   ```
   fix(security): restrict user management API to admins

   /api/users/* previously only required a valid JWT, meaning any
   authenticated user could view, create, edit, or delete any other
   user's account by guessing IDs. Add a requireAdmin middleware and
   gate the whole users router behind it.

   Regular users now manage their own account via the new PUT /api/me
   instead (see next commit).
   ```

2. **`feat(auth): add self-service profile update endpoint`**
   ```
   feat(auth): add self-service profile update endpoint

   Add PUT /api/me so an authenticated user can update their own name
   and password without admin access. Password changes require the
   current password, except for Google-only accounts (no password set
   yet), which can set one directly. toSafeUser() now includes a
   hasPassword flag so clients can distinguish the two cases.
   ```

3. **`feat(profile): add Profile page`**
   ```
   feat(profile): add Profile page

   New protected /profile route: view account summary (avatar, name,
   email, role) and edit display name / change or set a password.
   Wired into the Navbar (desktop avatar link + mobile nav) and
   App.jsx routing. AuthContext gains updateUser() so the Navbar
   reflects changes immediately without a reload.
   ```

4. **`fix(ai): actually enforce the Gemini request timeout`**
   ```
   fix(ai): actually enforce the Gemini request timeout

   geminiService.js documented a request timeout via AbortController,
   but the SDK call itself had no timeout wired up — a hung Gemini
   response could block indefinitely. Add withTimeout(), which races
   the SDK call against GEMINI_TIMEOUT_MS and rejects with a retryable
   AIServiceError.

   Also removes dead code left over from before the @google/genai SDK
   migration (GEMINI_BASE_URL, extractJsonText, a duplicate sleep()
   declaration) and stray debug console.log calls. Aligns the in-code
   GEMINI_MODEL fallback with the documented default (gemini-2.0-flash).
   ```

5. **`fix(mobile): make review card actions reachable on touch devices`**
   ```
   fix(mobile): make review card actions reachable on touch devices

   Edit/delete buttons on review cards were opacity-0 until :hover,
   which is unreachable on touch devices (no persistent hover state).
   Buttons are now always visible below the sm breakpoint and only
   hover-fade on pointer/desktop devices.
   ```

6. **`fix(ui): restore dark mode on Footer and Home page`**
   ```
   fix(ui): restore dark mode on Footer and Home page

   Footer.jsx (rendered on every page) and Home.jsx's wrapper +
   Features section had no dark: Tailwind variants at all, so dark
   mode broke site-wide on those elements. Add the missing variants.

   Also fixes the hero eyebrow badge, which showed a miscopied
   fragment of the footer's copyright text instead of real tagline
   copy.
   ```

7. **`feat(ux): add ErrorBoundary, skeleton loaders, and empty states`**
   ```
   feat(ux): add ErrorBoundary, skeleton loaders, and empty states

   - ErrorBoundary wraps the app in main.jsx and individually wraps
     each Dashboard chart, so a bad data point can't crash the page.
   - New Skeleton primitives (SkeletonCard, SkeletonStatRow,
     SkeletonBarList, SkeletonListRows, ...) replace bare spinners on
     Dashboard, Reviews, and Home with layout-matching placeholders.
   - New EmptyState component gives a consistent icon/title/
     description/action pattern for empty lists across the app.
   ```

8. **`chore: remove dead code and unused template scaffolding`**
   ```
   chore: remove dead code and unused template scaffolding

   - Delete backend/data/store.js (216 lines, Week 4 in-memory store,
     fully superseded by Prisma since Week 5 but never actually
     deleted — README already claimed it was gone).
   - Delete unused Vite scaffolding: src/App.css, src/assets/react.svg,
     src/assets/vite.svg, unused hero.png — none were imported
     anywhere.
   ```

9. **`docs: update README, add feature list, testing checklist, and bug log`**
   ```
   docs: update README, add feature list, testing checklist, and bug log

   - README: new "Week 8 — Final Completion" section, updated REST API
     table (PUT /api/me, admin-only users routes), updated project
     structure tree.
   - New FEATURES.md: full implemented-feature inventory.
   - New TESTING_CHECKLIST.md: manual QA checklist covering auth,
     Google login, CRUD, dashboard, AI, responsive breakpoints,
     protected routes, profile, logout, error/loading states, and
     forms/validation.
   - New BUGFIXES.md: detailed write-up of every bug found and fixed
     this pass.
   ```

---

If you'd rather squash this into fewer commits, the minimum sensible split is:
- one **security** commit (#1),
- one **feature** commit (#2 + #3, Profile end-to-end),
- one **bugfix** commit (#4 + #5 + #6),
- one **polish** commit (#7),
- one **cleanup** commit (#8),
- one **docs** commit (#9).
