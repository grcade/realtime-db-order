import { createServer } from "http";
import { initDB } from "./src/db/init.js";
import { initSocket } from "./src/socket/index.js";
import { getDbPool } from "./src/db/db.js";

const port = Number(process.env.PORT || 3000);
const httpServer = createServer();

try {
  // Initialize DB first to ensure tables exist
  await initDB();

  // Get DB Pool
  const db = await getDbPool();

  // Initialize Socket.IO with the server and db pool
  initSocket(httpServer, db);

  httpServer.listen(port, () => {
    console.log(`Server & Socket.IO running on port ${port}`);
  });
} catch (err) {
  console.error("Failed to start server:", err);
  process.exit(1);
}
