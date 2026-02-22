import { z } from "zod";

export const scoreSchema = z.object({
  score: z
    .number()
    .min(0, "Score must be at least 0")
    .max(100, "Score cannot exceed 100"),
  remarks: z.string().optional(),
  status: z.enum(["pending", "scored"]).optional(),
});

export const submissionSchema = z.object({
  roundId: z.string().min(1, "Round ID is required"),
  fileUrl: z.string().url("Invalid file URL").optional().or(z.literal("")),
  githubLink: z.string().url("Invalid GitHub URL").optional().or(z.literal("")),
  overview: z.string().optional(),
});

export const judgeSchema = z.object({
  judge_name: z.string().min(2, "Judge name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  track_id: z.string().min(1, "Track ID is required"),
});

export const roundSchema = z.object({
  round_number: z
    .number()
    .int()
    .positive("Round number must be a positive integer"),
  start_time: z.string().datetime().optional().nullable(),
  end_time: z.string().datetime().optional().nullable(),
  instructions: z.string().optional(),
});

export const subtaskSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  statement: z.string().optional(),
  track_id: z.string().min(1, "Track ID is required"),
  is_active: z.boolean().optional(),
});

export const teamSchema = z.object({
  team_name: z.string().min(2, "Team name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  track_id: z.string().min(1, "Track ID is required"),
});

export const batchTeamSchema = z.object({
  teams: z.array(
    z.object({
      team_name: z.string().min(2, "Team name must be at least 2 characters"),
      email: z.string().email("Invalid email address"),
      track_id: z.string().min(1, "Track ID is required"),
    })
  ).min(1, "At least one team is required"),
});

export const trackSchema = z.object({
  name: z.string().min(2, "Track name must be at least 2 characters"),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});
