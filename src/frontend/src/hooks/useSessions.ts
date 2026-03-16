import { useCallback, useState } from "react";
import type { Session } from "../types";

const STORAGE_KEY = "forma_sessions";

function load(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(sessions: Session[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>(load);

  const addSession = useCallback((session: Session) => {
    setSessions((prev) => {
      const next = [...prev, session];
      save(next);
      return next;
    });
  }, []);

  const updateSession = useCallback((updated: Session) => {
    setSessions((prev) => {
      const next = prev.map((s) => (s.id === updated.id ? updated : s));
      save(next);
      return next;
    });
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      save(next);
      return next;
    });
  }, []);

  return { sessions, addSession, updateSession, deleteSession };
}
