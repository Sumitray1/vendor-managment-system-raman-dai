"use client";

import { apiFetch } from "@/services/api";
import type { Purchase } from "@/data/mockData";

export type PurchaseForm = {
  vendorId: number;
  date: string;
  billNo?: string;
  amount: number;
  type: "Cash" | "Credit";
  notes?: string;
};

export function getPurchases(init?: { cache?: RequestCache }) {
  return apiFetch<Purchase[]>("/api/purchases", {
    cache: init?.cache ?? "no-store",
  });
}

export function createPurchase(form: PurchaseForm) {
  return apiFetch<Purchase>("/api/purchases", { method: "POST", json: form });
}

export function updatePurchase(purchaseId: number, form: PurchaseForm) {
  return apiFetch<Purchase>(`/api/purchases/${purchaseId}`, {
    method: "PATCH",
    json: form,
  });
}

export function deletePurchase(purchaseId: number) {
  return apiFetch<void>(`/api/purchases/${purchaseId}`, { method: "DELETE" });
}
