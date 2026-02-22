"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { navConfig, Role } from "@/lib/nav-config";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function AppSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Fallback to determine role from pathname if session role is missing (for development/testing)
  // In production, session.user.role should be reliable
  const role: Role =
    session?.user?.role ||
    (pathname.startsWith("/admin")
      ? "admin"
      : pathname.startsWith("/judge")
        ? "judge"
        : "team");

  const items = navConfig[role] || [];

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex justify-center items-center gap-2">
          <Image src={"/logo.png"} width={32} height={32} alt="TetherX Logo" />
          <h2 className="logo text-lg font-semibold tracking-tight capitalize">
            TetherX Hackathon
          </h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <a href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => signOut({ callbackUrl: "/login?action=logout" })}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
