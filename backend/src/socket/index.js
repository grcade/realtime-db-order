import { Server } from "socket.io";
import startListeners from "../../listeners/startListeners.js";
import dotenv from "dotenv";

dotenv.config();

export let io;

export function initSocket(httpServer, db) {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  startListeners(db, io);

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Send initial orders to the newly connected client
    const sendInitialOrders = async () => {
      try {
        const result = await db.query(
          "SELECT * FROM orders ORDER BY created_at DESC",
        );
        socket.emit("orders:list", result.rows);
      } catch (error) {
        console.error("Failed to fetch initial orders:", error);
      }
    };

    sendInitialOrders();

    socket.on("order:create", async (orderData) => {
      try {
        let { user_id, product_name, quantity, total_price, status } =
          orderData;

        // Ensure we have a valid user_id
        if (!user_id) {
          const userRes = await db.query("SELECT id FROM users LIMIT 1");
          user_id = userRes.rows[0]?.id;
        }

        await db.query(
          `INSERT INTO orders (user_id, product_name, quantity, total_price, status) 
           VALUES ($1, $2, $3, $4, $5)`,
          [user_id, product_name, quantity, total_price, status || "pending"],
        );
      } catch (error) {
        console.error("Failed to create order:", error);
        socket.emit("error", { message: "Failed to create order" });
      }
    });

    socket.on("order:update", async (updateData) => {
      try {
        const { id, status } = updateData;
        await db.query("UPDATE orders SET status = $1 WHERE id = $2", [
          status,
          id,
        ]);
      } catch (error) {
        console.error("Failed to update order:", error);
        socket.emit("error", { message: "Failed to update order" });
      }
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });

  return io;
}
