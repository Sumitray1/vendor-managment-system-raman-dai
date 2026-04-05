"use client";

import { apiFetch } from "@/services/api";
import type { Vendor, LedgerEntry } from "@/data/mockData";

type VendorForm = { name: string; phone: string; address: string; panNumber: string };

export function getVendors(init?: { cache?: RequestCache }) {
  return apiFetch<Vendor[]>("/api/vendors", { cache: init?.cache ?? "no-store" });
}

export function getVendorLedger(vendorId: number, init?: { cache?: RequestCache }) {
  return apiFetch<LedgerEntry[]>(`/api/vendors/${vendorId}/ledger`, {
    cache: init?.cache ?? "no-store",
  });
}

export function createVendor(form: VendorForm) {
  return apiFetch<Vendor>("/api/vendors", { method: "POST", json: form });
}

export function updateVendor(vendorId: number, form: VendorForm) {
  return apiFetch<Vendor>(`/api/vendors/${vendorId}`, { method: "PATCH", json: form });
}

export function deleteVendor(vendorId: number) {
  return apiFetch<void>(`/api/vendors/${vendorId}`, { method: "DELETE" });
}

