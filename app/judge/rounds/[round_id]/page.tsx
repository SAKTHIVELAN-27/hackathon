"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  useGetJudgeRoundDetailsQuery,
  useSubmitScoreMutation,
  useUpdateScoreMutation,
} from "@/lib/redux/api/judgeApi";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { setBreadcrumbs } from "@/lib/hooks/useBreadcrumb";
import { ensureAbsoluteUrl } from "@/lib/utils";

type TeamEvaluation = {
  teamId: string;
  teamName: string;
  taskName: string;
  status: "pending" | "scored";
  score: number | null;
  remarks: string;
  selected_subtask?: any;
  submission?: any;
};

export default function JudgeRoundDetailsPage() {
  const { round_id } = useParams<{ round_id: string }>();
  const roundId = round_id ?? "";

  const { data: roundData, isLoading } = useGetJudgeRoundDetailsQuery(roundId);
  const roundInfo = roundData?.round;
  const teamsData: any[] = roundData?.teams ?? [];

  const [evaluations, setEvaluations] = useState<TeamEvaluation[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [dialogScore, setDialogScore] = useState("");
  const [dialogRemarks, setDialogRemarks] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [submitScore] = useSubmitScoreMutation();
  const [updateScore] = useUpdateScoreMutation();

  useEffect(() => {
    if (Array.isArray(teamsData) && teamsData.length >= 0) {
      setEvaluations(
        teamsData.map((team: any) => ({
          teamId: team.team_id,
          teamName: team.team_name,
          taskName: team.selected_subtask?.title || "No task",
          // score is nested: { score, remarks, status }
          status: (team.score?.status as "pending" | "scored") ?? "pending",
          score: team.score?.score ?? null,
          remarks: team.score?.remarks ?? "",
          selected_subtask: team.selected_subtask,
          submission: team.submission,
        })),
      );
    }
  }, [roundData]);

  useEffect(() => {
    if (roundInfo) {
      setBreadcrumbs([
        { label: "Rounds", href: "/judge/rounds" },
        {
          label: `Round ${roundInfo.round_number}`,
          href: `/judge/rounds/${roundId}`,
        },
      ]);
    }
  }, [roundInfo, roundId]);

  useEffect(() => {
    if (!selectedTeamId) return;
    const evaluation = evaluations.find((e) => e.teamId === selectedTeamId);
    if (evaluation) {
      setDialogScore(evaluation.score?.toString() ?? "");
      setDialogRemarks(evaluation.remarks ?? "");
    }
  }, [selectedTeamId, evaluations]);

  const handleOpenDialog = (teamId: string) => {
    setSelectedTeamId(teamId);
  };

  const handleCloseDialog = () => {
    setSelectedTeamId(null);
    setDialogScore("");
    setDialogRemarks("");
  };

  const handleScoreChange = (value: string) => {
    // Allow only 0-100 range
    if (
      value === "" ||
      (/^\d+$/.test(value) && parseInt(value) >= 0 && parseInt(value) <= 100)
    ) {
      setDialogScore(value);
    }
  };

  const handleSaveEvaluation = async () => {
    if (!selectedTeamId) return;
    const score = dialogScore === "" ? 0 : parseInt(dialogScore);
    if (score < 0 || score > 100) {
      toast.error("Please enter a valid score (0-100)");
      return;
    }

    const alreadyScored = selectedTeam?.status === "scored";

    setIsSaving(true);
    try {
      if (alreadyScored) {
        await updateScore({
          roundId,
          teamId: selectedTeamId,
          score,
          remarks: dialogRemarks,
        }).unwrap();
      } else {
        await submitScore({
          roundId,
          teamId: selectedTeamId,
          score,
          remarks: dialogRemarks,
        }).unwrap();
      }

      setEvaluations((prev) =>
        prev.map((e) =>
          e.teamId === selectedTeamId
            ? { ...e, score, remarks: dialogRemarks, status: "scored" }
            : e,
        ),
      );

      toast.success("Evaluation saved");
      setSelectedTeamId(null);
    } catch {
      toast.error("Failed to save evaluation");
    } finally {
      setIsSaving(false);
    }
  };

  const pending = evaluations.filter((e) => e.status === "pending").length;
  const scored = evaluations.filter((e) => e.status === "scored").length;

  const selectedTeam = evaluations.find((e) => e.teamId === selectedTeamId);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          {roundInfo ? (
            `Round ${roundInfo.round_number} – Team Evaluations`
          ) : (
            <Skeleton className="h-8 w-80" />
          )}
        </h1>
        <p className="text-muted-foreground">
          Review and score team submissions
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {[pending, scored, pending + scored].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {isLoading ? <Skeleton className="h-4 w-20" /> : ["Status", "Pending", "Scored"][i]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {i === 0 ? "Active" : i === 1 ? pending : scored}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {i === 0
                      ? "Evaluations ongoing"
                      : i === 1
                      ? "Teams remaining"
                      : "Teams evaluated"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Teams Table */}
      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-40" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-20 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-12" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-8 w-24 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  : evaluations.map((e) => (
                      <TableRow key={e.teamId}>
                        <TableCell className="font-medium">
                          {e.teamName}
                        </TableCell>
                        <TableCell>{e.taskName}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              e.status === "scored" ? "default" : "outline"
                            }
                          >
                            {e.status === "scored" ? "Scored" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {e.score !== null ? `${e.score}/100` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTeamId(e.teamId)}
                          >
                            {e.status === "scored" ? "Edit" : "Evaluate"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Evaluation Dialog */}
      <Dialog open={!!selectedTeamId} onOpenChange={() => setSelectedTeamId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Evaluate {selectedTeam?.teamName}
            </DialogTitle>
          </DialogHeader>

          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Submission</p>
            {selectedTeam?.submission ? (
              <div className="space-y-2">
                {selectedTeam.submission.github_link && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20 shrink-0">GitHub</span>
                    <a
                      href={ensureAbsoluteUrl(selectedTeam.submission.github_link)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary hover:underline truncate"
                    >
                      {selectedTeam.submission.github_link}
                    </a>
                  </div>
                )}
                {selectedTeam.submission.file_url && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20 shrink-0">Drive / File</span>
                    <a
                      href={ensureAbsoluteUrl(selectedTeam.submission.file_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary hover:underline truncate"
                    >
                      {selectedTeam.submission.file_url}
                    </a>
                  </div>
                )}
                {selectedTeam.submission.overview && (
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Overview / Comments</span>
                    <p className="text-sm whitespace-pre-wrap bg-background rounded p-2 border">
                      {selectedTeam.submission.overview}
                    </p>
                  </div>
                )}
                {!selectedTeam.submission.github_link && !selectedTeam.submission.file_url && !selectedTeam.submission.overview && (
                  <p className="text-sm text-muted-foreground italic">No submission details provided.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Team has not submitted yet — you can still record a score.</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Score <span className="text-red-500">*</span>
                <span className="text-xs text-muted-foreground ml-2">
                  (0-100)
                </span>
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={dialogScore}
                onChange={(e) => handleScoreChange(e.target.value)}
                placeholder="Enter score"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Remarks{" "}
                <span className="text-xs text-muted-foreground ml-2">
                  (optional)
                </span>
              </label>
              <Textarea
                value={dialogRemarks}
                onChange={(e) => setDialogRemarks(e.target.value)}
                placeholder="Add feedback for the team..."
                rows={6}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTeamId(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEvaluation} disabled={isSaving}>
              {isSaving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Evaluation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
