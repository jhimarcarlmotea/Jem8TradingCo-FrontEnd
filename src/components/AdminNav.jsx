import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { me } from "../api/auth";

const navGroups = [
  {
    group: "Overview",
    items: [
      { label: "Dashboard", icon: "⊞", href: "/adminDashboard", visibleTo: null },
    ],
  },
  {
    group: "Equipments and Supplies",
    items: [
      { label: "Products", icon: "📦", href: "/adminProducts", visibleTo: ['Sales','IT','Admin'] },
      { label: "Orders", icon: "🛒", href: "/adminOrders", visibleTo: ['Sales','Admin'] },
      { label: "Reviews", icon: "⭐", href: "/adminReviews", visibleTo: ['Marketing','Sales','Admin'] },
    ],
  },
  {
    group: "Content",
    items: [
      { label: "Blog Post", icon: "📝", href: "/adminBlogpost", visibleTo: ['Marketing','Admin'] },
      { label: "Messages", icon: "✉️", href: "/adminMessage", visibleTo: ['Marketing','Sales','Admin'] },
    ],
  },
  {
    group: "People",
    items: [
      { label: "Account Management", icon: "👤", href: "/adminAccountmanagement", visibleTo: ['IT','Admin'] },
      { label: "Leadership Management", icon: "🏆", href: "/adminLeadership", visibleTo: ['Admin'] },
      { label: "Customer Reports", icon: "📊", href: "/adminContact", visibleTo: ['Finance','Admin'] },
    ],
  },
  {
    group: "System",
    items: [
      { label: "Activity Log", icon: "📋", href: "/adminActivitylogs", visibleTo: ['Admin'] },
      { label: "Payments", icon: "💳", href: "/adminPayments", visibleTo: ['Finance','Admin'] },
      { label: "Backup & Recovery", icon: "💾", href: "/adminBackup", visibleTo: ['IT','Admin'] },
    ],
  },
];

const settingsItems = [
  { label: "Settings", icon: "⚙️", href: "/adminSettings" },
  { label: "Main Page", icon: "⬅️", href: "/" },
];

export default function AdminNav({ sidebarOpen, setSidebarOpen }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await me();
        if (response.status === 200 && response.data.status === "success") {
          setUser(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarOpen]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const getInitials = () => {
    if (!user) return "AD";
    const firstInitial = user.first_name?.[0] || "";
    const lastInitial = user.last_name?.[0] || "";
    return `${firstInitial}${lastInitial}`.toUpperCase() || "AD";
  };

  const NavLink = ({ item }) => {
    const isActive = location.pathname === item.href;
    return (
      <Link
        to={item.href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-[13px] font-medium transition-all duration-150 no-underline group
          ${isActive
            ? "bg-[#155DFC] text-white font-semibold shadow-sm"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
      >
        <span className={`text-[15px] w-5 text-center flex-shrink-0 transition-transform duration-150 ${!isActive ? "group-hover:scale-110" : ""}`}>
          {item.icon}
        </span>
        <span className="truncate">{item.label}</span>
        {isActive && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70 flex-shrink-0" />
        )}
      </Link>
    );
  };

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Logo Area */}
      <div className="flex-shrink-0 px-4 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <img
            src="/src/assets/Logo — Jem 8 Circle Trading Co (1).png"
            alt="JEM 8 CIRCLE"
            className="object-contain w-auto h-12"
          />
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-center w-8 h-8 text-gray-500 transition-colors bg-transparent border-none rounded-lg cursor-pointer md:hidden hover:text-gray-700 hover:bg-gray-100"
            aria-label="Close sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="mt-3 text-[15px] font-bold text-gray-900 leading-tight">Admin Panel</div>
        <div className="text-[11px] text-gray-400 mt-0.5">Account Management System</div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 min-h-0 p-3 overflow-y-auto">
        {navGroups.map((group, groupIndex) => (
          <div key={group.group} className={groupIndex !== 0 ? "mt-3" : ""}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              {group.group}
            </p>
            {group.items
              .filter((item) => {
                // visibleTo === null -> visible to everyone
                if (!item.visibleTo) return true;
                // if user not loaded, default to hidden
                if (!user) return false;
                const dept = (user.department || user.dept || user.department_name || '').toString();
                const isAdmin = (user.is_admin || user.isAdmin || user.role === 'admin' || user.role === 'administrator');
                if (isAdmin) return true;
                return item.visibleTo.map((v) => v.toString().toLowerCase()).includes(dept.toLowerCase());
              })
              .map((item) => (<NavLink key={item.label} item={item} />))}
          </div>
        ))}

        {/* Divider */}
        <div className="h-px mx-3 my-3 bg-gray-100" />

        <div>
          <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Preferences
          </p>
          {settingsItems.map((item) => (
            <NavLink key={item.label} item={item} />
          ))}
        </div>
      </nav>

      {/* Profile */}
      <div className="flex-shrink-0 p-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
          {!loading && user?.profile_image ? (
            <img
              src={user.profile_image}
              alt="Profile"
              className="flex-shrink-0 object-cover rounded-full w-9 h-9 ring-2 ring-white"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2B7FFF] to-[#9810FA] flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0 ring-2 ring-white">
              {!loading && user ? getInitials() : "AD"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-gray-900 truncate">
              {!loading && user
                ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Admin User"
                : "Admin User"}
            </div>
            <div className="text-[11px] text-gray-400 truncate">
              {!loading && user ? user.email : "admin@company.com"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile sidebar */}
      <aside
        data-overlay
        className={`md:hidden fixed top-0 left-0 w-[260px] h-screen bg-white border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
        aria-label="Admin navigation"
      >
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        data-overlay
        className="hidden md:flex w-[242px] min-w-[242px] bg-white border-r border-gray-200 flex-col sticky top-0 h-screen"
        aria-label="Admin navigation"
      >
        {navContent}
      </aside>
    </>
  );
}