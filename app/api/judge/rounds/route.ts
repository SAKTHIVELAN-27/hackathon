import { connectDB } from "@/config/db";
import { NextRequest, NextResponse } from "next/server";
import Round from "@/models/Round";
import { proxy } from "@/lib/proxy";

// GET: List all rounds
async function GETHandler(req: NextRequest) {
  await connectDB();

  try {
    const rounds = await Round.find()
      .sort({ round_number: 1 })
      .select("_id round_number start_time end_time is_active instructions")
      .lean();

    const formattedRounds = rounds.map((round) => ({
      id: round._id.toString(),
      round_number: round.round_number,
      start_time: round.start_time,
      end_time: round.end_time,
      is_active: round.is_active,
      instructions: round.instructions,
    }));

    return NextResponse.json(formattedRounds);
  } catch (error) {
    console.error("Error fetching rounds:", error);
    return NextResponse.json(
      { error: "Failed to fetch rounds" },
      { status: 500 },
    );
  }
}

export const GET = proxy(GETHandler, ["judge", "admin"]);
