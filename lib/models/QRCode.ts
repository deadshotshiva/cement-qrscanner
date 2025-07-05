import mongoose from "mongoose"

const QRCodeSchema = new mongoose.Schema({
  uniqueId: {
    type: String,
    required: true,
    unique: true,
  },
  scanned: {
    type: Boolean,
    default: false,
  },
  scannedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.models.QRCode || mongoose.model("QRCode", QRCodeSchema)
