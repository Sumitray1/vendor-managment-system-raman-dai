"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, ShoppingCart, CreditCard, AlertTriangle } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import SkeletonTable from "@/components/ui/skeleton-table";
import { useToast } from "@/components/ui/use-toast";

type Vendor = {
  id: number;
  name: string;
  phone: string;
  address: string;
  panNumber: string;
  totalPurchase: number;
  totalPaid: number;
  balance: number;
};

type Purchase = {
  id: number;
  vendorId: number;
  vendorName: string;
  date: string;
  billNo: string;
  amount: number;
};

type Payment = {
  id: number;
  vendorId: number;
  vendorName: string;
  date: string;
  amount: number;
  method: string;
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

export default function Dashboard() {
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

        if (!vendorsRes.ok || !purchasesRes.ok || !paymentsRes.ok) {
          toast({
            title: "Dashboard data not available",
            description: "Check your database connection and try again.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  const stats = useMemo(() => {
    const vendorCount = vendors.length;
    const totalPurchases =
      vendors.length > 0
        ? vendors.reduce((s, v) => s + (Number(v.totalPurchase) || 0), 0)
        : purchases.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const totalPayments =
      vendors.length > 0
        ? vendors.reduce((s, v) => s + (Number(v.totalPaid) || 0), 0)
        : payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const outstanding =
      vendors.length > 0
        ? vendors.reduce((s, v) => s + (Number(v.balance) || 0), 0)
        : totalPurchases - totalPayments;

    return [
      {
        label: "Total Vendors",
        value: vendorCount.toString(),
        icon: Users,
        color: "hsl(221, 83%, 53%)",
      },
      {
        label: "Total Purchases",
        value: formatCurrency(totalPurchases),
        icon: ShoppingCart,
        color: "hsl(221, 83%, 53%)",
      },
      {
        label: "Total Payments",
        value: formatCurrency(totalPayments),
        icon: CreditCard,
        color: "hsl(142, 71%, 45%)",
      },
      {
        label: "Outstanding Balance",
        value: formatCurrency(outstanding),
        icon: AlertTriangle,
        color: "hsl(0, 84%, 60%)",
        urgent: true,
      },
    ];
  }, [payments, purchases, vendors]);

  const monthlyData = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("en", { month: "short" });
    const now = new Date();
    const monthStarts = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1),
      );
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

  const recentPurchases = useMemo(() => purchases.slice(0, 5), [purchases]);
  const recentPayments = useMemo(() => payments.slice(0, 5), [payments]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card-pharmacy p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-4 w-28 skeleton-line" />
                  <div className="h-5 w-5 rounded skeleton-line" />
                </div>
                <div className="h-8 w-36 skeleton-line" />
              </div>
            ))
          : stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="card-pharmacy p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </span>
                  <stat.icon size={18} style={{ color: stat.color }} />
                </div>
                <p
                  className="stat-card-value"
                  style={stat.urgent ? { color: "hsl(0, 84%, 60%)" } : {}}
                >
                  {stat.value}
                </p>
              </motion.div>
            ))}
      </div>

      <div className="card-pharmacy p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Monthly Purchase Trend
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="purchaseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(221, 83%, 53%)"
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(221, 83%, 53%)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(214, 32%, 91%)"
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "hsl(215, 16%, 47%)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "hsl(215, 16%, 47%)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Area
                type="monotone"
                dataKey="purchases"
                stroke="hsl(221, 83%, 53%)"
                fill="url(#purchaseGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card-pharmacy overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">
              Recent Purchases
            </h2>
          </div>
          {loading ? (
            <SkeletonTable columns={4} rows={5} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {["Date", "Vendor", "Bill #", "Amount"].map((h) => (
                      <th key={h} className="table-header-cell text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentPurchases.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="table-body-cell text-center text-muted-foreground py-10"
                      >
                        No purchases yet
                      </td>
                    </tr>
                  ) : (
                    recentPurchases.map((p) => (
                      <tr key={p.id} className="table-row-hover">
                        <td className="table-body-cell whitespace-nowrap">
                          {p.date}
                        </td>
                        <td className="table-body-cell">{p.vendorName}</td>
                        <td className="table-body-cell">{p.billNo}</td>
                        <td className="table-body-cell tabular-nums font-medium">
                          {formatCurrency(p.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card-pharmacy overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">
              Recent Payments
            </h2>
          </div>
          {loading ? (
            <SkeletonTable columns={4} rows={5} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {["Date", "Vendor", "Method", "Amount"].map((h) => (
                      <th key={h} className="table-header-cell text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="table-body-cell text-center text-muted-foreground py-10"
                      >
                        No payments yet
                      </td>
                    </tr>
                  ) : (
                    recentPayments.map((p) => (
                      <tr key={p.id} className="table-row-hover">
                        <td className="table-body-cell whitespace-nowrap">
                          {p.date}
                        </td>
                        <td className="table-body-cell">{p.vendorName}</td>
                        <td className="table-body-cell">{p.method}</td>
                        <td className="table-body-cell tabular-nums font-medium text-success">
                          {formatCurrency(p.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
