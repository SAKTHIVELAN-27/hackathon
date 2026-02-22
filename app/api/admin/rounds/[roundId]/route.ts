import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/config/db";
import Round from "@/models/Round";
import Submission from "@/models/Submission";
import RoundOptions from "@/models/RoundOptions";
import { proxy } from "@/lib/proxy";
import { z } from "zod";

const updateRoundSchema = z.object({
  round_number: z.number().int().positive().optional(),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  instructions: z.string().optional(),
  is_active: z.boolean().optional(),
});

// GET: Fetch a specific round
async function GETHandler(
  request: NextRequest,
  { params }: { params: Promise<{ roundId: string }> },
) {
  await connectDB();
  const { roundId } = await params;

  try {
    const round = await Round.findById(roundId);
    if (!round) {
      return NextResponse.json({ error: "Round not found" }, { status: 404 });
    }
    return NextResponse.json(round);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch round" },
      { status: 500 },
    );
  }
}

export const GET = proxy(GETHandler, ["admin"]);

// PATCH: Update round (field updates or actions)
async function PATCHHandler(
  request: NextRequest,
  { params }: { params: Promise<{ roundId: string }> },
) {
  await connectDB();
  const { roundId } = await params;

  try {
    const body = await request.json();

    // Check if this is an action request
    if (body.action) {
      const round = await Round.findById(roundId);
      if (!round) {
        return NextResponse.json({ error: "Round not found" }, { status: 404 });
      }

      if (body.action === "start" || body.action === "activate") {
        // Deactivate all other rounds
        await Round.updateMany({}, { is_active: false });
        round.is_active = true;
      } else if (body.action === "stop" || body.action === "deactivate") {
        round.is_active = false;
      } else {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
      }

      await round.save();

      return NextResponse.json({
        message: `Round ${body.action} successful`,
        round,
      });
    }

    // Otherwise, update fields
    const validation = updateRoundSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updateData: any = {};
    if (validation.data.round_number !== undefined)
      updateData.round_number = validation.data.round_number;
    if (validation.data.start_time)
      updateData.start_time = new Date(validation.data.start_time);
    if (validation.data.end_time)
      updateData.end_time = new Date(validation.data.end_time);
    if (validation.data.instructions !== undefined)
      updateData.instructions = validation.data.instructions;
    if (validation.data.is_active !== undefined)
      updateData.is_active = validation.data.is_active;

    const updatedRound = await Round.findByIdAndUpdate(roundId, updateData, {
      new: true,
    });

    if (!updatedRound) {
      return NextResponse.json({ error: "Round not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Round updated successfully",
      round: updatedRound,
    });
  } catch (error) {
    console.error("Error updating round:", error);
    return NextResponse.json(
      { error: "Failed to update round" },
      { status: 500 },
    );
  }
}

export const PATCH = proxy(PATCHHandler, ["admin"]);

// DELETE: Delete a round and cascade to related data
async function DELETEHandler(
  request: NextRequest,
  { params }: { params: Promise<{ roundId: string }> },
) {
  await connectDB();
  const { roundId } = await params;

  try {
    const deletedRound = await Round.findByIdAndDelete(roundId);
    if (!deletedRound) {
      return NextResponse.json({ error: "Round not found" }, { status: 404 });
    }

    // Cascade Delete
    await Submission.deleteMany({ round_id: roundId });
    await RoundOptions.deleteMany({ round_id: roundId });

    return NextResponse.json({
      message: "Round deleted successfully",
      details: "Cascaded delete to submissions and round options completed.",
    });
  } catch (error) {
    console.error("Error deleting round:", error);
    return NextResponse.json(
      { error: "Failed to delete round" },
      { status: 500 },
    );
  }
}

export const DELETE = proxy(DELETEHandler, ["admin"]);
