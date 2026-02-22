"use client";

import React, { useState } from "react";
import type { SubtaskSummary } from "./SubtaskCard";
import { toast } from "sonner";
import {
  useSubmitProjectMutation,
  useUpdateSubmissionMutation,
} from "@/lib/redux/api/teamApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

type Props = {
  subtask: SubtaskSummary;
  allowFileUpload?: boolean;
  roundId?: string | undefined;
  isEditing?: boolean;
  disabled?: boolean;
  submission?: {
    github_link?: string;
    file_url?: string;
    overview?: string;
  };
  onFinalSubmitted?: (payload: {
    subtaskId: string;
    githubUrl?: string;
    docUrl?: string;
    fileName?: string;
  }) => void;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function SubmissionForm({
  subtask,
  onFinalSubmitted,
  allowFileUpload,
  roundId,
  isEditing = false,
  disabled = false,
  submission,
  onSuccess,
  onCancel,
}: Props) {
  const [githubUrl, setGithubUrl] = useState(submission?.github_link || "");
  const [docUrl, setDocUrl] = useState(submission?.file_url || "");
  const [overview, setOverview] = useState(submission?.overview || "");
  const [busy, setBusy] = useState(false);
  const [final, setFinal] = useState(false);

  // RTK Query hooks
  const [submitProject, { isLoading: isSubmitting }] =
    useSubmitProjectMutation();
  const [updateSubmission, { isLoading: isUpdating }] =
    useUpdateSubmissionMutation();

  const isLoading = isSubmitting || isUpdating;
  const canSubmit = (githubUrl || docUrl) && !isLoading && !final;

  async function handleFinalSubmit() {
    if (!canSubmit) return;

    try {
      const payload = {
        roundId: roundId ?? "",
        subtaskId: subtask.id,
        fileUrl: docUrl,
        githubLink: githubUrl,
        overview: overview,
      };

      if (isEditing) {
        await updateSubmission(payload).unwrap();
        toast.success("Submission updated successfully!");
      } else {
        await submitProject(payload).unwrap();
        toast.success("Project submitted successfully!");
      }

      setFinal(true);

      if (isEditing && onSuccess) {
        onSuccess();
      } else {
        onFinalSubmitted?.({
          subtaskId: subtask.id,
          githubUrl,
          docUrl,
          fileName: overview ? "Overview provided" : undefined,
        });
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Submission failed: " + (e?.data?.error || "Unknown error"));
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="github-url">GitHub Repository URL</Label>
          <Input
            id="github-url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/your-repo"
            type="url"
            disabled={disabled || final}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="doc-url">Presentation Link / Document URL</Label>
          <Input
            id="doc-url"
            value={docUrl}
            onChange={(e) => setDocUrl(e.target.value)}
            placeholder="https://drive.google.com/your-doc"
            type="url"
            disabled={disabled || final}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="overview">Project Overview (Optional)</Label>
          <Textarea
            id="overview"
            value={overview}
            onChange={(e) => setOverview(e.target.value)}
            placeholder="Brief description of your project..."
            rows={4}
            disabled={disabled || final}
            className="resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleFinalSubmit}
          disabled={!canSubmit || final}
          className="flex-1"
          size="lg"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {final
            ? isEditing
              ? "Updated Successfully"
              : "Submitted Successfully"
            : isLoading
              ? isEditing
                ? "Updating..."
                : "Submitting..."
              : isEditing
                ? "Save Changes"
                : "Final Submit"}
        </Button>
        {isEditing && onCancel && (
          <Button
            onClick={onCancel}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
