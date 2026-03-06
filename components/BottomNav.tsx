"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { strings } from "@/lib/i18n";
import {
  ClockIcon,
  CalendarIcon,
  SnowflakeIcon,
  ChartIcon,
  BookIcon,
  GearIcon,
} from "@/components/ui/Icon";

const tabs = [
  { href: "/breathe", label: strings.nav.breathe, Icon: ClockIcon },
  { href: "/program", label: strings.nav.program, Icon: CalendarIcon },
  { href: "/cold", label: strings.nav.cold, Icon: SnowflakeIcon },
  { href: "/progress", label: strings.nav.progress, Icon: ChartIcon },
  { href: "/learn", label: strings.nav.learn, Icon: BookIcon },
  { href: "/settings", label: strings.nav.settings, Icon: GearIcon },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-on-surface-light/[0.12] bg-white/80 backdrop-blur-lg pb-[env(safe-area-inset-bottom)] dark:border-surface-overlay dark:bg-surface-base/80">
      <ul className="flex justify-around">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`flex flex-col items-center px-3 py-2 text-xs transition-colors ${
                  active ? "text-brand dark:text-brand-light" : "text-on-surface-muted dark:text-on-surface-faint"
                }`}
              >
                <tab.Icon />
                <span className="mt-1">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
