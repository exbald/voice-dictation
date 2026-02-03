# Implementation Plan: Multi-Tenant Voice Dictation SaaS

## Overview

Transform the voice dictation app into a multi-tenant SaaS with user authentication, personal API key storage, cost tracking, and usage dashboards. All transcription requires authentication - users must sign in and configure their own API keys.

---

## Phase 1: Foundation ✅

Set up encryption utilities, database schema, and cost calculation helpers.

### Tasks

- [x] Create encryption utility for API keys (`src/lib/encryption.ts`)
- [x] Add database schema for user API keys and usage tracking (`src/lib/schema.ts`)
- [x] Run database migrations (migration generated: `drizzle/0002_silent_pepper_potts.sql`)
- [x] Create cost calculation utility (`src/lib/cost.ts`)

### Technical Details

**Encryption Utility** (`src/lib/encryption.ts`):
```typescript
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT = "voice-dictation-api-keys";

// Derive key from BETTER_AUTH_SECRET using scrypt
function getEncryptionKey(): Buffer {
  const secret = process.env.BETTER_AUTH_SECRET;
  return scryptSync(secret, SALT, 32);
}

// Returns format: iv:ciphertext:authTag (base64)
export function encrypt(plaintext: string): string { ... }
export function decrypt(ciphertext: string): string { ... }
export function generateKeyHint(apiKey: string): string {
  return "****" + apiKey.slice(-4);
}
```

**Database Schema** (`src/lib/schema.ts` additions):
```typescript
import { pgTable, text, timestamp, uuid, index, integer, numeric } from "drizzle-orm/pg-core";

export const userApiKey = pgTable(
  "user_api_key",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // "deepgram" | "elevenlabs"
    encryptedApiKey: text("encrypted_api_key").notNull(),
    keyHint: text("key_hint").notNull(), // "****xyz1"
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (table) => [
    index("user_api_key_user_id_idx").on(table.userId),
    index("user_api_key_user_provider_idx").on(table.userId, table.provider),
  ]
);

export const transcriptionSession = pgTable(
  "transcription_session",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    durationMs: integer("duration_ms").notNull(),
    costUsd: numeric("cost_usd", { precision: 10, scale: 6 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("transcription_session_user_id_idx").on(table.userId),
    index("transcription_session_created_at_idx").on(table.createdAt),
    index("transcription_session_user_provider_idx").on(table.userId, table.provider),
  ]
);
```

**Cost Utility** (`src/lib/cost.ts`):
```typescript
import type { STTProviderType } from "./stt/types";

export const PROVIDER_COSTS = {
  deepgram: { costPerMinute: 0.0043, name: "Deepgram Nova-3" },
  elevenlabs: { costPerMinute: 0.0067, name: "ElevenLabs Scribe v2" },
} as const;

export function calculateCost(provider: STTProviderType, durationMs: number): number {
  const minutes = durationMs / 60000;
  return minutes * PROVIDER_COSTS[provider].costPerMinute;
}

export function formatCost(costUsd: number): string {
  return costUsd < 0.01 ? `$${costUsd.toFixed(4)}` : `$${costUsd.toFixed(2)}`;
}

export function formatDuration(durationMs: number): string {
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}
```

**Migration Commands**:
```bash
npm run db:generate
npm run db:migrate
```

---

## Phase 2: API Layer ✅

Create API endpoints for settings management and usage tracking.

### Tasks

- [x] Create settings API for API key CRUD (`src/app/api/settings/api-keys/route.ts`)
- [x] Modify Deepgram token endpoint to use user keys (`src/app/api/deepgram/token/route.ts`)
- [x] Modify ElevenLabs token endpoint to use user keys (`src/app/api/elevenlabs/token/route.ts`)
- [x] Modify provider availability endpoint (`src/app/api/stt/providers/route.ts`)
- [x] Create usage stats endpoint (`src/app/api/usage/route.ts`)
- [x] Create session recording endpoint (`src/app/api/usage/session/route.ts`)

### Technical Details

**Settings API** (`src/app/api/settings/api-keys/route.ts`):
```typescript
// GET - List user's configured keys (provider + hint only)
// Response: { keys: [{ provider, keyHint, createdAt }] }

// POST - Add new API key
// Body: { provider: "deepgram" | "elevenlabs", apiKey: string }
// - Encrypt API key before storage
// - Generate hint from last 4 chars
// - Upsert (replace if exists for same provider)

// DELETE - Remove API key
// Query: ?provider=deepgram
```

**Modified Token Endpoints**:
```typescript
// Both /api/deepgram/token and /api/elevenlabs/token follow this pattern:

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userApiKey } from "@/lib/schema";
import { decrypt } from "@/lib/encryption";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  // 1. Require auth
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Get user's API key for this provider
  const [key] = await db
    .select()
    .from(userApiKey)
    .where(
      and(
        eq(userApiKey.userId, session.user.id),
        eq(userApiKey.provider, "deepgram") // or "elevenlabs"
      )
    );

  if (!key) {
    return Response.json(
      { error: "No API key configured", code: "NO_API_KEY" },
      { status: 400 }
    );
  }

  // 3. Decrypt and use
  const apiKey = decrypt(key.encryptedApiKey);

  // 4. Return credentials (same format as before)
  // ...
}
```

**Provider Availability** (`src/app/api/stt/providers/route.ts`):
```typescript
// Returns per-provider: { available, hasKey, name, model }
// - available: true (provider exists)
// - hasKey: boolean (user has configured key)
// Requires auth, returns 401 if not logged in
```

**Usage Stats** (`src/app/api/usage/route.ts`):
```typescript
// GET - Returns usage stats for authenticated user
// Response:
{
  summary: { totalDurationMs, totalCostUsd, sessionCount },
  byProvider: {
    deepgram: { durationMs, costUsd, sessions },
    elevenlabs: { durationMs, costUsd, sessions }
  },
  monthly: [{ month: "2024-01", durationMs, costUsd }]
}

// Uses SQL aggregation with GROUP BY
```

**Session Recording** (`src/app/api/usage/session/route.ts`):
```typescript
// POST - Record a completed transcription session
// Body: { provider: string, durationMs: number }
// - Auto-calculates cost using cost.ts
// - Requires auth
```

---

## Phase 3: Google OAuth ✅

Enable Google sign-in alongside existing email/password auth.

### Tasks

- [x] Configure Google OAuth in BetterAuth (`src/lib/auth.ts`)
- [x] Add Google sign-in button to sign-in form (`src/components/auth/sign-in-button.tsx`)

### Technical Details

**Auth Configuration** (`src/lib/auth.ts`):
```typescript
import { betterAuth } from "better-auth"

export const auth = betterAuth({
  // ... existing config
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
})
```

**Sign-In Button** (`src/components/auth/sign-in-button.tsx`):
```tsx
// Add Google button above email form
<Button
  onClick={() => signIn.social({
    provider: "google",
    callbackURL: "/settings"
  })}
  variant="outline"
  className="w-full"
>
  <GoogleIcon className="mr-2 h-4 w-4" />
  Continue with Google
</Button>

// Divider
<div className="relative my-4">
  <div className="absolute inset-0 flex items-center">
    <span className="w-full border-t" />
  </div>
  <div className="relative flex justify-center text-xs uppercase">
    <span className="bg-background px-2 text-muted-foreground">
      Or continue with email
    </span>
  </div>
</div>

// Existing email form below...
```

**Environment Variables** (already in `.env`):
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## Phase 4: UI Components ✅

Create settings page, dashboard, and sign-in modal.

### Tasks

- [x] Create sign-in modal component (`src/components/auth/sign-in-modal.tsx`)
- [x] Create API key form component (`src/components/settings/api-key-form.tsx`)
- [x] Create API key list component (`src/components/settings/api-key-list.tsx`)
- [x] Create settings page (`src/app/settings/page.tsx`) [complex]
  - [x] Page layout with protected route
  - [x] API Keys section with list and form
  - [x] Empty state when no keys configured
- [x] Create usage summary component (`src/components/dashboard/usage-summary.tsx`)
- [x] Create usage chart component (`src/components/dashboard/usage-chart.tsx`)
- [x] Update dashboard page with real usage data (`src/app/dashboard/page.tsx`)
- [x] Update navigation dropdown (`src/components/auth/user-profile.tsx`)

### Technical Details

**Sign-In Modal** (`src/components/auth/sign-in-modal.tsx`):
```tsx
interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Dialog wrapping the sign-in form content
// Reuses existing SignInButton form logic
// Shows both Google and email options
```

**API Key Form** (`src/components/settings/api-key-form.tsx`):
```tsx
interface ApiKeyFormProps {
  onSuccess?: () => void;
}

// Provider select dropdown (Deepgram, ElevenLabs)
// Password-type input for API key (masked)
// Submit button with loading state
// POST to /api/settings/api-keys
```

**API Key List** (`src/components/settings/api-key-list.tsx`):
```tsx
interface ApiKeyListProps {
  keys: Array<{ provider: string; keyHint: string; createdAt: string }>;
  onDelete?: (provider: string) => void;
}

// Card per configured key showing:
// - Provider icon and name
// - Key hint (****xyz1)
// - Delete button
// Empty state with prompt to add key
```

**Settings Page** (`src/app/settings/page.tsx`):
```tsx
// Protected route - redirect if not authenticated
// Layout:
// - Page title
// - Card: API Keys section
//   - ApiKeyList (shows configured keys)
//   - ApiKeyForm (add new key)
// - Card: Default Provider (optional)
```

**Usage Summary** (`src/components/dashboard/usage-summary.tsx`):
```tsx
// Card showing:
// - Total minutes (formatDuration)
// - Total cost (formatCost)
// - Session count
// - Per-provider breakdown with icons
```

**Usage Chart** (`src/components/dashboard/usage-chart.tsx`):
```tsx
// Simple bar chart for monthly usage
// Can use basic SVG or lightweight chart library
// Provider-colored bars (Deepgram: blue, ElevenLabs: purple)
```

**Navigation Dropdown** (`src/components/auth/user-profile.tsx`):
```tsx
// Add before existing Profile link:
<DropdownMenuItem asChild>
  <Link href="/dashboard">
    <LayoutDashboard className="mr-2 h-4 w-4" />
    Dashboard
  </Link>
</DropdownMenuItem>
<DropdownMenuItem asChild>
  <Link href="/settings">
    <Settings className="mr-2 h-4 w-4" />
    Settings
  </Link>
</DropdownMenuItem>
<DropdownMenuSeparator />
```

---

## Phase 5: Integration ✅

Connect all pieces - auth gate, session tracking, provider context.

### Tasks

- [x] Update provider context to track configured keys (`src/contexts/stt-provider-context.tsx`)
- [x] Add session tracking to voice dictation hook (`src/hooks/use-voice-dictation.ts`)
- [x] Integrate auth gate in dictation panel (`src/components/dictation/dictation-panel.tsx`) [complex]
  - [x] Check auth on click record
  - [x] Check auth on Ctrl key press
  - [x] Show sign-in modal if not authenticated
  - [x] Show "configure key" message if no API key

### Technical Details

**Provider Context** (`src/contexts/stt-provider-context.tsx`):
```typescript
// Add to context value:
interface ProviderInfo {
  available: boolean;
  hasKey: boolean;  // NEW: user has configured key
  name: string;
  model: string;
}

// Fetch from /api/stt/providers (requires auth)
// Disable provider selection for unconfigured keys
// Show "Add key" link for unconfigured providers
```

**Voice Dictation Hook** (`src/hooks/use-voice-dictation.ts`):
```typescript
// Add new props/options:
interface UseVoiceDictationOptions {
  onAuthRequired?: () => void;  // Called when auth needed
  onKeyRequired?: (provider: string) => void;  // Called when no API key
}

// Add session tracking:
const recordingStartTimeRef = useRef<number>(0);

// In startRecording():
recordingStartTimeRef.current = Date.now();

// In stopRecording():
const durationMs = Date.now() - recordingStartTimeRef.current;
// Call POST /api/usage/session
fetch("/api/usage/session", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ provider: providerType, durationMs }),
});

// In keyboard handler (Ctrl key):
// Before calling startRecording(), check if auth callback provided
// If onAuthRequired and not authenticated, call it instead
```

**Dictation Panel** (`src/components/dictation/dictation-panel.tsx`):
```tsx
const { data: session } = useSession();
const [showSignIn, setShowSignIn] = useState(false);
const { providers } = useSTTProvider();

const handleAuthRequired = useCallback(() => {
  setShowSignIn(true);
}, []);

const handleKeyRequired = useCallback((provider: string) => {
  toast.error(`No ${provider} API key configured`, {
    action: {
      label: "Add Key",
      onClick: () => router.push("/settings"),
    },
  });
}, [router]);

// Pass to hook:
const dictation = useVoiceDictation(providerType, {
  onAuthRequired: !session ? handleAuthRequired : undefined,
  onKeyRequired: handleKeyRequired,
});

// Render sign-in modal:
<SignInModal
  open={showSignIn}
  onOpenChange={setShowSignIn}
  onSuccess={() => router.push("/settings")}
/>
```

---

## Verification

After implementation, verify these scenarios:

1. **Auth gate (click)**: Click record button without login → sign-in modal appears
2. **Auth gate (keyboard)**: Press Ctrl key without login → sign-in modal appears
3. **Google OAuth**: Sign in with Google → redirected to settings
4. **Email auth**: Sign up/in with email → redirected to settings
5. **API key flow**: Add Deepgram key → can now transcribe
6. **No key error**: Try to transcribe without API key → helpful error message
7. **Usage tracking**: Transcribe → dashboard shows session with duration/cost
8. **Navigation**: Dashboard/Settings links work in profile dropdown
9. **Key management**: Add, view (hint only), delete API keys

```bash
npm run lint && npm run typecheck
npm run dev  # Manual testing
```
