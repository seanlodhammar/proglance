import { cookies } from 'next/headers';
import { createUser } from '@/db/db';
import { createSession } from '@/util/session';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';
import bcrypt from 'bcrypt';
import { user as userValidation, constructErrorObj } from '@/util/validation';
import { ZodError } from 'zod';
import { randomBytes } from 'crypto';

export const POST = async(req: NextRequest) => {
    const cookieStore = cookies();
    const data = await req.json();

    try {
        const parse = userValidation.parse({ email: data.email, password: data.password });

        const email = parse.email;
        const password = parse.password;
    
        const hash = bcrypt.hashSync(password, 12);
        const user = await createUser(email, hash);
    
        const genSecret = randomBytes(16).toString('hex');
        const secret = new TextEncoder().encode(genSecret);
        const jwt = await new jose.SignJWT({ userId: user.id })  
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setIssuer('urn:example:issuer')
            .setAudience('urn:example:audience')
            .setExpirationTime('12h')
            .sign(secret);
        
        cookieStore.set('auth-token', jwt, { maxAge: 12 * 60 * 60, path: '/', sameSite: 'lax' });
        const sessionCreation = await createSession({ secret: genSecret, type: 'custom' });
    
        if(!sessionCreation) {
            return Response.json({
                msg: 'Something went wrong',
            }, { status: 400 })
        }
    
        return Response.json({
            msg: 'Successful'
        }, { status: 201 });
    } catch (err) {
        if(err instanceof Error) {
            if(err.message.includes('violates unique constraint')) {
                return Response.json({
                    errors: { email: 'Email already exists' },
                }, { status: 400 });
            }
        }
        if(err instanceof ZodError) {
            return Response.json({
                msg: 'Invalid user credentials',
                errors: constructErrorObj(err),
            }, { status: 401 });
        }
        return Response.json({
            msg: 'Something went wrong',
        }, { status: 400 });
    }


}