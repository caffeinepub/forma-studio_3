import { useEffect, useState } from "react";
import type { Payment } from "../types";

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("forma_payments") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("forma_payments", JSON.stringify(payments));
  }, [payments]);

  const addPayment = (p: Payment) => setPayments((prev) => [...prev, p]);
  const updatePayment = (p: Payment) =>
    setPayments((prev) => prev.map((x) => (x.id === p.id ? p : x)));
  const deletePayment = (id: string) =>
    setPayments((prev) => prev.filter((x) => x.id !== id));

  return { payments, addPayment, updatePayment, deletePayment };
}
