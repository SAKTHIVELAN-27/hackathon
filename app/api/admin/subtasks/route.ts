import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/config/db";
import Subtask from "@/models/Subtask";
import Track from "@/models/Track";
import { subtaskSchema } from "@/lib/validations";
import { proxy } from "@/lib/proxy";

// GET: Fetch all subtasks, optionally filtered by track_id
async function GETHandler(req: NextRequest) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const track_id = searchParams.get("track_id");

  try {
    const query = track_id ? { track_id } : {};
    const subtasks = await Subtask.find(query)
      .populate("track_id", "name")
      .sort({ created_at: -1 })
      .lean();

    const formattedSubtasks = subtasks.map((subtask: any) => ({
      id: subtask._id.toString(),
      title: subtask.title,
      description: subtask.description,
      track: subtask.track_id?.name || "N/A",
      track_id: subtask.track_id?._id?.toString() || null,
      is_active: subtask.is_active,
      created_at: subtask.created_at,
    }));

    return NextResponse.json(formattedSubtasks);
  } catch (error) {
    console.error("Error fetching subtasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch subtasks" },
      { status: 500 },
    );
  }
}

export const GET = proxy(GETHandler, ["admin"]);

// POST: Create a new subtask
async function POSTHandler(req: NextRequest) {
  await connectDB();

  try {
    const body = await req.json();
    const validation = subtaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { title, description, track_id, is_active } = validation.data;

    // Verify track exists
    const track = await Track.findById(track_id);
    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Create subtask
    const subtask = await Subtask.create({
      title,
      description,
      track_id,
      is_active: is_active !== undefined ? is_active : true,
    });

    // Populate response
    const populatedSubtask = await Subtask.findById(subtask._id)
      .populate("track_id", "name")
      .lean();

    return NextResponse.json(
      {
        message: "Subtask created successfully",
        subtask: {
          id: populatedSubtask._id.toString(),
          title: populatedSubtask.title,
          description: populatedSubtask.description,
          track: (populatedSubtask.track_id as any)?.name,
          track_id: (populatedSubtask.track_id as any)?._id?.toString(),
          is_active: populatedSubtask.is_active,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating subtask:", error);
    return NextResponse.json(
      { error: "Failed to create subtask" },
      { status: 500 },
    );
  }
}

export const POST = proxy(POSTHandler, ["admin"]);
