import { useCallback, useState } from "react";
import type { Client } from "../types";

const STORAGE_KEY = "forma_clients";

function load(): Client[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(clients: Client[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>(load);

  const addClient = useCallback((client: Client) => {
    setClients((prev) => {
      const next = [...prev, client];
      save(next);
      return next;
    });
  }, []);

  const updateClient = useCallback((updated: Client) => {
    setClients((prev) => {
      const next = prev.map((c) => (c.id === updated.id ? updated : c));
      save(next);
      return next;
    });
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients((prev) => {
      const next = prev.filter((c) => c.id !== id);
      save(next);
      return next;
    });
  }, []);

  return { clients, addClient, updateClient, deleteClient };
}
