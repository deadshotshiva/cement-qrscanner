import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"

export async function GET() {
  try {
    console.log("🏥 Health check: Testing database connection...")

    await connectDB()
    console.log("✅ Health check: Database connection successful")

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Health check failed:", error)

    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
