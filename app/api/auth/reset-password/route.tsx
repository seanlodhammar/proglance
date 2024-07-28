import type { NextRequest } from 'next/server';
import resend from "@/emails/resend";
import { email as emailValidation } from '@/util/validation';
import { getUserByEmail } from '@/db/db';
import { ZodError } from 'zod';
import db from '@/db/db';
import { cases } from '@/db/schema/cases';
import ResetPassword from '@/emails/templates/reset-password';
import { createCustomSession, getCustomSession, setCustomKey } from '@/util/session';

const existingSession = async() => {
    try {
        const session = await getCustomSession('confirmation-sid');
        const tries = session['tries'];
        if(typeof tries !== 'number') throw new Error('No tries key', { cause: 'no-key' });
        if(tries === 0) throw new Error('Try again later', { cause: 'no-tries' }); 
        const retryIn = session['retryIn'];
        const email = session['email'];
        if(typeof retryIn !== 'number' || typeof email !== 'string') throw new Error('No key', { cause: 'no-key' });
        const now = Date.now();
        if(retryIn < now) {
            const idStr = session.id.toString();
            await resend.emails.send({
                from: 'contact@seanlodhammar.com',
                to: email, 
                subject: 'Password Reset Confirmation',
                react: <ResetPassword resetId={idStr} />
            })
            const newRetryIn = now + 1 * 60 * 1000;
            const newTries = tries - 1;
            await setCustomKey('confirmation-sid', { retryIn: newRetryIn, tries: newTries });
            return Response.json({ msg: 'Email sent', email: email, retryIn: newRetryIn - now, tries: newTries }, { status: 201 }) 
        }
        else return Response.json({ msg: 'You can retry soon', retryIn: retryIn - now }, { status: 403 });
    } catch (err) {
        if(err instanceof Error) {
            if(err.cause === 'no-cookie' || err.cause === 'no-session') return false;
        }
        throw new Error('Unknown error');
    }
}

export const POST = async(req: NextRequest) => { 
    try { 
        const existing = await existingSession();
        if(existing instanceof Response) return existing; 
        const { email: unparsedEmail } = await req.json();    
        const email = emailValidation.parse(unparsedEmail);
        const user = await getUserByEmail(email);  
        if(user.authType !== 'custom') throw new Error('Email created with OAuth', { cause: 'oauth' });
        const now = Date.now();      
        if(user.lastReset) {
            const lastReset = parseInt(user.lastReset);
            if(!isNaN(lastReset) && now < lastReset + 12 * 60 * 60 * 1000) throw new Error('Wait a couple of hours to reset again', { cause: 'recent reset' });
        }
        const newCase = (await db.insert(cases).values({ type: 'password-reset', userId: user.id, createdAt: now.toString(), expiresAt: (now + (10 * 60 * 1000)).toString()  }).returning())[0];
        if(!newCase) throw new Error('Failed to create new case');
        const idStr = newCase.id.toString();
        await resend.emails.send({
            from: 'contact@seanlodhammar.com',
            to: user.email,
            subject: 'Password Reset Confirmation',
            react: <ResetPassword resetId={idStr} /> 
        });
        const retryIn = now + 1 * 60 * 1000;
        await createCustomSession('confirmation-sid', { id: idStr, retryIn: retryIn, tries: 3, email: user.email  }, 10 * 60);
        return Response.json({ msg: 'Email sent', email: email, retryIn: retryIn - now, tries: 3 }, { status: 201 });
    } catch (err) {
        console.log(err);
        if(err instanceof ZodError) {
            return Response.json({ msg: 'Invalid email' }, { status: 400 });
        }
        if(err instanceof Error) {
            if(err.cause === 'nonexistent' || err.cause === 'oauth') {
                return Response.json({ msg: 'No user with that email exists' }, { status: 404 });
            }
            if(err.cause === 'no-tries') {
                return Response.json({ msg: 'Try again later' }, { status: 401 });
            }
            if(err.cause === 'recent reset') {
                return Response.json({ msg: err.message }, { status: 400 })
            }
        }
        return Response.json({ msg: 'Something went wrong' }, { status: 400 });
    }
}