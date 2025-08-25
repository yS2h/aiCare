const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error("[ERROR] DATABASE_URL is not set");
  process.exit(1);
}

const baseUrl = process.env.DATABASE_URL;
const withTimezone =
  baseUrl +
  (baseUrl.includes("?") ? "&" : "?") +
  "options=-c%20timezone%3DAsia%2FSeoul";

const pool = new Pool({
  connectionString: withTimezone,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,

  connectionTimeoutMillis: Number(
    process.env.PG_CONNECTION_TIMEOUT_MS || 20000
  ),
  query_timeout: Number(process.env.PG_QUERY_TIMEOUT_MS || 0),
});

pool.on("connect", (client) => {
  client.query("SET TIME ZONE 'Asia/Seoul'").catch(() => {});
});

pool.on("error", (err) => {
  console.error("[DB] Unexpected error on idle client", err);
});

async function ping() {
  try {
    const r = await pool.query("select 1 as ok");
    return r.rows[0].ok === 1;
  } catch (error) {
    console.error("[DB] Ping failed:", error.message);
    return false;
  }
}

async function init() {
  const ddl = `
  BEGIN;

  -- users 
  CREATE TABLE IF NOT EXISTS users (
    id                uuid PRIMARY KEY,
    provider          text NOT NULL CHECK (provider = 'kakao'),
    provider_id       text NOT NULL,
    name              text NOT NULL,
    profile_image_url text DEFAULT '',
    created_at        timestamptz NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_id)
  );

  -- children
  CREATE TABLE IF NOT EXISTS children (
    id             uuid PRIMARY KEY,
    user_id        uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name           text NOT NULL,
    gender         text NOT NULL CHECK (gender IN ('male','female')),
    birth_date     date NOT NULL,
    height double precision NOT NULL,
    weight double precision NOT NULL,
    father_height  double precision NOT NULL,
    mother_height  double precision NOT NULL,
    created_at     timestamptz NOT NULL DEFAULT now()
  );

  -- growth_record 
  CREATE TABLE IF NOT EXISTS growth_record (
    id          uuid PRIMARY KEY,
    child_id    uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    recorded_at date NOT NULL,
    height_cm   double precision NOT NULL,
    weight_kg   double precision NOT NULL,
    bmi         double precision,
    notes       text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (child_id, recorded_at)
  );
  CREATE INDEX IF NOT EXISTS idx_growth_record_child_date ON growth_record(child_id, recorded_at);
d);

-- === GPT Chat ===
CREATE TABLE IF NOT EXISTS conversations (
  id          uuid PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_updated
  ON conversations(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id               uuid PRIMARY KEY,
  conversation_id  uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role             text NOT NULL CHECK (role IN ('system','user','assistant')),
  content          text NOT NULL,
  model            text,
  finish_reason    text,
  usage            jsonb,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created
  ON messages(conversation_id, created_at ASC);

  COMMIT;
  `;

  await pool.query(ddl);
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  init,
  ping,
};
