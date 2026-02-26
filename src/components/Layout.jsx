import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

// Keep the Logo import from your version
import Logo from '../assets/Logo — Jem 8 Circle Trading Co (1).png';

export function Header() {
  const location    = useLocation();
  const navigate    = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const { totalItems }              = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu whenever route changes
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  const NAV_LINKS = [
    { to: "/",           label: "Home"       },
    { to: "/products",   label: "Products"   },
    { to: "/categories", label: "Categories" },
    { to: "/blog",       label: "Blog"       },
    { to: "/about",      label: "About"      },
    { to: "/contact",    label: "Contact"    },
    { to: "/orders",     label: "My Orders"  },
  ];

  return (
    <>
      <header
        className="site-header"
        style={scrolled ? { boxShadow: "0 2px 24px rgba(0,0,0,0.10)" } : undefined}
      >
        <div className="container site-header__inner">

          {/* Logo */}
          <Link to="/" className="site-header__logo-wrap">
            <img
              src={Logo}
              alt="JEM 8 Circle Trading Co."
              className="site-header__logo-img"
              onError={(e) => {
                e.target.style.display = "none";
                if (e.target.nextSibling) e.target.nextSibling.style.display = "block";
              }}
            />
            <span className="site-header__logo-text" style={{ display: "none" }}>
              JEM 8 Circle
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="site-header__nav">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`site-header__nav-link${isActive(to) ? " active" : ""}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="site-header__actions">

            {/* Search */}
            <div className="site-header__search-wrap">
              <span className="site-header__search-icon">🔍</span>
              <input
                type="text"
                className="site-header__search-input"
                placeholder="Search products..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.target.value.trim()) {
                    window.location.href = `/products`;
                  }
                }}
              />
            </div>

            {/* Cart icon → cart page */}
            <Link
              to="/cart"
              className="site-header__cart-btn"
              aria-label="View cart"
              style={{ position: "relative" }}
            >
              🛒
              {totalItems > 0 && (
                <span style={{
                  position: "absolute", top: "-6px", right: "-6px",
                  background: "#ef4444", color: "#fff", borderRadius: "50%",
                  width: "18px", height: "18px", fontSize: "10px", fontWeight: "700",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-body)", lineHeight: 1,
                }}>
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </Link>

            {/* Contact button */}
            <Link to="/contact" className="site-header__login-btn">
              Contact Us
            </Link>

            {/* ── Profile Avatar Button ─────────────────────────────────── */}
            <button
              onClick={() => navigate("/Profilepersonal")}
              aria-label="My Profile"
              title="My Profile"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                backgroundColor: "#2e6b45",
                border: "2px solid #2e6b4530",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                flexShrink: 0,
                boxShadow: "0 2px 8px #2e6b4530",
                transition: "box-shadow 0.2s, transform 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 16px #2e6b4550";
                e.currentTarget.style.transform = "scale(1.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 8px #2e6b4530";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {/*
                Tip: swap the "J" with the first letter of the logged-in
                user's name. e.g. user?.name?.charAt(0).toUpperCase()
              */}
              <span style={{
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "'Poppins', Helvetica, sans-serif",
                userSelect: "none",
                lineHeight: 1,
              }}>
                J
              </span>
            </button>
            {/* ─────────────────────────────────────────────────────────── */}

            {/* Hamburger */}
            <button
              className="site-header__hamburger"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE MENU ── */}
      <div
        className={`mobile-menu${mobileOpen ? " open" : ""}`}
        onClick={(e) => { if (e.target === e.currentTarget) setMobileOpen(false); }}
      >
        <div className="mobile-menu__panel">
          <button
            className="mobile-menu__close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>

          <div className="mobile-menu__logo">JEM 8 Circle</div>

          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`mobile-menu__link${isActive(to) ? " active" : ""}`}
            >
              {label}
            </Link>
          ))}

          {/* Profile link in mobile menu */}
          <Link
            to="/profile"
            className={`mobile-menu__link${isActive("/profile") ? " active" : ""}`}
          >
            👤 My Profile
          </Link>

          <div className="mobile-menu__cta">
            <Link
              to="/contact"
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Get a Quote →
            </Link>
          </div>
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