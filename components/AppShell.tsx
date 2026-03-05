import BottomNav from "./BottomNav";
import SafetyOnboarding from "./SafetyOnboarding";
import StorageProvider from "./StorageProvider";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <StorageProvider>
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 pb-20 animate-page-enter">{children}</main>
        <BottomNav />
        <SafetyOnboarding />
      </div>
    </StorageProvider>
  );
}
