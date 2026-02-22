"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetJudgeAssignedTeamsQuery, useGetJudgeProfileQuery } from "@/lib/redux/api/judgeApi";
import { setBreadcrumbs } from "@/lib/hooks/useBreadcrumb";

type TeamAssignment = {
  team_id: string;
  team_name: string;
  status: "pending" | "scored";
  score?: number;
};

export default function JudgeHomePage() {
  const router = useRouter();

  const { data: profile } = useGetJudgeProfileQuery();

  const {
    data: assignedTeams = [],
    isLoading,
    isError,
    error,
  } = useGetJudgeAssignedTeamsQuery();

  useEffect(() => {
    setBreadcrumbs([]);
  }, []);

  const pendingCount = assignedTeams.filter(
    (t: any) => t.status === "pending",
  ).length;

  const scoredCount = assignedTeams.filter(
    (t: any) => t.status === "scored",
  ).length;

  const handleTeamClick = () => {
    router.push(`/judge/rounds`);
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Judge Dashboard
        </h1>
        {profile?.judge && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-muted-foreground text-sm">
              {profile.judge.name}
            </p>
            {profile.judge.track && (
              <Badge variant="outline" className="text-xs">
                Track: {profile.judge.track}
              </Badge>
            )}
          </div>
        )}
      </header>

      {isError && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive font-semibold">
              Error loading teams
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {(error as any)?.data?.error || "Unknown error"}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Teams Assigned */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="size-5 text-muted-foreground" />
              Teams assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="mt-2 h-4 w-48" />
              </>
            ) : (
              <>
                <p className="text-3xl font-bold">{assignedTeams.length}</p>
                <p className="text-sm text-muted-foreground">
                  You have {pendingCount} teams pending evaluation.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Progress */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="size-5 text-muted-foreground" />
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-semibold">{pendingCount}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">Scored</p>
                  <p className="text-2xl font-semibold">{scoredCount}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Teams List */}
        <Card className="lg:col-span-2 border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="size-5 text-muted-foreground" />
              Your assigned teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : assignedTeams.length === 0 ? (
              <div className="flex h-48 items-center justify-center">
                <p className="text-muted-foreground">
                  No teams assigned yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {assignedTeams.map((team: TeamAssignment) => (
                  <div
                    key={team.team_id}
                    onClick={handleTeamClick}
                    className="flex items-center justify-between rounded-lg border p-4 cursor-pointer hover:bg-muted/40 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border">
                        <span className="font-semibold text-primary">
                          {team.team_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{team.team_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {team.status === "scored"
                            ? `Scored: ${team.score ?? "—"}`
                            : "Awaiting evaluation"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        team.status === "scored" ? "default" : "secondary"
                      }
                    >
                      {team.status === "scored" ? "Scored" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
