# Action Required: Multi-Provider STT

Manual steps that must be completed by a human. These cannot be automated.

## Before Implementation

- [ ] **Create ElevenLabs account** - Sign up at https://elevenlabs.io if you don't have an account
- [ ] **Generate ElevenLabs API key** - Go to Profile Settings > API Keys and create a new key
- [ ] **Add ELEVENLABS_API_KEY to .env.local** - Add the key to your local environment file

## During Implementation

None required.

## After Implementation

- [ ] **Verify ElevenLabs billing** - Ensure your ElevenLabs account has credits for STT usage (pricing: ~$0.28/hour)

---

> **Note:** These tasks are also listed in context within `implementation-plan.md`

## Environment Variable Reference

```env
# Add to .env.local
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

The ElevenLabs API key can be found at: https://elevenlabs.io/app/settings/api-keys
