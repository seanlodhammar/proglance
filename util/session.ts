import 'server-only';
import { cookies as cookies } from "next/headers";
import { kv } from '@vercel/kv';

export const createSession = async(data: { [key: string]: any }, temp?: boolean): Promise<{ sid: string; existing: boolean; data: any }> => {
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