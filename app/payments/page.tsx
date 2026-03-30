"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import {
  payments as initialPayments,
  vendors as initialVendors,
  formatCurrency,
  type Payment,
  type Vendor,
} from "@/data/mockData";
import SkeletonTable from "@/components/ui/skeleton-table";
import { useToast } from "@/components/ui/use-toast";

const methods: Payment["method"][] = [
  "Cash",
  "Bank Transfer",
  "eSewa",
  "Khalti",
];

export default function Payments() {
  const { toast } = useToast();
  const [list, setList] = useState<Payment[]>(initialPayments);
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    vendorId: "",
    date: "",
    amount: "",
    method: "Cash" as Payment["method"],
    notes: "",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [vendorsRes, paymentsRes] = await Promise.all([
          fetch("/api/vendors", { cache: "no-store" }),
          fetch("/api/payments", { cache: "no-store" }),
        ]);

        if (!vendorsRes.ok || !paymentsRes.ok) {
          toast({
            title: "Failed to load payments",
            description: "Some data could not be loaded from the server.",
            variant: "destructive",
          });
        }

        if (vendorsRes.ok) {
          const vendorsData = (await vendorsRes.json()) as Vendor[];
          if (!cancelled && Array.isArray(vendorsData)) setVendors(vendorsData);
        }

        if (paymentsRes.ok) {
          const paymentsData = (await paymentsRes.json()) as Payment[];
          if (!cancelled && Array.isArray(paymentsData)) setList(paymentsData);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  const handleAdd = async () => {
    if (!form.vendorId || !form.amount || !form.date) {
      toast({
        title: "Missing fields",
        description: "Please select vendor, date and enter amount.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    toast({
      title: "Saving payment...",
      description: "Please wait.",
      variant: "info",
    });
    const vendor = vendors.find((v) => v.id === Number(form.vendorId));

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: Number(form.vendorId),
          date: form.date,
          amount: Number(form.amount),
          method: form.method,
          notes: form.notes,
        }),
      });

      if (res.ok) {
        const created = (await res.json()) as Payment;
        setList((prev) => [created, ...prev]);
        setForm({
          vendorId: "",
          date: "",
          amount: "",
          method: "Cash",
          notes: "",
        });
        setModalOpen(false);
        toast({
          title: "Payment saved",
          description: `${created.vendorName} • ${formatCurrency(created.amount)}`,
          variant: "success",
        });
        return;
      }
      toast({
        title: "Failed to save payment",
        description: "Server rejected the request.",
        variant: "destructive",
      });
    } catch {
      toast({
        title: "Failed to save payment",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }

    const fallback: Payment = {
      id: Date.now(),
      vendorId: Number(form.vendorId),
      vendorName: vendor?.name || "",
      date: form.date,
      amount: Number(form.amount),
      method: form.method,
      notes: form.notes,
    };
    setList((prev) => [fallback, ...prev]);
    setForm({ vendorId: "", date: "", amount: "", method: "Cash", notes: "" });
    setModalOpen(false);
    toast({
      title: "Saved locally only",
      description: "Payment was added locally because server save failed.",
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Payments
        </h1>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Add Payment
        </button>
      </div>
      <div className="card-pharmacy overflow-hidden">
        {loading ? (
          <SkeletonTable columns={5} rows={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {["Date", "Vendor", "Amount", "Method", "Notes"].map((h) => (
                    <th key={h} className="table-header-cell text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} className="table-row-hover">
                    <td className="table-body-cell whitespace-nowrap">
                      {p.date}
                    </td>
                    <td className="table-body-cell">{p.vendorName}</td>
                    <td className="table-body-cell tabular-nums font-medium text-success">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="table-body-cell">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-accent text-accent-foreground">
                        {p.method}
                      </span>
                    </td>
                    <td className="table-body-cell text-muted-foreground">
                      {p.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                  Record Payment
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Vendor
                  </label>
                  <select
                    className="input-field"
                    value={form.vendorId}
                    onChange={(e) =>
                      setForm({ ...form, vendorId: e.target.value })
                    }
                  >
                    <option value="">Select vendor</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Date
                    </label>
                    <input
                      type="date"
                      className="input-field"
                      value={form.date}
                      onChange={(e) =>
                        setForm({ ...form, date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Amount
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={form.amount}
                      onChange={(e) =>
                        setForm({ ...form, amount: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Payment Method
                  </label>
                  <select
                    className="input-field"
                    value={form.method}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        method: e.target.value as Payment["method"],
                      })
                    }
                  >
                    {methods.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Notes
                  </label>
                  <input
                    className="input-field"
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  className="btn-outline"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleAdd}
                  disabled={submitting}
                  style={
                    submitting ? { opacity: 0.8, cursor: "not-allowed" } : {}
                  }
                >
                  {submitting ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    "Record Payment"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
