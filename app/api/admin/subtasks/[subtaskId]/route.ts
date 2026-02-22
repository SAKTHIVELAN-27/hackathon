import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/config/db";
import Subtask from "@/models/Subtask";
import Track from "@/models/Track";
import RoundOptions from "@/models/RoundOptions";
import { proxy } from "@/lib/proxy";
import { z } from "zod";

const updateSubtaskSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  track_id: z.string().min(1).optional(),
  is_active: z.boolean().optional(),
});

// GET: Get single subtask
async function GETHandler(
  request: NextRequest,
  { params }: { params: Promise<{ subtaskId: string }> },
) {
  await connectDB();
  const { subtaskId } = await params;

  try {
    const subtask = await Subtask.findById(subtaskId)
      .populate("track_id", "name")
      .lean();

    if (!subtask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: subtask._id.toString(),
      title: subtask.title,
      description: subtask.description,
      track: (subtask.track_id as any)?.name || "N/A",
      track_id: (subtask.track_id as any)?._id?.toString() || null,
      is_active: subtask.is_active,
      created_at: subtask.created_at,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch subtask" },
      { status: 500 },
    );
  }
}

export const GET = proxy(GETHandler, ["admin"]);

// PATCH: Update a subtask
async function PATCHHandler(
  request: NextRequest,
  { params }: { params: Promise<{ subtaskId: string }> },
) {
  await connectDB();
  const { subtaskId } = await params;

  try {
    const body = await request.json();
    const validation = updateSubtaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { title, description, track_id, is_active } = validation.data;

    const subtask = await Subtask.findById(subtaskId);
    if (!subtask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    // Update title if provided
    if (title) {
      subtask.title = title;
    }

    // Update description if provided
    if (description) {
      subtask.description = description;
    }

    // Update track_id if provided
    if (track_id) {
      const track = await Track.findById(track_id);
      if (!track) {
        return NextResponse.json({ error: "Track not found" }, { status: 404 });
      }
      subtask.track_id = track_id as any;
    }

    // Update is_active if provided
    if (is_active !== undefined) {
      subtask.is_active = is_active;
    }

    await subtask.save();

    // Return updated subtask
    const updatedSubtask = await Subtask.findById(subtaskId)
      .populate("track_id", "name")
      .lean();

    return NextResponse.json({
      message: "Subtask updated successfully",
      subtask: {
        id: updatedSubtask._id.toString(),
        title: updatedSubtask.title,
        description: updatedSubtask.description,
        track: (updatedSubtask.track_id as any)?.name,
        track_id: (updatedSubtask.track_id as any)?._id?.toString(),
        is_active: updatedSubtask.is_active,
      },
    });
  } catch (error) {
    console.error("Error updating subtask:", error);
    return NextResponse.json(
      { error: "Failed to update subtask" },
      { status: 500 },
    );
  }
}

export const PATCH = proxy(PATCHHandler, ["admin"]);

// DELETE: Remove a subtask
async function DELETEHandler(
  request: NextRequest,
  { params }: { params: Promise<{ subtaskId: string }> },
) {
  await connectDB();
  const { subtaskId } = await params;

  try {
    const deletedSubtask = await Subtask.findByIdAndDelete(subtaskId);

    if (!deletedSubtask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    // Cascade Delete - Remove from RoundOptions
    await RoundOptions.updateMany(
      { options: subtaskId },
      { $pull: { options: subtaskId } },
    );

    await RoundOptions.updateMany(
      { selected: subtaskId },
      { $set: { selected: null } },
    );

    return NextResponse.json({
      message: "Subtask deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting subtask:", error);
    return NextResponse.json(
      { error: "Failed to delete subtask" },
      { status: 500 },
    );
  }
}

export const DELETE = proxy(DELETEHandler, ["admin"]);
