import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Calendar,
  ClipboardList,
  CreditCard,
  Grid3X3,
  LayoutDashboard,
  LogOut,
  Menu,
  UserCheck,
  Users,
} from "lucide-react";
import type { Page } from "../App";
import { useChangeRequests } from "../hooks/useChangeRequests";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  mobileMenuOpen: boolean;
  onMobileMenuClose: () => void;
  onLogout: () => void;
}

interface MobileHeaderProps {
  onMenuOpen: () => void;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems = [
  {
    id: "dashboard" as Page,
    label: "Dashboard",
    shortLabel: "Home",
    icon: LayoutDashboard,
    ocid: "nav.dashboard.link",
  },
  {
    id: "clients" as Page,
    label: "Clients",
    shortLabel: "Clients",
    icon: Users,
    ocid: "nav.clients.link",
  },
  {
    id: "sessions" as Page,
    label: "Sessions",
    shortLabel: "Sessions",
    icon: Calendar,
    ocid: "nav.sessions.link",
  },
  {
    id: "reformer-map" as Page,
    label: "Reformer Map",
    shortLabel: "Map",
    icon: Grid3X3,
    ocid: "nav.reformer_map.link",
  },
  {
    id: "trainers" as Page,
    label: "Trainers",
    shortLabel: "Trainers",
    icon: UserCheck,
    ocid: "nav.trainers.link",
  },
  {
    id: "attendance" as Page,
    label: "Attendance",
    shortLabel: "Attend",
    icon: ClipboardList,
    ocid: "nav.attendance.link",
  },
  {
    id: "billing" as Page,
    label: "Billing",
    shortLabel: "Billing",
    icon: CreditCard,
    ocid: "nav.billing.link",
  },
];

function NavContent({
  currentPage,
  onNavigate,
  onLogout,
}: {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}) {
  const { pendingCount } = useChangeRequests();

  return (
    <>
      {/* Logo */}
      <div
        className="px-2 py-3 border-b flex items-center justify-center"
        style={{ borderColor: "oklch(0.22 0.008 260)" }}
      >
        <img
          src="/assets/uploads/IMG_20260317_064146-1.jpg"
          alt="The Pilates Studio"
          className="w-full object-contain max-h-24"
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          const showBadge = item.id === "sessions" && pendingCount > 0;
          return (
            <button
              type="button"
              key={item.id}
              data-ocid={item.ocid}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-body font-medium transition-all duration-150",
                isActive ? "text-foreground" : "hover:text-foreground",
              )}
              style={{
                backgroundColor: isActive
                  ? "oklch(0.85 0.14 185 / 0.15)"
                  : "transparent",
                color: isActive
                  ? "oklch(0.85 0.14 185)"
                  : "oklch(0.65 0.015 80)",
              }}
            >
              <Icon
                size={16}
                style={{
                  color: isActive
                    ? "oklch(0.85 0.14 185)"
                    : "oklch(0.5 0.015 80)",
                }}
              />
              {item.label}
              {showBadge && (
                <Badge
                  className="ml-auto text-[10px] h-4 min-w-4 px-1 font-body"
                  style={{
                    backgroundColor: "oklch(0.65 0.15 25)",
                    color: "white",
                    border: "none",
                  }}
                >
                  {pendingCount}
                </Badge>
              )}
              {isActive && !showBadge && (
                <div
                  className="ml-auto w-1 h-4 rounded-full"
                  style={{ backgroundColor: "oklch(0.85 0.14 185)" }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout + Footer */}
      <div
        className="px-3 pb-3 border-t pt-3"
        style={{ borderColor: "oklch(0.22 0.008 260)" }}
      >
        <button
          type="button"
          data-ocid="nav.logout.button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-body font-medium transition-all duration-150 hover:text-foreground"
          style={{ color: "oklch(0.55 0.1 25)" }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      <div
        className="px-6 py-4 border-t"
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
            style={{ color: "oklch(0.85 0.14 185)" }}
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </>
  );
}

export function Sidebar({
  currentPage,
  onNavigate,
  mobileMenuOpen,
  onMobileMenuClose,
  onLogout,
}: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="fixed left-0 top-0 h-full w-60 hidden md:flex flex-col"
        style={{ backgroundColor: "oklch(0.1 0.006 260)" }}
      >
        <NavContent
          currentPage={currentPage}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={onMobileMenuClose}>
        <SheetContent
          side="left"
          className="p-0 w-64 flex flex-col"
          style={{ backgroundColor: "oklch(0.1 0.006 260)", border: "none" }}
        >
          <NavContent
            currentPage={currentPage}
            onNavigate={onNavigate}
            onLogout={onLogout}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

export function MobileHeader({
  onMenuOpen,
  currentPage,
  onNavigate,
}: MobileHeaderProps) {
  const _activeItem = navItems.find((i) => i.id === currentPage);
  const { pendingCount } = useChangeRequests();

  return (
    <>
      {/* Top bar - mobile only */}
      <header
        className="md:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-40"
        style={{
          backgroundColor: "oklch(0.1 0.006 260)",
          borderColor: "oklch(0.22 0.008 260)",
        }}
      >
        <img
          src="/assets/uploads/IMG_20260317_064146-1.jpg"
          alt="The Pilates Studio"
          className="h-10 object-contain max-w-[200px]"
        />
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-body"
              style={{
                backgroundColor: "oklch(0.65 0.15 25 / 0.2)",
                color: "oklch(0.75 0.15 25)",
              }}
            >
              {pendingCount} pending
            </div>
          )}
          <button
            type="button"
            data-ocid="nav.hamburger.button"
            onClick={onMenuOpen}
            className="p-2 rounded-md transition-colors"
            style={{ color: "oklch(0.85 0.14 185)" }}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Bottom tab bar - mobile only */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center border-t"
        style={{
          backgroundColor: "oklch(0.1 0.006 260)",
          borderColor: "oklch(0.22 0.008 260)",
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          const showBadge = item.id === "sessions" && pendingCount > 0;
          return (
            <button
              type="button"
              key={item.id}
              data-ocid={`mobile.${item.ocid}`}
              onClick={() => onNavigate(item.id)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1 transition-colors min-w-0 relative"
              style={{
                color: isActive
                  ? "oklch(0.85 0.14 185)"
                  : "oklch(0.45 0.01 80)",
              }}
            >
              <div className="relative">
                <Icon size={18} />
                {showBadge && (
                  <span
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[8px] flex items-center justify-center font-body"
                    style={{
                      backgroundColor: "oklch(0.65 0.15 25)",
                      color: "white",
                    }}
                  >
                    {pendingCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-body font-medium truncate w-full text-center">
                {item.shortLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
