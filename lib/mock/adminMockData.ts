import type {
  AdminDashboard,
  Round,
  Subtask,
  TeamDetail,
  Judge,
  RoundTeamSelection,
} from "@/lib/redux/api/types";

export const mockDashboard: AdminDashboard = {
  totalTeams: 24,
  currentRound: {
    id: "r1",
    _id: "r1",
    round_number: 1,
    name: "Round 1",
    status: "active",
    is_active: true,
    submission_enabled: true,
    startsAt: "2025-02-14T10:00:00Z",
    endsAt: "2025-02-14T18:00:00Z",
  },
  currentRoundId: "r1",
  submissionsCount: 18,
  pendingEvaluationCount: 12,
  roundStatus: "active",
  submissionEnabled: true,
};

export const mockRounds: Round[] = [
  {
    id: "r1",
    _id: "r1",
    round_number: 1,
    name: "Round 1",
    status: "active",
    is_active: true,
    submission_enabled: true,
    startsAt: "2025-02-14T10:00:00Z",
    endsAt: "2025-02-14T18:00:00Z",
  },
  {
    id: "r2",
    _id: "r2",
    round_number: 2,
    name: "Round 2",
    status: "draft",
    is_active: false,
    submission_enabled: false,
    startsAt: null,
    endsAt: null,
  },
  {
    id: "r3",
    _id: "r3",
    round_number: 3,
    name: "Final Round",
    status: "draft",
    is_active: false,
    submission_enabled: false,
    startsAt: null,
    endsAt: null,
  },
];

export const mockSubtasksByRound: Record<string, Subtask[]> = {
  r1: [
    { id: "s1", title: "Subtask A", description: "Implement API for user auth", round_id: "r1", is_active: true },
    { id: "s2", title: "Subtask B", description: "Build dashboard UI", round_id: "r1", is_active: true },
    { id: "s3", title: "Subtask C", description: "Database schema design", round_id: "r1", is_active: true },
  ],
  r2: [
    { id: "s4", title: "Task 1", description: "Advanced feature set", round_id: "r2", is_active: true },
    { id: "s5", title: "Task 2", description: "Integration layer", round_id: "r2", is_active: true },
  ],
  r3: [],
};

export const mockTeams: TeamDetail[] = [
  { id: "t1", name: "Team Alpha", track: "AI", currentRoundId: "r1", currentRoundName: "Round 1", score: 72, submissionStatus: "submitted", isShortlisted: false, isLocked: false },
  { id: "t2", name: "Team Beta", track: "Web", currentRoundId: "r1", currentRoundName: "Round 1", score: 85, submissionStatus: "submitted", isShortlisted: true, isLocked: false },
  { id: "t3", name: "Team Gamma", track: "AI", currentRoundId: "r1", currentRoundName: "Round 1", score: null, submissionStatus: "pending", isShortlisted: false, isLocked: false },
  { id: "t4", name: "Team Delta", track: "Mobile", currentRoundId: "r1", currentRoundName: "Round 1", score: 68, submissionStatus: "locked", isShortlisted: false, isLocked: true },
];

export const mockRoundTeamSelections: Record<string, RoundTeamSelection[]> = {
  r1: [
    {
      teamId: "t1",
      teamName: "Team Alpha",
      shownOptions: [
        { id: "s1", title: "Subtask A" },
        { id: "s2", title: "Subtask B" },
      ],
      chosenOption: { id: "s2", title: "Subtask B" },
      nextRoundTaskA: "s4",
      nextRoundTaskB: "s5",
    },
    {
      teamId: "t2",
      teamName: "Team Beta",
      shownOptions: [
        { id: "s1", title: "Subtask A" },
        { id: "s3", title: "Subtask C" },
      ],
      chosenOption: { id: "s1", title: "Subtask A" },
    },
  ],
  r2: [],
  r3: [],
};

export const mockJudges: Judge[] = [
  { id: "j1", name: "Alex Kim", email: "alex@example.com", assignedTeamsCount: 3 },
  { id: "j2", name: "Sam Wilson", email: "sam@example.com", assignedTeamsCount: 2 },
  { id: "j3", name: "Jordan Lee", email: "jordan@example.com", assignedTeamsCount: 0 },
];
