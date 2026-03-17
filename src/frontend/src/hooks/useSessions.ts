import { useEffect, useState } from "react";
import type { Session } from "../types";

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("forma_sessions") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("forma_sessions", JSON.stringify(sessions));
  }, [sessions]);

  const addSession = (s: Session) => setSessions((prev) => [...prev, s]);
  const updateSession = (s: Session) =>
    setSessions((prev) => prev.map((x) => (x.id === s.id ? s : x)));
  const deleteSession = (id: string) =>
    setSessions((prev) => prev.filter((x) => x.id !== id));

  return { sessions, addSession, updateSession, deleteSession };
}
