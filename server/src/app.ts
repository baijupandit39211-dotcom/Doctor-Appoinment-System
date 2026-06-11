import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import { registerRoutes } from "./routes/index.js";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware.js";

export const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

registerRoutes(app);

app.use(notFoundHandler);
app.use(errorHandler);

export async function initializeApp() {
  return app;
}
