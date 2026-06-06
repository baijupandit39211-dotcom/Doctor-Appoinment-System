import type { Express } from "express";

import { healthRouter } from "./health.route.js";
import { authRouter } from "./auth.route.js";
import { protectedTestRouter } from "./protected-test.route.js";
import { departmentRouter } from "./department.route.js";
import { doctorRouter } from "./doctor.route.js";
import { availabilityRouter } from "./availability.route.js";
import { appointmentRouter } from "./appointment.route.js";
import { notificationRouter } from "./notification.route.js";
import { reportRouter } from "./report.route.js";
import { patientRouter } from "./patient.route.js";

export function registerRoutes(app: Express) {
  app.use("/api", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/protected", protectedTestRouter);
  app.use("/api/departments", departmentRouter);
  app.use("/api/doctors", doctorRouter);
  app.use("/api/availability", availabilityRouter);
  app.use("/api/appointments", appointmentRouter);
  app.use("/api/notifications", notificationRouter);
  app.use("/api/reports", reportRouter);
  app.use("/api/patients", patientRouter);
}
