import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/config/db";
import Track from "@/models/Track";
import Subtask from "@/models/Subtask";
import { proxy } from "@/lib/proxy";
import { z } from "zod";

const updateTrackSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});

// GET: Get single track with subtasks
async function GETHandler(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> },
) {
  await connectDB();
  const { trackId } = await params;

  try {
    const track = await Track.findById(trackId).lean();

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Fetch all subtasks for this track
    const subtasks = await Subtask.find({ track_id: trackId })
      .select("_id title description is_active created_at")
      .lean();

    return NextResponse.json({
      id: track._id.toString(),
      name: track.name,
      description: track.description,
      is_active: track.is_active,
      created_at: track.created_at,
      subtasks: subtasks.map((subtask) => ({
        id: subtask._id.toString(),
        title: subtask.title,
        description: subtask.description,
        is_active: subtask.is_active,
        created_at: subtask.created_at,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch track" },
      { status: 500 },
    );
  }
}

export const GET = proxy(GETHandler, ["admin"]);

// PATCH: Update track
async function PATCHHandler(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> },
) {
  await connectDB();
  const { trackId } = await params;

  try {
    const body = await request.json();
    const validation = updateTrackSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { name, description, is_active } = validation.data;

    const track = await Track.findById(trackId);
    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Update name if provided
    if (name) {
      // Check if track name is already taken by another track
      const existingTrack = await Track.findOne({
        name,
        _id: { $ne: trackId },
      });
      if (existingTrack) {
        return NextResponse.json(
          { error: "Track name already exists" },
          { status: 400 },
        );
      }
      track.name = name;
    }

    // Update description if provided
    if (description !== undefined) {
      track.description = description;
    }

    // Update is_active if provided
    if (is_active !== undefined) {
      track.is_active = is_active;
    }

    await track.save();

    return NextResponse.json({
      message: "Track updated successfully",
      track: {
        id: track._id.toString(),
        name: track.name,
        description: track.description,
        is_active: track.is_active,
      },
    });
  } catch (error) {
    console.error("Error updating track:", error);
    return NextResponse.json(
      { error: "Failed to update track" },
      { status: 500 },
    );
  }
}

export const PATCH = proxy(PATCHHandler, ["admin"]);

// DELETE: Remove track
async function DELETEHandler(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> },
) {
  await connectDB();
  const { trackId } = await params;

  try {
    const track = await Track.findById(trackId);
    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Delete track
    await Track.findByIdAndDelete(trackId);

    return NextResponse.json({
      message: "Track deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting track:", error);
    return NextResponse.json(
      { error: "Failed to delete track" },
      { status: 500 },
    );
  }
}

export const DELETE = proxy(DELETEHandler, ["admin"]);
