-- Google Login fix: store the user's Google profile picture (avatar) so the
-- Navbar / Dashboard can display it. NULL for password-only accounts.
-- AlterTable
ALTER TABLE "users" ADD COLUMN "picture" TEXT;
