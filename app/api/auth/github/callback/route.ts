import type { NextRequest } from 'next/server';
import { getSession,invalidateSession } from "@/util/session"
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { storeOAuthUser } from '@/util/auth';

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
        await storeOAuthUser(code, 'github');
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