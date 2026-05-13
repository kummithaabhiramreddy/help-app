import { pgTable, serial, varchar, text, bigint, timestamp, index } from 'drizzle-orm/pg-core';

export const donors = pgTable(
  'donors',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 50 }), // Blood, Organ, or Both
    bloodgroup: varchar('blood_group', { length: 10 }),
    organs: text('organ_type'), // Stores JSON array as string
    city: varchar('city', { length: 100 }),
    phone: varchar('contact', { length: 20 }),
    email: varchar('email', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow(),
  }
);

export const emergencyRequests = pgTable(
  'emergency_requests',
  {
    id: serial('id').primaryKey(),
    donorId: varchar('donor_id', { length: 100 }).notNull(),
    requesterName: varchar('requester_name', { length: 255 }).notNull(),
    requestType: varchar('request_type', { length: 50 }), // Blood or Organ
    bloodGroup: varchar('blood_group', { length: 10 }),
    organType: text('organ_type'),
    details: text('details'),
    timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    donorReqIdx: index('idx_req_donor').on(table.donorId),
    requesterIdx: index('idx_req_name').on(table.requesterName),
  })
);

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    phone: varchar('phone', { length: 20 }),
    password: text('password').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    userEmailIdx: index('idx_users_email').on(table.email),
  })
);

export const otps = pgTable(
  'otps',
  {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    code: varchar('code', { length: 6 }).notNull(),
    expiresAt: bigint('expires_at', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    otpEmailIdx: index('idx_otp_email').on(table.email),
  })
);
