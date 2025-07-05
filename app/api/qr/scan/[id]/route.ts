import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import QRCode from "@/lib/models/QRCode"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()

    const { id } = params

    const qrCode = await QRCode.findOne({ uniqueId: id })

    if (!qrCode) {
      return NextResponse.json({
        success: false,
        message: "QR code not found",
        alreadyScanned: false,
      })
    }

    if (qrCode.scanned) {
      return NextResponse.json({
        success: true,
        message: "This QR code has already been scanned.",
        alreadyScanned: true,
        scannedAt: qrCode.scannedAt,
        firstScan: false,
      })
    }

    // Mark as scanned
    qrCode.scanned = true
    qrCode.scannedAt = new Date()
    await qrCode.save()

    return NextResponse.json({
      success: true,
      message: "QR code scanned successfully! This is the first scan.",
      alreadyScanned: false,
      scannedAt: qrCode.scannedAt,
      firstScan: true,
    })
  } catch (error) {
    console.error("Error processing QR scan:", error)
    return NextResponse.json({
      success: false,
      message: "Failed to process QR code scan",
      alreadyScanned: false,
    })
  }
}
