import { pgTable, serial, varchar, text, bigint, timestamp, index, integer } from 'drizzle-orm/pg-core';

export const donors = pgTable(
  'donors',
  {
    id: serial('id').primaryKey(),
    donorId: varchar('donorid', { length: 100 }),
    name: varchar('name', { length: 255 }).notNull(),
    dob: varchar('dob', { length: 50 }),
    bloodgroup: varchar('bloodgroup', { length: 10 }),
    type: varchar('type', { length: 50 }), // Blood, Organ, or Both
    organs: text('organs'),
    city: varchar('city', { length: 100 }),
    phone: varchar('phone', { length: 20 }),
    email: varchar('email', { length: 255 }),
    biometric: text('biometric'),
    registeredOn: varchar('registeredon', { length: 100 }),
    timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    donated_count: integer('donated_count').default(0).notNull(),
    donated_detail: text('donated_detail').default(''),
    received_count: integer('received_count').default(0).notNull(),
    received_detail: text('received_detail').default(''),
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
    dob: varchar('dob', { length: 50 }),
    city: varchar('city', { length: 100 }),
    donationType: varchar('donation_type', { length: 50 }),
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

export const emergencyCare = pgTable(
  'emergency_care',
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
    donorReqIdx: index('idx_ec_donor').on(table.donorId),
    requesterIdx: index('idx_ec_name').on(table.requesterName),
  })
);
