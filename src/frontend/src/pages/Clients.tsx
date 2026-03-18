import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  BarChart2,
  CalendarDays,
  CheckCircle2,
  KeyRound,
  Pencil,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useClients } from "../hooks/useClients";
import { useSchedules } from "../hooks/useSchedules";
import { useWeeklyAttendance } from "../hooks/useWeeklyAttendance";
import type {
  Client,
  DayAttendanceStatus,
  DaySlot,
  OperatingDay,
  WeeklyAttendance,
} from "../types";

// ---- Freq localStorage helpers ----
const FREQ_KEY = "forma_client_freq";
function loadFreqMap(): Record<string, "1x" | "2x" | "3x"> {
  try {
    const raw = localStorage.getItem(FREQ_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function getFreq(clientId: string): "1x" | "2x" | "3x" {
  return loadFreqMap()[clientId] ?? "2x";
}
function setFreq(clientId: string, freq: "1x" | "2x" | "3x") {
  const map = loadFreqMap();
  map[clientId] = freq;
  localStorage.setItem(FREQ_KEY, JSON.stringify(map));
}

// ---- Constants ----
const FEE_LOOKUP: Record<string, Record<string, number>> = {
  Monthly: { "1x": 4000, "2x": 7500, "3x": 10500 },
  Quarterly: { "1x": 11000, "2x": 21000, "3x": 29000 },
  "6-Month": { "1x": 20000, "2x": 39000, "3x": 54000 },
};

const EMPTY_FORM: Omit<Client, "id"> = {
  name: "",
  email: "",
  phone: "",
  sessionFrequency: "2x",
  paymentCycle: "Monthly",
  feeAmount: 7500,
  assignedReformer: "R1",
  status: "Active",
  planStartDate: new Date().toISOString().split("T")[0],
};

const OPERATING_DAYS: OperatingDay[] = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];
const REFORMERS = ["R1", "R2", "R3"] as const;

const TIME_SLOTS = [
  "7:30 AM - 8:30 AM",
  "8:30 AM - 9:30 AM",
  "9:30 AM - 10:30 AM",
  "11:00 AM - 12:00 PM",
  "4:30 PM - 5:30 PM",
  "5:30 PM - 6:30 PM",
  "6:30 PM - 7:30 PM",
  "7:30 PM - 8:30 PM",
];

const FREQ_LABELS: Record<"1x" | "2x" | "3x", string> = {
  "1x": "Once a week",
  "2x": "Twice a week",
  "3x": "Thrice a week",
};

const FREQ_NUM: Record<string, number> = { "1x": 1, "2x": 2, "3x": 3 };

const STATUS_STYLES: Record<
  DayAttendanceStatus,
  { bg: string; color: string; label: string }
> = {
  Pending: {
    bg: "oklch(0.22 0.008 260)",
    color: "oklch(0.55 0.01 80)",
    label: "Pending",
  },
  Attended: {
    bg: "oklch(0.85 0.14 185 / 0.2)",
    color: "oklch(0.85 0.14 185)",
    label: "Attended",
  },
  Missed: {
    bg: "oklch(0.65 0.15 25 / 0.2)",
    color: "oklch(0.75 0.18 25)",
    label: "Missed",
  },
};

// ---- End-of-week alert logic ----
function getIsEndOfWeek(): boolean {
  const dow = new Date().getDay(); // 0=Sun, 5=Fri, 6=Sat
  return dow === 0 || dow === 5 || dow === 6;
}

function getAlertColor(
  attended: number,
  missed: number,
  freq: string,
): string | null {
  const freqNum = FREQ_NUM[freq] ?? 0;
  const isEOW = getIsEndOfWeek();
  if (attended < freqNum && (missed > 0 || isEOW)) {
    return "oklch(0.88 0.12 85 / 0.12)";
  }
  return null;
}

// ---- Week range display helper ----
function weekRangeLabel(weekKey: string): string {
  const monday = new Date(`${weekKey}T00:00:00`);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

// ---- Monthly filter ----
function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function weekInMonth(weekKey: string, monthKey: string): boolean {
  // A week belongs to a month if Monday falls in that month
  return weekKey.startsWith(monthKey);
}

interface ClientsProps {
  saveClientCredentials: (
    username: string,
    password: string,
    clientId: string,
  ) => void;
  getClientCredentialsByClientId: (
    clientId: string,
  ) => { username: string } | null;
}

export function Clients({
  saveClientCredentials,
  getClientCredentialsByClientId,
}: ClientsProps) {
  const { clients, addClient, updateClient, deleteClient } = useClients();
  const { setClientSchedule, getClientSchedule } = useSchedules();
  const {
    getWeekRecord,
    initWeekForClient,
    setDayStatus,
    getWeekStats,
    getAllRecords,
    currentWeekKey,
  } = useWeeklyAttendance();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<Omit<Client, "id">>(EMPTY_FORM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof Omit<Client, "id">, string>>
  >({});

  // Credentials dialog
  const [credDialogOpen, setCredDialogOpen] = useState(false);
  const [credClient, setCredClient] = useState<Client | null>(null);
  const [credUsername, setCredUsername] = useState("");
  const [credPassword, setCredPassword] = useState("");
  const [credErrors, setCredErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  // Schedule dialog
  const [schedDialogOpen, setSchedDialogOpen] = useState(false);
  const [schedClient, setSchedClient] = useState<Client | null>(null);
  const [schedFreq, setSchedFreq] = useState<"1x" | "2x" | "3x">("2x");
  const [daySlots, setDaySlots] = useState<
    Record<OperatingDay, { slot: string; reformer: "R1" | "R2" | "R3" } | null>
  >(
    () =>
      Object.fromEntries(OPERATING_DAYS.map((d) => [d, null])) as Record<
        OperatingDay,
        null
      >,
  );

  // Monthly Summary dialog
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [summaryClient, setSummaryClient] = useState<Client | null>(null);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchName = c.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || c.status === statusFilter;
      return matchName && matchStatus;
    });
  }, [clients, search, statusFilter]);

  function openAdd() {
    setEditingClient(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(client: Client) {
    setEditingClient(client);
    const { id: _id, ...rest } = client;
    setForm(rest);
    setErrors({});
    setDialogOpen(true);
  }

  function openCredentials(client: Client) {
    setCredClient(client);
    const existing = getClientCredentialsByClientId(client.id);
    setCredUsername(existing?.username ?? "");
    setCredPassword("");
    setCredErrors({});
    setCredDialogOpen(true);
  }

  function openSchedule(client: Client) {
    setSchedClient(client);
    const existing = getClientSchedule(client.id);
    const init = Object.fromEntries(
      OPERATING_DAYS.map((d) => [d, null]),
    ) as Record<
      OperatingDay,
      { slot: string; reformer: "R1" | "R2" | "R3" } | null
    >;
    if (existing) {
      for (const ds of existing.scheduledDays) {
        init[ds.day] = { slot: ds.slot, reformer: ds.reformer };
      }
    }
    setDaySlots(init);
    setSchedFreq(getFreq(client.id));

    // init weekly attendance for scheduled days
    const scheduledDays = existing?.scheduledDays.map((ds) => ds.day) ?? [];
    if (scheduledDays.length > 0) {
      initWeekForClient(client.id, scheduledDays);
    }

    setSchedDialogOpen(true);
  }

  function openSummary(client: Client) {
    setSummaryClient(client);
    setSummaryDialogOpen(true);
  }

  function toggleDay(day: OperatingDay) {
    setDaySlots((prev) => ({
      ...prev,
      [day]: prev[day] ? null : { slot: TIME_SLOTS[0], reformer: "R1" },
    }));
  }

  function handleSchedSave() {
    if (!schedClient) return;
    const scheduledDays: DaySlot[] = [];
    for (const day of OPERATING_DAYS) {
      const entry = daySlots[day];
      if (entry) {
        scheduledDays.push({ day, slot: entry.slot, reformer: entry.reformer });
      }
    }
    setClientSchedule(schedClient.id, scheduledDays);
    setFreq(schedClient.id, schedFreq);
    updateClient({ ...schedClient, sessionFrequency: schedFreq });
    // init weekly record for the new schedule
    if (scheduledDays.length > 0) {
      initWeekForClient(
        schedClient.id,
        scheduledDays.map((d) => d.day),
      );
    }
    toast.success(`Schedule updated for ${schedClient.name}`);
    setSchedDialogOpen(false);
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    if (!form.feeAmount || form.feeAmount <= 0)
      e.feeAmount = "Enter a valid fee";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    if (editingClient) {
      updateClient({ ...form, id: editingClient.id });
      toast.success(`${form.name} updated successfully`);
    } else {
      addClient({ ...form, id: crypto.randomUUID() });
      toast.success(`${form.name} added`);
    }
    setDialogOpen(false);
  }

  function handleDelete(client: Client) {
    deleteClient(client.id);
    toast.success(`${client.name} removed`);
  }

  function handleCredSubmit() {
    const e: typeof credErrors = {};
    if (!credUsername.trim()) e.username = "Username is required";
    else if (credUsername.trim().length < 3)
      e.username = "Username must be at least 3 characters";
    if (!credPassword.trim()) e.password = "Password is required";
    else if (credPassword.trim().length < 6)
      e.password = "Password must be at least 6 characters";
    setCredErrors(e);
    if (Object.keys(e).length > 0) return;
    if (!credClient) return;
    saveClientCredentials(
      credUsername.trim(),
      credPassword.trim(),
      credClient.id,
    );
    toast.success(`Credentials saved for ${credClient.name}`);
    setCredDialogOpen(false);
  }

  function handleFreqOrCycleChange(
    freq: Client["sessionFrequency"],
    cycle: Client["paymentCycle"],
  ) {
    const suggested = FEE_LOOKUP[cycle]?.[freq] ?? form.feeAmount;
    setForm((f) => ({
      ...f,
      sessionFrequency: freq,
      paymentCycle: cycle,
      feeAmount: suggested,
    }));
  }

  function hasCredentials(clientId: string) {
    return getClientCredentialsByClientId(clientId) !== null;
  }

  function hasSchedule(clientId: string) {
    const s = getClientSchedule(clientId);
    return s !== null && s.scheduledDays.length > 0;
  }

  // ---- Monthly summary data ----
  function getMonthlySummaryRows(clientId: string) {
    const monthKey = currentMonthKey();
    const allRecs = getAllRecords(clientId);
    return allRecs.filter((r) => weekInMonth(r.weekKey, monthKey));
  }

  function getMonthlyStats(clientId: string) {
    const rows = getMonthlySummaryRows(clientId);
    let totalScheduled = 0;
    let totalAttended = 0;
    for (const row of rows) {
      const vals = Object.values(row.days);
      totalScheduled += vals.length;
      totalAttended += vals.filter((v) => v === "Attended").length;
    }
    const pct =
      totalScheduled > 0
        ? Math.round((totalAttended / totalScheduled) * 100)
        : 0;
    return { totalScheduled, totalAttended, pct };
  }

  // ---- Active days for schedule dialog ----
  const activeDays = OPERATING_DAYS.filter((d) => daySlots[d] !== null);

  // ---- Render attendance status for a day in schedule dialog ----
  function AttendancePill({
    clientId,
    day,
    status,
  }: {
    clientId: string;
    day: OperatingDay;
    status: DayAttendanceStatus;
  }) {
    return (
      <div className="flex gap-1 flex-wrap">
        {(["Pending", "Attended", "Missed"] as DayAttendanceStatus[]).map(
          (s) => {
            const active = status === s;
            const style = STATUS_STYLES[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => setDayStatus(clientId, day, s)}
                data-ocid="clients.schedule.attendance.toggle"
                className="px-3 py-2 rounded-lg text-xs font-medium transition-all min-h-[44px] min-w-[72px] flex items-center justify-center gap-1.5"
                style={{
                  backgroundColor: active ? style.bg : "oklch(0.15 0.005 260)",
                  color: active ? style.color : "oklch(0.45 0.01 80)",
                  border: active
                    ? `1.5px solid ${style.color}`
                    : "1.5px solid oklch(0.22 0.008 260)",
                  fontWeight: active ? 600 : 400,
                }}
              >
                {s === "Attended" && active && <CheckCircle2 size={12} />}
                {s === "Missed" && active && <XCircle size={12} />}
                {s}
              </button>
            );
          },
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl md:text-4xl font-light text-foreground">
            Clients
          </h2>
          <p className="text-sm text-muted-foreground mt-1 font-body">
            {clients.filter((c) => c.status === "Active").length} active members
          </p>
        </div>
        <Button
          data-ocid="clients.add.open_modal_button"
          onClick={openAdd}
          className="gap-2 font-body min-h-[44px]"
          style={{
            backgroundColor: "oklch(0.52 0.085 150)",
            color: "oklch(0.99 0.005 80)",
          }}
        >
          <Plus size={16} />
          Add Client
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Input
            data-ocid="clients.search.input"
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="font-body text-sm"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            {["All", "Active", "Inactive"].map((s) => (
              <TabsTrigger
                key={s}
                value={s}
                data-ocid="clients.status.tab"
                className="font-body text-sm"
              >
                {s}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Content: empty state / mobile cards / desktop table */}
      {filtered.length === 0 ? (
        <div
          data-ocid="clients.empty_state"
          className="text-center py-16 text-muted-foreground font-body"
        >
          <p className="font-display text-2xl font-light mb-2">
            No clients found
          </p>
          <p className="text-sm">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <>
          {/* MOBILE CARD LAYOUT */}
          <div className="md:hidden space-y-3">
            {filtered.map((client, idx) => {
              const stats = getWeekStats(client.id);
              const freq = client.sessionFrequency;
              const alertBg = getAlertColor(stats.attended, stats.missed, freq);
              const freqNum = FREQ_NUM[freq] ?? 0;
              return (
                <div
                  key={client.id}
                  data-ocid={`clients.row.${idx + 1}`}
                  className="rounded-xl p-4 border transition-all"
                  style={{
                    backgroundColor: alertBg ?? "oklch(0.12 0.006 260)",
                    borderColor: alertBg
                      ? "oklch(0.82 0.14 85 / 0.4)"
                      : "oklch(0.22 0.008 260)",
                  }}
                >
                  {/* Top: name + status */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-body font-semibold text-base text-foreground">
                        {client.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {client.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {client.phone}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        className="text-xs font-body"
                        style={{
                          backgroundColor:
                            client.status === "Active"
                              ? "oklch(0.88 0.04 145)"
                              : "oklch(0.9 0.01 75)",
                          color:
                            client.status === "Active"
                              ? "oklch(0.35 0.085 150)"
                              : "oklch(0.5 0.02 75)",
                          border: "none",
                        }}
                      >
                        {client.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-body">
                        {client.sessionFrequency}/week
                      </Badge>
                    </div>
                  </div>

                  {/* Session counter */}
                  {freqNum > 0 && (
                    <div className="mb-3 flex items-center justify-center gap-2">
                      <span
                        className="text-xs font-body px-2.5 py-1 rounded-full font-medium"
                        style={{
                          backgroundColor:
                            stats.attended >= freqNum
                              ? "oklch(0.85 0.14 185 / 0.15)"
                              : alertBg
                                ? "oklch(0.82 0.14 85 / 0.2)"
                                : "oklch(0.22 0.008 260)",
                          color:
                            stats.attended >= freqNum
                              ? "oklch(0.85 0.14 185)"
                              : alertBg
                                ? "oklch(0.72 0.14 85)"
                                : "oklch(0.55 0.01 80)",
                        }}
                      >
                        {stats.attended} of {freqNum} sessions this week
                      </span>
                      {alertBg && (
                        <span
                          className="text-xs"
                          style={{ color: "oklch(0.72 0.14 85)" }}
                        >
                          ⚠
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => openSchedule(client)}
                      data-ocid={`clients.schedule.open_modal_button.${idx + 1}`}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-body font-medium transition-all min-h-[44px]"
                      style={{
                        backgroundColor: hasSchedule(client.id)
                          ? "oklch(0.85 0.14 185 / 0.15)"
                          : "oklch(0.18 0.006 260)",
                        color: hasSchedule(client.id)
                          ? "oklch(0.85 0.14 185)"
                          : "oklch(0.55 0.01 80)",
                        border: "1px solid oklch(0.28 0.008 260)",
                      }}
                    >
                      <CalendarDays size={14} /> Schedule
                    </button>
                    <button
                      type="button"
                      onClick={() => openSummary(client)}
                      data-ocid={`clients.summary.open_modal_button.${idx + 1}`}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-body font-medium transition-all min-h-[44px]"
                      style={{
                        backgroundColor: "oklch(0.18 0.006 260)",
                        color: "oklch(0.55 0.01 80)",
                        border: "1px solid oklch(0.28 0.008 260)",
                      }}
                    >
                      <BarChart2 size={14} /> Summary
                    </button>
                    <button
                      type="button"
                      onClick={() => openCredentials(client)}
                      data-ocid={`clients.credentials.open_modal_button.${idx + 1}`}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-body font-medium transition-all min-h-[44px]"
                      style={{
                        backgroundColor: hasCredentials(client.id)
                          ? "oklch(0.85 0.14 185 / 0.15)"
                          : "oklch(0.18 0.006 260)",
                        color: hasCredentials(client.id)
                          ? "oklch(0.85 0.14 185)"
                          : "oklch(0.55 0.01 80)",
                        border: "1px solid oklch(0.28 0.008 260)",
                      }}
                    >
                      <KeyRound size={14} />{" "}
                      {hasCredentials(client.id) ? "Credentials" : "Generate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(client)}
                      data-ocid={`clients.edit_button.${idx + 1}`}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-body font-medium transition-all min-h-[44px]"
                      style={{
                        backgroundColor: "oklch(0.18 0.006 260)",
                        color: "oklch(0.55 0.01 80)",
                        border: "1px solid oklch(0.28 0.008 260)",
                      }}
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(client)}
                      data-ocid={`clients.delete_button.${idx + 1}`}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-body font-medium transition-all min-h-[44px]"
                      style={{
                        backgroundColor: "oklch(0.18 0.006 260)",
                        color: "oklch(0.65 0.15 25)",
                        border: "1px solid oklch(0.28 0.008 260)",
                      }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE LAYOUT */}
          <div className="hidden md:block rounded-lg border border-border/60 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table data-ocid="clients.table">
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    {[
                      "Name",
                      "Phone",
                      "Frequency",
                      "Sessions This Week",
                      "Payment",
                      "Reformer",
                      "Status",
                      "Credentials",
                      "Actions",
                    ].map((h) => (
                      <TableHead
                        key={h}
                        className="font-body font-medium text-xs uppercase tracking-widest text-muted-foreground"
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((client, idx) => {
                    const stats = getWeekStats(client.id);
                    const freq = client.sessionFrequency;
                    const alertBg = getAlertColor(
                      stats.attended,
                      stats.missed,
                      freq,
                    );
                    const freqNum = FREQ_NUM[freq] ?? 0;
                    return (
                      <TableRow
                        key={client.id}
                        data-ocid={`clients.row.${idx + 1}`}
                        className={cn("transition-colors")}
                        style={
                          alertBg ? { backgroundColor: alertBg } : undefined
                        }
                      >
                        <TableCell>
                          <div>
                            <p className="font-body font-medium text-sm text-foreground">
                              {client.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {client.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-body text-sm">
                          {client.phone}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="font-body text-xs"
                          >
                            {client.sessionFrequency}/week
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {freqNum > 0 ? (
                            <span
                              className="text-xs font-body px-2 py-1 rounded-full"
                              style={{
                                backgroundColor:
                                  stats.attended >= freqNum
                                    ? "oklch(0.85 0.14 185 / 0.15)"
                                    : alertBg
                                      ? "oklch(0.82 0.14 85 / 0.2)"
                                      : "oklch(0.18 0.006 260)",
                                color:
                                  stats.attended >= freqNum
                                    ? "oklch(0.85 0.14 185)"
                                    : alertBg
                                      ? "oklch(0.72 0.14 85)"
                                      : "oklch(0.55 0.01 80)",
                              }}
                            >
                              {stats.attended} / {freqNum}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-body text-sm">
                          <div>
                            <p className="font-medium">
                              ₹{client.feeAmount.toLocaleString("en-IN")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {client.paymentCycle}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className="font-body text-xs"
                            style={{
                              backgroundColor: "oklch(0.88 0.04 145)",
                              color: "oklch(0.35 0.07 148)",
                              border: "none",
                            }}
                          >
                            {client.assignedReformer}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className="font-body text-xs"
                            style={{
                              backgroundColor:
                                client.status === "Active"
                                  ? "oklch(0.88 0.04 145)"
                                  : "oklch(0.9 0.01 75)",
                              color:
                                client.status === "Active"
                                  ? "oklch(0.35 0.085 150)"
                                  : "oklch(0.5 0.02 75)",
                              border: "none",
                            }}
                          >
                            {client.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {hasCredentials(client.id) ? (
                            <Badge
                              className="font-body text-xs cursor-pointer"
                              style={{
                                backgroundColor: "oklch(0.85 0.14 185 / 0.15)",
                                color: "oklch(0.85 0.14 185)",
                                border: "none",
                              }}
                              onClick={() => openCredentials(client)}
                            >
                              <KeyRound size={10} className="mr-1" />
                              Issued
                            </Badge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openCredentials(client)}
                              className="h-8 text-xs font-body px-2 gap-1"
                              style={{ color: "oklch(0.55 0.01 80)" }}
                              data-ocid={`clients.credentials.open_modal_button.${idx + 1}`}
                            >
                              <KeyRound size={11} />
                              Generate
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openSchedule(client)}
                              className="h-8 w-8 p-0"
                              title="Set Schedule"
                              data-ocid={`clients.schedule.open_modal_button.${idx + 1}`}
                              style={{
                                color: hasSchedule(client.id)
                                  ? "oklch(0.85 0.14 185)"
                                  : "oklch(0.45 0.01 80)",
                              }}
                            >
                              <CalendarDays size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openSummary(client)}
                              className="h-8 w-8 p-0"
                              title="Monthly Summary"
                              data-ocid={`clients.summary.open_modal_button.${idx + 1}`}
                              style={{ color: "oklch(0.55 0.01 80)" }}
                            >
                              <BarChart2 size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(client)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                              data-ocid={`clients.edit_button.${idx + 1}`}
                            >
                              <Pencil size={13} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(client)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              data-ocid={`clients.delete_button.${idx + 1}`}
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {/* ======== CLIENT FORM DIALOG ======== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          data-ocid="clients.form.dialog"
          className="max-w-lg w-[95vw] font-body max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-light">
              {editingClient ? "Edit Client" : "New Client"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Name *
                </Label>
                <Input
                  data-ocid="clients.form.name.input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Full name"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p
                    data-ocid="clients.form.name.error_state"
                    className="text-xs text-destructive"
                  >
                    {errors.name}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Email *
                </Label>
                <Input
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="email@example.com"
                  type="email"
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Phone / WhatsApp *
                </Label>
                <Input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="+91 98765 00000"
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Plan Start Date
                </Label>
                <Input
                  type="date"
                  value={form.planStartDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, planStartDate: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Frequency
                </Label>
                <Select
                  value={form.sessionFrequency}
                  onValueChange={(v) =>
                    handleFreqOrCycleChange(
                      v as Client["sessionFrequency"],
                      form.paymentCycle,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["1x", "2x", "3x"] as const).map((v) => (
                      <SelectItem key={v} value={v}>
                        {v} / week
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Payment Cycle
                </Label>
                <Select
                  value={form.paymentCycle}
                  onValueChange={(v) =>
                    handleFreqOrCycleChange(
                      form.sessionFrequency,
                      v as Client["paymentCycle"],
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Monthly", "Quarterly", "6-Month"].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Reformer
                </Label>
                <Select
                  value={form.assignedReformer}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      assignedReformer: v as Client["assignedReformer"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["R1", "R2", "R3"].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Fee Amount (₹)
                </Label>
                <Input
                  type="number"
                  value={form.feeAmount}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      feeAmount: Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                  className={errors.feeAmount ? "border-destructive" : ""}
                />
                {errors.feeAmount && (
                  <p className="text-xs text-destructive">{errors.feeAmount}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Status
                </Label>
                <div className="flex items-center gap-3 pt-2">
                  <Switch
                    checked={form.status === "Active"}
                    onCheckedChange={(checked) =>
                      setForm((f) => ({
                        ...f,
                        status: checked ? "Active" : "Inactive",
                      }))
                    }
                    data-ocid="clients.form.status.switch"
                  />
                  <span className="text-sm font-body">{form.status}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="clients.form.cancel_button"
              className="font-body"
            >
              Cancel
            </Button>
            <Button
              data-ocid="clients.form.submit_button"
              onClick={handleSubmit}
              className="font-body"
              style={{
                backgroundColor: "oklch(0.52 0.085 150)",
                color: "oklch(0.99 0.005 80)",
              }}
            >
              {editingClient ? "Save Changes" : "Add Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======== CREDENTIALS DIALOG ======== */}
      <Dialog open={credDialogOpen} onOpenChange={setCredDialogOpen}>
        <DialogContent
          data-ocid="clients.credentials.dialog"
          className="max-w-sm w-[95vw] font-body"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-light">
              {hasCredentials(credClient?.id ?? "")
                ? "Update Credentials"
                : "Generate Credentials"}
            </DialogTitle>
          </DialogHeader>
          {credClient && (
            <p
              className="text-sm font-body"
              style={{ color: "oklch(0.55 0.01 80)" }}
            >
              Set login credentials for{" "}
              <strong style={{ color: "oklch(0.85 0.14 185)" }}>
                {credClient.name}
              </strong>
            </p>
          )}
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Username *
              </Label>
              <Input
                data-ocid="clients.credentials.username.input"
                value={credUsername}
                onChange={(e) => setCredUsername(e.target.value)}
                placeholder="e.g. sofia.m"
                className={credErrors.username ? "border-destructive" : ""}
              />
              {credErrors.username && (
                <p className="text-xs text-destructive">
                  {credErrors.username}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Password *
              </Label>
              <Input
                data-ocid="clients.credentials.password.input"
                type="password"
                value={credPassword}
                onChange={(e) => setCredPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className={credErrors.password ? "border-destructive" : ""}
              />
              {credErrors.password && (
                <p className="text-xs text-destructive">
                  {credErrors.password}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCredDialogOpen(false)}
              data-ocid="clients.credentials.cancel_button"
              className="font-body"
            >
              Cancel
            </Button>
            <Button
              data-ocid="clients.credentials.submit_button"
              onClick={handleCredSubmit}
              className="font-body"
              style={{
                backgroundColor: "oklch(0.52 0.085 150)",
                color: "oklch(0.99 0.005 80)",
              }}
            >
              Save Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======== SCHEDULE DIALOG ======== */}
      <Dialog open={schedDialogOpen} onOpenChange={setSchedDialogOpen}>
        <DialogContent
          data-ocid="clients.schedule.dialog"
          className="max-w-xl w-[98vw] font-body max-h-[92vh] overflow-hidden flex flex-col p-0"
        >
          <DialogHeader
            className="px-6 pt-6 pb-3 border-b"
            style={{ borderColor: "oklch(0.22 0.008 260)" }}
          >
            <DialogTitle className="font-display text-xl font-light">
              Schedule —{" "}
              <span style={{ color: "oklch(0.85 0.14 185)" }}>
                {schedClient?.name}
              </span>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="px-6 py-4 space-y-5">
              {/* Frequency dropdown */}
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Weekly Frequency
                </Label>
                <Select
                  value={schedFreq}
                  onValueChange={(v) => setSchedFreq(v as "1x" | "2x" | "3x")}
                >
                  <SelectTrigger
                    data-ocid="clients.schedule.frequency.select"
                    className="min-h-[44px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["1x", "2x", "3x"] as const).map((v) => (
                      <SelectItem
                        key={v}
                        value={v}
                        className="min-h-[44px] flex items-center"
                      >
                        {FREQ_LABELS[v]} ({v})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Day toggles — Mon to Sun */}
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Select Days (Mon – Sun)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {OPERATING_DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      data-ocid="clients.schedule.day.toggle"
                      className="px-3 py-2 rounded-lg text-xs font-medium transition-all min-h-[44px] min-w-[48px]"
                      style={{
                        backgroundColor: daySlots[day]
                          ? "oklch(0.85 0.14 185 / 0.2)"
                          : "oklch(0.15 0.006 260)",
                        color: daySlots[day]
                          ? "oklch(0.85 0.14 185)"
                          : "oklch(0.5 0.01 80)",
                        border: daySlots[day]
                          ? "1.5px solid oklch(0.85 0.14 185 / 0.5)"
                          : "1.5px solid oklch(0.22 0.008 260)",
                        fontWeight: daySlots[day] ? 600 : 400,
                      }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time slots & reformers per active day */}
              {activeDays.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Time Slots & Reformers
                  </Label>
                  <div className="space-y-2">
                    {activeDays.map((day) => (
                      <div
                        key={day}
                        className="flex flex-wrap items-center gap-2 p-3 rounded-lg"
                        style={{ backgroundColor: "oklch(0.13 0.005 260)" }}
                      >
                        <span
                          className="text-xs font-semibold w-8"
                          style={{ color: "oklch(0.85 0.14 185)" }}
                        >
                          {day}
                        </span>
                        <Select
                          value={daySlots[day]?.slot ?? TIME_SLOTS[0]}
                          onValueChange={(v) =>
                            setDaySlots((prev) => ({
                              ...prev,
                              [day]: { ...prev[day]!, slot: v },
                            }))
                          }
                        >
                          <SelectTrigger className="flex-1 min-w-[160px] h-9 text-xs min-h-[44px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_SLOTS.map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={daySlots[day]?.reformer ?? "R1"}
                          onValueChange={(v) =>
                            setDaySlots((prev) => ({
                              ...prev,
                              [day]: {
                                ...prev[day]!,
                                reformer: v as "R1" | "R2" | "R3",
                              },
                            }))
                          }
                        >
                          <SelectTrigger className="w-20 h-9 text-xs min-h-[44px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {REFORMERS.map((r) => (
                              <SelectItem key={r} value={r} className="text-xs">
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeDays.length === 0 && (
                <p
                  className="text-xs text-center py-4"
                  style={{ color: "oklch(0.4 0.01 80)" }}
                >
                  Toggle days above to assign time slots
                </p>
              )}

              {/* ---- Attendance tracking ---- */}
              {schedClient &&
                activeDays.length > 0 &&
                (() => {
                  const weekRec = getWeekRecord(schedClient.id, currentWeekKey);
                  const stats = getWeekStats(schedClient.id);
                  const freq = schedFreq;
                  const freqNum = FREQ_NUM[freq] ?? 0;

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                          Attendance — This Week
                        </Label>
                        <span
                          className="text-xs font-body px-2 py-1 rounded-full"
                          style={{
                            backgroundColor:
                              stats.attended >= freqNum
                                ? "oklch(0.85 0.14 185 / 0.15)"
                                : "oklch(0.22 0.008 260)",
                            color:
                              stats.attended >= freqNum
                                ? "oklch(0.85 0.14 185)"
                                : "oklch(0.55 0.01 80)",
                          }}
                        >
                          {stats.attended} of {freqNum} completed
                        </span>
                      </div>

                      <div className="space-y-2">
                        {activeDays.map((day) => {
                          const dayStatus: DayAttendanceStatus =
                            weekRec?.days[day] ?? "Pending";
                          return (
                            <div
                              key={day}
                              className="p-3 rounded-lg"
                              style={{
                                backgroundColor: "oklch(0.13 0.005 260)",
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span
                                  className="text-xs font-semibold"
                                  style={{ color: "oklch(0.85 0.14 185)" }}
                                >
                                  {day}
                                </span>
                                <span
                                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                  style={{
                                    backgroundColor:
                                      STATUS_STYLES[dayStatus].bg,
                                    color: STATUS_STYLES[dayStatus].color,
                                  }}
                                >
                                  {dayStatus}
                                </span>
                              </div>
                              <AttendancePill
                                clientId={schedClient.id}
                                day={day}
                                status={dayStatus}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
            </div>
          </ScrollArea>

          <div
            className="px-6 py-4 border-t flex gap-3 justify-end"
            style={{ borderColor: "oklch(0.22 0.008 260)" }}
          >
            <Button
              variant="outline"
              onClick={() => setSchedDialogOpen(false)}
              data-ocid="clients.schedule.cancel_button"
              className="font-body"
            >
              Cancel
            </Button>
            <Button
              data-ocid="clients.schedule.submit_button"
              onClick={handleSchedSave}
              className="font-body min-h-[44px]"
              style={{
                backgroundColor: "oklch(0.52 0.085 150)",
                color: "oklch(0.99 0.005 80)",
              }}
            >
              Save Schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ======== MONTHLY SUMMARY DIALOG ======== */}
      <Dialog open={summaryDialogOpen} onOpenChange={setSummaryDialogOpen}>
        <DialogContent
          data-ocid="clients.summary.dialog"
          className="max-w-2xl w-[98vw] font-body max-h-[92vh] overflow-hidden flex flex-col p-0"
        >
          <DialogHeader
            className="px-6 pt-6 pb-3 border-b"
            style={{ borderColor: "oklch(0.22 0.008 260)" }}
          >
            <DialogTitle className="font-display text-xl font-light">
              <span style={{ color: "oklch(0.85 0.14 185)" }}>
                {summaryClient?.name}
              </span>{" "}
              — Monthly Summary
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-y-auto">
            {summaryClient &&
              (() => {
                const monthRows = getMonthlySummaryRows(summaryClient.id);
                const { totalAttended, totalScheduled, pct } = getMonthlyStats(
                  summaryClient.id,
                );
                const monthLabel = new Date().toLocaleDateString("en-IN", {
                  month: "long",
                  year: "numeric",
                });

                return (
                  <div className="px-6 py-5 space-y-5">
                    {/* Summary stats */}
                    <div
                      className="rounded-xl p-4 flex flex-wrap gap-6"
                      style={{ backgroundColor: "oklch(0.13 0.005 260)" }}
                    >
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                          Month
                        </p>
                        <p className="font-body font-semibold text-foreground">
                          {monthLabel}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                          Attendance
                        </p>
                        <p
                          className="font-body font-bold text-2xl"
                          style={{
                            color:
                              pct >= 80
                                ? "oklch(0.85 0.14 185)"
                                : pct >= 50
                                  ? "oklch(0.82 0.14 85)"
                                  : "oklch(0.75 0.18 25)",
                          }}
                        >
                          {pct}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                          Sessions
                        </p>
                        <p className="font-body font-semibold text-foreground">
                          {totalAttended} / {totalScheduled} completed
                        </p>
                      </div>
                    </div>

                    {/* Weekly breakdown table */}
                    {monthRows.length === 0 ? (
                      <div
                        data-ocid="clients.summary.empty_state"
                        className="text-center py-12"
                      >
                        <p className="font-display text-xl font-light text-muted-foreground">
                          No data yet
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Attendance data will appear here as the month
                          progresses.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
                          Weekly Log
                        </p>
                        <div
                          className="rounded-lg border overflow-hidden"
                          style={{ borderColor: "oklch(0.22 0.008 260)" }}
                        >
                          <Table data-ocid="clients.summary.table">
                            <TableHeader>
                              <TableRow
                                style={{
                                  backgroundColor: "oklch(0.13 0.005 260)",
                                }}
                              >
                                {[
                                  "Week",
                                  "Attended",
                                  "Missed",
                                  "Pending",
                                  "%",
                                ].map((h) => (
                                  <TableHead
                                    key={h}
                                    className="text-xs uppercase tracking-widest text-muted-foreground font-medium"
                                  >
                                    {h}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {monthRows.map(
                                (rec: WeeklyAttendance, i: number) => {
                                  const vals = Object.values(rec.days);
                                  const attended = vals.filter(
                                    (v) => v === "Attended",
                                  ).length;
                                  const missed = vals.filter(
                                    (v) => v === "Missed",
                                  ).length;
                                  const pending = vals.filter(
                                    (v) => v === "Pending",
                                  ).length;
                                  const total = vals.length;
                                  const weekPct =
                                    total > 0
                                      ? Math.round((attended / total) * 100)
                                      : 0;
                                  return (
                                    <TableRow
                                      key={rec.weekKey}
                                      data-ocid={`clients.summary.row.${i + 1}`}
                                    >
                                      <TableCell className="text-sm font-body">
                                        {weekRangeLabel(rec.weekKey)}
                                      </TableCell>
                                      <TableCell>
                                        <span
                                          className="text-sm font-medium"
                                          style={{
                                            color: "oklch(0.85 0.14 185)",
                                          }}
                                        >
                                          {attended}
                                        </span>
                                      </TableCell>
                                      <TableCell>
                                        <span
                                          className="text-sm font-medium"
                                          style={{
                                            color: "oklch(0.75 0.18 25)",
                                          }}
                                        >
                                          {missed}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-sm text-muted-foreground">
                                        {pending}
                                      </TableCell>
                                      <TableCell>
                                        <span
                                          className="text-xs font-body px-2 py-0.5 rounded-full"
                                          style={{
                                            backgroundColor:
                                              weekPct >= 80
                                                ? "oklch(0.85 0.14 185 / 0.15)"
                                                : "oklch(0.22 0.008 260)",
                                            color:
                                              weekPct >= 80
                                                ? "oklch(0.85 0.14 185)"
                                                : "oklch(0.55 0.01 80)",
                                          }}
                                        >
                                          {weekPct}%
                                        </span>
                                      </TableCell>
                                    </TableRow>
                                  );
                                },
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
          </ScrollArea>

          <div
            className="px-6 py-4 border-t flex justify-end"
            style={{ borderColor: "oklch(0.22 0.008 260)" }}
          >
            <Button
              variant="outline"
              onClick={() => setSummaryDialogOpen(false)}
              data-ocid="clients.summary.close_button"
              className="font-body min-h-[44px]"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
