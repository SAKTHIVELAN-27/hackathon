export type BreadcrumbItem = {
  label: string;
  href: string;
};

const BREADCRUMB_STORAGE_KEY = "admin_breadcrumbs";

function getDashboardHref(): string {
  // Detect dashboard href based on current pathname
  if (typeof window !== "undefined") {
    const pathname = window.location.pathname;
    if (pathname.startsWith("/judge")) {
      return "/judge";
    }
    if (pathname.startsWith("/team")) {
      return "/team";
    }
    if (pathname.startsWith("/admin")) {
      return "/admin";
    }
  }
  // Default to /admin for backward compatibility
  return "/admin";
}

export function setBreadcrumbs(breadcrumbs: BreadcrumbItem[]) {
  // Always start with Dashboard - detect correct route based on current page
  const dashboardHref = getDashboardHref();
  const fullBreadcrumbs = [
    { label: "Dashboard", href: dashboardHref },
    ...breadcrumbs,
  ];

  // Store in localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem(
      BREADCRUMB_STORAGE_KEY,
      JSON.stringify(fullBreadcrumbs),
    );

    // Dispatch custom event to notify breadcrumb component
    window.dispatchEvent(
      new CustomEvent("breadcrumbsChanged", {
        detail: fullBreadcrumbs,
      }),
    );
  }
}

export function getBreadcrumbsFromStorage(): BreadcrumbItem[] {
  if (typeof window === "undefined") {
    return [{ label: "Dashboard", href: "/admin" }];
  }

  try {
    const stored = localStorage.getItem(BREADCRUMB_STORAGE_KEY);
    const dashboardHref = getDashboardHref();
    const defaultBreadcrumbs = [{ label: "Dashboard", href: dashboardHref }];
    return stored ? JSON.parse(stored) : defaultBreadcrumbs;
  } catch {
    const dashboardHref = getDashboardHref();
    return [{ label: "Dashboard", href: dashboardHref }];
  }
}

export function clearBreadcrumbs() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(BREADCRUMB_STORAGE_KEY);
  }
}
