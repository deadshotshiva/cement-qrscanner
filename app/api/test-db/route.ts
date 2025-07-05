import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"

export async function GET() {
  try {
    await connectDB()

    return NextResponse.json({
      success: true,
      message: "Database connected successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database connection test failed:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
