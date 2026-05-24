import React, { useState, useEffect } from "react";
import { socket, SOCKET_EVENTS } from "../services/socket";
import { Bell, Package, CheckCircle, Clock, Truck } from "lucide-react";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    socket.on("orders:list", (initialOrders) => {
      setOrders(initialOrders);
    });

    socket.on(SOCKET_EVENTS.ORDER_CREATED, (data) => {
      const newOrder = data.order;
      setOrders((prev) => [newOrder, ...prev]);
      addNotification(
        `New order created: #${newOrder.id} (${newOrder.product_name})`,
      );
    });

    socket.on(SOCKET_EVENTS.ORDER_UPDATED, (data) => {
      const updatedOrder = data.order;
      setOrders((prev) =>
        prev.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order,
        ),
      );
      addNotification(
        `Order #${updatedOrder.id} status: ${updatedOrder.status}`,
      );
    });

    return () => {
      socket.off(SOCKET_EVENTS.ORDER_CREATED);
      socket.off(SOCKET_EVENTS.ORDER_UPDATED);
    };
  }, []);

  const addNotification = (message) => {
    const newNotif = { id: Date.now(), message, read: false, time: new Date() };
    setNotifications((prev) => [newNotif, ...prev]);
    setUnreadCount((prev) => prev + 1);
  };

  const toggleNotifications = () => {
    if (showNotifications) {
      setUnreadCount(0);
    }
    setShowNotifications(!showNotifications);
  };

  const getStatusClass = (status) => {
    return `status-badge status-${status}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock size={14} />;
      case "processing":
        return <Package size={14} />;
      case "shipped":
        return <Truck size={14} />;
      case "delivered":
        return <CheckCircle size={14} />;
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container">
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1
          style={{
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Package size={32} color="var(--primary)" /> Live Orders
        </h1>

        <div style={{ position: "relative" }}>
          <button className="notification-bell" onClick={toggleNotifications}>
            <Bell size={24} />
            {unreadCount > 0 && <span className="dot">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="notifications-panel">
              <div
                style={{
                  padding: "0.75rem",
                  fontWeight: "bold",
                  borderBottom: "1px solid var(--border)",
                  backgroundColor: "#f8fafc",
                }}
              >
                Notifications
              </div>
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    No updates yet
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="notif-item">
                      {n.message}
                      <div className="notif-time">
                        {n.time.toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  style={{
                    textAlign: "center",
                    padding: "3rem",
                    color: "#94a3b8",
                    fontStyle: "italic",
                  }}
                >
                  No orders found. Use Admin Panel to create some!
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: "500", fontFamily: "monospace" }}>
                    #{order.id}
                  </td>
                  <td>{order.product_name}</td>
                  <td>{order.quantity}</td>
                  <td style={{ fontWeight: "600" }}>${order.total_price}</td>
                  <td>
                    <span className={getStatusClass(order.status)}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
