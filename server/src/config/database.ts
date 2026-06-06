import mongoose from "mongoose";

import { env } from "./env.js";

let isConnected = false;

export async function connectDatabase() {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return mongoose.connection;
  }

  await mongoose.connect(env.MONGODB_URI);
  isConnected = true;
  return mongoose.connection;
}
