import { type NextRequest, NextResponse } from "next/server"
import QRCodeGenerator from "qrcode"
import connectDB from "@/lib/mongodb"
import QRCode from "@/lib/models/QRCode"
import JSZip from "jszip"

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { qrIds } = await request.json()

    if (!qrIds || !Array.isArray(qrIds) || qrIds.length === 0) {
      return NextResponse.json({ error: "Invalid QR IDs provided" }, { status: 400 })
    }

    console.log(`📦 Creating bulk download for ${qrIds.length} QR codes`)

    const zip = new JSZip()
    const qrCodes = await QRCode.find({ uniqueId: { $in: qrIds } })

    for (const qrCode of qrCodes) {
      const scanUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/scan/${qrCode.uniqueId}`

      const qrCodeBuffer = await QRCodeGenerator.toBuffer(scanUrl, {
        type: "png",
        width: 300,
        margin: 2,
      })

      zip.file(`qr-${qrCode.uniqueId}.png`, qrCodeBuffer)
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="qr-codes-${Date.now()}.zip"`,
      },
    })
  } catch (error) {
    console.error("Error creating bulk download:", error)
    return NextResponse.json({ error: "Failed to create bulk download" }, { status: 500 })
  }
}
