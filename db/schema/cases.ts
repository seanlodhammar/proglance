import { pgTable, serial, text, pgEnum, integer, timestamp, bigint } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const cases = pgTable('cases', {
    id: serial('id').primaryKey(),
    type: text('type').$type<'password-reset'>().notNull(),
    userId: integer('user_id').references(() => users.id).notNull(),
    createdAt: text('created_at').notNull(),
    expiresAt: text('expires_at').notNull(),
});

export const casesRelations = relations(cases, ({ one }) => ({
    user: one(users, {
        fields: [cases.userId],
        references: [users.id],
    })
}));

export type Case = typeof cases.$inferSelect;
export type NewCase = typeof cases.$inferInsert;
