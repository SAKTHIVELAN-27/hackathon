export type Track = {
  id: string;
  name: string;
  description?: string;
  is_active?: boolean;
};

export type Team = {
  id: string;
  team_name: string;
  email?: string;
  track?: string | null;
  track_id?: string | null;
  cumulative_score?: number | null;
  round_scores?: Array<{
    round_id: string;
    round_number: number;
    score: number | null;
    num_judges?: number;
  }>;
};

export type Round = {
  _id: string;
  id: string;
  round_number?: number;
  is_active?: boolean;
  start_time?: string | null;
  end_time?: string | null;
  instructions?: string;
};

export type Judge = {
  id: string;
  judge_name: string;
  email: string;
  track?: string;
  track_id?: string | null;
  teams_assigned?: string[];
  assignedTeamsCount?: number;
};

export type Submission = {
  id: string;
  teamId: string;
  roundId: string;
  status?: "pending" | "scored" | "rejected";
  score?: number | null;
};

// Admin-specific types
export type AdminDashboard = {
  totalTeams: number;
  currentRound: { id: string; name: string; round_number: number } | null;
  roundStatus: "idle" | "active" | "inactive" | "upcoming" | "completed";
  submissionsCount: number;
  pendingEvaluationCount: number;
  topTeams?: Array<{
    id: string;
    name: string;
    cumulativeScore: number;
    track: string;
  }>;
};

export type Subtask = {
  id: string;
  title: string;
  description: string;
  track?: string;
  track_id?: string | null;
  is_active?: boolean;
};

export type TeamDetail = {
  id: string;
  team_name: string;
  email?: string;
  track: string | null;
  track_id?: string | null;
  cumulative_score: number;
  rounds_accessible?: Array<{ id: string; round_number: number }>;
  history?: Array<{
    round_id: string;
    round_name: string;
    status: string;
    selection?: string;
    github_link?: string;
    submission_file?: string;
    score: number | null;
    remarks?: string;
  }>;
};

export type RoundTeam = {
  id: string;
  team_name: string;
  track: string;
  track_id: string | null;
  score: number | null;
  allowed: boolean;
  submission: {
    id: string;
    github_link?: string;
    file_url?: string;
    submitted_at?: string;
  } | null;
  subtask_history: {
    options: { id: string; title: string }[];
    selected: { id: string; title: string } | null;
    selected_at?: string;
  } | null;
};

export type RoundTeamsResponse = {
  teams_by_track: Record<string, RoundTeam[]>;
  total_teams: number;
};

export type JudgeAssignment = {
  judgeId: string;
  teamIds: string[];
  roundId: string;
};
