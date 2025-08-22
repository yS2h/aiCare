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

  -- images 
  CREATE TABLE IF NOT EXISTS images (
    id          uuid PRIMARY KEY,
    child_id    uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    type        text NOT NULL CHECK (type IN ('xray','posture')),
    url         text NOT NULL,
    taken_at    timestamptz,
    uploaded_at timestamptz NOT NULL DEFAULT now(),
    width       integer,
    height      integer,
    notes       text
  );
  CREATE INDEX IF NOT EXISTS idx_images_child ON images(child_id);
  CREATE INDEX IF NOT EXISTS idx_images_child_type ON images(child_id, type);

  -- 이미지 등록 방식 교체에 따라 스키마도 수정
ALTER TABLE images
  ADD COLUMN IF NOT EXISTS filename text,
  ADD COLUMN IF NOT EXISTS mime     text,
  ADD COLUMN IF NOT EXISTS data     bytea,
  ADD COLUMN IF NOT EXISTS size     integer;

ALTER TABLE images DROP COLUMN IF EXISTS url;

ALTER TABLE images
  ALTER COLUMN filename SET NOT NULL,
  ALTER COLUMN mime     SET NOT NULL,
  ALTER COLUMN data     SET NOT NULL,
  ALTER COLUMN size     SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_images_child_type_taken
  ON images(child_id, type, COALESCE(taken_at, uploaded_at) DESC);

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

  -- bone_analysis
  CREATE TABLE IF NOT EXISTS bone_analysis (
    id                        uuid PRIMARY KEY,
    child_id                  uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    image_id                  uuid REFERENCES images(id),
    manual_input_bone_age     double precision,
    ai_predicted_bone_age     double precision,
    skeletal_maturity_score   double precision,
    analyzed_at               timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_bone_analysis_child ON bone_analysis(child_id);

  -- growth_predictions
  CREATE TABLE IF NOT EXISTS growth_predictions (
    id                        uuid PRIMARY KEY,
    child_id                  uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    predicted_adult_height    double precision NOT NULL,
    predicted_weight          double precision NOT NULL,
    growth_potential_score    integer,
    growth_stage              text,
    expected_growth_end_date  date,
    growth_map_chart_url      text,
    phv_status                text CHECK (phv_status IN ('pre','at','post')),
    phv_predicted_date        date,
    phv_age                   double precision,
    generated_at              timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_growth_predictions_child ON growth_predictions(child_id);

  -- posture_analysis 
  CREATE TABLE IF NOT EXISTS posture_analysis (
    id                uuid PRIMARY KEY,
    child_id          uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    image_id          uuid NOT NULL REFERENCES images(id),
    analysis_summary  text NOT NULL,
    recommendation    text,
    analyzed_at       timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_posture_analysis_child ON posture_analysis(child_id);

  -- growth_report
  CREATE TABLE IF NOT EXISTS growth_report (
    id            uuid PRIMARY KEY,
    child_id      uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    report_url    text NOT NULL,
    generated_at  timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_growth_report_child ON growth_report(child_id);

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
