import { z } from "zod";
import { ensureSchema, sql } from "@/lib/db";

const UpdateVendorSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  panNumber: z.string().optional().nullable(),
});

function normalizeNumeric(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

async function getVendorById(id: number) {
  const result = await sql`
    WITH purchase_totals AS (
      SELECT vendor_id, SUM(amount) AS total_purchase
      FROM purchases
      WHERE vendor_id = ${id}
      GROUP BY vendor_id
    ),
    payment_totals AS (
      SELECT vendor_id, SUM(amount) AS total_paid
      FROM payments
      WHERE vendor_id = ${id}
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
    WHERE v.id = ${id}
    LIMIT 1;
  `;

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: Number(row.id),
    name: row.name as string,
    phone: (row.phone as string | null) || "",
    address: (row.address as string | null) || "",
    panNumber: (row.panNumber as string | null) || "",
    totalPurchase: normalizeNumeric(row.totalPurchase),
    totalPaid: normalizeNumeric(row.totalPaid),
    balance: normalizeNumeric(row.balance),
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await params;
  const vendorId = Number(id);
  if (!Number.isFinite(vendorId)) return Response.json({ error: "Invalid vendor id" }, { status: 400 });

  const vendor = await getVendorById(vendorId);
  if (!vendor) return Response.json({ error: "Vendor not found" }, { status: 404 });

  return Response.json(vendor);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await params;
  const vendorId = Number(id);
  if (!Number.isFinite(vendorId)) return Response.json({ error: "Invalid vendor id" }, { status: 400 });

  const body = UpdateVendorSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid payload" }, { status: 400 });

  const existing = await sql`SELECT id FROM vendors WHERE id = ${vendorId} LIMIT 1;`;
  if (existing.rows.length === 0) return Response.json({ error: "Vendor not found" }, { status: 404 });

  const nextName = body.data.name ?? null;
  const nextPhone = body.data.phone ?? null;
  const nextAddress = body.data.address ?? null;
  const nextPan = body.data.panNumber ?? null;

  await sql`
    UPDATE vendors
    SET
      name = COALESCE(${nextName}, name),
      phone = COALESCE(${nextPhone}, phone),
      address = COALESCE(${nextAddress}, address),
      pan_number = COALESCE(${nextPan}, pan_number)
    WHERE id = ${vendorId};
  `;

  const vendor = await getVendorById(vendorId);
  return Response.json(vendor);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await params;
  const vendorId = Number(id);
  if (!Number.isFinite(vendorId)) return Response.json({ error: "Invalid vendor id" }, { status: 400 });

  const deleted = await sql`DELETE FROM vendors WHERE id = ${vendorId} RETURNING id;`;
  if (deleted.rows.length === 0) return Response.json({ error: "Vendor not found" }, { status: 404 });

  return new Response(null, { status: 204 });
}
