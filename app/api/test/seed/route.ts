import { NextResponse } from "next/server";
import seedDatabase from "./seed";

export async function GET() {
  try {
    const result = await seedDatabase();

    if (result.success) {
      return NextResponse.json(
        {
          message: result.message,
          data: result.data,
        },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        {
          error: result.message,
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json(
      { error: "Failed to seed database", details: error.message },
      { status: 500 },
    );
  }
}
