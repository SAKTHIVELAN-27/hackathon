"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListOrdered,
  Users,
  Gavel,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/rounds", label: "Rounds", icon: ListOrdered },
  { href: "/admin/teams", label: "Teams", icon: Users },
  { href: "/admin/judges", label: "Judges", icon: Gavel },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 p-2 shadow-xl backdrop-blur-xl",
        "dark:border-white/10 dark:bg-white/5"
      )}
      aria-label="Admin navigation"
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-white/10 hover:text-foreground dark:hover:bg-white/10"
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            <span className="flex-1">{label}</span>
            <ChevronRight
              className={cn("size-4 shrink-0 opacity-60", isActive && "opacity-100")}
              aria-hidden
            />
          </Link>
        );
      })}
    </nav>
  );
}
