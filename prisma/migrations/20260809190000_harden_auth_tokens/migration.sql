-- Authentication tokens are short-lived and cannot be safely transformed
-- because only their plaintext representation exists in legacy rows. Drop
-- those rows before changing the storage contract; users can request new ones.
DELETE FROM "VerificationToken";
DELETE FROM "PasswordResetToken";
DELETE FROM "TwoFactorToken";

DROP INDEX IF EXISTS "VerificationToken_token_key";
DROP INDEX IF EXISTS "VerificationToken_email_token_key";
DROP INDEX IF EXISTS "PasswordResetToken_token_key";
DROP INDEX IF EXISTS "PasswordResetToken_email_token_key";
DROP INDEX IF EXISTS "TwoFactorToken_token_key";
DROP INDEX IF EXISTS "TwoFactorToken_email_token_key";

ALTER TABLE "VerificationToken"
  RENAME COLUMN "token" TO "tokenHash";
ALTER TABLE "VerificationToken"
  ADD COLUMN "userId" TEXT,
  ADD COLUMN "targetEmail" TEXT;

ALTER TABLE "PasswordResetToken"
  RENAME COLUMN "token" TO "tokenHash";
ALTER TABLE "PasswordResetToken"
  ADD COLUMN "userId" TEXT;

ALTER TABLE "TwoFactorToken"
  RENAME COLUMN "token" TO "tokenHash";
ALTER TABLE "TwoFactorToken"
  ADD COLUMN "userId" TEXT;

CREATE UNIQUE INDEX "VerificationToken_tokenHash_key" ON "VerificationToken"("tokenHash");
CREATE INDEX "VerificationToken_email_idx" ON "VerificationToken"("email");
CREATE INDEX "VerificationToken_userId_idx" ON "VerificationToken"("userId");
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE UNIQUE INDEX "TwoFactorToken_tokenHash_key" ON "TwoFactorToken"("tokenHash");
CREATE INDEX "TwoFactorToken_email_idx" ON "TwoFactorToken"("email");
CREATE INDEX "TwoFactorToken_userId_idx" ON "TwoFactorToken"("userId");

ALTER TABLE "VerificationToken"
  ADD CONSTRAINT "VerificationToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PasswordResetToken"
  ADD CONSTRAINT "PasswordResetToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TwoFactorToken"
  ADD CONSTRAINT "TwoFactorToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
