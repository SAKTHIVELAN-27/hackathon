
import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI as string

if (!MONGODB_URI) {
  console.warn(
    "Please define the MONGODB_URI environment variable inside .env.local",
  );
}

// Fallback to avoid build errors
const uri = MONGODB_URI || "mongodb://localhost:27017/dummy";

let cached = (global as any).mongoose

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null }
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      dbName: "cc_hackathon",
      bufferCommands: false,
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}