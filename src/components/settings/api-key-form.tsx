"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PROVIDER_COSTS } from "@/lib/cost";

interface ApiKeyFormProps {
  onSuccess?: () => void;
  existingProviders?: string[];
}

type Provider = "deepgram" | "elevenlabs" | "mistral";

const PROVIDERS: { value: Provider; label: string }[] = [
  { value: "deepgram", label: PROVIDER_COSTS.deepgram.name },
  { value: "elevenlabs", label: PROVIDER_COSTS.elevenlabs.name },
  { value: "mistral", label: PROVIDER_COSTS.mistral.name },
];

export function ApiKeyForm({ onSuccess, existingProviders = [] }: ApiKeyFormProps) {
  const [provider, setProvider] = useState<Provider>("deepgram");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsPending(true);

    try {
      const response = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to save API key");
        return;
      }

      // Clear form on success
      setApiKey("");
      onSuccess?.();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  const isUpdating = existingProviders.includes(provider);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="provider">Provider</Label>
        <select
          id="provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value as Provider)}
          disabled={isPending}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
              {existingProviders.includes(p.value) ? " (configured)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="apiKey">API Key</Label>
        <Input
          id="apiKey"
          type="password"
          placeholder="Enter your API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          required
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Your API key is encrypted and stored securely.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending || !apiKey.trim()}>
        {isPending
          ? "Saving..."
          : isUpdating
            ? "Update API Key"
            : "Add API Key"}
      </Button>
    </form>
  );
}
