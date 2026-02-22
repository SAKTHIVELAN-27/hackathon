"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { LoadingState } from "@/components/loading-state";
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";
import {
  useGetTracksQuery,
  useCreateTrackMutation,
  useUpdateTrackMutation,
  useDeleteTrackMutation,
} from "@/lib/redux/api/adminApi";
import { setBreadcrumbs } from "@/lib/hooks/useBreadcrumb";
import type { Track } from "@/lib/redux/api/types";

export default function TracksPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Tracks", href: "/admin/tracks" },
    ]);
    setMounted(true);
  }, []);

  const { data: tracks = [], isLoading } = useGetTracksQuery();
  const [createTrack] = useCreateTrackMutation();
  const [updateTrack] = useUpdateTrackMutation();
  const [deleteTrack] = useDeleteTrackMutation();

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [deleteName, setDeleteName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("Track name is required");
      return;
    }
    setIsCreating(true);
    try {
      await createTrack({ name: newName.trim(), description: newDesc.trim() }).unwrap();
      toast.success("Track created successfully");
      setCreateOpen(false);
      setNewName("");
      setNewDesc("");
    } catch (err: any) {
      toast.error(err?.data?.error || "Failed to create track");
    } finally {
      setIsCreating(false);
    }
  };

  const openEdit = (track: Track) => {
    setEditId(track.id);
    setEditName(track.name);
    setEditDesc(track.description ?? "");
    setEditActive(track.is_active ?? true);
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editName.trim()) {
      toast.error("Track name is required");
      return;
    }
    setIsEditing(true);
    try {
      await updateTrack({
        id: editId,
        name: editName.trim(),
        description: editDesc.trim(),
        is_active: editActive,
      }).unwrap();
      toast.success("Track updated");
      setEditOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.error || "Failed to update track");
    } finally {
      setIsEditing(false);
    }
  };

  const openDelete = (track: Track) => {
    setDeleteId(track.id);
    setDeleteName(track.name);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTrack(deleteId).unwrap();
      toast.success(`Track "${deleteName}" deleted`);
      setDeleteOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.error || "Failed to delete track");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!mounted || isLoading) return <LoadingState message="Loading tracks..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Tracks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage competition tracks. Each team and judge is assigned to a track.
          </p>
        </div>

        {/* Create Track Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" /> Add Track
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Track</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="new-name">Track Name *</Label>
                <Input
                  id="new-name"
                  placeholder="e.g. Web Development"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-desc">Description</Label>
                <Textarea
                  id="new-desc"
                  placeholder="Brief description of this track..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Track"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tracks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="size-5 text-muted-foreground" /> All Tracks ({tracks.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Tag className="size-10 opacity-30" />
              <p className="text-sm">No tracks yet. Add your first track above.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tracks.map((track) => (
                  <TableRow key={track.id}>
                    <TableCell className="font-medium">{track.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {track.description || "—"}
                    </TableCell>
                    <TableCell>
                      {track.is_active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(track)}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDelete(track)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Track</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Track Name *</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="edit-active"
                checked={editActive}
                onCheckedChange={setEditActive}
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isEditing}>
              {isEditing ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Track</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <span className="font-semibold text-foreground">{deleteName}</span>?
            This will not delete teams or subtasks assigned to this track.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Track"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
