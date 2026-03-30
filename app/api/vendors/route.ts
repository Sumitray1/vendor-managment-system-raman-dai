import { z } from "zod";
import { ensureSchema, sql } from "@/lib/db";

const CreateVendorSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  panNumber: z.string().optional().nullable(),
});

function normalizeNumeric(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

export async function GET() {
  await ensureSchema();

  const result = await sql`
    WITH purchase_totals AS (
      SELECT vendor_id, SUM(amount) AS total_purchase
      FROM purchases
      GROUP BY vendor_id
    ),
    payment_totals AS (
      SELECT vendor_id, SUM(amount) AS total_paid
      FROM payments
      GROUP BY vendor_id
    )
    SELECT
      v.id,
      v.name,
      v.phone,
      v.address,
      v.pan_number AS "panNumber",
      COALESCE(pt.total_purchase, 0) AS "totalPurchase",
      COALESCE(payt.total_paid, 0) AS "totalPaid",
      (COALESCE(pt.total_purchase, 0) - COALESCE(payt.total_paid, 0)) AS balance
    FROM vendors v
    LEFT JOIN purchase_totals pt ON pt.vendor_id = v.id
    LEFT JOIN payment_totals payt ON payt.vendor_id = v.id
    ORDER BY v.id DESC;
  `;

  const vendors = result.rows.map((row) => ({
    id: Number(row.id),
    name: row.name as string,
    phone: (row.phone as string | null) || "",
    address: (row.address as string | null) || "",
    panNumber: (row.panNumber as string | null) || "",
    totalPurchase: normalizeNumeric(row.totalPurchase),
    totalPaid: normalizeNumeric(row.totalPaid),
    balance: normalizeNumeric(row.balance),
  }));

  return Response.json(vendors);
}

export async function POST(request: Request) {
  await ensureSchema();

  const body = CreateVendorSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const created = await sql`
    INSERT INTO vendors (name, phone, address, pan_number)
    VALUES (${body.data.name}, ${body.data.phone ?? null}, ${body.data.address ?? null}, ${body.data.panNumber ?? null})
    RETURNING id, name, phone, address, pan_number AS "panNumber";
  `;

  const row = created.rows[0];
  const vendor = {
    id: Number(row.id),
    name: row.name as string,
    phone: (row.phone as string | null) || "",
    address: (row.address as string | null) || "",
    panNumber: (row.panNumber as string | null) || "",
    totalPurchase: 0,
    totalPaid: 0,
    balance: 0,
  };

  return Response.json(vendor, { status: 201 });
}
