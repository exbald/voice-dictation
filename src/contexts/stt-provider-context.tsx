"use client";

import {
  createContext,
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
  name: string;
  model: string;
}

type ProvidersAvailability = Record<STTProviderType, ProviderInfo>;

interface STTProviderContextValue {
  provider: STTProviderType;
  setProvider: (type: STTProviderType) => void;
  availability: ProvidersAvailability | null;
  isLoading: boolean;
}

const STTProviderContext = createContext<STTProviderContextValue | null>(null);

const DEFAULT_AVAILABILITY: ProvidersAvailability = {
  deepgram: { available: true, name: "Deepgram", model: "Nova-3" },
  elevenlabs: { available: false, name: "ElevenLabs", model: "Scribe v2 Realtime" },
};

export function STTProviderProvider({ children }: { children: ReactNode }) {
  const [provider, setProviderState] = useState<STTProviderType>("deepgram");
  const [availability, setAvailability] = useState<ProvidersAvailability | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch provider availability and saved provider
    (async () => {
      try {
        const response = await fetch("/api/stt/providers");
        if (response.ok) {
          const data = await response.json();
          setAvailability(data);

          // Get saved provider and validate it's available
          const saved = getSavedProvider();
          if (data[saved]?.available) {
            setProviderState(saved);
          } else {
            // Fall back to first available provider
            const firstAvailable = Object.entries(data).find(
              ([, info]) => (info as ProviderInfo).available
            );
            if (firstAvailable) {
              setProviderState(firstAvailable[0] as STTProviderType);
            }
          }
        } else {
          setAvailability(DEFAULT_AVAILABILITY);
          setProviderState(getSavedProvider());
        }
      } catch {
        setAvailability(DEFAULT_AVAILABILITY);
        setProviderState(getSavedProvider());
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const setProvider = (type: STTProviderType) => {
    // Only allow switching to available providers
    if (availability?.[type]?.available) {
      setProviderState(type);
      saveProvider(type);
    }
  };

  return (
    <STTProviderContext.Provider value={{ provider, setProvider, availability, isLoading }}>
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
