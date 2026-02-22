import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ITrack extends Document {
  name: string;
  description: string;
  is_active: boolean;
  created_at: Date;
}

const TrackSchema = new Schema<ITrack>({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    default: "",
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default models.Track || model<ITrack>("Track", TrackSchema);
