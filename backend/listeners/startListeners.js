// Each channel and what socket event it maps to
const CHANNELS = {
  order_updates: "order:updated",
  order_created: "order:created",
  user_created: "user:created",
};

async function startListeners(pool, io) {
  const client = await pool.connect(); // itis a dedicated conncetion stays open

  try {
    for (const channel of Object.keys(CHANNELS)) {
      await client.query(`LISTEN ${channel}`);
      console.log(`Listening on channel: ${channel}`);
    }

    client.on("notification", (msg) => {
      try {
        const payload = JSON.parse(msg.payload);
        const socketEvent = CHANNELS[msg.channel];

        console.log(` [${msg.channel}]`, payload);

        // Broadcast to ALL connected socket clients
        io.emit(socketEvent, payload);
      } catch (err) {
        console.error("[ERR] Failed to parse notification:", err.message);
      }
    });

    client.on("error", async (err) => {
      console.error("[ERR] Listener connection error:", err.message);
      console.log("Reconnecting listeners in 5s...");
      setTimeout(() => startListeners(pool, io), 5000); // recoonect after delay
    });
  } catch (err) {
    client.release(); // only release if we failed to set up listener, not then keep it open
    throw err;
  }
}

export default startListeners;
