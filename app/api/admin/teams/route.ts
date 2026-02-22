import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/config/db";
import Team from "@/models/Team";
import User from "@/models/User";
import Track from "@/models/Track";
import Submission from "@/models/Submission";
import Score from "@/models/Score";
import { teamSchema } from "@/lib/validations";
import { proxy } from "@/lib/proxy";

export const dynamic = "force-dynamic";

// GET: List all teams with their track information and scores
async function GETHandler(req: NextRequest) {
  await connectDB();

  try {
    const teams = await Team.find({})
      .populate("user_id", "email")
      .populate("track_id", "name")
      .populate("rounds_accessible", "round_number")
      .lean();

    // Calculate scores for each team
    const teamsWithScores = await Promise.all(
      teams.map(async (team: any) => {
        // Get all submissions for this team
        const submissions = await Submission.find({ team_id: team._id })
          .populate("round_id", "round_number")
          .lean();

        // Calculate scores per round
        const roundScores = await Promise.all(
          submissions.map(async (submission: any) => {
            // Get all scores for this submission
            const scores = await Score.find({
              submission_id: submission._id,
              status: "scored",
            }).lean();

            // Sum up all judge scores for this submission
            const totalScore = scores.reduce(
              (sum, scoreDoc) => sum + (scoreDoc.score || 0),
              0,
            );

            return {
              round_id: submission.round_id?._id?.toString() || null,
              round_number: submission.round_id?.round_number || null,
              score: totalScore,
              num_judges: scores.length,
            };
          }),
        );

        // Calculate cumulative score
        const cumulativeScore = roundScores.reduce(
          (sum, round) => sum + round.score,
          0,
        );

        return {
          id: team._id.toString(),
          team_name: team.team_name,
          email: team.user_id?.email || "N/A",
          track: team.track_id?.name || "N/A",
          track_id: team.track_id?._id?.toString() || null,
          rounds_accessible: (team.rounds_accessible || []).map((r: any) => ({
            id: r._id.toString(),
            round_number: r.round_number,
          })),
          round_scores: roundScores.filter((rs) => rs.round_number !== null),
          cumulative_score: cumulativeScore,
          created_at: team.created_at,
        };
      }),
    );

    // Sort by cumulative score in descending order
    teamsWithScores.sort((a, b) => b.cumulative_score - a.cumulative_score);

    return NextResponse.json(teamsWithScores);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 },
    );
  }
}

export const GET = proxy(GETHandler, ["admin"]);

// POST: Create a new team
async function POSTHandler(request: NextRequest) {
  await connectDB();

  try {
    const body = await request.json();

    const validation = teamSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { team_name, email, track_id } = validation.data;

    // Verify track exists
    const track = await Track.findById(track_id);
    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Check if team name already exists
    const existingTeam = await Team.findOne({ team_name });
    if (existingTeam) {
      return NextResponse.json(
        { error: "Team name already exists" },
        { status: 400 },
      );
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // If user exists, check if they're already in a team
      if (user.team_id) {
        return NextResponse.json(
          { error: "User is already part of a team" },
          { status: 400 },
        );
      }

      // If user has a different role, return error
      if (user.role !== "team") {
        return NextResponse.json(
          { error: `Email is already registered as ${user.role}` },
          { status: 400 },
        );
      }
    } else {
      // Create new user with team role
      user = await User.create({
        email,
        role: "team",
      });
    }

    // Create team
    const newTeam = await Team.create({
      user_id: user._id,
      team_name,
      track_id,
    });

    // Update user with team_id
    await User.findByIdAndUpdate(user._id, { team_id: newTeam._id });

    // Populate the response
    const populatedTeam = await Team.findById(newTeam._id)
      .populate("user_id", "email")
      .populate("track_id", "name")
      .lean();

    return NextResponse.json(
      {
        message: "Team created successfully",
        team: {
          id: populatedTeam._id.toString(),
          team_name: populatedTeam.team_name,
          email: (populatedTeam.user_id as any)?.email,
          track: (populatedTeam.track_id as any)?.name,
          track_id: (populatedTeam.track_id as any)?._id?.toString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 },
    );
  }
}

export const POST = proxy(POSTHandler, ["admin"]);
