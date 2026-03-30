export interface Vendor {
  id: number;
  name: string;
  phone: string;
  address: string;
  panNumber: string;
  totalPurchase: number;
  totalPaid: number;
  balance: number;
}

export interface Purchase {
  id: number;
  vendorId: number;
  vendorName: string;
  date: string;
  billNo: string;
  amount: number;
  type: "Cash" | "Credit";
  notes: string;
}

export interface Payment {
  id: number;
  vendorId: number;
  vendorName: string;
  date: string;
  amount: number;
  method: "Cash" | "Bank Transfer" | "eSewa" | "Khalti";
  notes: string;
}

export interface LedgerEntry {
  date: string;
  type: "Purchase" | "Payment";
  reference: string;
  amount: number;
  runningBalance: number;
}

export const vendors: Vendor[] = [
  { id: 1, name: "ABC Pharma Distributors", phone: "9841234567", address: "Kathmandu", panNumber: "301234567", totalPurchase: 125000, totalPaid: 80000, balance: 45000 },
  { id: 2, name: "Himalayan Medico", phone: "9841987654", address: "Lalitpur", panNumber: "301987654", totalPurchase: 95000, totalPaid: 95000, balance: 0 },
  { id: 3, name: "Everest Drug House", phone: "9851123456", address: "Bhaktapur", panNumber: "302345678", totalPurchase: 78000, totalPaid: 50000, balance: 28000 },
  { id: 4, name: "Nepal Health Suppliers", phone: "9861234567", address: "Pokhara", panNumber: "303456789", totalPurchase: 62000, totalPaid: 40000, balance: 22000 },
  { id: 5, name: "Kathmandu Medical Traders", phone: "9871345678", address: "Kathmandu", panNumber: "304567890", totalPurchase: 110000, totalPaid: 85000, balance: 25000 },
];

export const purchases: Purchase[] = [
  { id: 101, vendorId: 1, vendorName: "ABC Pharma Distributors", date: "2026-03-01", billNo: "1021", amount: 25000, type: "Credit", notes: "Monthly stock reorder" },
  { id: 102, vendorId: 2, vendorName: "Himalayan Medico", date: "2026-03-02", billNo: "HM-445", amount: 18000, type: "Credit", notes: "Antibiotics batch" },
  { id: 103, vendorId: 3, vendorName: "Everest Drug House", date: "2026-03-03", billNo: "ED-220", amount: 12000, type: "Cash", notes: "OTC medicines" },
  { id: 104, vendorId: 1, vendorName: "ABC Pharma Distributors", date: "2026-03-05", billNo: "1025", amount: 30000, type: "Credit", notes: "Surgical supplies" },
  { id: 105, vendorId: 4, vendorName: "Nepal Health Suppliers", date: "2026-03-07", billNo: "NHS-112", amount: 15000, type: "Credit", notes: "Vitamins and supplements" },
  { id: 106, vendorId: 5, vendorName: "Kathmandu Medical Traders", date: "2026-03-08", billNo: "KMT-88", amount: 22000, type: "Cash", notes: "First aid supplies" },
  { id: 107, vendorId: 3, vendorName: "Everest Drug House", date: "2026-03-10", billNo: "ED-225", amount: 8000, type: "Credit", notes: "Syringes and needles" },
  { id: 108, vendorId: 2, vendorName: "Himalayan Medico", date: "2026-03-12", billNo: "HM-450", amount: 20000, type: "Credit", notes: "Cardiovascular drugs" },
  { id: 109, vendorId: 5, vendorName: "Kathmandu Medical Traders", date: "2026-03-13", billNo: "KMT-92", amount: 18000, type: "Credit", notes: "Diagnostic kits" },
  { id: 110, vendorId: 4, vendorName: "Nepal Health Suppliers", date: "2026-03-14", billNo: "NHS-118", amount: 9500, type: "Cash", notes: "Baby care products" },
];

export const payments: Payment[] = [
  { id: 501, vendorId: 1, vendorName: "ABC Pharma Distributors", date: "2026-03-05", amount: 10000, method: "Bank Transfer", notes: "Partial payment" },
  { id: 502, vendorId: 2, vendorName: "Himalayan Medico", date: "2026-03-06", amount: 18000, method: "Cash", notes: "Full bill clearance" },
  { id: 503, vendorId: 3, vendorName: "Everest Drug House", date: "2026-03-08", amount: 8000, method: "eSewa", notes: "Payment for OTC batch" },
  { id: 504, vendorId: 1, vendorName: "ABC Pharma Distributors", date: "2026-03-10", amount: 15000, method: "Bank Transfer", notes: "Against bill 1025" },
  { id: 505, vendorId: 4, vendorName: "Nepal Health Suppliers", date: "2026-03-11", amount: 10000, method: "Khalti", notes: "Partial clearance" },
  { id: 506, vendorId: 5, vendorName: "Kathmandu Medical Traders", date: "2026-03-12", amount: 20000, method: "Bank Transfer", notes: "Monthly settlement" },
  { id: 507, vendorId: 2, vendorName: "Himalayan Medico", date: "2026-03-14", amount: 20000, method: "Cash", notes: "Cardiovascular drugs payment" },
  { id: 508, vendorId: 3, vendorName: "Everest Drug House", date: "2026-03-15", amount: 5000, method: "eSewa", notes: "Partial for syringes" },
];

export const monthlyData = [
  { month: "Oct", purchases: 52000, payments: 48000 },
  { month: "Nov", purchases: 68000, payments: 55000 },
  { month: "Dec", purchases: 75000, payments: 70000 },
  { month: "Jan", purchases: 60000, payments: 58000 },
  { month: "Feb", purchases: 82000, payments: 72000 },
  { month: "Mar", purchases: 177500, payments: 106000 },
];

export function getVendorLedger(vendorId: number): LedgerEntry[] {
  const vendorPurchases = purchases.filter(p => p.vendorId === vendorId);
  const vendorPayments = payments.filter(p => p.vendorId === vendorId);

  const entries: LedgerEntry[] = [
    ...vendorPurchases.map(p => ({ date: p.date, type: "Purchase" as const, reference: `Bill #${p.billNo}`, amount: p.amount, runningBalance: 0 })),
    ...vendorPayments.map(p => ({ date: p.date, type: "Payment" as const, reference: p.notes, amount: p.amount, runningBalance: 0 })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  let balance = 0;
  for (const entry of entries) {
    balance += entry.type === "Purchase" ? entry.amount : -entry.amount;
    entry.runningBalance = balance;
  }
  return entries;
}

export function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}
