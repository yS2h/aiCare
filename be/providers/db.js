const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.warn("[WARN] DATABASE_URL is not set");
}

const baseUrl = process.env.DATABASE_URL;
const withTimezone =
  baseUrl +
  (baseUrl.includes("?") ? "&" : "?") +
  "options=-c%20timezone%3DAsia%2FSeoul";

const pool = new Pool({
  connectionString: withTimezone,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on("connect", (client) => {
  client.query("SET TIME ZONE 'Asia/Seoul'").catch(() => {});
});

async function ping() {
  const r = await pool.query("select 1 as ok");
  return r.rows[0].ok === 1;
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
    father_height  double precision,
    mother_height  double precision,
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
