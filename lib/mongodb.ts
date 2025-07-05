import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in .env.local")
}

interface GlobalMongoose {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var myMongoose: GlobalMongoose | undefined
}

let cached = global.myMongoose

if (!cached) {
  cached = global.myMongoose = { conn: null, promise: null }
}

async function connectDB() {
  if (cached!.conn) {
    console.log("♻️ Using existing MongoDB connection")
    return cached!.conn
  }

  if (!cached!.promise) {
    console.log("🔌 Creating new MongoDB connection...")
    console.log("🔗 MongoDB URI:", MONGODB_URI?.substring(0, 20) + "...")

    const opts = {
      bufferCommands: false,
    }

    cached!.promise = mongoose.connect(MONGODB_URI!, opts)
  }

  try {
    cached!.conn = await cached!.promise
    console.log("✅ MongoDB connected successfully")
    console.log("📊 Connection state:", mongoose.connection.readyState)
    console.log("🏷️ Database name:", mongoose.connection.name)
  } catch (e) {
    cached!.promise = null
    console.error("❌ MongoDB connection error:", e)
    throw e
  }

  return cached!.conn
}

export default connectDB
