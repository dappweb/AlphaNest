'use client';

import { useState, useEffect } from 'react';
import { Download, X, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/use-pwa';

export function InstallPrompt() {
  const { isInstallable, installApp } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) setDismissed(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      localStorage.removeItem('pwa-install-dismissed');
    }
  };

  if (!isInstallable || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3 rounded-lg border bg-background p-4 shadow-lg">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-medium">Install PopCow</p>
          <p className="text-sm text-muted-foreground">
            Add to home screen for quick access
          </p>
        </div>
        <Button size="sm" onClick={handleInstall}>
          Install
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function OfflineIndicator() {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 animate-in fade-in">
      <div className="flex items-center gap-2 rounded-full border bg-destructive/10 px-4 py-2 text-sm text-destructive shadow-lg">
        <WifiOff className="h-4 w-4" />
        <span>You're offline</span>
      </div>
    </div>
  );
}

export function OnlineIndicator() {
  const { isOnline } = usePWA();
  const [showOnline, setShowOnline] = useState(false);

  useEffect(() => {
    if (isOnline) {
      setShowOnline(true);
      const timer = setTimeout(() => setShowOnline(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showOnline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 animate-in fade-in">
      <div className="flex items-center gap-2 rounded-full border bg-success/10 px-4 py-2 text-sm text-success shadow-lg">
        <Wifi className="h-4 w-4" />
        <span>Back online</span>
      </div>
    </div>
  );
}
