"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Eye, Pencil } from "lucide-react";
import {
  vendors as initialVendors,
  formatCurrency,
  type Vendor,
  getVendorLedger,
} from "@/data/mockData";

export default function Vendors() {
  const [vendorList, setVendorList] = useState<Vendor[]>(initialVendors);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    panNumber: "",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/vendors", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Vendor[];
        if (!cancelled && Array.isArray(data)) setVendorList(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAdd = async () => {
    if (!form.name) return;
    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const created = (await res.json()) as Vendor;
        setVendorList((prev) => [created, ...prev]);
        setForm({ name: "", phone: "", address: "", panNumber: "" });
        setModalOpen(false);
        return;
      }
    } catch {}

    const fallback: Vendor = {
      id: Date.now(),
      name: form.name,
      phone: form.phone,
      address: form.address,
      panNumber: form.panNumber,
      totalPurchase: 0,
      totalPaid: 0,
      balance: 0,
    };
    setVendorList((prev) => [fallback, ...prev]);
    setForm({ name: "", phone: "", address: "", panNumber: "" });
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Vendors
        </h1>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Add Vendor
        </button>
      </div>

      <div className="card-pharmacy overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {[
                  "Vendor Name",
                  "Phone",
                  "Address",
                  "Total Purchase",
                  "Total Paid",
                  "Balance",
                  "Actions",
                ].map((h) => (
                  <th key={h} className="table-header-cell text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="table-body-cell text-center text-muted-foreground py-10"
                  >
                    Loading vendors...
                  </td>
                </tr>
              ) : (
                vendorList.map((v) => (
                  <tr key={v.id} className="table-row-hover">
                    <td className="table-body-cell font-medium">{v.name}</td>
                    <td className="table-body-cell">{v.phone}</td>
                    <td className="table-body-cell">{v.address}</td>
                    <td className="table-body-cell tabular-nums">
                      {formatCurrency(v.totalPurchase)}
                    </td>
                    <td className="table-body-cell tabular-nums text-success">
                      {formatCurrency(v.totalPaid)}
                    </td>
                    <td
                      className="table-body-cell tabular-nums font-medium"
                      style={v.balance > 0 ? { color: "hsl(0, 84%, 60%)" } : {}}
                    >
                      {formatCurrency(v.balance)}
                    </td>
                    <td className="table-body-cell">
                      <div className="flex gap-1">
                        <button
                          className="btn-outline p-1.5"
                          onClick={() => {
                            setSelectedVendor(v);
                            setViewOpen(true);
                          }}
                        >
                          <Eye size={14} />
                        </button>
                        <button className="btn-outline p-1.5">
                          <Pencil size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="card-pharmacy w-full max-w-md mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-foreground">
                  Add Vendor
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                {[
                  {
                    key: "name",
                    label: "Vendor Name",
                    placeholder: "Enter vendor name",
                  },
                  { key: "phone", label: "Phone", placeholder: "9841234567" },
                  { key: "address", label: "Address", placeholder: "City" },
                  {
                    key: "panNumber",
                    label: "PAN Number",
                    placeholder: "301234567",
                  },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      {f.label}
                    </label>
                    <input
                      className="input-field"
                      placeholder={f.placeholder}
                      value={form[f.key as keyof typeof form]}
                      onChange={(e) =>
                        setForm({ ...form, [f.key]: e.target.value })
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  className="btn-outline"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleAdd}>
                  Add Vendor
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ViewVendorModal
        open={viewOpen}
        vendor={selectedVendor}
        onClose={() => {
          setViewOpen(false);
          setSelectedVendor(null);
        }}
      />
    </div>
  );
}

function ViewVendorModal({
  open,
  vendor,
  onClose,
}: {
  open: boolean;
  vendor: Vendor | null;
  onClose: () => void;
}) {
  const [ledger, setLedger] = useState<
    Array<{
      date: string;
      type: "Purchase" | "Payment";
      reference: string;
      amount: number;
      runningBalance: number;
    }>
  >([]);

  useEffect(() => {
    if (!open || !vendor) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/vendors/${vendor.id}/ledger`, {
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

      if (!cancelled) setLedger(getVendorLedger(vendor.id));
    })();

    return () => {
      cancelled = true;
    };
  }, [open, vendor]);

  return (
    <AnimatePresence>
      {open && vendor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="card-pharmacy w-full max-w-3xl mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {vendor.name}
                </h2>
                <p className="text-sm text-muted-foreground">Vendor Details</p>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card-pharmacy p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Phone
                </p>
                <p className="text-sm font-medium text-foreground mt-1">
                  {vendor.phone || "-"}
                </p>
              </div>
              <div className="card-pharmacy p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  PAN Number
                </p>
                <p className="text-sm font-medium text-foreground mt-1">
                  {vendor.panNumber || "-"}
                </p>
              </div>
              <div className="card-pharmacy p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Address
                </p>
                <p className="text-sm font-medium text-foreground mt-1">
                  {vendor.address || "-"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="card-pharmacy p-4">
                <p className="text-sm text-muted-foreground">Total Purchases</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatCurrency(vendor.totalPurchase)}
                </p>
              </div>
              <div className="card-pharmacy p-4">
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-lg font-semibold tabular-nums text-success">
                  {formatCurrency(vendor.totalPaid)}
                </p>
              </div>
              <div className="card-pharmacy p-4">
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p
                  className="text-lg font-semibold tabular-nums"
                  style={
                    vendor.balance > 0 ? { color: "hsl(0, 84%, 60%)" } : {}
                  }
                >
                  {formatCurrency(vendor.balance)}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Ledger
              </h3>
              <div className="card-pharmacy overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        {[
                          "Date",
                          "Type",
                          "Reference",
                          "Amount",
                          "Running Balance",
                        ].map((h) => (
                          <th key={h} className="table-header-cell text-left">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="table-body-cell text-center text-muted-foreground py-8"
                          >
                            No ledger records
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
                            <td className="table-body-cell">
                              {entry.reference}
                            </td>
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

            <div className="flex justify-end mt-6">
              <button className="btn-outline" onClick={onClose}>
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
