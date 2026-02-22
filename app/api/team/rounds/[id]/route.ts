import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/config/db";
import { getTeamSession } from "@/lib/getTeamSession";
import Team from "@/models/Team";
import Round from "@/models/Round";
import Subtask from "@/models/Subtask";
import RoundOptions from "@/models/RoundOptions";
import Submission from "@/models/Submission";
import Score from "@/models/Score";
import { proxy } from "@/lib/proxy";

async function GETHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { teamId } = await getTeamSession();

    await connectDB();

    const round = await Round.findById(id).lean();
    if (!round) {
      return NextResponse.json({ error: "Round not found" }, { status: 404 });
    }

    // Get team with track info
    const team = await Team.findById(teamId).populate(
      "track_id",
      "name description",
    );
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const selection = await RoundOptions.findOne({
      team_id: teamId,
      round_id: id,
    })
      .populate("selected", "title description statement track_id")
      .populate({
        path: "selected",
        populate: {
          path: "track_id",
          select: "name description",
        },
      })
      .populate("options", "title description")
      .lean();

    let subtask = null;
    let submission = null;
    let availableOptions: any[] = [];
    let score = null;

    if (selection) {
      // If selection exists, check if they have selected a subtask
      if (selection.selected) {
        subtask = selection.selected;
      }

      // Get available options from the options field
      if (selection.options && Array.isArray(selection.options)) {
        availableOptions = (selection.options as any[]).map((opt) => ({
          _id: opt._id,
          title: opt.title,
          description: opt.description,
        }));
      }

      submission = await Submission.findOne({
        team_id: teamId,
        round_id: id,
      }).lean();
    } else {
      // If no selection yet, get subtasks for the team's track
      const trackId = (team.track_id as any)?._id;
      
      // For round 4, get all 3 remaining subtasks from completed rounds
      if (round.round_number === 4 && trackId) {
        // Get all completed rounds (rounds 1-3)
        const completedRounds = await Round.find({
          round_number: { $lt: 4 },
          is_active: false,
        }).lean();

        const completedRoundIds = completedRounds.map((r) => r._id);

        // Get subtasks already selected by this team in rounds 1-3
        const previousSelections = await RoundOptions.find({
          team_id: teamId,
          round_id: { $in: completedRoundIds },
          selected: { $ne: null },
        })
          .populate("selected", "_id")
          .lean();

        const selectedSubtaskIds = previousSelections.map(
          (s: any) => s.selected._id,
        );

        // Get all active subtasks from this track that aren't already selected
        const subs = await Subtask.find({
          track_id: (team.track_id as any)?._id || undefined,
          is_active: true,
          _id: { $nin: selectedSubtaskIds },
        })
          .select("_id title description")
          .limit(3)
          .lean();

        availableOptions = subs.map((s: any) => ({
          _id: s._id,
          title: s.title,
          description: s.description,
        }));
      } else {
        // For other rounds, get subtasks by the team's track
        const trackId = (team.track_id as any)?._id;
        if (trackId) {
          const subs = await Subtask.find({
            track_id: trackId,
            is_active: true,
          })
            .select("_id title description")
            .lean();

          availableOptions = subs.map((s: any) => ({
            _id: s._id,
            title: s.title,
            description: s.description,
          }));
        }
      }
    }

    // Get score if submission exists, but don't expose to team
    if (submission) {
      const scores = await Score.find({
        submission_id: submission._id,
        status: "scored",
      }).lean();
      if (scores.length > 0) {
        // DO NOT expose score to team - only store for admin/judge
        score = null;
      }
    }

    // Serialize data
    const responseData = {
      round: {
        _id: round._id,
        round_number: round.round_number,
        is_active: round.is_active,
        instructions: round.instructions,
        start_time: round.start_time,
        end_time: round.end_time,
        created_at: round.created_at,
        updated_at: round.updated_at,
      },
      team: {
        _id: team._id,
        team_name: team.team_name,
        track: (team.track_id as any)?.name || "N/A",
        track_id: (team.track_id as any)?._id?.toString() || null,
        track_description: (team.track_id as any)?.description || null,
      },
      selection: selection
        ? {
            _id: selection._id,
            selected: selection.selected,
            team_id: selection.team_id,
            round_id: selection.round_id,
            selected_at: selection.selected_at,
          }
        : null,
      subtask: subtask
        ? {
            _id: (subtask as any)._id,
            title: (subtask as any).title,
            description: (subtask as any).description,
            track: (subtask as any).track_id?.name || null,
            statement: (subtask as any).statement || null,
          }
        : null,
      initialSubtasks: availableOptions,
      submission: submission
        ? {
            _id: submission._id,
            submitted_at: submission.submitted_at,
            github_link: submission.github_link,
            file_url: submission.file_url,
            overview: submission.overview,
            submission_text: submission.submission_text,
            submitted_by_team_id: submission.team_id,
          }
        : null,
      score: null, // Never expose score to team - only judge and admin can see scores
    };

    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error("GET /api/team/rounds/[id] error:", err);
    const status = err.status || 500;
    const message = err.error || "Internal Server Error";
    return NextResponse.json({ error: message }, { status });
  }
}

export const GET = proxy(GETHandler, ["team"]);
