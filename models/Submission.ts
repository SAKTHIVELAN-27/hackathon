import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ISubmission extends Document {
  team_id: mongoose.Types.ObjectId;
  round_id: mongoose.Types.ObjectId;
  file_url: string;
  github_link: string;
  overview: string;
  submitted_at: Date;
  is_locked: boolean;
}

const SubmissionSchema = new Schema<ISubmission>({
  team_id: { type: Schema.Types.ObjectId, ref: "Team" },
  round_id: { type: Schema.Types.ObjectId, ref: "Round" },
  file_url: String,
  github_link: String,
  overview: String,
  submitted_at: { type: Date, default: Date.now },
});

export default models.Submission ||
  model<ISubmission>("Submission", SubmissionSchema);
