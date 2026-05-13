const dotenv = require('dotenv');
dotenv.config();

const localDatabaseUrl = process.env.DATABASE_URL || `postgres://${encodeURIComponent(process.env.DB_USER || 'postgres')}:${encodeURIComponent(process.env.DB_PASSWORD || '')}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'donor_registry'}`;

/** @type { import("drizzle-kit").Config } */
module.exports = {
  schema: './db/schema.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: localDatabaseUrl,
  },
  verbose: true,
  strict: true,
};
