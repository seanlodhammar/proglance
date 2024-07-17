import type { NextRequest } from "next/server";
import { getUserById } from "@/db/db";
import { redirect } from "next/navigation";
import { decodeJwt } from "jose";
import { JWTInvalid } from "jose/errors";
import { refresh } from "@/util/auth";
import { deleteCookiesWithResponse } from "@/util/middleware";
import { NextResponse } from "next/server";

export const GET = async(req: NextRequest) => {
    const access = req.headers.get('proglance-auth-access');
    const type = req.headers.get('proglance-auth-type');
    const refreshToken = req.headers.get('proglance-auth-refresh')
    if(typeof access !== 'string' || typeof type !== 'string') throw new Error('No credentials');
    try {
        if(type === 'custom') {
            const user = await getUserById(access);
            return NextResponse.json(user, { status: 200 });
        } else if(type === 'google') {
            const user = decodeJwt(access);
            return NextResponse.json(user, { status: 200 });
        } else if(type === 'github') {
            const user = await fetch('https://api.github.com/user', { headers: { 'Authorization': `Bearer ${access}`, 'Accept': 'application/json' } });
            if(user.status !== 200) {
                if(!refreshToken) throw new Error('Expired refresh token');
                const refreshedAccessToken = await refresh('github', refreshToken);
                const retryUser = await fetch('https://api.github.com/user', { headers: { 'Authorization': `Bearer ${refreshedAccessToken}`, 'Accept': 'application/json' } });
                if(retryUser.status !== 200) throw new Error('No credentials');
                const retryData = await retryUser.json();
                return NextResponse.json(retryData, { status: 200 });
            }
            const data = await user.json();
            return NextResponse.json(data, { status: 200 });
        }
    } catch (err) {
        try {
            if(err instanceof JWTInvalid && refreshToken) {
                const refreshedIdToken = await refresh('google', refreshToken);
                const user = decodeJwt(refreshedIdToken);
                return NextResponse.json(user, { status: 200 });
            }
        } catch (aErr) {
            return await deleteCookiesWithResponse(NextResponse.json({ msg: 'User must be authenticated'  }, { status: 401 }))
        }
        return await deleteCookiesWithResponse(NextResponse.json({ msg: 'User must be authenticated'  }, { status: 401 }))
    }

    return new NextResponse('response', { status: 200 });
}