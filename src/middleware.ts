import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Force Vercel CDN and browsers to never cache Dream Look pages
// This prevents stale JS bundles from causing TDZ errors
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Force no-cache on HTML pages (the app shell)
  if (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    response.headers.set('X-Vercel-Cache', 'BYPASS');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.svg).*)'],
};
