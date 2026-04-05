"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { SearchableSelect } from "@/components/ui/select";
import { formatCurrency, type Purchase, type Vendor } from "@/data/mockData";

type PurchaseFormState = {
  vendorId: string;
  date: string;
  billNo: string;
  amount: string;
  type: "Cash" | "Credit";
  notes: string;
};

export function AddPurchaseModal({
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
  form: PurchaseFormState;
  onChange: (next: PurchaseFormState) => void;
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
                Add Purchase
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
                    onChange={(e) =>
                      onChange({ ...form, billNo: e.target.value })
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
                    disabled={submitting}
                    onChange={(e) =>
                      onChange({ ...form, amount: e.target.value })
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
  );
}

export function PurchaseViewModal({
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

export function EditPurchaseModal({
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
  form: PurchaseFormState;
  onChange: (next: PurchaseFormState) => void;
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
          <h2 className="text-lg font-semibold text-foreground">Edit Purchase</h2>
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
          <button className="btn-outline" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="btn-primary" onClick={onSave} disabled={submitting}>
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

