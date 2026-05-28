/**
 * Drizzle ORM Database Module
 * Interactive data management with type safety and advanced querying
 */

import { db } from './client.js';
import { donors, users, emergencyRequests, otps, emergencyCare } from './schema.js';
import { eq, or, ilike, gt, and, gte, lt, sql, desc, count, inArray } from 'drizzle-orm';

function calculateBadgeName(donatedCount, receivedCount) {
  const donated = Number(donatedCount) || 0;
  const received = Number(receivedCount) || 0;
  const score = (donated * 10) - (received * 2);
  const ratio = donated / (received + 1);
  const finalScore = Math.floor(score + (ratio * 5));

  if (finalScore <= 20) return 'BRONZE';
  if (finalScore <= 50) return 'SILVER';
  if (finalScore <= 100) return 'GOLD';
  return 'DIAMOND';
}

export default {
  /**
   * Save a new donor to the database
   */
  saveDonor: async (donor) => {
    try {
      const result = await db.insert(donors).values({
        donorId: donor.donorId,
        name: donor.name,
        dob: donor.dob,
        bloodgroup: donor.bloodgroup,
        type: donor.type,
        organs: JSON.stringify(donor.organs || []),
        city: donor.city,
        phone: donor.phone,
        email: donor.email,
        biometric: donor.biometric,
        registeredOn: donor.registeredOn,
        timestamp: donor.timestamp,
        donated_count: donor.donated_count || 1,
        donated_detail: donor.donated_detail || '',
        received_count: donor.received_count || 0,
        received_detail: donor.received_detail || '',
        badge_name: calculateBadgeName(donor.donated_count || 1, donor.received_count || 0),
      }).returning({ id: donors.id });

      return { id: result[0]?.id };
    } catch (err) {
      console.error('❌ Database save error:', err);
      throw err;
    }
  },

  /**
   * Log a successful donation event and update donor stats
   */
  logDonationEvent: async (data) => {
    try {
      const donor = await db.select().from(donors).where(eq(donors.donorId, data.donorId)).limit(1);
      if (donor[0]) {
        let currentDetail = donor[0].donated_detail || '';
        const newItem = data.type === 'Blood'
          ? `Blood (${data.bloodGroup || 'N/A'})`
          : `Organ (${data.organType || 'N/A'})`;

        const updatedDetail = currentDetail ? `${currentDetail}, ${newItem}` : newItem;

        const newDonatedCount = (Number(donor[0].donated_count) || 0) + 1;
        const newBadgeName = calculateBadgeName(newDonatedCount, donor[0].received_count);

        await db.update(donors)
          .set({
            donated_count: newDonatedCount,
            donated_detail: updatedDetail,
            badge_name: newBadgeName
          })
          .where(eq(donors.donorId, data.donorId));
        return true;
      }
      return false;
    } catch (err) {
      console.error('❌ Log donation event error:', err);
      throw err;
    }
  },

  /**
   * Log an emergency request for a donor and update their stats
   */
  logEmergencyRequest: async (data) => {
    try {
      // 1. Insert detailed request log into the primary requests table
      const timestamp = Date.now();
      await db.insert(emergencyRequests).values({
        donorId: data.donorId,
        requesterName: data.requesterName,
        requesterPhone: data.requesterPhone || null,
        requestType: data.requestType, // 'Blood' or 'Organ'
        bloodGroup: data.bloodGroup || null,
        organType: data.organType || null,
        details: data.details || '',
        timestamp,
      });

      // 2. Also store a copy in emergency_care for compatibility with Neon expectations
      await db.insert(emergencyCare).values({
        donorId: data.donorId,
        requesterName: data.requesterName,
        requestType: data.requestType,
        bloodGroup: data.bloodGroup || null,
        organType: data.organType || null,
        details: data.details || '',
        timestamp,
      });

      // 3. Fetch current donor status to update detail strings
      const donor = await db.select().from(donors).where(eq(donors.donorId, data.donorId)).limit(1);
      if (donor[0]) {
        let currentDetail = donor[0].received_detail || '';
        const newItem = data.requestType === 'Blood'
          ? `Blood (${data.bloodGroup})`
          : `Organ (${data.organType})`;

        const updatedDetail = currentDetail && currentDetail !== 'None yet' ? `${currentDetail}, ${newItem}` : newItem;
        const newCount = (Number(donor[0].received_count) || 0) + 1;

        const newBadgeName = calculateBadgeName(donor[0].donated_count, newCount);

        // 3. Increment received count and update detail string
        await db.update(donors)
          .set({
            received_count: newCount,
            received_detail: updatedDetail,
            badge_name: newBadgeName
          })
          .where(eq(donors.donorId, data.donorId));
      }

      return true;
    } catch (err) {
      console.error('❌ Log emergency request error:', err);
      throw err;
    }
  },

  /**
   * Get all donors with parsed organs data
   */
  getAllDonors: async () => {
    try {
      const result = await db.select().from(donors).orderBy(desc(donors.timestamp));

      return result.map((row) => ({
        ...row,
        organs: (() => {
          try {
            return JSON.parse(row.organs || '[]');
          } catch (e) {
            return [];
          }
        })(),
      }));
    } catch (err) {
      console.error('❌ Database query error:', err);
      throw err;
    }
  },

  /**
   * Get a single donor by donorId (or numeric id)
   */
  getDonorById: async (donorId) => {
    try {
      const result = await db.select().from(donors).where(eq(donors.donorId, donorId)).limit(1);
      if (result.length === 0) {
        const num = Number(donorId);
        if (!isNaN(num)) {
          const alt = await db.select().from(donors).where(eq(donors.id, num)).limit(1);
          if (alt.length) return alt[0];
        }
        return null;
      }
      const row = result[0];
      return {
        ...row,
        organs: (() => {
          try {
            return JSON.parse(row.organs || '[]');
          } catch (e) {
            return [];
          }
        })(),
      };
    } catch (err) {
      console.error('❌ getDonorById error:', err);
      throw err;
    }
  },

  /**
   * Get all emergency requests from the database
   */
  getAllRequests: async () => {
    try {
      return await db.select().from(emergencyRequests).orderBy(desc(emergencyRequests.timestamp));
    } catch (err) {
      console.error('❌ Get all requests error:', err);
      throw err;
    }
  },
  /**
   * Get emergency requests filtered by requester phone and optional time range
   * range: 'this_week' (last 7 days), 'last_week' (7-14 days ago), 'all' (no filter)
   */
  getEmergencyRequestsByPhone: async (phone, range = 'all') => {
    try {
      let query = db.select().from(emergencyRequests).where(eq(emergencyRequests.requesterPhone, phone));
      const now = Date.now();
      if (range === 'this_week') {
        const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
        query = query.where(and(gte(emergencyRequests.timestamp, weekAgo), lt(emergencyRequests.timestamp, now)));
      } else if (range === 'last_week') {
        const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
        const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
        query = query.where(and(gte(emergencyRequests.timestamp, twoWeeksAgo), lt(emergencyRequests.timestamp, weekAgo)));
      }
      return await query.orderBy(desc(emergencyRequests.timestamp));
    } catch (err) {
      console.error('❌ Get emergency requests by phone error:', err);
      throw err;
    }
  },

  /**
   * Search donors by multiple criteria with Drizzle
   */
  searchDonors: async (query) => {
    try {
      const conditions = [];

      if (query.name) {
        conditions.push(ilike(donors.name, `%${query.name}%`));
      }

      if (query.phone) {
        conditions.push(ilike(donors.phone, `%${query.phone}%`));
      }

      if (query.bloodGroup) {
        conditions.push(eq(donors.bloodgroup, query.bloodGroup));
      }

      if (query.type) {
        conditions.push(ilike(donors.type, `%${query.type}%`));
      }

      if (query.city) {
        conditions.push(ilike(donors.city, `%${query.city}%`));
      }

      let selectQuery = db.select().from(donors);

      if (conditions.length > 0) {
        selectQuery = selectQuery.where(or(...conditions));
      }

      const result = await selectQuery.orderBy(desc(donors.timestamp));

      return result.map((row) => ({
        ...row,
        organs: (() => {
          try {
            return JSON.parse(row.organs || '[]');
          } catch (e) {
            return [];
          }
        })(),
      }));
    } catch (err) {
      console.error('❌ Search error:', err);
      throw err;
    }
  },

  /**
   * Specialized Blood Donor Search using Drizzle
   * Only returns results if a city is provided.
   */
  searchBloodDonors: async (query) => {
    try {
      const { city, bloodGroups } = query;
      console.log(`[DB] Blood Search: city="${city || ''}", groups="${bloodGroups || ''}"`);

      if (!city) {
        console.log('[DB] Blood search skipped: No city provided.');
        return [];
      }

      // Match donors who are Blood or Both type (case-insensitive)
      const conditions = [
        or(
          eq(donors.type, 'Blood'),
          eq(donors.type, 'Both'),
          ilike(donors.type, 'blood'),
          ilike(donors.type, 'both')
        ),
        ilike(donors.city, `%${city.trim()}%`)
      ];

      if (bloodGroups) {
        const groups = bloodGroups.split(',').map(g => g.trim()).filter(g => g);
        if (groups.length > 0) {
          // Use OR of ILIKE for case-insensitive matching of blood groups
          const groupConditions = groups.map(g => ilike(donors.bloodgroup, g));
          conditions.push(or(...groupConditions));
        }
      }

      const result = await db
        .select()
        .from(donors)
        .where(and(...conditions))
        .orderBy(desc(donors.timestamp));

      console.log(`[DB] Blood Search found ${result.length} result(s).`);
      return result.map((row) => ({
        ...row,
        organs: (() => { try { return JSON.parse(row.organs || '[]'); } catch (e) { return []; } })()
      }));
    } catch (err) {
      console.error('❌ Blood search error:', err);
      throw err;
    }
  },

  /**
   * Specialized Organ Donor Search using Drizzle
   * Only returns results if BOTH city and organ type are provided.
   * Organs are stored as a JSON array string e.g. '["Heart","Kidneys"]'
   * We use ilike on the raw JSON string for each organ, which works because
   * JSON.stringify(['Heart']) => '["Heart"]' and ilike '%Heart%' matches it.
   */
  searchOrganDonors: async (query) => {
    try {
      const { city, organs } = query;
      console.log(`[DB] Organ Search: city="${city || ''}", organs="${organs || ''}"`);

      if (!city || !organs) {
        console.log('[DB] Organ search skipped: Missing city or organ selection.');
        return [];
      }

      const requestedOrgans = organs.split(',').map(o => o.trim()).filter(o => o);
      if (requestedOrgans.length === 0) {
        return [];
      }

      // Each organ chip value must appear somewhere in the JSON string
      // e.g. organs column = '["Heart","Kidneys"]', searching for 'Heart' => ilike '%Heart%'
      const organConditions = requestedOrgans.map(o => ilike(donors.organs, `%${o}%`));

      const whereClause = and(
        // Match Organ-only or Both type donors (exact match, case variations)
        or(
          eq(donors.type, 'Organ'),
          eq(donors.type, 'Both'),
          ilike(donors.type, 'organ'),
          ilike(donors.type, 'both')
        ),
        ilike(donors.city, `%${city.trim()}%`),
        // At least one of the requested organs must be found in the stored JSON
        or(...organConditions)
      );

      const result = await db
        .select()
        .from(donors)
        .where(whereClause)
        .orderBy(desc(donors.timestamp));

      console.log(`[DB] Organ Search found ${result.length} result(s).`);

      // Post-filter: parse organs JSON and do a real array check to be accurate
      const filtered = result.filter((row) => {
        try {
          const donorOrgans = JSON.parse(row.organs || '[]').map(o => o.toLowerCase());
          return requestedOrgans.some(req => donorOrgans.some(o => o.includes(req.toLowerCase()) || req.toLowerCase().includes(o)));
        } catch (e) {
          return false;
        }
      });

      return filtered.map((row) => ({
        ...row,
        organs: (() => { try { return JSON.parse(row.organs || '[]'); } catch (e) { return []; } })()
      }));
    } catch (err) {
      console.error('❌ Organ search error:', err);
      throw err;
    }
  },

  /**
   * Check for duplicate donor registrations within cooldown period
   */
  checkDuplicate: async (email, phone, type, cooldown) => {
    try {
      const minTimestamp = Date.now() - cooldown;

      const result = await db
        .select()
        .from(donors)
        .where(
          and(
            or(eq(donors.email, email), eq(donors.phone, phone)),
            eq(donors.type, type),
            gt(donors.timestamp, minTimestamp)
          )
        )
        .limit(1);

      return result[0] || null;
    } catch (err) {
      console.error('❌ Duplicate check error:', err);
      throw err;
    }
  },

  /**
   * Get database statistics
   */
  getStats: async () => {
    try {
      const donorResult = await db.select({ count: count() }).from(donors);
      const userResult = await db.select({ count: count() }).from(users);

      return {
        total_donors: Number(donorResult[0]?.count ?? 0),
        total_users: Number(userResult[0]?.count ?? 0),
        database: 'PostgreSQL + Drizzle ORM',
      };
    } catch (err) {
      console.error('❌ Stats error:', err);
      throw err;
    }
  },

  /**
   * Get total count of registered users (new-user counter)
   * Each row = one unique email that registered via the 4-question form.
   */
  getUserCount: async () => {
    try {
      const result = await db.select({ total: count() }).from(users);
      return Number(result[0]?.total ?? 0);
    } catch (err) {
      console.error('❌ getUserCount error:', err);
      throw err;
    }
  },

  /**
   * Get donors by blood group
   */
  getDonorsByBloodGroup: async (bloodGroup) => {
    try {
      const result = await db
        .select()
        .from(donors)
        .where(eq(donors.bloodgroup, bloodGroup))
        .orderBy(desc(donors.timestamp));

      return result.map((row) => ({
        ...row,
        organs: (() => {
          try {
            return JSON.parse(row.organs || '[]');
          } catch (e) {
            return [];
          }
        })(),
      }));
    } catch (err) {
      console.error('❌ Blood group query error:', err);
      throw err;
    }
  },

  /**
   * Get organ donors
   */
  getOrganDonors: async (organ) => {
    try {
      // Filter by type (Organ or Both) first to reduce data fetched
      const result = await db
        .select()
        .from(donors)
        .where(
          or(
            eq(donors.type, 'Organ'),
            eq(donors.type, 'Both'),
            ilike(donors.type, 'organ'),
            ilike(donors.type, 'both')
          )
        );

      return result
        .filter((donor) => {
          try {
            const organs = JSON.parse(donor.organs || '[]').map(o => o.toLowerCase());
            return organs.some(o => o.includes(organ.toLowerCase()) || organ.toLowerCase().includes(o));
          } catch (e) {
            return false;
          }
        })
        .map((row) => ({
          ...row,
          organs: (() => {
            try {
              return JSON.parse(row.organs || '[]');
            } catch (e) {
              return [];
            }
          })(),
        }));
    } catch (err) {
      console.error('❌ Organ donor query error:', err);
      throw err;
    }
  },

  /**
   * Get donors by city
   */
  getDonorsByCity: async (city) => {
    try {
      const result = await db
        .select()
        .from(donors)
        .where(ilike(donors.city, `%${city}%`))
        .orderBy(desc(donors.timestamp));

      return result.map((row) => ({
        ...row,
        organs: (() => {
          try {
            return JSON.parse(row.organs || '[]');
          } catch (e) {
            return [];
          }
        })(),
      }));
    } catch (err) {
      console.error('❌ City query error:', err);
      throw err;
    }
  },

  /**
   * Get recent registrations — newest first
   */
  getRecentDonors: async (limit = 10) => {
    try {
      const result = await db
        .select()
        .from(donors)
        .orderBy(desc(donors.timestamp))
        .limit(limit);

      return result.map((row) => ({
        ...row,
        organs: (() => {
          try {
            return JSON.parse(row.organs || '[]');
          } catch (e) {
            return [];
          }
        })(),
      }));
    } catch (err) {
      console.error('❌ Recent donors query error:', err);
      throw err;
    }
  },

  /**
   * Count donors by donation type
   */
  countByType: async () => {
    try {
      const result = await db
        .select({ type: donors.type, count: count() })
        .from(donors)
        .groupBy(donors.type);

      return result;
    } catch (err) {
      console.error('❌ Count by type error:', err);
      throw err;
    }
  },

  /**
   * Count donors by blood group
   */
  countByBloodGroup: async () => {
    try {
      const result = await db
        .select({ bloodgroup: donors.bloodgroup, count: count() })
        .from(donors)
        .groupBy(donors.bloodgroup);

      return result;
    } catch (err) {
      console.error('❌ Count by blood group error:', err);
      throw err;
    }
  },

  /**
   * Get blood group availability — used by /api/dashboard/blood-groups
   */
  getBloodGroupAvailability: async () => {
    try {
      const result = await db
        .select({
          bloodgroup: donors.bloodgroup,
          total: count(),
        })
        .from(donors)
        .where(
          or(
            eq(donors.type, 'Blood'),
            eq(donors.type, 'Both'),
            ilike(donors.type, 'blood'),
            ilike(donors.type, 'both')
          )
        )
        .groupBy(donors.bloodgroup)
        .orderBy(desc(count()));

      return result.map((r) => ({
        blood_group: r.bloodgroup,
        donor_count: Number(r.total),
      }));
    } catch (err) {
      console.error('❌ Blood group availability error:', err);
      throw err;
    }
  },

  /**
   * Get donation type breakdown — used by /api/dashboard/donation-types
   */
  getDonationTypeBreakdown: async () => {
    try {
      const result = await db
        .select({
          type: donors.type,
          total: count(),
        })
        .from(donors)
        .groupBy(donors.type)
        .orderBy(desc(count()));

      return result.map((r) => ({
        donation_type: r.type,
        donor_count: Number(r.total),
      }));
    } catch (err) {
      console.error('❌ Donation type breakdown error:', err);
      throw err;
    }
  },

  /**
   * Get city-wise distribution — used by /api/dashboard/cities
   */
  getCityWiseDistribution: async () => {
    try {
      const result = await db
        .select({
          city: donors.city,
          total: count(),
        })
        .from(donors)
        .groupBy(donors.city)
        .orderBy(desc(count()))
        .limit(20);

      return result.map((r) => ({
        city: r.city,
        donor_count: Number(r.total),
      }));
    } catch (err) {
      console.error('❌ City distribution error:', err);
      throw err;
    }
  },

  /**
   * Delete a donor by ID
   */
  deleteDonor: async (donorId) => {
    try {
      await db.delete(donors).where(eq(donors.donorId, donorId));
      return true;
    } catch (err) {
      console.error('❌ Delete error:', err);
      throw err;
    }
  },

  /**
   * Update a donor
   */
  updateDonor: async (donorId, updates) => {
    try {
      const updateData = {
        ...updates,
        organs: updates.organs ? JSON.stringify(updates.organs) : undefined,
      };

      // Remove undefined keys
      Object.keys(updateData).forEach(
        (key) => updateData[key] === undefined && delete updateData[key]
      );

      await db.update(donors).set(updateData).where(eq(donors.donorId, donorId));
      return true;
    } catch (err) {
      console.error('❌ Update error:', err);
      throw err;
    }
  },

  /**
   * Create a new user account
   */
  createUser: async (user) => {
    try {
      const result = await db.insert(users).values({
        name: user.name,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
        city: user.city,
        donationType: user.donationType,
        password: user.password,
      }).returning({ id: users.id });

      const id = result[0]?.id;
      let userid = null;
      if (id) {
        userid = `HELP-${String(id).padStart(4, '0')}`;
        await db.update(users).set({ userid }).where(eq(users.id, id));
      }

      return { id, userid };
    } catch (err) {
      console.error('❌ User creation error:', err);
      throw err;
    }
  },

  /**
   * Save user profile (first 4 questions from the form)
   * Stores: name, dob, city, donationType, email, phone
   *
   * Duplicate logic:
   *   - If the EMAIL already exists → update that user's record (email is UNIQUE in schema).
   *   - If the EMAIL does NOT exist → always INSERT a brand-new user row (new user count +1).
   *   - Phone alone is NOT used as a duplicate key; two people can share a phone number.
   */
  saveUserProfile: async (userProfile) => {
    try {
      const emailKey = String(userProfile.email || '').toLowerCase().trim();
      const phoneKey = String(userProfile.phone || '').replace(/\D/g, '');

      // --- Only check by EMAIL (it is declared UNIQUE in the schema) ---
      let existingUser = [];
      if (emailKey) {
        existingUser = await db.select().from(users)
          .where(eq(users.email, emailKey))
          .limit(1);
      }

      if (existingUser.length) {
        // Email matched → update the existing record
        const existing = existingUser[0];
        const updates = {
          name: userProfile.name || existing.name,
          dob: userProfile.dob || existing.dob,
          city: userProfile.city || existing.city,
          donationType: userProfile.donationType || existing.donationType,
          phone: phoneKey || existing.phone,
          password: userProfile.password !== undefined ? userProfile.password : existing.password,
        };

        let userid = existing.userid;
        if (!userid) {
          userid = `HELP-${String(existing.id).padStart(4, '0')}`;
          updates.userid = userid;
        }

        await db.update(users).set(updates).where(eq(users.id, existing.id));
        console.log(`♻️  User profile updated (existing user id=${existing.id}, email=${emailKey})`);
        return { id: existing.id, userid, updated: true, created: false };
      }

      // Email not found → INSERT as a brand-new user
      const result = await db.insert(users).values({
        name: userProfile.name || '',
        dob: userProfile.dob || '',
        city: userProfile.city || '',
        donationType: userProfile.donationType || '',
        email: emailKey,
        phone: phoneKey,
        password: userProfile.password || '',
      }).returning({ id: users.id });

      const id = result[0]?.id;
      let userid = null;
      if (id) {
        userid = `HELP-${String(id).padStart(4, '0')}`;
        await db.update(users).set({ userid }).where(eq(users.id, id));
      }

      console.log(`🆕 New user created (id=${id}, email=${emailKey})`);
      return { id, userid, created: true, updated: false };
    } catch (err) {
      console.error('❌ User profile save error:', err);
      throw err;
    }
  },

  /**
   * Update user profile by email
   */
  updateUserProfile: async (email, updates) => {
    try {
      const emailKey = String(email || '').toLowerCase().trim();
      await db.update(users).set(updates).where(eq(users.email, emailKey));
      return true;
    } catch (err) {
      console.error('❌ User profile update error:', err);
      throw err;
    }
  },

  /**
   * Get user by email address
   */
  getUserByEmail: async (email) => {
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0] || null;
    } catch (err) {
      console.error('❌ User lookup error:', err);
      throw err;
    }
  },

  /**
   * Update user password
   */
  updateUserPassword: async (email, newPassword) => {
    try {
      await db.update(users).set({ password: newPassword }).where(eq(users.email, email));
      return true;
    } catch (err) {
      console.error('❌ Password update error:', err);
      throw err;
    }
  },

  /**
   * OTP Management
   */
  saveOTP: async (email, code, expiresAt) => {
    try {
      // First clear any existing OTPs for this email
      await db.delete(otps).where(eq(otps.email, email));
      await db.insert(otps).values({ email, code, expiresAt });
      return true;
    } catch (err) {
      console.error('❌ Save OTP error:', err);
      throw err;
    }
  },

  getOTP: async (email) => {
    try {
      const result = await db.select().from(otps).where(eq(otps.email, email)).limit(1);
      return result[0] || null;
    } catch (err) {
      console.error('❌ Get OTP error:', err);
      throw err;
    }
  },

  deleteOTP: async (email) => {
    try {
      await db.delete(otps).where(eq(otps.email, email));
      return true;
    } catch (err) {
      console.error('❌ Delete OTP error:', err);
      throw err;
    }
  },
};
