import { useState } from "react";
import AdminNav from "../components/AdminNav";

const tabs = ["All", "Orders", "Stock", "Account", "Blogs", "Payments", "Backups"];

const initialLogs = [
  { id: 1, user: "Juan Dela Cruz", action: "Placed order",       badge: "ORDER - 001 - $100", badgeType: "order",  items: "Organic Barley x3 Office Supplies x1",       date: "Feb 20 at 12:00 PM", tag: "ORDER",  time: "12:00 PM", group: "Friday, February 20, 2025",  category: "Orders",  icon: "🛒" },
  { id: 2, user: "Juan Dela Cruz", action: "Order Completed",    badge: "ORDER - 001 - $100", badgeType: "order",  items: "Janitorial Cleaning set x2",                  date: "Feb 23 at 12:00 PM", tag: "ORDER",  time: "12:00 PM", group: "Monday, February 23, 2025",  category: "Orders",  icon: "🛒" },
  { id: 3, user: "Juan Dela Cruz", action: "Order Completed",    badge: "ORDER - 001 - $100", badgeType: "order",  items: "Janitorial Cleaning set x2",                  date: "Feb 23 at 12:00 PM", tag: "ORDER",  time: "12:00 PM", group: "Monday, February 23, 2025",  category: "Orders",  icon: "🛒" },
  { id: 4, user: "Juan Dela Cruz", action: "Order Completed",    badge: "ORDER - 001 - $100", badgeType: "order",  items: "Janitorial Cleaning set x2",                  date: "Feb 23 at 12:00 PM", tag: "ORDER",  time: "12:00 PM", group: "Monday, February 23, 2025",  category: "Orders",  icon: "🛒" },
  { id: 5, user: "Juan Dela Cruz", action: "Order Completed",    badge: "ORDER - 001 - $100", badgeType: "order",  items: "Janitorial Cleaning set x2",                  date: "Feb 23 at 12:00 PM", tag: "ORDER",  time: "12:00 PM", group: "Monday, February 23, 2025",  category: "Orders",  icon: "🛒" },
  { id: 6, user: "Admin",          action: "Updated stock",      badge: "STOCK - 002",        badgeType: "stock",  items: "Barley 500g x10",                             date: "Feb 23 at 2:00 PM",  tag: "STOCK",  time: "2:00 PM",  group: "Monday, February 23, 2025",  category: "Stock",   icon: "📦" },
  { id: 7, user: "Admin",          action: "Published blog post",badge: "BLOG - 003",         badgeType: "blog",   items: "Jem 8 Circle at the MSME Expo 2025",          date: "Feb 23 at 3:00 PM",  tag: "BLOG",   time: "3:00 PM",  group: "Monday, February 23, 2025",  category: "Blogs",   icon: "📝" },
  { id: 8, user: "Admin",          action: "Backup completed",   badge: "BACKUP - 004",       badgeType: "backup", items: "Full system backup",                          date: "Feb 23 at 4:00 PM",  tag: "BACKUP", time: "4:00 PM",  group: "Monday, February 23, 2025",  category: "Backups", icon: "💾" },
];

// ── Badge styles per type ─────────────────────────────────────────────────────
const badgeMap = {
  order:   "bg-blue-50 text-blue-600 border-blue-200",
  stock:   "bg-green-50 text-green-700 border-green-200",
  blog:    "bg-orange-50 text-orange-700 border-orange-200",
  backup:  "bg-violet-50 text-violet-700 border-violet-200",
  payment: "bg-emerald-50 text-emerald-600 border-emerald-200",
  account: "bg-rose-50 text-rose-600 border-rose-200",
};

export default function AdminActivityLog() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab]     = useState("All");
  const [search, setSearch]           = useState("");
  const [logs, setLogs]               = useState(initialLogs);
  const [deleteId, setDeleteId]       = useState(null);

  const filtered = logs.filter((log) => {
    const matchTab    = activeTab === "All" || log.category === activeTab;
    const matchSearch =
      log.user.toLowerCase().includes(search.toLowerCase())   ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.items.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

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
    <>
      <style>{`
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn   { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>

      <div className="flex min-h-screen bg-[#F0F7F2] font-sans text-slate-900">
        <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 min-w-0 px-7 py-7 pb-12 overflow-x-hidden max-md:px-4 max-md:py-5">

          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3.5">
            <div className="flex items-center gap-3.5">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden bg-white border border-gray-200 text-base cursor-pointer text-slate-500 px-2.5 py-1.5 rounded-md shadow-sm hover:bg-gray-50 hover:text-slate-900 transition-all"
              >☰</button>
              <h1 className="text-xl font-bold text-slate-900 m-0 tracking-tight">Activity Log</h1>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Activity..."
                className="py-2 pl-8 pr-4 rounded-lg border border-gray-200 text-sm font-[inherit] text-slate-900 outline-none bg-white w-60 shadow-sm placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/8 transition-all max-md:w-40"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap mb-7">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg border text-sm font-[inherit] cursor-pointer shadow-sm transition-all
                  ${activeTab === tab
                    ? "bg-slate-900 text-white border-slate-900 font-semibold"
                    : "bg-white text-slate-500 border-gray-200 font-medium hover:bg-gray-50 hover:text-slate-900 hover:border-slate-300"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Grouped Logs */}
          <div className="flex flex-col gap-6">
            {Object.keys(grouped).length === 0 ? (
              <div className="text-center text-slate-400 text-sm py-16">No activity found.</div>
            ) : (
              Object.entries(grouped).map(([group, items]) => (
                <div key={group}>
                  {/* Date Divider */}
                  <div className="flex items-center gap-3.5 mb-3.5">
                    <span className="text-sm font-semibold text-slate-500 whitespace-nowrap tracking-tight">{group}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* Log Items */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {items.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start justify-between px-5 py-4 border-b border-slate-50 last:border-b-0 hover:bg-[#F8FBFF] transition-colors gap-4 max-md:flex-col max-md:gap-3"
                      >
                        {/* Left */}
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          {/* Icon */}
                          <div className="w-[38px] h-[38px] rounded-lg bg-gray-50 border border-slate-100 flex items-center justify-center text-lg shrink-0">
                            {log.icon}
                          </div>

                          {/* Info */}
                          <div className="flex flex-col gap-1 min-w-0">
                            {/* Top row */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-slate-900">{log.user}</span>
                              <span className="text-sm text-slate-500">{log.action}</span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-mono border ${badgeMap[log.badgeType] ?? badgeMap.order}`}>
                                {log.badge}
                              </span>
                            </div>

                            {/* Items text */}
                            <div className="text-xs text-slate-500">{log.items}</div>

                            {/* Meta */}
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-slate-400 font-mono">{log.date}</span>
                              <span className="inline-flex items-center px-2 py-px rounded bg-gray-50 border border-gray-200 text-[10px] font-bold text-slate-400 tracking-wide">
                                {log.tag}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right */}
                        <div className="flex flex-col items-end gap-2.5 shrink-0 max-md:flex-row max-md:items-center max-md:w-full max-md:justify-between">
                          <span className="text-xs font-medium text-slate-400 font-mono whitespace-nowrap">{log.time}</span>
                          <button
                            onClick={() => setDeleteId(log.id)}
                            className="px-3.5 py-1 rounded-md border border-red-200 bg-red-50 text-xs font-semibold text-red-500 cursor-pointer whitespace-nowrap hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
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
      </div>

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div
          onClick={() => setDeleteId(null)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-5"
          style={{ animation: "overlayIn 0.2s ease" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[18px] p-8 w-full max-w-[360px] text-center shadow-[0_16px_48px_rgba(15,23,42,0.14),0_4px_16px_rgba(15,23,42,0.06)] border border-slate-100"
            style={{ animation: "modalIn 0.2s ease" }}
          >
            <span className="text-[40px] block mb-3.5">🗑️</span>
            <h3 className="text-base font-bold text-slate-900 m-0 mb-2 tracking-tight">Delete this activity?</h3>
            <p className="text-sm text-slate-400 m-0 mb-6 leading-relaxed">This action is permanent and cannot be undone.</p>
            <div className="flex gap-2.5 justify-center">
              <button
                onClick={() => setDeleteId(null)}
                className="px-5 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-slate-500 cursor-pointer hover:bg-gray-50 hover:text-slate-900 transition-colors font-[inherit]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-5 py-2 rounded-lg border-none bg-red-500 text-sm font-semibold text-white cursor-pointer shadow-[0_2px_8px_rgba(239,68,68,0.3)] hover:bg-red-600 hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(239,68,68,0.4)] transition-all font-[inherit]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}