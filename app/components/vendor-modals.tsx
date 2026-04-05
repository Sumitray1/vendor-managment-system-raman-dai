"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";

import { formatCurrency, type Vendor } from "@/data/mockData";
import { getVendorLedger } from "@/services/vendor";

type VendorForm = {
  name: string;
  phone: string;
  address: string;
  panNumber: string;
};

export function AddVendorModal({
  open,
  submitting,
  form,
  onChange,
  onClose,
  onSave,
}: {
  open: boolean;
  submitting: boolean;
  form: VendorForm;
  onChange: (next: VendorForm) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={onClose}
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
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
                disabled={submitting}
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
                    disabled={submitting}
                    value={form[f.key as keyof VendorForm]}
                    onChange={(e) =>
                      onChange({ ...form, [f.key]: e.target.value })
                    }
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="btn-outline"
                disabled={submitting}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={onSave}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Plus size={16} /> Add Vendor
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ViewVendorModal({
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
        const data = await getVendorLedger(vendor.id, { cache: "no-store" });
        if (!cancelled && Array.isArray(data)) setLedger(data);
      } catch {
        if (!cancelled) setLedger([]);
      }
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

export function EditVendorModal({
  open,
  submitting,
  form,
  onChange,
  onClose,
  onSave,
}: {
  open: boolean;
  submitting: boolean;
  form: VendorForm;
  onChange: (next: VendorForm) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
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
          <h2 className="text-lg font-semibold text-foreground">Edit Vendor</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            disabled={submitting}
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
            { key: "panNumber", label: "PAN Number", placeholder: "301234567" },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {f.label}
              </label>
              <input
                className="input-field"
                placeholder={f.placeholder}
                disabled={submitting}
                value={form[f.key as keyof VendorForm]}
                onChange={(e) => onChange({ ...form, [f.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            className="btn-outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={onSave}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
