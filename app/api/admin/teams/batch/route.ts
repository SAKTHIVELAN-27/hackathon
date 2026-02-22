import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/config/db";
import Team from "@/models/Team";
import User from "@/models/User";
import Track from "@/models/Track";
import { batchTeamSchema } from "@/lib/validations";
import { proxy } from "@/lib/proxy";

export const dynamic = "force-dynamic";

// POST: Batch create teams
async function POSTHandler(request: NextRequest) {
  await connectDB();

  try {
    const body = await request.json();

    const validation = batchTeamSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { teams } = validation.data;

    // Verify all tracks exist
    const trackIds = [...new Set(teams.map((t) => t.track_id))];
    const tracks = await Track.find({ _id: { $in: trackIds } });
    if (tracks.length !== trackIds.length) {
      return NextResponse.json(
        { error: "One or more tracks not found" },
        { status: 404 },
      );
    }

    // Check for duplicate team names
    const teamNames = teams.map((t) => t.team_name);
    const duplicateNames = teamNames.filter(
      (name, index) => teamNames.indexOf(name) !== index,
    );
    if (duplicateNames.length > 0) {
      return NextResponse.json(
        {
          error: `Duplicate team names: ${duplicateNames.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Check if team names already exist in DB
    const existingTeams = await Team.find({
      team_name: { $in: teamNames },
    });
    if (existingTeams.length > 0) {
      return NextResponse.json(
        {
          error: `Teams already exist: ${existingTeams.map((t) => t.team_name).join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Check for duplicate emails
    const emails = teams.map((t) => t.email);
    const duplicateEmails = emails.filter(
      (email, index) => emails.indexOf(email) !== index,
    );
    if (duplicateEmails.length > 0) {
      return NextResponse.json(
        {
          error: `Duplicate emails: ${duplicateEmails.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Check if emails already exist
    const existingUsers = await User.find({ email: { $in: emails } });
    if (existingUsers.length > 0) {
      return NextResponse.json(
        {
          error: `Emails already registered: ${existingUsers.map((u) => u.email).join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Create users and teams in transaction
    const createdTeams = [];
    const errors = [];

    for (const teamData of teams) {
      try {
        // Create user
        const user = await User.create({
          email: teamData.email,
          role: "team",
        });

        // Create team
        const newTeam = await Team.create({
          user_id: user._id,
          team_name: teamData.team_name,
          track_id: teamData.track_id,
        });

        // Update user with team_id
        await User.findByIdAndUpdate(user._id, { team_id: newTeam._id });

        // Populate the response
        const populatedTeam = await Team.findById(newTeam._id)
          .populate("user_id", "email")
          .populate("track_id", "name")
          .lean();

        createdTeams.push({
          id: populatedTeam._id.toString(),
          team_name: populatedTeam.team_name,
          email: (populatedTeam.user_id as any)?.email,
          track: (populatedTeam.track_id as any)?.name,
          track_id: (populatedTeam.track_id as any)?._id?.toString(),
        });
      } catch (error: any) {
        errors.push({
          team_name: teamData.team_name,
          email: teamData.email,
          error: error.message,
        });
      }
    }

    return NextResponse.json(
      {
        message: `Successfully created ${createdTeams.length} teams${errors.length > 0 ? ` (${errors.length} failed)` : ""}`,
        teams: createdTeams,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: createdTeams.length > 0 ? 201 : 400 },
    );
  } catch (error) {
    console.error("Error batch creating teams:", error);
    return NextResponse.json(
      { error: "Failed to batch create teams" },
      { status: 500 },
    );
  }
}

export const POST = proxy(POSTHandler, ["admin"]);
