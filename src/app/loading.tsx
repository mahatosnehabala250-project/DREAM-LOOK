export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-rose-50/50 via-background to-pink-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-rose-950/10">
      {/* Animated Logo */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-2xl shadow-rose-500/30 animate-pulse">
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="3" />
            <path d="M8.12 8.12 12 12" />
            <path d="M20 4 8.12 15.88" />
            <circle cx="6" cy="18" r="3" />
            <path d="M14.8 14.8 20 20" />
          </svg>
        </div>
        {/* Spinner ring */}
        <div className="absolute inset-0 w-20 h-20 rounded-2xl border-2 border-rose-200 dark:border-rose-800 border-t-transparent animate-spin" style={{ animationDuration: '1.2s' }} />
      </div>

      {/* Branding */}
      <h1 className="text-2xl font-extrabold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-2">
        Dream Look
      </h1>
      <p className="text-sm text-muted-foreground animate-pulse">
        Loading your experience...
      </p>

      {/* Loading dots */}
      <div className="flex items-center gap-1.5 mt-6">
        <div className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
