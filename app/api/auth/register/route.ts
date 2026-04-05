import { z } from "zod";
import { ensureSchema, sql } from "@/lib/db";
import crypto from "node:crypto";

const RegisterSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 32);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function POST(req: Request) {
  await ensureSchema();

  const secret = process.env.REGISTER_SECRET;
  if (!secret) {
    return Response.json(
      { error: "REGISTER_SECRET is not configured" },
      { status: 500 },
    );
  }

  let payload: unknown;
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      payload = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }
  } else if (contentType.includes("multipart/form-data")) {
    const fd = await req.formData();
    payload = Object.fromEntries(fd.entries());
  } else {
    try {
      payload = await req.json();
    } catch {
      return Response.json({ error: "Unsupported content type" }, { status: 415 });
    }
  }

  const parsed = RegisterSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { token, name, email, password } = parsed.data;
  if (token !== secret) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const passwordHash = hashPassword(password);

  try {
    const inserted = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email}, ${passwordHash})
      RETURNING id, name, email
    `;
    return Response.json({ user: inserted.rows[0] });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.toLowerCase().includes("unique")) {
      return Response.json({ error: "Email already exists" }, { status: 409 });
    }
    return Response.json({ error: "Failed to create user" }, { status: 500 });
  }
}

