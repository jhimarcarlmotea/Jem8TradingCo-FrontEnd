import React, { useState } from 'react';
import '../style/about.css';

const About = () => {
  const [stats] = useState({
    since: 2016,
    employees: '1–7',
    clients: 250
  });

  const [leaders] = useState([
    {
      id: 1,
      name: 'Ms. Shella R. Acibar',
      role: 'Co-Owner of Jem 8 Circle',
      image: '/img/Shella_Ricafrente-Acibar.png'
    },
    {
      id: 2,
      name: 'Ms. Jinkie Malinag',
      role: 'Co-Owner of Jem 8 Circle',
      image: '/img/Jinkie_Ricafrente-Malinag.png'
    },
    {
      id: 3,
      name: 'Ms. Akiko Serrano',
      role: 'Sales Executive of Jem 8 Circle',
      image: '/img/Akiko_Serrano.png'
    },
    {
      id: 4,
      name: 'Ms. Ruby Ann Castillo',
      role: 'Sales Executive of Jem 8 Circle',
      image: '/img/Ruby_Ann_Castillo.png'
    },
    {
      id: 5,
      name: 'Ms. Charisse Mae Decano',
      role: 'Admin/HR Representative of Jem 8 Circle',
      image: '/img/Charisse_Decano.png'
    },
    {
      id: 6,
      name: 'Mr. Adrian Mallanao',
      role: 'Laison Head Officer of Jem 8 Circle',
      image: '/img/Adrian_Mallanao.png'
    },
    {
      id: 7,
      name: 'Mr. Vhernaldo Ricafrente',
      role: 'Marketing/Admin Assistant of Jem 8 Circle',
      image: '/img/Vhernaldo_Ricafrente.png'
    },
    {
      id: 8,
      name: 'Mr. Mark Edward Malinag',
      role: 'Marketing/Admin Assistant of Jem 8 Circle',
      image: '/img/Mark_Edward_C_Malinag.png'
    },
    {
      id: 9,
      name: 'Mr. Daniel Kian Rodriguez Cadena',
      role: 'Business Associate of Jem 8 Circle',
      image: '/img/Daniel_Kian_Rodriguez_Cadena.png'
    },
    {
      id: 10,
      name: 'Ms. Kayla R. Bacsafra',
      role: 'Sales Executive of Jem 8 Circle (South Luzon Area)',
      image: '/img/Kayla_R_Bacsafra.png'
    },
    {
      id: 11,
      name: 'Ms. Cristina A. Saturnio',
      role: 'Accounting and Finance of Jem 8 Circle',
      image: '/img/Cristina_A_Saturnio.png'
    }
  ]);

  // Image error handler
  const handleImageError = (e) => {
    e.target.src = '/img/placeholder.png';
  };

  return (
    <div className="about">
      {/* ===== HEADER ===== */}
      <header className="header">
        <img 
          className="logo-jem-circle-2" 
          src="/img/Logo — Jem 8 Circle Trading Co (1).png" 
          alt="JEM 8 Circle Logo" 
        />
        <nav className="navigation">
          <a href="/">Home</a>
          <a href="/products">Products</a>
          <a href="/categories">Categories</a>
          <a href="/blog">Blog</a>
          <a href="/about" style={{fontWeight: 700, color: '#000'}}>About</a>
          <a href="/contact">Contact</a>
        </nav>
        <div className="btn-login">
          <div className="group-12">
            <a href="/login" className="text-wrapper-15">Login / Signup</a>
          </div>
        </div>
        <div className="container">
          <div className="search-input">
            <div className="search-input-2">
              <span className="text-wrapper-16">Search products...</span>
            </div>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="hero-section">
        <p className="txt-about">ABOUT JEM 8 CIRCLE TRADING CO.</p>
        <p className="txt-about-big">"Your trusted source for<br/>equipment and supplies."</p>
        <p className="txt-about-small">
          We connect trading companies with the industrial equipment and supplies
          they need to operate at peak efficiency reliably, seamlessly, at scale.
        </p>
        <div className="hero-divider"></div>
      </section>

      {/* ===== MISSION ===== */}
      <section className="mission-section">
        <div className="mission-left">
          <div className="txt-mission-2">OUR MISSION</div>
          <p className="txt-mission-tag-2">Advancing with heart, integrity, and smart systems.</p>
          <div className="since-badge">
            <div className="since-dot"></div>
            <span className="txt-mission-date">Since {stats.since}</span>
          </div>
        </div>
        <div className="mission-right">
          <p className="txt-mission-desc-2">
            We advance JEM 8 Circle with heart, integrity, and smart systems. Through ethical distribution,
            structured processes, and strong teamwork, we develop confident, knowledgeable, and responsible
            leaders, expand our global reach, and create sustainable growth for both our people and the organization.
          </p>
        </div>
      </section>

      <div className="mission-divider"></div>

      {/* ===== VISION ===== */}
      <section className="vision-section">
        <div className="vision-left">
          <div className="vision-circle-outer">
            <div className="vision-circle-mid">
              <div className="vision-circle-inner">
                <span className="OUR-VISION">OUR<br/>VISION</span>
              </div>
            </div>
          </div>
        </div>
        <div className="vision-right">
          <div className="txt-mission">OUR VISION</div>
          <p className="txt-mission-tag">Where wellness fuels opportunity and purpose drives action.</p>
          <p className="txt-mission-desc">
            To create a world where wellness fuels opportunity, leaders inspire growth, and a united team
            transforms lives through passion, integrity, and purpose-driven action.
          </p>
        </div>
      </section>

      <div className="mission-divider"></div>

      {/* ===== LEADERSHIP ===== */}
      <section className="leadership-section">
        <div className="leadership-header">
          <div className="txt-leadership">LEADERSHIP</div>
          <p className="txt-leadership-desc">The people behind JEM 8 Circle Trading Co</p>
        </div>
        <div id="leadership-root">
          <div className="leadership-grid">
            {leaders.map((leader) => (
              <div key={leader.id} className="leader-card">
                <div className="leader-photo-wrap">
                  <img 
                    src={leader.image} 
                    alt={leader.name}
                    className="leader-photo"
                    onError={handleImageError}
                  />
                </div>
                <div className="leader-name">{leader.name}</div>
                <div className="leader-role">{leader.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TRUSTED SUPPLY BANNER ===== */}
      <section className="trusted-section">
        <p className="txt-trusted-supply-2">
          <span className="span">Your Trusted<br/></span>
          <span className="text-wrapper-3">Supply Partner</span>
        </p>
        <p className="txt-trusted-supply">
          From small businesses to established companies, we empower organizations of all sizes with office supplies,
          pantry and janitorial essentials, and health and wellness products — delivered with quality at the best price.
        </p>
      </section>

      {/* ===== ABOUT DETAIL ===== */}
      <section className="about-detail-section">
        <div className="group-4">
          <div className="txt-about-jem">About JEM 8 Circle</div>

          <div className="about-row">
            <div className="about-row-label">Who<br/>We Are</div>
            <div className="about-row-content">
              <p className="about-row-title">Registered Business in Makati City</p>
              <p className="about-row-desc">
                JEM 8 Circle Trading Co. is a registered business situated at Unit 202P, Cityland 10 Tower 1,
                HV Dela Costa St., Salcedo Village, Makati City. Established on July 22, 2016, the company
                operates primarily in the wholesale and retail trade sector and employs between {stats.employees} staff members.
              </p>
            </div>
          </div>

          <div className="about-row">
            <div className="about-row-label">Our<br/>Reach</div>
            <div className="about-row-content">
              <p className="about-row-title">{stats.clients} Clients Across Metro Manila &amp; Laguna</p>
              <p className="about-row-desc">
                The company has accumulated {stats.clients} clients as of August 2025 across different
                cities in both Metro Manila and Laguna, steadily growing its presence in the wholesale and
                retail trade sector.
              </p>
            </div>
          </div>

          <div className="about-row">
            <div className="about-row-label">What<br/>We Do</div>
            <div className="about-row-content">
              <p className="about-row-title">Office, Pantry, Janitorial &amp; Wellness Products</p>
              <p className="about-row-desc">
                JEM 8 Circle Trading Co. specializes in supplying office supplies, pantry and janitorial
                supplies, and health and wellness products — and believes in
                "Supply products with quality in the best price."
              </p>
            </div>
          </div>

          <div className="about-row">
            <div className="about-row-label">Our<br/>Team</div>
            <div className="about-row-content">
              <p className="about-row-title">Professional Service Rooted in Honesty &amp; Integrity</p>
              <p className="about-row-desc">
                With a professional team dedicated to understanding and fulfilling client needs promptly and
                at competitive prices, JEM 8 Circle Trading Co. delivers reliable service rooted in honesty
                and integrity.
              </p>
            </div>
          </div>

          <div className="about-row">
            <div className="about-row-label">Why<br/>Choose Us</div>
            <div className="about-row-content">
              <p className="about-row-title">Direct Delivery. Lower Costs. Better Service.</p>
              <p className="about-row-desc">
                The company offers stock supplies for quick delivery, helping businesses save on transportation
                and manpower costs by delivering office supplies and promotional items directly to their offices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ENTERPRISE ===== */}
      <section className="enterprise-section">
        <div className="frame-3">
          <div className="enterprise-left">
            <div className="txt-enterprise">Enterprise</div>
            <p className="txt-enterprise-desc">
              We provide a complete range of office supplies, pantry and janitorial supplies, and health and
              wellness products tailored to your business needs. Delivering quality at the best price —
              directly to your office.
            </p>
            <div className="enterprise-features">
              <div className="enterprise-feature">✓ Reliable Supply</div>
              <div className="enterprise-feature">✓ Consistent Quality</div>
              <div className="enterprise-feature">✓ Timely Delivery</div>
            </div>
          </div>
          <div className="enterprise-right">
            <div className="enterprise-img-col">
              <img src="/img/download-2-3.png" alt="Product" />
            </div>
            <div className="enterprise-img-col">
              <img src="/img/download-1.png" alt="Product" />
            </div>
            <div className="enterprise-img-col">
              <img src="/img/download-1-2.png" alt="Product" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta-section">
        <p className="txt-get-started-desc">From our hands to your office.</p>
        <a href="/contact" className="btn-get-started-link">Get Started</a>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer-section">
        <div className="footer-top">
          <div className="footer-brand">
            <img className="logo-jem-circle" src="/img/logo-jem-8-circle-trading-co-1-2.png" alt="JEM 8 Circle" />
            <p className="company"># (02) 8805-1432 ; (02) 8785-0587<br/>Jem8 Circle Trading Co.</p>
          </div>

          <div className="footer-newsletter">
            <div className="newsletter-input-wrap">
              <input className="newsletter-input" type="email" placeholder="youremail@gmail.com" />
              <button className="newsletter-btn">Subscribe</button>
            </div>
            <p className="we-wont-spam-read">
              we won't spam, read our <span className="text-wrapper-10">email policy</span>
            </p>
            <div className="footer-socials">
              <img src="/img/facebook.png" alt="Facebook" />
              <img src="/img/instagram.png" alt="Instagram" />
              <img src="/img/tik-tok.png" alt="TikTok" />
              <img src="/img/snapchat.png" alt="Snapchat" />
            </div>
          </div>

          <div className="footer-links">
            <h4>Legal Pages</h4>
            <a href="#">Terms and conditions</a>
            <a href="#">Privacy</a>
            <a href="#">Cookies</a>
            <a href="#">Modern Slavery Statement</a>
          </div>

          <div className="footer-links">
            <h4>Important Links</h4>
            <a href="#">Get help</a>
            <a href="#">Sign up to deliver</a>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="all-rights">Jem8 &nbsp; {new Date().getFullYear()}, All Rights Reserved.</div>
          <div className="privacy-policy-terms">
            <span>Privacy Policy</span>
            <span>Terms</span>
            <span>Pricing</span>
            <span>Do not sell my personal information</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;