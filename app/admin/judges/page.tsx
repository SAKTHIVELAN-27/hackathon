"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingState } from "@/components/loading-state";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import {
  useGetJudgesQuery,
  useGetAdminTeamsQuery,
  useGetTracksQuery,
  useCreateJudgeMutation,
  useUpdateJudgeMutation,
  useDeleteJudgeMutation,
  useAssignTeamsToJudgeMutation,
} from "@/lib/redux/api/adminApi";
import type { Judge } from "@/lib/redux/api/types";

export default function JudgesPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data: judges = [], isLoading: judgesLoading } = useGetJudgesQuery();
  const { data: allTeams = [], isLoading: teamsLoading } = useGetAdminTeamsQuery();
  const { data: tracks = [] } = useGetTracksQuery();

  const [createJudge] = useCreateJudgeMutation();
  const [updateJudge] = useUpdateJudgeMutation();
  const [deleteJudge] = useDeleteJudgeMutation();
  const [assignJudge] = useAssignTeamsToJudgeMutation();

  // Create state
  const [createOpen, setCreateOpen] = useState(false);
  const [newJudgeName, setNewJudgeName] = useState("");
  const [newJudgeEmail, setNewJudgeEmail] = useState("");
  const [newJudgeTrackId, setNewJudgeTrackId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editJudgeId, setEditJudgeId] = useState("");
  const [editJudgeName, setEditJudgeName] = useState("");
  const [editJudgeEmail, setEditJudgeEmail] = useState("");
  const [editJudgeTrackId, setEditJudgeTrackId] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Assign state
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null);
  const [assignedTeamIds, setAssignedTeamIds] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  const loading = judgesLoading || teamsLoading;

  const openEdit = (judge: Judge) => {
    setEditJudgeId(judge.id);
    setEditJudgeName(judge.judge_name || "");
    setEditJudgeEmail(judge.email || "");
    setEditJudgeTrackId(judge.track_id || "");
    setEditOpen(true);
  };

  const openAssign = (judge: Judge) => {
    setSelectedJudge(judge);
    setAssignedTeamIds(judge.teams_assigned?.map((t: any) => (typeof t === "string" ? t : t.id)) ?? []);
    setAssignOpen(true);
  };

  const handleCreate = async () => {
    if (!newJudgeName || !newJudgeEmail || !newJudgeTrackId) {
      toast.error("Please fill all fields");
      return;
    }
    setIsCreating(true);
    try {
      await createJudge({ judge_name: newJudgeName, email: newJudgeEmail, track_id: newJudgeTrackId }).unwrap();
      toast.success("Judge created");
      setCreateOpen(false);
      setNewJudgeName("");
      setNewJudgeEmail("");
      setNewJudgeTrackId("");
    } catch {
      toast.error("Error creating judge");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!editJudgeId) return;
    setIsEditing(true);
    try {
      await updateJudge({
        id: editJudgeId,
        judge_name: editJudgeName,
        email: editJudgeEmail,
        track_id: editJudgeTrackId,
      }).unwrap();
      toast.success("Judge updated");
      setEditOpen(false);
    } catch {
      toast.error("Error updating judge");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this judge?")) return;
    try {
      await deleteJudge(id).unwrap();
      toast.success("Judge deleted");
    } catch {
      toast.error("Error deleting judge");
    }
  };

  const handleAssign = async () => {
    if (!selectedJudge) return;
    setIsAssigning(true);
    try {
      await assignJudge({ judgeId: selectedJudge.id, teamIds: assignedTeamIds }).unwrap();
      toast.success("Assignments saved");
      setAssignOpen(false);
    } catch {
      toast.error("Error assigning teams");
    } finally {
      setIsAssigning(false);
    }
  };

  if (!mounted || loading) return <LoadingState message="Loading judges..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Judges</h1>

        {/* Create */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="size-4" /> Add Judge</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Judge</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={newJudgeName} onChange={(e) => setNewJudgeName(e.target.value)} placeholder="Judge name" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={newJudgeEmail} onChange={(e) => setNewJudgeEmail(e.target.value)} placeholder="judge@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Track</Label>
                <Select value={newJudgeTrackId} onValueChange={setNewJudgeTrackId}>
                  <SelectTrigger><SelectValue placeholder="Select track" /></SelectTrigger>
                  <SelectContent>
                    {tracks.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Judge</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editJudgeName} onChange={(e) => setEditJudgeName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editJudgeEmail} onChange={(e) => setEditJudgeEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Track</Label>
              <Select value={editJudgeTrackId} onValueChange={setEditJudgeTrackId}>
                <SelectTrigger><SelectValue placeholder="Select track" /></SelectTrigger>
                <SelectContent>
                  {tracks.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isEditing}>
              {isEditing ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Assign teams to {selectedJudge?.judge_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-[50vh] overflow-y-auto">
            {allTeams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No teams available.</p>
            ) : (
              allTeams.map((team) => {
                const checked = assignedTeamIds.includes(team.id);
                return (
                  <div
                    key={team.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 cursor-pointer"
                    onClick={() =>
                      setAssignedTeamIds((prev) =>
                        prev.includes(team.id)
                          ? prev.filter((id) => id !== team.id)
                          : [...prev, team.id]
                      )
                    }
                  >
                    <Checkbox
                      checked={checked}
                      onClick={(e) => e.stopPropagation()}
                      onCheckedChange={() =>
                        setAssignedTeamIds((prev) =>
                          prev.includes(team.id)
                            ? prev.filter((id) => id !== team.id)
                            : [...prev, team.id]
                        )
                      }
                    />
                    <span className="text-sm font-medium">{team.team_name}</span>
                    {team.track && (
                      <Badge variant="outline" className="text-xs ml-auto">{team.track}</Badge>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={isAssigning}>
              {isAssigning ? "Saving..." : "Save Assignments"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Judges ({judges.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Track</TableHead>
                <TableHead>Assigned Teams</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {judges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No judges yet
                  </TableCell>
                </TableRow>
              ) : (
                judges.map((judge) => (
                  <TableRow key={judge.id}>
                    <TableCell className="font-medium">{judge.judge_name}</TableCell>
                    <TableCell className="text-muted-foreground">{judge.email ?? "—"}</TableCell>
                    <TableCell>
                      {judge.track ? (
                        <Badge variant="outline">{judge.track}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>{judge.teams_assigned?.length ?? 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openAssign(judge)}
                          title="Assign teams"
                        >
                          <UserCheck className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(judge)}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(judge.id)}                          >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
