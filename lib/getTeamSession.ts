/**
 * To Validate the current session whether that belong to a team user or not and returns the team_id.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getTeamSession() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        throw { error: "Unauthorized — please log in", status: 401 };
    }

    if (session.user.role !== "team") {
        throw { error: "Forbidden — this route is for teams only", status: 403 };
    }

    if (!session.user.team_id) {
        throw {
            error: "No team linked to this account — contact admin",
            status: 403,
        };
    }

    return {
        session,
        teamId: session.user.team_id,
    };
}
