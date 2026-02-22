import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import SidebarLayout from "@/components/sidebar-layout";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!session) {
    redirect("/login");
  }

  if (role && role !== "admin") {
    redirect("/login");
  }

  return <SidebarLayout>{children}</SidebarLayout>;
}
