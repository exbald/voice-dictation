"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  getSavedProvider,
  saveProvider,
  type STTProviderType,
} from "@/lib/stt";

interface ProviderInfo {
  available: boolean;
  hasKey: boolean;
  name: string;
  model: string;
}

type ProvidersAvailability = Record<STTProviderType, ProviderInfo>;

interface STTProviderContextValue {
  provider: STTProviderType;
  setProvider: (type: STTProviderType) => void;
  availability: ProvidersAvailability | null;
  isLoading: boolean;
  refreshAvailability: () => Promise<void>;
}

const STTProviderContext = createContext<STTProviderContextValue | null>(null);

const DEFAULT_AVAILABILITY: ProvidersAvailability = {
  deepgram: { available: true, hasKey: false, name: "Deepgram", model: "Nova-3" },
  elevenlabs: { available: true, hasKey: false, name: "ElevenLabs", model: "Scribe v2 Realtime" },
};

export function STTProviderProvider({ children }: { children: ReactNode }) {
  const [provider, setProviderState] = useState<STTProviderType>("deepgram");
  const [availability, setAvailability] = useState<ProvidersAvailability | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAvailability = useCallback(async (updateProvider = true) => {
    try {
      const response = await fetch("/api/stt/providers");
      if (response.ok) {
        const data = await response.json();
        setAvailability(data);

        if (updateProvider) {
          // Get saved provider and validate it's available with a key
          const saved = getSavedProvider();
          if (data[saved]?.available && data[saved]?.hasKey) {
            setProviderState(saved);
          } else {
            // Fall back to first available provider with a key
            const firstWithKey = Object.entries(data).find(
              ([, info]) => (info as ProviderInfo).available && (info as ProviderInfo).hasKey
            );
            if (firstWithKey) {
              setProviderState(firstWithKey[0] as STTProviderType);
            }
          }
        }
      } else if (response.status === 401) {
        // Not authenticated - use defaults without keys
        setAvailability(DEFAULT_AVAILABILITY);
      } else {
        setAvailability(DEFAULT_AVAILABILITY);
        if (updateProvider) {
          setProviderState(getSavedProvider());
        }
      }
    } catch {
      setAvailability(DEFAULT_AVAILABILITY);
      if (updateProvider) {
        setProviderState(getSavedProvider());
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAvailability(true);
  }, [fetchAvailability]);

  const refreshAvailability = useCallback(async () => {
    await fetchAvailability(false);
  }, [fetchAvailability]);

  const setProvider = useCallback((type: STTProviderType) => {
    // Only allow switching to providers with configured keys
    if (availability?.[type]?.available && availability?.[type]?.hasKey) {
      setProviderState(type);
      saveProvider(type);
    }
  }, [availability]);

  return (
    <STTProviderContext.Provider
      value={{ provider, setProvider, availability, isLoading, refreshAvailability }}
    >
      {children}
    </STTProviderContext.Provider>
  );
}

export function useSTTProvider() {
  const context = useContext(STTProviderContext);
  if (!context) {
    throw new Error(
      "useSTTProvider must be used within STTProviderProvider"
    );
  }
  return context;
}
