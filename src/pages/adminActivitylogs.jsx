import { useState } from "react";
import AdminNav from "../components/AdminNav";
import "../style/adminActivityLogs.css";

const tabs = ["All", "Orders", "Stock", "Account", "Blogs", "Payments", "Backups"];

const initialLogs = [
  {
    id: 1,
    user: "Juan Dela Cruz",
    action: "Placed order",
    badge: "ORDER - 001 - $100",
    badgeType: "order",
    items: "Organic Barley x3 Office Supplies x1",
    date: "Feb 20 at 12:00 PM",
    tag: "ORDER",
    time: "12:00 PM",
    group: "Friday, February 20, 2025",
    category: "Orders",
    icon: "🛒",
  },
  {
    id: 2,
    user: "Juan Dela Cruz",
    action: "Order Completed",
    badge: "ORDER - 001 - $100",
    badgeType: "order",
    items: "Janitorial Cleaning set x2",
    date: "Feb 23 at 12:00 PM",
    tag: "ORDER",
    time: "12:00 PM",
    group: "Monday, February 23, 2025",
    category: "Orders",
    icon: "🛒",
  },
  {
    id: 3,
    user: "Juan Dela Cruz",
    action: "Order Completed",
    badge: "ORDER - 001 - $100",
    badgeType: "order",
    items: "Janitorial Cleaning set x2",
    date: "Feb 23 at 12:00 PM",
    tag: "ORDER",
    time: "12:00 PM",
    group: "Monday, February 23, 2025",
    category: "Orders",
    icon: "🛒",
  },
  {
    id: 4,
    user: "Juan Dela Cruz",
    action: "Order Completed",
    badge: "ORDER - 001 - $100",
    badgeType: "order",
    items: "Janitorial Cleaning set x2",
    date: "Feb 23 at 12:00 PM",
    tag: "ORDER",
    time: "12:00 PM",
    group: "Monday, February 23, 2025",
    category: "Orders",
    icon: "🛒",
  },
  {
    id: 5,
    user: "Juan Dela Cruz",
    action: "Order Completed",
    badge: "ORDER - 001 - $100",
    badgeType: "order",
    items: "Janitorial Cleaning set x2",
    date: "Feb 23 at 12:00 PM",
    tag: "ORDER",
    time: "12:00 PM",
    group: "Monday, February 23, 2025",
    category: "Orders",
    icon: "🛒",
  },
  {
    id: 6,
    user: "Admin",
    action: "Updated stock",
    badge: "STOCK - 002",
    badgeType: "stock",
    items: "Barley 500g x10",
    date: "Feb 23 at 2:00 PM",
    tag: "STOCK",
    time: "2:00 PM",
    group: "Monday, February 23, 2025",
    category: "Stock",
    icon: "📦",
  },
  {
    id: 7,
    user: "Admin",
    action: "Published blog post",
    badge: "BLOG - 003",
    badgeType: "blog",
    items: "Jem 8 Circle at the MSME Expo 2025",
    date: "Feb 23 at 3:00 PM",
    tag: "BLOG",
    time: "3:00 PM",
    group: "Monday, February 23, 2025",
    category: "Blogs",
    icon: "📝",
  },
  {
    id: 8,
    user: "Admin",
    action: "Backup completed",
    badge: "BACKUP - 004",
    badgeType: "backup",
    items: "Full system backup",
    date: "Feb 23 at 4:00 PM",
    tag: "BACKUP",
    time: "4:00 PM",
    group: "Monday, February 23, 2025",
    category: "Backups",
    icon: "💾",
  },
];

export default function AdminActivityLog() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState(initialLogs);
  const [deleteId, setDeleteId] = useState(null);

  const filtered = logs.filter((log) => {
    const matchTab = activeTab === "All" || log.category === activeTab;
    const matchSearch =
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.items.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  // Group by date
  const grouped = filtered.reduce((acc, log) => {
    if (!acc[log.group]) acc[log.group] = [];
    acc[log.group].push(log);
    return acc;
  }, {});

  const handleDelete = (id) => {
    setLogs(logs.filter((l) => l.id !== id));
    setDeleteId(null);
  };

  return (
    <div className="actlog-wrapper">
      <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="actlog-main">

        {/* Top Bar */}
        <div className="actlog-topbar">
          <div className="actlog-topbar-left">
            <button className="actlog-burger" onClick={() => setSidebarOpen(true)}>☰</button>
            <h1 className="actlog-title">Activity Log</h1>
          </div>
          <div className="actlog-search-wrapper">
            <span className="actlog-search-icon">🔍</span>
            <input
              className="actlog-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Activity..."
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="actlog-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`actlog-tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Grouped Logs */}
        <div className="actlog-groups">
          {Object.keys(grouped).length === 0 ? (
            <div className="actlog-empty">No activity found.</div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="actlog-group">
                {/* Date Divider */}
                <div className="actlog-date-divider">
                  <span className="actlog-date-label">{group}</span>
                  <div className="actlog-date-line" />
                </div>

                {/* Log Items */}
                <div className="actlog-items">
                  {items.map((log) => (
                    <div key={log.id} className="actlog-item">
                      <div className="actlog-item-left">
                        <div className="actlog-icon">{log.icon}</div>
                        <div className="actlog-info">
                          <div className="actlog-info-top">
                            <span className="actlog-user">{log.user}</span>
                            <span className="actlog-action">{log.action}</span>
                            <span className={`actlog-badge badge-${log.badgeType}`}>{log.badge}</span>
                          </div>
                          <div className="actlog-info-bottom">
                            <span className="actlog-items-text">{log.items}</span>
                          </div>
                          <div className="actlog-meta">
                            <span className="actlog-date-text">{log.date}</span>
                            <span className="actlog-tag">{log.tag}</span>
                          </div>
                        </div>
                      </div>
                      <div className="actlog-item-right">
                        <span className="actlog-time">{log.time}</span>
                        <button
                          className="actlog-delete-btn"
                          onClick={() => setDeleteId(log.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="actlog-modal-overlay">
          <div className="actlog-delete-modal">
            <span className="actlog-delete-icon">🗑️</span>
            <h3 className="actlog-delete-title">Delete this activity?</h3>
            <p className="actlog-delete-text">This action is permanent and cannot be undone.</p>
            <div className="actlog-delete-footer">
              <button className="actlog-cancel-btn" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="actlog-confirm-btn" onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}