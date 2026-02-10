# Action Required: Add Mistral Voxtral Realtime STT Provider

Manual steps that must be completed by a human. These cannot be automated.

## Before Implementation

No manual steps required before implementation begins.

## During Implementation

No manual steps required during implementation.

## After Implementation

- [ ] **Get a Mistral API key** - Sign up at https://console.mistral.ai and generate an API key with audio/transcription permissions
- [ ] **Add Mistral API key in Settings** - Navigate to the app's Settings page and add the Mistral API key to enable the provider
- [ ] **Test real-time transcription** - Select Mistral in the provider dropdown, hold Ctrl, speak, and verify transcription works end-to-end
- [ ] **Verify browser WebSocket auth** - If `api_key` query parameter auth doesn't work with Mistral's WebSocket, may need to iterate on the auth mechanism (try subprotocol or server proxy approach)

---

> **Note:** These tasks are also listed in context within `implementation-plan.md`
