import { useEffect, useState } from "react";
import type { RenewalRecord } from "../types";

export function useRenewals() {
  const [renewals, setRenewals] = useState<RenewalRecord[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("forma_renewals") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("forma_renewals", JSON.stringify(renewals));
  }, [renewals]);

  const addRenewal = (r: RenewalRecord) => setRenewals((prev) => [...prev, r]);
  const updateRenewal = (r: RenewalRecord) =>
    setRenewals((prev) => prev.map((x) => (x.id === r.id ? r : x)));

  return { renewals, addRenewal, updateRenewal };
}
