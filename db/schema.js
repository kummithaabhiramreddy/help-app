import { pgTable, serial, varchar, text, bigint, timestamp, index } from 'drizzle-orm/pg-core';

export const donors = pgTable(
  'donors',
  {
    id: serial('id').primaryKey(),
    donorId: varchar('donorid', { length: 100 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    dob: varchar('dob', { length: 50 }),
    bloodgroup: varchar('bloodgroup', { length: 10 }),
    type: varchar('type', { length: 50 }),
    organs: text('organs'), // JSON as text
    city: varchar('city', { length: 100 }),
    phone: varchar('phone', { length: 20 }),
    email: varchar('email', { length: 255 }),
    biometric: text('biometric'),
    registeredOn: varchar('registeredon', { length: 100 }),
    timestamp: bigint('timestamp', { mode: 'number' }),

    // Detailed Tracking Fields
    donated_count: bigint('donated_count', { mode: 'number' }).default(0),
    donated_detail: text('donated_detail'), // e.g., "Blood (O+): 1, Heart: 0"
    received_count: bigint('received_count', { mode: 'number' }).default(0),
    received_detail: text('received_detail'), // e.g., "Blood (O+): 3, Kidneys: 1"

    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    emailIdx: index('idx_donors_email').on(table.email),
    phoneIdx: index('idx_donors_phone').on(table.phone),
    bloodGroupIdx: index('idx_donors_bloodgroup').on(table.bloodgroup),
    typeIdx: index('idx_donors_type').on(table.type),
    cityIdx: index('idx_donors_city').on(table.city),
    timestampIdx: index('idx_donors_timestamp').on(table.timestamp),
  })
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
