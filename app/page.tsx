"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, QrCode, Scan, Plus } from "lucide-react"
import { toast } from "@/hooks/use-toast"

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

  useEffect(() => {
    fetchQRCodes()
  }, [])

  const fetchQRCodes = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/qr/list")
      if (response.ok) {
        const data = await response.json()
        setQrCodes(data.qrCodes)
      }
    } catch (error) {
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
      const response = await fetch("/api/qr/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: `Generated ${data.count} QR codes successfully`,
        })
        fetchQRCodes()
        setQuantity(1)
      } else {
        throw new Error("Failed to generate QR codes")
      }
    } catch (error) {
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
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download QR code",
        variant: "destructive",
      })
    }
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
          <p className="text-muted-foreground">Generate and manage your QR codes</p>
        </div>
        <QrCode className="h-8 w-8 text-primary" />
      </div>

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
          </div>
        </CardContent>
      </Card>

      {/* QR Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>QR Codes</CardTitle>
          <CardDescription>Manage and track your generated QR codes</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : qrCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No QR codes generated yet. Create some to get started!
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
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/scan/${qr.uniqueId}`, "_blank")}
                            className="flex items-center gap-1"
                          >
                            <Scan className="h-3 w-3" />
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
    </div>
  )
}
