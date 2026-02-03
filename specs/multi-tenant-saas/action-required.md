# Action Required: Multi-Tenant Voice Dictation SaaS

Manual steps that must be completed by a human. These cannot be automated.

## Before Implementation

- [x] **Set up Google OAuth credentials** - Already configured in `.env` (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET). Verify redirect URI is set in Google Cloud Console: `http://localhost:3000/api/auth/callback/google`

## During Implementation

- [x] **Run database migrations** - Migration generated (`drizzle/0002_silent_pepper_potts.sql`). Run `npm run db:migrate` when database is accessible.

## After Implementation

- [ ] **Test Google OAuth flow** - Sign in with a real Google account to verify OAuth is working
- [ ] **Test with real API keys** - Add actual Deepgram and ElevenLabs API keys to verify encryption/decryption works correctly

---

> **Note:** These tasks are also listed in context within `implementation-plan.md`
