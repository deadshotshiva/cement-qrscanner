import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import QRCode from "@/lib/models/QRCode"

export async function GET() {
  try {
    await connectDB()

    const qrCodes = await QRCode.find({}).sort({ createdAt: -1 }).lean()

    return NextResponse.json({
      success: true,
      qrCodes,
    })
  } catch (error) {
    console.error("Error fetching QR codes:", error)
    return NextResponse.json({ error: "Failed to fetch QR codes" }, { status: 500 })
  }
}
