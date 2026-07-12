// ─── Passport Google OAuth2 Configuration ────────────────────────────────────
// Week 6: Google OAuth. Stateless (session: false) — we issue our own JWT
// after a successful Google login, so no server-side session is needed.

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('../lib/prisma');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

// Only register the strategy if credentials are configured, so the rest of
// the API keeps working out of the box in environments where OAuth hasn't
// been set up yet (e.g. local dev without a Google Cloud project).
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) {
            return done(null, false, { message: 'Google account has no email.' });
          }

          // 1. Existing Google-linked user -> log them in.
          let user = await prisma.user.findUnique({ where: { googleId: profile.id } });

          if (!user) {
            // 2. A user already registered with this email (password account)
            //    -> link the Google ID to that existing account.
            user = await prisma.user.findUnique({ where: { email } });
            if (user) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId: profile.id },
              });
            } else {
              // 3. Brand-new user -> create one automatically.
              user = await prisma.user.create({
                data: {
                  name: profile.displayName || email.split('@')[0],
                  email,
                  googleId: profile.id,
                  password: null,
                  role: 'viewer',
                },
              });
            }
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      },
    ),
  );
}

module.exports = passport;
