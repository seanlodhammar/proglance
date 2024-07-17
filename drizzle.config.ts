import { defineConfig } from 'drizzle-kit';
import '@/util/config';

export default defineConfig({
    schema: './db/schema/*',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.POSTGRES_URL as string,
    },
    out: './drizzle',
})