import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IJudge extends Document {
  user_id: mongoose.Types.ObjectId;
  judge_name: string;
  track_id: mongoose.Types.ObjectId;
  teams_assigned?: mongoose.Types.ObjectId[];
  created_at: Date;
}

const JudgeSchema = new Schema<IJudge>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  judge_name: { type: String, required: true },
  track_id: {
    type: Schema.Types.ObjectId,
    ref: "Track",
    required: true,
  },
  teams_assigned: [{ type: Schema.Types.ObjectId, ref: "Team", default: [] }],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default models.Judge || model<IJudge>("Judge", JudgeSchema);
