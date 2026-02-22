import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IRound extends Document {
  round_number: number;
  start_time: Date;
  end_time: Date;
  is_active: boolean;
  instructions: string;
  created_at: Date;
}

const RoundSchema = new Schema<IRound>({
  round_number: { type: Number, required: true },
  start_time: Date,
  end_time: Date,
  is_active: { type: Boolean, default: false },
  instructions: { type: String, default: "" }, // Instructions for the round
  created_at: { type: Date, default: Date.now },
});

export default models.Round || model<IRound>("Round", RoundSchema);
