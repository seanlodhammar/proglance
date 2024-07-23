import { getAuthSecret, setKey, createSession } from "./session";
import { jwtVerify, decodeJwt } from 'jose';
import { JWTInvalid } from "jose/errors";
import { getUserByEmail, createOAuthUser, updateUserRow } from "@/db/db";

export const refresh = async(type: 'github' | 'google', refreshToken: string): Promise<string> => {
    if(!refreshToken) throw new Error('Invalid refresh token');
    if(type === 'github') {
        const refresh = await fetch(`https://github.com/login/oauth/access_token?client_id=${process.env.GITHUB_CLIENT_ID}&client_secret=${process.env.GITHUB_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${refreshToken}`, { method: 'GET', headers: { 'Accept': 'application/json' } });
        if(refresh.status !== 200) {
            throw new Error('Expired refresh token');
        }
        const credentials = await refresh.json();
        await setKey('user-credential', credentials);
        return credentials.access_token;
    } else if(type === 'google') {
        const url = `https://oauth2.googleapis.com/token?client_id=${process.env.GOOGLE_CLIENT_ID}&client_secret=${process.env.GOOGLE_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${refreshToken}`;
        const refresh = await fetch(url, { method: 'POST', headers: { 'Accept': 'application/json' } });
        const refreshJson = await refresh.json();
        if(refresh.status !== 200) {
            throw new Error('Expired refresh token')
        }
        await setKey('user-credential', { id_token: refreshJson.id_token, refresh_token: refreshToken });
        return refreshJson.id_token;
    }
    throw new Error('Invalid type');
}

export const validateCustomAuthentication = async(token?: { name?: string; value?: string } | null): Promise<number> => {
    if(!token || !token.value || typeof token.value !== 'string') {
        throw new Error('No token provided');
    }
    const generatedSecret = await getAuthSecret();
    if(!generatedSecret) {
        throw new Error('Corrupt session data');
    }
    const secret = new TextEncoder().encode(generatedSecret);
    const { payload } = await jwtVerify(token.value, secret, { issuer: 'urn:example:issuer', audience: 'urn:example:audience' });
    const userId = payload.userId;
    if(typeof userId !== 'number') {
        throw new Error('Corrupt user id');
    }
    return userId;
}

export const validateOauthAuthentication = async(session: Record<string, unknown>, type: 'google' | 'github'): Promise<string> => {
    if(!session['user-credential']) throw new Error('No user credentials');
    const refreshToken = (session['user-credential'] as { [props: string]: string })['refresh_token'];
    if(type === 'github') {
        // todo: use refresh token if access token isn't there
        const accessToken = (session['user-credential'] as { [props: string]: string })['access_token'];
        if(!accessToken || !refreshToken) throw new Error('No user credentials');
        const get = await fetch('https://api.github.com/user', { method: 'GET', headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' } });
        if(get.status !== 200) return await refresh('github', refreshToken);
        return accessToken;
    } else if(type === 'google') {
        try {
            // todo: use refresh token if id token isn't there
            const idToken = (session['user-credential'] as { [props: string]: string })['id_token'];
            if(!idToken || !refreshToken) throw new Error('No user credentials');
            decodeJwt(idToken);
            return idToken;
        } catch (err) {
            if(err instanceof JWTInvalid) await refresh('google', refreshToken);
        }
    }
    throw new Error('Invalid type');
}

export const storeOAuthUser = async(code: string, type: 'github' | 'google'): Promise<void> => {
    if(type === 'google') {
        const encodedRedirectUri = encodeURIComponent(process.env.GOOGLE_CLIENT_CALLBACK as string);
        const url = `https://oauth2.googleapis.com/token?code=${code}&client_id=${process.env.GOOGLE_CLIENT_ID}&client_secret=${process.env.GOOGLE_CLIENT_SECRET}&redirect_uri=${encodedRedirectUri}&grant_type=authorization_code`
        const res = await fetch(url, { method: 'POST', headers: { 'Accept': 'application/json' } });
        const tokens = await res.json()
        const refreshToken = tokens.refresh_token;
        const createdSession = await createSession({ type: 'google', 'user-credential': { refresh_token: refreshToken, id_token: tokens.id_token } });
        if(!createdSession) throw new Error('No session created');
        const user = decodeJwt(tokens.id_token);
        console.log(user);
        const email = user.email;
        if(typeof email !== 'string') throw new Error('Invalid email');
        const exist = await getUserByEmail(email, 'google');
        if(!exist) {
            await createOAuthUser(email, tokens.refresh_token, 'google');
        } else {
            if(exist.authType !== 'google') throw new Error('Email already exists', { cause: 'existing email' });
            if(refreshToken !== exist.refresh) {
                await updateUserRow(exist.id, { refresh: refreshToken });
            }
        }
    } else if(type === 'github') {
        if(!code) throw new Error('No code');
        const access = await fetch(`https://github.com/login/oauth/access_token?client_id=${process.env.GITHUB_CLIENT_ID}&client_secret=${process.env.GITHUB_CLIENT_SECRET}&code=${code}`, { headers: { 'Accept': 'application/json' } });
        const credentials = await access.json();
        if(!credentials['access_token'] || !credentials['refresh_token']) throw new Error('No credentials');
        const createdSession = await createSession({ 'user-credential': credentials, type: 'github' });
        if(!createdSession) throw new Error('No session created');
        const get = await fetch('https://api.github.com/user', { headers: { 'Authorization': `Bearer ${credentials.access_token}`, 'Accept': 'application/json' } });
        const user = await get.json();
        const email = user.email;
        const refreshToken = credentials.refresh_token;
        if(typeof email !== 'string') throw new Error('Invalid email');
        const exist = await getUserByEmail(user.email);
        if(!exist) {
            await createOAuthUser(email, credentials.refresh_token, 'github');
        } else {
            if(exist.authType !== 'github') throw new Error('Email already exists', { cause: 'existing email' });
            if(refreshToken !== exist.refresh) {
                await updateUserRow(exist.id, { refresh: refreshToken });
            }
        }
    }
}