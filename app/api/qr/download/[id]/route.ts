import { type NextRequest, NextResponse } from "next/server"
import QRCodeGenerator from "qrcode"
import connectDB from "@/lib/mongodb"
import QRCode from "@/lib/models/QRCode"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()

    const { id } = params

    const qrCode = await QRCode.findOne({ uniqueId: id })

    if (!qrCode) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 })
    }

    const scanUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/scan/${id}`

    const qrCodeBuffer = await QRCodeGenerator.toBuffer(scanUrl, {
      type: "png",
      width: 300,
      margin: 2,
    })

    return new NextResponse(qrCodeBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="qr-${id}.png"`,
      },
    })
  } catch (error) {
    console.error("Error generating QR code image:", error)
    return NextResponse.json({ error: "Failed to generate QR code image" }, { status: 500 })
  }
}
