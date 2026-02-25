import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_LINKS = [
  { label: "Home",       to: "/" },
  { label: "Products",   to: "/products" },
  { label: "Categories", to: "/categories" },
  { label: "Blog",       to: "/blog" },
  { label: "About",      to: "/about" },
  { label: "Contact",    to: "/contact" },
];

const SOCIAL_ICONS = [
  { label: "Facebook",  icon: "f" },
  { label: "Instagram", icon: "📷" },
  { label: "TikTok",    icon: "♪" },
  { label: "Snapchat",  icon: "👻" },
];

const LEGAL_LINKS = ["Privacy Policy", "Terms", "Pricing", "Do not sell my personal info"];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <header className="site-header">
        <div className="container site-header__inner">
          <Link to="/" className="site-header__logo-wrap">
            <img
              src="/img/Logo — Jem 8 Circle Trading Co (1).png"
              alt="JEM 8 Circle"
              className="site-header__logo-img"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "block";
              }}
            />
            <span className="site-header__logo-text" style={{ display: "none" }}>JEM 8</span>
          </Link>

          <nav className="site-header__nav">
            {NAV_LINKS.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                className={`site-header__nav-link${location.pathname === to ? " active" : ""}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="site-header__actions">
            <div className="site-header__search-wrap">
              <span className="site-header__search-icon">🔍</span>
              <input className="site-header__search-input" type="text" placeholder="Search products..." />
            </div>
            <button className="site-header__cart-btn" aria-label="Cart">🛒</button>
            <Link to="/login" className="site-header__login-btn">Login / Signup</Link>
            <button className="site-header__hamburger" onClick={() => setMenuOpen(true)} aria-label="Menu">
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      <div className={`mobile-menu${menuOpen ? " open" : ""}`} onClick={() => setMenuOpen(false)}>
        <div className="mobile-menu__panel" onClick={(e) => e.stopPropagation()}>
          <button className="mobile-menu__close" onClick={() => setMenuOpen(false)}>✕</button>
          <div className="mobile-menu__logo">JEM 8 Circle</div>
          {NAV_LINKS.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className={`mobile-menu__link${location.pathname === to ? " active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="mobile-menu__cta">
            <Link to="/login" className="btn-primary" onClick={() => setMenuOpen(false)}
              style={{ display: "flex", justifyContent: "center" }}>
              Login / Signup
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) { alert(`Subscribed: ${email}`); setEmail(""); }
  };

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div>
            <img src="/img/logo-jem-8-circle-trading-co-1-2.png" alt="JEM 8"
              className="site-footer__brand-logo" onError={(e) => { e.target.style.display = "none"; }} />
            <p className="site-footer__brand-name">JEM 8 Circle Trading Co.</p>
            <p className="site-footer__brand-desc">Premium essentials, everyday must-haves, and exclusive finds — all in one place.</p>
            <p className="site-footer__contact">☎ (02) 8805-1432 · (02) 8785-0587<br />Jem8 Circle Trading Co.</p>
            <div className="site-footer__socials">
              {SOCIAL_ICONS.map((s) => (
                <button key={s.label} className="site-footer__social-btn" aria-label={s.label}>{s.icon}</button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="site-footer__col-title">Legal Pages</h4>
            <ul className="site-footer__col-links">
              {["Terms and Conditions", "Privacy Policy", "Cookies", "Modern Slavery Statement"].map((l) => (
                <li key={l}><a href="#">{l}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="site-footer__col-title">Important Links</h4>
            <ul className="site-footer__col-links">
              {["Get Help", "Sign Up to Deliver", "Careers", "Contact Us"].map((l) => (
                <li key={l}><a href="#">{l}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="site-footer__col-title">Stay Updated</h4>
            <p className="site-footer__newsletter-text">Get exclusive deals delivered to your inbox.</p>
            <form className="site-footer__subscribe-form" onSubmit={handleSubscribe}>
              <input className="site-footer__subscribe-input" type="email" placeholder="your@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
              <button type="submit" className="site-footer__subscribe-btn">Subscribe</button>
            </form>
            <p className="site-footer__no-spam">We won't spam. Read our <a href="#">email policy</a>.</p>
          </div>
        </div>

        <div className="site-footer__divider" />

        <div className="site-footer__bottom">
          <span className="site-footer__rights">© Jem8 Circle Trading Co. {new Date().getFullYear()}. All Rights Reserved.</span>
          <nav className="site-footer__legal-links">
            {LEGAL_LINKS.map((l) => (<a key={l} href="#">{l}</a>))}
          </nav>
        </div>
      </div>
    </footer>
  );
}