import type { NextRequest } from 'next/server';
import { getSession,invalidateSession, createSession } from "@/util/session"
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

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
        const access = await fetch(`https://github.com/login/oauth/access_token?client_id=${process.env.GITHUB_CLIENT_ID}&client_secret=${process.env.GITHUB_CLIENT_SECRET}&code=${code}`, { headers: { 'Accept': 'application/json' } });
        const credentials = await access.json();
        const createdSession = await createSession({ 'user-credential': credentials, type: 'github' });
        if(!createdSession) throw new Error('No session created');
    } catch (err) {
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