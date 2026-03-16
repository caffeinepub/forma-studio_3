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
import { Info, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useSessions } from "../hooks/useSessions";
import type { Session } from "../types";

const todayStr = new Date().toISOString().split("T")[0];

const EMPTY_FORM: Omit<Session, "id"> = {
  name: "",
  date: todayStr,
  time: "07:30",
  duration: 60,
  trainer: "",
  sessionType: "Reformer Group",
  reformerAssignment: "R1",
  capacity: 6,
  enrolled: 0,
};

function isValidTimeSlot(time: string): boolean {
  if (!time) return false;
  const [h, m] = time.split(":").map(Number);
  const mins = h * 60 + m;
  const morningStart = 7 * 60 + 30;
  const morningEnd = 12 * 60;
  const eveningStart = 16 * 60;
  const eveningEnd = 20 * 60;
  return (
    (mins >= morningStart && mins <= morningEnd) ||
    (mins >= eveningStart && mins <= eveningEnd)
  );
}

function formatDuration(mins: number) {
  return mins >= 60 ? `${mins / 60}h` : `${mins}min`;
}

export function Sessions() {
  const { sessions, addSession, updateSession, deleteSession } = useSessions();
  const [dateFilter, setDateFilter] = useState(todayStr);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [form, setForm] = useState<Omit<Session, "id">>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const filtered = useMemo(() => {
    return sessions
      .filter((s) => !dateFilter || s.date === dateFilter)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [sessions, dateFilter]);

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
    if (!form.trainer.trim()) e.trainer = "Trainer is required";
    if (!form.date) e.date = "Date is required";
    if (!isValidTimeSlot(form.time))
      e.time =
        "Time must be within morning (7:30–12:00) or evening (16:00–20:00) slots";
    if (form.enrolled > form.capacity)
      e.enrolled = "Enrolled cannot exceed capacity";
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-4xl font-light text-foreground">
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
          Add Session
        </Button>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-3">
        <Label className="text-xs font-body font-medium uppercase tracking-widest text-muted-foreground">
          Date
        </Label>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-44 font-body text-sm"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDateFilter("")}
          className="font-body text-xs text-muted-foreground"
        >
          Show All
        </Button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div
          data-ocid="sessions.empty_state"
          className="text-center py-16 text-muted-foreground font-body"
        >
          <p className="font-display text-2xl font-light mb-2">
            No sessions found
          </p>
          <p className="text-sm">
            Try selecting a different date or add a new session.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border/60 shadow-card overflow-hidden">
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
                  "Occupancy",
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
              {filtered.map((s, idx) => {
                const style = typeBadgeStyle(s.sessionType);
                return (
                  <TableRow
                    key={s.id}
                    data-ocid={`sessions.row.${idx + 1}`}
                    className="hover:bg-muted/20"
                  >
                    <TableCell className="font-body font-medium text-sm text-foreground">
                      {s.name}
                    </TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground">
                      {s.date}
                    </TableCell>
                    <TableCell className="font-body font-medium text-sm">
                      {s.time}
                    </TableCell>
                    <TableCell className="font-body text-sm">
                      {formatDuration(s.duration)}
                    </TableCell>
                    <TableCell className="font-body text-sm">
                      {s.trainer}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className="font-body text-xs border-0"
                        style={{
                          backgroundColor: style.bg,
                          color: style.color,
                        }}
                      >
                        {s.sessionType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {s.reformerAssignment !== "None" ? (
                        <Badge
                          className="font-body text-xs border-0"
                          style={{
                            backgroundColor: "oklch(0.88 0.04 145)",
                            color: "oklch(0.35 0.07 148)",
                          }}
                        >
                          {s.reformerAssignment}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-body text-sm font-medium">
                        {s.enrolled}
                      </span>
                      <span className="text-muted-foreground font-body text-sm">
                        {" "}
                        / {s.capacity}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(s)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          data-ocid={`sessions.edit_button.${idx + 1}`}
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(s)}
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
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          data-ocid="sessions.form.dialog"
          className="max-w-lg font-body"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-light">
              {editingSession ? "Edit Session" : "New Session"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Session Name *
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Morning Flow"
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
                <Input
                  value={form.trainer}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, trainer: e.target.value }))
                  }
                  placeholder="Trainer name"
                  className={errors.trainer ? "border-destructive" : ""}
                />
                {errors.trainer && (
                  <p className="text-xs text-destructive">{errors.trainer}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Date *
                </Label>
                <Input
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
                  Time *
                  <Info size={11} className="text-muted-foreground" />
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

            <div className="grid grid-cols-3 gap-4">
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
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Capacity
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      capacity: Number.parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Enrolled
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={form.enrolled}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      enrolled: Number.parseInt(e.target.value) || 0,
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
