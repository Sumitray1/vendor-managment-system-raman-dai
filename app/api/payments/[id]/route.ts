import { z } from "zod";
import { ensureSchema, sql } from "@/lib/db";

const UpdatePaymentSchema = z.object({
  vendorId: z.union([z.number(), z.string()]).transform(Number).optional(),
  date: z.string().min(1).optional(),
  amount: z.union([z.number(), z.string()]).transform(Number).optional(),
  method: z.string().min(1).optional(),
  notes: z.string().optional().nullable(),
});

function normalizeNumeric(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

async function getPaymentById(id: number) {
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
    WHERE p.id = ${id}
    LIMIT 1;
  `;

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: Number(row.id),
    vendorId: Number(row.vendorId),
    vendorName: row.vendorName as string,
    date: row.date as string,
    amount: normalizeNumeric(row.amount),
    method: row.method as string,
    notes: row.notes as string,
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await params;
  const paymentId = Number(id);
  if (!Number.isFinite(paymentId)) return Response.json({ error: "Invalid payment id" }, { status: 400 });

  const payment = await getPaymentById(paymentId);
  if (!payment) return Response.json({ error: "Payment not found" }, { status: 404 });

  return Response.json(payment);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await params;
  const paymentId = Number(id);
  if (!Number.isFinite(paymentId)) return Response.json({ error: "Invalid payment id" }, { status: 400 });

  const body = UpdatePaymentSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid payload" }, { status: 400 });
  if (body.data.amount !== undefined && (!Number.isFinite(body.data.amount) || body.data.amount <= 0)) {
    return Response.json({ error: "Invalid amount" }, { status: 400 });
  }
  if (body.data.vendorId !== undefined && !Number.isFinite(body.data.vendorId)) {
    return Response.json({ error: "Invalid vendorId" }, { status: 400 });
  }

  const existing = await sql`SELECT id FROM payments WHERE id = ${paymentId} LIMIT 1;`;
  if (existing.rows.length === 0) return Response.json({ error: "Payment not found" }, { status: 404 });

  if (body.data.vendorId !== undefined) {
    const vendor = await sql`SELECT id FROM vendors WHERE id = ${body.data.vendorId} LIMIT 1;`;
    if (vendor.rows.length === 0) return Response.json({ error: "Vendor not found" }, { status: 404 });
  }

  const nextVendorId = body.data.vendorId ?? null;
  const nextDate = body.data.date ?? null;
  const nextAmount = body.data.amount ?? null;
  const nextMethod = body.data.method ?? null;
  const nextNotes = body.data.notes ?? null;

  await sql`
    UPDATE payments
    SET
      vendor_id = COALESCE(${nextVendorId}, vendor_id),
      date = COALESCE(${nextDate}::date, date),
      amount = COALESCE(${nextAmount}, amount),
      method = COALESCE(${nextMethod}, method),
      notes = COALESCE(${nextNotes}, notes)
    WHERE id = ${paymentId};
  `;

  const payment = await getPaymentById(paymentId);
  return Response.json(payment);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await params;
  const paymentId = Number(id);
  if (!Number.isFinite(paymentId)) return Response.json({ error: "Invalid payment id" }, { status: 400 });

  const deleted = await sql`DELETE FROM payments WHERE id = ${paymentId} RETURNING id;`;
  if (deleted.rows.length === 0) return Response.json({ error: "Payment not found" }, { status: 404 });

  return new Response(null, { status: 204 });
}
