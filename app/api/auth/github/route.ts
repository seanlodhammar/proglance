import { randomBytes } from 'crypto';
import { redirect } from 'next/navigation';
import { createSession } from '@/util/session';

export const GET = async() => {
    const state = randomBytes(32).toString('hex');
    const scopes = ['read:user', 'user:email'].join('%20');
    const sessionCreated = await createSession({ state: state, type: 'github' }, true);
    if(!sessionCreated.data || typeof sessionCreated.data.state !== 'string') return redirect('/auth/login');
    const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=${scopes}&redirect_uri=${process.env.GITHUB_CLIENT_CALLBACK}&state=${sessionCreated.data.state}&allow_signup=true`;
    const identity = await fetch(url, { method: 'GET' });
    if(typeof sessionCreated.sid === 'string') {
        return redirect(identity.url);
    }
    return redirect('/auth/login');
}