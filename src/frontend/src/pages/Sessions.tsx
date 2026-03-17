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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Pencil,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useChangeRequests } from "../hooks/useChangeRequests";
import { useSessions } from "../hooks/useSessions";
import { useTrainers } from "../hooks/useTrainers";
import type { Session, Trainer } from "../types";

const todayStr = new Date().toISOString().split("T")[0];

const EMPTY_FORM: Omit<Session, "id"> = {
  name: "",
  date: todayStr,
  time: "07:30",
  duration: 60,
  trainer: "",
  sessionType: "Reformer Group",
  reformerAssignment: "R1",
  capacity: 3,
  enrolled: 0,
};

function isValidTimeSlot(time: string): boolean {
  if (!time) return false;
  const [h, m] = time.split(":").map(Number);
  const mins = h * 60 + m;
  return (
    (mins >= 7 * 60 + 30 && mins <= 12 * 60) ||
    (mins >= 16 * 60 && mins <= 20 * 60)
  );
}

function getTimeSlot(time: string): "Morning" | "Evening" | null {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  const mins = h * 60 + m;
  if (mins >= 7 * 60 + 30 && mins <= 12 * 60) return "Morning";
  if (mins >= 16 * 60 && mins <= 20 * 60) return "Evening";
  return null;
}

const DAY_MAP: Record<number, Trainer["workingDays"][number]> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

function isTrainerAvailable(
  trainer: Trainer,
  date: string,
  time: string,
): boolean {
  if (trainer.status !== "Available") return false;
  const dayOfWeek = new Date(date).getDay();
  const dayName = DAY_MAP[dayOfWeek];
  if (!trainer.workingDays.includes(dayName)) return false;
  const slot = getTimeSlot(time);
  if (!slot) return true;
  if (trainer.availableSlots === "Both") return true;
  return trainer.availableSlots === slot;
}

function formatDuration(mins: number) {
  return mins >= 60 ? `${mins / 60}h` : `${mins}min`;
}

export function Sessions() {
  const { sessions, addSession, updateSession, deleteSession } = useSessions();
  const { trainers } = useTrainers();
  const { requests, updateRequestStatus, pendingCount } = useChangeRequests();

  const [dateFilter, setDateFilter] = useState(todayStr);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [form, setForm] = useState<Omit<Session, "id">>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [activeTab, setActiveTab] = useState("schedule");

  const filtered = useMemo(() => {
    return sessions
      .filter((s) => !dateFilter || s.date === dateFilter)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [sessions, dateFilter]);

  const trainerWarning = useMemo(() => {
    if (!form.trainer || !form.date || !form.time) return null;
    const trainer = trainers.find((t) => t.name === form.trainer);
    if (!trainer) return null;
    if (!isTrainerAvailable(trainer, form.date, form.time)) {
      return `${trainer.name} is not available for this day/slot`;
    }
    return null;
  }, [form.trainer, form.date, form.time, trainers]);

  const reformerWarning = useMemo(() => {
    if (form.reformerAssignment === "None" || !form.date || !form.time)
      return null;
    const conflicting = sessions.filter(
      (s) =>
        s.date === form.date &&
        s.reformerAssignment === form.reformerAssignment &&
        s.id !== editingSession?.id,
    );
    if (conflicting.length >= 1) {
      return `${form.reformerAssignment} may already be assigned on this date`;
    }
    return null;
  }, [sessions, form.date, form.time, form.reformerAssignment, editingSession]);

  function openAdd() {
    setEditingSession(null);
    setForm({ ...EMPTY_FORM, date: dateFilter || todayStr });
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(session: Session) {
    setEditingSession(session);
    const { id: _id, ...rest } = session;
    setForm(rest);
    setErrors({});
    setDialogOpen(true);
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Session name is required";
    if (!form.trainer) e.trainer = "Trainer is required";
    if (!form.date) e.date = "Date is required";
    if (!isValidTimeSlot(form.time))
      e.time =
        "Time must be within morning (7:30–12:00) or evening (16:00–20:00) slots";
    if (form.enrolled > form.capacity)
      e.enrolled = "Enrolled cannot exceed capacity";
    if (form.capacity > 3) e.capacity = "Maximum 3 clients per session";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    if (editingSession) {
      updateSession({ ...form, id: editingSession.id });
      toast.success(`${form.name} updated`);
    } else {
      addSession({ ...form, id: crypto.randomUUID() });
      toast.success(`${form.name} scheduled`);
    }
    setDialogOpen(false);
  }

  function handleDelete(session: Session) {
    deleteSession(session.id);
    toast.success(`${session.name} removed`);
  }

  const typeBadgeStyle = (type: Session["sessionType"]) => {
    if (type === "Reformer Group")
      return { bg: "oklch(0.88 0.04 145)", color: "oklch(0.35 0.085 150)" };
    if (type === "Private")
      return { bg: "oklch(0.93 0.07 65)", color: "oklch(0.45 0.1 60)" };
    return { bg: "oklch(0.9 0.03 220)", color: "oklch(0.42 0.07 220)" };
  };

  function getSessionName(sessionId: string) {
    return sessions.find((s) => s.id === sessionId)?.name ?? sessionId;
  }

  const statusBadge = (status: string) => {
    if (status === "pending")
      return {
        bg: "oklch(0.93 0.07 65 / 0.2)",
        color: "oklch(0.65 0.12 60)",
        label: "Pending",
      };
    if (status === "approved")
      return {
        bg: "oklch(0.88 0.04 145 / 0.2)",
        color: "oklch(0.52 0.085 150)",
        label: "Approved",
      };
    return {
      bg: "oklch(0.65 0.1 25 / 0.2)",
      color: "oklch(0.65 0.15 25)",
      label: "Declined",
    };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl md:text-4xl font-light text-foreground">
            Sessions
          </h2>
          <p className="text-sm text-muted-foreground mt-1 font-body">
            {sessions.length} total sessions
          </p>
        </div>
        <Button
          data-ocid="sessions.add.open_modal_button"
          onClick={openAdd}
          className="gap-2 font-body"
          style={{
            backgroundColor: "oklch(0.52 0.085 150)",
            color: "oklch(0.99 0.005 80)",
          }}
        >
          <Plus size={16} />
          Schedule Session
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="font-body">
          <TabsTrigger value="schedule" data-ocid="sessions.schedule.tab">
            Schedule
          </TabsTrigger>
          <TabsTrigger
            value="change-requests"
            data-ocid="sessions.change_requests.tab"
            className="relative"
          >
            Change Requests
            {pendingCount > 0 && (
              <Badge
                className="ml-1.5 text-[10px] h-4 min-w-4 px-1 font-body"
                style={{
                  backgroundColor: "oklch(0.65 0.15 25)",
                  color: "white",
                  border: "none",
                }}
              >
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Schedule tab */}
        <TabsContent value="schedule" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="space-y-0.5">
              <Label className="text-xs font-body uppercase tracking-widest text-muted-foreground">
                Filter by date
              </Label>
              <Input
                data-ocid="sessions.date_filter.input"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="font-body w-auto"
              />
            </div>
            {dateFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDateFilter("")}
                className="font-body text-xs mt-4"
                style={{ color: "oklch(0.55 0.01 80)" }}
              >
                Clear filter
              </Button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div
              data-ocid="sessions.empty_state"
              className="text-center py-16 text-muted-foreground font-body"
            >
              <p className="font-display text-2xl font-light mb-2">
                No sessions found
              </p>
              <p className="text-sm">
                Try a different date or schedule a new session.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <div className="overflow-x-auto">
                <Table data-ocid="sessions.table">
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      {[
                        "Session",
                        "Date",
                        "Time",
                        "Duration",
                        "Trainer",
                        "Type",
                        "Reformer",
                        "Capacity",
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
                    {filtered.map((session, idx) => {
                      const style = typeBadgeStyle(session.sessionType);
                      return (
                        <TableRow
                          key={session.id}
                          data-ocid={`sessions.row.${idx + 1}`}
                          className="hover:bg-muted/20"
                        >
                          <TableCell className="font-body font-medium text-sm text-foreground">
                            {session.name}
                          </TableCell>
                          <TableCell className="font-body text-sm text-muted-foreground">
                            {session.date}
                          </TableCell>
                          <TableCell className="font-body text-sm">
                            {session.time}
                          </TableCell>
                          <TableCell className="font-body text-sm text-muted-foreground">
                            {formatDuration(session.duration)}
                          </TableCell>
                          <TableCell className="font-body text-sm">
                            {session.trainer}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className="font-body text-xs"
                              style={{
                                backgroundColor: style.bg,
                                color: style.color,
                                border: "none",
                              }}
                            >
                              {session.sessionType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {session.reformerAssignment !== "None" ? (
                              <Badge
                                className="font-body text-xs"
                                style={{
                                  backgroundColor: "oklch(0.88 0.04 145)",
                                  color: "oklch(0.35 0.07 148)",
                                  border: "none",
                                }}
                              >
                                {session.reformerAssignment}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-body text-sm">
                              {session.enrolled}/{session.capacity}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(session)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                data-ocid={`sessions.edit_button.${idx + 1}`}
                              >
                                <Pencil size={13} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(session)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                data-ocid={`sessions.delete_button.${idx + 1}`}
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
          )}
        </TabsContent>

        {/* Change Requests tab */}
        <TabsContent value="change-requests" className="mt-4">
          {requests.length === 0 ? (
            <div
              data-ocid="sessions.change_requests.empty_state"
              className="text-center py-16 text-muted-foreground font-body"
            >
              <p className="font-display text-2xl font-light mb-2">
                No change requests
              </p>
              <p className="text-sm">
                Client requests to reschedule sessions will appear here.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <div className="overflow-x-auto">
                <Table data-ocid="sessions.change_requests.table">
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      {[
                        "Client",
                        "Session",
                        "Current Time",
                        "Requested",
                        "Note",
                        "Status",
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
                    {requests.map((req, idx) => {
                      const badge = statusBadge(req.status);
                      const sessionDT = new Date(req.sessionDateTime);
                      return (
                        <TableRow
                          key={req.id}
                          data-ocid={`sessions.change_requests.row.${idx + 1}`}
                          className="hover:bg-muted/20"
                        >
                          <TableCell>
                            <p className="font-body font-medium text-sm text-foreground">
                              {req.clientName}
                            </p>
                          </TableCell>
                          <TableCell className="font-body text-sm">
                            {getSessionName(req.sessionId)}
                          </TableCell>
                          <TableCell className="font-body text-sm text-muted-foreground">
                            {sessionDT.toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}{" "}
                            {req.sessionDateTime.split("T")[1]}
                          </TableCell>
                          <TableCell className="font-body text-sm">
                            {req.requestedDate} {req.requestedTime}
                          </TableCell>
                          <TableCell className="font-body text-sm text-muted-foreground max-w-[140px] truncate">
                            {req.note || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className="font-body text-xs"
                              style={{
                                backgroundColor: badge.bg,
                                color: badge.color,
                                border: "none",
                              }}
                            >
                              {badge.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {req.status === "pending" ? (
                              <div className="flex gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  data-ocid={`sessions.change_requests.approve_button.${idx + 1}`}
                                  onClick={() => {
                                    updateRequestStatus(req.id, "approved");
                                    toast.success("Request approved");
                                  }}
                                  className="h-7 w-7 p-0 hover:text-green-500"
                                  style={{ color: "oklch(0.52 0.085 150)" }}
                                  title="Approve"
                                >
                                  <CheckCircle2 size={14} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  data-ocid={`sessions.change_requests.decline_button.${idx + 1}`}
                                  onClick={() => {
                                    updateRequestStatus(req.id, "declined");
                                    toast.success("Request declined");
                                  }}
                                  className="h-7 w-7 p-0 hover:text-destructive"
                                  style={{ color: "oklch(0.55 0.1 25)" }}
                                  title="Decline"
                                >
                                  <XCircle size={14} />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs font-body text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Session form dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          data-ocid="sessions.form.dialog"
          className="max-w-lg w-[95vw] font-body max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-light">
              {editingSession ? "Edit Session" : "Schedule Session"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Session Name *
                </Label>
                <Input
                  data-ocid="sessions.form.name.input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Morning Flow"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Trainer *
                </Label>
                <Select
                  value={form.trainer}
                  onValueChange={(v) => setForm((f) => ({ ...f, trainer: v }))}
                >
                  <SelectTrigger
                    className={errors.trainer ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Select trainer" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainers.map((t) => (
                      <SelectItem key={t.id} value={t.name}>
                        {t.name}{" "}
                        {t.status !== "Available" ? `(${t.status})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {trainerWarning && (
                  <p
                    className="text-xs flex items-center gap-1"
                    style={{ color: "oklch(0.78 0.12 60)" }}
                  >
                    <AlertTriangle size={11} />
                    {trainerWarning}
                  </p>
                )}
                {errors.trainer && (
                  <p className="text-xs text-destructive">{errors.trainer}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Date *
                </Label>
                <Input
                  data-ocid="sessions.form.date.input"
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  className={errors.date ? "border-destructive" : ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  Time * <Info size={11} className="text-muted-foreground" />
                </Label>
                <Input
                  data-ocid="sessions.form.time.input"
                  type="time"
                  value={form.time}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, time: e.target.value }))
                  }
                  className={errors.time ? "border-destructive" : ""}
                  min="07:30"
                  max="20:00"
                />
                {errors.time ? (
                  <p
                    data-ocid="sessions.form.time.error_state"
                    className="text-xs text-destructive"
                  >
                    {errors.time}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Morning: 7:30–12:00 · Evening: 16:00–20:00
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Duration
                </Label>
                <Select
                  value={String(form.duration)}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, duration: Number(v) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[45, 60, 90].map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {formatDuration(d)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Type
                </Label>
                <Select
                  value={form.sessionType}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      sessionType: v as Session["sessionType"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Reformer Group", "Private", "Mat"].map((v) => (
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
                  value={form.reformerAssignment}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      reformerAssignment: v as Session["reformerAssignment"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["R1", "R2", "R3", "None"].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {reformerWarning && (
                  <p
                    className="text-xs flex items-center gap-1"
                    style={{ color: "oklch(0.78 0.12 60)" }}
                  >
                    <AlertTriangle size={11} />
                    {reformerWarning}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Capacity (max 3)
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={3}
                  value={form.capacity}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      capacity: Math.min(
                        3,
                        Number.parseInt(e.target.value) || 1,
                      ),
                    }))
                  }
                  className={errors.capacity ? "border-destructive" : ""}
                />
                {errors.capacity && (
                  <p className="text-xs text-destructive">{errors.capacity}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Enrolled
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={3}
                  value={form.enrolled}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      enrolled: Math.min(
                        3,
                        Number.parseInt(e.target.value) || 0,
                      ),
                    }))
                  }
                  className={errors.enrolled ? "border-destructive" : ""}
                />
                {errors.enrolled && (
                  <p className="text-xs text-destructive">{errors.enrolled}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="sessions.form.cancel_button"
              className="font-body"
            >
              Cancel
            </Button>
            <Button
              data-ocid="sessions.form.submit_button"
              onClick={handleSubmit}
              className="font-body"
              style={{
                backgroundColor: "oklch(0.52 0.085 150)",
                color: "oklch(0.99 0.005 80)",
              }}
            >
              {editingSession ? "Save Changes" : "Schedule Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
