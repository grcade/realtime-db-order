import React, { useState, useEffect } from "react";
import { socket, SOCKET_EVENTS } from "../services/socket";
import { PlusCircle, RefreshCw, AlertCircle } from "lucide-react";

const AdminPanel = () => {
  const [orders, setOrders] = useState([]);
  const [newOrder, setNewOrder] = useState({
    product_name: "",
    quantity: 1,
    total_price: 0,
    user_id: 1,
    status: "pending",
  });

  useEffect(() => {
    // Fetch initial list
    socket.on("orders:list", (initialOrders) => {
      setOrders(initialOrders);
    });

    // Listen for updates to keep local list in sync
    socket.on(SOCKET_EVENTS.ORDER_CREATED, (data) => {
      setOrders((prev) => [data.order, ...prev]);
    });

    socket.on(SOCKET_EVENTS.ORDER_UPDATED, (data) => {
      setOrders((prev) =>
        prev.map((order) => (order.id === data.order.id ? data.order : order)),
      );
    });

    return () => {
      socket.off(SOCKET_EVENTS.ORDER_CREATED);
      socket.off(SOCKET_EVENTS.ORDER_UPDATED);
    };
  }, []);

  const handleCreateOrder = (e) => {
    e.preventDefault();
    if (!newOrder.product_name) return;

    socket.emit("order:create", newOrder);
    setNewOrder({
      product_name: "",
      quantity: 1,
      total_price: 0,
      user_id: 1,
      status: "pending",
    });
  };

  const handleUpdateStatus = (id, status) => {
    socket.emit("order:update", { id, status });
  };

  const statuses = ["pending", "processing", "shipped", "delivered"];

  return (
    <div className="admin-container">
      <h1
        style={{
          marginBottom: "2rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <RefreshCw size={32} color="var(--primary)" /> Admin Control Panel
      </h1>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}
      >
        {/* Create Order Form */}
        <section>
          <div className="card" style={{ padding: "1.5rem" }}>
            <h2
              style={{
                fontSize: "1.25rem",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <PlusCircle size={20} /> New Order
            </h2>
            <form onSubmit={handleCreateOrder}>
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={newOrder.product_name}
                  onChange={(e) =>
                    setNewOrder({ ...newOrder, product_name: e.target.value })
                  }
                  placeholder="e.g. Wireless Mouse"
                  required
                />
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Quantity</label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    value={newOrder.quantity}
                    onChange={(e) =>
                      setNewOrder({
                        ...newOrder,
                        quantity: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Total Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={newOrder.total_price}
                    onChange={(e) =>
                      setNewOrder({
                        ...newOrder,
                        total_price: parseFloat(e.target.value),
                      })
                    }
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "1rem" }}
              >
                Create Order
              </button>
            </form>
          </div>
        </section>

        {/* Status Management */}
        <section>
          <div className="card">
            <div
              style={{
                padding: "1.5rem",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ fontSize: "1.25rem", margin: 0 }}>
                Manage Statuses
              </h2>
              <span style={{ fontSize: "0.875rem", color: "#64748b" }}>
                {orders.length} active orders
              </span>
            </div>
            <div style={{ maxHeight: "600px", overflowY: "auto" }}>
              {orders.length === 0 ? (
                <div
                  style={{
                    padding: "3rem",
                    textAlign: "center",
                    color: "#94a3b8",
                  }}
                >
                  <AlertCircle
                    size={48}
                    style={{ opacity: 0.2, marginBottom: "1rem" }}
                  />
                  <p>No orders to manage</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    style={{
                      padding: "1rem 1.5rem",
                      borderBottom: "1px solid var(--border)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "600" }}>
                        {order.product_name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        Order #{order.id} • ${order.total_price}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {statuses.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleUpdateStatus(order.id, s)}
                          className={`btn ${order.status === s ? "btn-primary" : ""}`}
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.25rem 0.5rem",
                          }}
                          disabled={order.status === s}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminPanel;
