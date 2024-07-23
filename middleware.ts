import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { authorizationHandler, rateLimiter } from './util/middleware';

export const middleware = async(request: NextRequest) => {
    if(request.nextUrl.pathname.startsWith('/auth')) return await authorizationHandler(request, false, 'page');
    if(request.nextUrl.pathname.startsWith('/dashboard')) return await authorizationHandler(request, true, 'page');
    if(request.nextUrl.pathname.startsWith('/api')) {
        const limited = await rateLimiter(request);
        if(!limited) return NextResponse.json({ msg: 'Too many requests sent, try again later'}, { status: 429 });
        if(request.nextUrl.pathname.startsWith('/api/auth/logout')) return await authorizationHandler(request, true, 'api');
        if(request.nextUrl.pathname.startsWith('/api/auth') && !request.nextUrl.pathname.includes('/logout')) return await authorizationHandler(request, false, 'api');
        if(request.nextUrl.pathname.startsWith('/api/user')) return await authorizationHandler(request, true, 'api');
    }
        
}

export const config = {
    matcher: ['/auth/:path*', '/dashboard/:path*', '/api/:path*']
}
