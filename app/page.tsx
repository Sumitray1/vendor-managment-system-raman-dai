"use client";
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
import {
  vendors,
  purchases,
  payments,
  monthlyData,
  formatCurrency,
} from "@/data/mockData";

const stats = [
  {
    label: "Total Vendors",
    value: vendors.length.toString(),
    icon: Users,
    color: "hsl(221, 83%, 53%)",
  },
  {
    label: "Total Purchases",
    value: formatCurrency(vendors.reduce((s, v) => s + v.totalPurchase, 0)),
    icon: ShoppingCart,
    color: "hsl(221, 83%, 53%)",
  },
  {
    label: "Total Payments",
    value: formatCurrency(vendors.reduce((s, v) => s + v.totalPaid, 0)),
    icon: CreditCard,
    color: "hsl(142, 71%, 45%)",
  },
  {
    label: "Outstanding Balance",
    value: formatCurrency(vendors.reduce((s, v) => s + v.balance, 0)),
    icon: AlertTriangle,
    color: "hsl(0, 84%, 60%)",
    urgent: true,
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
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
                {purchases.slice(0, 5).map((p) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-pharmacy overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">
              Recent Payments
            </h2>
          </div>
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
                {payments.slice(0, 5).map((p) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
