import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/config/db";
import Track from "@/models/Track";
import { trackSchema } from "@/lib/validations";
import { proxy } from "@/lib/proxy";

// GET: List all tracks
async function GETHandler(req: NextRequest) {
  await connectDB();

  try {
    const tracks = await Track.find({}).sort({ created_at: -1 }).lean();

    const tracksData = tracks.map((track: any) => ({
      id: track._id.toString(),
      name: track.name,
      description: track.description,
      is_active: track.is_active,
      created_at: track.created_at,
    }));

    return NextResponse.json(tracksData);
  } catch (error) {
    console.error("Error fetching tracks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracks" },
      { status: 500 },
    );
  }
}

export const GET = proxy(GETHandler, ["admin"]);

// POST: Create a new track
async function POSTHandler(request: NextRequest) {
  await connectDB();

  try {
    const body = await request.json();

    const validation = trackSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { name, description, is_active } = validation.data;

    // Check if track name already exists
    const existingTrack = await Track.findOne({ name });
    if (existingTrack) {
      return NextResponse.json(
        { error: "Track name already exists" },
        { status: 400 },
      );
    }

    // Create track
    const newTrack = await Track.create({
      name,
      description: description || "",
      is_active: is_active !== undefined ? is_active : true,
    });

    return NextResponse.json(
      {
        message: "Track created successfully",
        track: {
          id: newTrack._id.toString(),
          name: newTrack.name,
          description: newTrack.description,
          is_active: newTrack.is_active,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating track:", error);
    return NextResponse.json(
      { error: "Failed to create track" },
      { status: 500 },
    );
  }
}

export const POST = proxy(POSTHandler, ["admin"]);
