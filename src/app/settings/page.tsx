"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, Settings as SettingsIcon } from "lucide-react";
import { UserProfile } from "@/components/auth/user-profile";
import { ApiKeyForm } from "@/components/settings/api-key-form";
import { ApiKeyList } from "@/components/settings/api-key-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSTTProvider } from "@/contexts/stt-provider-context";
import { useSession } from "@/lib/auth-client";

interface ApiKey {
  provider: string;
  keyHint: string;
  createdAt: string;
}

export default function SettingsPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const { refreshAvailability } = useSTTProvider();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKeys = useCallback(async () => {
    try {
      const response = await fetch("/api/settings/api-keys");
      if (response.ok) {
        const data = await response.json();
        setKeys(data.keys);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh both local keys list and provider availability (for header dropdown)
  const handleKeysChanged = useCallback(async () => {
    await fetchKeys();
    await refreshAvailability();
  }, [fetchKeys, refreshAvailability]);

  useEffect(() => {
    if (session) {
      fetchKeys();
    } else {
      setLoading(false);
    }
  }, [session, fetchKeys]);

  // Loading state
  if (sessionPending) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  // Unauthenticated state
  if (!session) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-8">
            <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Sign in Required</h1>
            <p className="text-muted-foreground mb-6">
              You need to sign in to manage your API keys and settings.
            </p>
          </div>
          <UserProfile />
        </div>
      </div>
    );
  }

  // Authenticated state
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to home</span>
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </div>

      {/* API Keys Section */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Configure your speech-to-text provider API keys. Your keys are
            encrypted and stored securely.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : (
            <>
              <ApiKeyList keys={keys} onDelete={handleKeysChanged} />
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium mb-4">
                  {keys.length > 0 ? "Add or Update API Key" : "Add API Key"}
                </h3>
                <ApiKeyForm
                  onSuccess={handleKeysChanged}
                  existingProviders={keys.map((k) => k.provider)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
