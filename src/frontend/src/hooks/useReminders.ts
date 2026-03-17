import { useState } from "react";
import type { ReminderSettings } from "../types";

const DEFAULT_SETTINGS: ReminderSettings = {
  studioWhatsApp: "",
  studioName: "The Pilates Studio",
  triggerDays: [3, 1],
  messageTemplate:
    "Hi {client_name}, your payment of \u20b9{amount} is due on {due_date}. Please contact {studio_name} to renew. Thank you!",
};

export function useReminders() {
  const [settings, setSettings] = useState<ReminderSettings>(() => {
    try {
      const stored = localStorage.getItem("forma_reminder_settings");
      return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const saveSettings = (s: ReminderSettings) => {
    setSettings(s);
    localStorage.setItem("forma_reminder_settings", JSON.stringify(s));
  };

  return { settings, saveSettings };
}
