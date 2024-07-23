import { pgTable, serial, text, varchar, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { cases } from './cases';

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 100 }).notNull().unique(),
    password: text('password'),
    authType: text('auth_type').$type<'custom' | 'google' | 'github'>().notNull(),
    refresh: text('refresh'),
    lastReset: text('last_reset')
});

export const userRelations = relations(users, ({ many }) => ({
    cases: many(cases),
}));

export type User = typeof users.$inferSelect;
export type UserWithoutPassword = {
    id: typeof users.$inferInsert['id'];
    email: typeof users.$inferInsert['email'];
    authType: typeof users.$inferSelect['authType'];
    refresh: typeof users.$inferSelect['refresh'];
}
export type NewUser = typeof users.$inferInsert;
export type UserColumns = ['id', 'email', 'authType', 'refresh'];