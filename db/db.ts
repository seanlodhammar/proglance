import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { eq, getTableColumns } from 'drizzle-orm';

import * as usersSchema from './schema/users';
import { users, type User, type UserWithoutPassword } from './schema/users';

const db = drizzle(sql, { schema: { ...usersSchema } });

export const createUser = async(email: string, password: string, authType: 'custom' | 'google' | 'github'): Promise<{ id: number } | false> => {
    try {
        const insert = await db.insert(users).values({ email: email, password: password, authType: authType }).returning({ id: users.id });
        return insert[0];
    } catch (err) {
        console.log(err);
        return false;
    }
}

export const getUserByEmail = async(email: string) => {
    const get = await db.select().from(users).where(eq(users.email, email));
    return get[0];
}

export const getUserById = async(id: string | number, includePassword?: boolean): Promise<User | UserWithoutPassword> => {
    let userId;
    if(typeof id === 'number') {
        userId = id;
    } else {
        userId = parseInt(id);
    }
    if(isNaN(userId)) throw new Error('Invalid user id');
    const { password, ...columns } = getTableColumns(users);
    const get = await db.select(!includePassword ? { ...columns } : { ...columns, password }).from(users).where(eq(users.id, userId));
    const user = get[0];
    if(!user) throw new Error('No user found');
    return user;
}