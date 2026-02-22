import SidebarLayout from "@/components/sidebar-layout";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function JudgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
  
    if (!session) {
      redirect("/login");
    }
  
    if (role && role !== "judge") {
      redirect("/login");
    }
  return <SidebarLayout>{children}</SidebarLayout>;
}
