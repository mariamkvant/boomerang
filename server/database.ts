import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, bio TEXT DEFAULT '',
        points INTEGER DEFAULT 50, created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL,
        icon TEXT DEFAULT '🔧', multiplier REAL DEFAULT 1.0, base_rate INTEGER DEFAULT 10
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS subcategories (
        id SERIAL PRIMARY KEY, category_id INTEGER NOT NULL REFERENCES categories(id),
        name TEXT NOT NULL, description TEXT DEFAULT '',
        UNIQUE(category_id, name)
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY, provider_id INTEGER NOT NULL REFERENCES users(id),
        category_id INTEGER NOT NULL REFERENCES categories(id),
        subcategory_id INTEGER REFERENCES subcategories(id),
        title TEXT NOT NULL, description TEXT NOT NULL,
        points_cost INTEGER NOT NULL DEFAULT 10, duration_minutes INTEGER DEFAULT 60,
        is_active INTEGER DEFAULT 1, created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_requests (
        id SERIAL PRIMARY KEY, service_id INTEGER NOT NULL REFERENCES services(id),
        requester_id INTEGER NOT NULL REFERENCES users(id),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending','accepted','completed','cancelled')),
        message TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT NOW(), completed_at TIMESTAMPTZ
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY, request_id INTEGER UNIQUE NOT NULL REFERENCES service_requests(id),
        reviewer_id INTEGER NOT NULL REFERENCES users(id),
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comment TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
