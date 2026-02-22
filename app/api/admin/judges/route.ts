import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/config/db";
import Judge from "@/models/Judge";
import User from "@/models/User";
import Track from "@/models/Track";
import { judgeSchema } from "@/lib/validations";
import { proxy } from "@/lib/proxy";

// GET: List all judges with their track information
async function GETHandler(req: NextRequest) {
  await connectDB();

  try {
    const judges = await Judge.find({})
      .populate("user_id", "email")
      .populate("track_id", "name")
      .lean();

    const judgesData = judges.map((judge: any) => ({
      id: judge._id.toString(),
      judge_name: judge.judge_name,
      email: judge.user_id?.email || "N/A",
      track: judge.track_id?.name || "N/A",
      track_id: judge.track_id?._id?.toString() || null,
      teams_assigned: judge.teams_assigned || [],
      created_at: judge.created_at,
    }));

    return NextResponse.json(judgesData);
  } catch (error) {
    console.error("Error fetching judges:", error);
    return NextResponse.json(
      { error: "Failed to fetch judges" },
      { status: 500 },
    );
  }
}

export const GET = proxy(GETHandler, ["admin"]);

// POST: Create a new judge
async function POSTHandler(request: NextRequest) {
  await connectDB();

  try {
    const body = await request.json();

    const validation = judgeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { judge_name, email, track_id } = validation.data;

    // Verify track exists
    const track = await Track.findById(track_id);
    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // If user exists, check if they're already a judge
      const existingJudge = await Judge.findOne({ user_id: user._id });
      if (existingJudge) {
        return NextResponse.json(
          { error: "Judge profile already exists for this email" },
          { status: 400 },
        );
      }

      // If user has a different role, return error
      if (user.role !== "judge") {
        return NextResponse.json(
          { error: `Email is already registered as ${user.role}` },
          { status: 400 },
        );
      }
    } else {
      // Create new user with judge role
      user = await User.create({
        email,
        role: "judge",
      });
    }

    // Create judge profile
    const newJudge = await Judge.create({
      user_id: user._id,
      judge_name,
      track_id,
    });

    // Populate the response
    const populatedJudge = await Judge.findById(newJudge._id)
      .populate("user_id", "email")
      .populate("track_id", "name")
      .lean();

    return NextResponse.json(
      {
        message: "Judge created successfully",
        judge: {
          id: populatedJudge._id.toString(),
          judge_name: populatedJudge.judge_name,
          email: (populatedJudge.user_id as any)?.email,
          track: (populatedJudge.track_id as any)?.name,
          track_id: (populatedJudge.track_id as any)?._id?.toString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating judge:", error);
    return NextResponse.json(
      { error: "Failed to create judge" },
      { status: 500 },
    );
  }
}

export const POST = proxy(POSTHandler, ["admin"]);
