import { createClient, Client } from "@libsql/client";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

dotenv.config();

const DATA_DIR = path.join(process.cwd(), "data");
const defaultUrl = `file:${path.join(DATA_DIR, "plancraft.db")}`;
const url = process.env.TURSO_DATABASE_URL || defaultUrl;
const authToken = process.env.TURSO_AUTH_TOKEN;

let dbInstance: Client | null = null;

export async function getDb(): Promise<Client> {
  if (dbInstance) {
    return dbInstance;
  }

  if (url.startsWith("file:")) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  console.log(`[Turso DB] Connecting with libSQL: ${url.startsWith("file:") ? url : "Remote Turso URL configured"}`);

  dbInstance = createClient({
    url,
    authToken,
  });

  // Enable foreign keys
  await dbInstance.execute("PRAGMA foreign_keys = ON;");

  // Initialize schema
  await initSchema(dbInstance);

  // Check if seed data is needed
  await seedInitialData(dbInstance);

  return dbInstance;
}

export function saveDb() {
  // libSQL automatically persists mutations to disk or remote Turso cloud
}

export async function queryAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  const res = await db.execute({ sql, args: params });
  return res.rows as unknown as T[];
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function execute(sql: string, params: any[] = []): Promise<void> {
  const db = await getDb();
  await db.execute({ sql, args: params });
}

async function initSchema(db: Client) {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      bio TEXT,
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      target_date TEXT,
      budget_enabled INTEGER NOT NULL DEFAULT 0,
      budget_target REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS plan_members (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      joined_at TEXT NOT NULL,
      UNIQUE(plan_id, user_id),
      FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS plan_invitations (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL,
      inviter_id TEXT NOT NULL,
      invitee_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'EDITOR',
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at TEXT NOT NULL,
      expires_at TEXT,
      FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
      FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (invitee_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      target_date TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL,
      milestone_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'TODO',
      priority TEXT NOT NULL DEFAULT 'MEDIUM',
      due_date TEXT,
      assignee_id TEXT,
      created_by TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
      FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE SET NULL,
      FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS budget_items (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL,
      name TEXT NOT NULL,
      estimated_amount REAL NOT NULL DEFAULT 0,
      actual_amount REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      entity_type TEXT,
      entity_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
      FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_plans_owner ON plans(owner_id);
    CREATE INDEX IF NOT EXISTS idx_plan_members_plan ON plan_members(plan_id);
    CREATE INDEX IF NOT EXISTS idx_plan_members_user ON plan_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_plan ON tasks(plan_id);
    CREATE INDEX IF NOT EXISTS idx_milestones_plan ON milestones(plan_id);
    CREATE INDEX IF NOT EXISTS idx_budget_plan ON budget_items(plan_id);
    CREATE INDEX IF NOT EXISTS idx_activities_plan ON activities(plan_id);
    CREATE INDEX IF NOT EXISTS idx_invitations_invitee ON plan_invitations(invitee_id, status);
  `);

  // Safe migration: Add is_demo column if not exists (for existing SQLite/Turso databases)
  try {
    await db.execute("ALTER TABLE users ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 0;");
  } catch {
    // Column already exists or table freshly created
  }

  // Ensure initial demo accounts are marked as is_demo = 1
  try {
    await db.execute(
      "UPDATE users SET is_demo = 1 WHERE id IN ('user_one_01', 'user_two_02') OR email IN ('user1@plancraft.app', 'user2@plancraft.app');"
    );
  } catch {
    // Ignore error if users table is not yet seeded
  }
}

async function seedInitialData(db: Client) {
  const usersCount = await queryOne<{ count: number }>("SELECT COUNT(*) as count FROM users;");
  if (usersCount && Number(usersCount.count) > 0) {
    return;
  }

  console.log("Seeding initial demo data for PlanCraft into Turso (2 Users: User One & User Two)...");

  const hash = bcrypt.hashSync("password123", 10);
  const now = new Date().toISOString();

  // 1. Create Exactly 2 Demo Users (is_demo = 1)
  const user1Id = "user_one_01";
  const user2Id = "user_two_02";

  await execute(`
    INSERT INTO users (id, name, email, password_hash, avatar_url, bio, is_demo, created_at)
    VALUES 
      (?, 'User One', 'user1@plancraft.app', ?, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'Primary Planner (Demo 1)', 1, ?),
      (?, 'User Two', 'user2@plancraft.app', ?, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'Collaborator (Demo 2)', 1, ?);
  `, [user1Id, hash, now, user2Id, hash, now]);

  // 2. Plan 1: Wedding (💍) - Owned by User One, Collaborator: User Two (Editor)
  const weddingId = "plan_wedding_01";
  await execute(`
    INSERT INTO plans (id, owner_id, name, description, category, icon, color, target_date, budget_enabled, budget_target, notes, created_at, updated_at)
    VALUES (?, ?, 'Wedding Celebration', 'Our dream garden wedding celebration with close friends and family in Bandung.', 'Wedding', 'HeartHandshake', '#C45A38', '2027-12-18', 1, 75000000, 
    'Notes for the wedding:
- Preferred venue ambiance: Rustic botanical garden with evening fairy lights.
- Colors: Terracotta, sage green, and warm cream.
- Guest list cap: 150 intimate guests.
- Special dietary requests: 12 vegetarian options.', 
    ?, ?);
  `, [weddingId, user1Id, now, now]);

  // Memberships
  await execute(`
    INSERT INTO plan_members (id, plan_id, user_id, role, joined_at)
    VALUES 
      ('pm_wed_1', ?, ?, 'OWNER', ?),
      ('pm_wed_2', ?, ?, 'EDITOR', ?);
  `, [weddingId, user1Id, now, weddingId, user2Id, now]);

  // Milestones for Wedding
  const m1 = "ms_wed_1";
  const m2 = "ms_wed_2";
  const m3 = "ms_wed_3";
  const m4 = "ms_wed_4";
  const m5 = "ms_wed_5";
  const m6 = "ms_wed_6";

  await execute(`
    INSERT INTO milestones (id, plan_id, title, description, target_date, status, sort_order, created_at, updated_at)
    VALUES 
      (?, ?, 'Decide Wedding Date & Guest Count', 'Lock in the official date and finalize headcount.', '2026-08-15', 'COMPLETED', 1, ?, ?),
      (?, ?, 'Book Venue & Date Hold', 'Survey top 3 garden venues and place down payment.', '2026-10-10', 'COMPLETED', 2, ?, ?),
      (?, ?, 'Select Key Vendors (Catering & Photo)', 'Taste test caterers and review photography portfolios.', '2026-12-05', 'PENDING', 3, ?, ?),
      (?, ?, 'Attire & Decoration Design', 'Tailor bespoke attire and approve floral arrangement moodboard.', '2027-04-20', 'PENDING', 4, ?, ?),
      (?, ?, 'Send Digital & Physical Invitations', 'Distribute invitations and manage RSVP confirmations.', '2027-09-01', 'PENDING', 5, ?, ?),
      (?, ?, 'Wedding Day Execution', 'Rehearsal, coordination, and unforgettable celebration!', '2027-12-18', 'PENDING', 6, ?, ?);
  `, [m1, weddingId, now, now, m2, weddingId, now, now, m3, weddingId, now, now, m4, weddingId, now, now, m5, weddingId, now, now, m6, weddingId, now, now]);

  // Tasks for Wedding
  await execute(`
    INSERT INTO tasks (id, plan_id, milestone_id, title, description, status, priority, due_date, assignee_id, created_by, sort_order, created_at, updated_at)
    VALUES 
      ('t_wed_1', ?, ?, 'Finalize family headcount and guest roster', 'Coordinate with parents for the core guest list', 'COMPLETED', 'HIGH', '2026-08-10', ?, ?, 1, ?, ?),
      ('t_wed_2', ?, ?, 'Visit Pine Hill Garden & Bumi Samami', 'Schedule weekend site visits', 'COMPLETED', 'HIGH', '2026-09-20', ?, ?, 2, ?, ?),
      ('t_wed_3', ?, ?, 'Sign venue contract and pay 30% deposit', 'Secure the December 18 slot', 'COMPLETED', 'HIGH', '2026-10-05', ?, ?, 3, ?, ?),
      ('t_wed_4', ?, ?, 'Find catering with authentic Nusantara cuisine', 'Arrange food tasting session for 4 people', 'IN_PROGRESS', 'HIGH', '2026-11-15', ?, ?, 4, ?, ?),
      ('t_wed_5', ?, ?, 'Book documentary-style photographer', 'Review portfolios with natural lighting tone', 'IN_PROGRESS', 'MEDIUM', '2026-11-30', ?, ?, 5, ?, ?),
      ('t_wed_6', ?, ?, 'Select florist and lighting vendor', 'Coordinate fairy lights & warm lanterns', 'TODO', 'MEDIUM', '2026-12-10', ?, ?, 6, ?, ?),
      ('t_wed_7', ?, ?, 'Schedule wedding dress & suit fittings', 'First measurements appointment with designer', 'TODO', 'MEDIUM', '2027-03-15', ?, ?, 7, ?, ?),
      ('t_wed_8', ?, ?, 'Design minimalist invitation stationery', 'Print eco-friendly paper invites + website link', 'TODO', 'LOW', '2027-07-20', ?, ?, 8, ?, ?),
      ('t_wed_9', ?, ?, 'Collect RSVP responses & seating chart', 'Group tables by friendship circles & family', 'TODO', 'HIGH', '2027-10-15', ?, ?, 9, ?, ?),
      ('t_wed_10', ?, ?, 'Final vendor technical briefing & rundown', 'Host walkthrough meeting at venue with all vendors', 'TODO', 'HIGH', '2027-12-10', ?, ?, 10, ?, ?);
  `, [
    weddingId, m1, user1Id, user1Id, now, now,
    weddingId, m2, user2Id, user1Id, now, now,
    weddingId, m2, user1Id, user1Id, now, now,
    weddingId, m3, user2Id, user1Id, now, now,
    weddingId, m3, user1Id, user1Id, now, now,
    weddingId, m3, user2Id, user1Id, now, now,
    weddingId, m4, user2Id, user1Id, now, now,
    weddingId, m5, user1Id, user1Id, now, now,
    weddingId, m5, user2Id, user1Id, now, now,
    weddingId, m6, user1Id, user1Id, now, now,
  ]);

  // Budget items for Wedding
  await execute(`
    INSERT INTO budget_items (id, plan_id, name, estimated_amount, actual_amount, notes, created_at, updated_at)
    VALUES 
      ('b_wed_1', ?, 'Garden Venue Rental', 20000000, 20000000, 'Down payment paid in full', ?, ?),
      ('b_wed_2', ?, 'Catering (150 Pax buffet + stalls)', 25000000, 24500000, 'Includes welcome drink & dessert table', ?, ?),
      ('b_wed_3', ?, 'Photography & Cinematography', 7000000, 7000000, 'Full day coverage + highlight film', ?, ?),
      ('b_wed_4', ?, 'Decoration & Floral Ambiance', 8000000, 6000000, 'Rustic botanical theme with wood elements', ?, ?),
      ('b_wed_5', ?, 'Attire, Hair & Makeup', 6000000, 0, 'In progress fittings', ?, ?),
      ('b_wed_6', ?, 'Sound System & Acoustic Band', 4000000, 0, 'Live acoustic trio for reception', ?, ?),
      ('b_wed_7', ?, 'Invitations & Souvenirs', 5000000, 1000000, 'Digital invitations + coffee beans gift', ?, ?);
  `, [
    weddingId, now, now,
    weddingId, now, now,
    weddingId, now, now,
    weddingId, now, now,
    weddingId, now, now,
    weddingId, now, now,
    weddingId, now, now,
  ]);

  // Activity for Wedding
  await execute(`
    INSERT INTO activities (id, plan_id, actor_id, action, details, entity_type, entity_id, created_at)
    VALUES 
      ('act_1', ?, ?, 'created_plan', 'created the Plan "Wedding Celebration"', 'plan', ?, ?),
      ('act_2', ?, ?, 'invited_member', 'invited User Two as an Editor', 'member', ?, ?),
      ('act_3', ?, ?, 'completed_task', 'completed "Sign venue contract and pay 30% deposit"', 'task', 't_wed_3', ?),
      ('act_4', ?, ?, 'updated_budget', 'updated budget item "Garden Venue Rental"', 'budget', 'b_wed_1', ?),
      ('act_5', ?, ?, 'created_task', 'added new task "Find catering with authentic Nusantara cuisine"', 'task', 't_wed_4', ?);
  `, [
    weddingId, user1Id, weddingId, now,
    weddingId, user1Id, user2Id, now,
    weddingId, user1Id, now,
    weddingId, user1Id, now,
    weddingId, user2Id, now,
  ]);

  // 3. Plan 2: Build a House (🏠) - Owned by User One
  const houseId = "plan_house_02";
  await execute(`
    INSERT INTO plans (id, owner_id, name, description, category, icon, color, target_date, budget_enabled, budget_target, notes, created_at, updated_at)
    VALUES (?, ?, 'Build Our Dream Home', 'Building an eco-friendly modern tropical home with natural light and courtyard.', 'House', 'Home', '#3B6E58', '2028-06-30', 1, 500000000,
    'Architectural concept:
- Land area: 200 sqm, Building: 140 sqm 2-story.
- Solar panel ready roof structure.
- Rainwater harvesting system integration.
- Open inner courtyard with ventilation chimney.',
    ?, ?);
  `, [houseId, user1Id, now, now]);

  await execute(`
    INSERT INTO plan_members (id, plan_id, user_id, role, joined_at)
    VALUES ('pm_house_1', ?, ?, 'OWNER', ?);
  `, [houseId, user1Id, now]);

  const msH1 = "ms_house_1";
  const msH2 = "ms_house_2";
  const msH3 = "ms_house_3";

  await execute(`
    INSERT INTO milestones (id, plan_id, title, description, target_date, status, sort_order, created_at, updated_at)
    VALUES 
      (?, ?, 'Land Acquisition & Survey', 'Legal verification of certificate and soil topographic test.', '2026-11-01', 'COMPLETED', 1, ?, ?),
      (?, ?, 'Architectural Blueprints & Permits (PBG)', '3D render approval, MEP engineering, and city building permit.', '2027-03-30', 'PENDING', 2, ?, ?),
      (?, ?, 'Foundation & Structural Framing', 'Concrete column pouring, steel reinforcement, and roof rafters.', '2027-10-15', 'PENDING', 3, ?, ?);
  `, [msH1, houseId, now, now, msH2, houseId, now, now, msH3, houseId, now, now]);

  await execute(`
    INSERT INTO tasks (id, plan_id, milestone_id, title, description, status, priority, due_date, assignee_id, created_by, sort_order, created_at, updated_at)
    VALUES 
      ('t_house_1', ?, ?, 'Complete notary verification and land certificate transfer', 'Ensure SHM free of legal dispute', 'COMPLETED', 'HIGH', '2026-10-15', ?, ?, 1, ?, ?),
      ('t_house_2', ?, ?, 'Soil load-bearing investigation and topographic map', 'Boring test for foundation depth calculation', 'COMPLETED', 'MEDIUM', '2026-10-30', ?, ?, 2, ?, ?),
      ('t_house_3', ?, ?, 'Finalize spatial layout and electrical schematics', 'Review room circulation with architect', 'IN_PROGRESS', 'HIGH', '2027-01-20', ?, ?, 3, ?, ?),
      ('t_house_4', ?, ?, 'Submit PBG building permit documentation to city office', 'Prepare civil drawings and environmental impact checklist', 'TODO', 'HIGH', '2027-03-01', ?, ?, 4, ?, ?),
      ('t_house_5', ?, ?, 'Tender contractor bidding and select general contractor', 'Compare 3 contractor bills of quantity (RAB)', 'TODO', 'HIGH', '2027-04-10', ?, ?, 5, ?, ?);
  `, [
    houseId, msH1, user1Id, user1Id, now, now,
    houseId, msH1, user1Id, user1Id, now, now,
    houseId, msH2, user1Id, user1Id, now, now,
    houseId, msH2, user1Id, user1Id, now, now,
    houseId, msH2, user1Id, user1Id, now, now,
  ]);

  await execute(`
    INSERT INTO budget_items (id, plan_id, name, estimated_amount, actual_amount, notes, created_at, updated_at)
    VALUES 
      ('b_house_1', ?, 'Land Plot (200 sqm) + Notary Taxes', 220000000, 215000000, 'Fully paid and certified', ?, ?),
      ('b_house_2', ?, 'Architectural Design & Structural Engineering', 25000000, 25000000, 'Includes 3D renders & RAB', ?, ?),
      ('b_house_3', ?, 'Building Permit & Administration (PBG)', 15000000, 0, 'Permit fee estimate', ?, ?),
      ('b_house_4', ?, 'Civil Construction & Structural Frame', 180000000, 0, 'Contractor stage 1', ?, ?),
      ('b_house_5', ?, 'Finishing, Sanitary, & Electrical Fixtures', 60000000, 0, 'Tiles, windows, wiring', ?, ?);
  `, [
    houseId, now, now,
    houseId, now, now,
    houseId, now, now,
    houseId, now, now,
    houseId, now, now,
  ]);

  // 4. Plan 3: Japan Autumn Trip (✈️) - Owned by User Two, User One is Member (Editor)
  const tripId = "plan_trip_03";
  await execute(`
    INSERT INTO plans (id, owner_id, name, description, category, icon, color, target_date, budget_enabled, budget_target, notes, created_at, updated_at)
    VALUES (?, ?, 'Japan Autumn Odyssey', 'Tokyo, Kyoto, and Takayama autumn foliage exploration with culinary walks.', 'Vacation', 'Plane', '#B8731F', '2027-10-25', 1, 30000000,
    'Trip Highlights:
- Tokyo: Shinjuku Gyoen foliage, Akihabara, Tsukiji Outer Market.
- Kyoto: Arashiyama bamboo grove at sunrise, Fushimi Inari night hike.
- Takayama: Hida beef tasting & traditional Machiya stay.
- Travel essentials: Pasmo card, pocket Wi-Fi, 7-day JR Pass.',
    ?, ?);
  `, [tripId, user2Id, now, now]);

  await execute(`
    INSERT INTO plan_members (id, plan_id, user_id, role, joined_at)
    VALUES 
      ('pm_trip_1', ?, ?, 'OWNER', ?),
      ('pm_trip_2', ?, ?, 'EDITOR', ?);
  `, [tripId, user2Id, now, tripId, user1Id, now]);

  const msT1 = "ms_trip_1";
  const msT2 = "ms_trip_2";

  await execute(`
    INSERT INTO milestones (id, plan_id, title, description, target_date, status, sort_order, created_at, updated_at)
    VALUES 
      (?, ?, 'Flight & Visa Readiness', 'Lock down roundtrip flights and Japanese e-visa.', '2027-05-15', 'COMPLETED', 1, ?, ?),
      (?, ?, 'Accommodation & Rail Pass', 'Book Ryokan in Takayama and city hotels.', '2027-08-01', 'PENDING', 2, ?, ?);
  `, [msT1, tripId, now, now, msT2, tripId, now, now]);

  await execute(`
    INSERT INTO tasks (id, plan_id, milestone_id, title, description, status, priority, due_date, assignee_id, created_by, sort_order, created_at, updated_at)
    VALUES 
      ('t_trip_1', ?, ?, 'Monitor and purchase promo roundtrip tickets', 'Target direct flights CGK - HND', 'COMPLETED', 'HIGH', '2027-05-01', ?, ?, 1, ?, ?),
      ('t_trip_2', ?, ?, 'Submit tourist e-visa via embassy portal', 'Prepare 3-month bank statement and itinerary', 'COMPLETED', 'HIGH', '2027-05-10', ?, ?, 2, ?, ?),
      ('t_trip_3', ?, ?, 'Reserve authentic Onsen Ryokan in Takayama', 'Ensure Kaiseki dinner included', 'IN_PROGRESS', 'MEDIUM', '2027-07-15', ?, ?, 3, ?, ?),
      ('t_trip_4', ?, ?, 'Order 7-day JR Hokuriku Arch Pass voucher', 'Compare regional vs nationwide pass coverage', 'TODO', 'MEDIUM', '2027-09-01', ?, ?, 4, ?, ?);
  `, [
    tripId, msT1, user2Id, user2Id, now, now,
    tripId, msT1, user1Id, user2Id, now, now,
    tripId, msT2, user2Id, user2Id, now, now,
    tripId, msT2, user1Id, user2Id, now, now,
  ]);

  await execute(`
    INSERT INTO budget_items (id, plan_id, name, estimated_amount, actual_amount, notes, created_at, updated_at)
    VALUES 
      ('b_trip_1', ?, 'Roundtrip Flights (2 Pax)', 14000000, 13800000, 'Direct flight booked', ?, ?),
      ('b_trip_2', ?, 'Hotels & Traditional Ryokan (10 nights)', 9000000, 0, 'Hotels in Shinjuku & Kyoto', ?, ?),
      ('b_trip_3', ?, 'JR Rail Passes & Local Transport', 4000000, 0, 'JR Pass + Suica reload', ?, ?),
      ('b_trip_4', ?, 'Food & Daily Culinary Budget', 3000000, 0, 'Ramen, street food, snacks', ?, ?);
  `, [
    tripId, now, now,
    tripId, now, now,
    tripId, now, now,
    tripId, now, now,
  ]);

  // 5. Plan 4: Learn Japanese (🎓) - Non-monetary plan! (Owned by User One)
  const studyId = "plan_study_04";
  await execute(`
    INSERT INTO plans (id, owner_id, name, description, category, icon, color, target_date, budget_enabled, budget_target, notes, created_at, updated_at)
    VALUES (?, ?, 'Master Japanese for JLPT N3', 'Systematic self-study plan to achieve conversational fluency and pass the JLPT N3 exam.', 'Education', 'GraduationCap', '#5A67D8', '2027-07-04', 0, 0,
    'Study Strategy:
- Daily: 30 minutes Anki spaced repetition for Kanji and vocabulary.
- Weekly: 2 grammar chapters in Tobira / Genki II.
- Immersion: Listen to Nihongo Con Teppei podcasts during commute.
- Output: Weekly journal writing on LangCorrect.',
    ?, ?);
  `, [studyId, user1Id, now, now]);

  await execute(`
    INSERT INTO plan_members (id, plan_id, user_id, role, joined_at)
    VALUES ('pm_study_1', ?, ?, 'OWNER', ?);
  `, [studyId, user1Id, now]);

  const msS1 = "ms_study_1";
  const msS2 = "ms_study_2";
  const msS3 = "ms_study_3";

  await execute(`
    INSERT INTO milestones (id, plan_id, title, description, target_date, status, sort_order, created_at, updated_at)
    VALUES 
      (?, ?, 'JLPT N5 Foundations (800 Vocab & 100 Kanji)', 'Master Kana, basic particles, and simple sentence structures.', '2026-10-31', 'COMPLETED', 1, ?, ?),
      (?, ?, 'JLPT N4 Intermediate (1,500 Vocab & 300 Kanji)', 'Complex conjugations, passive/causative, and keigo basics.', '2027-02-28', 'PENDING', 2, ?, ?),
      (?, ?, 'JLPT N3 Fluency & Mock Exam Pass', 'Nuanced reading comprehension, 650 Kanji, and official exam sitting.', '2027-07-04', 'PENDING', 3, ?, ?);
  `, [msS1, studyId, now, now, msS2, studyId, now, now, msS3, studyId, now, now]);

  await execute(`
    INSERT INTO tasks (id, plan_id, milestone_id, title, description, status, priority, due_date, assignee_id, created_by, sort_order, created_at, updated_at)
    VALUES 
      ('t_study_1', ?, ?, 'Complete Genki I textbook and workbook exercises', 'Chapters 1 through 12', 'COMPLETED', 'HIGH', '2026-09-15', ?, ?, 1, ?, ?),
      ('t_study_2', ?, ?, 'Memorize first 100 essential Kanji using RTK mnemonic stories', 'Anki daily deck review', 'COMPLETED', 'MEDIUM', '2026-10-15', ?, ?, 2, ?, ?),
      ('t_study_3', ?, ?, 'Finish Quartet Book 1 grammar chapters 1-6', 'Read all dialogues aloud', 'IN_PROGRESS', 'HIGH', '2027-01-15', ?, ?, 3, ?, ?),
      ('t_study_4', ?, ?, 'Listen to 50 episodes of Comprehensible Japanese', 'Intermediate level podcast series', 'TODO', 'MEDIUM', '2027-02-20', ?, ?, 4, ?, ?),
      ('t_study_5', ?, ?, 'Complete 3 full-length JLPT N3 official practice exams under timed conditions', 'Target score > 120/180', 'TODO', 'HIGH', '2027-06-15', ?, ?, 5, ?, ?);
  `, [
    studyId, msS1, user1Id, user1Id, now, now,
    studyId, msS1, user1Id, user1Id, now, now,
    studyId, msS2, user1Id, user1Id, now, now,
    studyId, msS2, user1Id, user1Id, now, now,
    studyId, msS3, user1Id, user1Id, now, now,
  ]);

  // 6. Pending Invitation: User Two invites User One to "Launch PlanCraft SaaS"
  const saasId = "plan_saas_05";
  await execute(`
    INSERT INTO plans (id, owner_id, name, description, category, icon, color, target_date, budget_enabled, budget_target, notes, created_at, updated_at)
    VALUES (?, ?, 'Launch PlanCraft SaaS', 'Build, polish, and launch our multi-user collaborative life planning web application.', 'Business', 'Rocket', '#0F766E', '2026-11-30', 1, 25000000,
    'Core MVP Scope:
- Multi-user authentication & secure isolation
- Real-time plan progress computation
- Milestones, tasks, and timeline tracks
- Optional budget tracking with currency formatting
- Collaboration with Owner, Editor, Viewer roles.',
    ?, ?);
  `, [saasId, user2Id, now, now]);

  await execute(`
    INSERT INTO plan_members (id, plan_id, user_id, role, joined_at)
    VALUES ('pm_saas_1', ?, ?, 'OWNER', ?);
  `, [saasId, user2Id, now]);

  await execute(`
    INSERT INTO plan_invitations (id, plan_id, inviter_id, invitee_id, role, status, created_at)
    VALUES ('inv_saas_user1', ?, ?, ?, 'EDITOR', 'PENDING', ?);
  `, [saasId, user2Id, user1Id, now]);

  console.log("Demo seed data created successfully with 2 users: User One & User Two!");
}
