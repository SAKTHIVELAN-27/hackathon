"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  getBreadcrumbsFromStorage,
  BreadcrumbItem,
} from "@/lib/hooks/useBreadcrumb";

export function Breadcrumbs() {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setBreadcrumbs(getBreadcrumbsFromStorage());

    // Listen for breadcrumb changes from same tab
    const handleBreadcrumbChange = (event: Event) => {
      if (event instanceof CustomEvent) {
        setBreadcrumbs(event.detail);
      }
    };

    // Listen for storage changes from other tabs
    const handleStorageChange = () => {
      setBreadcrumbs(getBreadcrumbsFromStorage());
    };

    window.addEventListener("breadcrumbsChanged", handleBreadcrumbChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("breadcrumbsChanged", handleBreadcrumbChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  if (!mounted || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center gap-1 text-sm">
      {breadcrumbs.map((item, index) => (
        <div key={item.href} className="flex items-center gap-1">
          <Link
            href={item.href}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {item.label}
          </Link>
          {index < breadcrumbs.length - 1 && (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </div>
      ))}
    </nav>
  );
}
