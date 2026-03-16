import { useCallback, useState } from "react";
import type { ReformerStatus } from "../types";

const STORAGE_KEY = "forma_reformers";

const DEFAULT: ReformerStatus[] = [
  { id: "R1", status: "Occupied", currentClient: "Sofia Marchetti" },
  { id: "R2", status: "Available" },
  { id: "R3", status: "Maintenance" },
];

function load(): ReformerStatus[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

function save(reformers: ReformerStatus[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reformers));
}

const CYCLE: ReformerStatus["status"][] = [
  "Available",
  "Occupied",
  "Maintenance",
];

export function useReformers() {
  const [reformers, setReformers] = useState<ReformerStatus[]>(load);

  const cycleStatus = useCallback((id: string) => {
    setReformers((prev) => {
      const next = prev.map((r) => {
        if (r.id !== id) return r;
        const idx = CYCLE.indexOf(r.status);
        const nextStatus = CYCLE[(idx + 1) % CYCLE.length];
        return {
          ...r,
          status: nextStatus,
          currentClient:
            nextStatus === "Occupied" ? r.currentClient : undefined,
        };
      });
      save(next);
      return next;
    });
  }, []);

  const updateReformer = useCallback((updated: ReformerStatus) => {
    setReformers((prev) => {
      const next = prev.map((r) => (r.id === updated.id ? updated : r));
      save(next);
      return next;
    });
  }, []);

  return { reformers, cycleStatus, updateReformer };
}
