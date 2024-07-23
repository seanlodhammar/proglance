import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers';
import db, { parseId } from '@/db/db';
import { eq } from 'drizzle-orm';
import { cases } from '@/db/schema/cases';
import { getCustomSession, invalidateCustomSession } from '@/util/session';
import { hashSync } from 'bcrypt';
import { users } from '@/db/schema/users';

const validateCookie = (name: string) => {
    const cookieStore = cookies();
    const cookie = cookieStore.get(name);
    if(!cookie || !cookie.value) throw new Error('Invalid cookie');
    return cookie.value;
}

const validateId = (id: any, retrievedId: any) => {
    const validatedId = id.toString();
    const validatedRetrievedId = retrievedId.toString();
    if(typeof validatedId !== 'string' || typeof validatedRetrievedId !== 'string') throw new Error('Invalid types');
    if(validatedId !== validatedRetrievedId) throw new Error('IDs don\'t match', { cause: 'non matching' });
    return retrievedId;
}

export const GET = async(_req: NextRequest, { params }: { params: { id: string } }) => {
   try {
        const { id } = params; 
        validateCookie('confirmation-sid'); 
        const retrievedId = (await getCustomSession('confirmation-sid')).id;
        validateId(id, retrievedId);
        return NextResponse.json({ msg: 'Success' }, { status: 200 });
    } catch (err) {
        console.log('called from reset password GET')
        if(err instanceof Error) {
            console.log(err.message)
        }
        return NextResponse.json({ msg: 'Unauthorized' }, { status: 401 });
    }
}

export const POST = async(req: NextRequest, { params }: { params: { id: string }}) => {
    try {
        const { id } = params;
        const json = await req.json();
        const newPassword = json.password;
        const confirmation = json.confirmation;
        if(!newPassword || !confirmation || typeof newPassword !== 'string' || typeof confirmation !== 'string') throw new Error('Password or confirmation weren\'t passed', { cause: 'non matching' });
        if(newPassword !== confirmation) throw new Error('Non matching passwords', { cause: 'non matching' })
        validateCookie('confirmation-sid');
        const retrievedSession = await getCustomSession('confirmation-sid');
        const retrievedId = retrievedSession.id;
        const validatedId = validateId(id, retrievedId);
        const parsedId = parseId(validatedId);
        const getCase = (await db.select().from(cases).where(eq(cases.id, parsedId)))[0];
        if(!getCase) throw new Error('No case found');
        if(getCase.type !== 'password-reset') throw new Error('Invalid case type');
        const now = Date.now();
        if(now > parseInt(getCase.expiresAt)) throw new Error('Expired case');
        const userId = parseId(getCase.userId);
        const hash = hashSync(newPassword, 12);
        const update = (await db.update(users).set({ password: hash, lastReset: now.toString() }).where(eq(users.id, userId)).returning())[0];
        if(!update) throw new Error('DB not updated');
        const response = NextResponse.json({ msg: 'Password reset' }, { status: 200 });
        await invalidateCustomSession('confirmation-sid');
        response.cookies.delete('confirmation-sid');
        return response;
    } catch (err) {
        console.log(err);
        if(err instanceof Error) {
            if(err.cause === 'non matching') {
                return NextResponse.json({ msg: 'Passwords aren\'t matching'}, { status: 403 });
            }
        }
        const response = NextResponse.json({ msg: 'Something went wrong' }, { status: 403 }); 
        response.cookies.delete('confirmation-sid'); 
        return Response.json({ msg: 'Something went wrong' }, { status: 403 })
    }
}