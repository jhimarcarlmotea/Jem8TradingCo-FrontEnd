import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { label: "Dashboard", icon: "⊞", href: "/adminDashboard" },
  { label: "Products", icon: "📦", href: "/adminProducts" },
  { label: "Orders", icon: "🛒", href: "/orders" },
  { label: "Blog Post", icon: "📝", href: "/blog" },
  { label: "Account Management", icon: "👤", href: "/account" },
  { label: "Customer Reports", icon: "📊", href: "/reports" },
  { label: "Leadership Management", icon: "🏆", href: "/leadership" },
  { label: "Backup & Recovery", icon: "💾", href: "/backup" },
  { label: "Activity Logs", icon: "📋", href: "/activity" },
  { label: "Settings", icon: "⚙️", href: "/settings" },
];

export default function AdminNav({ sidebarOpen, setSidebarOpen }) {
  const location = useLocation();

  const navItemStyle = (active) => ({
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
          <div style={{ fontWeight: 800, fontSize: "16px", color: "#155DFC", letterSpacing: "-0.5px" }}>
            JEM 8 CIRCLE
          </div>
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
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.label}
              to={item.href}
              style={navItemStyle(isActive)}
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

        /* Desktop sidebar */
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

        /* Mobile: overlay */
        .admin-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          z-index: 40;
        }

        /* Mobile: sliding sidebar */
        .admin-mobile-sidebar {
          display: none;
          position: fixed;
          top: 0;
          left: ${sidebarOpen ? "0" : "-260px"};
          width: 242px;
          height: 100vh;
          background: #fff;
          border-right: 1px solid #E5E7EB;
          flex-direction: column;
          z-index: 50;
          transition: left 0.3s ease;
          box-shadow: ${sidebarOpen ? "4px 0 20px rgba(0,0,0,0.15)" : "none"};
          overflow-y: auto;
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

      {/* Mobile sliding sidebar */}
      <aside className="admin-mobile-sidebar">
        <NavContent />
      </aside>

      {/* Desktop sticky sidebar */}
      <aside className="admin-desktop-sidebar">
        <NavContent />
      </aside>
    </>
  );
}