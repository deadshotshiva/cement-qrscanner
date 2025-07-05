import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import QRCode from "@/lib/models/QRCode"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Starting QR generation process...")

    // Parse request body
    let body
    try {
      body = await request.json()
      console.log("📝 Request body:", body)
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { quantity } = body

    // Validate quantity
    if (!quantity || quantity < 1 || quantity > 100) {
      console.log("❌ Invalid quantity:", quantity)
      return NextResponse.json({ error: "Invalid quantity. Must be between 1 and 100." }, { status: 400 })
    }

    console.log(`📊 Generating ${quantity} QR codes...`)

    // Connect to database
    try {
      console.log("🔌 Connecting to database...")
      await connectDB()
      console.log("✅ Database connected successfully")
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError)
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: dbError instanceof Error ? dbError.message : "Unknown database error",
        },
        { status: 500 },
      )
    }

    // Generate QR codes
    const qrCodes = []
    try {
      for (let i = 0; i < quantity; i++) {
        const uniqueId = uuidv4()
        console.log(`🔢 Generated UUID ${i + 1}/${quantity}: ${uniqueId}`)

        const qrCode = new QRCode({
          uniqueId,
        })
        qrCodes.push(qrCode)
      }

      console.log("💾 Saving QR codes to database...")
      await QRCode.insertMany(qrCodes)
      console.log("✅ QR codes saved successfully")
    } catch (saveError) {
      console.error("❌ Failed to save QR codes:", saveError)
      return NextResponse.json(
        {
          error: "Failed to save QR codes to database",
          details: saveError instanceof Error ? saveError.message : "Unknown save error",
        },
        { status: 500 },
      )
    }

    console.log(`🎉 Successfully generated ${qrCodes.length} QR codes`)
    return NextResponse.json({
      success: true,
      count: qrCodes.length,
      message: `Generated ${qrCodes.length} QR codes successfully`,
    })
  } catch (error) {
    console.error("❌ Unexpected error in QR generation:", error)
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace available")

    return NextResponse.json(
      {
        error: "Failed to generate QR codes",
        details: error instanceof Error ? error.message : "Unknown error",
        type: error instanceof Error ? error.constructor.name : "Unknown",
      },
      { status: 500 },
    )
  }
}
