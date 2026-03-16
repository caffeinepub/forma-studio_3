import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { useSeedData } from "./hooks/useSeedData";
import { Clients } from "./pages/Clients";
import { Dashboard } from "./pages/Dashboard";
import { ReformerMap } from "./pages/ReformerMap";
import { Sessions } from "./pages/Sessions";

type Page = "dashboard" | "clients" | "sessions" | "reformer-map";

export default function App() {
  useSeedData();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 ml-60 min-h-screen p-8 overflow-y-auto">
        {currentPage === "dashboard" && <Dashboard />}
        {currentPage === "clients" && <Clients />}
        {currentPage === "sessions" && <Sessions />}
        {currentPage === "reformer-map" && <ReformerMap />}
      </main>
      <Toaster richColors position="bottom-right" />
    </div>
  );
}
