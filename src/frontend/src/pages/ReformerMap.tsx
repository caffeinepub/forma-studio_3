import { Badge } from "@/components/ui/badge";
import { CheckCircle2, UserRound, Wrench } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { useReformers } from "../hooks/useReformers";
import { useSessions } from "../hooks/useSessions";

const today = new Date().toISOString().split("T")[0];

const STATUS_STYLES = {
  Available: {
    bg: "oklch(0.88 0.05 145)",
    border: "oklch(0.62 0.1 148)",
    badge: { bg: "oklch(0.52 0.085 150)", color: "oklch(0.99 0.005 80)" },
    icon: CheckCircle2,
    label: "Available",
  },
  Occupied: {
    bg: "oklch(0.93 0.07 65)",
    border: "oklch(0.72 0.12 65)",
    badge: { bg: "oklch(0.72 0.15 65)", color: "oklch(0.99 0.005 80)" },
    icon: UserRound,
    label: "Occupied",
  },
  Maintenance: {
    bg: "oklch(0.9 0.01 80)",
    border: "oklch(0.7 0.02 80)",
    badge: { bg: "oklch(0.6 0.02 80)", color: "oklch(0.99 0.005 80)" },
    icon: Wrench,
    label: "Maintenance",
  },
};

export function ReformerMap() {
  const { reformers, cycleStatus } = useReformers();
  const { sessions } = useSessions();

  const todaySessions = useMemo(
    () =>
      sessions.filter(
        (s) => s.date === today && s.reformerAssignment !== "None",
      ),
    [sessions],
  );

  function handleCycle(id: string, currentStatus: string) {
    cycleStatus(id);
    const statuses = ["Available", "Occupied", "Maintenance"];
    const idx = statuses.indexOf(currentStatus);
    const nextStatus = statuses[(idx + 1) % statuses.length];
    toast.success(`${id} is now ${nextStatus}`);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="font-display text-3xl md:text-4xl font-light text-foreground">
          Reformer Map
        </h2>
        <p className="text-sm text-muted-foreground mt-1 font-body">
          Click a reformer to cycle its status
        </p>
      </div>

      {/* Reformer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {reformers.map((reformer) => {
          const style = STATUS_STYLES[reformer.status];
          const Icon = style.icon;
          return (
            <button
              type="button"
              key={reformer.id}
              data-ocid={`reformer.${reformer.id.toLowerCase()}.card`}
              onClick={() => handleCycle(reformer.id, reformer.status)}
              className="text-left rounded-2xl p-8 transition-all duration-200 hover:scale-[1.02] hover:shadow-soft active:scale-[0.99] cursor-pointer border-2"
              style={{
                backgroundColor: style.bg,
                borderColor: style.border,
              }}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p
                    className="font-display text-5xl font-light"
                    style={{ color: "oklch(0.22 0.015 60)" }}
                  >
                    {reformer.id}
                  </p>
                  <p
                    className="text-xs font-body font-medium uppercase tracking-[0.2em] mt-1"
                    style={{ color: "oklch(0.55 0.02 70)" }}
                  >
                    Reformer
                  </p>
                </div>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "oklch(1 0 0 / 0.5)" }}
                >
                  <Icon size={22} style={{ color: style.badge.bg }} />
                </div>
              </div>

              <Badge
                data-ocid={`reformer.${reformer.id.toLowerCase()}.toggle`}
                className="font-body text-xs font-medium border-0 px-3 py-1"
                style={{
                  backgroundColor: style.badge.bg,
                  color: style.badge.color,
                }}
              >
                {style.label}
              </Badge>

              {reformer.currentClient && reformer.status === "Occupied" && (
                <p
                  className="text-sm font-body mt-4"
                  style={{ color: "oklch(0.45 0.06 65)" }}
                >
                  {reformer.currentClient}
                </p>
              )}

              <p
                className="text-xs font-body mt-3 opacity-60"
                style={{ color: "oklch(0.45 0.02 70)" }}
              >
                Click to cycle status
              </p>
            </button>
          );
        })}
      </div>

      {/* Today's Session Assignments */}
      <div>
        <h3 className="font-display text-2xl font-light text-foreground mb-4">
          Today's Reformer Assignments
        </h3>
        {todaySessions.length === 0 ? (
          <div
            data-ocid="reformer.schedule.empty_state"
            className="rounded-xl border border-border/60 py-10 text-center text-muted-foreground font-body"
          >
            <p>No reformer assignments for today.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todaySessions
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((s, idx) => (
                <div
                  key={s.id}
                  data-ocid={`reformer.schedule.row.${idx + 1}`}
                  className="flex flex-wrap items-center gap-2 md:gap-4 rounded-lg border border-border/50 px-5 py-3 bg-card shadow-xs"
                >
                  <Badge
                    className="font-body text-xs border-0 w-10 justify-center shrink-0"
                    style={{
                      backgroundColor: "oklch(0.88 0.04 145)",
                      color: "oklch(0.35 0.07 148)",
                    }}
                  >
                    {s.reformerAssignment}
                  </Badge>
                  <p className="font-body font-medium text-sm flex-1">
                    {s.name}
                  </p>
                  <p className="font-body text-sm text-muted-foreground">
                    {s.time}
                  </p>
                  <p className="font-body text-sm text-muted-foreground">
                    {s.trainer}
                  </p>
                  <p className="font-body text-sm text-muted-foreground">
                    {s.enrolled} / {s.capacity}
                  </p>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
