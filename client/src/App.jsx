import React, { useState } from "react";
import "./App.css";
import Dashboard from "./components/Dashboard";
import AdminPanel from "./components/AdminPanel";

function App() {
  const [view, setView] = useState("dashboard");

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

      <main>{view === "dashboard" ? <Dashboard /> : <AdminPanel />}</main>
    </div>
  );
}

export default App;
