import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Team from "@/models/Team";
import User from "@/models/User";
import Track from "@/models/Track";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/teams/bulk
 *
 * Bulk-create teams from a CSV export.
 * Accepts an array of `{ name, email, track }` objects.
 *
 * Auth: requires an admin session OR an `Authorization: Bearer <BULK_UPLOAD_KEY>`
 * header matching the BULK_UPLOAD_KEY environment variable (for script use).
 */
export async function POST(request: NextRequest) {
  // ── Auth check ───────────────────────────────────────────────────────────
  const bulkKey = process.env.BULK_UPLOAD_KEY;
  const authHeader = request.headers.get("authorization") ?? "";
  const providedKey = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  const hasKeyAuth = bulkKey && providedKey === bulkKey;

  if (!hasKeyAuth) {
    // Fall back to session-based admin auth
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || role !== "admin") {
      return NextResponse.json(
        {
          error:
            "Unauthorized. Provide an admin session or a valid Authorization: Bearer <BULK_UPLOAD_KEY> header.",
        },
        { status: 401 },
      );
    }
  }

  await connectDB();

  try {
    const teams = await request.json(); // Array of { name, email, track }

    if (!Array.isArray(teams)) {
      return NextResponse.json(
        { error: "Expected an array of teams" },
        { status: 400 },
      );
    }

    const results: { name: string; status: string }[] = [];
    const errors: { team: any; error: string }[] = [];

    for (const t of teams) {
      try {
        const teamName: string = (t.team_name ?? t.name ?? "").trim();
        const email: string = (t.email ?? "").trim();
        const trackName: string = (t.track ?? "").trim();

        if (!teamName || !email) {
          errors.push({ team: t, error: "Missing name/team_name or email" });
          continue;
        }

        // Resolve track by name → ObjectId
        let trackId: any = null;
        if (trackName) {
          const trackDoc = await Track.findOne({
            name: { $regex: new RegExp(`^${trackName}$`, "i") },
          });
          if (trackDoc) {
            trackId = trackDoc._id;
          } else {
            errors.push({
              team: t,
              error: `Track '${trackName}' not found. Create it first.`,
            });
            continue;
          }
        } else {
          errors.push({ team: t, error: "Missing track name" });
          continue;
        }

        // Check duplicate team name
        const existingTeam = await Team.findOne({ team_name: teamName });
        if (existingTeam) {
          errors.push({
            team: t,
            error: `Team name '${teamName}' already exists`,
          });
          continue;
        }

        // Check duplicate email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          if (existingUser.role !== "team") {
            errors.push({
              team: t,
              error: `Email '${email}' is already registered as '${existingUser.role}'`,
            });
            continue;
          }
          if ((existingUser as any).team_id) {
            errors.push({
              team: t,
              error: `User '${email}' already belongs to a team`,
            });
            continue;
          }
        }

        // Create user first (required for team.user_id)
        const user = await User.findOneAndUpdate(
          { email },
          { $setOnInsert: { email, role: "team" } },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );

        // Create team with correct model fields
        const newTeam = await Team.create({
          team_name: teamName,
          track_id: trackId,
          user_id: user._id,
        });

        // Link team back to user
        await User.findByIdAndUpdate(user._id, {
          team_id: newTeam._id,
          role: "team",
        });

        results.push({ name: newTeam.team_name, status: "created" });
      } catch (err: any) {
        errors.push({ team: t, error: err.message });
      }
    }

    return NextResponse.json(
      {
        message: `Processed ${teams.length} teams`,
        successCount: results.length,
        errorCount: errors.length,
        results,
        errors,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error bulk uploading teams:", error);
    return NextResponse.json(
      { error: "Failed to upload teams" },
      { status: 500 },
    );
  }
}

