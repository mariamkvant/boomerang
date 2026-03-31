import { Pool } from 'pg';

// Find DATABASE_URL even if it has a leading space in the env var name
const dbUrl = process.env.DATABASE_URL || process.env[' DATABASE_URL'] || process.env.DATABASE_PRIVATE_URL || Object.entries(process.env).find(([k]) => k.trim() === 'DATABASE_URL')?.[1];
if (!dbUrl) { console.error('WARNING: No DATABASE_URL found. Env keys:', Object.keys(process.env).join(',')); }
const pool = new Pool(dbUrl ? { connectionString: dbUrl } : { host: process.env.PGHOST, port: parseInt(process.env.PGPORT || '5432'), user: process.env.PGUSER, password: process.env.PGPASSWORD, database: process.env.PGDATABASE });

export async function initDatabase() {
  const client = await pool.connect();
  try {
    const ddl = [
      `CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, bio TEXT DEFAULT '', points INTEGER DEFAULT 50, email_verified BOOLEAN DEFAULT false, verify_code TEXT, verify_expires TIMESTAMPTZ, reset_code TEXT, reset_expires TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW(), city TEXT, latitude REAL, longitude REAL)`,
      `CREATE TABLE IF NOT EXISTS categories (id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL, icon TEXT DEFAULT '', multiplier REAL DEFAULT 1.0, base_rate INTEGER DEFAULT 10)`,
      `CREATE TABLE IF NOT EXISTS subcategories (id SERIAL PRIMARY KEY, category_id INTEGER NOT NULL REFERENCES categories(id), name TEXT NOT NULL, description TEXT DEFAULT '', UNIQUE(category_id, name))`,
      `CREATE TABLE IF NOT EXISTS services (id SERIAL PRIMARY KEY, provider_id INTEGER NOT NULL REFERENCES users(id), category_id INTEGER NOT NULL REFERENCES categories(id), subcategory_id INTEGER REFERENCES subcategories(id), title TEXT NOT NULL, description TEXT NOT NULL, points_cost INTEGER NOT NULL DEFAULT 10, duration_minutes INTEGER DEFAULT 60, is_active INTEGER DEFAULT 1, created_at TIMESTAMPTZ DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS service_requests (id SERIAL PRIMARY KEY, service_id INTEGER NOT NULL REFERENCES services(id), requester_id INTEGER NOT NULL REFERENCES users(id), status TEXT DEFAULT 'pending', message TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT NOW(), completed_at TIMESTAMPTZ)`,
      `CREATE TABLE IF NOT EXISTS reviews (id SERIAL PRIMARY KEY, request_id INTEGER UNIQUE NOT NULL REFERENCES service_requests(id), reviewer_id INTEGER NOT NULL REFERENCES users(id), rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5), comment TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS messages (id SERIAL PRIMARY KEY, request_id INTEGER NOT NULL REFERENCES service_requests(id), sender_id INTEGER NOT NULL REFERENCES users(id), body TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS availability (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), day_of_week INTEGER NOT NULL CHECK(day_of_week >= 0 AND day_of_week <= 6), start_time TEXT NOT NULL, end_time TEXT NOT NULL, UNIQUE(user_id, day_of_week, start_time))`,
      `CREATE TABLE IF NOT EXISTS bookings (id SERIAL PRIMARY KEY, request_id INTEGER NOT NULL REFERENCES service_requests(id), booked_date DATE NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW())`,
    ];
    for (const sql of ddl) { await client.query(sql); }
    try { await client.query(`ALTER TABLE service_requests DROP CONSTRAINT IF EXISTS service_requests_status_check`); } catch(e) {}
    try { await client.query(`ALTER TABLE service_requests ADD CONSTRAINT service_requests_status_check CHECK(status IN ('pending','accepted','delivered','completed','cancelled','disputed'))`); } catch(e) {}
    const cats: [string, string, number][] = [
      ['Cleaning', '\uD83E\uDDF9', 1.0], ['Gardening', '\uD83C\uDF31', 1.0],
      ['Pet Care', '\uD83D\uDC15', 1.2], ['Transportation', '\uD83D\uDE97', 1.2],
      ['Sports & Fitness', '\uD83C\uDFF8', 1.3], ['Cooking', '\uD83C\uDF73', 1.3],
      ['Tutoring', '\uD83D\uDCDA', 1.5], ['Languages', '\uD83D\uDDE3\uFE0F', 1.5], ['Music', '\uD83C\uDFB8', 1.5],
      ['Tech Help', '\uD83D\uDCBB', 1.8], ['Home Repair', '\uD83D\uDD27', 2.0], ['Other', '\u2728', 1.0],
      ['Arts & Crafts', '\uD83C\uDFA8', 1.3], ['Health & Wellness', '\uD83E\uDDD8', 1.5],
      ['Business & Career', '\uD83D\uDCBC', 1.8], ['Design & Creative', '\uD83C\uDFAC', 1.5],
      ['Childcare & Education', '\uD83D\uDC76', 1.3], ['Auto & Mechanics', '\uD83D\uDE97', 2.0],
    ];
    for (const [name, icon, mult] of cats) {
      await client.query('INSERT INTO categories (name, icon, multiplier) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING', [name, icon, mult]);
    }

    const subs: [string, string, string][] = [
      ['Cleaning','House Cleaning','General house cleaning'],['Cleaning','Deep Cleaning','Thorough cleaning'],
      ['Cleaning','Laundry & Ironing','Washing and ironing'],['Cleaning','Window Cleaning','Window washing'],
      ['Gardening','Lawn Mowing','Mowing lawns'],['Gardening','Planting & Weeding','Planting and weeding'],
      ['Gardening','Tree & Hedge Trimming','Pruning'],['Gardening','Garden Design','Garden layouts'],
      ['Pet Care','Dog Walking','Walking dogs'],['Pet Care','Pet Sitting','Watching pets'],
      ['Pet Care','Pet Grooming','Bathing and grooming'],['Pet Care','Pet Training','Obedience training'],
      ['Transportation','Rides & Errands','Driving or pickups'],['Transportation','Airport Pickup','Airport transfers'],
      ['Transportation','Moving Help','Moving furniture'],
      ['Sports & Fitness','Personal Training','Fitness coaching'],['Sports & Fitness','Yoga & Meditation','Yoga sessions'],
      ['Sports & Fitness','Padel / Tennis Partner','Racket sports partner'],['Sports & Fitness','Running Buddy','Running companion'],
      ['Sports & Fitness','Swimming Coaching','Swimming lessons'],
      ['Cooking','Meal Prep','Preparing meals'],['Cooking','Cooking Lessons','Teaching cooking'],
      ['Cooking','Baking','Baking goods'],['Cooking','Special Diet Cooking','Allergy-friendly meals'],
      ['Tutoring','Math & Science','STEM tutoring'],['Tutoring','Writing & Literature','Writing help'],
      ['Tutoring','Test Prep','Exam preparation'],['Tutoring','Homework Help','Homework assistance'],
      ['Languages','English','English practice'],['Languages','Spanish','Spanish lessons'],
      ['Languages','French','French lessons'],['Languages','German','German lessons'],
      ['Languages','Other Languages','Other language tutoring'],
      ['Music','Guitar Lessons','Guitar instruction'],['Music','Piano / Keyboard','Piano lessons'],
      ['Music','Singing / Vocals','Vocal coaching'],['Music','Drums & Percussion','Drum instruction'],
      ['Music','Music Theory','Music theory'],
      ['Tech Help','Computer Setup','Computer setup'],['Tech Help','Phone & Tablet Help','Mobile device help'],
      ['Tech Help','Website Help','Website creation'],['Tech Help','Software Training','Software training'],
      ['Tech Help','Smart Home Setup','Smart home devices'],
      ['Home Repair','Plumbing','Basic plumbing'],['Home Repair','Electrical','Basic electrical'],
      ['Home Repair','Painting','Painting'],['Home Repair','Furniture Assembly','Flat-pack assembly'],
      ['Home Repair','General Handyman','Odd jobs'],
      ['Other','Photography','Photo services'],['Other','Event Help','Event organization'],
      ['Other','Administrative','Paperwork help'],['Other','Other','Anything else'],
      ['Arts & Crafts','Drawing & Painting','Sketching, watercolor, oil painting'],
      ['Arts & Crafts','Pottery & Ceramics','Pottery wheel, hand building, glazing'],
      ['Arts & Crafts','Knitting & Sewing','Knitting, crocheting, sewing, embroidery'],
      ['Arts & Crafts','Jewelry Making','Beading, wire wrapping, metalwork'],
      ['Arts & Crafts','Woodworking','Carving, furniture making, wood crafts'],
      ['Health & Wellness','Yoga Instruction','Yoga poses, breathing, meditation'],
      ['Health & Wellness','Nutrition Advice','Meal planning, diet guidance'],
      ['Health & Wellness','Massage','Relaxation and therapeutic massage'],
      ['Health & Wellness','Mental Health Support','Peer support, stress management'],
      ['Health & Wellness','First Aid Training','CPR, basic first aid skills'],
      ['Business & Career','Resume Writing','CV writing, cover letters, LinkedIn'],
      ['Business & Career','Interview Prep','Mock interviews, coaching'],
      ['Business & Career','Accounting & Tax','Basic bookkeeping, tax filing help'],
      ['Business & Career','Marketing Help','Social media, content, branding'],
      ['Business & Career','Legal Basics','Contract review, basic legal guidance'],
      ['Design & Creative','Graphic Design','Logos, flyers, social media graphics'],
      ['Design & Creative','Video Editing','Cutting, effects, YouTube content'],
      ['Design & Creative','UI/UX Design','App and website design'],
      ['Design & Creative','Content Writing','Blog posts, copywriting, editing'],
      ['Design & Creative','Social Media Management','Posting, scheduling, strategy'],
      ['Childcare & Education','Babysitting','Watching children at home'],
      ['Childcare & Education','Homework Help','School subjects, study skills'],
      ['Childcare & Education','Special Needs Support','Adapted learning, patience'],
      ['Childcare & Education','Reading & Storytelling','Reading aloud, literacy help'],
      ['Auto & Mechanics','Car Maintenance','Oil change, tire rotation, basic checks'],
      ['Auto & Mechanics','Bike Repair','Flat tires, chain, brakes, tune-ups'],
      ['Auto & Mechanics','Diagnostics','Check engine light, troubleshooting'],
    ];
    for (const [catName, subName, desc] of subs) {
      const catRes = await client.query('SELECT id FROM categories WHERE name = $1', [catName]);
      if (catRes.rows[0]) {
        await client.query('INSERT INTO subcategories (category_id, name, description) VALUES ($1, $2, $3) ON CONFLICT (category_id, name) DO NOTHING', [catRes.rows[0].id, subName, desc]);
      }
    }
        // Migrations for existing tables
    try { await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT'); } catch(e) {}
    try { await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude REAL'); } catch(e) {}
    try { await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude REAL'); } catch(e) {}
    try { await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT'); } catch(e) {}
    try { await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false'); } catch(e) {}
    try { await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0'); } catch(e) {}
    try { await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER'); } catch(e) {}
    try { await client.query('ALTER TABLE services ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES groups(id)'); } catch(e) {}
        try { await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS languages_spoken TEXT'); } catch(e) {}
try { await client.query('ALTER TABLE services ADD COLUMN IF NOT EXISTS is_bundle BOOLEAN DEFAULT false'); } catch(e) {}
    try { await client.query('ALTER TABLE services ADD COLUMN IF NOT EXISTS sessions_count INTEGER DEFAULT 1'); } catch(e) {}
    try { await client.query('ALTER TABLE services ADD COLUMN IF NOT EXISTS bundle_discount INTEGER DEFAULT 0'); } catch(e) {}
        try { await client.query('ALTER TABLE help_wanted ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES groups(id)'); } catch(e) {}
try { await client.query("ALTER TABLE help_wanted DROP CONSTRAINT IF EXISTS help_wanted_status_check"); } catch(e) {}
    try { await client.query("ALTER TABLE help_wanted ADD CONSTRAINT help_wanted_status_check CHECK(status IN ('open','accepted','delivered','completed','closed'))"); } catch(e) {}
                await client.query('CREATE TABLE IF NOT EXISTS favorites (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), service_id INTEGER NOT NULL REFERENCES services(id), created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id, service_id))');
    await client.query("CREATE TABLE IF NOT EXISTS groups (id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL, description TEXT DEFAULT '', is_public BOOLEAN DEFAULT true, invite_code TEXT UNIQUE, created_by INTEGER NOT NULL REFERENCES users(id), created_at TIMESTAMPTZ DEFAULT NOW())");
    await client.query("CREATE TABLE IF NOT EXISTS group_members (id SERIAL PRIMARY KEY, group_id INTEGER NOT NULL REFERENCES groups(id), user_id INTEGER NOT NULL REFERENCES users(id), role TEXT DEFAULT 'member', joined_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(group_id, user_id))");
    await client.query('CREATE TABLE IF NOT EXISTS notifications (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), type TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, link TEXT, is_read BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW())');
    await client.query("CREATE TABLE IF NOT EXISTS reports (id SERIAL PRIMARY KEY, reporter_id INTEGER NOT NULL REFERENCES users(id), reported_id INTEGER NOT NULL REFERENCES users(id), reason TEXT NOT NULL, details TEXT DEFAULT '', status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT NOW())");
    await client.query('CREATE TABLE IF NOT EXISTS blocks (id SERIAL PRIMARY KEY, blocker_id INTEGER NOT NULL REFERENCES users(id), blocked_id INTEGER NOT NULL REFERENCES users(id), created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(blocker_id, blocked_id))');
        await client.query("CREATE TABLE IF NOT EXISTS shoutouts (id SERIAL PRIMARY KEY, from_user_id INTEGER NOT NULL REFERENCES users(id), to_user_id INTEGER NOT NULL REFERENCES users(id), request_id INTEGER REFERENCES service_requests(id), message TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW())");
    await client.query("CREATE TABLE IF NOT EXISTS direct_messages (id SERIAL PRIMARY KEY, sender_id INTEGER NOT NULL REFERENCES users(id), receiver_id INTEGER NOT NULL REFERENCES users(id), body TEXT NOT NULL, is_read BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW())");
    await client.query("CREATE TABLE IF NOT EXISTS help_wanted (id SERIAL PRIMARY KEY, requester_id INTEGER NOT NULL REFERENCES users(id), category_id INTEGER NOT NULL REFERENCES categories(id), title TEXT NOT NULL, description TEXT NOT NULL, points_budget INTEGER NOT NULL DEFAULT 10, status TEXT DEFAULT 'open', accepted_by INTEGER REFERENCES users(id), created_at TIMESTAMPTZ DEFAULT NOW())");
    await client.query("CREATE TABLE IF NOT EXISTS user_achievements (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), badge TEXT NOT NULL, awarded_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id, badge))");
    console.log('Database initialized with PostgreSQL');
  } finally { client.release(); }
}

function convertPlaceholders(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => '$' + String(++i));
}

export const dbHelper = {
  async get(sql: string, ...params: any[]): Promise<any> {
    const pgSql = convertPlaceholders(sql);
    const res = await pool.query(pgSql, params.flat());
    return res.rows[0] || undefined;
  },
  async all(sql: string, ...params: any[]): Promise<any[]> {
    const pgSql = convertPlaceholders(sql);
    const res = await pool.query(pgSql, params.flat());
    return res.rows;
  },
  async run(sql: string, ...params: any[]): Promise<{ lastInsertRowid: number; changes: number }> {
    const pgSql = convertPlaceholders(sql);
    const isInsert = pgSql.trim().toUpperCase().startsWith('INSERT');
    const finalSql = isInsert && !pgSql.includes('RETURNING') ? pgSql + ' RETURNING id' : pgSql;
    const res = await pool.query(finalSql, params.flat());
    return { lastInsertRowid: res.rows[0]?.id || 0, changes: res.rowCount || 0 };
  },
  transaction<T>(fn: () => Promise<T>): () => Promise<T> {
    return async () => {
      const client = await pool.connect();
      try { await client.query('BEGIN'); const result = await fn(); await client.query('COMMIT'); return result; }
      catch (e) { await client.query('ROLLBACK'); throw e; }
      finally { client.release(); }
    };
  }
};

export default dbHelper;