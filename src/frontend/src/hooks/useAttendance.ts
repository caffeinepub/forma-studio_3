import { useEffect, useState } from "react";
import type { AttendanceRecord } from "../types";

export function useAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("forma_attendance") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("forma_attendance", JSON.stringify(records));
  }, [records]);

  const addRecord = (r: AttendanceRecord) => setRecords((prev) => [...prev, r]);

  const updateRecord = (r: AttendanceRecord) =>
    setRecords((prev) => prev.map((x) => (x.id === r.id ? r : x)));

  const upsertRecord = (
    sessionId: string,
    clientId: string,
    status: AttendanceRecord["status"],
    date: string,
  ) => {
    setRecords((prev) => {
      const existing = prev.find(
        (x) => x.sessionId === sessionId && x.clientId === clientId,
      );
      if (existing) {
        return prev.map((x) =>
          x.sessionId === sessionId && x.clientId === clientId
            ? { ...x, status }
            : x,
        );
      }
      return [
        ...prev,
        { id: crypto.randomUUID(), sessionId, clientId, date, status },
      ];
    });
  };

  const getBySession = (sessionId: string) =>
    records.filter((x) => x.sessionId === sessionId);

  const getByClient = (clientId: string) =>
    records.filter((x) => x.clientId === clientId);

  return {
    records,
    addRecord,
    updateRecord,
    upsertRecord,
    getBySession,
    getByClient,
  };
}
