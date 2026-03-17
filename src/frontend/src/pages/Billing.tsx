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
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  IndianRupee,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useClients } from "../hooks/useClients";
import { usePayments } from "../hooks/usePayments";
import { useReminders } from "../hooks/useReminders";
import { useRenewals } from "../hooks/useRenewals";
import type { Client, Payment, RenewalRecord } from "../types";

const FEE_LOOKUP: Record<string, Record<string, number>> = {
  Monthly: { "1x": 4000, "2x": 7500, "3x": 10500 },
  Quarterly: { "1x": 11000, "2x": 21000, "3x": 29000 },
  "6-Month": { "1x": 20000, "2x": 39000, "3x": 54000 },
};

const CYCLE_DAYS: Record<string, number> = {
  Monthly: 30,
  Quarterly: 90,
  "6-Month": 180,
};

function calcNextDue(client: Client): Date {
  const base = new Date(client.lastPaidDate || client.planStartDate);
  base.setDate(base.getDate() + CYCLE_DAYS[client.paymentCycle]);
  return base;
}

function daysUntil(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / 86400000);
}

function billingStatus(days: number): {
  label: string;
  bg: string;
  color: string;
} {
  if (days < 0)
    return {
      label: "Overdue",
      bg: "oklch(0.18 0.04 15)",
      color: "oklch(0.65 0.1 15)",
    };
  if (days <= 7)
    return {
      label: "Due Soon",
      bg: "oklch(0.22 0.07 60)",
      color: "oklch(0.78 0.12 60)",
    };
  return {
    label: "Paid",
    bg: "oklch(0.2 0.05 185)",
    color: "oklch(0.75 0.12 185)",
  };
}

export function Billing() {
  const { clients, updateClient } = useClients();
  const { payments, addPayment, deletePayment } = usePayments();
  const { settings, saveSettings } = useReminders();
  const { renewals, addRenewal, updateRenewal } = useRenewals();

  // Billing overview data
  const billingData = useMemo(
    () =>
      clients.map((c) => {
        const nextDue = calcNextDue(c);
        const days = daysUntil(nextDue);
        return { client: c, nextDue, days, status: billingStatus(days) };
      }),
    [clients],
  );

  const totalMonthlyRevenue = useMemo(() => {
    const now = new Date();
    return payments
      .filter((p) => {
        const d = new Date(p.date);
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth()
        );
      })
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const outstandingDues = useMemo(
    () =>
      billingData
        .filter((b) => b.days < 0)
        .reduce((sum, b) => sum + b.client.feeAmount, 0),
    [billingData],
  );

  const renewalsIn7Days = useMemo(
    () => billingData.filter((b) => b.days >= 0 && b.days <= 7).length,
    [billingData],
  );

  // Payment log
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payClientFilter, setPayClientFilter] = useState("all");
  const [payForm, setPayForm] = useState({
    clientId: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    method: "UPI" as Payment["method"],
    notes: "",
  });

  function openPayDialog() {
    setPayForm({
      clientId: clients[0]?.id ?? "",
      amount: clients[0]?.feeAmount ?? 0,
      date: new Date().toISOString().split("T")[0],
      method: "UPI",
      notes: "",
    });
    setPayDialogOpen(true);
  }

  function handleLogPayment() {
    if (!payForm.clientId) {
      toast.error("Select a client");
      return;
    }
    if (!payForm.amount) {
      toast.error("Enter an amount");
      return;
    }
    const client = clients.find((c) => c.id === payForm.clientId);
    addPayment({ ...payForm, id: crypto.randomUUID() });
    if (client) {
      const nextDue = new Date(payForm.date);
      nextDue.setDate(nextDue.getDate() + CYCLE_DAYS[client.paymentCycle]);
      updateClient({
        ...client,
        lastPaidDate: payForm.date,
        nextDueDate: nextDue.toISOString().split("T")[0],
      });
    }
    toast.success("Payment logged");
    setPayDialogOpen(false);
  }

  const filteredPayments = useMemo(
    () =>
      payments
        .filter(
          (p) => payClientFilter === "all" || p.clientId === payClientFilter,
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [payments, payClientFilter],
  );

  // Reminders
  const [reminderForm, setReminderForm] = useState(settings);
  const reminderSentLog: Record<string, boolean> = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("forma_reminder_sent_log") || "{}",
      );
    } catch {
      return {};
    }
  }, []);

  function saveReminderSettings() {
    saveSettings(reminderForm);
    toast.success("Reminder settings saved");
  }

  const reminderQueue = useMemo(
    () =>
      billingData.flatMap((b) =>
        reminderForm.triggerDays
          .filter((td) => b.days >= 0 && b.days <= td)
          .map((td) => ({ ...b, triggerDay: td })),
      ),
    [billingData, reminderForm.triggerDays],
  );

  function buildMessage(client: Client, dueDate: Date) {
    return reminderForm.messageTemplate
      .replace("{client_name}", client.name)
      .replace("{amount}", client.feeAmount.toLocaleString("en-IN"))
      .replace("{due_date}", dueDate.toLocaleDateString("en-IN"))
      .replace("{studio_name}", reminderForm.studioName);
  }

  function sendWhatsApp(client: Client, dueDate: Date) {
    const msg = buildMessage(client, dueDate);
    const phone = client.phone.replace(/\D/g, "");
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
    // Mark as sent
    const log = {
      ...reminderSentLog,
      [`${client.id}_${reminderForm.triggerDays[0]}`]: true,
    };
    localStorage.setItem("forma_reminder_sent_log", JSON.stringify(log));
    toast.success("Opening WhatsApp");
  }

  // Renewals
  const autoRenewals = useMemo(
    () => billingData.filter((b) => b.days <= 7),
    [billingData],
  );

  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [upgradingClient, setUpgradingClient] = useState<Client | null>(null);
  const [upgradeForm, setUpgradeForm] = useState({
    cycle: "Monthly" as Client["paymentCycle"],
    freq: "2x" as Client["sessionFrequency"],
  });

  function handleRenewSame(client: Client, renewal?: RenewalRecord) {
    const newStart = new Date().toISOString().split("T")[0];
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + CYCLE_DAYS[client.paymentCycle]);
    updateClient({
      ...client,
      planStartDate: newStart,
      lastPaidDate: newStart,
      nextDueDate: nextDue.toISOString().split("T")[0],
    });
    if (renewal) updateRenewal({ ...renewal, status: "Renewed" });
    else
      addRenewal({
        id: crypto.randomUUID(),
        clientId: client.id,
        oldCycle: client.paymentCycle,
        oldFrequency: client.sessionFrequency,
        oldFee: client.feeAmount,
        cycleEndDate: new Date().toISOString().split("T")[0],
        status: "Renewed",
      });
    toast.success(`${client.name} renewed on same plan`);
  }

  function handleUpgrade() {
    if (!upgradingClient) return;
    const newFee =
      FEE_LOOKUP[upgradeForm.cycle]?.[upgradeForm.freq] ??
      upgradingClient.feeAmount;
    const newStart = new Date().toISOString().split("T")[0];
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + CYCLE_DAYS[upgradeForm.cycle]);
    updateClient({
      ...upgradingClient,
      paymentCycle: upgradeForm.cycle,
      sessionFrequency: upgradeForm.freq,
      feeAmount: newFee,
      planStartDate: newStart,
      lastPaidDate: newStart,
      nextDueDate: nextDue.toISOString().split("T")[0],
    });
    const existing = renewals.find(
      (r) => r.clientId === upgradingClient.id && r.status === "Pending",
    );
    if (existing) updateRenewal({ ...existing, status: "Upgraded" });
    else
      addRenewal({
        id: crypto.randomUUID(),
        clientId: upgradingClient.id,
        oldCycle: upgradingClient.paymentCycle,
        oldFrequency: upgradingClient.sessionFrequency,
        oldFee: upgradingClient.feeAmount,
        cycleEndDate: new Date().toISOString().split("T")[0],
        status: "Upgraded",
      });
    toast.success(
      `${upgradingClient.name} upgraded to ${upgradeForm.freq}/wk ${upgradeForm.cycle}`,
    );
    setUpgradeDialogOpen(false);
  }

  function handleDeactivate(client: Client, renewal?: RenewalRecord) {
    updateClient({ ...client, status: "Inactive" });
    if (renewal) updateRenewal({ ...renewal, status: "Deactivated" });
    else
      addRenewal({
        id: crypto.randomUUID(),
        clientId: client.id,
        oldCycle: client.paymentCycle,
        oldFrequency: client.sessionFrequency,
        oldFee: client.feeAmount,
        cycleEndDate: new Date().toISOString().split("T")[0],
        status: "Deactivated",
      });
    toast.success(`${client.name} deactivated`);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-3xl md:text-4xl font-light text-foreground">
          Billing
        </h2>
        <p className="text-sm text-muted-foreground mt-1 font-body">
          Payments, reminders & renewals
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList data-ocid="billing.tabs">
          <TabsTrigger
            value="overview"
            data-ocid="billing.overview.tab"
            className="font-body"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            data-ocid="billing.payments.tab"
            className="font-body"
          >
            Payments
          </TabsTrigger>
          <TabsTrigger
            value="reminders"
            data-ocid="billing.reminders.tab"
            className="font-body"
          >
            Reminders
          </TabsTrigger>
          <TabsTrigger
            value="renewals"
            data-ocid="billing.renewals.tab"
            className="font-body"
          >
            Renewals
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: "Monthly Revenue",
                value: `\u20b9${totalMonthlyRevenue.toLocaleString("en-IN")}`,
                icon: IndianRupee,
                color: "oklch(0.75 0.12 185)",
              },
              {
                label: "Outstanding Dues",
                value: `\u20b9${outstandingDues.toLocaleString("en-IN")}`,
                icon: AlertCircle,
                color: "oklch(0.65 0.1 15)",
              },
              {
                label: "Renewals in 7 Days",
                value: renewalsIn7Days,
                icon: Clock,
                color: "oklch(0.78 0.12 60)",
              },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.label}
                  className="rounded-lg border border-border/60 p-5"
                  style={{ backgroundColor: "oklch(0.13 0.008 260)" }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={16} style={{ color: m.color }} />
                    <span className="font-body text-xs text-muted-foreground uppercase tracking-widest">
                      {m.label}
                    </span>
                  </div>
                  <p
                    className="font-display text-3xl font-light"
                    style={{ color: m.color }}
                  >
                    {m.value}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="rounded-lg border border-border/60 overflow-hidden">
            <div className="overflow-x-auto">
              <Table data-ocid="billing.overview.table">
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    {[
                      "Client",
                      "Cycle",
                      "Freq",
                      "Fee",
                      "Last Paid",
                      "Next Due",
                      "Days",
                      "Status",
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
                  {billingData.map((b, idx) => (
                    <TableRow
                      key={b.client.id}
                      data-ocid={`billing.overview.row.${idx + 1}`}
                      className="hover:bg-muted/20"
                    >
                      <TableCell>
                        <p className="font-body font-medium text-sm">
                          {b.client.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {b.client.phone}
                        </p>
                      </TableCell>
                      <TableCell className="font-body text-sm">
                        {b.client.paymentCycle}
                      </TableCell>
                      <TableCell className="font-body text-sm">
                        {b.client.sessionFrequency}/wk
                      </TableCell>
                      <TableCell className="font-body text-sm font-medium">
                        ₹{b.client.feeAmount.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground">
                        {b.client.lastPaidDate ?? "—"}
                      </TableCell>
                      <TableCell className="font-body text-sm">
                        {b.nextDue.toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <span
                          className="font-body text-sm font-medium"
                          style={{ color: b.status.color }}
                        >
                          {b.days < 0
                            ? `${Math.abs(b.days)}d ago`
                            : `${b.days}d`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className="font-body text-xs border-0"
                          style={{
                            backgroundColor: b.status.bg,
                            color: b.status.color,
                          }}
                        >
                          {b.status.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* PAYMENTS */}
        <TabsContent value="payments" className="space-y-6 mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Label className="text-xs font-body uppercase tracking-widest text-muted-foreground">
                Filter by Client
              </Label>
              <Select
                value={payClientFilter}
                onValueChange={setPayClientFilter}
              >
                <SelectTrigger
                  className="w-48 font-body"
                  data-ocid="billing.payments.client_filter.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              data-ocid="billing.payments.add.open_modal_button"
              onClick={openPayDialog}
              className="gap-2 font-body"
              style={{
                backgroundColor: "oklch(0.52 0.085 150)",
                color: "oklch(0.99 0.005 80)",
              }}
            >
              <Plus size={16} />
              Log Payment
            </Button>
          </div>

          {filteredPayments.length === 0 ? (
            <div
              data-ocid="billing.payments.empty_state"
              className="text-center py-16 text-muted-foreground font-body"
            >
              <p className="font-display text-2xl font-light mb-2">
                No payments yet
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <div className="overflow-x-auto">
                <Table data-ocid="billing.payments.table">
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      {["Date", "Client", "Amount", "Method", "Notes", ""].map(
                        (h) => (
                          <TableHead
                            key={h}
                            className="font-body font-medium text-xs uppercase tracking-widest text-muted-foreground"
                          >
                            {h}
                          </TableHead>
                        ),
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((p, idx) => {
                      const client = clients.find((c) => c.id === p.clientId);
                      return (
                        <TableRow
                          key={p.id}
                          data-ocid={`billing.payments.row.${idx + 1}`}
                          className="hover:bg-muted/20"
                        >
                          <TableCell className="font-body text-sm">
                            {p.date}
                          </TableCell>
                          <TableCell className="font-body font-medium text-sm">
                            {client?.name ?? p.clientId}
                          </TableCell>
                          <TableCell
                            className="font-body font-medium text-sm"
                            style={{ color: "oklch(0.75 0.12 185)" }}
                          >
                            ₹{p.amount.toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className="font-body text-xs border-0"
                              style={{
                                backgroundColor: "oklch(0.18 0.03 260)",
                                color: "oklch(0.65 0.015 260)",
                              }}
                            >
                              {p.method}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-body text-sm text-muted-foreground">
                            {p.notes || "—"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                deletePayment(p.id);
                                toast.success("Payment deleted");
                              }}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              data-ocid={`billing.payments.delete_button.${idx + 1}`}
                            >
                              <Trash2 size={13} />
                            </Button>
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

        {/* REMINDERS */}
        <TabsContent value="reminders" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div
              className="rounded-lg border border-border/60 p-5 space-y-4"
              style={{ backgroundColor: "oklch(0.13 0.008 260)" }}
            >
              <h3 className="font-display text-xl font-light">
                Reminder Settings
              </h3>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Studio Name
                </Label>
                <Input
                  value={reminderForm.studioName}
                  onChange={(e) =>
                    setReminderForm((f) => ({
                      ...f,
                      studioName: e.target.value,
                    }))
                  }
                  placeholder="The Pilates Studio"
                  className="font-body"
                  data-ocid="billing.reminders.studio_name.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Studio WhatsApp
                </Label>
                <Input
                  value={reminderForm.studioWhatsApp}
                  onChange={(e) =>
                    setReminderForm((f) => ({
                      ...f,
                      studioWhatsApp: e.target.value,
                    }))
                  }
                  placeholder="+91 98765 00000"
                  className="font-body"
                  data-ocid="billing.reminders.whatsapp.input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Trigger Days Before Due
                </Label>
                <div className="flex gap-3">
                  {[1, 3, 5, 7].map((d) => (
                    <label
                      key={d}
                      className="flex items-center gap-1.5 text-sm font-body cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={reminderForm.triggerDays.includes(d)}
                        onChange={(e) => {
                          setReminderForm((f) => ({
                            ...f,
                            triggerDays: e.target.checked
                              ? [...f.triggerDays, d].sort((a, b) => a - b)
                              : f.triggerDays.filter((x) => x !== d),
                          }));
                        }}
                        data-ocid={`billing.reminders.trigger_${d}.checkbox`}
                      />
                      {d}d
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Message Template
                </Label>
                <p className="text-xs text-muted-foreground font-body">
                  Variables: &#123;client_name&#125; &#123;amount&#125;
                  &#123;due_date&#125; &#123;studio_name&#125;
                </p>
                <Textarea
                  value={reminderForm.messageTemplate}
                  onChange={(e) =>
                    setReminderForm((f) => ({
                      ...f,
                      messageTemplate: e.target.value,
                    }))
                  }
                  className="font-body text-sm min-h-24 resize-none"
                  data-ocid="billing.reminders.template.textarea"
                />
              </div>
              <Button
                onClick={saveReminderSettings}
                className="w-full font-body"
                style={{
                  backgroundColor: "oklch(0.52 0.085 150)",
                  color: "oklch(0.99 0.005 80)",
                }}
                data-ocid="billing.reminders.save.button"
              >
                Save Settings
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="font-display text-xl font-light">
                Reminders Queue
              </h3>
              {reminderQueue.length === 0 ? (
                <div
                  data-ocid="billing.reminders.empty_state"
                  className="text-center py-10 text-muted-foreground font-body rounded-lg border border-border/60"
                >
                  <CheckCircle2
                    size={32}
                    className="mx-auto mb-2"
                    style={{ color: "oklch(0.75 0.12 185)" }}
                  />
                  <p className="text-sm">No reminders due right now.</p>
                </div>
              ) : (
                <div className="rounded-lg border border-border/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table data-ocid="billing.reminders.table">
                      <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          {["Client", "Due", "Trigger", "Actions"].map((h) => (
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
                        {reminderQueue.map((r, idx) => (
                          <TableRow
                            key={`${r.client.id}-${r.triggerDay}`}
                            data-ocid={`billing.reminders.row.${idx + 1}`}
                            className="hover:bg-muted/20"
                          >
                            <TableCell>
                              <p className="font-body font-medium text-sm">
                                {r.client.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {r.client.phone}
                              </p>
                            </TableCell>
                            <TableCell>
                              <p className="font-body text-sm">
                                {r.nextDue.toLocaleDateString("en-IN")}
                              </p>
                              <p
                                className="text-xs font-body"
                                style={{ color: r.status.color }}
                              >
                                {r.days}d left
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className="font-body text-xs border-0"
                                style={{
                                  backgroundColor: "oklch(0.22 0.07 60)",
                                  color: "oklch(0.78 0.12 60)",
                                }}
                              >
                                {r.triggerDay}d before
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    sendWhatsApp(r.client, r.nextDue)
                                  }
                                  className="gap-1 font-body text-xs h-7"
                                  style={{
                                    backgroundColor: "oklch(0.3 0.08 150)",
                                    color: "oklch(0.9 0.05 150)",
                                  }}
                                  data-ocid={`billing.reminders.whatsapp_button.${idx + 1}`}
                                >
                                  <Send size={11} />
                                  WA
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toast.info("SMS coming soon")}
                                  className="font-body text-xs h-7"
                                  data-ocid={`billing.reminders.sms_button.${idx + 1}`}
                                >
                                  SMS
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
            </div>
          </div>
        </TabsContent>

        {/* RENEWALS */}
        <TabsContent value="renewals" className="space-y-6 mt-6">
          {autoRenewals.length === 0 ? (
            <div
              data-ocid="billing.renewals.empty_state"
              className="text-center py-16 text-muted-foreground font-body"
            >
              <CheckCircle2
                size={40}
                className="mx-auto mb-3"
                style={{ color: "oklch(0.75 0.12 185)" }}
              />
              <p className="font-display text-2xl font-light mb-2">
                All plans up to date
              </p>
              <p className="text-sm">No renewals due in the next 7 days.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <div className="overflow-x-auto">
                <Table data-ocid="billing.renewals.table">
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      {[
                        "Client",
                        "Current Plan",
                        "Fee",
                        "Next Due",
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
                    {autoRenewals.map((b, idx) => {
                      const existingRenewal = renewals.find(
                        (r) =>
                          r.clientId === b.client.id && r.status === "Pending",
                      );
                      return (
                        <TableRow
                          key={b.client.id}
                          data-ocid={`billing.renewals.row.${idx + 1}`}
                          className="hover:bg-muted/20"
                        >
                          <TableCell>
                            <p className="font-body font-medium text-sm">
                              {b.client.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {b.client.email}
                            </p>
                          </TableCell>
                          <TableCell className="font-body text-sm">
                            {b.client.sessionFrequency}/wk ·{" "}
                            {b.client.paymentCycle}
                          </TableCell>
                          <TableCell className="font-body font-medium text-sm">
                            ₹{b.client.feeAmount.toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell>
                            <p className="font-body text-sm">
                              {b.nextDue.toLocaleDateString("en-IN")}
                            </p>
                            <p
                              className="text-xs font-body"
                              style={{ color: b.status.color }}
                            >
                              {b.days < 0
                                ? `${Math.abs(b.days)}d overdue`
                                : `${b.days}d left`}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className="font-body text-xs border-0"
                              style={{
                                backgroundColor: b.status.bg,
                                color: b.status.color,
                              }}
                            >
                              {b.status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleRenewSame(b.client, existingRenewal)
                                }
                                className="font-body text-xs h-7"
                                style={{
                                  backgroundColor: "oklch(0.2 0.05 185)",
                                  color: "oklch(0.75 0.12 185)",
                                }}
                                data-ocid={`billing.renewals.renew_same.button.${idx + 1}`}
                              >
                                Renew Same
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setUpgradingClient(b.client);
                                  setUpgradeForm({
                                    cycle: b.client.paymentCycle,
                                    freq: b.client.sessionFrequency,
                                  });
                                  setUpgradeDialogOpen(true);
                                }}
                                className="font-body text-xs h-7"
                                data-ocid={`billing.renewals.upgrade.button.${idx + 1}`}
                              >
                                Upgrade
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleDeactivate(b.client, existingRenewal)
                                }
                                className="font-body text-xs h-7 text-destructive hover:text-destructive"
                                data-ocid={`billing.renewals.deactivate.button.${idx + 1}`}
                              >
                                Deactivate
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
      </Tabs>

      {/* Log Payment Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent
          data-ocid="billing.payments.form.dialog"
          className="max-w-md w-[95vw] font-body max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-light">
              Log Payment
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Client
              </Label>
              <Select
                value={payForm.clientId}
                onValueChange={(v) => {
                  const c = clients.find((x) => x.id === v);
                  setPayForm((f) => ({
                    ...f,
                    clientId: v,
                    amount: c?.feeAmount ?? f.amount,
                  }));
                }}
              >
                <SelectTrigger data-ocid="billing.payments.form.client.select">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Amount (₹)
                </Label>
                <Input
                  type="number"
                  value={payForm.amount}
                  onChange={(e) =>
                    setPayForm((f) => ({
                      ...f,
                      amount: Number(e.target.value),
                    }))
                  }
                  data-ocid="billing.payments.form.amount.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Date
                </Label>
                <Input
                  type="date"
                  value={payForm.date}
                  onChange={(e) =>
                    setPayForm((f) => ({ ...f, date: e.target.value }))
                  }
                  data-ocid="billing.payments.form.date.input"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Method
              </Label>
              <Select
                value={payForm.method}
                onValueChange={(v) =>
                  setPayForm((f) => ({ ...f, method: v as Payment["method"] }))
                }
              >
                <SelectTrigger data-ocid="billing.payments.form.method.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Cash", "UPI", "Bank Transfer"].map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Notes
              </Label>
              <Input
                value={payForm.notes}
                onChange={(e) =>
                  setPayForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Optional notes"
                data-ocid="billing.payments.form.notes.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPayDialogOpen(false)}
              data-ocid="billing.payments.form.cancel_button"
              className="font-body"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogPayment}
              data-ocid="billing.payments.form.submit_button"
              className="font-body"
              style={{
                backgroundColor: "oklch(0.52 0.085 150)",
                color: "oklch(0.99 0.005 80)",
              }}
            >
              <CreditCard size={14} className="mr-1" />
              Log Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent
          data-ocid="billing.renewals.upgrade.dialog"
          className="max-w-sm w-[95vw] font-body max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-light">
              Upgrade Plan
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <p className="text-sm font-body text-muted-foreground">
              Upgrading plan for{" "}
              <span className="text-foreground font-medium">
                {upgradingClient?.name}
              </span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  New Cycle
                </Label>
                <Select
                  value={upgradeForm.cycle}
                  onValueChange={(v) =>
                    setUpgradeForm((f) => ({
                      ...f,
                      cycle: v as Client["paymentCycle"],
                    }))
                  }
                >
                  <SelectTrigger data-ocid="billing.renewals.upgrade.cycle.select">
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
                  Frequency
                </Label>
                <Select
                  value={upgradeForm.freq}
                  onValueChange={(v) =>
                    setUpgradeForm((f) => ({
                      ...f,
                      freq: v as Client["sessionFrequency"],
                    }))
                  }
                >
                  <SelectTrigger data-ocid="billing.renewals.upgrade.freq.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["1x", "2x", "3x"].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}/week
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-sm font-body">
              New fee:{" "}
              <span
                className="font-medium"
                style={{ color: "oklch(0.75 0.12 185)" }}
              >
                ₹
                {(
                  FEE_LOOKUP[upgradeForm.cycle]?.[upgradeForm.freq] ?? 0
                ).toLocaleString("en-IN")}
              </span>
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpgradeDialogOpen(false)}
              data-ocid="billing.renewals.upgrade.cancel_button"
              className="font-body"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpgrade}
              data-ocid="billing.renewals.upgrade.confirm_button"
              className="font-body"
              style={{
                backgroundColor: "oklch(0.52 0.085 150)",
                color: "oklch(0.99 0.005 80)",
              }}
            >
              Confirm Upgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
