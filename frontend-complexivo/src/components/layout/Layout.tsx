import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./Layout.css";

const PIN_KEY = "sidebar_pinned";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(PIN_KEY);
    if (saved === "1") {
      setPinned(true);
      setSidebarOpen(true);
    }
  }, []);

  const toggleSidebar = () => {
    if (pinned) return;
    setSidebarOpen((p) => !p);
  };

  const closeSidebar = () => {
    if (pinned) return;
    setSidebarOpen(false);
  };

  const togglePinned = () => {
    setPinned((p) => {
      const next = !p;
      localStorage.setItem(PIN_KEY, next ? "1" : "0");
      if (next) setSidebarOpen(true);
      return next;
    });
  };

  return (
    <div className="app-shell">
      <Sidebar
        isOpen={sidebarOpen}
        pinned={pinned}
        onTogglePinned={togglePinned}
        onClose={closeSidebar}
      />

      <div className={`app-main ${(sidebarOpen || pinned) ? "with-sidebar" : ""}`}>
        <Topbar onToggleSidebar={toggleSidebar} />

        {/* 🔑 ESTE main es el que controla el ancho real */}
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
