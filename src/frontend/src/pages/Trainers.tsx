import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTrainers } from "../hooks/useTrainers";
import type { Trainer } from "../types";

const DAYS: Trainer["workingDays"][number][] = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

const EMPTY_FORM: Omit<Trainer, "id"> = {
  name: "",
  phone: "",
  specialization: "",
  workingDays: [],
  availableSlots: "Both",
  status: "Available",
};

function statusStyle(status: Trainer["status"]) {
  if (status === "Available")
    return { bg: "oklch(0.2 0.05 185)", color: "oklch(0.75 0.12 185)" };
  if (status === "On Leave")
    return { bg: "oklch(0.22 0.06 60)", color: "oklch(0.75 0.12 60)" };
  return { bg: "oklch(0.18 0.03 15)", color: "oklch(0.65 0.08 15)" };
}

function dayStyle(active: boolean) {
  return active
    ? { bg: "oklch(0.2 0.05 185)", color: "oklch(0.75 0.12 185)" }
    : { bg: "oklch(0.15 0.005 260)", color: "oklch(0.35 0.01 260)" };
}

export function Trainers() {
  const { trainers, addTrainer, updateTrainer, deleteTrainer } = useTrainers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [form, setForm] = useState<Omit<Trainer, "id">>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  function openAdd() {
    setEditingTrainer(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(t: Trainer) {
    setEditingTrainer(t);
    const { id: _id, ...rest } = t;
    setForm(rest);
    setErrors({});
    setDialogOpen(true);
  }

  function validate() {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    if (!form.specialization.trim())
      e.specialization = "Specialization is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    if (editingTrainer) {
      updateTrainer({ ...form, id: editingTrainer.id });
      toast.success(`${form.name} updated`);
    } else {
      addTrainer({ ...form, id: crypto.randomUUID() });
      toast.success(`${form.name} added`);
    }
    setDialogOpen(false);
  }

  function toggleDay(day: Trainer["workingDays"][number]) {
    setForm((f) => ({
      ...f,
      workingDays: f.workingDays.includes(day)
        ? f.workingDays.filter((d) => d !== day)
        : [...f.workingDays, day],
    }));
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl md:text-4xl font-light text-foreground">
            Trainers
          </h2>
          <p className="text-sm text-muted-foreground mt-1 font-body">
            {trainers.length} trainer{trainers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          data-ocid="trainers.add.open_modal_button"
          onClick={openAdd}
          className="gap-2 font-body"
          style={{
            backgroundColor: "oklch(0.52 0.085 150)",
            color: "oklch(0.99 0.005 80)",
          }}
        >
          <Plus size={16} />
          Add Trainer
        </Button>
      </div>

      {trainers.length === 0 ? (
        <div
          data-ocid="trainers.empty_state"
          className="text-center py-16 text-muted-foreground font-body"
        >
          <p className="font-display text-2xl font-light mb-2">
            No trainers yet
          </p>
          <p className="text-sm">Add your first trainer to get started.</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border/60 overflow-hidden">
            <div className="overflow-x-auto">
              <Table data-ocid="trainers.table">
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    {[
                      "Name",
                      "Phone",
                      "Specialization",
                      "Working Days",
                      "Slots",
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
                  {trainers.map((t, idx) => {
                    const ss = statusStyle(t.status);
                    return (
                      <TableRow
                        key={t.id}
                        data-ocid={`trainers.row.${idx + 1}`}
                        className="hover:bg-muted/20"
                      >
                        <TableCell className="font-body font-medium text-sm text-foreground">
                          {t.name}
                        </TableCell>
                        <TableCell className="font-body text-sm text-muted-foreground">
                          {t.phone}
                        </TableCell>
                        <TableCell className="font-body text-sm">
                          {t.specialization}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {DAYS.map((d) => {
                              const ds = dayStyle(t.workingDays.includes(d));
                              return (
                                <span
                                  key={d}
                                  className="text-xs px-1.5 py-0.5 rounded font-body font-medium"
                                  style={{
                                    backgroundColor: ds.bg,
                                    color: ds.color,
                                  }}
                                >
                                  {d}
                                </span>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="font-body text-sm">
                          {t.availableSlots}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className="font-body text-xs border-0"
                            style={{ backgroundColor: ss.bg, color: ss.color }}
                          >
                            {t.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(t)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              data-ocid={`trainers.edit_button.${idx + 1}`}
                            >
                              <Pencil size={13} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                deleteTrainer(t.id);
                                toast.success(`${t.name} removed`);
                              }}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              data-ocid={`trainers.delete_button.${idx + 1}`}
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

          {/* Weekly Availability Grid */}
          <div>
            <h3 className="font-display text-2xl font-light mb-4">
              Weekly Availability Grid
            </h3>
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="font-body font-medium text-xs uppercase tracking-widest text-muted-foreground px-4 py-3 text-left">
                        Trainer
                      </th>
                      {DAYS.map((d) => (
                        <th
                          key={d}
                          className="font-body font-medium text-xs uppercase tracking-widest text-muted-foreground px-3 py-3 text-center"
                        >
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trainers.map((t) => (
                      <tr
                        key={t.id}
                        className="border-t border-border/30 hover:bg-muted/10"
                      >
                        <td className="px-4 py-3 font-body font-medium text-sm">
                          {t.name}
                        </td>
                        {DAYS.map((d) => {
                          const works = t.workingDays.includes(d);
                          return (
                            <td key={d} className="px-3 py-3 text-center">
                              {works ? (
                                <span
                                  className="text-xs px-2 py-1 rounded font-body font-medium"
                                  style={{
                                    backgroundColor: "oklch(0.2 0.05 185)",
                                    color: "oklch(0.75 0.12 185)",
                                  }}
                                >
                                  {t.availableSlots === "Morning"
                                    ? "AM"
                                    : t.availableSlots === "Evening"
                                      ? "PM"
                                      : "AM/PM"}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  —
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          data-ocid="trainers.form.dialog"
          className="max-w-lg w-[95vw] font-body max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-light">
              {editingTrainer ? "Edit Trainer" : "New Trainer"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Name *
                </Label>
                <Input
                  data-ocid="trainers.form.name.input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Full name"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Phone *
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
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Specialization *
              </Label>
              <Input
                value={form.specialization}
                onChange={(e) =>
                  setForm((f) => ({ ...f, specialization: e.target.value }))
                }
                placeholder="Reformer, Core"
                className={errors.specialization ? "border-destructive" : ""}
              />
              {errors.specialization && (
                <p className="text-xs text-destructive">
                  {errors.specialization}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Working Days
              </Label>
              <div className="flex flex-wrap gap-3">
                {DAYS.map((d) => (
                  <div key={d} className="flex items-center gap-1.5">
                    <Checkbox
                      id={`day-${d}`}
                      checked={form.workingDays.includes(d)}
                      onCheckedChange={() => toggleDay(d)}
                      data-ocid={`trainers.form.day_${d.toLowerCase()}.checkbox`}
                    />
                    <label
                      htmlFor={`day-${d}`}
                      className="text-sm font-body cursor-pointer"
                    >
                      {d}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Available Slots
                </Label>
                <Select
                  value={form.availableSlots}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      availableSlots: v as Trainer["availableSlots"],
                    }))
                  }
                >
                  <SelectTrigger data-ocid="trainers.form.slots.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Morning", "Evening", "Both"].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Status
                </Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, status: v as Trainer["status"] }))
                  }
                >
                  <SelectTrigger data-ocid="trainers.form.status.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Available", "On Leave", "Unavailable"].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="trainers.form.cancel_button"
              className="font-body"
            >
              Cancel
            </Button>
            <Button
              data-ocid="trainers.form.submit_button"
              onClick={handleSubmit}
              className="font-body"
              style={{
                backgroundColor: "oklch(0.52 0.085 150)",
                color: "oklch(0.99 0.005 80)",
              }}
            >
              {editingTrainer ? "Save Changes" : "Add Trainer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
