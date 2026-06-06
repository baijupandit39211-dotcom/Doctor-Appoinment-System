import { createServer } from "node:http";

import { app, initializeApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { initializeSocketServer } from "./realtime/socket.js";

await initializeApp();

try {
  await connectDatabase();

  const httpServer = createServer(app);
  initializeSocketServer(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`DocPulse API listening on http://localhost:${env.PORT}`);
  });
} catch (error) {
  console.error("Failed to start DocPulse API:", error);
  process.exit(1);
}
