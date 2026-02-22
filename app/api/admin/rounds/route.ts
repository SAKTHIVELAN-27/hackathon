import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/config/db";
import Round from "@/models/Round";
import { roundSchema } from "@/lib/validations";
import { proxy } from "@/lib/proxy";

// GET: Fetch all rounds
async function GETHandler(req: NextRequest) {
  await connectDB();

  try {
    const rounds = await Round.find({}).sort({ round_number: 1 });
    return NextResponse.json(rounds);
  } catch (error) {
    console.error("Error fetching rounds:", error);
    return NextResponse.json(
      { error: "Failed to fetch rounds" },
      { status: 500 },
    );
  }
}

export const GET = proxy(GETHandler, ["admin"]);

// POST: Create a new round
async function POSTHandler(request: NextRequest) {
  await connectDB();

  try {
    const body = await request.json();

    const validation = roundSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { round_number, start_time, end_time, instructions } =
      validation.data;

    if (!round_number) {
      return NextResponse.json(
        { error: "Round number is required" },
        { status: 400 },
      );
    }

    const newRound = await Round.create({
      round_number,
      start_time: start_time ? new Date(start_time) : null,
      end_time: end_time ? new Date(end_time) : null,
      instructions: instructions || "",
      is_active: false,
    });

    return NextResponse.json(
      { message: "Round created successfully", data: newRound },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating round:", error);
    return NextResponse.json(
      { error: "Failed to create round" },
      { status: 500 },
    );
  }
}

export const POST = proxy(POSTHandler, ["admin"]);
