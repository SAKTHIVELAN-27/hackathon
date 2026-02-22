import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IScore extends Document {
  judge_id: mongoose.Types.ObjectId;
  submission_id: mongoose.Types.ObjectId;
  score: number;
  remarks: string;
  status: "pending" | "scored";
  created_at: Date;
  updated_at: Date;
}

const ScoreSchema = new Schema<IScore>({
  judge_id: { type: Schema.Types.ObjectId, ref: "Judge" },
  submission_id: { type: Schema.Types.ObjectId, ref: "Submission" },
  score: {
    type: Number,
    min: 0,
    max: 100,
    required: [true, "Score is required"],
  },
  remarks: String,
  status: { type: String, enum: ["pending", "scored"], default: "pending" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

ScoreSchema.index({ judge_id: 1, submission_id: 1 }, { unique: true });

export default models.Score || model<IScore>("Score", ScoreSchema);
