"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-5xl text-center space-y-14">

        <div className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 mx-auto">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-xs font-mono tracking-widest text-muted-foreground">
            HACKATHON PLATFORM
          </span>
        </div>

        <div className="space-y-6">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            <span className="text-foreground">
              TetherX
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed">
            Build. Compete. Win. A modern platform to manage hackathons with
            real-time evaluations and seamless collaboration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">

          <div className="rounded-2xl border border-border bg-card p-6 transition hover:bg-accent">
            <div className="mb-4 text-sm font-semibold tracking-wide text-primary">
              REAL-TIME
            </div>
            <p className="text-muted-foreground">
              Live updates, instant scores, and continuous progress tracking.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 transition hover:bg-accent">
            <div className="mb-4 text-sm font-semibold tracking-wide text-primary">
              SECURE
            </div>
            <p className="text-muted-foreground">
              Role-based access with enterprise-grade authentication.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 transition hover:bg-accent">
            <div className="mb-4 text-sm font-semibold tracking-wide text-primary">
              COLLABORATIVE
            </div>
            <p className="text-muted-foreground">
              Teams, judges, and admins working in sync.
            </p>
          </div>

        </div>

        <div className="flex justify-center">
          <button
            onClick={() => router.push("/login")}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 font-semibold text-primary-foreground transition hover:opacity-90 active:scale-95"
          >
            Get Started
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </div>

      </div>
    </main>
  );
}
