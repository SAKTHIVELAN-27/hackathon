"use client";

import React, { useEffect } from "react";
import CountDown from "../../components/team/Countdown";
import Link from "next/link";
import { useGetTeamDashboardQuery } from "@/lib/redux/api/teamApi";
import { setBreadcrumbs } from "@/lib/hooks/useBreadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Trophy,
  Timer,
} from "lucide-react";
import { cn, ensureAbsoluteUrl } from "@/lib/utils";

export default function TeamDashboardPage() {
  const { data: dashboardData, isLoading } = useGetTeamDashboardQuery();

  useEffect(() => {
    setBreadcrumbs([]);
  }, []);

  const loading = isLoading || !dashboardData;

  const teamName = dashboardData?.team_name ?? "—";
  const track = dashboardData?.track ?? "—";
  const activeRound = dashboardData?.current_round;
  const currentRoundSubtask = dashboardData?.current_round_subtask;
  const currentRoundSubmission = dashboardData?.current_round_submission;
  const totalScore = dashboardData?.total_score ?? 0;
  const latestRoundScore = dashboardData?.latest_round_score;

  const startTime = activeRound?.start_time ?? null;
  const endTime = activeRound?.end_time ?? null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        {loading ? (
          <>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-32" />
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {teamName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track: {track}
            </p>
          </>
        )}
      </header>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Current Round */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Current Round
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {activeRound
                    ? `Round ${activeRound.round_number}`
                    : "—"}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {activeRound?.is_active ? "Active now" : "Not active"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Countdown */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Time Remaining
            </CardTitle>
            <Timer className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-yellow-600">
                  {endTime ? (
                    <CountDown endTime={new Date(endTime).toISOString()} />
                  ) : (
                    <span className="text-muted-foreground text-base font-medium">No deadline set</span>
                  )}
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {startTime
                      ? `Start: ${new Date(startTime).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
                      : "Start: Not set"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {endTime
                      ? `End: ${new Date(endTime).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
                      : "End: Not set"}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Status
            </CardTitle>
            {loading ? (
              <Skeleton className="h-4 w-4 rounded-full" />
            ) : activeRound?.is_active ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-20 rounded-full" />
            ) : (
              <>
                <Badge
                  variant={activeRound?.is_active ? "default" : "secondary"}
                >
                  {activeRound?.is_active ? "Active" : "Closed"}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Submissions{" "}
                  {activeRound?.submission_enabled ? "open" : "closed"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Score */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Total Score
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {totalScore > 0 ? totalScore : "—"}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Across all rounds
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Current Round Subtask */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Current Round Subtask
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : currentRoundSubtask ? (
            <div className="space-y-4">
              <p className="font-semibold">
                {currentRoundSubtask.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentRoundSubtask.description}
              </p>
              <Link href={`/team/rounds/${activeRound?._id}`}>
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No subtask selected for this round.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Current Round Submission */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Current Round Submission
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          ) : currentRoundSubmission ? (
            <div className="space-y-3">
              {currentRoundSubmission.github_link && (
                <a
                  href={ensureAbsoluteUrl(
                    currentRoundSubmission.github_link,
                  )}
                  target="_blank"
                  className="text-sm text-primary hover:underline"
                >
                  GitHub Repository
                </a>
              )}
              {activeRound?.submission_enabled && (
                <Link href={`/team/rounds/${activeRound?._id}`}>
                  <Button size="sm" variant="outline">
                    Update Submission
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No submission yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* All Round Scores */}
      {dashboardData?.all_round_scores &&
        dashboardData.all_round_scores.length > 0 && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                All Round Scores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-16 w-full rounded-lg"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.all_round_scores.map(
                    (roundScore: any, i: number) => (
                      <div
                        key={i}
                        className="rounded-lg border p-4"
                      >
                        <p className="font-semibold">
                          Round {roundScore.round_number}
                        </p>
                        <p className="text-sm">
                          Score:{" "}
                          {roundScore.score !== null
                            ? `${roundScore.score}/10`
                            : "—"}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
    </div>
  );
}
