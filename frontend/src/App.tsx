import { useState } from "react";
import { ToastProvider } from "./shared/components/Toast";
import { WebsitePage } from "./website/WebsitePage";
import { AppShell } from "./app-shell/AppShell";

export function App() {
  const [currentView, setCurrentView] = useState<"website" | "app">("website");
  const [tier, setTier] = useState<"free" | "standard" | "custom">("standard");
  const [role, setRole] = useState<"SUPER_ADMIN" | "ADMIN" | "STAFF" | "CUSTOMER">("ADMIN");

  const handleLaunchApp = (
    selectedTier?: "free" | "standard" | "custom",
    selectedRole?: "ADMIN" | "STAFF" | "CUSTOMER"
  ) => {
    if (selectedTier) setTier(selectedTier);
    if (selectedRole) setRole(selectedRole);
    setCurrentView("app");
  };

  return (
    <ToastProvider>
      {currentView === "website" ? (
        <WebsitePage onLaunchApp={handleLaunchApp} />
      ) : (
        <AppShell
          initialTier={tier}
          initialRole={role}
          onGoToWebsite={() => setCurrentView("website")}
        />
      )}
    </ToastProvider>
  );
}

export default App;
