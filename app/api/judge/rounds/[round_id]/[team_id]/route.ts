import { connectDB } from "@/config/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import Judge from "@/models/Judge";
import Team from "@/models/Team";
import Round from "@/models/Round";
import RoundOptions from "@/models/RoundOptions";
import Submission from "@/models/Submission";
import Score from "@/models/Score";
import { scoreSchema } from "@/lib/validations";
import { proxy } from "@/lib/proxy";

async function getJudgeFromSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await User.findOne({ email: session.user.email });
  if (!user) return null;

  const judge = await Judge.findOne({ user_id: user._id });
  if (!judge) return null;

  return { judge, user };
}

/* =========================
   GET TEAM DETAILS
========================= */

async function GETHandler(
  _req: NextRequest,
  context: { params: Promise<{ round_id: string; team_id: string }> },
) {
  await connectDB();

  const { round_id: paramRoundId, team_id } = await context.params;

  let round_id = paramRoundId;
  if (round_id === "active") {
    const activeRound = await Round.findOne({ is_active: true });
    if (activeRound) {
      round_id = activeRound._id.toString();
    } else {
      return NextResponse.json(
        { error: "No active round found" },
        { status: 404 },
      );
    }
  }

  // Verify round exists
  const round = await Round.findById(round_id);
  if (!round) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  const team = await Team.findById(team_id).populate("track_id", "name");
  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  // IDOR CHECK: Ensure the judge is assigned to this team
  const judgeSession = await getJudgeFromSession();
  if (judgeSession?.judge) {
    const assignedTeamIds = judgeSession.judge.teams_assigned || [];
    const isAssigned = assignedTeamIds.some(
      (id: any) => id.toString() === team_id,
    );

    if (!isAssigned) {
      return NextResponse.json(
        { error: "Forbidden: You are not assigned to this team." },
        { status: 403 },
      );
    }
  } else {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // Get selected subtask
  const selection = await RoundOptions.findOne({
    team_id,
    round_id,
  }).populate("selected", "title description track_id");

  // Get submission
  const submission = await Submission.findOne({
    team_id,
    round_id,
  }).sort({ submitted_at: -1 });

  // Get the score and remarks for this team if available
  let score = null;
  let remarks = "";
  let status = "pending";

  if (judgeSession?.judge && submission) {
    const scoreDoc = await Score.findOne({
      judge_id: judgeSession.judge._id,
      submission_id: submission._id,
    });

    if (scoreDoc) {
      score = scoreDoc.score;
      remarks = scoreDoc.remarks || "";
      status = scoreDoc.status || "pending";
    }
  }

  return NextResponse.json({
    round: {
      id: round._id.toString(),
      round_number: round.round_number,
      start_time: round.start_time,
      end_time: round.end_time,
      is_active: round.is_active,
    },
    team: {
      team_id: team._id.toString(),
      team_name: team.team_name,
      track: (team.track_id as any)?.name || "N/A",
      track_id: (team.track_id as any)?._id?.toString() || null,
    },
    selected_subtask: selection?.selected
      ? {
          id: (selection.selected as any)._id.toString(),
          title: (selection.selected as any).title,
          description: (selection.selected as any).description,
        }
      : null,
    submission: submission
      ? {
          id: submission._id.toString(),
          file_url: submission.file_url,
          github_link: submission.github_link,
          overview: submission.overview,
          submitted_at: submission.submitted_at,
        }
      : null,
    score,
    remarks,
    status,
  });
}

export const GET = proxy(GETHandler, ["judge", "admin"]);

/* =========================
   POST SCORE (Create)
========================= */

async function POSTHandler(
  req: NextRequest,
  context: { params: Promise<{ round_id: string; team_id: string }> },
) {
  await connectDB();

  const ids = await getJudgeFromSession();
  if (!ids?.judge) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { round_id: paramRoundId, team_id } = await context.params;

  let round_id = paramRoundId;
  if (round_id === "active") {
    const activeRound = await Round.findOne({ is_active: true });
    if (activeRound) {
      round_id = activeRound._id.toString();
    } else {
      return NextResponse.json(
        { error: "No active round found" },
        { status: 404 },
      );
    }
  }

  const body = await req.json().catch(() => ({}));

  // Zod Validation
  const validation = scoreSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { score: scoreValue, remarks } = validation.data;

  // Verify the judge is assigned to this team
  const assignedTeamIds = ids.judge.teams_assigned || [];
  const isAssigned = assignedTeamIds.some(
    (id: any) => id.toString() === team_id,
  );

  if (!isAssigned) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Find the submission for this team and round
    // Create a stub submission if none exists so judges can always score
    let submission = await Submission.findOne({
      team_id,
      round_id,
    }).sort({ submitted_at: -1 });

    if (!submission) {
      submission = await Submission.create({
        team_id,
        round_id,
      });
    }

    // Create or update score using submission_id
    const doc = await Score.findOneAndUpdate(
      {
        judge_id: ids.judge._id,
        submission_id: submission._id,
      },
      {
        score: scoreValue,
        remarks: remarks || "",
        status: "scored",
        updated_at: new Date(),
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      },
    );

    return NextResponse.json({
      message: "Score saved successfully",
      data: {
        id: doc._id.toString(),
        score: doc.score,
        remarks: doc.remarks,
        status: doc.status,
        updated_at: doc.updated_at,
      },
    });
  } catch (error) {
    console.error("Error saving score (POST):", error);
    return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
  }
}

export const POST = proxy(POSTHandler, ["judge", "admin"]);

/* =========================
   PATCH SCORE (Update)
========================= */

async function PATCHHandler(
  req: NextRequest,
  context: { params: Promise<{ round_id: string; team_id: string }> },
) {
  await connectDB();

  const ids = await getJudgeFromSession();
  if (!ids?.judge) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { round_id: paramRoundId, team_id } = await context.params;

  let round_id = paramRoundId;
  if (round_id === "active") {
    const activeRound = await Round.findOne({ is_active: true });
    if (activeRound) {
      round_id = activeRound._id.toString();
    } else {
      return NextResponse.json(
        { error: "No active round found" },
        { status: 404 },
      );
    }
  }

  const body = await req.json().catch(() => ({}));

  // Zod Validation
  const validation = scoreSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { score: scoreValue, remarks } = validation.data;

  // Verify the judge is assigned to this team
  const assignedTeamIds = ids.judge.teams_assigned || [];
  const isAssigned = assignedTeamIds.some(
    (id: any) => id.toString() === team_id,
  );

  if (!isAssigned) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Find the submission for this team and round
    // Create a stub submission if none exists so judges can always score
    let submission = await Submission.findOne({
      team_id,
      round_id,
    }).sort({ submitted_at: -1 });

    if (!submission) {
      submission = await Submission.create({
        team_id,
        round_id,
      });
    }

    // Update (or create if missing) the score — upsert handles both cases
    const updated = await Score.findOneAndUpdate(
      {
        judge_id: ids.judge._id,
        submission_id: submission._id,
      },
      {
        score: scoreValue,
        remarks: remarks || "",
        status: "scored",
        updated_at: new Date(),
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      },
    );

    return NextResponse.json({
      message: "Score updated successfully",
      data: {
        id: updated._id.toString(),
        score: updated.score,
        remarks: updated.remarks,
        status: updated.status,
        updated_at: updated.updated_at,
      },
    });
  } catch (error) {
    console.error("Error saving score (PATCH):", error);
    return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
  }
}

export const PATCH = proxy(PATCHHandler, ["judge", "admin"]);
