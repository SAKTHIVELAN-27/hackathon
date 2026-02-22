import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/providers";
import { RoleRedirect } from "@/components/role-redirect";
import "./globals.css";
import { Toaster } from "sonner";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "TetherX Hackathon - CodeChef VITCC",
  description: "Manage judges, teams, and rounds for the CodeChef Hackathon",
  icons: {
    icon: "/logo.png ",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased">
          <Providers>
            <RoleRedirect />
            <TooltipProvider>
              {children}
              <Toaster position="top-right" />
            </TooltipProvider>
          </Providers>
        </body>
      </html>
    </Suspense>
  );
}
