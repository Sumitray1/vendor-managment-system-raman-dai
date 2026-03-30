"use client";
import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import SkeletonTable from "@/components/ui/skeleton-table";
import { useToast } from "@/components/ui/use-toast";

const COLORS = ["hsl(221, 83%, 53%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(262, 83%, 58%)"];

type Vendor = {
  id: number;
  name: string;
  totalPurchase: number;
  totalPaid: number;
  balance: number;
};

type Purchase = {
  id: number;
  vendorId: number;
  vendorName: string;
  date: string;
  amount: number;
};

type Payment = {
  id: number;
  vendorId: number;
  vendorName: string;
  date: string;
  amount: number;
};

function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

function monthKeyFromDate(date: Date) {
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
}

function toUtcDate(dateString: string) {
  const d = new Date(`${dateString}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function Reports() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [vendorsRes, purchasesRes, paymentsRes] = await Promise.all([
          fetch("/api/vendors", { cache: "no-store" }),
          fetch("/api/purchases", { cache: "no-store" }),
          fetch("/api/payments", { cache: "no-store" }),
        ]);

        if (!vendorsRes.ok || !purchasesRes.ok || !paymentsRes.ok) {
          toast({
            title: "Failed to load reports",
            description: "Some data could not be loaded from the server.",
            variant: "destructive",
          });
        }

        if (vendorsRes.ok) {
          const data = (await vendorsRes.json()) as Vendor[];
          if (!cancelled && Array.isArray(data)) setVendors(data);
        }

        if (purchasesRes.ok) {
          const data = (await purchasesRes.json()) as Purchase[];
          if (!cancelled && Array.isArray(data)) setPurchases(data);
        }

        if (paymentsRes.ok) {
          const data = (await paymentsRes.json()) as Payment[];
          if (!cancelled && Array.isArray(data)) setPayments(data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  const vendorDebt = useMemo(
    () =>
      vendors
        .filter((v) => v.balance > 0)
        .map((v) => ({ name: v.name.split(" ")[0], value: v.balance })),
    [vendors],
  );

  const monthlyData = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("en", { month: "short" });
    const now = new Date();
    const monthStarts = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1));
      return d;
    });

    const base = monthStarts.map((d) => ({
      month: formatter.format(d),
      key: monthKeyFromDate(d),
      purchases: 0,
      payments: 0,
    }));

    const indexByKey = new Map<string, number>();
    base.forEach((m, idx) => indexByKey.set(m.key, idx));

    purchases.forEach((p) => {
      const d = toUtcDate(p.date);
      if (!d) return;
      const idx = indexByKey.get(monthKeyFromDate(d));
      if (idx === undefined) return;
      base[idx].purchases += Number(p.amount) || 0;
    });

    payments.forEach((p) => {
      const d = toUtcDate(p.date);
      if (!d) return;
      const idx = indexByKey.get(monthKeyFromDate(d));
      if (idx === undefined) return;
      base[idx].payments += Number(p.amount) || 0;
    });

    return base.map((m) => ({
      month: m.month,
      purchases: m.purchases,
      payments: m.payments,
    }));
  }, [payments, purchases]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reports</h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card-pharmacy p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Monthly Purchases vs Payments</h2>
          <div className="h-72">
            {loading ? (
              <div className="h-full flex flex-col justify-center gap-3">
                <div className="h-4 w-48 skeleton-line" />
                <div className="h-4 w-64 skeleton-line" />
                <div className="h-40 w-full skeleton-line" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 12, fill: "hsl(215, 16%, 47%)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="purchases" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} name="Purchases" />
                  <Bar dataKey="payments" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} name="Payments" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card-pharmacy p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Vendor Outstanding Balance Distribution</h2>
          <div className="h-72">
            {loading ? (
              <div className="h-full flex flex-col justify-center gap-3">
                <div className="h-4 w-56 skeleton-line" />
                <div className="h-44 w-44 rounded-full skeleton-line mx-auto" />
              </div>
            ) : vendorDebt.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No outstanding balances
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vendorDebt}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {vendorDebt.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="card-pharmacy overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Vendor Balance Summary</h2>
        </div>
        {loading ? (
          <SkeletonTable columns={4} rows={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {["Vendor", "Total Purchase", "Total Paid", "Outstanding"].map((h) => (
                    <th key={h} className="table-header-cell text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendors.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="table-body-cell text-center text-muted-foreground py-10">
                      No vendors yet
                    </td>
                  </tr>
                ) : (
                  vendors.map((v) => (
                    <tr key={v.id} className="table-row-hover">
                      <td className="table-body-cell font-medium">{v.name}</td>
                      <td className="table-body-cell tabular-nums">{formatCurrency(v.totalPurchase)}</td>
                      <td className="table-body-cell tabular-nums text-success">{formatCurrency(v.totalPaid)}</td>
                      <td
                        className="table-body-cell tabular-nums font-semibold"
                        style={v.balance > 0 ? { color: "hsl(0, 84%, 60%)" } : {}}
                      >
                        {formatCurrency(v.balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style jsx>{`
        .skeleton-line {
          position: relative;
          overflow: hidden;
          border-radius: 0.25rem;
          background-color: hsl(214, 32%, 91%);
        }
        .skeleton-line::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.6) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: skeleton-shimmer 1.2s infinite;
        }
        @keyframes skeleton-shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
