import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "DocPulse API is healthy",
    timestamp: new Date().toISOString(),
  });
});
