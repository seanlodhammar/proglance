import 'server-only';
import { cookies as cookies } from "next/headers";
import { kv } from '@vercel/kv';

export const createSession = async(data: { [key: string]: any }, temp?: boolean) : Promise<{ sid: string; existing: boolean; data: any }> => {
    const cookieStore = cookies();
    const sidExist = cookieStore.get(!temp ? 'sid' : 'temp-sid');
    if(sidExist && sidExist.value) {
        try {
            const sessionData = await kv.hgetall(`session-${sidExist.value}`)
            if(!sessionData) {
                cookieStore.delete(!temp ? 'sid' : 'temp-sid');
                await createSession(data, temp);
                // redo: make throw error, recursion is risky
            }
            return { sid: sidExist.value, existing: true, data: sessionData };
        } catch (err) {
            console.log(err);
            cookieStore.delete(!temp ? 'sid' : 'temp-sid');
            await createSession(data, temp);
        }
    }
    const sessionId = crypto.randomUUID();
    await kv.hset(`session-${sessionId}`, data);
    const expiry = (!temp ? 12 * 60 : 10) * 60;
    await kv.expire(`session-${sessionId}`, expiry);
    cookieStore.set(!temp ? 'sid' : 'temp-sid', sessionId, { maxAge: expiry, path: '/', sameSite: 'lax' });
    return { sid: sessionId, existing: false, data: data };
}

export const createCustomSession = async(name: string, data: { [props: string]: string | number }, expiryInSeconds: number) => {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(name);
    if(sessionCookie && sessionCookie.value) {
        const sessionData = await kv.hgetall(`session-${sessionCookie.value}`);
        return { sid: sessionCookie.value, existing: true, data: sessionData };
    }
    const sessionId = crypto.randomUUID();
    await kv.hset(`session-${sessionId}`, data);
    await kv.expire(`session-${sessionId}`, expiryInSeconds);
    cookieStore.set(name, sessionId, { sameSite: 'lax', maxAge: expiryInSeconds, path: '/' });
    return { sid: sessionId, existing: false, data: data };
}

export const setKey = async(key: string, value: any) => {
    const cookieStore = cookies();
    const sidCookie = cookieStore.get('sid');
    if(!sidCookie || !sidCookie.value) {
        throw new Error('Something went wrong');
    }
    const sid = sidCookie.value;
    await kv.hset(`session-${sid}`, { [key]: value });
    return true;
}

export const getKey = async(key: string) => {
    const cookieStore = cookies();
    const sidCookie = cookieStore.get('sid');
    if(!sidCookie || !sidCookie.value) {
        throw new Error('Something went wrong');
    }
    const sid = sidCookie.value;
    return await kv.hget(`session-${sid}`, key);
}

export const getAuthSecret = async(): Promise<any> => {
    const cookieStore = cookies();
    const sidCookie = cookieStore.get('sid');
    if(!sidCookie || !sidCookie.value) {
        throw new Error('Something went wrong');
    }
    const sid = sidCookie.value;
    const secret = await kv.hget(`session-${sid}`, 'secret');
    if(!secret) {
        throw new Error('Something went wrong');
    }
    return secret;
}

export const getSession = async(temp?: boolean) => {
    const cookieStore = cookies();
    const sidCookie = cookieStore.get(!temp ? 'sid' : 'temp-sid');
    if(!sidCookie || !sidCookie.value) {
        return null;
    }
    const sid = sidCookie.value;
    const get = await kv.hgetall(`session-${sid}`);
    return get;
}

export const getSessionKey = async(key: string) => {
    const cookieStore = cookies();
    const sidCookie = cookieStore.get('sid');
    if(!sidCookie || !sidCookie.value) {
        throw new Error('Something went wrong');
    }
    const sid = sidCookie.value;
    const keyVal = await kv.hget(`session-${sid}`, key);
    return keyVal;
}

export const invalidateSession = async(temp?: boolean) => {
    const cookieStore = cookies();
    const sidCookie = cookieStore.get(!temp ? 'sid' : 'temp-sid');
    if(!sidCookie || !sidCookie.value) {
        return null;
    }
    const sid = sidCookie.value;
    await kv.del(`session-${sid}`);
    return true;
}

export const getCustomSession = async(name: string) => {
    const cookieStore = cookies();
    const cookie = cookieStore.get(name);
    if(!cookie || !cookie.value) throw new Error('No cookie found', { cause: 'no-cookie' });
    const session = await kv.hgetall(`session-${cookie.value}`);
    if(!session) throw new Error('No session found', { cause: 'no-session' });
    return session as { [props: string]: any };
}

export const setCustomKey = async(name: string, val: { [key: string]: any }) => {
    const cookieStore = cookies() ;
    const cookie = cookieStore.get(name);
    if(!cookie || !cookie.value) throw new Error('No cookie found', { cause: 'no-cookie'});
    await kv.hset(`session-${cookie.value}`, val);
    return true;
}

export const invalidateCustomSession = async(name: string) => {
    const cookieStore = cookies();
    const cookie = cookieStore.get(name);
    if(!cookie || !cookie.value) throw new Error('No cookie found', { cause: 'no-cookie' });
    await kv.del(`session-${cookie.value}`);
    return true; 
}