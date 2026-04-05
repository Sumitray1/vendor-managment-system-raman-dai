import { z } from "zod";
import { ensureSchema, sql } from "@/lib/db";
import crypto from "node:crypto";

const ResetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

function sha256Hex(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 32);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function POST(req: Request) {
  await ensureSchema();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ResetSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { token, password } = parsed.data;
  const tokenHash = sha256Hex(token);

  const tokenRow = await sql`
    SELECT id, user_id, expires_at, used_at
    FROM password_reset_tokens
    WHERE token_hash = ${tokenHash}
    LIMIT 1
  `;
  if (tokenRow.rows.length === 0) {
    return Response.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  const row = tokenRow.rows[0] as {
    id: string | number;
    user_id: string | number;
    expires_at: string;
    used_at: string | null;
  };

  if (row.used_at) {
    return Response.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  const expiresAt = new Date(row.expires_at);
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
    return Response.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  const passwordHash = hashPassword(password);

  await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${row.user_id}`;
  await sql`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ${row.id}`;
  await sql`DELETE FROM user_sessions WHERE user_id = ${row.user_id}`;

  return Response.json({ ok: true });
}

