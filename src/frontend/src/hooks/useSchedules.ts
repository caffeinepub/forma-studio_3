import { useState } from "react";
import type { ClientSchedule, DaySlot } from "../types";

const STORAGE_KEY = "forma_schedules";

function load(): ClientSchedule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(data: ClientSchedule[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useSchedules() {
  const [schedules, setSchedulesState] = useState<ClientSchedule[]>(load);

  function setClientSchedule(clientId: string, scheduledDays: DaySlot[]) {
    setSchedulesState((prev) => {
      const next = prev.filter((s) => s.clientId !== clientId);
      if (scheduledDays.length > 0) {
        next.push({ clientId, scheduledDays });
      }
      save(next);
      return next;
    });
  }

  function getClientSchedule(clientId: string): ClientSchedule | null {
    return schedules.find((s) => s.clientId === clientId) ?? null;
  }

  return { schedules, setClientSchedule, getClientSchedule };
}
