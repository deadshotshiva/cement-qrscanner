import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import QRCode from "@/lib/models/QRCode"

export async function GET() {
  try {
    console.log("🔄 Fetching QR codes from database...")

    await connectDB()
    console.log("✅ Database connected for listing QR codes")

    const qrCodes = await QRCode.find({}).sort({ createdAt: -1 }).lean()
    console.log(`📊 Found ${qrCodes.length} QR codes in database`)

    // Log first few QR codes for debugging
    if (qrCodes.length > 0) {
      console.log(
        "📝 Sample QR codes:",
        qrCodes.slice(0, 3).map((qr) => ({
          id: qr._id,
          uniqueId: qr.uniqueId,
          scanned: qr.scanned,
          createdAt: qr.createdAt,
        })),
      )
    }

    return NextResponse.json({
      success: true,
      count: qrCodes.length,
      qrCodes,
    })
  } catch (error) {
    console.error("❌ Error fetching QR codes:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch QR codes",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
        qrCodes: [],
      },
      { status: 500 },
    )
  }
}
