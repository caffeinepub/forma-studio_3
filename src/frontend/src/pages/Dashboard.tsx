import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, CircleDollarSign, Dumbbell, Users } from "lucide-react";
import { useMemo } from "react";
import { useClients } from "../hooks/useClients";
import { useReformers } from "../hooks/useReformers";
import { useSessions } from "../hooks/useSessions";

const today = new Date().toISOString().split("T")[0];

function getFeeDueCount(clients: ReturnType<typeof useClients>["clients"]) {
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return clients.filter((c) => {
    if (c.status !== "Active") return false;
    const start = new Date(c.planStartDate).getTime();
    const cycleMs =
      c.paymentCycle === "Monthly"
        ? 30 * 24 * 60 * 60 * 1000
        : c.paymentCycle === "Quarterly"
          ? 90 * 24 * 60 * 60 * 1000
          : 180 * 24 * 60 * 60 * 1000;
    const elapsed = now - start;
    const cyclesSince = Math.floor(elapsed / cycleMs);
    const nextDue = start + (cyclesSince + 1) * cycleMs;
    return nextDue - now <= sevenDays && nextDue - now >= 0;
  }).length;
}

export function Dashboard() {
  const { clients } = useClients();
  const { sessions } = useSessions();
  const { reformers } = useReformers();

  const activeClients = useMemo(
    () => clients.filter((c) => c.status === "Active").length,
    [clients],
  );
  const todaySessions = useMemo(
    () => sessions.filter((s) => s.date === today),
    [sessions],
  );
  const reformersInUse = useMemo(
    () => reformers.filter((r) => r.status === "Occupied").length,
    [reformers],
  );
  const feesDue = useMemo(() => getFeeDueCount(clients), [clients]);

  const metrics = [
    {
      label: "Active Clients",
      value: activeClients,
      icon: Users,
      ocid: "dashboard.active_clients.card",
      color: "oklch(0.52 0.085 150)",
      bg: "oklch(0.88 0.04 145)",
    },
    {
      label: "Today's Sessions",
      value: todaySessions.length,
      icon: CalendarDays,
      ocid: "dashboard.todays_sessions.card",
      color: "oklch(0.55 0.08 210)",
      bg: "oklch(0.9 0.04 210)",
    },
    {
      label: "Reformers In Use",
      value: `${reformersInUse} / 3`,
      icon: Dumbbell,
      ocid: "dashboard.reformers_in_use.card",
      color: "oklch(0.62 0.1 65)",
      bg: "oklch(0.92 0.06 70)",
    },
    {
      label: "Fees Due Soon",
      value: feesDue,
      icon: CircleDollarSign,
      ocid: "dashboard.fees_due.card",
      color: "oklch(0.58 0.16 25)",
      bg: "oklch(0.92 0.06 30)",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="font-display text-3xl md:text-4xl font-light text-foreground">
          Dashboard
        </h2>
        <p className="text-sm text-muted-foreground mt-1 font-body">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card
              key={m.label}
              data-ocid={m.ocid}
              className="shadow-card border-border/60 hover:shadow-soft transition-shadow duration-200"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-body font-medium text-muted-foreground uppercase tracking-widest mb-2">
                      {m.label}
                    </p>
                    <p
                      className="font-display text-4xl font-light"
                      style={{ color: m.color }}
                    >
                      {m.value}
                    </p>
                  </div>
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mt-0.5"
                    style={{ backgroundColor: m.bg }}
                  >
                    <Icon size={18} style={{ color: m.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Today's Schedule */}
      <div>
        <h3 className="font-display text-2xl font-light text-foreground mb-4">
          Today's Schedule
        </h3>
        {todaySessions.length === 0 ? (
          <Card className="shadow-card border-border/60">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground font-body">
                No sessions scheduled for today.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-card border-border/60 overflow-hidden">
            <div
              data-ocid="dashboard.schedule.table"
              className="divide-y divide-border/60"
            >
              {todaySessions
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((session, idx) => (
                  <div
                    key={session.id}
                    data-ocid={`dashboard.schedule.row.${idx + 1}`}
                    className="flex flex-wrap items-center gap-3 md:gap-6 px-4 md:px-6 py-3 md:py-4 hover:bg-muted/40 transition-colors"
                  >
                    {/* Time */}
                    <div className="w-14 md:w-20 shrink-0">
                      <p className="font-body font-medium text-sm text-foreground">
                        {session.time}
                      </p>
                    </div>

                    {/* Name + trainer */}
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-medium text-sm text-foreground truncate">
                        {session.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-body">
                        {session.trainer}
                      </p>
                    </div>

                    {/* Type badge */}
                    <Badge
                      variant="outline"
                      className="shrink-0 text-xs font-body"
                      style={{
                        borderColor:
                          session.sessionType === "Reformer Group"
                            ? "oklch(0.52 0.085 150 / 0.5)"
                            : session.sessionType === "Private"
                              ? "oklch(0.62 0.1 65 / 0.5)"
                              : "oklch(0.55 0.08 210 / 0.5)",
                        color:
                          session.sessionType === "Reformer Group"
                            ? "oklch(0.42 0.085 150)"
                            : session.sessionType === "Private"
                              ? "oklch(0.5 0.1 65)"
                              : "oklch(0.45 0.08 210)",
                      }}
                    >
                      {session.sessionType}
                    </Badge>

                    {/* Reformer dots */}
                    <div className="flex gap-1.5 shrink-0">
                      {["R1", "R2", "R3"].map((r) => (
                        <div
                          key={r}
                          className="w-2.5 h-2.5 rounded-full transition-colors"
                          title={r}
                          style={{
                            backgroundColor:
                              session.reformerAssignment === r
                                ? "oklch(0.52 0.085 150)"
                                : "oklch(0.85 0.015 80)",
                          }}
                        />
                      ))}
                    </div>

                    {/* Occupancy */}
                    <div className="shrink-0 text-right w-14">
                      <p className="font-body font-medium text-sm text-foreground">
                        {session.enrolled} / {session.capacity}
                      </p>
                      <p className="text-xs text-muted-foreground">enrolled</p>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
