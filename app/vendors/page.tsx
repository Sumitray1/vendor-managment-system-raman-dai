"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, Plus, X, Eye, Pencil, Trash2, Users } from "lucide-react";
import { formatCurrency, type Vendor } from "@/data/mockData";
import { useToast } from "@/components/ui/use-toast";
import SkeletonTable from "@/components/ui/skeleton-table";
import { downloadXlsx } from "@/lib/utils";
import {
  AddVendorModal,
  EditVendorModal,
  ViewVendorModal,
} from "@/components/vendor-modals";
import {
  createVendor,
  deleteVendor,
  getVendors,
  updateVendor,
} from "@/services/vendor";

export default function Vendors() {
  const [vendorList, setVendorList] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    panNumber: "",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    address: "",
    panNumber: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getVendors({ cache: "no-store" });
        if (!cancelled && Array.isArray(data)) setVendorList(data);
      } catch {
        toast({
          title: "Failed to load vendors",
          description: "Please refresh and try again.",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  const handleAdd = async () => {
    if (!form.name) {
      toast({
        title: "Missing vendor name",
        description: "Please enter vendor name.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const created = await createVendor(form);
      setVendorList((prev) => [created, ...prev]);
      setForm({ name: "", phone: "", address: "", panNumber: "" });
      setModalOpen(false);
      toast({
        title: "Vendor created",
        description: `${created.name} has been added.`,
        variant: "success",
      });
    } catch {
      toast({
        title: "Failed to create vendor",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditOpen = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setEditForm({
      name: vendor.name ?? "",
      phone: vendor.phone ?? "",
      address: vendor.address ?? "",
      panNumber: vendor.panNumber ?? "",
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingVendor) return;
    if (!editForm.name) {
      toast({
        title: "Missing vendor name",
        description: "Please enter vendor name.",
        variant: "destructive",
      });
      return;
    }

    setEditSubmitting(true);
    toast({
      title: "Updating vendor...",
      description: "Please wait.",
      variant: "info",
    });
    try {
      const updated = await updateVendor(editingVendor.id, editForm);
      setVendorList((prev) =>
        prev.map((v) => (v.id === updated.id ? updated : v)),
      );
      setEditOpen(false);
      setEditingVendor(null);
      toast({
        title: "Vendor updated",
        description: `${updated.name} has been updated.`,
        variant: "success",
      });
    } catch {
      toast({
        title: "Failed to update vendor",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteOpen = (vendor: Vendor) => {
    setDeletingVendor(vendor);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingVendor) return;
    setDeleteSubmitting(true);
    toast({
      title: "Deleting vendor...",
      description: "Please wait.",
      variant: "info",
    });
    try {
      await deleteVendor(deletingVendor.id);
      setVendorList((prev) => prev.filter((v) => v.id !== deletingVendor.id));
      setDeleteOpen(false);
      toast({
        title: "Vendor deleted",
        description: `${deletingVendor.name} has been removed.`,
        variant: "success",
      });
      setDeletingVendor(null);
    } catch {
      toast({
        title: "Failed to delete vendor",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleExport = async () => {
    const headers = [
      "Vendor Name",
      "Phone",
      "Address",
      "PAN",
      "Total Purchase",
      "Total Paid",
      "Balance",
    ];
    const rows = vendorList.map((v) => [
      v.name,
      v.phone ?? "",
      v.address ?? "",
      v.panNumber ?? "",
      v.totalPurchase ?? 0,
      v.totalPaid ?? 0,
      v.balance ?? 0,
    ]);
    await downloadXlsx(
      `vendors-${new Date().toISOString().slice(0, 10)}.xlsx`,
      headers,
      rows,
    );
    toast({
      title: "Exported vendors",
      description: "An Excel file has been downloaded.",
      variant: "success",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Vendors
        </h1>
        <div className="flex items-center gap-2">
          <button
            className="btn-outline"
            onClick={handleExport}
            disabled={loading || vendorList.length === 0}
          >
            <Download size={16} /> Export
          </button>
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Add Vendor
          </button>
        </div>
      </div>

      <div className="card-pharmacy overflow-hidden">
        {loading ? (
          <SkeletonTable columns={7} rows={6} />
        ) : vendorList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
              className="mb-3 h-10 w-10 rounded-full flex items-center justify-center"
              style={{
                background: "hsl(214, 32%, 91%)",
                color: "hsl(221, 83%, 53%)",
              }}
            >
              <Users size={18} />
            </div>
            <p className="text-sm font-medium text-foreground">
              No vendors yet
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first vendor to get started.
            </p>
            <button className="btn-primary" onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Add Vendor
            </button>
          </div>
        ) : (
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
                {vendorList.map((v) => (
                  <tr key={v.id} className="table-row-hover">
                    <td className="table-body-cell font-medium">{v.name}</td>
                    <td className="table-body-cell">{v.phone}</td>
                    <td className="table-body-cell">{v.address}</td>
                    <td className="table-body-cell tabular-nums">
                      {formatCurrency(v.totalPurchase)}
                    </td>
                    <td
                      className="table-body-cell tabular-nums"
                      style={{ color: "hsl(142, 71%, 45%)" }}
                    >
                      {formatCurrency(v.totalPaid)}
                    </td>
                    <td
                      className="table-body-cell tabular-nums font-medium"
                      style={
                        v.balance > 0
                          ? { color: "hsl(0, 84%, 60%)" }
                          : { color: "hsl(142, 71%, 45%)" }
                      }
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
                        <button
                          className="btn-outline p-1.5"
                          onClick={() => handleEditOpen(v)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="btn-outline p-1.5 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleDeleteOpen(v)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddVendorModal
        open={modalOpen}
        submitting={submitting}
        form={form}
        onChange={setForm}
        onClose={() => {
          if (submitting) return;
          setModalOpen(false);
        }}
        onSave={handleAdd}
      />

      <ViewVendorModal
        open={viewOpen}
        vendor={selectedVendor}
        onClose={() => {
          setViewOpen(false);
          setSelectedVendor(null);
        }}
      />

      <EditVendorModal
        open={editOpen}
        submitting={editSubmitting}
        form={editForm}
        onChange={setEditForm}
        onClose={() => {
          if (editSubmitting) return;
          setEditOpen(false);
          setEditingVendor(null);
        }}
        onSave={handleUpdate}
      />

      <ConfirmDeleteModal
        open={deleteOpen}
        submitting={deleteSubmitting}
        title="Delete vendor?"
        description={
          deletingVendor
            ? `This will delete ${deletingVendor.name}.`
            : "This will delete the vendor."
        }
        onClose={() => {
          if (deleteSubmitting) return;
          setDeleteOpen(false);
          setDeletingVendor(null);
        }}
        onConfirm={handleDelete}
        confirmText="Delete"
      />
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
