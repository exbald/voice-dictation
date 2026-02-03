# Requirements: Multi-Tenant Voice Dictation SaaS

## Overview

Transform the voice dictation app from a single-user demo into a multi-tenant SaaS platform where users authenticate, provide their own STT API keys, and track their usage costs.

## Goals

1. **User Authentication** - Enable Google OAuth and email/password sign-in
2. **API Key Management** - Users store their own Deepgram/ElevenLabs API keys securely
3. **Usage Tracking** - Track transcription duration and calculate costs per session
4. **Dashboard** - Display usage metrics and cost summaries
5. **Auth-Gated Access** - All transcription requires authentication

## User Stories

### Authentication

- As a user, I can sign in with Google for quick access
- As a user, I can sign up/in with email and password
- As a user, I see a sign-in modal when I try to record without being authenticated
- As a user, pressing Ctrl (keyboard hotkey) also triggers the sign-in modal if not authenticated

### API Key Management

- As a user, I can add my Deepgram API key in settings
- As a user, I can add my ElevenLabs API key in settings
- As a user, I can see which providers I have configured (masked key hints)
- As a user, I can delete my API keys
- As a user, my API keys are stored securely (encrypted at rest)

### Transcription

- As an authenticated user with API keys, I can transcribe using my own keys
- As a user without API keys configured, I see a prompt to add keys in settings
- As a user, my transcription uses my selected provider's API key

### Usage & Costs

- As a user, I can see my total transcription minutes on the dashboard
- As a user, I can see my estimated costs per provider
- As a user, I can see monthly usage breakdowns
- As a user, each transcription session is tracked (duration, provider, cost)

### Navigation

- As a signed-in user, I see my avatar in the header
- As a signed-in user, I can access Dashboard, Settings, and Logout from a dropdown menu

## Acceptance Criteria

### Authentication Gate

- [ ] Clicking record button without login shows sign-in modal
- [ ] Pressing Ctrl key without login shows sign-in modal
- [ ] After sign-in, user is redirected to settings page
- [ ] Both Google OAuth and email/password work

### Settings Page

- [ ] Protected route (redirects to home if not authenticated)
- [ ] Can add Deepgram API key
- [ ] Can add ElevenLabs API key
- [ ] Keys display as masked hints (e.g., "****xyz1")
- [ ] Can delete configured keys
- [ ] Shows empty state with instructions when no keys configured

### Dashboard Page

- [ ] Protected route
- [ ] Shows total minutes transcribed
- [ ] Shows total estimated cost
- [ ] Shows breakdown by provider
- [ ] Shows monthly usage chart

### Token Endpoints

- [ ] Return 401 if not authenticated
- [ ] Return 400 if user has no API key for requested provider
- [ ] Use user's decrypted API key for STT service

### Provider Toggle

- [ ] Shows which providers user has configured
- [ ] Disables providers without configured keys
- [ ] Links to settings for unconfigured providers

## Dependencies

- Existing BetterAuth setup (email/password working)
- Existing STT provider abstraction layer
- PostgreSQL database with Drizzle ORM
- shadcn/ui components

## Out of Scope

- Rate limiting on API endpoints
- Admin dashboard for managing all users
- Billing/payment integration
- API key validation against provider services
- Email notifications for usage thresholds
