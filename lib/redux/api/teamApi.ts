import { baseApi } from "./baseApi";

export const teamApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTeamProfile: builder.query<any, void>({
      query: () => "/team",
      providesTags: ["Team"],
    }),
    getTeamDashboard: builder.query<any, void>({
      query: () => "/team",
      providesTags: ["Team", "Round", "Submission"],
    }),
    getTeamRounds: builder.query<any[], void>({
      query: () => "/team/rounds",
      providesTags: ["Round"],
    }),
    getTeamRoundDetails: builder.query<any, string>({
      query: (id) => `/team/rounds/${id}`,
      providesTags: (result, error, id) => [{ type: "Round", id }],
    }),
    getRandomSubtask: builder.query<any, string>({
      query: (roundId) => `/team/subtasks/random?round_id=${roundId}`,
      providesTags: (result, error, roundId) => [
        { type: "Subtask", id: `round_${roundId}` },
      ],
    }),
    selectSubtask: builder.mutation<
      any,
      { roundId: string; subtaskId: string }
    >({
      query: ({ roundId, subtaskId }) => ({
        url: "/team/selection",
        method: "POST",
        body: { roundId, subtaskId },
      }),
      invalidatesTags: (result, error, { roundId }) => [
        { type: "Round", id: roundId },
        "Team",
      ],
    }),
    getTeamRoundSubtask: builder.query<any, { roundId: string }>({
      query: ({ roundId }) => `/team/rounds/${roundId}/subtask`,
      providesTags: (result, error, { roundId }) => [
        { type: "Subtask", id: roundId },
      ],
    }),
    getTeamRoundSubmission: builder.query<any, { roundId: string }>({
      query: ({ roundId }) => `/team/rounds/${roundId}/submission`,
      providesTags: (result, error, { roundId }) => [
        { type: "Submission", id: roundId },
      ],
    }),
    submitRoundSubmission: builder.mutation<
      any,
      {
        roundId: string;
        fileUrl?: string;
        githubLink?: string;
        overview?: string;
      }
    >({
      query: ({ roundId, ...body }) => ({
        url: `/team/rounds/${roundId}/submission`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { roundId }) => [
        { type: "Submission", id: roundId },
        { type: "Round", id: roundId },
        "Team",
      ],
    }),
    updateRoundSubmission: builder.mutation<
      any,
      {
        roundId: string;
        fileUrl?: string;
        githubLink?: string;
        overview?: string;
      }
    >({
      query: ({ roundId, ...body }) => ({
        url: `/team/rounds/${roundId}/submission`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { roundId }) => [
        { type: "Submission", id: roundId },
        { type: "Round", id: roundId },
        "Team",
      ],
    }),
    getTeamSubmissions: builder.query<any[], void>({
      query: () => "/team/submission",
      providesTags: ["Submission"],
    }),
    submitProject: builder.mutation<any, any>({
      query: (body) => ({
        url: "/team/submission",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Submission", "Round", "Team"],
    }),
    updateSubmission: builder.mutation<any, any>({
      query: (body) => ({
        url: "/team/submission",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Submission", "Round", "Team"],
    }),
  }),
});

export const {
  useGetTeamProfileQuery,
  useGetTeamDashboardQuery,
  useGetTeamRoundsQuery,
  useGetTeamRoundDetailsQuery,
  useGetRandomSubtaskQuery,
  useSelectSubtaskMutation,
  useGetTeamRoundSubtaskQuery,
  useGetTeamRoundSubmissionQuery,
  useSubmitRoundSubmissionMutation,
  useUpdateRoundSubmissionMutation,
  useGetTeamSubmissionsQuery,
  useSubmitProjectMutation,
  useUpdateSubmissionMutation,
} = teamApi;
