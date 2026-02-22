"use client";

import { AdminNav } from "./AdminNav";

type AdminShellProps = {
  children: React.ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:gap-12 lg:px-8">
        <aside className="shrink-0 lg:w-56">
          <div className="sticky top-8">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Admin Panel
            </p>
            <AdminNav />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
