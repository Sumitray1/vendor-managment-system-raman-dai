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
