"use client";
import { useState } from "react";
import { Check, ChevronDown, Copy, Database, Download, FileCode2 } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// SQL Schema
// ─────────────────────────────────────────────────────────────
const SQL_SCHEMA = `-- ============================================================
-- Yatrik – SQL Schema  (PostgreSQL / MySQL compatible)
-- ============================================================

-- Enable UUID extension (PostgreSQL only; remove for MySQL)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE users (
  id           VARCHAR(36)  PRIMARY KEY,
  email        VARCHAR(255) NOT NULL UNIQUE,
  password     VARCHAR(255) NOT NULL,  -- store hashed (bcrypt)
  role         VARCHAR(10)  NOT NULL CHECK (role IN ('student','admin')),
  name         VARCHAR(255) NOT NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Student Profiles ─────────────────────────────────────────
CREATE TABLE student_profiles (
  id               VARCHAR(36)  PRIMARY KEY,
  user_id          VARCHAR(36)  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name        VARCHAR(255) NOT NULL,
  student_id       VARCHAR(50),
  college          VARCHAR(255),
  course           VARCHAR(100),
  year             VARCHAR(20),
  mobile           VARCHAR(20),
  email            VARCHAR(255),
  photo_key        VARCHAR(255),   -- object-store key for profile photo
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sp_user ON student_profiles(user_id);

-- ── Bus Routes ───────────────────────────────────────────────
CREATE TABLE bus_routes (
  id              VARCHAR(36)  PRIMARY KEY,
  number          VARCHAR(20)  NOT NULL UNIQUE,
  start           VARCHAR(255) NOT NULL,
  "end"           VARCHAR(255) NOT NULL,
  distance_km     DECIMAL(6,1),
  duration_min    INT,
  color           VARCHAR(10)  DEFAULT '#3DB67F',
  active          BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Bus Stops ────────────────────────────────────────────────
CREATE TABLE bus_stops (
  id         VARCHAR(36)  PRIMARY KEY,
  route_id   VARCHAR(36)  NOT NULL REFERENCES bus_routes(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  lat        DECIMAL(9,6) NOT NULL,
  lng        DECIMAL(9,6) NOT NULL,
  "order"    INT          NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_stops_route ON bus_stops(route_id);

-- ── Applications ─────────────────────────────────────────────
CREATE TABLE applications (
  id                  VARCHAR(20)  PRIMARY KEY,  -- e.g. APP20240001
  user_id             VARCHAR(36)  NOT NULL REFERENCES users(id),
  student_profile_id  VARCHAR(36)  NOT NULL REFERENCES student_profiles(id),
  route_id            VARCHAR(36)  NOT NULL REFERENCES bus_routes(id),
  pass_type           VARCHAR(20)  NOT NULL CHECK (pass_type IN ('monthly','quarterly','half-yearly','yearly')),
  full_name           VARCHAR(255) NOT NULL,
  student_id          VARCHAR(50),
  college             VARCHAR(255),
  course              VARCHAR(100),
  year                VARCHAR(20),
  mobile              VARCHAR(20),
  email               VARCHAR(255),
  address             TEXT,
  status              VARCHAR(20)  NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','under_review','approved','rejected')),
  submitted_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at         TIMESTAMP,
  rejection_reason    TEXT,
  pass_id             VARCHAR(20),
  -- document storage keys (object store)
  doc_photo           VARCHAR(255),
  doc_student_id_card VARCHAR(255),
  doc_admission_proof VARCHAR(255)
);
CREATE INDEX idx_app_user   ON applications(user_id);
CREATE INDEX idx_app_status ON applications(status);

-- ── Application Timeline ─────────────────────────────────────
CREATE TABLE application_timeline (
  id             SERIAL       PRIMARY KEY,
  application_id VARCHAR(20)  NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  event_key      VARCHAR(50)  NOT NULL,
  label          VARCHAR(255) NOT NULL,
  occurred_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_timeline_app ON application_timeline(application_id);

-- ── Issued Passes ────────────────────────────────────────────
CREATE TABLE issued_passes (
  id                 VARCHAR(20)  PRIMARY KEY,  -- e.g. BP20240001
  application_id     VARCHAR(20)  NOT NULL REFERENCES applications(id),
  student_profile_id VARCHAR(36)  NOT NULL REFERENCES student_profiles(id),
  user_id            VARCHAR(36)  NOT NULL REFERENCES users(id),
  route_id           VARCHAR(36)  NOT NULL REFERENCES bus_routes(id),
  pass_type          VARCHAR(20)  NOT NULL,
  issue_date         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expiry_date        TIMESTAMP    NOT NULL,
  revoked            BOOLEAN      NOT NULL DEFAULT FALSE,
  notified_7         BOOLEAN      NOT NULL DEFAULT FALSE,
  notified_30        BOOLEAN      NOT NULL DEFAULT FALSE,
  notified_expired   BOOLEAN      NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_pass_user   ON issued_passes(user_id);
CREATE INDEX idx_pass_expiry ON issued_passes(expiry_date);

-- ── Pass History ─────────────────────────────────────────────
CREATE TABLE pass_history (
  id         SERIAL       PRIMARY KEY,
  pass_id    VARCHAR(20)  NOT NULL REFERENCES issued_passes(id) ON DELETE CASCADE,
  action     VARCHAR(50)  NOT NULL,  -- issued | revoked | reinstated | extended | expired
  note       TEXT,
  occurred_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_hist_pass ON pass_history(pass_id);

-- ── Announcements ────────────────────────────────────────────
CREATE TABLE announcements (
  id         VARCHAR(36)  PRIMARY KEY,
  title      VARCHAR(255) NOT NULL,
  body       TEXT         NOT NULL,
  priority   VARCHAR(10)  NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal','important','urgent')),
  active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Notifications ────────────────────────────────────────────
CREATE TABLE notifications (
  id         VARCHAR(36)  PRIMARY KEY,
  audience   VARCHAR(36)  NOT NULL,  -- user_id or 'admin'
  type       VARCHAR(30)  NOT NULL,
  title      VARCHAR(255) NOT NULL,
  message    TEXT         NOT NULL,
  link       VARCHAR(255),
  read       BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notif_audience ON notifications(audience, read);

-- ── Settings ─────────────────────────────────────────────────
CREATE TABLE settings (
  key   VARCHAR(100) PRIMARY KEY,
  value TEXT         NOT NULL
);

-- Seed default settings
INSERT INTO settings (key, value) VALUES
  ('college_name',           'Mumbai College of Technology'),
  ('validity_monthly',       '30'),
  ('validity_quarterly',     '90'),
  ('validity_half_yearly',   '180'),
  ('validity_yearly',        '365'),
  ('counter_app',            '0'),
  ('counter_pass',           '0');
`;

// ─────────────────────────────────────────────────────────────
// .env template
// ─────────────────────────────────────────────────────────────
const ENV_TEMPLATE = `# ============================================================
# Yatrik – Environment Variables
# Copy this file to .env.local and fill in your values.
# Never commit .env.local to version control.
# ============================================================

# ── App ──────────────────────────────────────────────────────
NEXT_PUBLIC_APP_NAME=Yatrik
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_COLLEGE_NAME="Mumbai College of Technology"

# ── Database (choose one) ────────────────────────────────────

# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/yatrik

# MySQL (alternative)
# DATABASE_URL=mysql://user:password@localhost:3306/yatrik

# SQLite (local dev only)
# DATABASE_URL=file:./yatrik.db

# ── Auth / Sessions ──────────────────────────────────────────
NEXTAUTH_SECRET=replace_with_32_char_random_string
NEXTAUTH_URL=http://localhost:3000

# JWT signing secret (if using custom JWT instead of NextAuth)
JWT_SECRET=replace_with_another_random_secret

# Session cookie max-age in seconds (default 7 days)
SESSION_MAX_AGE=604800

# ── File Storage ─────────────────────────────────────────────
# Local filesystem (dev) — relative to project root
UPLOAD_DIR=./uploads

# AWS S3 (production)
# AWS_REGION=ap-south-1
# AWS_ACCESS_KEY_ID=AKIA...
# AWS_SECRET_ACCESS_KEY=...
# S3_BUCKET_NAME=yatrik-uploads

# Cloudflare R2 (alternative S3-compatible)
# R2_ACCOUNT_ID=...
# R2_ACCESS_KEY_ID=...
# R2_SECRET_ACCESS_KEY=...
# R2_BUCKET_NAME=yatrik-uploads
# R2_PUBLIC_URL=https://pub-xxx.r2.dev

# ── Web Push Notifications ───────────────────────────────────
# Generate with: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BExamplePublicKeyHere...
VAPID_PRIVATE_KEY=ExamplePrivateKeyHere...
VAPID_SUBJECT=mailto:admin@yatrik.example.com

# ── Email (optional — for real password-reset / approval emails) ─
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=you@gmail.com
# SMTP_PASS=app_specific_password
# EMAIL_FROM="Yatrik <noreply@yatrik.example.com>"

# ── Redis (optional — for rate limiting / session store) ─────
# REDIS_URL=redis://localhost:6379

# ── Misc ─────────────────────────────────────────────────────
# Set to 'production' in prod, 'development' locally
NODE_ENV=development
LOG_LEVEL=info
`;

type Tab = "sql" | "env";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
        copied ? "bg-emerald-100 text-emerald-700" : "bg-white/10 text-white hover:bg-white/20"
      )}>
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function DownloadButton({ text, filename }: { text: string; filename: string }) {
  const dl = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    a.download = filename;
    a.click();
  };
  return (
    <button onClick={dl}
      className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20">
      <Download size={13} /> Download
    </button>
  );
}

export default function DatabasePage() {
  const [tab, setTab] = useState<Tab>("sql");
  const content = tab === "sql" ? SQL_SCHEMA : ENV_TEMPLATE;
  const filename = tab === "sql" ? "yatrik-schema.sql" : ".env.example";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Database &amp; Config</h1>
        <p className="text-sm text-ink-mute">SQL schema to migrate your data to a real database, plus a .env template for backend deployment.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([["sql", "SQL Schema", Database], ["env", ".env Template", FileCode2]] as const).map(([v, label, Icon]) => (
          <button key={v} onClick={() => setTab(v)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
              tab === v ? "border-forest-700 bg-forest-700 text-white shadow-soft" : "border-forest-100 bg-white text-ink-soft hover:border-forest-300"
            )}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* Info card */}
      {tab === "sql" && (
        <Card className="p-4 text-sm text-ink-soft space-y-1">
          <p className="font-semibold text-ink">📦 Currently: browser-only storage (LocalStorage + IndexedDB)</p>
          <p>The app works fully in the browser with no backend. When you're ready to add a real database, run this schema in your PostgreSQL or MySQL instance, then replace the <code className="rounded bg-forest-50 px-1 py-0.5 text-xs">lib/storage.ts</code> collection calls with API routes that query this schema.</p>
        </Card>
      )}
      {tab === "env" && (
        <Card className="p-4 text-sm text-ink-soft space-y-1">
          <p className="font-semibold text-ink">⚙️ Environment configuration</p>
          <p>Copy this to <code className="rounded bg-forest-50 px-1 py-0.5 text-xs">.env.local</code> in the project root and fill in your values. Only variables prefixed <code className="rounded bg-forest-50 px-1 py-0.5 text-xs">NEXT_PUBLIC_</code> are exposed to the browser.</p>
        </Card>
      )}

      {/* Code block */}
      <div className="overflow-hidden rounded-2xl border border-forest-900/20 shadow-soft">
        <div className="flex items-center justify-between bg-forest-900 px-4 py-2.5">
          <span className="font-mono text-xs text-mint-300">{filename}</span>
          <div className="flex gap-2">
            <CopyButton text={content} />
            <DownloadButton text={content} filename={filename} />
          </div>
        </div>
        <pre className="max-h-[60vh] overflow-auto bg-[#0d1f17] px-5 py-4 font-mono text-xs leading-relaxed text-green-200">
          {content}
        </pre>
      </div>
    </div>
  );
}
