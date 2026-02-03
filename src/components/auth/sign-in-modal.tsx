"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SignInButton } from "./sign-in-button";

interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SignInModal({ open, onOpenChange, onSuccess }: SignInModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in to continue</DialogTitle>
          <DialogDescription>
            Sign in with your account to use voice dictation. You&apos;ll need to
            configure your own API keys in settings.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-2">
          <SignInButton callbackURL="/settings" onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
