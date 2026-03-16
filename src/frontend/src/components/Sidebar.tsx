import { cn } from "@/lib/utils";
import { Calendar, Grid3X3, LayoutDashboard, Users } from "lucide-react";

type Page = "dashboard" | "clients" | "sessions" | "reformer-map";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems = [
  {
    id: "dashboard" as Page,
    label: "Dashboard",
    icon: LayoutDashboard,
    ocid: "nav.dashboard.link",
  },
  {
    id: "clients" as Page,
    label: "Clients",
    icon: Users,
    ocid: "nav.clients.link",
  },
  {
    id: "sessions" as Page,
    label: "Sessions",
    icon: Calendar,
    ocid: "nav.sessions.link",
  },
  {
    id: "reformer-map" as Page,
    label: "Reformer Map",
    icon: Grid3X3,
    ocid: "nav.reformer_map.link",
  },
];

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside
      className="fixed left-0 top-0 h-full w-60 flex flex-col"
      style={{ backgroundColor: "oklch(0.1 0.006 260)" }}
    >
      {/* Logo */}
      <div
        className="px-6 py-6 border-b flex items-center justify-center"
        style={{ borderColor: "oklch(0.22 0.008 260)" }}
      >
        <img
          src="/assets/generated/pilates-studio-logo-transparent.dim_300x160.png"
          alt="The Pilates Studio"
          className="w-36 object-contain"
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              type="button"
              key={item.id}
              data-ocid={item.ocid}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-body font-medium transition-all duration-150",
                isActive ? "text-foreground" : "hover:text-foreground",
              )}
              style={{
                backgroundColor: isActive
                  ? "oklch(0.75 0.12 185 / 0.15)"
                  : "transparent",
                color: isActive
                  ? "oklch(0.75 0.12 185)"
                  : "oklch(0.65 0.015 80)",
              }}
            >
              <Icon
                size={16}
                style={{
                  color: isActive
                    ? "oklch(0.75 0.12 185)"
                    : "oklch(0.5 0.015 80)",
                }}
              />
              {item.label}
              {isActive && (
                <div
                  className="ml-auto w-1 h-4 rounded-full"
                  style={{ backgroundColor: "oklch(0.75 0.12 185)" }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-6 py-5 border-t"
        style={{ borderColor: "oklch(0.22 0.008 260)" }}
      >
        <p
          className="text-xs font-body"
          style={{ color: "oklch(0.42 0.01 80)" }}
        >
          © {new Date().getFullYear()}{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: "oklch(0.75 0.12 185)" }}
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </aside>
  );
}
