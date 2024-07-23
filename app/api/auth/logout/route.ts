import type { NextRequest } from "next/server"
import { getSession, invalidateSession } from "@/util/session";
import { cookies } from 'next/headers';

export const POST = async(_req: NextRequest) => {
    const cookieStore = cookies();
    try {
        const session = await getSession();
        if(!session || !session.type) throw new Error('No session');
        if(session.type === 'custom') {
            await invalidateSession();
            cookieStore.delete('sid');
            cookieStore.delete('auth-token');
            return Response.json({ msg: 'Logged user out' }, { status: 205 });
        } else if(session.type === 'google' || session.type === 'github') {
            await invalidateSession();
            cookieStore.delete('sid');
        } else throw new Error('Invalid type');
    } catch (err) {
        return Response.json({ msg: 'Something went wrong' }, { status: 400 });
    }
}