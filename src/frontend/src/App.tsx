import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import { MobileHeader, Sidebar } from "./components/Sidebar";
import { useAuth } from "./hooks/useAuth";
import { useSeedData } from "./hooks/useSeedData";
import { Attendance } from "./pages/Attendance";
import { Billing } from "./pages/Billing";
import { ClientPortal } from "./pages/ClientPortal";
import { Clients } from "./pages/Clients";
import { Dashboard } from "./pages/Dashboard";
import { LoginPage } from "./pages/LoginPage";
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
  const {
    currentUser,
    login,
    logout,
    saveClientCredentials,
    getClientCredentialsByClientId,
  } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function navigate(page: Page) {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  }

  // Not logged in → show login
  if (!currentUser) {
    return (
      <>
        <LoginPage onLogin={login} />
        <Toaster richColors position="bottom-right" />
      </>
    );
  }

  // Client → show client portal
  if (currentUser.role === "client") {
    return (
      <>
        <ClientPortal user={currentUser} onLogout={logout} />
        <Toaster richColors position="bottom-right" />
      </>
    );
  }

  // Admin → show full app
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        currentPage={currentPage}
        onNavigate={navigate}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuClose={() => setMobileMenuOpen(false)}
        onLogout={logout}
      />

      <div className="flex-1 flex flex-col min-h-screen md:ml-60">
        <MobileHeader
          onMenuOpen={() => setMobileMenuOpen(true)}
          currentPage={currentPage}
          onNavigate={navigate}
        />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-20 md:pb-8">
          {currentPage === "dashboard" && <Dashboard />}
          {currentPage === "clients" && (
            <Clients
              saveClientCredentials={saveClientCredentials}
              getClientCredentialsByClientId={getClientCredentialsByClientId}
            />
          )}
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
