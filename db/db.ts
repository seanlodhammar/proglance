import 'server-only';
import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { eq, getTableColumns, and, type SQL } from 'drizzle-orm';

import * as usersSchema from './schema/users';
import * as casesSchema from './schema/cases';
import { users, type User, type UserWithoutPassword, type UserColumns } from './schema/users'

const db = drizzle(sql, { schema: { ...usersSchema, ...casesSchema } });

export const parseId = (id: string | number) => {
    let parsedId;
    if(typeof id === 'number') {
        parsedId = id;
    } else {
        parsedId = parseInt(id);
    }
    if(isNaN(parsedId)) throw new Error('Invalid id');
    return parsedId;
}

export const createUser = async(email: string, password: string): Promise<{ id: number }> => {
    const insert = await db.insert(users).values({ email: email, password: password, authType: 'custom' }).returning({ id: users.id });
    return insert[0];
}

export const createOAuthUser = async(email: string, refresh: string, authType: 'google' | 'github') => {
    const insert = await db.insert(users).values({ email: email, refresh: refresh, authType: authType }).returning({ id: users.id });
    return insert[0];
}

export const getUserByEmail = async(email: string, authType?: 'google' | 'github' | 'custom', includePassword?: boolean) => {
    const { password, ...columns } = getTableColumns(users);
    const get = await db.select(!includePassword ? { ...columns } : { ...columns, password }).from(users).where(and(eq(users.email, email), eq(users.authType, authType ? authType : 'custom')));
    if(!get[0]) throw new Error('No user found', { cause: 'nonexistent' });
    return get[0];
}

export const getUserById = async(id: string | number, includePassword?: boolean): Promise<User | UserWithoutPassword> => {
    const userId = parseId(id);
    const { password, ...columns } = getTableColumns(users);
    const get = await db.select(!includePassword ? { ...columns } : { ...columns, password }).from(users).where(eq(users.id, userId));
    const user = get[0];
    if(!user) throw new Error('No user found', { cause: 'nonexistent' });
    return user;
}

export const updateUserRow = async(id: number | string, columns: Partial<UserWithoutPassword>) => {
    const userId = parseId(id);
    const update = await db.update(users).set(columns).where(eq(users, userId)).returning();
    return update[0];
}

// export const updateUserPassword = async(id: number | string, password: string) => {
//     const userId = parseId(id);
//     const hash = hashSync(password, 12);
//     const update = await db.update(users).set({ password: hash }).where(eq(users, userId)).returning();
//     return update[0];
// }

export default db;