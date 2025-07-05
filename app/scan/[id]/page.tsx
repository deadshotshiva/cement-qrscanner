"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, QrCode, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface ScanResult {
  success: boolean
  message: string
  alreadyScanned: boolean
  scannedAt?: string
  firstScan?: boolean
}

export default function ScanPage() {
  const params = useParams()
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      handleScan(params.id as string)
    }
  }, [params.id])

  const handleScan = async (qrId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/qr/scan/${qrId}`, {
        method: "POST",
      })

      const data = await response.json()
      setScanResult(data)
    } catch (error) {
      setScanResult({
        success: false,
        message: "Failed to process QR code scan",
        alreadyScanned: false,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <QrCode className="h-12 w-12 mx-auto mb-4 animate-pulse" />
          <p>Processing QR code...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {scanResult?.success ? (
                <CheckCircle className="h-16 w-16 text-green-500" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500" />
              )}
            </div>
            <CardTitle className="text-2xl">{scanResult?.success ? "QR Code Scanned!" : "Scan Failed"}</CardTitle>
            <CardDescription>QR ID: {params.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Badge variant={scanResult?.alreadyScanned ? "secondary" : "default"} className="text-sm px-3 py-1">
                {scanResult?.alreadyScanned
                  ? "Already Scanned"
                  : scanResult?.firstScan
                    ? "First Scan"
                    : "Status Unknown"}
              </Badge>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-center text-sm">{scanResult?.message}</p>
            </div>

            {scanResult?.scannedAt && (
              <div className="text-center text-sm text-muted-foreground">
                <p>Scanned at: {new Date(scanResult.scannedAt).toLocaleString()}</p>
              </div>
            )}

            <div className="pt-4">
              <Link href="/">
                <Button className="w-full bg-transparent" variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
