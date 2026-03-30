import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

// DB lives at project root — resolve whether running via ts-node or compiled
const projectRoot = fs.existsSync(path.join(__dirname, '..', 'package.json'))
  ? path.join(__dirname, '..')
  : path.join(__dirname, '..', '..');
const DB_PATH = path.join(process.env.DB_PATH || projectRoot, 'skillswap.db');
let db: any;

function saveDb() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

export async function initDatabase() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }
  db.run('PRAGMA foreign_keys = ON');

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, bio TEXT DEFAULT '',
    points INTEGER DEFAULT 50, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL,
    icon TEXT DEFAULT '🔧', multiplier REAL DEFAULT 1.0, base_rate INTEGER DEFAULT 10
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT, category_id INTEGER NOT NULL,
    name TEXT NOT NULL, description TEXT DEFAULT '',
    FOREIGN KEY (category_id) REFERENCES categories(id),
    UNIQUE(category_id, name)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT, provider_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL, subcategory_id INTEGER,
    title TEXT NOT NULL, description TEXT NOT NULL,
    points_cost INTEGER NOT NULL DEFAULT 10, duration_minutes INTEGER DEFAULT 60,
    is_active INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS service_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT, service_id INTEGER NOT NULL,
    requester_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','accepted','completed','cancelled')),
    message TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, completed_at DATETIME,
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (requester_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT, request_id INTEGER UNIQUE NOT NULL,
    reviewer_id INTEGER NOT NULL, rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES service_requests(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id)
  )`);

  // Seed categories with multipliers: [name, icon, multiplier]
  const cats: [string, string, number][] = [
    ['Cleaning', '🧹', 1.0], ['Gardening', '🌱', 1.0],
    ['Pet Care', '🐕', 1.2], ['Transportation', '🚗', 1.2],
    ['Sports & Fitness', '🏸', 1.3], ['Cooking', '🍳', 1.3],
    ['Tutoring', '📚', 1.5], ['Languages', '🗣️', 1.5], ['Music', '🎸', 1.5],
    ['Tech Help', '💻', 1.8], ['Home Repair', '🔧', 2.0], ['Other', '✨', 1.0],
  ];
  for (const [name, icon, mult] of cats) {
    db.run('INSERT OR IGNORE INTO categories (name, icon, multiplier) VALUES (?, ?, ?)', [name, icon, mult]);
  }

  // Seed subcategories: [categoryName, subcategoryName, description]
  const subs: [string, string, string][] = [
    // Cleaning
    ['Cleaning', 'House Cleaning', 'General house cleaning and tidying'],
    ['Cleaning', 'Deep Cleaning', 'Thorough cleaning including hard-to-reach areas'],
    ['Cleaning', 'Laundry & Ironing', 'Washing, drying, folding, and ironing clothes'],
    ['Cleaning', 'Window Cleaning', 'Interior and exterior window washing'],
    // Gardening
    ['Gardening', 'Lawn Mowing', 'Mowing and edging lawns'],
    ['Gardening', 'Planting & Weeding', 'Planting flowers, vegetables, and removing weeds'],
    ['Gardening', 'Tree & Hedge Trimming', 'Pruning trees, hedges, and shrubs'],
    ['Gardening', 'Garden Design', 'Planning and designing garden layouts'],
    // Pet Care
    ['Pet Care', 'Dog Walking', 'Walking dogs in the neighborhood'],
    ['Pet Care', 'Pet Sitting', 'Watching pets at home while owners are away'],
    ['Pet Care', 'Pet Grooming', 'Bathing, brushing, and basic grooming'],
    ['Pet Care', 'Pet Training', 'Basic obedience and behavior training'],
    // Transportation
    ['Transportation', 'Rides & Errands', 'Driving someone or picking up items'],
    ['Transportation', 'Airport Pickup', 'Airport drop-off and pickup'],
    ['Transportation', 'Moving Help', 'Helping move furniture and boxes'],
    // Sports & Fitness
    ['Sports & Fitness', 'Personal Training', 'One-on-one fitness coaching'],
    ['Sports & Fitness', 'Yoga & Meditation', 'Yoga sessions and guided meditation'],
    ['Sports & Fitness', 'Padel / Tennis Partner', 'Playing partner for racket sports'],
    ['Sports & Fitness', 'Running Buddy', 'Running or jogging companion'],
    ['Sports & Fitness', 'Swimming Coaching', 'Swimming lessons and technique coaching'],
    // Cooking
    ['Cooking', 'Meal Prep', 'Preparing meals in advance'],
    ['Cooking', 'Cooking Lessons', 'Teaching cooking techniques and recipes'],
    ['Cooking', 'Baking', 'Baking bread, cakes, and pastries'],
    ['Cooking', 'Special Diet Cooking', 'Vegan, gluten-free, or allergy-friendly meals'],
    // Tutoring
    ['Tutoring', 'Math & Science', 'Tutoring in math, physics, chemistry, biology'],
    ['Tutoring', 'Writing & Literature', 'Help with essays, reading, and literature'],
    ['Tutoring', 'Test Prep', 'Preparation for standardized tests and exams'],
    ['Tutoring', 'Homework Help', 'General homework assistance for students'],
    // Languages
    ['Languages', 'English', 'English conversation and grammar practice'],
    ['Languages', 'Spanish', 'Spanish language lessons and practice'],
    ['Languages', 'French', 'French language lessons and practice'],
    ['Languages', 'German', 'German language lessons and practice'],
    ['Languages', 'Other Languages', 'Any other language tutoring'],
    // Music
    ['Music', 'Guitar Lessons', 'Acoustic or electric guitar instruction'],
    ['Music', 'Piano / Keyboard', 'Piano and keyboard lessons'],
    ['Music', 'Singing / Vocals', 'Vocal coaching and singing lessons'],
    ['Music', 'Drums & Percussion', 'Drum and percussion instruction'],
    ['Music', 'Music Theory', 'Understanding music theory and composition'],
    // Tech Help
    ['Tech Help', 'Computer Setup', 'Setting up computers, printers, and networks'],
    ['Tech Help', 'Phone & Tablet Help', 'Help with smartphones and tablets'],
    ['Tech Help', 'Website Help', 'Basic website creation and troubleshooting'],
    ['Tech Help', 'Software Training', 'Learning specific software applications'],
    ['Tech Help', 'Smart Home Setup', 'Setting up smart home devices'],
    // Home Repair
    ['Home Repair', 'Plumbing', 'Fixing leaks, unclogging drains, basic plumbing'],
    ['Home Repair', 'Electrical', 'Light fixtures, outlets, basic electrical work'],
    ['Home Repair', 'Painting', 'Interior and exterior painting'],
    ['Home Repair', 'Furniture Assembly', 'Assembling flat-pack furniture'],
    ['Home Repair', 'General Handyman', 'Small repairs and odd jobs around the house'],
    // Other
    ['Other', 'Photography', 'Taking photos for events or portraits'],
    ['Other', 'Event Help', 'Helping organize or set up events'],
    ['Other', 'Administrative', 'Data entry, filing, organizing paperwork'],
    ['Other', 'Other', 'Anything else not listed above'],
  ];

  for (const [catName, subName, desc] of subs) {
    const cat = dbHelper.get('SELECT id FROM categories WHERE name = ?', catName);
    if (cat) {
      db.run('INSERT OR IGNORE INTO subcategories (category_id, name, description) VALUES (?, ?, ?)', [cat.id, subName, desc]);
    }
  }

  saveDb();
  console.log('Database initialized with categories, subcategories, and multipliers');
}

// Helper to mimic better-sqlite3's synchronous API
export const dbHelper = {
  get(sql: string, ...params: any[]): any {
    const stmt = db.prepare(sql);
    stmt.bind(params.flat());
    if (stmt.step()) {
      const cols = stmt.getColumnNames();
      const vals = stmt.get();
      stmt.free();
      const row: any = {};
      cols.forEach((c: string, i: number) => row[c] = vals[i]);
      return row;
    }
    stmt.free();
    return undefined;
  },
  all(sql: string, ...params: any[]): any[] {
    const stmt = db.prepare(sql);
    stmt.bind(params.flat());
    const rows: any[] = [];
    const cols = stmt.getColumnNames();
    while (stmt.step()) {
      const vals = stmt.get();
      const row: any = {};
      cols.forEach((c: string, i: number) => row[c] = vals[i]);
      rows.push(row);
    }
    stmt.free();
    return rows;
  },
  run(sql: string, ...params: any[]): { lastInsertRowid: number; changes: number } {
    db.run(sql, params.flat());
    const lastId = (db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] as number) || 0;
    const changes = db.getRowsModified();
    saveDb();
    return { lastInsertRowid: lastId, changes };
  },
  transaction<T>(fn: () => T): () => T {
    return () => {
      db.run('BEGIN TRANSACTION');
      try {
        const result = fn();
        db.run('COMMIT');
        saveDb();
        return result;
      } catch (e) {
        db.run('ROLLBACK');
        throw e;
      }
    };
  }
};

export default dbHelper;
