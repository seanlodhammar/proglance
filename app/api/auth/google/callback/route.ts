import type { NextRequest, NextResponse } from "next/server"
import { getSession, createSession, invalidateSession } from "@/util/session";
import { redirect } from 'next/navigation';
import { cookies } from "next/headers";

export const GET = async(request: NextRequest) => {
    const cookieStore = cookies();
    try {
        const query = request.nextUrl.searchParams;
        const session = await getSession(true);
        if(!session) throw new Error('Empty session');
        if(query.get('error')) throw new Error('There was an error') 
        else if (query.get('state') !== session.state) throw new Error('State mismatch');
        const code = query.get('code');
        if(!code) throw new Error('No code');
        const encodedRedirectUri = encodeURIComponent(process.env.GOOGLE_CLIENT_CALLBACK as string);
        const url = `https://oauth2.googleapis.com/token?code=${code}&client_id=${process.env.GOOGLE_CLIENT_ID}&client_secret=${process.env.GOOGLE_CLIENT_SECRET}&redirect_uri=${encodedRedirectUri}&grant_type=authorization_code`
        const res = await fetch(url, { method: 'POST', headers: { 'Accept': 'application/json' } });
        const tokens = await res.json()
        const createdSession = await createSession({ type: 'google', 'user-credential': { refresh_token: tokens.refresh_token, id_token: tokens.id_token } });
        if(!createdSession) throw new Error('No session created');
    } catch (err) {
        console.log('another error');
        if(err instanceof Error) {
            console.log(err.message);
        } else {
            console.log('next err')
            console.log(err);
        }
        await invalidateSession(true);
        cookieStore.delete('temp-sid');
        return redirect('/auth/login');
    }
    await invalidateSession(true);
    cookieStore.delete('temp-sid');
    return redirect('/dashboard');
}

