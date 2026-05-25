'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  const isTDZError = error?.message?.includes('before initialization');

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50/50 via-white to-pink-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-rose-950/10 p-4">
          <div className="w-full max-w-md text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Something went wrong</h2>
              <p className="text-sm text-muted-foreground">
                {error.message || 'An unexpected error occurred'}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={reset}
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-md shadow-rose-500/20"
                size="lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
              {isTDZError && (
                <Button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      if ('caches' in window) {
                        caches.keys().then(names => names.forEach(name => caches.delete(name)));
                      }
                      localStorage.clear();
                      sessionStorage.clear();
                      window.location.href = window.location.href.split('?')[0];
                    }
                  }}
                  variant="outline"
                  size="lg"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Cache & Reload
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isTDZError
                ? 'This is caused by an outdated cached version. Click "Clear Cache & Reload" to fix it.'
                : 'If the problem persists, please clear your browser cache (Ctrl+Shift+R) and try again.'}
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
