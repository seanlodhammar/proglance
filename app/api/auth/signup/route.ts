import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

export const POST = async(req: NextRequest) => {
    const cookieStore = cookies();
    const data = await req.json();
    const headers = req['credentials'];
    console.log(headers);
    console.log(data);
    return Response.json({
        status: 200,
    })
}