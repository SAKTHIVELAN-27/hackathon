"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

type Role = "team" | "judge" | "admin";

type RoleTarget = {
  role: Role;
  path: string;
  areaPrefix: string;
};

const roleTargets: RoleTarget[] = [
  { role: "admin", path: "/admin", areaPrefix: "/admin" },
  { role: "judge", path: "/judge", areaPrefix: "/judge" },
  { role: "team", path: "/team", areaPrefix: "/team" },
];

function getRoleTarget(role: Role): RoleTarget | undefined {
  return roleTargets.find((target) => target.role === role);
}

export function RoleRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    if (pathname.startsWith("/login") && searchParams.get("error")) {
      return;
    }

    const role = session?.user?.role as Role | undefined;
    if (!role) {
      return;
    }

    const target = getRoleTarget(role);
    if (!target) {
      return;
    }

    if (pathname.startsWith(target.areaPrefix)) {
      return;
    }

    console.log(target.path);
    router.replace(target.path);
  }, [pathname, router, searchParams, session, status]);

  return null;
}
