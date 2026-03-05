import BottomNav from "./BottomNav";
import SafetyOnboarding from "./SafetyOnboarding";
import StorageProvider from "./StorageProvider";
import MilestoneToast from "./MilestoneToast";
import WeeklySummary from "./WeeklySummary";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <StorageProvider>
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 pb-20 animate-page-enter">{children}</main>
        <BottomNav />
        <SafetyOnboarding />
        <MilestoneToast />
        <WeeklySummary />
      </div>
    </StorageProvider>
  );
}
