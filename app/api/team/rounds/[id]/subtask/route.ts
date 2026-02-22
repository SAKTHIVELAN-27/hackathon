import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import RoundOptions from "@/models/RoundOptions";
import User from "@/models/User";
import Subtask from "@/models/Subtask";
import Round from "@/models/Round";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";
import { proxy } from "@/lib/proxy";
import { z } from "zod";

const subtaskSelectionSchema = z.object({
  subtaskId: z.string().min(1, "Subtask ID is required"),
});

async function POSTHandler(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  const { id: roundId } = await context.params;

  await connectDB();

  const user = await User.findOne({ email }).lean();
  if (!user?.team_id) {
    return NextResponse.json({ error: "no team" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const validation = subtaskSelectionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { subtaskId } = validation.data;

    // Verify round exists
    const round = await Round.findById(roundId);
    if (!round) {
      return NextResponse.json({ error: "Round not found" }, { status: 404 });
    }

    // Verify subtask exists
    const subtask = await Subtask.findById(subtaskId);
    if (!subtask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    // Check if team already has a RoundOptions entry for this round
    const existingOption = await RoundOptions.findOne({
      team_id: user.team_id,
      round_id: new mongoose.Types.ObjectId(roundId),
    });

    if (existingOption) {
      // Update the selected subtask
      existingOption.selected = new mongoose.Types.ObjectId(subtaskId);
      existingOption.selected_at = new Date();
      await existingOption.save();

      const populated = await RoundOptions.findById(existingOption._id)
        .populate("selected", "title description")
        .lean();

      return NextResponse.json({
        message: "Subtask selection updated successfully",
        roundOption: {
          id: populated._id.toString(),
          team_id: populated.team_id.toString(),
          round_id: populated.round_id.toString(),
          selected: populated.selected
            ? {
                id: (populated.selected as any)._id.toString(),
                title: (populated.selected as any).title,
                description: (populated.selected as any).description,
              }
            : null,
          selected_at: populated.selected_at,
        },
      });
    } else {
      // Create new RoundOptions entry
      const newOption = await RoundOptions.create({
        team_id: user.team_id,
        round_id: new mongoose.Types.ObjectId(roundId),
        options: [], // Will be populated when admin assigns subtasks
        selected: new mongoose.Types.ObjectId(subtaskId),
        selected_at: new Date(),
      });

      const populated = await RoundOptions.findById(newOption._id)
        .populate("selected", "title description")
        .lean();

      return NextResponse.json(
        {
          message: "Subtask selection created successfully",
          roundOption: {
            id: populated._id.toString(),
            team_id: populated.team_id.toString(),
            round_id: populated.round_id.toString(),
            selected: populated.selected
              ? {
                  id: (populated.selected as any)._id.toString(),
                  title: (populated.selected as any).title,
                  description: (populated.selected as any).description,
                }
              : null,
            selected_at: populated.selected_at,
          },
        },
        { status: 201 },
      );
    }
  } catch (err: any) {
    console.error("Error in subtask selection:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const POST = proxy(POSTHandler, ["team"]);

// GET: Retrieve current subtask selection for the round
async function GETHandler(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { id: roundId } = await context.params;

  await connectDB();

  const user = await User.findOne({ email }).lean();
  if (!user?.team_id) {
    return NextResponse.json({ error: "no team" }, { status: 400 });
  }

  try {
    const roundOption = await RoundOptions.findOne({
      team_id: user.team_id,
      round_id: new mongoose.Types.ObjectId(roundId),
    })
      .populate("selected", "title description")
      .populate("options", "title description")
      .lean();

    if (!roundOption) {
      return NextResponse.json({
        roundOption: null,
      });
    }

    return NextResponse.json({
      roundOption: {
        id: roundOption._id.toString(),
        team_id: roundOption.team_id.toString(),
        round_id: roundOption.round_id.toString(),
        options: (roundOption.options as any[]).map((opt) => ({
          id: opt._id.toString(),
          title: opt.title,
          description: opt.description,
        })),
        selected: roundOption.selected
          ? {
              id: (roundOption.selected as any)._id.toString(),
              title: (roundOption.selected as any).title,
              description: (roundOption.selected as any).description,
            }
          : null,
        selected_at: roundOption.selected_at,
      },
    });
  } catch (err: any) {
    console.error("Error retrieving subtask selection:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const GET = proxy(GETHandler, ["team"]);
