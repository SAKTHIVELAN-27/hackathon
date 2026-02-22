import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/config/db";
import Judge from "@/models/Judge";
import User from "@/models/User";
import Track from "@/models/Track";
import { proxy } from "@/lib/proxy";
import { z } from "zod";

const updateJudgeSchema = z.object({
  judge_name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  track_id: z.string().min(1).optional(),
});

// GET: Get single judge details
async function GETHandler(
  request: NextRequest,
  { params }: { params: Promise<{ judgeId: string }> },
) {
  await connectDB();
  const { judgeId } = await params;

  try {
    const judge = await Judge.findById(judgeId)
      .populate("user_id", "email")
      .populate("track_id", "name")
      .lean();

    if (!judge) {
      return NextResponse.json({ error: "Judge not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: judge._id.toString(),
      judge_name: judge.judge_name,
      email: (judge.user_id as any)?.email || "N/A",
      track: (judge.track_id as any)?.name || "N/A",
      track_id: (judge.track_id as any)?._id?.toString() || null,
      teams_assigned: judge.teams_assigned || [],
      created_at: judge.created_at,
    });
  } catch (error) {
    console.error("Error fetching judge:", error);
    return NextResponse.json(
      { error: "Failed to fetch judge" },
      { status: 500 },
    );
  }
}

export const GET = proxy(GETHandler, ["admin"]);

// PATCH: Update judge details
async function PATCHHandler(
  request: NextRequest,
  { params }: { params: Promise<{ judgeId: string }> },
) {
  await connectDB();
  const { judgeId } = await params;

  try {
    const body = await request.json();
    const validation = updateJudgeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { judge_name, email, track_id } = validation.data;

    const judge = await Judge.findById(judgeId);
    if (!judge) {
      return NextResponse.json({ error: "Judge not found" }, { status: 404 });
    }

    // Update judge_name if provided
    if (judge_name) {
      judge.judge_name = judge_name;
    }

    // Update track_id if provided
    if (track_id) {
      const track = await Track.findById(track_id);
      if (!track) {
        return NextResponse.json({ error: "Track not found" }, { status: 404 });
      }
      judge.track_id = track_id as any;
    }

    // Update user email if provided
    if (email && judge.user_id) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: judge.user_id },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Email is already in use" },
          { status: 400 },
        );
      }

      await User.findByIdAndUpdate(judge.user_id, { email });
    }

    await judge.save();

    // Return updated judge
    const updatedJudge = await Judge.findById(judgeId)
      .populate("user_id", "email")
      .populate("track_id", "name")
      .lean();

    return NextResponse.json(
      {
        message: "Judge updated successfully",
        judge: {
          id: updatedJudge?._id.toString(),
          judge_name: updatedJudge?.judge_name,
          email: (updatedJudge?.user_id as any)?.email || "N/A",
          track: (updatedJudge?.track_id as any)?.name || "N/A",
          track_id: (updatedJudge?.track_id as any)?._id?.toString() || null,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating judge:", error);
    return NextResponse.json(
      { error: "Failed to update judge" },
      { status: 500 },
    );
  }
}

export const PATCH = proxy(PATCHHandler, ["admin"]);

// DELETE: Remove judge
async function DELETEHandler(
  request: NextRequest,
  { params }: { params: Promise<{ judgeId: string }> },
) {
  await connectDB();
  const { judgeId } = await params;

  try {
    const judge = await Judge.findById(judgeId);
    if (!judge) {
      return NextResponse.json({ error: "Judge not found" }, { status: 404 });
    }

    // Delete Judge record
    await Judge.findByIdAndDelete(judgeId);

    // Optionally delete User account
    await User.deleteOne({ _id: judge.user_id });

    return NextResponse.json({
      message: "Judge removed successfully",
    });
  } catch (error) {
    console.error("Error deleting judge:", error);
    return NextResponse.json(
      { error: "Failed to delete judge" },
      { status: 500 },
    );
  }
}

export const DELETE = proxy(DELETEHandler, ["admin"]);
