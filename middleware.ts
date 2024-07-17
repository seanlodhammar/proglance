import type { NextRequest } from 'next/server';
import { authorizationHandler } from './util/middleware';

export const middleware = (request: NextRequest) => {
    if(request.nextUrl.pathname.startsWith('/auth')) return authorizationHandler(request, false, 'page');
    if(request.nextUrl.pathname.startsWith('/dashboard')) return authorizationHandler(request, true, 'page');
    if(request.nextUrl.pathname.startsWith('/api/auth/logout')) return authorizationHandler(request, true, 'api');
    if(request.nextUrl.pathname.startsWith('/api/auth') && !request.nextUrl.pathname.includes('/logout')) return authorizationHandler(request, false, 'api');
    if(request.nextUrl.pathname.startsWith('/api/user')) return authorizationHandler(request, true, 'api');
}

export const config = {
    matcher: ['/auth/:path*', '/dashboard/:path*', '/api/:path*']
}