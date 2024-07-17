import { cookies } from "next/headers";
import { createSession, getAuthSecret } from "@/util/session";
import { user as userValidation } from "@/util/validation";
import { ZodError } from "zod";
import { constructErrorObj } from "@/util/validation";
import * as jose from 'jose';
import { getUserByEmail } from "@/db/db";
import { compareSync } from 'bcrypt';
import { randomBytes } from 'crypto';

export const POST = async(req: Request) => {
    const cookieStore = cookies();
    const data = await req.json();

    try {
        const parse = userValidation.parse({ email: data.email, password: data.password });
        const email = parse.email;
        const password = parse.password;

        const user = await getUserByEmail(email);

        if(!user.password) throw new Error('User didn\'t signed up with different auth method');

        const comparison = compareSync(password, user.password);

        if(!comparison) {
            return Response.json({
                msg: 'Incorrect password',
            }, { status: 401 });
        };
        
        const genSecret = randomBytes(16).toString('hex');
        const secret = new TextEncoder().encode(genSecret);
        const jwt = await new jose.SignJWT({ userId: user.id })  
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setIssuer('urn:example:issuer')
            .setAudience('urn:example:audience')
            .setExpirationTime('12h')
            .sign(secret);

        cookieStore.set('auth-token', jwt, { path: '/', maxAge: 12 * 60 * 60, sameSite: 'lax' });
        const sessionCreation = await createSession({ secret: genSecret, type: 'custom' });

        if(!sessionCreation) {
            return Response.json({
                msg: 'Something went wrong',
            }, { status: 400 })
        }

        return Response.json({
            msg: 'Successful'
        }, { status: 200 });

    } catch (err) {
        if(err instanceof ZodError) {
            return Response.json({
                msg: 'Invalid user credentials',
                errors: constructErrorObj(err),
            }, { status: 401 })
        }
        console.log(err);
        return Response.json({
            msg: 'Something went wrong',
        }, { status: 400 });
    }

}