"use client";
import { useEffect, useState } from "react";
import {
  vendors as initialVendors,
  getVendorLedger as getVendorLedgerOffline,
  formatCurrency,
  type Vendor,
} from "@/data/mockData";
import SkeletonTable from "@/components/ui/skeleton-table";
import { useToast } from "@/components/ui/use-toast";
import { SearchableSelect } from "@/components/ui/select";
import { Download } from "lucide-react";
import { downloadXlsx } from "@/lib/utils";
import { getVendorLedger as getVendorLedgerApi, getVendors } from "@/services/vendor";

export default function VendorLedger() {
  const { toast } = useToast();
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
        const data = await getVendors({ cache: "no-store" });
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setVendors(data);
          setSelectedVendorId((current) =>
            data.some((v) => v.id === current) ? current : data[0].id,
          );
        }
      } catch {
        toast({
          title: "Failed to load vendors",
          description: "Network error. Please try again.",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setVendorsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [toast]);

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
        const data = await getVendorLedgerApi(selectedVendorId, { cache: "no-store" });
        if (!cancelled && Array.isArray(data)) {
          setLedger(data);
          return;
        }
        toast({
          title: "Failed to load ledger",
          description: "Showing offline data.",
          variant: "destructive",
        });
      } catch {
        toast({
          title: "Failed to load ledger",
          description: "Network error. Showing offline data.",
          variant: "destructive",
        });
      }

      if (!cancelled) setLedger(getVendorLedgerOffline(selectedVendorId));
    })().finally(() => {
      if (!cancelled) setLedgerLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedVendorId, toast]);

  const handleExport = async () => {
    if (!vendor) {
      toast({
        title: "Select a vendor",
        description: "Choose a vendor to export ledger.",
        variant: "destructive",
      });
      return;
    }
    const headers = ["Date", "Type", "Reference", "Amount", "Running Balance"];
    const rows = ledger.map((e) => [
      e.date,
      e.type,
      e.reference,
      e.amount,
      e.runningBalance,
    ]);
    const safeName = vendor.name.replace(/[\\/:*?"<>|]/g, "-");
    await downloadXlsx(
      `vendor-ledger-${safeName}-${new Date().toISOString().slice(0, 10)}.xlsx`,
      headers,
      rows,
    );
    toast({
      title: "Exported ledger",
      description: "An Excel file has been downloaded.",
      variant: "success",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Vendor Ledger
          </h1>
          <p className="text-sm text-muted-foreground">
            View purchases, payments, and running balance by vendor.
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Vendor
          </label>
          <SearchableSelect
            value={vendors.length === 0 ? "" : String(selectedVendorId)}
            onValueChange={(next) => setSelectedVendorId(Number(next))}
            disabled={vendorsLoading || vendors.length === 0}
            placeholder={
              vendorsLoading ? "Loading vendors..." : "Select vendor"
            }
            className="w-full sm:w-auto sm:min-w-[280px]"
            options={vendors.map((v) => ({
              value: String(v.id),
              label: v.name,
            }))}
          />
          <div className="mt-2 flex justify-end">
            <button
              className="btn-outline"
              onClick={handleExport}
              disabled={vendorsLoading || ledgerLoading || !vendor}
            >
              <Download size={16} /> Export
            </button>
          </div>
        </div>
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
            <p className="text-lg font-semibold tabular-nums text-green-700">
              {formatCurrency(vendor.totalPaid)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Outstanding Balance</p>
            <p
              className="text-lg font-semibold tabular-nums"
              style={vendor.balance > 0 ? { color: "hsl(0, 84%, 60%)" } : { color: "hsl(142, 71%, 45%)" }}
            >
              {formatCurrency(vendor.balance)}
            </p>
          </div>
        </div>
      )}

      <div className="card-pharmacy overflow-hidden">
        {ledgerLoading ? (
          <SkeletonTable columns={5} rows={6} />
        ) : (
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
                            : { color: "hsl(142, 71%, 45%)" } 
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
        )}
      </div>
    </div>
  );
}
