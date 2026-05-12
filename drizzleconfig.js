import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  schema: './db/schema.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/donor_registry`,
  },
  verbose: true,
  strict: true,
});
