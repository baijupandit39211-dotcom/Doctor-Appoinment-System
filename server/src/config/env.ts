import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 4000),
  CLIENT_URL: required("CLIENT_URL", "http://localhost:3000"),
  MONGODB_URI: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/docpulse",
  JWT_SECRET: required("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  COOKIE_NAME: process.env.COOKIE_NAME ?? "docpulse_token",
};
