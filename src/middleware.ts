import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BLOCKED_USER_AGENTS = [
  'HTTrack',
  'Wget',
  'curl',
  'python-requests',
  'urllib',
  'Scrapy',
  'Go-http-client',
  'Apache-HttpClient',
  'Java',
  'node-fetch',
  'axios',
  'PostmanRuntime',
  'Teleport Pro',
  'WebCopier',
  'GrabNet',
  'Offline Explorer'
];

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';

  // 1. Block common scraping and mirroring tools
  if (userAgent && BLOCKED_USER_AGENTS.some(agent => userAgent.toLowerCase().includes(agent.toLowerCase()))) {
    return new NextResponse('Access Denied: Scraper / Bot detected', { status: 403 });
  }

  const response = NextResponse.next();

  // 2. Prevent site from being embedded via iframe (Clickjacking and mirror protection)
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Content-Security-Policy', "frame-ancestors 'none';");

  // 3. Block browsers from sniffing MIME types
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // 4. Disable DNS prefetching to avoid indirect tracking
  response.headers.set('X-DNS-Prefetch-Control', 'off');

  return response;
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
