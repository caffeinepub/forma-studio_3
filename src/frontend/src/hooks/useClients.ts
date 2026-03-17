import { useEffect, useState } from "react";
import type { Client } from "../types";

export function useClients() {
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("forma_clients") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("forma_clients", JSON.stringify(clients));
  }, [clients]);

  const addClient = (c: Client) => setClients((prev) => [...prev, c]);
  const updateClient = (c: Client) =>
    setClients((prev) => prev.map((x) => (x.id === c.id ? c : x)));
  const deleteClient = (id: string) =>
    setClients((prev) => prev.filter((x) => x.id !== id));

  return { clients, addClient, updateClient, deleteClient };
}
