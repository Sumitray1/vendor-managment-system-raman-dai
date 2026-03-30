"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Eye, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  purchases as initialPurchases,
  vendors as initialVendors,
  formatCurrency,
  type Purchase,
  type Vendor,
} from "@/data/mockData";
import SkeletonTable from "@/components/ui/skeleton-table";
import { useToast } from "@/components/ui/use-toast";
import { SearchableSelect } from "@/components/ui/select";
import { downloadXlsx } from "@/lib/utils";

export default function Purchases() {
  const { toast } = useToast();
  const [list, setList] = useState<Purchase[]>(initialPurchases);
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null,
  );
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [deletingPurchase, setDeletingPurchase] = useState<Purchase | null>(
    null,
  );
  const [form, setForm] = useState({
    vendorId: "",
    date: "",
    billNo: "",
    amount: "",
    type: "Credit" as "Cash" | "Credit",
    notes: "",
  });
  const [editForm, setEditForm] = useState({
    vendorId: "",
    date: "",
    billNo: "",
    amount: "",
    type: "Credit" as "Cash" | "Credit",
    notes: "",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [vendorsRes, purchasesRes] = await Promise.all([
          fetch("/api/vendors", { cache: "no-store" }),
          fetch("/api/purchases", { cache: "no-store" }),
        ]);

        if (!vendorsRes.ok || !purchasesRes.ok) {
          toast({
            title: "Failed to load purchases",
            description: "Some data could not be loaded from the server.",
            variant: "destructive",
          });
        }

        if (vendorsRes.ok) {
          const vendorsData = (await vendorsRes.json()) as Vendor[];
          if (!cancelled && Array.isArray(vendorsData)) setVendors(vendorsData);
        }

        if (purchasesRes.ok) {
          const purchasesData = (await purchasesRes.json()) as Purchase[];
          if (!cancelled && Array.isArray(purchasesData))
            setList(purchasesData);
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
      title: "Saving purchase...",
      description: "Please wait.",
      variant: "info",
    });
    const vendor = vendors.find((v) => v.id === Number(form.vendorId));

    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: Number(form.vendorId),
          date: form.date,
          billNo: form.billNo,
          amount: Number(form.amount),
          type: form.type,
          notes: form.notes,
        }),
      });

      if (res.ok) {
        const created = (await res.json()) as Purchase;
        setList((prev) => [created, ...prev]);
        setForm({
          vendorId: "",
          date: "",
          billNo: "",
          amount: "",
          type: "Credit",
          notes: "",
        });
        setModalOpen(false);
        toast({
          title: "Purchase saved",
          description: `${created.vendorName} • ${formatCurrency(created.amount)}`,
          variant: "success",
        });
        return;
      }
      toast({
        title: "Failed to save purchase",
        description: "Server rejected the request.",
        variant: "destructive",
      });
    } catch {
      toast({
        title: "Failed to save purchase",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }

    const fallback: Purchase = {
      id: Date.now(),
      vendorId: Number(form.vendorId),
      vendorName: vendor?.name || "",
      date: form.date,
      billNo: form.billNo,
      amount: Number(form.amount),
      type: form.type,
      notes: form.notes,
    };
    setList((prev) => [fallback, ...prev]);
    setForm({
      vendorId: "",
      date: "",
      billNo: "",
      amount: "",
      type: "Credit",
      notes: "",
    });
    setModalOpen(false);
    toast({
      title: "Saved locally only",
      description: "Purchase was added locally because server save failed.",
      variant: "destructive",
    });
  };

  const handleViewOpen = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setViewOpen(true);
  };

  const handleEditOpen = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setEditForm({
      vendorId: String(purchase.vendorId),
      date: purchase.date ?? "",
      billNo: purchase.billNo ?? "",
      amount: String(purchase.amount ?? ""),
      type: purchase.type,
      notes: purchase.notes ?? "",
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingPurchase) return;
    if (!editForm.vendorId || !editForm.amount || !editForm.date) {
      toast({
        title: "Missing fields",
        description: "Please select vendor, date and enter amount.",
        variant: "destructive",
      });
      return;
    }

    setEditSubmitting(true);
    toast({
      title: "Updating purchase...",
      description: "Please wait.",
      variant: "info",
    });
    try {
      const res = await fetch(`/api/purchases/${editingPurchase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: Number(editForm.vendorId),
          date: editForm.date,
          billNo: editForm.billNo,
          amount: Number(editForm.amount),
          type: editForm.type,
          notes: editForm.notes,
        }),
      }).catch(() => null);

      if (res && res.ok) {
        const updated = (await res.json()) as Purchase;
        setList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setEditOpen(false);
        setEditingPurchase(null);
        toast({
          title: "Purchase updated",
          description: `${updated.vendorName} • ${formatCurrency(updated.amount)}`,
          variant: "success",
        });
      } else {
        toast({
          title: "Failed to update purchase",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteOpen = (purchase: Purchase) => {
    setDeletingPurchase(purchase);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingPurchase) return;
    setDeleteSubmitting(true);
    toast({
      title: "Deleting purchase...",
      description: "Please wait.",
      variant: "info",
    });
    try {
      const res = await fetch(`/api/purchases/${deletingPurchase.id}`, {
        method: "DELETE",
      }).catch(() => null);

      if (res && res.ok) {
        setList((prev) => prev.filter((p) => p.id !== deletingPurchase.id));
        setDeleteOpen(false);
        toast({
          title: "Purchase deleted",
          description: `${deletingPurchase.vendorName} • ${formatCurrency(deletingPurchase.amount)}`,
          variant: "success",
        });
        setDeletingPurchase(null);
      } else {
        toast({
          title: "Failed to delete purchase",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleExport = async () => {
    const headers = ["Date", "Vendor", "Bill No", "Amount", "Type", "Notes"];
    const rows = list.map((p) => [
      p.date,
      p.vendorName,
      p.billNo ?? "",
      p.amount,
      p.type,
      p.notes ?? "",
    ]);
    await downloadXlsx(
      `purchases-${new Date().toISOString().slice(0, 10)}.xlsx`,
      headers,
      rows,
    );
    toast({
      title: "Exported purchases",
      description: "An Excel file has been downloaded.",
      variant: "success",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Purchases
        </h1>
        <div className="flex items-center gap-2">
          <button
            className="btn-outline"
            onClick={handleExport}
            disabled={loading || list.length === 0}
          >
            <Download size={16} /> Export
          </button>
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Add Purchase
          </button>
        </div>
      </div>
      <div className="card-pharmacy overflow-hidden">
        {loading ? (
          <SkeletonTable columns={7} rows={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {[
                    "Date",
                    "Vendor",
                    "Bill #",
                    "Amount",
                    "Type",
                    "Notes",
                    "Actions",
                  ].map((h) => (
                    <th key={h} className="table-header-cell text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="table-body-cell text-center text-muted-foreground py-10"
                    >
                      No purchases yet
                    </td>
                  </tr>
                ) : (
                  list.map((p) => (
                    <tr key={p.id} className="table-row-hover">
                      <td className="table-body-cell whitespace-nowrap">
                        {p.date}
                      </td>
                      <td className="table-body-cell">{p.vendorName}</td>
                      <td className="table-body-cell">{p.billNo}</td>
                      <td className="table-body-cell tabular-nums font-medium">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="table-body-cell">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            p.type === "Cash"
                              ? "bg-accent text-accent-foreground"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {p.type}
                        </span>
                      </td>
                      <td className="table-body-cell text-muted-foreground">
                        {p.notes}
                      </td>
                      <td className="table-body-cell">
                        <div className="flex gap-1">
                          <button
                            className="btn-outline p-1.5"
                            onClick={() => handleViewOpen(p)}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="btn-outline p-1.5"
                            onClick={() => handleEditOpen(p)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="btn-outline p-1.5 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => handleDeleteOpen(p)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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
                  Add Purchase
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
                  <SearchableSelect
                    value={form.vendorId}
                    onValueChange={(next) =>
                      setForm({ ...form, vendorId: next })
                    }
                    disabled={submitting}
                    placeholder="Select vendor"
                    options={vendors.map((v) => ({
                      value: String(v.id),
                      label: v.name,
                    }))}
                  />
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
                      Bill Number
                    </label>
                    <input
                      className="input-field"
                      value={form.billNo}
                      onChange={(e) =>
                        setForm({ ...form, billNo: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Payment Type
                    </label>
                    <SearchableSelect
                      value={form.type}
                      onValueChange={(next) =>
                        setForm({ ...form, type: next as "Cash" | "Credit" })
                      }
                      disabled={submitting}
                      placeholder="Select type"
                      options={[
                        { value: "Credit", label: "Credit" },
                        { value: "Cash", label: "Cash" },
                      ]}
                    />
                  </div>
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
                    "Add Purchase"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PurchaseViewModal
        open={viewOpen}
        purchase={selectedPurchase}
        onClose={() => {
          setViewOpen(false);
          setSelectedPurchase(null);
        }}
      />

      <EditPurchaseModal
        open={editOpen}
        submitting={editSubmitting}
        vendors={vendors}
        form={editForm}
        onChange={setEditForm}
        onClose={() => {
          if (editSubmitting) return;
          setEditOpen(false);
          setEditingPurchase(null);
        }}
        onSave={handleUpdate}
      />

      <ConfirmDeleteModal
        open={deleteOpen}
        submitting={deleteSubmitting}
        title="Delete purchase?"
        description={
          deletingPurchase
            ? `This will delete purchase of ${deletingPurchase.vendorName}.`
            : "This will delete the purchase."
        }
        onClose={() => {
          if (deleteSubmitting) return;
          setDeleteOpen(false);
          setDeletingPurchase(null);
        }}
        onConfirm={handleDelete}
        confirmText="Delete"
      />
    </div>
  );
}

function PurchaseViewModal({
  open,
  purchase,
  onClose,
}: {
  open: boolean;
  purchase: Purchase | null;
  onClose: () => void;
}) {
  if (!open || !purchase) return null;
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
          <h2 className="text-lg font-semibold text-foreground">
            Purchase Details
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3 text-sm">
          {[
            { label: "Vendor", value: purchase.vendorName },
            { label: "Date", value: purchase.date },
            { label: "Bill #", value: purchase.billNo || "-" },
            { label: "Amount", value: formatCurrency(purchase.amount) },
            { label: "Type", value: purchase.type },
            { label: "Notes", value: purchase.notes || "-" },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-start justify-between gap-4"
            >
              <span className="text-muted-foreground">{row.label}</span>
              <span className="text-foreground font-medium text-right">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function EditPurchaseModal({
  open,
  submitting,
  vendors,
  form,
  onChange,
  onClose,
  onSave,
}: {
  open: boolean;
  submitting: boolean;
  vendors: Vendor[];
  form: {
    vendorId: string;
    date: string;
    billNo: string;
    amount: string;
    type: "Cash" | "Credit";
    notes: string;
  };
  onChange: (next: {
    vendorId: string;
    date: string;
    billNo: string;
    amount: string;
    type: "Cash" | "Credit";
    notes: string;
  }) => void;
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
          <h2 className="text-lg font-semibold text-foreground">
            Edit Purchase
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
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Vendor
            </label>
            <SearchableSelect
              value={form.vendorId}
              onValueChange={(next) => onChange({ ...form, vendorId: next })}
              disabled={submitting}
              placeholder="Select vendor"
              options={vendors.map((v) => ({
                value: String(v.id),
                label: v.name,
              }))}
            />
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
                disabled={submitting}
                onChange={(e) => onChange({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Bill Number
              </label>
              <input
                className="input-field"
                value={form.billNo}
                disabled={submitting}
                onChange={(e) => onChange({ ...form, billNo: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Amount
              </label>
              <input
                type="number"
                className="input-field"
                value={form.amount}
                disabled={submitting}
                onChange={(e) => onChange({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Payment Type
              </label>
              <SearchableSelect
                value={form.type}
                onValueChange={(next) =>
                  onChange({ ...form, type: next as "Cash" | "Credit" })
                }
                disabled={submitting}
                placeholder="Select type"
                options={[
                  { value: "Credit", label: "Credit" },
                  { value: "Cash", label: "Cash" },
                ]}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Notes
            </label>
            <input
              className="input-field"
              value={form.notes}
              disabled={submitting}
              onChange={(e) => onChange({ ...form, notes: e.target.value })}
            />
          </div>
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

function ConfirmDeleteModal({
  open,
  submitting,
  title,
  description,
  confirmText,
  onClose,
  onConfirm,
}: {
  open: boolean;
  submitting: boolean;
  title: string;
  description: string;
  confirmText: string;
  onClose: () => void;
  onConfirm: () => void;
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            disabled={submitting}
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
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
            onClick={onConfirm}
            disabled={submitting}
            style={{
              background: "hsl(var(--destructive))",
              color: "hsl(var(--destructive-foreground))",
              opacity: submitting ? 0.85 : 1,
            }}
          >
            {submitting ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                Deleting…
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
