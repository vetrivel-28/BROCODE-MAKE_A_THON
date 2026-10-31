import { useState } from "react";
import { ToastProvider } from "./shared/components/Toast";
import { WebsitePage } from "./website/WebsitePage";

export function App() {
  const [currentView, setCurrentView] = useState<"website" | "app">("website");
  const [tier, setTier] = useState<"free" | "standard" | "custom">("standard");
  const [role, setRole] = useState<"ADMIN" | "STAFF" | "CUSTOMER">("ADMIN");

  const handleLaunchApp = (selectedTier?: "free" | "standard" | "custom", selectedRole?: "ADMIN" | "STAFF" | "CUSTOMER") => {
    if (selectedTier) setTier(selectedTier);
    if (selectedRole) setRole(selectedRole);
    setCurrentView("app");
  };

  return (
    <ToastProvider>
      {currentView === "website" ? (
        <WebsitePage onLaunchApp={handleLaunchApp} />
      ) : (
        <div className="min-h-screen bg-[#F7F8FC] p-8 flex flex-col items-center justify-center">
          <div className="bg-white p-8 rounded-2xl border border-[#E9EAF2] shadow-lg max-w-md text-center">
            <h2 className="text-xl font-bold text-[#1B1F3B]">Welcome to {tier.toUpperCase()} Workspace</h2>
            <p className="text-xs text-gray-500 mt-2">Active Role: {role}</p>
            <p className="text-xs text-[#6C4BFF] font-semibold mt-4">App Shell & Insights will load here in Phase 2 & 4!</p>
            <button
              onClick={() => setCurrentView("website")}
              className="mt-6 px-4 py-2 bg-[#6C4BFF] text-white text-xs font-bold rounded-xl"
            >
              ← Back to Website
            </button>
          </div>
        </div>
      )}
    </ToastProvider>
  );
}

export default App;
