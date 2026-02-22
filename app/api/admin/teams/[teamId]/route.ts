import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/config/db";
import Team from "@/models/Team";
import User from "@/models/User";
import Track from "@/models/Track";
import Round from "@/models/Round";
import Submission from "@/models/Submission";
import Score from "@/models/Score";
import RoundOptions from "@/models/RoundOptions";
import { proxy } from "@/lib/proxy";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateTeamSchema = z.object({
  team_name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  track_id: z.string().min(1).optional(),
});

// GET: Get single team with full round history
async function GETHandler(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  await connectDB();
  const { teamId } = await params;

  try {
    const team = await Team.findById(teamId)
      .populate("user_id", "email")
      .populate("track_id", "name")
      .populate("rounds_accessible", "round_number")
      .lean();

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Get all rounds sorted
    const allRounds = await Round.find({}).sort({ round_number: 1 }).lean();

    // Get all submissions for this team
    const submissions = await Submission.find({ team_id: teamId }).lean();
    const submissionByRound = new Map(
      submissions.map((s: any) => [s.round_id.toString(), s]),
    );

    // Get all scores for these submissions
    const submissionIds = submissions.map((s: any) => s._id);
    const scores = await Score.find({
      submission_id: { $in: submissionIds },
    }).lean();
    const scoreBySubmission = new Map(
      scores.map((sc: any) => [sc.submission_id.toString(), sc]),
    );

    // Get round options (subtask selections)
    const roundOptions = await RoundOptions.find({ team_id: teamId })
      .populate("selected", "title")
      .lean();
    const optionsByRound = new Map(
      roundOptions.map((opt: any) => [opt.round_id.toString(), opt]),
    );

    // Build round history
    const history = allRounds.map((round: any) => {
      const roundIdStr = round._id.toString();
      const submission = submissionByRound.get(roundIdStr);
      const score = submission
        ? scoreBySubmission.get(submission._id.toString())
        : null;
      const options = optionsByRound.get(roundIdStr);

      let status = "Not Started";
      if (submission) status = "Submitted";
      else if (
        (team.rounds_accessible || []).some(
          (r: any) => r._id?.toString() === roundIdStr || r.toString() === roundIdStr,
        )
      )
        status = "Active";

      return {
        round_id: roundIdStr,
        round_name: `Round ${round.round_number}`,
        status,
        selection: (options?.selected as any)?.title || null,
        github_link: submission?.github_link || null,
        submission_file: submission?.file_url || null,
        score: score?.score ?? null,
        remarks: score?.remarks || null,
      };
    });

    // Calculate cumulative score
    const cumulativeScore = history.reduce(
      (sum, r) => sum + (r.score || 0),
      0,
    );

    return NextResponse.json({
      id: team._id.toString(),
      team_name: team.team_name,
      email: (team.user_id as any)?.email || "N/A",
      track: (team.track_id as any)?.name || "N/A",
      track_id: (team.track_id as any)?._id?.toString() || null,
      cumulative_score: cumulativeScore,
      rounds_accessible: (team.rounds_accessible || []).map((r: any) => ({
        id: r._id?.toString() || r.toString(),
        round_number: r.round_number,
      })),
      history,
      created_at: team.created_at,
    });
  } catch (error) {
    console.error("Error fetching team details:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 },
    );
  }
}

export const GET = proxy(GETHandler, ["admin"]);

// PATCH: Update team
async function PATCHHandler(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  await connectDB();
  const { teamId } = await params;

  try {
    const body = await request.json();
    const validation = updateTeamSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { team_name, email, track_id } = validation.data;

    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Update team_name if provided
    if (team_name) {
      // Check if team name is already taken by another team
      const existingTeam = await Team.findOne({
        team_name,
        _id: { $ne: teamId },
      });
      if (existingTeam) {
        return NextResponse.json(
          { error: "Team name already exists" },
          { status: 400 },
        );
      }
      team.team_name = team_name;
    }

    // Update track_id if provided
    if (track_id) {
      const track = await Track.findById(track_id);
      if (!track) {
        return NextResponse.json({ error: "Track not found" }, { status: 404 });
      }
      team.track_id = track_id as any;
    }

    // Update user email if provided
    if (email && team.user_id) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: team.user_id },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Email is already in use" },
          { status: 400 },
        );
      }

      await User.findByIdAndUpdate(team.user_id, { email });
    }

    await team.save();

    // Return updated team
    const updatedTeam = await Team.findById(teamId)
      .populate("user_id", "email")
      .populate("track_id", "name")
      .lean();

    return NextResponse.json({
      message: "Team updated successfully",
      team: {
        id: updatedTeam._id.toString(),
        team_name: updatedTeam.team_name,
        email: (updatedTeam.user_id as any)?.email || "N/A",
        track: (updatedTeam.track_id as any)?.name || "N/A",
        track_id: (updatedTeam.track_id as any)?._id?.toString() || null,
      },
    });
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 },
    );
  }
}

export const PATCH = proxy(PATCHHandler, ["admin"]);

// DELETE: Remove team
async function DELETEHandler(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  await connectDB();
  const { teamId } = await params;

  try {
    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Delete team
    await Team.findByIdAndDelete(teamId);

    // Optionally delete associated user
    if (team.user_id) {
      await User.findByIdAndDelete(team.user_id);
    }

    return NextResponse.json({
      message: "Team deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 },
    );
  }
}

export const DELETE = proxy(DELETEHandler, ["admin"]);
