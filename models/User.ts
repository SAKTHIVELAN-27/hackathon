import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IUser extends Document {
  email: string;
  role: "team" | "judge" | "admin";
  team_id?: mongoose.Types.ObjectId;
  created_at: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  role: {
    type: String,
    enum: ["team", "judge", "admin"],
    required: true,
  },
  team_id: {
    type: Schema.Types.ObjectId,
    ref: "Team",
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default models.User || model<IUser>("User", UserSchema);
