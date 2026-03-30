import { z } from "zod";
import { ensureSchema, sql } from "@/lib/db";

const CreatePurchaseSchema = z.object({
  vendorId: z.union([z.number(), z.string()]).transform(Number),
  date: z.string().min(1),
  billNo: z.string().optional().nullable(),
  amount: z.union([z.number(), z.string()]).transform(Number),
  type: z.enum(["Cash", "Credit"]),
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
      COALESCE(p.bill_no, '') AS "billNo",
      p.amount,
      p.type,
      COALESCE(p.notes, '') AS notes
    FROM purchases p
    JOIN vendors v ON v.id = p.vendor_id
    ORDER BY p.id DESC;
  `;

  const purchases = result.rows.map((row) => ({
    id: Number(row.id),
    vendorId: Number(row.vendorId),
    vendorName: row.vendorName as string,
    date: row.date as string,
    billNo: row.billNo as string,
    amount: normalizeNumeric(row.amount),
    type: row.type as "Cash" | "Credit",
    notes: row.notes as string,
  }));

  return Response.json(purchases);
}

export async function POST(request: Request) {
  await ensureSchema();

  const body = CreatePurchaseSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid payload" }, { status: 400 });
  if (!Number.isFinite(body.data.vendorId)) return Response.json({ error: "Invalid vendorId" }, { status: 400 });
  if (!Number.isFinite(body.data.amount) || body.data.amount <= 0) return Response.json({ error: "Invalid amount" }, { status: 400 });

  const vendor = await sql`SELECT id, name FROM vendors WHERE id = ${body.data.vendorId} LIMIT 1;`;
  if (vendor.rows.length === 0) return Response.json({ error: "Vendor not found" }, { status: 404 });

  const created = await sql`
    WITH inserted AS (
      INSERT INTO purchases (vendor_id, date, bill_no, amount, type, notes)
      VALUES (
        ${body.data.vendorId},
        ${body.data.date},
        ${body.data.billNo ?? null},
        ${body.data.amount},
        ${body.data.type},
        ${body.data.notes ?? null}
      )
      RETURNING id, vendor_id, date, bill_no, amount, type, notes
    )
    SELECT
      i.id,
      i.vendor_id AS "vendorId",
      v.name AS "vendorName",
      i.date::text AS date,
      COALESCE(i.bill_no, '') AS "billNo",
      i.amount,
      i.type,
      COALESCE(i.notes, '') AS notes
    FROM inserted i
    JOIN vendors v ON v.id = i.vendor_id;
  `;

  const row = created.rows[0];
  const purchase = {
    id: Number(row.id),
    vendorId: Number(row.vendorId),
    vendorName: row.vendorName as string,
    date: row.date as string,
    billNo: row.billNo as string,
    amount: normalizeNumeric(row.amount),
    type: row.type as "Cash" | "Credit",
    notes: row.notes as string,
  };

  return Response.json(purchase, { status: 201 });
}

