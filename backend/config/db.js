import mongoose from 'mongoose'

export const connectDB = async () => {
  try {
    // Try connecting with shorter timeout to fail fast
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      socketTimeoutMS: 15000,
      family: 4, // force IPv4 — avoids IPv6 DNS resolution issues on some ISPs
    })
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`)
    console.warn(`⚠️  Warning: Starting server without MongoDB connection for frontend dev.`)
    // Don't exit — allow server to start for frontend testing
  }
}
