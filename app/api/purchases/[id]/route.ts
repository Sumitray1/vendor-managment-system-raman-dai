import { z } from "zod";
import { ensureSchema, sql } from "@/lib/db";

const UpdatePurchaseSchema = z.object({
  vendorId: z.union([z.number(), z.string()]).transform(Number).optional(),
  date: z.string().min(1).optional(),
  billNo: z.string().optional().nullable(),
  amount: z.union([z.number(), z.string()]).transform(Number).optional(),
  type: z.enum(["Cash", "Credit"]).optional(),
  notes: z.string().optional().nullable(),
});

function normalizeNumeric(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

async function getPurchaseById(id: number) {
  const result = await sql`
    SELECT
      p.id,
      p.vendor_id AS "vendorId",
      v.name AS "vendorName",
      p.date::text AS date,
      COALESCE(p.bill_no, '') AS "billNo",
      p.amount,
      p.type,
      COALESCE(p.notes, '') AS notes
    FROM purchases p
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
    billNo: row.billNo as string,
    amount: normalizeNumeric(row.amount),
    type: row.type as "Cash" | "Credit",
    notes: row.notes as string,
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await params;
  const purchaseId = Number(id);
  if (!Number.isFinite(purchaseId)) return Response.json({ error: "Invalid purchase id" }, { status: 400 });

  const purchase = await getPurchaseById(purchaseId);
  if (!purchase) return Response.json({ error: "Purchase not found" }, { status: 404 });

  return Response.json(purchase);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await params;
  const purchaseId = Number(id);
  if (!Number.isFinite(purchaseId)) return Response.json({ error: "Invalid purchase id" }, { status: 400 });

  const body = UpdatePurchaseSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid payload" }, { status: 400 });
  if (body.data.amount !== undefined && (!Number.isFinite(body.data.amount) || body.data.amount <= 0)) {
    return Response.json({ error: "Invalid amount" }, { status: 400 });
  }
  if (body.data.vendorId !== undefined && !Number.isFinite(body.data.vendorId)) {
    return Response.json({ error: "Invalid vendorId" }, { status: 400 });
  }

  const existing = await sql`SELECT id FROM purchases WHERE id = ${purchaseId} LIMIT 1;`;
  if (existing.rows.length === 0) return Response.json({ error: "Purchase not found" }, { status: 404 });

  if (body.data.vendorId !== undefined) {
    const vendor = await sql`SELECT id FROM vendors WHERE id = ${body.data.vendorId} LIMIT 1;`;
    if (vendor.rows.length === 0) return Response.json({ error: "Vendor not found" }, { status: 404 });
  }

  const nextVendorId = body.data.vendorId ?? null;
  const nextDate = body.data.date ?? null;
  const nextBillNo = body.data.billNo ?? null;
  const nextAmount = body.data.amount ?? null;
  const nextType = body.data.type ?? null;
  const nextNotes = body.data.notes ?? null;

  await sql`
    UPDATE purchases
    SET
      vendor_id = COALESCE(${nextVendorId}, vendor_id),
      date = COALESCE(${nextDate}::date, date),
      bill_no = COALESCE(${nextBillNo}, bill_no),
      amount = COALESCE(${nextAmount}, amount),
      type = COALESCE(${nextType}, type),
      notes = COALESCE(${nextNotes}, notes)
    WHERE id = ${purchaseId};
  `;

  const purchase = await getPurchaseById(purchaseId);
  return Response.json(purchase);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await params;
  const purchaseId = Number(id);
  if (!Number.isFinite(purchaseId)) return Response.json({ error: "Invalid purchase id" }, { status: 400 });

  const deleted = await sql`DELETE FROM purchases WHERE id = ${purchaseId} RETURNING id;`;
  if (deleted.rows.length === 0) return Response.json({ error: "Purchase not found" }, { status: 404 });

  return new Response(null, { status: 204 });
}
