import { useState } from "react";
import type {
  DayAttendanceStatus,
  OperatingDay,
  WeeklyAttendance,
} from "../types";

const STORAGE_KEY = "forma_weekly_attendance";

function getMondayKey(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon
  const diff = day === 0 ? -6 : 1 - day; // go to Monday
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

function load(): WeeklyAttendance[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(data: WeeklyAttendance[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useWeeklyAttendance() {
  const [records, setRecords] = useState<WeeklyAttendance[]>(load);

  const currentWeekKey = getMondayKey();

  function getWeekRecord(
    clientId: string,
    weekKey: string = currentWeekKey,
  ): WeeklyAttendance | null {
    return (
      records.find((r) => r.clientId === clientId && r.weekKey === weekKey) ??
      null
    );
  }

  function initWeekForClient(
    clientId: string,
    scheduledDays: OperatingDay[],
  ): WeeklyAttendance {
    const existing = getWeekRecord(clientId);
    if (existing) return existing;
    const days: Record<string, DayAttendanceStatus> = {};
    for (const d of scheduledDays) {
      days[d] = "Pending";
    }
    const newRecord: WeeklyAttendance = {
      clientId,
      weekKey: currentWeekKey,
      days: days as Record<OperatingDay, DayAttendanceStatus>,
    };
    setRecords((prev) => {
      const next = [...prev, newRecord];
      persist(next);
      return next;
    });
    return newRecord;
  }

  function setDayStatus(
    clientId: string,
    day: OperatingDay,
    status: DayAttendanceStatus,
  ) {
    setRecords((prev) => {
      const idx = prev.findIndex(
        (r) => r.clientId === clientId && r.weekKey === currentWeekKey,
      );
      let next: WeeklyAttendance[];
      if (idx === -1) {
        const newRecord: WeeklyAttendance = {
          clientId,
          weekKey: currentWeekKey,
          days: { [day]: status } as Record<OperatingDay, DayAttendanceStatus>,
        };
        next = [...prev, newRecord];
      } else {
        next = prev.map((r, i) =>
          i === idx ? { ...r, days: { ...r.days, [day]: status } } : r,
        );
      }
      persist(next);
      return next;
    });
  }

  function getWeekStats(clientId: string, weekKey: string = currentWeekKey) {
    const rec = getWeekRecord(clientId, weekKey);
    if (!rec) return { attended: 0, missed: 0, pending: 0, total: 0 };
    const vals = Object.values(rec.days);
    return {
      attended: vals.filter((v) => v === "Attended").length,
      missed: vals.filter((v) => v === "Missed").length,
      pending: vals.filter((v) => v === "Pending").length,
      total: vals.length,
    };
  }

  // Get all weeks for a client in a given month (YYYY-MM)
  function getMonthRecords(
    clientId: string,
    monthKey: string,
  ): WeeklyAttendance[] {
    return records.filter(
      (r) =>
        r.clientId === clientId &&
        r.weekKey.startsWith(monthKey.substring(0, 7)),
    );
  }

  // Get all historical records for a client
  function getAllRecords(clientId: string): WeeklyAttendance[] {
    return records
      .filter((r) => r.clientId === clientId)
      .sort((a, b) => a.weekKey.localeCompare(b.weekKey));
  }

  return {
    records,
    currentWeekKey,
    getWeekRecord,
    initWeekForClient,
    setDayStatus,
    getWeekStats,
    getMonthRecords,
    getAllRecords,
    getMondayKey,
  };
}
