import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import QRCode from "@/lib/models/QRCode"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { quantity } = await request.json()

    if (!quantity || quantity < 1 || quantity > 100) {
      return NextResponse.json({ error: "Invalid quantity. Must be between 1 and 100." }, { status: 400 })
    }

    const qrCodes = []

    for (let i = 0; i < quantity; i++) {
      const uniqueId = uuidv4()
      const qrCode = new QRCode({
        uniqueId,
      })
      qrCodes.push(qrCode)
    }

    await QRCode.insertMany(qrCodes)

    return NextResponse.json({
      success: true,
      count: qrCodes.length,
      message: `Generated ${qrCodes.length} QR codes successfully`,
    })
  } catch (error) {
    console.error("Error generating QR codes:", error)
    return NextResponse.json({ error: "Failed to generate QR codes" }, { status: 500 })
  }
}
