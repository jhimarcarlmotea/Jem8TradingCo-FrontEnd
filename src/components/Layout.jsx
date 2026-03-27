import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import Logo from '../assets/Logo — Jem 8 Circle Trading Co (1).png';
import axios from "axios";

/* ══════════════════════════════════
   HEADER
══════════════════════════════════ */
export function Header() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const { totalItems }              = useCart();
  const [isLog, setIsLog]           = useState(false);
  const [profileImage, setProfileImage] = useState(null); 

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

    useEffect(() => {
    const handler = (e) => setProfileImage(e.detail.url);
    window.addEventListener("profile-photo-updated", handler);
    return () => window.removeEventListener("profile-photo-updated", handler);
  }, []);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/me", { withCredentials: true });
        setIsLog(res.data);
        // Pull the image from the same response
        setProfileImage(res.data?.profile_image ?? res.data?.data?.profile_image ?? null);
      } catch {
        setIsLog(false);
      }
    };
    checkLogin();
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  const NAV_LINKS = [
    { to: "/",         label: "Home"      },
    { to: "/products", label: "Products"  },
    { to: "/blog",     label: "Blog"      },
    { to: "/about",    label: "About"     },
    { to: "/contact",  label: "Contact"   },
    { to: "/orders",   label: "My Orders" },
  ];

  /* ── inline styles (no external CSS dependency for critical parts) ── */
  const S = {
    header: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: "#fff",
      borderBottom: "1px solid #e8ede9",
      transition: "box-shadow .25s",
      boxShadow: scrolled ? "0 2px 24px rgba(0,0,0,0.10)" : "none",
    },
    inner: {
      maxWidth: 1280,
      margin: "0 auto",
      padding: "0 20px",
      height: 68,
      display: "flex",
      alignItems: "center",
      gap: 20,
    },
    logoWrap: {
      display: "flex",
      alignItems: "center",
      flexShrink: 0,
      textDecoration: "none",
    },
    logoImg: {
      height: 52,
      width: "auto",
      objectFit: "contain",
    },
    logoText: {
      fontWeight: 700,
      fontSize: 18,
      color: "#2e6b45",
    },
    desktopNav: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      marginLeft: "auto",
    },
    navLink: (active) => ({
      padding: "6px 12px",
      borderRadius: 8,
      textDecoration: "none",
      fontSize: 14,
      fontWeight: active ? 700 : 500,
      color: active ? "#2e6b45" : "#374151",
      background: active ? "#e8f5ed" : "transparent",
      transition: "background .18s, color .18s",
    }),
    actions: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexShrink: 0,
    },
    searchWrap: {
      display: "flex",
      alignItems: "center",
      background: "#f3f4f6",
      borderRadius: 24,
      padding: "0 12px",
      gap: 6,
      height: 36,
    },
    searchInput: {
      border: "none",
      background: "transparent",
      outline: "none",
      fontSize: 13,
      width: 140,
      color: "#374151",
    },
    iconBtn: {
      position: "relative",
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: 20,
      padding: "6px",
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textDecoration: "none",
      color: "inherit",
    },
    badge: {
      position: "absolute",
      top: -4,
      right: -4,
      background: "#ef4444",
      color: "#fff",
      borderRadius: "50%",
      width: 18,
      height: 18,
      fontSize: 10,
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 1,
    },
    contactBtn: {
      padding: "7px 16px",
      border: "1.5px solid #2e6b45",
      borderRadius: 24,
      color: "#2e6b45",
      fontWeight: 600,
      fontSize: 13,
      textDecoration: "none",
      whiteSpace: "nowrap",
    },
    loginBtn: {
      padding: "7px 16px",
      borderRadius: 24,
      background: "#2e6b45",
      color: "#fff",
      border: "none",
      cursor: "pointer",
      fontWeight: 600,
      fontSize: 13,
      whiteSpace: "nowrap",
    },
    avatarBtn: {
      width: 36,
      height: 36,
      borderRadius: "50%",
      background: "#2e6b45",
      border: "2px solid #2e6b4530",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 0,
      flexShrink: 0,
      boxShadow: "0 2px 8px #2e6b4530",
      color: "#fff",
      fontWeight: 700,
      fontSize: 14,
    },
    // ── Hamburger ──────────────────────────────────────────────────────
    hamburger: {
      display: "none",          // shown via media query in <style> tag below
      flexDirection: "column",
      justifyContent: "center",
      gap: 5,
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "8px",
      borderRadius: 8,
      zIndex: 1100,
      flexShrink: 0,
    },
    hamburgerBar: {
      display: "block",
      width: 24,
      height: 2.5,
      background: "#2e6b45",
      borderRadius: 2,
      transition: "transform .25s, opacity .25s",
    },
    // ── Mobile overlay ─────────────────────────────────────────────────
    overlay: {
      position: "fixed",
      inset: 0,
      zIndex: 9998,
      background: "rgba(0,0,0,0.45)",
      opacity: mobileOpen ? 1 : 0,
      pointerEvents: mobileOpen ? "auto" : "none",
      transition: "opacity .25s",
    },
    panel: {
      position: "fixed",
      top: 0,
      right: 0,
      bottom: 0,
      width: "78%",
      maxWidth: 320,
      background: "#fff",
      zIndex: 9999,
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      padding: "24px 20px 32px",
      transform: mobileOpen ? "translateX(0)" : "translateX(100%)",
      transition: "transform .28s cubic-bezier(.4,0,.2,1)",
      boxShadow: "-4px 0 32px rgba(0,0,0,.12)",
    },
    panelClose: {
      alignSelf: "flex-end",
      background: "none",
      border: "none",
      fontSize: 22,
      cursor: "pointer",
      color: "#6b7280",
      padding: 4,
      lineHeight: 1,
      marginBottom: 12,
    },
    panelLogo: {
      fontWeight: 800,
      fontSize: 20,
      color: "#2e6b45",
      marginBottom: 24,
      paddingBottom: 16,
      borderBottom: "1px solid #e8ede9",
    },
    panelLink: (active) => ({
      display: "block",
      padding: "12px 16px",
      borderRadius: 10,
      textDecoration: "none",
      fontSize: 15,
      fontWeight: active ? 700 : 500,
      color: active ? "#2e6b45" : "#374151",
      background: active ? "#e8f5ed" : "transparent",
      marginBottom: 2,
      transition: "background .15s",
    }),
    panelCta: {
      marginTop: "auto",
      paddingTop: 24,
    },
    ctaLink: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "12px 20px",
      background: "#2e6b45",
      color: "#fff",
      borderRadius: 12,
      fontWeight: 700,
      fontSize: 15,
      textDecoration: "none",
    },
  };

  return (
    <>
      {/* Inject media-query CSS so hamburger shows on mobile */}
      <style>{`
        @media (max-width: 768px) {
          .jem-hamburger   { display: flex !important; }
          .jem-desktop-nav { display: none !important; }
          .jem-search-wrap { display: none !important; }
          .jem-contact-btn { display: none !important; }
        }
        .jem-nav-link:hover {
          background: #e8f5ed !important;
          color: #2e6b45 !important;
        }
        .jem-icon-btn:hover { background: #f3f4f6 !important; }
      `}</style>

      <header style={S.header}>
        <div style={S.inner}>

          {/* Logo */}
          <Link to="/" style={S.logoWrap}>
            <img
              src={Logo}
              alt="JEM 8 Circle Trading Co."
              style={S.logoImg}
              onError={(e) => {
                e.target.style.display = "none";
                if (e.target.nextSibling) e.target.nextSibling.style.display = "block";
              }}
            />
            <span style={{ ...S.logoText, display: "none" }}>JEM 8 Circle</span>
          </Link>

          {/* Desktop nav */}
          <nav className="jem-desktop-nav" style={S.desktopNav}>
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="jem-nav-link"
                style={S.navLink(isActive(to))}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div style={{ ...S.actions, marginLeft: "auto" }}>

            {/* Search (desktop only) */}
            <div className="jem-search-wrap" style={S.searchWrap}>
              <span style={{ fontSize: 14 }}>🔍</span>
              <input
                type="text"
                style={S.searchInput}
                placeholder="Search products..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.target.value.trim()) {
                    window.location.href = "/products";
                  }
                }}
              />
            </div>

            {/* Cart */}
            <Link to="/cart" style={S.iconBtn} className="jem-icon-btn" aria-label="View cart">
              🛒
              {totalItems > 0 && (
                <span style={S.badge}>{totalItems > 9 ? "9+" : totalItems}</span>
              )}
            </Link>

            {/* Admin */}
            <Link to="/adminDashboard" style={S.iconBtn} className="jem-icon-btn" aria-label="Admin" title="Admin">
              🛠️
            </Link>

            {/* Contact (desktop only) */}
            <Link to="/contact" className="jem-contact-btn" style={S.contactBtn}>
              Contact Us
            </Link>

            {/* Login / Avatar */}
            {!isLog ? (
              <button style={S.loginBtn} onClick={() => navigate("/login")}>
                Login
              </button>
                ) : (
              <button
                style={S.avatarBtn}
                onClick={() => navigate("/Profilepersonal")}
                aria-label="My Profile"
                title="My Profile"
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  "J"
                )}
              </button>
            )}

            {/* ── Hamburger (mobile only, shown via CSS) ── */}
            <button
              className="jem-hamburger"
              style={S.hamburger}
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <span style={S.hamburgerBar} />
              <span style={S.hamburgerBar} />
              <span style={S.hamburgerBar} />
            </button>
          </div>
        </div>
      </header>


      {/* ── MOBILE MENU ── */}
      {/* Overlay backdrop */}
      <div style={S.overlay} onClick={() => setMobileOpen(false)} aria-hidden="true" />

      {/* Slide-in panel */}
      <div style={S.panel} role="dialog" aria-modal="true" aria-label="Navigation menu">
        <button style={S.panelClose} onClick={() => setMobileOpen(false)} aria-label="Close menu">
          ✕
        </button>

        <div style={S.panelLogo}>JEM 8 Circle</div>

        {NAV_LINKS.map(({ to, label }) => (
          <Link key={to} to={to} style={S.panelLink(isActive(to))}>
            {label}
          </Link>
        ))}

        <Link to="/Profilepersonal" style={S.panelLink(isActive("/Profilepersonal"))}>
          👤 My Profile
        </Link>

        <div style={S.panelCta}>
          <Link to="/contact" style={S.ctaLink}>
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
  const QUICK_LINKS = [
    { to: "/",         label: "Home"     },
    { to: "/products", label: "Products" },
    { to: "/about",    label: "About Us" },
    { to: "/contact",  label: "Contact"  },
  ];

  const PRODUCT_LINKS = [
    { to: "/products", label: "Office Supplies"     },
    { to: "/products", label: "Pantry Supplies"     },
    { to: "/products", label: "Janitorial Supplies" },
    { to: "/products", label: "Health & Wellness"   },
    { to: "/products", label: "Giveaways & Merch"   },
    { to: "/products", label: "Personal Care"       },
  ];

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">

          {/* Brand col */}
          <div>
            <img
              src={Logo}
              alt="JEM 8 Circle Trading Co."
              className="site-footer__brand-logo"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <span className="site-footer__brand-name">JEM 8 Circle Trading Co.</span>
            <p className="site-footer__brand-desc">
              Supply products with quality at the best price. Your trusted one-stop supplier
              for office, pantry, janitorial, and wellness needs across Metro Manila and Laguna.
            </p>
            <div className="site-footer__contact">
              📍 Unit 202P, Cityland 10 Tower 1, HV Dela Costa St., Makati City<br />
              📞 (02) 8805-1432 · (02) 8785-0587<br />
              📧 jem8circletrading@gmail.com
            </div>
            <div className="site-footer__socials">
              {["📘", "📸", "🎵", "💬"].map((icon, i) => (
                <button key={i} className="site-footer__social-btn" aria-label="Social media">
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div className="site-footer__col-title">Quick Links</div>
            <ul className="site-footer__col-links">
              {QUICK_LINKS.map(({ to, label }) => (
                <li key={label}><Link to={to}>{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <div className="site-footer__col-title">Our Products</div>
            <ul className="site-footer__col-links">
              {PRODUCT_LINKS.map(({ to, label }) => (
                <li key={label}><Link to={to}>{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <div className="site-footer__col-title">Stay Updated</div>
            <p className="site-footer__newsletter-text">
              Get the latest product updates, promotions, and supply tips delivered to your inbox.
            </p>
            <div className="site-footer__subscribe-form">
              <input
                type="email"
                className="site-footer__subscribe-input"
                placeholder="your@email.com"
              />
              <button className="site-footer__subscribe-btn">Subscribe</button>
            </div>
            <p className="site-footer__no-spam">
              We won't spam. Read our <Link to="/contact">email policy</Link>.
            </p>
          </div>

        </div>
      </div>

      <div className="site-footer__divider" />

      <div className="container">
        <div className="site-footer__bottom">
          <p className="site-footer__rights">
            © 2026 JEM 8 Circle Trading Co. All rights reserved.
          </p>
          <div className="site-footer__legal-links">
            <Link to="/contact">Privacy Policy</Link>
            <Link to="/contact">Terms &amp; Conditions</Link>
            <Link to="/contact">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}