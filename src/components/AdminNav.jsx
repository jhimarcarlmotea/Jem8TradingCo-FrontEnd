import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const mainNavItems = [
  { label: "Dashboard", icon: "⊞", href: "/adminDashboard" },
  { label: "Products", icon: "📦", href: "/adminProducts" },
  { label: "Orders", icon: "🛒", href: "/adminOrders" },
  { label: "Blog Post", icon: "📝", href: "/adminBlogpost" },
  { label: "Account Management", icon: "👤", href: "/adminAccountmanagement" },
  { label: "Customer Reports", icon: "📊", href: "/adminContact" },
  { label: "Leadership Management", icon: "🏆", href: "/adminLeadership" },
  { label: "Backup & Recovery", icon: "💾", href: "/adminBackup" },
  { label: "Reviews", icon: "⭐", href: "/adminReviews" },
  { label: "Messages", icon: "✉️", href: "/adminMessage" },
  { label: "Activity Log", icon: "📋", href: "/adminActivitylogs" },
];

// Settings
const settingsItems = [
  { label: "Settings", icon: "⚙️", href: "/adminSettings" },
];

export default function AdminNav({ sidebarOpen, setSidebarOpen }) {
  const location = useLocation();

  const linkStyle = (active) => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    borderRadius: "8px",
    marginBottom: "2px",
    cursor: "pointer",
    background: active ? "#155DFC" : "transparent",
    color: active ? "#fff" : "#374151",
    fontSize: "13px",
    fontWeight: active ? 600 : 500,
    transition: "all 0.15s ease",
    textDecoration: "none",
  });

  const NavContent = () => (
    <>
      {/* Logo Area */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <img
            src="/src/assets/Logo — Jem 8 Circle Trading Co (1).png"
            alt="JEM 8 CIRCLE"
            style={{ height: "56px", width: "auto", objectFit: "contain" }}
          />
          <button
            onClick={() => setSidebarOpen(false)}
            className="admin-close-btn"
            style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#6B7280" }}
          >✕</button>
        </div>
        <div style={{ fontWeight: 700, fontSize: "16px", color: "#111827", marginTop: "12px" }}>
          Admin Panel
        </div>
        <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>
          Account Management System
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: "12px", flex: 1, overflowY: "auto" }}>
        {/* Lahat ng mainNavItems, kasama na ang Reviews */}
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.label}
              to={item.href}
              style={linkStyle(isActive)}
              onClick={() => setSidebarOpen(false)}
            >
              <span style={{ fontSize: "15px", width: "20px", textAlign: "center" }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Divider before Settings */}
        <div style={{ 
          height: "1px", 
          background: "#E5E7EB", 
          margin: "12px 0 8px 0",
        }} />

        {/* Settings */}
        {settingsItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.label}
              to={item.href}
              style={linkStyle(isActive)}
              onClick={() => setSidebarOpen(false)}
            >
              <span style={{ fontSize: "15px", width: "20px", textAlign: "center" }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Profile */}
      <div style={{
        padding: "16px",
        borderTop: "1px solid #E5E7EB",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}>
        <div style={{
          width: "36px", height: "36px", borderRadius: "50%",
          background: "linear-gradient(135deg, #2B7FFF, #9810FA)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 700, fontSize: "13px", flexShrink: 0,
        }}>AD</div>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>Admin User</div>
          <div style={{ fontSize: "11px", color: "#9CA3AF" }}>admin@company.com</div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }

        .admin-desktop-sidebar {
          width: 242px;
          min-width: 242px;
          background: #fff;
          border-right: 1px solid #E5E7EB;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
        }

        .admin-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          z-index: 40;
        }

        .admin-mobile-sidebar {
          display: none;
          position: fixed;
          top: 0;
          left: -260px;
          width: 242px;
          height: 100vh;
          background: #fff;
          border-right: 1px solid #E5E7EB;
          flex-direction: column;
          z-index: 50;
          transition: left 0.3s ease;
          overflow-y: auto;
        }

        .admin-mobile-sidebar.open {
          left: 0;
          box-shadow: 4px 0 20px rgba(0,0,0,0.15);
        }

        @media (max-width: 767px) {
          .admin-desktop-sidebar { display: none !important; }
          .admin-mobile-sidebar { display: flex !important; }
          .admin-overlay { display: ${sidebarOpen ? "block" : "none"} !important; }
          .admin-close-btn { display: inline !important; }
        }

        @media (min-width: 768px) {
          .admin-desktop-sidebar { display: flex !important; }
          .admin-mobile-sidebar { display: none !important; }
          .admin-overlay { display: none !important; }
          .admin-close-btn { display: none !important; }
        }
      `}</style>

      {/* Mobile overlay */}
      <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />

      {/* Mobile sidebar */}
      <aside className={`admin-mobile-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <NavContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="admin-desktop-sidebar">
        <NavContent />
      </aside>
    </>
  );
}