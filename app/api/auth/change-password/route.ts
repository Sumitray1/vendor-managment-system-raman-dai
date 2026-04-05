import { z } from "zod";
import { ensureSchema, sql } from "@/lib/db";
import crypto from "node:crypto";

const ChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

const SESSION_COOKIE_NAME = "session";

function sha256Hex(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function timingSafeEqual(a: Buffer, b: Buffer) {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function verifyPassword(password: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(password, salt, expected.length);
  return timingSafeEqual(actual, expected);
}

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 32);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  const found = parts.find((p) => p.startsWith(`${name}=`));
  if (!found) return null;
  const raw = found.slice(name.length + 1);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function POST(req: Request) {
  await ensureSchema();

  const sessionToken = getCookieValue(req.headers.get("cookie"), SESSION_COOKIE_NAME);
  if (!sessionToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokenHash = sha256Hex(sessionToken);
  const session = await sql`
    SELECT u.id as user_id, u.password_hash
    FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${tokenHash}
      AND s.expires_at > NOW()
    LIMIT 1
  `;
  if (session.rows.length === 0) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ChangeSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { currentPassword, newPassword } = parsed.data;
  const row = session.rows[0] as { user_id: string | number; password_hash: string };
  if (!verifyPassword(currentPassword, row.password_hash)) {
    return Response.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const newHash = hashPassword(newPassword);
  await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${row.user_id}`;
  await sql`DELETE FROM user_sessions WHERE user_id = ${row.user_id}`;

  const secure = process.env.NODE_ENV === "production";
  const cookieParts = [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (secure) cookieParts.push("Secure");

  return Response.json(
    { ok: true },
    { headers: { "set-cookie": cookieParts.join("; ") } },
  );
}

