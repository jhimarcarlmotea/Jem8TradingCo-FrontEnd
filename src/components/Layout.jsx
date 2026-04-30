import { useState, useEffect, useRef, useCallback } from "react";
import NotificationsBell from './NotificationsBell';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import Logo from '../assets/Logo — Jem 8 Circle Trading Co (1).png';
import api from "../api/axios";

const BASE = "http://127.0.0.1:8000";

/* ══════════════════════════════════
   SEARCH DROPDOWN
══════════════════════════════════ */
function SearchDropdown({ query, products, onSelect, visible }) {
  if (!visible || !query.trim() || products.length === 0) return null;

  return (
    <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-[#e2e8f0] rounded-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.10)] overflow-hidden z-[2000]">
      {products.map((p) => {
        const name     = p.product_name ?? p.name ?? "";
        const priceRaw = parseFloat(p.price ?? 0);
        const price    = `₱${priceRaw.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
        const productId = p.id ?? p.product_id;
        const rawImg   = p.images?.[0]?.image_path;
        const imgSrc   = rawImg ? `${BASE}/storage/${rawImg}` : null;

        // Highlight matching query inside name
        const q   = query.trim().toLowerCase();
        const idx = name.toLowerCase().indexOf(q);
        const highlighted =
          idx === -1 ? (
            name
          ) : (
            <>
              {name.slice(0, idx)}
              <strong className="text-[#2e6b45]">{name.slice(idx, idx + q.length)}</strong>
              {name.slice(idx + q.length)}
            </>
          );

        return (
          <button
            key={productId}
            onMouseDown={() => onSelect(productId)}
            className="w-full flex items-center gap-[10px] px-[14px] py-[10px] text-left bg-transparent border-none cursor-pointer hover:bg-[#e8f5ed] transition-colors border-b border-[#f1f5f9] last:border-b-0"
          >
            {/* Thumbnail */}
            <div className="w-[36px] h-[36px] rounded-[8px] bg-[#f1f5f9] flex-shrink-0 overflow-hidden">
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={name}
                  className="object-cover w-full h-full"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[16px]">📦</div>
              )}
            </div>

            {/* Name + price */}
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[13px] text-[#1e293b] font-medium leading-[1.3] truncate">
                {highlighted}
              </span>
              <span className="text-[11px] text-[#2e6b45] font-semibold mt-[2px]">{price}</span>
            </div>

            {/* Arrow */}
            <span className="text-[#b0c4bb] text-[12px] flex-shrink-0">›</span>
          </button>
        );
      })}

      {/* "View all results" footer */}
      <button
        onMouseDown={() => onSelect(null, query)}
        className="w-full px-[14px] py-[10px] text-[12px] text-[#64748b] font-medium text-center bg-[#f8fafc] border-none cursor-pointer hover:bg-[#e8f5ed] hover:text-[#2e6b45] transition-colors"
      >
        View all results for &ldquo;<strong>{query}</strong>&rdquo; →
      </button>
    </div>
  );
}

/* ══════════════════════════════════
   HEADER
══════════════════════════════════ */
export function Header() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [scrolled, setScrolled]         = useState(false);
  const { totalItems }                  = useCart();
  const [isLog, setIsLog]               = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [userRole, setUserRole]         = useState(null);
  const [userData, setUserData]         = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef                     = useRef(null);

  // ── Search state ──
  const [searchQuery, setSearchQuery]         = useState("");
  const [allProducts, setAllProducts]         = useState([]);
  const [searchResults, setSearchResults]     = useState([]);
  const [searchVisible, setSearchVisible]     = useState(false);
  const searchRef                             = useRef(null);
  const debounceRef                           = useRef(null);

  // Fetch all products once for search suggestions
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res  = await api.get("/admin/products");
        const data = res.data?.data ?? res.data?.products ?? res.data;
        setAllProducts(Array.isArray(data) ? data : []);
      } catch {
        // silently fail — search just won't suggest
      }
    };
    fetchProducts();
  }, []);

  // Debounced filter on query change
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchVisible(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      const q       = searchQuery.trim().toLowerCase();
      const matches = allProducts
        .filter(p => (p.product_name ?? p.name ?? "").toLowerCase().includes(q))
        .slice(0, 6);
      setSearchResults(matches);
      setSearchVisible(true);
    }, 180);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, allProducts]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchVisible(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearchSelect = (productId, fallbackQuery) => {
    setSearchVisible(false);
    setSearchQuery("");
    if (productId) {
      navigate(`/products/${productId}`);
    } else {
      navigate(`/products?q=${encodeURIComponent(fallbackQuery ?? searchQuery)}`);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      setSearchVisible(false);
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
    if (e.key === "Escape") {
      setSearchVisible(false);
    }
  };

  // ── Scroll / auth effects (unchanged) ──
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { setDropdownOpen(false); }, [location.pathname]);

  const checkLogin = async () => {
    try {
      // const token = localStorage.getItem("token");
      // if (!token) { setIsLog(false); setLoading(false); return; }
      const res      = await api.get("/me");
      console.log(res)
      const userData = res.data?.data ?? res.data;
      setIsLog(true);
      setProfileImage(userData?.profile_image ?? null);
      setUserRole(userData?.role ?? null);
      setUserData(userData ?? null);
    } catch {
      setIsLog(false);
      setProfileImage(null);
      setUserRole(null);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkLogin();
    const handleLogout      = () => { setIsLog(false); setProfileImage(null); setUserRole(null); };
    const handleLogin       = () => checkLogin();
    const handlePhotoUpdate = (e) => setProfileImage(e.detail.url);
    window.addEventListener("auth-logout",           handleLogout);
    window.addEventListener("auth-login",            handleLogin);
    window.addEventListener("profile-photo-updated", handlePhotoUpdate);
    return () => {
      window.removeEventListener("auth-logout",           handleLogout);
      window.removeEventListener("auth-login",            handleLogin);
      window.removeEventListener("profile-photo-updated", handlePhotoUpdate);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isActive = (path) => location.pathname === path;
  const isAdmin  = userRole === "admin" || userRole === "administrator" || userRole === "Admin";

  const handleLogout = () => {
    setDropdownOpen(false);
    localStorage.removeItem("token");
    sessionStorage.clear();
    setIsLog(false);
    setProfileImage(null);
    setUserRole(null);
    setUserData(null);
    window.dispatchEvent(new Event("auth-logout"));
    navigate("/login");
  };

  const handleViewProfile = () => {
    setDropdownOpen(false);
    navigate("/Profilepersonal");
  };

  const NAV_LINKS = [
    { to: "/",         label: "Home"      },
    { to: "/products", label: "Products"  },
    { to: "/blog",     label: "Blog"      },
    { to: "/about",    label: "About"     },
    { to: "/contact",  label: "Contact"   },
    { to: "/orders",   label: "My Orders" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[1000] bg-white border-b border-[#e8ede9] transition-shadow duration-300 ${
          scrolled ? "shadow-[0_2px_24px_rgba(0,0,0,0.10)]" : "shadow-none"
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-5 h-[68px] flex items-center gap-5">

          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0 no-underline">
            <img
              src={Logo}
              alt="JEM 8 Circle Trading Co."
              className="h-[52px] w-auto object-contain"
              onError={(e) => {
                e.target.style.display = "none";
                if (e.target.nextSibling) e.target.nextSibling.style.display = "block";
              }}
            />
            <span className="hidden font-bold text-[18px] text-[#2e6b45]">JEM 8 Circle</span>
          </Link>

          {/* Desktop nav */}
          <nav className="items-center hidden gap-1 ml-auto md:flex">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-3 py-1.5 rounded-lg no-underline text-sm transition-all duration-150
                  ${isActive(to)
                    ? "font-bold text-[#2e6b45] bg-[#e8f5ed]"
                    : "font-medium text-gray-700 hover:bg-[#e8f5ed] hover:text-[#2e6b45]"
                  }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center flex-shrink-0 gap-2 ml-auto md:ml-0">

            {/* ── Search with live suggestions (desktop only) ── */}
            <div
              ref={searchRef}
              className="relative hidden md:flex items-center bg-gray-100 rounded-full px-3 gap-1.5 h-9"
            >
              <span className="text-sm pointer-events-none">🔍</span>
              <input
                type="text"
                className="border-none bg-transparent outline-none text-[13px] w-[140px] text-gray-700 placeholder-gray-400"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchResults.length) setSearchVisible(true); }}
                onKeyDown={handleSearchKeyDown}
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); setSearchVisible(false); }}
                  className="bg-transparent border-none cursor-pointer text-gray-400 text-[12px] px-1 hover:text-gray-600"
                >
                  ✕
                </button>
              )}

              {/* Suggestion dropdown */}
              <SearchDropdown
                query={searchQuery}
                products={searchResults}
                onSelect={handleSearchSelect}
                visible={searchVisible}
              />
            </div>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative bg-transparent border-none cursor-pointer text-xl p-1.5 rounded-lg flex items-center justify-center no-underline text-inherit hover:bg-gray-100 transition-colors"
              aria-label="View cart"
            >
              🛒
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-[18px] h-[18px] text-[10px] font-bold flex items-center justify-center leading-none">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </Link>

            {/* Admin icon (desktop only) */}
            {isLog && isAdmin && (
              <Link
                to="/adminDashboard"
                className="hidden md:flex relative bg-transparent border-none cursor-pointer text-xl p-1.5 rounded-lg items-center justify-center no-underline text-inherit hover:bg-gray-100 transition-colors"
                aria-label="Admin"
                title="Admin"
              >
                🛠️
              </Link>
            )}

            {/* Contact (desktop only) */}
            <Link
              to="/contact"
              className="hidden md:inline-block px-4 py-[7px] border-[1.5px] border-[#2e6b45] rounded-full text-[#2e6b45] font-semibold text-[13px] no-underline whitespace-nowrap hover:bg-[#e8f5ed] transition-colors"
            >
              Contact Us
            </Link>

            {/* Notifications Bell */}
            <div className="hidden md:flex items-center mr-2">
              <NotificationsBell user={userData} token={localStorage.getItem('token')} />
            </div>

            {/* Login / Avatar with Dropdown */}
            {!isLog ? (
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-[7px] rounded-full bg-[#2e6b45] text-white border-none cursor-pointer font-semibold text-[13px] whitespace-nowrap hover:bg-[#245537] transition-colors"
              >
                Login
              </button>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  aria-label="My Profile"
                  title="My Profile"
                  className={`w-9 h-9 rounded-full bg-[#2e6b45] border-2 cursor-pointer flex items-center justify-center p-0 flex-shrink-0 text-white font-bold text-sm overflow-hidden transition-all duration-150
                    ${dropdownOpen
                      ? "border-[#2e6b45] shadow-[0_0_0_3px_rgba(46,107,69,0.2)]"
                      : "border-[#2e6b4530] shadow-[0_2px_8px_#2e6b4530] hover:opacity-90"
                    }`}
                >
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="object-cover w-full h-full rounded-full" />
                  ) : (
                    "J"
                  )}
                </button>

                {dropdownOpen && (
                  <div data-overlay className="absolute right-0 top-[calc(100%+8px)] w-[170px] bg-white border border-gray-200 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-hidden z-[1100]">
                    <div className="absolute -top-[6px] right-[10px] w-3 h-3 bg-white border-l border-t border-gray-200 rotate-45" />
                    <button
                      onClick={handleViewProfile}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-gray-700 font-medium hover:bg-[#e8f5ed] hover:text-[#2e6b45] transition-colors duration-150 text-left bg-transparent border-none cursor-pointer"
                    >
                      <span className="text-base">👤</span>
                      View Profile
                    </button>
                    <div className="h-px mx-3 bg-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-red-500 font-medium hover:bg-red-50 transition-colors duration-150 text-left bg-transparent border-none cursor-pointer"
                    >
                      <span className="text-base">🚪</span>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Hamburger (mobile only) */}
            <button
              className="md:hidden flex flex-col justify-center gap-[5px] bg-transparent border-none cursor-pointer p-2 rounded-lg z-[1100] flex-shrink-0"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <span className="block w-6 h-[2.5px] bg-[#2e6b45] rounded-sm" />
              <span className="block w-6 h-[2.5px] bg-[#2e6b45] rounded-sm" />
              <span className="block w-6 h-[2.5px] bg-[#2e6b45] rounded-sm" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-[9998] bg-black/45 transition-opacity duration-250 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-in panel */}
      <div
        data-overlay
        className={`fixed top-0 right-0 bottom-0 w-[78%] max-w-[320px] bg-white z-[9999] overflow-y-auto flex flex-col px-5 pt-6 pb-8 shadow-[-4px_0_32px_rgba(0,0,0,0.12)] transition-transform duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <button
          className="self-end bg-transparent border-none text-[22px] cursor-pointer text-gray-500 p-1 leading-none mb-3 hover:text-gray-800 transition-colors"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          ✕
        </button>

        <div className="font-extrabold text-xl text-[#2e6b45] mb-6 pb-4 border-b border-[#e8ede9]">
          JEM 8 Circle
        </div>

        {/* Mobile search bar */}
        <div className="flex items-center bg-gray-100 rounded-full px-3 gap-1.5 h-9 mb-4">
          <span className="text-sm">🔍</span>
          <input
            type="text"
            className="border-none bg-transparent outline-none text-[13px] flex-1 text-gray-700 placeholder-gray-400"
            placeholder="Search products..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target.value.trim()) {
                navigate(`/products?q=${encodeURIComponent(e.target.value.trim())}`);
                setMobileOpen(false);
              }
            }}
          />
        </div>

        {NAV_LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`block px-4 py-3 rounded-xl no-underline text-[15px] mb-0.5 transition-colors ${
              isActive(to)
                ? "font-bold text-[#2e6b45] bg-[#e8f5ed]"
                : "font-medium text-gray-700 hover:bg-[#e8f5ed] hover:text-[#2e6b45]"
            }`}
          >
            {label}
          </Link>
        ))}

        <Link
          to="/Profilepersonal"
          className={`block px-4 py-3 rounded-xl no-underline text-[15px] mb-0.5 transition-colors ${
            isActive("/Profilepersonal")
              ? "font-bold text-[#2e6b45] bg-[#e8f5ed]"
              : "font-medium text-gray-700 hover:bg-[#e8f5ed] hover:text-[#2e6b45]"
          }`}
        >
          👤 My Profile
        </Link>

        {isLog && isAdmin && (
          <Link
            to="/adminDashboard"
            className={`block px-4 py-3 rounded-xl no-underline text-[15px] mb-0.5 transition-colors ${
              isActive("/adminDashboard")
                ? "font-bold text-[#2e6b45] bg-[#e8f5ed]"
                : "font-medium text-gray-700 hover:bg-[#e8f5ed] hover:text-[#2e6b45]"
            }`}
          >
            🛠️ Admin Dashboard
          </Link>
        )}

        {isLog && (
          <>
            <div className="h-px my-2 bg-gray-100" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-[15px] text-red-500 font-medium hover:bg-red-50 transition-colors text-left bg-transparent border-none cursor-pointer"
            >
              🚪 Logout
            </button>
          </>
        )}

        <div className="pt-6 mt-auto">
          <Link
            to="/contact"
            className="flex items-center justify-center px-5 py-3 bg-[#2e6b45] text-white rounded-xl font-bold text-[15px] no-underline hover:bg-[#245537] transition-colors"
          >
            Get a Quote →
          </Link>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════
   FOOTER
══════════════════════════════════ */
export function Footer() {
  const [email, setEmail]     = useState("");
  const [status, setStatus]   = useState("idle"); // idle | loading | success | exists | error
  const [message, setMessage] = useState("");

  const handleSubscribe = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");

    try {
      const res = await api.post("/newsletter/subscribe", { email: email.trim() });

      if (res.status === 201) {
        setStatus("success");
        setMessage(res.data.message);
        setEmail("");
      } else if (res.status === 200) {
        setStatus("exists");
        setMessage(res.data.message);
        setEmail("");
      }
    } catch (err) {
      const msg = err.response?.data?.message ?? "Something went wrong. Please try again.";
      setStatus("error");
      setMessage(msg);
    }
  };  
  const QUICK_LINKS = [
    { to: "/",         label: "Home"     },
    { to: "/products", label: "Products" },
    { to: "/about",    label: "About Us" },
    { to: "/contact",  label: "Contact"  },
  ];

  const PRODUCT_LINKS = [
    { to: "/products?category=office",   label: "Office Supplies, Stationery & Equipment" },
    { to: "/products?category=pantry",   label: "Pantry Supplies"              },
    { to: "/products?category=janitor",  label: "Janitorial Supplies"          },
    { to: "/products?category=wellness", label: "Health & Wellness"            },
    { to: "/products?category=giveaway", label: "Giveaways & Merch"            },
    { to: "/products?category=personal", label: "Personal & Home Care Products"},
  ];

  return (
    <footer className="bg-[#f5f3ef] text-[#4a4a4a]">
      <div className="max-w-[1280px] mx-auto px-5 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">

          {/* Brand col */}
          <div>
            <img
              src={Logo}
              alt="JEM 8 Circle Trading Co."
              className="object-contain w-auto mb-3 h-14"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <span className="block font-bold text-lg text-[#1e3d2b] mb-3">
              JEM 8 Circle Trading Co.
            </span>
            <p className="text-[13px] leading-relaxed text-[#6b6b6b] mb-4">
              Supply products with quality at the best price. Your trusted one-stop supplier
              for office, pantry, janitorial, and wellness needs across Metro Manila and Laguna.
            </p>
            <div className="text-[12px] leading-relaxed text-[#6b6b6b] mb-5">
              📍 Unit 202P, Cityland 10 Tower 1, HV Dela Costa St., Makati City<br />
              📞 (02) 8805-1432 · (02) 8785-0587<br />
              📧 jem8circletrading@gmail.com
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div className="font-bold text-[#1e3d2b] text-sm uppercase tracking-wider mb-4">
              Quick Links
            </div>
            <ul className="p-0 m-0 space-y-2 list-none">
              {QUICK_LINKS.map(({ to, label }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-[13px] text-[#6b6b6b] no-underline hover:text-[#2e6b45] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <div className="font-bold text-[#1e3d2b] text-sm uppercase tracking-wider mb-4">
              Our Products
            </div>
            <ul className="p-0 m-0 space-y-2 list-none">
              {PRODUCT_LINKS.map(({ to, label }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-[13px] text-[#6b6b6b] no-underline hover:text-[#2e6b45] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter removed */}

        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#d6d0c8]" />

      {/* Bottom bar */}
      <div className="max-w-[1280px] mx-auto px-5 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
        <p className="text-[12px] text-[#9e9890] m-0">
          © 2026 JEM 8 Circle Trading Co. All rights reserved.
        </p>
        <div className="flex gap-5">
          {[
            { label: "Privacy Policy",     to: "/Privacypolicy" },
            { label: "Terms & Conditions", to: "/Privacypolicy?tab=terms" },
            { label: "Cookie Policy",      to: "/Privacypolicy?tab=cookies" },
            { label: "Email Policy", to: "/Privacypolicy?tab=email" },
          ].map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              className="text-[12px] text-[#9e9890] no-underline hover:text-[#2e6b45] transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}