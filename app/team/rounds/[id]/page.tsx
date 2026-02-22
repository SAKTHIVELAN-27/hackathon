"use client";

import { useEffect, useState } from "react";
import {
  useGetTeamRoundDetailsQuery,
  useSelectSubtaskMutation,
} from "@/lib/redux/api/teamApi";
import SubmissionForm from "@/components/team/SubmissionForm";
import { useParams } from "next/navigation";
import { LoadingState } from "@/components/loading-state";
import { setBreadcrumbs } from "@/lib/hooks/useBreadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, AlertCircle, Timer } from "lucide-react";
import { ensureAbsoluteUrl } from "@/lib/utils";
import { toast } from "sonner";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [isEditingSubmission, setIsEditingSubmission] = useState(false);

  const { data, isLoading } = useGetTeamRoundDetailsQuery(id);
  const [selectSubtask, { isLoading: isSelecting }] =
    useSelectSubtaskMutation();

  useEffect(() => {
    if (data?.round) {
      setBreadcrumbs([
        { label: "Rounds", href: "/team/rounds" },
        {
          label: `Round ${data.round.round_number}`,
          href: `/team/rounds/${id}`,
        },
      ]);
    }
  }, [data, id]);

  useEffect(() => {
    if (!data?.round?.end_time) return;

    const interval = setInterval(() => {
      const diff =
        new Date(data.round.end_time).getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeRemaining("Time's up!");
        return;
      }
      const h = Math.floor(diff / 36e5);
      const m = Math.floor((diff % 36e5) / 6e4);
      const s = Math.floor((diff % 6e4) / 1e3);
      setTimeRemaining(`${h}h ${m}m ${s}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [data?.round?.end_time]);

  if (isLoading) {
    return <LoadingState message="Loading round details..." fullScreen />;
  }

  if (!data?.round) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto mb-4 h-10 w-10 text-destructive" />
            <p className="text-muted-foreground">
              Round not found or failed to load.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { round, subtask, submission, initialSubtasks, score } = data;
  const isRoundEnded =
    round.end_time &&
    new Date().getTime() > new Date(round.end_time).getTime();

  const formatDate = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

  /* ─────────────────────────── SELECTED SUBTASK VIEW ─────────────────────────── */

  if (subtask) {
    return (
      <div className="space-y-8">

        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              Round {round.round_number}
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your submission and track progress
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
              <Timer className="h-4 w-4" />
              <span className="text-xs font-medium">TIME REMAINING</span>
            </div>
            <p
              className={`text-lg font-bold ${
                timeRemaining === "Time's up!"
                  ? "text-destructive"
                  : "text-primary"
              }`}
            >
              {timeRemaining || "Calculating..."}
            </p>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Selected Subtask</CardTitle>
            {subtask.track && (
              <Badge variant="secondary" className="mt-2 w-fit">
                {subtask.track}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-semibold">{subtask.title}</p>
            <p className="text-sm text-muted-foreground">
              {subtask.description}
            </p>

            {subtask.statement && (
              <div className="border-t pt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  PROBLEM STATEMENT
                </p>
                <p className="whitespace-pre-wrap text-sm">
                  {subtask.statement}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {submission ? (
          <Card>
            <CardHeader>
              <CardTitle>Submission</CardTitle>
              <p className="text-sm text-muted-foreground">
                Submitted on {formatDate(submission.submitted_at)}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">

              {submission.github_link && (
                <a
                  href={ensureAbsoluteUrl(submission.github_link)}
                  target="_blank"
                  className="block text-sm text-primary hover:underline"
                >
                  GitHub Repository
                </a>
              )}

              {submission.overview && (
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    OVERVIEW
                  </p>
                  <p className="whitespace-pre-wrap text-sm">
                    {submission.overview}
                  </p>
                </div>
              )}

              {score && (
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <p className="text-sm font-semibold">
                    Score: {score.score}/10
                  </p>
                  {score.remarks && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {score.remarks}
                    </p>
                  )}
                </div>
              )}

              {!isRoundEnded && (
                <Button
                  variant="outline"
                  onClick={() => setIsEditingSubmission(true)}
                >
                  Edit Submission
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Create Submission</CardTitle>
            </CardHeader>
            <CardContent>
              {isRoundEnded ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center">
                  <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
                  <p className="text-sm font-medium">
                    Submission window closed
                  </p>
                </div>
              ) : (
                <SubmissionForm
                  subtask={{ id: subtask._id, title: subtask.title }}
                  roundId={id}
                  allowFileUpload
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  /* ─────────────────────────── SUBTASK SELECTION VIEW ─────────────────────────── */

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold sm:text-3xl">
        Select Subtask
      </h1>

      <div className="grid gap-4 md:grid-cols-2">
        {initialSubtasks?.map((task: any) => (
          <Card
            key={task._id}
            className="cursor-pointer transition hover:bg-muted/50"
            onClick={() => setSelectedSubtaskId(task._id)}
          >
            <CardHeader>
              <CardTitle className="text-base">{task.title}</CardTitle>
              {task.track && (
                <Badge variant="secondary" className="w-fit">
                  {task.track}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {task.description}
              </p>
              <Button
                size="lg"
                onClick={async () => {
                  try {
                    await selectSubtask({
                      roundId: id,
                      subtaskId: task._id,
                    }).unwrap();
                    toast.success("Subtask selected successfully!");
                  } catch (error: any) {
                    console.error("Failed to select subtask:", error);
                    toast.error(
                      "Failed to select subtask: " +
                        (error?.data?.error || "Unknown error"),
                    );
                  }
                }}
                disabled={isSelecting}
              >
                {selectedSubtaskId === task._id ? "Selected" : "Select"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedSubtaskId && (
        <Button
          size="lg"
          onClick={() =>
            selectSubtask({ roundId: id, subtaskId: selectedSubtaskId! })
          }
          disabled={isSelecting}
        >
          {isSelecting ? "Confirming..." : "Confirm Selection"}
        </Button>
      )}
    </div>
  );
}
