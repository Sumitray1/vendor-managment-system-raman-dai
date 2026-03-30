import { z } from "zod";
import { ensureSchema, sql } from "@/lib/db";

const CreatePaymentSchema = z.object({
  vendorId: z.union([z.number(), z.string()]).transform(Number),
  date: z.string().min(1),
  amount: z.union([z.number(), z.string()]).transform(Number),
  method: z.string().min(1),
  notes: z.string().optional().nullable(),
});

function normalizeNumeric(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

export async function GET() {
  await ensureSchema();

  const result = await sql`
    SELECT
      p.id,
      p.vendor_id AS "vendorId",
      v.name AS "vendorName",
      p.date::text AS date,
      p.amount,
      p.method,
      COALESCE(p.notes, '') AS notes
    FROM payments p
    JOIN vendors v ON v.id = p.vendor_id
    ORDER BY p.id DESC;
  `;

  const payments = result.rows.map((row) => ({
    id: Number(row.id),
    vendorId: Number(row.vendorId),
    vendorName: row.vendorName as string,
    date: row.date as string,
    amount: normalizeNumeric(row.amount),
    method: row.method as string,
    notes: row.notes as string,
  }));

  return Response.json(payments);
}

export async function POST(request: Request) {
  await ensureSchema();

  const body = CreatePaymentSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid payload" }, { status: 400 });
  if (!Number.isFinite(body.data.vendorId)) return Response.json({ error: "Invalid vendorId" }, { status: 400 });
  if (!Number.isFinite(body.data.amount) || body.data.amount <= 0) return Response.json({ error: "Invalid amount" }, { status: 400 });

  const vendor = await sql`SELECT id FROM vendors WHERE id = ${body.data.vendorId} LIMIT 1;`;
  if (vendor.rows.length === 0) return Response.json({ error: "Vendor not found" }, { status: 404 });

  const created = await sql`
    WITH inserted AS (
      INSERT INTO payments (vendor_id, date, amount, method, notes)
      VALUES (
        ${body.data.vendorId},
        ${body.data.date},
        ${body.data.amount},
        ${body.data.method},
        ${body.data.notes ?? null}
      )
      RETURNING id, vendor_id, date, amount, method, notes
    )
    SELECT
      i.id,
      i.vendor_id AS "vendorId",
      v.name AS "vendorName",
      i.date::text AS date,
      i.amount,
      i.method,
      COALESCE(i.notes, '') AS notes
    FROM inserted i
    JOIN vendors v ON v.id = i.vendor_id;
  `;

  const row = created.rows[0];
  const payment = {
    id: Number(row.id),
    vendorId: Number(row.vendorId),
    vendorName: row.vendorName as string,
    date: row.date as string,
    amount: normalizeNumeric(row.amount),
    method: row.method as string,
    notes: row.notes as string,
  };

  return Response.json(payment, { status: 201 });
}

