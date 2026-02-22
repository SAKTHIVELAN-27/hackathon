import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IRoundOptions extends Document {
  team_id: mongoose.Types.ObjectId;
  round_id: mongoose.Types.ObjectId;
  options: mongoose.Types.ObjectId[];
  selected: mongoose.Types.ObjectId | null;
  selected_at?: Date;
  created_at: Date;
}

const RoundOptionsSchema = new Schema<IRoundOptions>({
  team_id: { type: Schema.Types.ObjectId, ref: "Team" },
  round_id: { type: Schema.Types.ObjectId, ref: "Round" },
  options: [{ type: Schema.Types.ObjectId, ref: "Subtask", default: [] }],
  selected: { type: Schema.Types.ObjectId, ref: "Subtask", default: null },
  selected_at: { type: Date },
  created_at: { type: Date, default: Date.now },
});

export default models.RoundOptions ||
  model<IRoundOptions>("RoundOptions", RoundOptionsSchema);
