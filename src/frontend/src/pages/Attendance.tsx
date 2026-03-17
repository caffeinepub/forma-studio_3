import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAttendance } from "../hooks/useAttendance";
import { useClients } from "../hooks/useClients";
import { useSessions } from "../hooks/useSessions";
import type { AttendanceRecord } from "../types";

const today = new Date().toISOString().split("T")[0];

function statusBadgeStyle(status: AttendanceRecord["status"] | null) {
  if (status === "Present")
    return { bg: "oklch(0.2 0.05 185)", color: "oklch(0.75 0.12 185)" };
  if (status === "Late")
    return { bg: "oklch(0.22 0.06 60)", color: "oklch(0.75 0.12 60)" };
  if (status === "Absent")
    return { bg: "oklch(0.18 0.03 15)", color: "oklch(0.65 0.08 15)" };
  return { bg: "oklch(0.15 0.005 260)", color: "oklch(0.45 0.01 260)" };
}

export function Attendance() {
  const { sessions } = useSessions();
  const { clients } = useClients();
  const { records, upsertRecord } = useAttendance();
  const [dateFilter, setDateFilter] = useState(today);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [summaryMonth, setSummaryMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const filteredSessions = useMemo(
    () => sessions.filter((s) => s.date === dateFilter),
    [sessions, dateFilter],
  );

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId],
  );

  const sessionAttendance = useMemo(
    () => records.filter((r) => r.sessionId === selectedSessionId),
    [records, selectedSessionId],
  );

  // All clients in attendance + any enrolled but not yet marked
  const attendanceClients = useMemo(() => {
    if (!selectedSession) return [];
    // Show clients who have attendance records for this session + active clients not yet marked
    const markedClientIds = new Set(sessionAttendance.map((r) => r.clientId));
    const activeClients = clients.filter((c) => c.status === "Active");
    // Combine: marked + up to capacity unmarked
    const combined: {
      clientId: string;
      name: string;
      status: AttendanceRecord["status"] | null;
    }[] = [];
    for (const r of sessionAttendance) {
      const client = clients.find((c) => c.id === r.clientId);
      if (client)
        combined.push({
          clientId: r.clientId,
          name: client.name,
          status: r.status,
        });
    }
    // Add active clients not yet in attendance up to capacity
    for (const c of activeClients) {
      if (
        !markedClientIds.has(c.id) &&
        combined.length < selectedSession.capacity
      ) {
        combined.push({ clientId: c.id, name: c.name, status: null });
      }
    }
    return combined;
  }, [selectedSession, sessionAttendance, clients]);

  const presentCount = sessionAttendance.filter(
    (r) => r.status === "Present",
  ).length;
  const absentCount = sessionAttendance.filter(
    (r) => r.status === "Absent",
  ).length;
  const lateCount = sessionAttendance.filter((r) => r.status === "Late").length;

  function markAttendance(
    clientId: string,
    status: AttendanceRecord["status"],
  ) {
    if (!selectedSession) return;
    upsertRecord(selectedSessionId, clientId, status, selectedSession.date);
    toast.success(`Attendance marked: ${status}`);
  }

  // Monthly summary
  const monthlySummary = useMemo(() => {
    const [year, month] = summaryMonth.split("-").map(Number);
    const monthSessions = sessions.filter((s) => {
      const d = new Date(s.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
    const monthRecords = records.filter((r) => {
      const d = new Date(r.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
    return clients.map((c) => {
      const scheduled = monthSessions.length;
      const clientRecords = monthRecords.filter((r) => r.clientId === c.id);
      const attended = clientRecords.filter(
        (r) => r.status === "Present" || r.status === "Late",
      ).length;
      const absent = clientRecords.filter((r) => r.status === "Absent").length;
      const late = clientRecords.filter((r) => r.status === "Late").length;
      const pct = scheduled > 0 ? Math.round((attended / scheduled) * 100) : 0;
      return { client: c, scheduled, attended, absent, late, pct };
    });
  }, [clients, sessions, records, summaryMonth]);

  function pctColor(pct: number) {
    if (pct >= 80) return "oklch(0.75 0.12 185)";
    if (pct >= 50) return "oklch(0.75 0.12 60)";
    return "oklch(0.65 0.1 15)";
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-3xl md:text-4xl font-light text-foreground">
          Attendance
        </h2>
        <p className="text-sm text-muted-foreground mt-1 font-body">
          {records.length} records total
        </p>
      </div>

      <Tabs defaultValue="mark" className="w-full">
        <TabsList data-ocid="attendance.tabs">
          <TabsTrigger
            value="mark"
            data-ocid="attendance.mark.tab"
            className="font-body"
          >
            Mark Attendance
          </TabsTrigger>
          <TabsTrigger
            value="summary"
            data-ocid="attendance.summary.tab"
            className="font-body"
          >
            Monthly Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mark" className="space-y-6 mt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="space-y-1">
              <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Date
              </Label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setSelectedSessionId("");
                }}
                className="w-44 font-body text-sm"
                data-ocid="attendance.date.input"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Session
              </Label>
              <Select
                value={selectedSessionId}
                onValueChange={setSelectedSessionId}
              >
                <SelectTrigger
                  className="w-64 font-body"
                  data-ocid="attendance.session.select"
                >
                  <SelectValue placeholder="Select a session" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSessions.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No sessions on this date
                    </SelectItem>
                  ) : (
                    filteredSessions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} — {s.time}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedSession && (
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="font-body text-sm">
                  <span className="text-muted-foreground">Session: </span>
                  <span className="font-medium">{selectedSession.name}</span>
                  <span className="text-muted-foreground ml-2">
                    {selectedSession.time} · {selectedSession.trainer}
                  </span>
                </div>
                <div className="flex gap-3 text-xs font-body">
                  <span style={{ color: "oklch(0.75 0.12 185)" }}>
                    {presentCount} Present
                  </span>
                  <span style={{ color: "oklch(0.75 0.12 60)" }}>
                    {lateCount} Late
                  </span>
                  <span style={{ color: "oklch(0.65 0.08 15)" }}>
                    {absentCount} Absent
                  </span>
                </div>
              </div>

              {attendanceClients.length === 0 ? (
                <div
                  data-ocid="attendance.clients.empty_state"
                  className="text-center py-10 text-muted-foreground font-body"
                >
                  <p className="text-sm">
                    No clients to mark for this session.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-border/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table data-ocid="attendance.clients.table">
                      <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          {["Client", "Status", "Mark Attendance"].map((h) => (
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
                        {attendanceClients.map((ac, idx) => {
                          const ss = statusBadgeStyle(ac.status);
                          return (
                            <TableRow
                              key={ac.clientId}
                              data-ocid={`attendance.client.row.${idx + 1}`}
                              className="hover:bg-muted/20"
                            >
                              <TableCell className="font-body font-medium text-sm">
                                {ac.name}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className="font-body text-xs border-0"
                                  style={{
                                    backgroundColor: ss.bg,
                                    color: ss.color,
                                  }}
                                >
                                  {ac.status ?? "Unmarked"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  {(
                                    [
                                      "Present",
                                      "Late",
                                      "Absent",
                                    ] as AttendanceRecord["status"][]
                                  ).map((s) => (
                                    <Button
                                      key={s}
                                      size="sm"
                                      variant={
                                        ac.status === s ? "default" : "outline"
                                      }
                                      onClick={() =>
                                        markAttendance(ac.clientId, s)
                                      }
                                      className="font-body text-xs h-7 px-3"
                                      data-ocid={`attendance.mark_${s.toLowerCase()}.button.${idx + 1}`}
                                      style={
                                        ac.status === s
                                          ? {
                                              backgroundColor:
                                                "oklch(0.52 0.085 150)",
                                              color: "oklch(0.99 0.005 80)",
                                            }
                                          : {}
                                      }
                                    >
                                      {s}
                                    </Button>
                                  ))}
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
            </div>
          )}

          {!selectedSession && (
            <div
              data-ocid="attendance.empty_state"
              className="text-center py-16 text-muted-foreground font-body"
            >
              <p className="font-display text-2xl font-light mb-2">
                Select a session
              </p>
              <p className="text-sm">
                Choose a date and session to mark attendance.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="summary" className="space-y-6 mt-6">
          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Month
              </Label>
              <Input
                type="month"
                value={summaryMonth}
                onChange={(e) => setSummaryMonth(e.target.value)}
                className="w-44 font-body text-sm"
                data-ocid="attendance.month.input"
              />
            </div>
          </div>

          <div className="rounded-lg border border-border/60 overflow-hidden">
            <div className="overflow-x-auto">
              <Table data-ocid="attendance.summary.table">
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    {[
                      "Client",
                      "Scheduled",
                      "Attended",
                      "Late",
                      "Absent",
                      "Attendance %",
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
                  {monthlySummary.map((row, idx) => (
                    <TableRow
                      key={row.client.id}
                      data-ocid={`attendance.summary.row.${idx + 1}`}
                      className="hover:bg-muted/20"
                    >
                      <TableCell>
                        <p className="font-body font-medium text-sm">
                          {row.client.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {row.client.email}
                        </p>
                      </TableCell>
                      <TableCell className="font-body text-sm">
                        {row.scheduled}
                      </TableCell>
                      <TableCell className="font-body text-sm">
                        {row.attended}
                      </TableCell>
                      <TableCell className="font-body text-sm">
                        {row.late}
                      </TableCell>
                      <TableCell className="font-body text-sm">
                        {row.absent}
                      </TableCell>
                      <TableCell>
                        <span
                          className="font-body font-medium text-sm"
                          style={{ color: pctColor(row.pct) }}
                        >
                          {row.pct}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
