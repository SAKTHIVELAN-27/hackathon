import { baseApi } from "./baseApi";

export const judgeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getJudgeProfile: builder.query<any, void>({
      query: () => "/judge",
      providesTags: ["Judge"],
    }),
    getJudgeRounds: builder.query<any[], void>({
      query: () => "/judge/rounds",
      providesTags: ["Round"],
    }),
    getJudgeRoundDetails: builder.query<any, string>({
      query: (roundId) => `/judge/rounds/${roundId}`,
      providesTags: (result, error, roundId) => [
        { type: "Round", id: roundId },
      ],
    }),
    getJudgeAssignedTeams: builder.query<any[], string | void>({
      query: (roundId) =>
        roundId
          ? `/judge/assigned-teams?round_id=${roundId}`
          : `/judge/assigned-teams`,
      providesTags: (result, error, roundId) => [
        { type: "JudgeAssignment", id: roundId ? `round_${roundId}` : "all" },
      ],
    }),
    getJudgeTeamDetails: builder.query<
      any,
      { roundId: string; teamId: string }
    >({
      query: ({ roundId, teamId }) => `/judge/rounds/${roundId}/${teamId}`,
      providesTags: (result, error, { roundId, teamId }) => [
        { type: "Team", id: teamId },
      ],
    }),
    submitScore: builder.mutation<
      any,
      {
        roundId: string;
        teamId: string;
        score: number;
        remarks?: string;
        status?: string;
      }
    >({
      query: ({ roundId, teamId, ...body }) => ({
        url: `/judge/rounds/${roundId}/${teamId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { roundId, teamId }) => [
        { type: "Team", id: teamId },
        "Score",
        "AdminDashboard",
      ],
    }),
    updateScore: builder.mutation<
      any,
      {
        roundId: string;
        teamId: string;
        score: number;
        remarks?: string;
        status?: string;
      }
    >({
      query: ({ roundId, teamId, ...body }) => ({
        url: `/judge/rounds/${roundId}/${teamId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { roundId, teamId }) => [
        { type: "Team", id: teamId },
        "Score",
        "AdminDashboard",
      ],
    }),
  }),
});

export const {
  useGetJudgeProfileQuery,
  useGetJudgeRoundsQuery,
  useGetJudgeRoundDetailsQuery,
  useGetJudgeAssignedTeamsQuery,
  useGetJudgeTeamDetailsQuery,
  useSubmitScoreMutation,
  useUpdateScoreMutation,
} = judgeApi;
