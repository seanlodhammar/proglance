import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession, invalidateSession} from './session';
import { validateCustomAuthentication, validateOauthAuthentication } from './auth';
import { getUserById } from '@/db/db';

export const deleteCookiesWithResponse = async(response: NextResponse) => {
    await invalidateSession();
    response.cookies.delete('sid');
    response.cookies.delete('auth-token');
    return response;
}

const authorize = async(request: NextRequest): Promise<{ type: 'custom' | 'google' | 'github'; access: string; refresh?: string }> => {
    const cookie = request.cookies.get('sid');
    const tempCookie = request.cookies.get('temp-sid');
    if(tempCookie && tempCookie.value && !cookie) throw new Error("OAuth in progress", { cause: 'OAuth' });
    if(!cookie || !cookie.value) throw new Error('No SID cookie');
    const session = await getSession();
    if(!session) throw new Error('No stored session');
    if(!session.type) throw new Error('Not auth session');
    if(session.type === 'custom') {
        const userId = await validateCustomAuthentication(request.cookies.get('auth-token'));
        await getUserById(userId);
        return { type: session.type, access: userId.toString() };
    } else if(session.type !== 'custom') {
        const userCredential = (session['user-credential'] as {[props:string]: string});
        if(!userCredential || (typeof userCredential === 'object' && !('refresh_token' in userCredential))) throw new Error('No credentials');
        if(session.type !== 'google' && session.type !== 'github') throw new Error('Corrupt session');
        const acc = await validateOauthAuthentication(session, session.type);
        return { type: session.type, access: acc, refresh: userCredential['refresh_token'] };
    }
    throw new Error('Invalid type');
}

export const authorizationHandler = async(request: NextRequest, wantAuthenticated: boolean, type: 'api' | 'page') => {
    try {
        const { access, type: sessionType, refresh } = await authorize(request);
        if(sessionType !== 'custom' && !refresh) throw new Error('No credentials')
        if(!wantAuthenticated) {
            if(type === 'api') return NextResponse.json({ msg: 'User is already authenticated' }, { status: 403 });
            else return NextResponse.redirect(new URL('/dashboard', request.url));
        } else {
            const response = NextResponse.next();
            response.headers.append('proglance-auth-access', access);
            response.headers.append('proglance-auth-type', sessionType);
            if(sessionType !== 'custom' && refresh) {
                response.headers.append('proglance-auth-refresh', refresh);
            }
            return response;
        }
    } catch (err) {
        if(err instanceof Error) {
            if(err.cause === 'OAuth') {
                const getTempSession = await getSession(true);
                if(!getTempSession && !(request.nextUrl.pathname.includes('/api/auth/google') || request.nextUrl.pathname.includes('/api/auth/github'))) {
                    if(!wantAuthenticated) {
                        const res = NextResponse.next();
                        res.cookies.delete('temp-sid');
                        return res;
                    } else {
                        const res = NextResponse.redirect(new URL('/auth/login', request.url));
                        res.cookies.delete('temp-sid');
                        return res;
                    }

                } else if(getTempSession && (request.nextUrl.pathname.includes('/api/auth/google') || request.nextUrl.pathname.includes('/api/auth/github'))) {
                    if(!wantAuthenticated) return NextResponse.next();
                    else return NextResponse.redirect(new URL('/auth/login', request.url));
                }

            }
        }
        if(!wantAuthenticated) {
            return await deleteCookiesWithResponse(NextResponse.next());
        } else {
            if(type === 'api') return await deleteCookiesWithResponse(NextResponse.json({ msg: 'User must be authenticated' }, { status: 401 }));
            return await deleteCookiesWithResponse(NextResponse.redirect(new URL ('/auth/login', request.url)));
        } 
    }
}
