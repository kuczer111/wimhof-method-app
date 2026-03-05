import BottomNav from "./BottomNav";
import SafetyOnboarding from "./SafetyOnboarding";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
      <SafetyOnboarding />
    </div>
  );
}
