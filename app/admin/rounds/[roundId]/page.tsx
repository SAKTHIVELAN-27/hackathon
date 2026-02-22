"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/loading-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Save, PlayCircle, StopCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { setBreadcrumbs } from "@/lib/hooks/useBreadcrumb";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useGetRoundDetailsQuery,
  useGetAllSubtasksQuery,
  useGetTracksQuery,
  useUpdateRoundMutation,
  useCreateSubtaskMutation,
  useUpdateSubtaskMutation,
  useDeleteSubtaskMutation,
  useToggleRoundStatusMutation,
  useGetRoundTeamsQuery,
  useUpdateRoundTeamsMutation,
  useAllocateSubtasksToTeamsMutation,
} from "@/lib/redux/api/adminApi";
import type { RoundTeam } from "@/lib/redux/api/types";
import { toast } from "sonner";

export default function RoundDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const roundId = params.roundId as string;

  // RTK Query Hooks
  const { data: round, isLoading: roundLoading } = useGetRoundDetailsQuery(roundId);
  const { data: allSubtasks = [], isLoading: subtasksLoading } = useGetAllSubtasksQuery();
  const { data: tracks = [] } = useGetTracksQuery();
  const [updateRound] = useUpdateRoundMutation();
  const [createSubtask] = useCreateSubtaskMutation();
  const [updateSubtask] = useUpdateSubtaskMutation();
  const [deleteSubtask] = useDeleteSubtaskMutation();
  const [toggleRoundStatus] = useToggleRoundStatusMutation();
  const { data: roundTeamsData, isLoading: roundTeamsLoading } = useGetRoundTeamsQuery(roundId);
  const [updateRoundTeams] = useUpdateRoundTeamsMutation();
  const [allocateSubtasks] = useAllocateSubtasksToTeamsMutation();

  // Local State for forms
  const [instructions, setInstructions] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [createSubtaskOpen, setCreateSubtaskOpen] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskDesc, setNewSubtaskDesc] = useState("");
  const [newSubtaskTrackId, setNewSubtaskTrackId] = useState("");
  const [editSubtaskOpen, setEditSubtaskOpen] = useState(false);
  const [editSubtaskId, setEditSubtaskId] = useState<string | null>(null);
  const [editSubtaskTitle, setEditSubtaskTitle] = useState("");
  const [editSubtaskDesc, setEditSubtaskDesc] = useState("");
  const [editSubtaskTrackId, setEditSubtaskTrackId] = useState("");
  const [isUpdatingSubtask, setIsUpdatingSubtask] = useState(false);
  const [deleteConfirmSubtaskId, setDeleteConfirmSubtaskId] = useState<
    string | null
  >(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeletingSubtask, setIsDeletingSubtask] = useState(false);
  const [allowedTeamIds, setAllowedTeamIds] = useState<Set<string>>(new Set());
  const [subtaskAssignments, setSubtaskAssignments] = useState<Record<string, { slot1: string; slot2: string }>>({});
  const [isSavingShortlist, setIsSavingShortlist] = useState(false);
  const [isSavingAllotments, setIsSavingAllotments] = useState(false);
  const [submissionToggled, setSubmissionToggled] = useState(false);

  const loading = roundLoading || subtasksLoading || roundTeamsLoading;

  // Initialize form state when data is loaded
  useEffect(() => {
    if (round) {
      // Set breadcrumbs
      setBreadcrumbs([
        { label: "Rounds", href: "/admin/rounds" },
        {
          label: `Round ${round.round_number}`,
          href: `/admin/rounds/${roundId}`,
        },
      ]);

      setInstructions(round.instructions || "");
      if (round.start_time) {
        const date = new Date(round.start_time);
        const localIso = new Date(
          date.getTime() - date.getTimezoneOffset() * 60000,
        )
          .toISOString()
          .slice(0, 16);
        setStartTime(localIso);
      }
      if (round.end_time) {
        const date = new Date(round.end_time);
        const localIso = new Date(
          date.getTime() - date.getTimezoneOffset() * 60000,
        )
          .toISOString()
          .slice(0, 16);
        setEndTime(localIso);
      }
    }
  }, [round]);

  useEffect(() => {
    if (roundTeamsData?.teams_by_track) {
      const allowed = new Set<string>();
      const assignments: Record<string, { slot1: string; slot2: string }> = {};
      Object.values(roundTeamsData.teams_by_track).forEach((teams) => {
        teams.forEach((t) => {
          if (t.allowed) allowed.add(t.id);
          if (t.subtask_history?.options?.length) {
            assignments[t.id] = {
              slot1: t.subtask_history.options[0]?.id ?? "",
              slot2: t.subtask_history.options[1]?.id ?? "",
            };
          }
        });
      });
      setAllowedTeamIds(allowed);
      setSubtaskAssignments(assignments);
    }
  }, [roundTeamsData]);

  const handleUpdateRound = async () => {
    try {
      await updateRound({
        id: roundId,
        body: {
          instructions,
          start_time: startTime ? new Date(startTime).toISOString() : undefined,
          end_time: endTime ? new Date(endTime).toISOString() : undefined,
        },
      }).unwrap();
      toast.success("Round updated successfully");
    } catch (e) {
      console.error(e);
      toast.error("Error updating round");
    }
  };

  const handleCreateSubtask = async () => {
    if (!newSubtaskTitle || !newSubtaskDesc || !newSubtaskTrackId) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await createSubtask({ title: newSubtaskTitle, description: newSubtaskDesc, track_id: newSubtaskTrackId }).unwrap();
      toast.success("Subtask created successfully");
      setCreateSubtaskOpen(false);
      setNewSubtaskTitle(""); setNewSubtaskDesc(""); setNewSubtaskTrackId("");
    } catch {
      toast.error("Error creating subtask");
    }
  };

  const handleEditSubtask = (task: any) => {
    setEditSubtaskId(task._id || task.id);
    setEditSubtaskTitle(task.title || "");
    setEditSubtaskDesc(task.description || "");
    setEditSubtaskTrackId(task.track_id || "");
    setEditSubtaskOpen(true);
  };

  const handleUpdateSubtask = async () => {
    if (!editSubtaskId) return;
    setIsUpdatingSubtask(true);
    try {
      await updateSubtask({ id: editSubtaskId, body: { title: editSubtaskTitle, description: editSubtaskDesc, track_id: editSubtaskTrackId } }).unwrap();
      toast.success("Subtask updated");
      setEditSubtaskOpen(false);
    } catch {
      toast.error("Error updating subtask");
    } finally {
      setIsUpdatingSubtask(false);
    }
  ;}

  const handleDeleteSubtask = (id: string) => {
    setDeleteConfirmSubtaskId(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteSubtask = async () => {
    if (!deleteConfirmSubtaskId) return;
    setIsDeletingSubtask(true);
    try {
      await deleteSubtask(deleteConfirmSubtaskId).unwrap();
      toast.success("Subtask deleted");
      setIsDeleteConfirmOpen(false);
      setDeleteConfirmSubtaskId(null);
    } catch (e) {
      console.error(e);
      toast.error("Error deleting subtask");
    } finally {
      setIsDeletingSubtask(false);
    }
  };

  const handleToggleRoundStatus = async () => {
    if (!round) return;
    try {
      await toggleRoundStatus({
        id: roundId,
        action: round.is_active ? "stop" : "start",
      }).unwrap();
      toast.success(
        round.is_active
          ? "Round stopped successfully"
          : "Round started successfully",
      );
    } catch (e) {
      console.error(e);
      toast.error(
        round.is_active ? "Failed to stop round" : "Failed to start round",
      );
    }
  };

  const handleToggleSubmission = async (checked: boolean) => {
    setSubmissionToggled(checked);
    try {
      await updateRound({
        id: roundId,
        body: { is_active: checked },
      }).unwrap();
      toast.success(`Submissions ${checked ? "enabled" : "disabled"}`);
    } catch (e) {
      console.error(e);
      setSubmissionToggled(!checked);
      toast.error("Failed to toggle submission");
    }
  };

  const handleToggleTeamAllowed = (teamId: string) => {
    setAllowedTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId); else next.add(teamId);
      return next;
    });
  };

  const handleSaveShortlist = async () => {
    setIsSavingShortlist(true);
    try {
      await updateRoundTeams({ roundId, teamIds: [...allowedTeamIds] }).unwrap();
      toast.success("Shortlist saved");
    } catch {
      toast.error("Failed to save shortlist");
    } finally {
      setIsSavingShortlist(false);
    }
  };

  const handleSaveAllotments = async () => {
    const allocations = Object.entries(subtaskAssignments)
      .filter(([, v]) => v.slot1 || v.slot2)
      .map(([teamId, v]) => ({
        teamId,
        subtaskIds: [v.slot1, v.slot2].filter(Boolean),
      }));

    if (allocations.length === 0) {
      toast.error("No subtasks selected to save");
      return;
    }
    setIsSavingAllotments(true);
    try {
      await allocateSubtasks({ roundId, allocations }).unwrap();
      toast.success(`Subtask options assigned to ${allocations.length} team(s)`);
    } catch {
      toast.error("Failed to save subtask allotments");
    } finally {
      setIsSavingAllotments(false);
    }
  };

  const teamsByTrack: Record<string, RoundTeam[]> = roundTeamsData?.teams_by_track
    ? Object.fromEntries(
        Object.entries(roundTeamsData.teams_by_track).map(([track, teams]) => [
          track,
          [...teams].sort((a, b) => (b.score ?? -1) - (a.score ?? -1)),
        ]),
      )
    : {};

  if (loading) return <LoadingState message="Loading round details..." />;
  if (!round) return <LoadingState message="Round not found" />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Round {round.round_number}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={round.is_active ? "default" : "secondary"}>
              {round.is_active ? "Active" : "Inactive"}
            </Badge>
            <span className="text-sm text-muted-foreground">{round._id}</span>
          </div>
        </div>
          <Button
            onClick={handleToggleRoundStatus}
            className="gap-2 rounded-xl"
          >
            {round.is_active ? (
              <>
                <StopCircle className="size-4" /> Stop round
              </>
            ) : (
              <>
                <PlayCircle className="size-4" /> Start round
              </>
            )}
          </Button>
        </div>
      <Card className="w-full">
        <CardHeader className="flex w-full justify-between">
          <CardTitle>Round Settings</CardTitle>
          {/* Add Date pickers here later */}
          <Button onClick={handleUpdateRound} className="gap-2 w-fit">
            <Save className="size-4" /> Save
          </Button>
        </CardHeader>
        <CardContent className="flex w-full gap-3">
          <div className="grid grid-cols-1 w-2/3 gap-2">
            <div className="space-y-2 w-full">
              <Label>Instructions</Label>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Round instructions..."
                className="min-h-25"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 w-1/3">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="block"
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="block"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Subtasks</CardTitle>
          <Dialog open={createSubtaskOpen} onOpenChange={setCreateSubtaskOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="size-4" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Subtask</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Subtask Title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Track</Label>
                  <Select value={newSubtaskTrackId} onValueChange={setNewSubtaskTrackId}>
                    <SelectTrigger><SelectValue placeholder="Select track" /></SelectTrigger>
                    <SelectContent>{tracks.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newSubtaskDesc}
                    onChange={(e) => setNewSubtaskDesc(e.target.value)}
                    placeholder="Detailed description..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateSubtask}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={editSubtaskOpen} onOpenChange={setEditSubtaskOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Subtask</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={editSubtaskTitle}
                    onChange={(e) => setEditSubtaskTitle(e.target.value)}
                    placeholder="Subtask Title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Track</Label>
                  <Select value={editSubtaskTrackId} onValueChange={setEditSubtaskTrackId}>
                    <SelectTrigger><SelectValue placeholder="Select track" /></SelectTrigger>
                    <SelectContent>{tracks.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editSubtaskDesc}
                    onChange={(e) => setEditSubtaskDesc(e.target.value)}
                    placeholder="Detailed description..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditSubtaskOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateSubtask}
                  disabled={isUpdatingSubtask}
                >
                  {isUpdatingSubtask ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog
            open={isDeleteConfirmOpen}
            onOpenChange={setIsDeleteConfirmOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Subtask</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete this subtask? This action
                  cannot be undone.
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteSubtask}
                  disabled={isDeletingSubtask}
                >
                  {isDeletingSubtask ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {allSubtasks.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No subtasks defined.
            </p>
          ) : (
            <div className="space-y-3">
              {allSubtasks.map((task: any) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between p-4 rounded-lg border bg-muted/20"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{task.title}</h4>
                      {task.track ? (
                        <Badge variant="outline" className="text-xs">
                          {task.track}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {task.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditSubtask(task)}
                      className="hover:bg-muted"
                    >
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSubtask(task.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Users className="size-5 text-muted-foreground" /> Subtask Allotment</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Manually assign a subtask to each team for this round.</p>
          </div>
          <Button onClick={handleSaveAllotments} disabled={isSavingAllotments} className="gap-2">
            <Save className="size-4" />{isSavingAllotments ? "Saving..." : "Save Allotments"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.keys(teamsByTrack).length === 0 ? (
            <p className="text-sm text-muted-foreground">No teams found.</p>
          ) : (
            Object.entries(teamsByTrack).map(([trackName, teams]) => {
              const trackSubtasks = allSubtasks.filter(
                (s: any) => s.track_id === teams[0]?.track_id
              );
              return (
                <div key={trackName}>
                  <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                    <Badge variant="outline">{trackName}</Badge>
                    <span className="text-muted-foreground text-sm font-normal">
                      {teams.filter((t) => subtaskAssignments[t.id]).length} / {teams.length} assigned
                    </span>
                  </h3>
                  <div className="rounded-xl border border-border/50 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50 hover:bg-transparent">
                          <TableHead className="font-semibold">Team</TableHead>
                          <TableHead className="font-semibold">Team&apos;s Choice</TableHead>
                          <TableHead className="font-semibold">Assign Options (max 2)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teams.map((team) => (
                          <TableRow key={team.id} className="border-border/50">
                            <TableCell className="font-medium">{team.team_name}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {team.subtask_history?.selected?.title ?? <span className="italic">Not chosen yet</span>}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-2 min-w-[200px]">
                                <Select
                                  value={subtaskAssignments[team.id]?.slot1 ?? ""}
                                  onValueChange={(val) =>
                                    setSubtaskAssignments((prev) => ({
                                      ...prev,
                                      [team.id]: { ...prev[team.id], slot1: val },
                                    }))
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Option 1..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {trackSubtasks.length === 0 ? (
                                      <SelectItem value="__none" disabled>No subtasks for this track</SelectItem>
                                    ) : (
                                      trackSubtasks.map((s: any) => (
                                        <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={subtaskAssignments[team.id]?.slot2 ?? ""}
                                  onValueChange={(val) =>
                                    setSubtaskAssignments((prev) => ({
                                      ...prev,
                                      [team.id]: { ...prev[team.id], slot2: val },
                                    }))
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Option 2..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {trackSubtasks.length === 0 ? (
                                      <SelectItem value="__none" disabled>No subtasks for this track</SelectItem>
                                    ) : (
                                      trackSubtasks.map((s: any) => (
                                        <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Users className="size-5 text-muted-foreground" /> Shortlist Teams</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Check teams to shortlist for this round.</p>
          </div>
          <Button onClick={handleSaveShortlist} disabled={isSavingShortlist} className="gap-2">
            <Save className="size-4" />{isSavingShortlist ? "Saving..." : "Save Shortlist"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.keys(teamsByTrack).length === 0 ? (
            <p className="text-sm text-muted-foreground">No teams found for this round.</p>
          ) : (
            Object.entries(teamsByTrack).map(([trackName, teams]) => (
              <div key={trackName}>
                <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                  <Badge variant="outline">{trackName}</Badge>
                  <span className="text-muted-foreground text-sm font-normal">{teams.filter((t) => allowedTeamIds.has(t.id)).length} / {teams.length} shortlisted</span>
                </h3>
                <div className="rounded-xl border border-border/50 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="w-10">
                          <Checkbox
                            checked={teams.length > 0 && teams.every((t) => allowedTeamIds.has(t.id))}
                            onCheckedChange={(checked) => {
                              setAllowedTeamIds((prev) => {
                                const next = new Set(prev);
                                teams.forEach((t) => checked ? next.add(t.id) : next.delete(t.id));
                                return next;
                              });
                            }}
                          />
                        </TableHead>
                        <TableHead className="font-semibold">Team</TableHead>
                        <TableHead className="font-semibold text-right">Score</TableHead>
                        <TableHead className="font-semibold">Submission</TableHead>
                        <TableHead className="font-semibold">Subtask</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teams.map((team) => (
                        <TableRow
                          key={team.id}
                          className={cn("border-border/50 cursor-pointer", allowedTeamIds.has(team.id) && "bg-primary/5")}
                          onClick={() => handleToggleTeamAllowed(team.id)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox checked={allowedTeamIds.has(team.id)} onCheckedChange={() => handleToggleTeamAllowed(team.id)} />
                          </TableCell>
                          <TableCell className="font-medium">{team.team_name}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {team.score !== null ? <span className="text-primary">{team.score}</span> : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            {team.submission ? <Badge variant="default" className="text-xs">Submitted</Badge> : <Badge variant="outline" className="text-xs">None</Badge>}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{team.subtask_history?.selected?.title ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
