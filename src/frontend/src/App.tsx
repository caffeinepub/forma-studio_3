import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import { MobileHeader, Sidebar } from "./components/Sidebar";
import { useSeedData } from "./hooks/useSeedData";
import { Attendance } from "./pages/Attendance";
import { Billing } from "./pages/Billing";
import { Clients } from "./pages/Clients";
import { Dashboard } from "./pages/Dashboard";
import { ReformerMap } from "./pages/ReformerMap";
import { Sessions } from "./pages/Sessions";
import { Trainers } from "./pages/Trainers";

export type Page =
  | "dashboard"
  | "clients"
  | "sessions"
  | "reformer-map"
  | "trainers"
  | "attendance"
  | "billing";

export default function App() {
  useSeedData();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function navigate(page: Page) {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={navigate}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuClose={() => setMobileMenuOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-60">
        {/* Mobile top header */}
        <MobileHeader
          onMenuOpen={() => setMobileMenuOpen(true)}
          currentPage={currentPage}
          onNavigate={navigate}
        />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-20 md:pb-8">
          {currentPage === "dashboard" && <Dashboard />}
          {currentPage === "clients" && <Clients />}
          {currentPage === "sessions" && <Sessions />}
          {currentPage === "reformer-map" && <ReformerMap />}
          {currentPage === "trainers" && <Trainers />}
          {currentPage === "attendance" && <Attendance />}
          {currentPage === "billing" && <Billing />}
        </main>
      </div>

      <Toaster richColors position="bottom-right" />
    </div>
  );
}
