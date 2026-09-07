import mongoose from 'mongoose';

interface MongooseConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // allow global `mongoose` to be attached in development to persist cache across HMR
  // eslint-disable-next-line no-var
  var mongoose: MongooseConnection | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached!.conn) return cached!.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    // Validate only when a request actually needs MongoDB. Next.js imports route
    // modules during production builds, so throwing at module scope makes deploy
    // previews impossible when secrets are intentionally unavailable at build time.
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  if (!cached!.promise) {
    cached!.promise = mongoose.connect(uri, { bufferCommands: false }).then((m) => m);
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (error) {
    cached!.promise = null;
    throw error;
  }

  return cached!.conn!;
}

export default dbConnect;
