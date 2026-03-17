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
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useClients } from "../hooks/useClients";
import type { Client } from "../types";

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

export function Clients() {
  const { clients, addClient, updateClient, deleteClient } = useClients();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<Omit<Client, "id">>(EMPTY_FORM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof Omit<Client, "id">, string>>
  >({});

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

  return (
    <div className="space-y-6 animate-fade-in">
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
          className="gap-2 font-body"
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

      {/* Table */}
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
        <div className="rounded-lg border border-border/60 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table data-ocid="clients.table">
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  {[
                    "Name",
                    "Phone",
                    "Frequency",
                    "Payment Cycle",
                    "Fee",
                    "Reformer",
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
                {filtered.map((client, idx) => (
                  <TableRow
                    key={client.id}
                    data-ocid={`clients.row.${idx + 1}`}
                    className="hover:bg-muted/20"
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
                      <Badge variant="outline" className="font-body text-xs">
                        {client.sessionFrequency}/week
                      </Badge>
                    </TableCell>
                    <TableCell className="font-body text-sm">
                      {client.paymentCycle}
                    </TableCell>
                    <TableCell className="font-body text-sm font-medium">
                      ₹{client.feeAmount.toLocaleString("en-IN")}
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
                        className={cn(
                          "font-body text-xs",
                          client.status === "Active"
                            ? "bg-sage-light text-sage"
                            : "",
                        )}
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
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(client)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          data-ocid={`clients.edit_button.${idx + 1}`}
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(client)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          data-ocid={`clients.delete_button.${idx + 1}`}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Dialog Form */}
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
                    {["1x", "2x", "3x"].map((v) => (
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
    </div>
  );
}
