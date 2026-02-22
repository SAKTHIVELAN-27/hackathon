import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ITeam extends Document {
  user_id: mongoose.Types.ObjectId;
  team_name: string;
  track_id: mongoose.Types.ObjectId;
  rounds_accessible: mongoose.Types.ObjectId[];
  created_at: Date;
}

const TeamSchema = new Schema<ITeam>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  team_name: { type: String, required: true, unique: true },
  track_id: {
    type: Schema.Types.ObjectId,
    ref: "Track",
    required: true,
  },
  rounds_accessible: [{ type: Schema.Types.ObjectId, ref: "Round" }],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default models.Team || model<ITeam>("Team", TeamSchema);
