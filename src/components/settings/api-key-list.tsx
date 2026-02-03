"use client";

import { useState } from "react";
import { Trash2, Key } from "lucide-react";
import { toast } from "sonner";
import { ProviderIcon } from "@/components/icons/provider-icons";
import { Button } from "@/components/ui/button";
import { PROVIDER_COSTS } from "@/lib/cost";

interface ApiKey {
  provider: string;
  keyHint: string;
  createdAt: string;
}

interface ApiKeyListProps {
  keys: ApiKey[];
  onDelete?: (provider: string) => void;
}

function getProviderName(provider: string): string {
  if (provider in PROVIDER_COSTS) {
    return PROVIDER_COSTS[provider as keyof typeof PROVIDER_COSTS].name;
  }
  return provider;
}

export function ApiKeyList({ keys, onDelete }: ApiKeyListProps) {
  const [deletingProvider, setDeletingProvider] = useState<string | null>(null);

  const handleDelete = async (provider: string) => {
    setDeletingProvider(provider);
    try {
      const response = await fetch(
        `/api/settings/api-keys?provider=${provider}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast.success(`${getProviderName(provider)} API key deleted`);
        onDelete?.(provider);
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || "Failed to delete API key");
      }
    } catch {
      toast.error("Failed to delete API key");
    } finally {
      setDeletingProvider(null);
    }
  };

  if (keys.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Key className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p className="font-medium">No API keys configured</p>
        <p className="text-sm mt-1">
          Add an API key below to start using voice dictation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {keys.map((key) => (
        <div
          key={key.provider}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <ProviderIcon provider={key.provider} className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{getProviderName(key.provider)}</p>
              <p className="text-sm text-muted-foreground font-mono">
                {key.keyHint}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(key.provider)}
            disabled={deletingProvider === key.provider}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete {key.provider} API key</span>
          </Button>
        </div>
      ))}
    </div>
  );
}
