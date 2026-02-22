import { connectDB } from "@/config/db"

export async function GET() {
  await connectDB()

  return Response.json({
    message: "Database connected successfully",
  })
}
