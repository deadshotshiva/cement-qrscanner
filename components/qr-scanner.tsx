"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, X, RotateCcw, Flashlight, CheckCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import jsQR from "jsqr"

interface QRScannerProps {
  onScanResult: (result: string) => void
  onClose: () => void
}

export function QRScanner({ onScanResult, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const [hasFlash, setHasFlash] = useState(false)
  const [flashOn, setFlashOn] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [facingMode])

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
      }

      // Check if device has flash
      const track = mediaStream.getVideoTracks()[0]
      const capabilities = track.getCapabilities()
      setHasFlash(!!capabilities.torch)

      setIsScanning(true)
      startScanning()

      toast({
        title: "Camera Started",
        description: "Point your camera at a QR code to scan",
      })
    } catch (error) {
      console.error("Error accessing camera:", error)
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }
    setIsScanning(false)
  }

  const startScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }

    scanIntervalRef.current = setInterval(() => {
      scanQRCode()
    }, 300) // Scan every 300ms
  }

  const scanQRCode = async () => {
    if (!videoRef.current || !canvasRef.current || !isScanning || isProcessing) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    try {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      })

      if (code) {
        console.log("QR Code detected:", code.data)
        setScanResult(code.data)
        setIsScanning(false)
        setIsProcessing(true)

        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current)
        }

        // Process the scanned QR code
        await processScanResult(code.data)
      }
    } catch (error) {
      // Silently continue scanning if no QR code found
    }
  }

  const processScanResult = async (qrData: string) => {
    try {
      // Check if it's one of our QR codes
      const urlPattern = new RegExp(`${window.location.origin}/scan/([a-f0-9-]+)`)
      const match = qrData.match(urlPattern)

      if (match) {
        const qrId = match[1]
        console.log("Scanning our QR ID:", qrId)

        // Call the scan API
        const response = await fetch(`/api/qr/scan/${qrId}`, {
          method: "POST",
        })

        const result = await response.json()

        if (result.success) {
          toast({
            title: "QR Code Scanned Successfully!",
            description: result.message,
          })
          onScanResult(qrId)
        } else {
          toast({
            title: "Scan Result",
            description: result.message || "QR code processed",
          })
          onScanResult(qrData)
        }
      } else {
        // External QR code
        toast({
          title: "External QR Code Detected",
          description: "This QR code is not from our system",
        })
        onScanResult(qrData)
      }
    } catch (error) {
      console.error("Error processing scan result:", error)
      toast({
        title: "Processing Error",
        description: "Failed to process scanned QR code",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleFlash = async () => {
    if (!stream || !hasFlash) return

    try {
      const track = stream.getVideoTracks()[0]
      await track.applyConstraints({
        advanced: [{ torch: !flashOn }],
      })
      setFlashOn(!flashOn)
    } catch (error) {
      console.error("Error toggling flash:", error)
      toast({
        title: "Flash Error",
        description: "Unable to toggle flash",
        variant: "destructive",
      })
    }
  }

  const switchCamera = () => {
    setFacingMode(facingMode === "user" ? "environment" : "user")
    setScanResult(null)
  }

  const resetScan = () => {
    setScanResult(null)
    setIsProcessing(false)
    setIsScanning(true)
    startScanning()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                QR Scanner
              </CardTitle>
              <CardDescription>Point your camera at a QR code</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera View */}
          <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-white rounded-lg relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-500 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-500 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-500 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-500 rounded-br-lg"></div>

                {isScanning && !scanResult && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-green-500 animate-pulse"></div>
                  </div>
                )}

                {scanResult && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500 bg-opacity-20">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div className="absolute top-2 left-2">
              <Badge variant={isScanning ? "default" : scanResult ? "default" : "secondary"}>
                {isProcessing ? "Processing..." : isScanning ? "Scanning..." : scanResult ? "Detected!" : "Paused"}
              </Badge>
            </div>

            {/* Flash indicator */}
            {flashOn && (
              <div className="absolute top-2 right-2">
                <Badge variant="outline">
                  <Flashlight className="h-3 w-3 mr-1" />
                  Flash On
                </Badge>
              </div>
            )}
          </div>

          {/* Scan Result */}
          {scanResult && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium text-green-800">QR Code Detected!</p>
              </div>
              <p className="text-xs text-green-600 break-all font-mono">{scanResult}</p>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            <Button onClick={switchCamera} variant="outline" className="flex-1 bg-transparent">
              <RotateCcw className="h-4 w-4 mr-2" />
              {facingMode === "user" ? "Back Camera" : "Front Camera"}
            </Button>
            {hasFlash && (
              <Button onClick={toggleFlash} variant={flashOn ? "default" : "outline"} size="icon" title="Toggle Flash">
                <Flashlight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          {scanResult ? (
            <div className="flex gap-2">
              <Button onClick={resetScan} variant="outline" className="flex-1 bg-transparent">
                Scan Another
              </Button>
              <Button onClick={onClose} className="flex-1">
                Done
              </Button>
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              <p>Position the QR code within the frame</p>
              <p>The scan will happen automatically</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
