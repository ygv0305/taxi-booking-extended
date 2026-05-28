import dns from "node:dns/promises";
import mongoose from "mongoose";

// Use explicit public resolvers for SRV lookups against MongoDB Atlas.
dns.setServers(["1.1.1.1", "1.0.0.1"]);

declare global {
  var __taxiBookingMongoose:
    | {
        connection: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DB_URL;

  if (!databaseUrl) {
    throw new Error(
      "Database configuration is missing. Set DB_URL in your environment.",
    );
  }

  return databaseUrl;
}

function getDatabaseName(databaseUrl: string) {
  const parsedUrl = new URL(databaseUrl);
  const pathname = parsedUrl.pathname.replace(/^\//, "").trim();

  return pathname || "taxi_booking_p2";
}

export async function connectToDatabase() {
  const databaseUrl = getDatabaseUrl();

  if (!globalThis.__taxiBookingMongoose) {
    globalThis.__taxiBookingMongoose = {
      connection: null,
      promise: null,
    };
  }

  const cache = globalThis.__taxiBookingMongoose;

  if (cache.connection) {
    return cache.connection;
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(databaseUrl, {
      dbName: getDatabaseName(databaseUrl),
      bufferCommands: false,
    });
  }

  try {
    cache.connection = await cache.promise;
    return cache.connection;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
}
