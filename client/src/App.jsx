import { useEffect, useState } from "react";
import "./App.css";
import Dashboard from "./components/Dashboard";
import AdminPanel from "./components/AdminPanel";
import { socket, SOCKET_EVENTS } from "./services/socket";

function App() {
  const [view, setView] = useState("dashboard");
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleOrdersList = (initialOrders) => {
      setOrders(initialOrders);
    };

    const handleOrderCreated = (data) => {
      const newOrder = data.order;
      setOrders((prev) => [newOrder, ...prev]);
      setNotifications((prev) => [
        {
          id: Date.now(),
          message: `New order created: #${newOrder.id} (${newOrder.product_name})`,
          read: false,
          time: new Date(),
        },
        ...prev,
      ]);
      setUnreadCount((prev) => prev + 1);
    };

    const handleOrderUpdated = (data) => {
      const updatedOrder = data.order;
      setOrders((prev) =>
        prev.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order,
        ),
      );
      setNotifications((prev) => [
        {
          id: Date.now(),
          message: `Order #${updatedOrder.id} status: ${updatedOrder.status}`,
          read: false,
          time: new Date(),
        },
        ...prev,
      ]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("orders:list", handleOrdersList);
    socket.on(SOCKET_EVENTS.ORDER_CREATED, handleOrderCreated);
    socket.on(SOCKET_EVENTS.ORDER_UPDATED, handleOrderUpdated);
    socket.emit("orders:request");

    return () => {
      socket.off("orders:list", handleOrdersList);
      socket.off(SOCKET_EVENTS.ORDER_CREATED, handleOrderCreated);
      socket.off(SOCKET_EVENTS.ORDER_UPDATED, handleOrderUpdated);
    };
  }, []);

  const markNotificationsRead = () => {
    setUnreadCount(0);
  };

  return (
    <div className="container">
      <nav className="nav">
        <button
          className={`nav-link ${view === "dashboard" ? "active" : ""}`}
          onClick={() => setView("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={`nav-link ${view === "admin" ? "active" : ""}`}
          onClick={() => setView("admin")}
        >
          Admin Panel
        </button>
      </nav>

      <main>
        {view === "dashboard" ? (
          <Dashboard
            orders={orders}
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkNotificationsRead={markNotificationsRead}
          />
        ) : (
          <AdminPanel orders={orders} />
        )}
      </main>
    </div>
  );
}

export default App;
