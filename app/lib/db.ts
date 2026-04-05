import { neon } from "@neondatabase/serverless";

let schemaEnsured: Promise<void> | null = null;

let neonSql: ReturnType<typeof neon> | null = null;

function getNeonSql() {
  if (neonSql) return neonSql;

  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "Missing POSTGRES_URL (or DATABASE_URL) environment variable.",
    );
  }

  neonSql = neon(connectionString);
  return neonSql;
}

export function ensureSchema() {
  if (!schemaEnsured) {
    schemaEnsured = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id BIGSERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id BIGSERIAL PRIMARY KEY,
          user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx
        ON user_sessions(user_id);
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id BIGSERIAL PRIMARY KEY,
          user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL,
          used_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx
        ON password_reset_tokens(user_id);
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS vendors (
          id BIGSERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT,
          address TEXT,
          pan_number TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS purchases (
          id BIGSERIAL PRIMARY KEY,
          vendor_id BIGINT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          bill_no TEXT,
          amount NUMERIC(12, 2) NOT NULL,
          type TEXT NOT NULL,
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS payments (
          id BIGSERIAL PRIMARY KEY,
          vendor_id BIGINT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          amount NUMERIC(12, 2) NOT NULL,
          method TEXT NOT NULL,
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;
    })();
  }

  return schemaEnsured;
}

export async function sql(
  strings: TemplateStringsArray,
  ...values: Array<unknown>
) {
  const rows = (await getNeonSql()(strings, ...values)) as Array<
    Record<string, unknown>
  >;
  return { rows };
}
