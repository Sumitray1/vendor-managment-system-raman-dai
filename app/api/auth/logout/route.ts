import { ensureSchema, sql } from "@/lib/db";
import crypto from "node:crypto";

const SESSION_COOKIE_NAME = "session";

function sha256Hex(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
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
  if (sessionToken) {
    const tokenHash = sha256Hex(sessionToken);
    await sql`DELETE FROM user_sessions WHERE token_hash = ${tokenHash}`;
  }

  const secure = process.env.NODE_ENV === "production";
  const cookieParts = [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (secure) cookieParts.push("Secure");

  return new Response(null, {
    status: 204,
    headers: { "set-cookie": cookieParts.join("; ") },
  });
}

