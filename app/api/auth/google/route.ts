import { randomBytes } from 'crypto';
import { createSession, invalidateSession } from '@/util/session';
import { NextResponse } from 'next/server';

const deleteTempSidWithResponse = (response: NextResponse) => {
    response.cookies.delete('temp-sid');
    return response;
}

export const GET = async() => {
    // const scopes = ['openid', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'];
    try {
        const scopes = ['openid', 'email', 'profile'].join('%20');
        const state = randomBytes(32).toString('hex');
        const nonce = randomBytes(20).toString('hex');
        const createdSession = await createSession({ state: state, type: 'google' }, true);
        if(!createdSession.data.state) return deleteTempSidWithResponse(NextResponse.redirect(new URL('/auth/login')));
        const encodedRedirectUri = encodeURIComponent(process.env.GOOGLE_CLIENT_CALLBACK as string);
        const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&nonce=${nonce}&scope=${scopes}&redirect_uri=${encodedRedirectUri}&state=${createdSession.data.state}&response_type=code&access_type=offline`;
        return NextResponse.redirect(new URL(url));
    } catch (err) {
        console.log(err);
        return new Response('There was an error', { status: 403 });
    }

}