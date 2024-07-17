import { pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    name: text('name'),
    email: varchar('email', { length: 100 }).notNull().unique(),
    password: text('password').notNull(),
    authType: text('auth_type').$type<'custom' | 'google' | 'github'>().notNull(),
});

export type User = typeof users.$inferSelect;
export type UserWithoutPassword = {
    id: typeof users.$inferInsert['id'];
    name: typeof users.$inferInsert['name'];
    email: typeof users.$inferInsert['email'];
}
export type NewUser = typeof users.$inferInsert;