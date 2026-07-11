import React, { useState } from "react";
import { Bell, Package, CheckCircle, Clock, Truck } from "lucide-react";

const Dashboard = ({
  orders,
  notifications,
  unreadCount,
  onMarkNotificationsRead,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleNotifications = () => {
    if (showNotifications) {
      onMarkNotificationsRead();
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
