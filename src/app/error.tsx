'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [retryCount, setRetryCount] = useState(0);
  const errorMessage = error?.message || 'An unexpected error occurred';
  const isTDZError = errorMessage.includes('before initialization') || errorMessage.includes('TDZ');

  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  const handleForceReload = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then(names => names.forEach(name => caches.delete(name)));
      }
      window.location.href = window.location.pathname;
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    // For TDZ errors, do a full reload after first retry fails
    if (isTDZError && retryCount >= 1) {
      handleForceReload();
    } else {
      reset();
    }
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-gradient-to-br from-rose-50/50 via-white to-pink-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-rose-950/10">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center space-y-6">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
                <Scissors className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Error icon */}
            <div className="w-20 h-20 mx-auto rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Something went wrong</h2>
              <p className="text-sm text-muted-foreground break-all">
                {errorMessage}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleRetry}
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-md shadow-rose-500/20"
                size="lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {isTDZError && retryCount < 1 ? 'Try Again' : 'Reload Page'}
              </Button>
              <Button
                onClick={handleForceReload}
                variant="outline"
                size="lg"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Data & Reload
              </Button>
            </div>

            {isTDZError && (
              <div className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-left space-y-2">
                <p className="font-medium text-amber-700 dark:text-amber-400">ℹ️ About this error</p>
                <p>This is a known browser compatibility issue that sometimes occurs after updates. Click &quot;Clear Data &amp; Reload&quot; to fix it permanently.</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              If the problem persists, please contact support.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
