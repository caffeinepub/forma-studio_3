import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Grid3X3,
  LayoutDashboard,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { CurrentUser } from "../hooks/useAuth";
import { useChangeRequests } from "../hooks/useChangeRequests";
import { useClients } from "../hooks/useClients";
import { useReformers } from "../hooks/useReformers";
import { useSessions } from "../hooks/useSessions";

type ClientPage = "dashboard" | "reformers" | "request";

const clientNavItems = [
  {
    id: "dashboard" as ClientPage,
    label: "My Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "reformers" as ClientPage,
    label: "Reformer Availability",
    icon: Grid3X3,
  },
  {
    id: "request" as ClientPage,
    label: "Request Session Change",
    icon: RefreshCw,
  },
];

interface ClientPortalProps {
  user: CurrentUser;
  onLogout: () => void;
}

export function ClientPortal({ user, onLogout }: ClientPortalProps) {
  const [currentPage, setCurrentPage] = useState<ClientPage>("dashboard");

  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: "oklch(0.08 0.005 260)" }}
    >
      {/* Sidebar - desktop */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 h-full w-60"
        style={{ backgroundColor: "oklch(0.1 0.006 260)" }}
      >
        <div
          className="px-6 py-6 border-b flex items-center justify-center"
          style={{ borderColor: "oklch(0.22 0.008 260)" }}
        >
          <img
            src="/assets/uploads/IMG_20260317_064146-1.jpg"
            alt="The Pilates Studio"
            className="w-full object-contain"
          />
        </div>

        {/* Client name badge */}
        <div
          className="px-4 py-3 border-b"
          style={{ borderColor: "oklch(0.22 0.008 260)" }}
        >
          <p
            className="text-xs font-body uppercase tracking-widest mb-0.5"
            style={{ color: "oklch(0.45 0.01 80)" }}
          >
            Signed in as
          </p>
          <p
            className="font-body font-medium text-sm"
            style={{ color: "oklch(0.85 0.14 185)" }}
          >
            {user.username}
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {clientNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                data-ocid={`client.nav.${item.id}.link`}
                onClick={() => setCurrentPage(item.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-body font-medium transition-all duration-150"
                style={{
                  backgroundColor: isActive
                    ? "oklch(0.85 0.14 185 / 0.15)"
                    : "transparent",
                  color: isActive
                    ? "oklch(0.85 0.14 185)"
                    : "oklch(0.65 0.015 80)",
                }}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div
          className="px-4 py-5 border-t"
          style={{ borderColor: "oklch(0.22 0.008 260)" }}
        >
          <Button
            variant="ghost"
            data-ocid="client.logout.button"
            onClick={onLogout}
            className="w-full justify-start gap-2 font-body text-sm"
            style={{ color: "oklch(0.55 0.1 25)" }}
          >
            <LogOut size={15} />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b"
        style={{
          backgroundColor: "oklch(0.1 0.006 260)",
          borderColor: "oklch(0.22 0.008 260)",
        }}
      >
        <img
          src="/assets/uploads/IMG_20260317_064146-1.jpg"
          alt="The Pilates Studio"
          className="h-10 object-contain max-w-[160px]"
        />
        <button
          type="button"
          data-ocid="client.logout.button"
          onClick={onLogout}
          className="flex items-center gap-1.5 text-sm font-body px-3 py-1.5 rounded-md"
          style={{
            color: "oklch(0.55 0.1 25)",
            border: "1px solid oklch(0.4 0.08 25 / 0.4)",
          }}
        >
          <LogOut size={14} />
          Out
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-60 p-4 md:p-8 pt-20 md:pt-8 pb-20 md:pb-8">
        {currentPage === "dashboard" && <ClientDashboard user={user} />}
        {currentPage === "reformers" && <ReformerAvailability />}
        {currentPage === "request" && <RequestChange user={user} />}
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t"
        style={{
          backgroundColor: "oklch(0.1 0.006 260)",
          borderColor: "oklch(0.22 0.008 260)",
        }}
      >
        {clientNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-ocid={`mobile.client.nav.${item.id}.link`}
              onClick={() => setCurrentPage(item.id)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1"
              style={{
                color: isActive
                  ? "oklch(0.85 0.14 185)"
                  : "oklch(0.45 0.01 80)",
              }}
            >
              <Icon size={18} />
              <span className="text-[9px] font-body truncate w-full text-center">
                {item.id === "dashboard"
                  ? "Home"
                  : item.id === "reformers"
                    ? "Reformers"
                    : "Request"}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ---- Sub-sections ----

function ClientDashboard({ user }: { user: CurrentUser }) {
  const { clients } = useClients();
  const { sessions } = useSessions();
  const todayStr = new Date().toISOString().split("T")[0];

  const client = useMemo(
    () => clients.find((c) => c.id === user.clientId),
    [clients, user.clientId],
  );

  const upcomingSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.date >= todayStr)
        .sort((a, b) =>
          `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
        ),
    [sessions, todayStr],
  );

  if (!client) {
    return (
      <div className="text-center py-20">
        <p
          className="font-display text-2xl font-light"
          style={{ color: "oklch(0.55 0.01 80)" }}
        >
          Client profile not found
        </p>
        <p
          className="text-sm font-body mt-2"
          style={{ color: "oklch(0.4 0.01 80)" }}
        >
          Contact the studio admin for assistance.
        </p>
      </div>
    );
  }

  // Compute next due date (simple: planStartDate + cycle)
  function getNextDue() {
    if (!client) return "—";
    const start = new Date(client.planStartDate);
    const monthsMap: Record<string, number> = {
      Monthly: 1,
      Quarterly: 3,
      "6-Month": 6,
    };
    const months = monthsMap[client.paymentCycle] ?? 1;
    start.setMonth(start.getMonth() + months);
    return start.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="font-display text-3xl font-light"
          style={{ color: "oklch(0.97 0.005 80)" }}
        >
          Welcome, {client.name.split(" ")[0]}
        </h2>
        <p
          className="text-sm font-body mt-1"
          style={{ color: "oklch(0.55 0.01 80)" }}
        >
          Here&apos;s your studio overview
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Reformer", value: client.assignedReformer, accent: true },
          {
            label: "Frequency",
            value: `${client.sessionFrequency}/week`,
            accent: false,
          },
          {
            label: "Plan Status",
            value: client.status,
            accent: client.status === "Active",
          },
          { label: "Next Renewal", value: getNextDue(), accent: false },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl p-4 border"
            style={{
              backgroundColor: "oklch(0.12 0.006 260)",
              borderColor: "oklch(0.22 0.008 260)",
            }}
          >
            <p
              className="text-xs font-body uppercase tracking-widest mb-2"
              style={{ color: "oklch(0.45 0.01 80)" }}
            >
              {m.label}
            </p>
            <p
              className="font-display text-xl font-light"
              style={{
                color: m.accent
                  ? "oklch(0.85 0.14 185)"
                  : "oklch(0.97 0.005 80)",
              }}
            >
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Upcoming sessions */}
      <div>
        <h3
          className="font-display text-xl font-light mb-3"
          style={{ color: "oklch(0.85 0.14 185)" }}
        >
          Upcoming Sessions
        </h3>
        {upcomingSessions.length === 0 ? (
          <div
            data-ocid="client.sessions.empty_state"
            className="text-center py-10"
            style={{ color: "oklch(0.45 0.01 80)" }}
          >
            No upcoming sessions scheduled
          </div>
        ) : (
          <div
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: "oklch(0.22 0.008 260)" }}
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow
                    style={{ backgroundColor: "oklch(0.12 0.006 260)" }}
                  >
                    {["Session", "Date", "Time", "Trainer", "Reformer"].map(
                      (h) => (
                        <TableHead
                          key={h}
                          className="font-body text-xs uppercase tracking-widest"
                          style={{ color: "oklch(0.45 0.01 80)" }}
                        >
                          {h}
                        </TableHead>
                      ),
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingSessions.slice(0, 5).map((s, i) => (
                    <TableRow
                      key={s.id}
                      data-ocid={`client.sessions.item.${i + 1}`}
                      className="hover:bg-muted/10"
                    >
                      <TableCell
                        className="font-body font-medium text-sm"
                        style={{ color: "oklch(0.97 0.005 80)" }}
                      >
                        {s.name}
                      </TableCell>
                      <TableCell
                        className="font-body text-sm"
                        style={{ color: "oklch(0.7 0.01 80)" }}
                      >
                        {new Date(s.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </TableCell>
                      <TableCell
                        className="font-body text-sm"
                        style={{ color: "oklch(0.7 0.01 80)" }}
                      >
                        {s.time}
                      </TableCell>
                      <TableCell
                        className="font-body text-sm"
                        style={{ color: "oklch(0.7 0.01 80)" }}
                      >
                        {s.trainer}
                      </TableCell>
                      <TableCell>
                        {s.reformerAssignment !== "None" ? (
                          <Badge
                            className="font-body text-xs"
                            style={{
                              backgroundColor: "oklch(0.85 0.14 185 / 0.15)",
                              color: "oklch(0.85 0.14 185)",
                              border: "none",
                            }}
                          >
                            {s.reformerAssignment}
                          </Badge>
                        ) : (
                          <span
                            className="text-xs font-body"
                            style={{ color: "oklch(0.4 0.01 80)" }}
                          >
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Billing info */}
      <div
        className="rounded-xl border p-5"
        style={{
          backgroundColor: "oklch(0.12 0.006 260)",
          borderColor: "oklch(0.22 0.008 260)",
        }}
      >
        <h3
          className="font-display text-lg font-light mb-3"
          style={{ color: "oklch(0.85 0.14 185)" }}
        >
          Billing
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p
              className="text-xs font-body uppercase tracking-widest mb-1"
              style={{ color: "oklch(0.45 0.01 80)" }}
            >
              Plan
            </p>
            <p
              className="font-body text-sm"
              style={{ color: "oklch(0.97 0.005 80)" }}
            >
              {client.paymentCycle} · {client.sessionFrequency}/week
            </p>
          </div>
          <div>
            <p
              className="text-xs font-body uppercase tracking-widest mb-1"
              style={{ color: "oklch(0.45 0.01 80)" }}
            >
              Amount
            </p>
            <p
              className="font-body text-sm font-medium"
              style={{ color: "oklch(0.97 0.005 80)" }}
            >
              ₹{client.feeAmount.toLocaleString("en-IN")}
            </p>
          </div>
          <div>
            <p
              className="text-xs font-body uppercase tracking-widest mb-1"
              style={{ color: "oklch(0.45 0.01 80)" }}
            >
              Plan Start
            </p>
            <p
              className="font-body text-sm"
              style={{ color: "oklch(0.97 0.005 80)" }}
            >
              {new Date(client.planStartDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div>
            <p
              className="text-xs font-body uppercase tracking-widest mb-1"
              style={{ color: "oklch(0.45 0.01 80)" }}
            >
              Next Due
            </p>
            <p
              className="font-body text-sm"
              style={{ color: "oklch(0.85 0.14 185)" }}
            >
              {getNextDue()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReformerAvailability() {
  const { reformers } = useReformers();

  const statusConfig = {
    Available: {
      color: "oklch(0.85 0.14 185)",
      bg: "oklch(0.85 0.14 185 / 0.15)",
      label: "Available",
    },
    Occupied: {
      color: "oklch(0.78 0.12 60)",
      bg: "oklch(0.78 0.12 60 / 0.15)",
      label: "Occupied",
    },
    Maintenance: {
      color: "oklch(0.65 0.1 25)",
      bg: "oklch(0.65 0.1 25 / 0.15)",
      label: "Maintenance",
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="font-display text-3xl font-light"
          style={{ color: "oklch(0.97 0.005 80)" }}
        >
          Reformer Availability
        </h2>
        <p
          className="text-sm font-body mt-1"
          style={{ color: "oklch(0.55 0.01 80)" }}
        >
          Current status of studio reformers — read only
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {reformers.map((r) => {
          const config = statusConfig[r.status];
          return (
            <div
              key={r.id}
              data-ocid={`client.reformers.${r.id.toLowerCase()}.card`}
              className="rounded-2xl border p-6 flex flex-col items-center gap-4"
              style={{
                backgroundColor: "oklch(0.12 0.006 260)",
                borderColor: `${config.color} / 0.3`,
                border: `1px solid ${config.color}`,
              }}
            >
              {/* Big reformer letter */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: config.bg }}
              >
                <span
                  className="font-display text-4xl font-light"
                  style={{ color: config.color }}
                >
                  {r.id}
                </span>
              </div>
              <div className="text-center">
                <p
                  className="font-body font-medium text-sm mb-1"
                  style={{ color: "oklch(0.97 0.005 80)" }}
                >
                  Reformer {r.id}
                </p>
                <Badge
                  className="font-body text-xs"
                  style={{
                    backgroundColor: config.bg,
                    color: config.color,
                    border: "none",
                  }}
                >
                  {config.label}
                </Badge>
                {r.currentClient && (
                  <p
                    className="text-xs font-body mt-2"
                    style={{ color: "oklch(0.55 0.01 80)" }}
                  >
                    {r.currentClient}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="rounded-xl border px-5 py-4 flex items-center gap-3"
        style={{
          backgroundColor: "oklch(0.12 0.006 260)",
          borderColor: "oklch(0.22 0.008 260)",
        }}
      >
        <CheckCircle2
          size={15}
          style={{ color: "oklch(0.55 0.01 80)", flexShrink: 0 }}
        />
        <p
          className="text-xs font-body"
          style={{ color: "oklch(0.55 0.01 80)" }}
        >
          Reformer availability is updated in real-time by the admin. If
          you&apos;d like to change your session, go to &nbsp;
          <strong style={{ color: "oklch(0.85 0.14 185)" }}>
            Request Session Change
          </strong>
          .
        </p>
      </div>
    </div>
  );
}

function RequestChange({ user }: { user: CurrentUser }) {
  const { sessions } = useSessions();
  const { clients } = useClients();
  const { addRequest } = useChangeRequests();
  const todayStr = new Date().toISOString().split("T")[0];

  const client = useMemo(
    () => clients.find((c) => c.id === user.clientId),
    [clients, user.clientId],
  );

  const upcomingSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.date >= todayStr)
        .sort((a, b) =>
          `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
        ),
    [sessions, todayStr],
  );

  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [requestedTime, setRequestedTime] = useState("");
  const [note, setNote] = useState("");
  const [tooLateError, setTooLateError] = useState("");
  const [success, setSuccess] = useState(false);

  const selectedSession = useMemo(
    () => upcomingSessions.find((s) => s.id === selectedSessionId),
    [upcomingSessions, selectedSessionId],
  );

  function check12HourRule(): boolean {
    if (!selectedSession) return true;
    const sessionDT = new Date(
      `${selectedSession.date}T${selectedSession.time}:00`,
    );
    const now = new Date();
    const diff = sessionDT.getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);
    return hours >= 12;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTooLateError("");

    if (!selectedSession) return;
    if (!requestedDate || !requestedTime) {
      setTooLateError("Please select a new date and time.");
      return;
    }
    if (!check12HourRule()) {
      setTooLateError(
        "Requests must be submitted at least 12 hours before your session. This session is too soon to change.",
      );
      return;
    }

    addRequest({
      clientId: user.clientId ?? "",
      clientName: client?.name ?? user.username,
      sessionId: selectedSession.id,
      sessionName: selectedSession.name,
      sessionDateTime: `${selectedSession.date}T${selectedSession.time}`,
      requestedDate,
      requestedTime,
      note,
    });

    setSuccess(true);
    toast.success(
      "Change request submitted! The admin will review it shortly.",
    );
    setSelectedSessionId("");
    setRequestedDate("");
    setRequestedTime("");
    setNote("");
    setTimeout(() => setSuccess(false), 5000);
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2
          className="font-display text-3xl font-light"
          style={{ color: "oklch(0.97 0.005 80)" }}
        >
          Request Session Change
        </h2>
        <p
          className="text-sm font-body mt-1"
          style={{ color: "oklch(0.55 0.01 80)" }}
        >
          Requests must be submitted at least{" "}
          <strong style={{ color: "oklch(0.85 0.14 185)" }}>12 hours</strong>{" "}
          before your session.
        </p>
      </div>

      {success && (
        <div
          data-ocid="request.success_state"
          className="rounded-xl border px-5 py-4 flex items-center gap-3"
          style={{
            backgroundColor: "oklch(0.85 0.14 185 / 0.1)",
            borderColor: "oklch(0.85 0.14 185 / 0.3)",
          }}
        >
          <CheckCircle2 size={18} style={{ color: "oklch(0.85 0.14 185)" }} />
          <p
            className="font-body text-sm"
            style={{ color: "oklch(0.85 0.14 185)" }}
          >
            Request submitted! The admin will review and respond soon.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label
            className="text-xs font-body font-medium uppercase tracking-widest"
            style={{ color: "oklch(0.55 0.01 80)" }}
          >
            Select Session *
          </Label>
          <Select
            value={selectedSessionId}
            onValueChange={setSelectedSessionId}
          >
            <SelectTrigger
              data-ocid="request.session.select"
              className="font-body"
            >
              <SelectValue placeholder="Choose an upcoming session…" />
            </SelectTrigger>
            <SelectContent>
              {upcomingSessions.length === 0 ? (
                <SelectItem value="none" disabled>
                  No upcoming sessions
                </SelectItem>
              ) : (
                upcomingSessions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} — {s.date} {s.time}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {selectedSession &&
            (() => {
              const sessionDT = new Date(
                `${selectedSession.date}T${selectedSession.time}:00`,
              );
              const now = new Date();
              const hoursLeft =
                (sessionDT.getTime() - now.getTime()) / (1000 * 60 * 60);
              if (hoursLeft < 12) {
                return (
                  <p
                    className="text-xs font-body flex items-center gap-1"
                    style={{ color: "oklch(0.75 0.15 25)" }}
                  >
                    <AlertTriangle size={12} />
                    This session is less than 12 hours away — changes not
                    allowed.
                  </p>
                );
              }
              return (
                <p
                  className="text-xs font-body"
                  style={{ color: "oklch(0.55 0.01 80)" }}
                >
                  {Math.floor(hoursLeft)}h until session — change request
                  allowed.
                </p>
              );
            })()}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label
              className="text-xs font-body font-medium uppercase tracking-widest"
              style={{ color: "oklch(0.55 0.01 80)" }}
            >
              Preferred Date *
            </Label>
            <input
              data-ocid="request.date.input"
              type="date"
              value={requestedDate}
              onChange={(e) => setRequestedDate(e.target.value)}
              min={todayStr}
              className="flex h-9 w-full rounded-md border px-3 py-1 text-sm font-body shadow-sm transition-colors focus:outline-none focus:ring-1"
              style={{
                backgroundColor: "oklch(0.15 0.006 260)",
                borderColor: "oklch(0.22 0.008 260)",
                color: "oklch(0.97 0.005 80)",
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label
              className="text-xs font-body font-medium uppercase tracking-widest"
              style={{ color: "oklch(0.55 0.01 80)" }}
            >
              Preferred Time *
            </Label>
            <input
              data-ocid="request.time.input"
              type="time"
              value={requestedTime}
              onChange={(e) => setRequestedTime(e.target.value)}
              className="flex h-9 w-full rounded-md border px-3 py-1 text-sm font-body shadow-sm transition-colors focus:outline-none focus:ring-1"
              style={{
                backgroundColor: "oklch(0.15 0.006 260)",
                borderColor: "oklch(0.22 0.008 260)",
                color: "oklch(0.97 0.005 80)",
              }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label
            className="text-xs font-body font-medium uppercase tracking-widest"
            style={{ color: "oklch(0.55 0.01 80)" }}
          >
            Note (optional)
          </Label>
          <Textarea
            data-ocid="request.note.textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any additional details…"
            rows={3}
            className="font-body text-sm resize-none"
          />
        </div>

        {tooLateError && (
          <div
            data-ocid="request.error_state"
            className="rounded-lg px-4 py-3 flex items-start gap-2"
            style={{
              backgroundColor: "oklch(0.28 0.05 25 / 0.3)",
              border: "1px solid oklch(0.4 0.1 25 / 0.4)",
            }}
          >
            <AlertTriangle
              size={15}
              style={{
                color: "oklch(0.75 0.15 25)",
                flexShrink: 0,
                marginTop: 1,
              }}
            />
            <p
              className="text-sm font-body"
              style={{ color: "oklch(0.75 0.15 25)" }}
            >
              {tooLateError}
            </p>
          </div>
        )}

        <Button
          data-ocid="request.submit_button"
          type="submit"
          disabled={!selectedSessionId}
          className="w-full font-body"
          style={{
            backgroundColor: "oklch(0.52 0.085 150)",
            color: "oklch(0.99 0.005 80)",
          }}
        >
          <CalendarDays size={15} className="mr-2" />
          Submit Change Request
        </Button>
      </form>
    </div>
  );
}
