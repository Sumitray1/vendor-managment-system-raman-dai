import { ensureSchema, sql } from "@/lib/db";

type LedgerEntry = {
  date: string;
  type: "Purchase" | "Payment";
  reference: string;
  amount: number;
  runningBalance: number;
};

function normalizeNumeric(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await params;
  const vendorId = Number(id);
  if (!Number.isFinite(vendorId)) return Response.json({ error: "Invalid vendor id" }, { status: 400 });

  const vendor = await sql`SELECT id FROM vendors WHERE id = ${vendorId} LIMIT 1;`;
  if (vendor.rows.length === 0) return Response.json({ error: "Vendor not found" }, { status: 404 });

  const purchases = await sql`
    SELECT
      date::text AS date,
      COALESCE(bill_no, '') AS reference,
      amount
    FROM purchases
    WHERE vendor_id = ${vendorId};
  `;

  const payments = await sql`
    SELECT
      date::text AS date,
      COALESCE(method, '') AS reference,
      amount
    FROM payments
    WHERE vendor_id = ${vendorId};
  `;

  const events: Array<Omit<LedgerEntry, "runningBalance">> = [
    ...purchases.rows.map((r) => ({
      date: r.date as string,
      type: "Purchase" as const,
      reference: r.reference as string,
      amount: normalizeNumeric(r.amount),
    })),
    ...payments.rows.map((r) => ({
      date: r.date as string,
      type: "Payment" as const,
      reference: r.reference as string,
      amount: normalizeNumeric(r.amount),
    })),
  ].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.type !== b.type) return a.type === "Purchase" ? -1 : 1;
    return 0;
  });

  let running = 0;
  const ledger: LedgerEntry[] = events.map((e) => {
    running = e.type === "Purchase" ? running + e.amount : running - e.amount;
    return { ...e, runningBalance: running };
  });

  return Response.json(ledger);
}
