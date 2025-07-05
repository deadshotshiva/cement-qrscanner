"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, QrCode, Scan, Plus, Printer, Eye, Camera } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { QRScanner } from "@/components/qr-scanner"

interface QRCode {
  _id: string
  uniqueId: string
  scanned: boolean
  scannedAt?: string
  createdAt: string
}

export default function Dashboard() {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([])
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [recentScans, setRecentScans] = useState<string[]>([])

  useEffect(() => {
    fetchQRCodes()
  }, [])

  const fetchQRCodes = async () => {
    setLoading(true)
    try {
      console.log("🔄 Fetching QR codes...")
      const response = await fetch("/api/qr/list")
      console.log("📡 Response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("📊 Fetched data:", data)
        setQrCodes(data.qrCodes || [])
        toast({
          title: "Success",
          description: `Loaded ${data.qrCodes?.length || 0} QR codes`,
        })
      } else {
        const errorData = await response.json()
        console.error("❌ Failed to fetch QR codes:", errorData)
        toast({
          title: "Error",
          description: "Failed to fetch QR codes",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Error fetching QR codes:", error)
      toast({
        title: "Error",
        description: "Failed to fetch QR codes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateQRCodes = async () => {
    if (quantity < 1 || quantity > 100) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a number between 1 and 100",
        variant: "destructive",
      })
      return
    }

    setGenerating(true)
    try {
      console.log(`🔄 Generating ${quantity} QR codes...`)
      const response = await fetch("/api/qr/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      })

      console.log("📡 Generate response status:", response.status)
      const data = await response.json()
      console.log("📊 Generate response data:", data)

      if (response.ok) {
        toast({
          title: "Success",
          description: `Generated ${data.count} QR codes successfully`,
        })
        fetchQRCodes() // Refresh the list
        setQuantity(1)
      } else {
        console.error("❌ Generation failed:", data)
        toast({
          title: "Error",
          description: data.error || "Failed to generate QR codes",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Error generating QR codes:", error)
      toast({
        title: "Error",
        description: "Failed to generate QR codes",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const downloadQR = async (qrId: string) => {
    try {
      console.log(`📥 Downloading QR code: ${qrId}`)
      const response = await fetch(`/api/qr/download/${qrId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `qr-${qrId}.png`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast({
          title: "Success",
          description: "QR code downloaded successfully",
        })
      } else {
        throw new Error("Download failed")
      }
    } catch (error) {
      console.error("❌ Error downloading QR code:", error)
      toast({
        title: "Error",
        description: "Failed to download QR code",
        variant: "destructive",
      })
    }
  }

  const printQR = async (qrId: string) => {
    try {
      console.log(`🖨️ Printing QR code: ${qrId}`)
      const response = await fetch(`/api/qr/download/${qrId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)

        // Create a new window for printing
        const printWindow = window.open("", "_blank")
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>QR Code - ${qrId}</title>
                <style>
                  body { 
                    margin: 0; 
                    padding: 20px; 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    font-family: Arial, sans-serif; 
                  }
                  img { 
                    max-width: 300px; 
                    height: auto; 
                    border: 1px solid #ddd; 
                    padding: 10px; 
                  }
                  .qr-info { 
                    margin-top: 10px; 
                    text-align: center; 
                  }
                  @media print {
                    body { margin: 0; padding: 10px; }
                  }
                </style>
              </head>
              <body>
                <div class="qr-info">
                  <h2>QR Code</h2>
                  <p>ID: ${qrId.slice(0, 8)}...</p>
                  <p>Scan URL: ${window.location.origin}/scan/${qrId}</p>
                </div>
                <img src="${url}" alt="QR Code" onload="window.print(); window.close();" />
              </body>
            </html>
          `)
          printWindow.document.close()
        }

        // Clean up the blob URL after a delay
        setTimeout(() => {
          window.URL.revokeObjectURL(url)
        }, 1000)

        toast({
          title: "Success",
          description: "QR code sent to printer",
        })
      } else {
        throw new Error("Print failed")
      }
    } catch (error) {
      console.error("❌ Error printing QR code:", error)
      toast({
        title: "Error",
        description: "Failed to print QR code",
        variant: "destructive",
      })
    }
  }

  const viewQR = (qrId: string) => {
    window.open(`/scan/${qrId}`, "_blank")
  }

  const handleScanResult = (result: string) => {
    console.log("Scan result:", result)
    setRecentScans((prev) => [result, ...prev.slice(0, 4)]) // Keep last 5 scans
    setShowScanner(false)
    fetchQRCodes() // Refresh to show updated scan status
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const scannedCount = qrCodes.filter((qr) => qr.scanned).length
  const totalCount = qrCodes.length

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">QR Dashboard</h1>
          <p className="text-muted-foreground">Generate, scan, and manage your QR codes</p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => setShowScanner(true)} className="flex items-center gap-2" size="lg">
            <Camera className="h-5 w-5" />
            Scan QR Code
          </Button>
          <QrCode className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* Recent Scans */}
      {recentScans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Recent Scans
            </CardTitle>
            <CardDescription>Recently scanned QR codes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentScans.map((scan, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <span className="font-mono text-sm">{scan.slice(0, 50)}...</span>
                  <Badge variant="outline">Scan #{index + 1}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total QR Codes</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scanned</CardTitle>
            <Scan className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scannedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unscanned</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount - scannedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Generate QR Codes */}
      <Card>
        <CardHeader>
          <CardTitle>Generate QR Codes</CardTitle>
          <CardDescription>Create multiple unique QR codes for tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 max-w-xs">
              <label htmlFor="quantity" className="text-sm font-medium mb-2 block">
                Quantity
              </label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                placeholder="Enter number of QR codes"
              />
            </div>
            <Button onClick={generateQRCodes} disabled={generating} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {generating ? "Generating..." : "Generate"}
            </Button>
            <Button
              onClick={fetchQRCodes}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
            >
              <QrCode className="h-4 w-4" />
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>QR Codes ({totalCount})</CardTitle>
          <CardDescription>Manage and track your generated QR codes</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2">Loading QR codes...</p>
            </div>
          ) : qrCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No QR codes found</p>
              <p>Generate some QR codes to get started!</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Scanned At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qrCodes.map((qr) => (
                    <TableRow key={qr._id}>
                      <TableCell className="font-mono text-sm">{qr.uniqueId.slice(0, 8)}...</TableCell>
                      <TableCell>
                        <Badge variant={qr.scanned ? "default" : "secondary"}>
                          {qr.scanned ? "Scanned" : "Unscanned"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(qr.createdAt)}</TableCell>
                      <TableCell>{qr.scannedAt ? formatDate(qr.scannedAt) : "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadQR(qr.uniqueId)}
                            className="flex items-center gap-1"
                            title="Download QR Code"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => printQR(qr.uniqueId)}
                            className="flex items-center gap-1"
                            title="Print QR Code"
                          >
                            <Printer className="h-3 w-3" />
                            Print
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewQR(qr.uniqueId)}
                            className="flex items-center gap-1"
                            title="View QR Code"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Scanner Modal */}
      {showScanner && <QRScanner onScanResult={handleScanResult} onClose={() => setShowScanner(false)} />}

      <Toaster />
    </div>
  )
}
