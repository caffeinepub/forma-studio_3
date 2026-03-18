import { cn } from "@/lib/utils";
import { useState } from "react";
import { useClients } from "../hooks/useClients";
import { useSchedules } from "../hooks/useSchedules";
import type { OperatingDay } from "../types";

const OPERATING_DAYS: OperatingDay[] = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];
const REFORMERS = ["R1", "R2", "R3"] as const;

const MORNING_SLOTS = [
  "7:30 AM - 8:30 AM",
  "8:30 AM - 9:30 AM",
  "9:30 AM - 10:30 AM",
];

const EVENING_SLOTS = [
  "4:30 PM - 5:30 PM",
  "5:30 PM - 6:30 PM",
  "6:30 PM - 7:30 PM",
  "7:30 PM - 8:30 PM",
];

const LATE_MORNING_SLOTS = ["11:00 AM - 12:00 PM"];

export function Schedule() {
  const [selectedDay, setSelectedDay] = useState<OperatingDay>("Mon");
  const { schedules } = useSchedules();
  const { clients } = useClients();

  // Build lookup: slot+reformer -> clientName for selected day
  function getCellClient(slot: string, reformer: string): string | null {
    for (const schedule of schedules) {
      for (const ds of schedule.scheduledDays) {
        if (
          ds.day === selectedDay &&
          ds.slot === slot &&
          ds.reformer === reformer
        ) {
          const client = clients.find((c) => c.id === schedule.clientId);
          return client?.name ?? "Client";
        }
      }
    }
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2
          className="font-display text-3xl md:text-4xl font-light"
          style={{ color: "oklch(0.92 0.01 80)" }}
        >
          Day Overview
        </h2>
        <p
          className="text-sm mt-1 font-body"
          style={{ color: "oklch(0.55 0.01 80)" }}
        >
          View scheduled clients across all reformers and time slots
        </p>
      </div>

      {/* Day Tabs */}
      <div className="flex gap-1 flex-wrap">
        {OPERATING_DAYS.map((day) => (
          <button
            key={day}
            type="button"
            data-ocid="schedule.day.tab"
            onClick={() => setSelectedDay(day)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-body font-medium transition-all duration-150",
            )}
            style={{
              backgroundColor:
                selectedDay === day
                  ? "oklch(0.85 0.14 185 / 0.2)"
                  : "oklch(0.15 0.006 260)",
              color:
                selectedDay === day
                  ? "oklch(0.85 0.14 185)"
                  : "oklch(0.55 0.01 80)",
              border:
                selectedDay === day
                  ? "1px solid oklch(0.85 0.14 185 / 0.4)"
                  : "1px solid oklch(0.22 0.008 260)",
            }}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Schedule Grid */}
      <div
        className="overflow-x-auto rounded-lg border"
        style={{ borderColor: "oklch(0.22 0.008 260)" }}
      >
        <table className="w-full min-w-[500px] text-sm font-body">
          <thead>
            <tr style={{ backgroundColor: "oklch(0.12 0.006 260)" }}>
              <th
                className="py-3 px-4 text-left font-medium text-xs uppercase tracking-widest"
                style={{ color: "oklch(0.55 0.01 80)", width: "180px" }}
              >
                Time Slot
              </th>
              {REFORMERS.map((r) => (
                <th
                  key={r}
                  className="py-3 px-4 text-center font-medium text-xs uppercase tracking-widest"
                  style={{ color: "oklch(0.85 0.14 185)" }}
                >
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Morning section header */}
            <SectionHeader label="Morning" />

            {MORNING_SLOTS.map((slot, i) => (
              <SlotRow
                key={slot}
                slot={slot}
                getCellClient={getCellClient}
                alternate={i % 2 === 1}
              />
            ))}

            {/* Break row */}
            <tr style={{ backgroundColor: "oklch(0.11 0.005 260)" }}>
              <td
                colSpan={4}
                className="py-2 px-4 text-center text-xs font-medium uppercase tracking-widest"
                style={{ color: "oklch(0.4 0.01 80)" }}
              >
                ☕ Break — 10:30 AM to 11:00 AM
              </td>
            </tr>

            {LATE_MORNING_SLOTS.map((slot, i) => (
              <SlotRow
                key={slot}
                slot={slot}
                getCellClient={getCellClient}
                alternate={i % 2 === 0}
              />
            ))}

            {/* Evening section header */}
            <SectionHeader label="Evening" />

            {EVENING_SLOTS.map((slot, i) => (
              <SlotRow
                key={slot}
                slot={slot}
                getCellClient={getCellClient}
                alternate={i % 2 === 1}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div
        className="flex flex-wrap gap-4 text-xs font-body"
        style={{ color: "oklch(0.45 0.01 80)" }}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: "oklch(0.85 0.14 185 / 0.15)" }}
          />
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: "oklch(0.13 0.005 260)" }}
          />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: "oklch(0.11 0.005 260)" }}
          />
          <span>Break</span>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <tr style={{ backgroundColor: "oklch(0.85 0.14 185 / 0.06)" }}>
      <td
        colSpan={4}
        className="py-2 px-4 text-xs font-semibold uppercase tracking-widest"
        style={{ color: "oklch(0.85 0.14 185)" }}
      >
        {label}
      </td>
    </tr>
  );
}

function SlotRow({
  slot,
  getCellClient,
  alternate,
}: {
  slot: string;
  getCellClient: (slot: string, reformer: string) => string | null;
  alternate: boolean;
}) {
  return (
    <tr
      style={{
        backgroundColor: alternate
          ? "oklch(0.13 0.005 260)"
          : "oklch(0.115 0.005 260)",
      }}
    >
      <td
        className="py-3 px-4 text-xs"
        style={{
          color: "oklch(0.65 0.01 80)",
          borderRight: "1px solid oklch(0.2 0.006 260)",
        }}
      >
        {slot}
      </td>
      {(["R1", "R2", "R3"] as const).map((r) => {
        const client = getCellClient(slot, r);
        return (
          <td key={r} className="py-3 px-4 text-center">
            {client ? (
              <span
                className="inline-block px-2 py-1 rounded-md text-xs font-medium"
                style={{
                  backgroundColor: "oklch(0.85 0.14 185 / 0.15)",
                  color: "oklch(0.85 0.14 185)",
                }}
              >
                {client}
              </span>
            ) : (
              <span style={{ color: "oklch(0.28 0.008 260)" }}>—</span>
            )}
          </td>
        );
      })}
    </tr>
  );
}
