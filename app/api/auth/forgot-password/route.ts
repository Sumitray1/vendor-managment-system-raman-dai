import { z } from "zod";
import { ensureSchema, sql } from "@/lib/db";
import crypto from "node:crypto";

const ForgotSchema = z.object({
  email: z.string().email(),
});

function sha256Hex(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function getBaseUrl(req: Request) {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host");
  if (forwardedProto && forwardedHost)
    return `${forwardedProto}://${forwardedHost}`;

  const forwardedHostSingle =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (forwardedHostSingle) {
    const proto = forwardedProto ?? "http";
    return `${proto}://${forwardedHostSingle}`;
  }

  return new URL(req.url).origin;
}

export async function POST(req: Request) {
  await ensureSchema();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ForgotSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { email } = parsed.data;
  const found = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
  if (found.rows.length === 0) {
    return Response.json({ ok: true });
  }

  const userId = (found.rows[0] as { id: string | number }).id;
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = sha256Hex(token);

  await sql`
    INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
    VALUES (${userId}, ${tokenHash}, NOW() + INTERVAL '15 minutes')
  `;

  const resetLink = `${getBaseUrl(req)}/reset-password/${encodeURIComponent(token)}`;

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;
  if (resendKey && fromEmail) {
    try {
      const sendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: email,
          subject: "Reset your password",
          html: `<p>Click the link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link expires in 15 minutes.</p>`,
        }),
      });

      if (!sendRes.ok && process.env.NODE_ENV !== "production") {
        const details = await sendRes.text().catch(() => "");
        return Response.json({
          ok: true,
          resetLink,
          emailSent: false,
          emailError: details || `Resend failed (HTTP ${sendRes.status})`,
        });
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        return Response.json({
          ok: true,
          resetLink,
          emailSent: false,
          emailError:
            err instanceof Error ? err.message : "Failed to send email",
        });
      }
    }
  }

  if (process.env.NODE_ENV === "production") {
    return Response.json({ ok: true });
  }

  return Response.json({ ok: true, resetLink });
}
