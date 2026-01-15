"use client";

import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSTTProvider } from "@/contexts/stt-provider-context";
import type { STTProviderType } from "@/lib/stt";
import { cn } from "@/lib/utils";

const PROVIDERS: Array<{
  value: STTProviderType;
  label: string;
  description: string;
}> = [
  { value: "deepgram", label: "Deepgram", description: "Nova-3 model" },
  { value: "elevenlabs", label: "ElevenLabs", description: "Scribe v2 Realtime" },
];

export function ProviderToggle() {
  const { provider, setProvider, availability, isLoading } = useSTTProvider();

  const currentProvider = PROVIDERS.find((p) => p.value === provider);

  // Don't render until we know availability
  if (isLoading || !availability) {
    return (
      <Button variant="outline" size="sm" className="gap-2" disabled>
        <Mic className="h-4 w-4" />
        <span className="hidden sm:inline">Loading...</span>
      </Button>
    );
  }

  // Count available providers
  const availableCount = Object.values(availability).filter((p) => p.available).length;

  // If only one provider available, show simple button without dropdown
  if (availableCount <= 1) {
    return (
      <Button variant="outline" size="sm" className="gap-2 cursor-default" disabled>
        <Mic className="h-4 w-4" />
        <span className="hidden sm:inline">{currentProvider?.label}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Mic className="h-4 w-4" />
          <span className="hidden sm:inline">{currentProvider?.label}</span>
          <span className="sr-only">Select speech provider</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Speech Provider</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={provider}
          onValueChange={(v) => setProvider(v as STTProviderType)}
        >
          {PROVIDERS.map(({ value, label, description }) => {
            const isAvailable = availability[value]?.available;
            return (
              <DropdownMenuRadioItem
                key={value}
                value={value}
                className={cn("py-2", !isAvailable && "opacity-50")}
                disabled={!isAvailable}
              >
                <div className="flex flex-col">
                  <span className="flex items-center gap-2">
                    {label}
                    {!isAvailable && (
                      <span className="text-[10px] text-muted-foreground font-normal">
                        (not configured)
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {description}
                  </span>
                </div>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
