import { z } from "zod";
import { ensureSchema, sql } from "@/lib/db";
import crypto from "node:crypto";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function timingSafeEqual(a: Buffer, b: Buffer) {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function sha256Hex(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function verifyPassword(password: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(password, salt, expected.length);
  return timingSafeEqual(actual, expected);
}

export async function POST(req: Request) {
  await ensureSchema();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const found = await sql`
    SELECT id, name, email, password_hash
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `;
  if (found.rows.length === 0) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const user = found.rows[0] as {
    id: string | number;
    name: string;
    email: string;
    password_hash: string;
  };

  if (!verifyPassword(password, user.password_hash)) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const sessionToken = crypto.randomBytes(32).toString("base64url");
  const sessionTokenHash = sha256Hex(sessionToken);

  await sql`
    INSERT INTO user_sessions (user_id, token_hash, expires_at)
    VALUES (${user.id}, ${sessionTokenHash}, NOW() + INTERVAL '7 days')
  `;

  const secure = process.env.NODE_ENV === "production";
  const cookieParts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionToken)}`,
    "Path=/",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (secure) cookieParts.push("Secure");

  return Response.json(
    {
      user: { id: user.id, name: user.name, email: user.email },
    },
    { headers: { "set-cookie": cookieParts.join("; ") } },
  );
}
