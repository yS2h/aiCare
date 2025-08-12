const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.warn("[WARN] DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

async function ping() {
  const r = await pool.query("select 1 as ok");
  return r.rows[0].ok === 1;
}

async function init() {
  await pool.query(`
    create table if not exists users (
      id uuid primary key,
      provider text not null,
      provider_id text not null,
      name text not null,
      profile_image_url text default '',
      created_at timestamptz not null default now(),
      unique(provider, provider_id)
    );
  `);
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  init,
  ping,
};
