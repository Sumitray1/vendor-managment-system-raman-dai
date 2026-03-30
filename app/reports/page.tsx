"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { vendors, monthlyData, formatCurrency } from "@/data/mockData";

const COLORS = ["hsl(221, 83%, 53%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(262, 83%, 58%)"];
const vendorDebt = vendors.filter((v) => v.balance > 0).map((v) => ({ name: v.name.split(" ")[0], value: v.balance }));

export default function Reports() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reports</h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card-pharmacy p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Monthly Purchases vs Payments</h2>
          <div className="h-72">
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
          </div>
        </div>

        <div className="card-pharmacy p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Vendor Outstanding Balance Distribution</h2>
          <div className="h-72">
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
          </div>
        </div>
      </div>

      <div className="card-pharmacy overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Vendor Balance Summary</h2>
        </div>
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
              {vendors.map((v) => (
                <tr key={v.id} className="table-row-hover">
                  <td className="table-body-cell font-medium">{v.name}</td>
                  <td className="table-body-cell tabular-nums">{formatCurrency(v.totalPurchase)}</td>
                  <td className="table-body-cell tabular-nums text-success">{formatCurrency(v.totalPaid)}</td>
                  <td className="table-body-cell tabular-nums font-semibold" style={v.balance > 0 ? { color: "hsl(0, 84%, 60%)" } : {}}>
                    {formatCurrency(v.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
