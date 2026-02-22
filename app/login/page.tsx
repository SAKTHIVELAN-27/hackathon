"use client";

import { useEffect, useMemo, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";

type Role = "team" | "judge" | "admin";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toastShownRef = useRef(false);

  const errorMessage = useMemo(() => {
    const error = searchParams.get("error");
    if (error === "user-not-found") {
      return "No account found for this email. Contact an admin.";
    }
    return null;
  }, [searchParams]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      const role = session.user.role as Role;
      const redirectMap: Record<Role, string> = {
        admin: "/admin/judges",
        judge: "/judge",
        team: "/team",
      };
      router.replace(redirectMap[role]);
    }
  }, [status, session, router]);

  useEffect(() => {
    if (!errorMessage || toastShownRef.current || status === "authenticated") {
      return;
    }
    toast.error(errorMessage);
    toastShownRef.current = true;
  }, [errorMessage, status]);

  // Show logout success toast
  useEffect(() => {
    if (searchParams.get("action") === "logout" && !toastShownRef.current) {
      // Use a small timeout to ensure UI is ready
      const timeoutId = window.setTimeout(() => {
        toast.success("Successfully logged out");
        toastShownRef.current = true;
        // Optional: Remove the query param to prevent toast on refresh (requires router.replace)
        router.replace("/login");
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [searchParams, router]);

  return (
    <main className="flex min-h-screen flex-col lg:flex-row-reverse">
      {/* Image section - 2/3 width on lg+ screens, smaller on mobile */}
      <div className="relative h-48 lg:h-auto lg:w-2/3">
        <Image
          src="/login.jpg"
          alt="Login background"
          fill
          className="object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Sign-in section - 1/3 width on lg+ screens, centered on mobile */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:w-1/3 bg-background">
        <Card className="w-full max-w-md border-border bg-card shadow-xl">
          <CardHeader className="space-y-3">
            <CardTitle className="text-3xl font-extrabold tracking-tight">
              Sign in
            </CardTitle>

            <CardDescription className="text-muted-foreground">
              Access the hackathon platform using your Google account.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-6 rounded-2xl border border-border bg-background p-6">
              <div className="space-y-1">
                <p className="text-sm font-semibold tracking-wide">
                  Continue with Google
                </p>
                <p className="text-sm text-muted-foreground">
                  Your role is automatically detected after authentication.
                </p>
              </div>

              {errorMessage && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                  {errorMessage}
                </div>
              )}

              <Button
                size="lg"
                className="w-full rounded-xl bg-primary text-primary-foreground transition hover:opacity-90 active:scale-[0.98]"
                onClick={() => signIn("google")}
              >
                Sign in with Google
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Only authorized emails can access the platform
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
