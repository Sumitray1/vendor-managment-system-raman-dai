"use client";
import { useEffect, useState } from "react";
import {
  vendors as initialVendors,
  getVendorLedger,
  formatCurrency,
  type Vendor,
} from "@/data/mockData";

export default function VendorLedger() {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [selectedVendorId, setSelectedVendorId] = useState(
    initialVendors[0]?.id ?? 0,
  );
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [ledger, setLedger] = useState<
    Array<{
      date: string;
      type: "Purchase" | "Payment";
      reference: string;
      amount: number;
      runningBalance: number;
    }>
  >([]);

  const vendor = vendors.find((v) => v.id === selectedVendorId);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/vendors", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as Vendor[];
          if (!cancelled && Array.isArray(data) && data.length > 0) {
            setVendors(data);
            setSelectedVendorId((current) =>
              data.some((v) => v.id === current) ? current : data[0].id,
            );
          }
        }
      } finally {
        if (!cancelled) setVendorsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedVendorId) {
      setLedger([]);
      setLedgerLoading(false);
      return;
    }

    let cancelled = false;
    setLedgerLoading(true);

    (async () => {
      try {
        const res = await fetch(`/api/vendors/${selectedVendorId}/ledger`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && Array.isArray(data)) {
            setLedger(data);
            return;
          }
        }
      } catch {}

      if (!cancelled) setLedger(getVendorLedger(selectedVendorId));
    })().finally(() => {
      if (!cancelled) setLedgerLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedVendorId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Vendor Ledger
        </h1>
        <select
          className="input-field w-auto min-w-[240px]"
          value={selectedVendorId}
          onChange={(e) => setSelectedVendorId(Number(e.target.value))}
          disabled={vendorsLoading || vendors.length === 0}
        >
          {vendors.length === 0 ? (
            <option value="" disabled>
              No vendors
            </option>
          ) : (
            vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))
          )}
        </select>
      </div>

      {vendor && (
        <div className="card-pharmacy p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Purchases</p>
            <p className="text-lg font-semibold tabular-nums">
              {formatCurrency(vendor.totalPurchase)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Paid</p>
            <p className="text-lg font-semibold tabular-nums text-success">
              {formatCurrency(vendor.totalPaid)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Outstanding Balance</p>
            <p
              className="text-lg font-semibold tabular-nums"
              style={vendor.balance > 0 ? { color: "hsl(0, 84%, 60%)" } : {}}
            >
              {formatCurrency(vendor.balance)}
            </p>
          </div>
        </div>
      )}

      <div className="card-pharmacy overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {["Date", "Type", "Reference", "Amount", "Running Balance"].map(
                  (h) => (
                    <th key={h} className="table-header-cell text-left">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {ledgerLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="table-body-cell text-center text-muted-foreground py-8"
                  >
                    Loading ledger...
                  </td>
                </tr>
              ) : ledger.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="table-body-cell text-center text-muted-foreground py-8"
                  >
                    No records found
                  </td>
                </tr>
              ) : (
                ledger.map((entry, i) => (
                  <tr key={i} className="table-row-hover">
                    <td className="table-body-cell whitespace-nowrap">
                      {entry.date}
                    </td>
                    <td className="table-body-cell">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          entry.type === "Purchase"
                            ? "bg-primary/10 text-primary"
                            : "bg-success/10 text-success"
                        }`}
                      >
                        {entry.type}
                      </span>
                    </td>
                    <td className="table-body-cell">{entry.reference}</td>
                    <td
                      className="table-body-cell tabular-nums font-medium"
                      style={{
                        color:
                          entry.type === "Payment"
                            ? "hsl(142, 71%, 45%)"
                            : undefined,
                      }}
                    >
                      {entry.type === "Payment" ? "-" : "+"}
                      {formatCurrency(entry.amount)}
                    </td>
                    <td
                      className="table-body-cell tabular-nums font-semibold"
                      style={
                        entry.runningBalance > 0
                          ? { color: "hsl(0, 84%, 60%)" }
                          : {}
                      }
                    >
                      {formatCurrency(entry.runningBalance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
