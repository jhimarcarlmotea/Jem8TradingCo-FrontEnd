import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../style/about.css';
import '../style/global.css';

const BASE = 'http://127.0.0.1:8000';

const getInitials = (name) =>
  name.replace(/^(Ms\.|Mr\.)\s+/, '').split(' ').slice(0, 2).map((n) => n[0]).join('');

const resolveImg = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${BASE}/storage/${path}`;
};

const About = () => {
  const [stats] = useState({ since: 2016, employees: '1–7', clients: 250 });

  // ── Leadership from API ──
  const [leaders, setLeaders]         = useState([]);
  const [leadersLoading, setLeadersLoading] = useState(true);
  const [leadersError, setLeadersError]     = useState(false);

  useEffect(() => {
    axios
      .get(`${BASE}/api/leadership`, {
        withCredentials: true,
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      })
      .then((res) => {
        const data = res.data?.data ?? res.data;
        // Only show members with status = 1 (visible)
        const visible = Array.isArray(data)
          ? data.filter((m) => m.status == 1 || m.status === true)
          : [];
        setLeaders(visible);
      })
      .catch((err) => {
        console.error('Failed to load leadership:', err);
        setLeadersError(true);
      })
      .finally(() => setLeadersLoading(false));
  }, []);

  return (
    <div className="about-page">

      {/* ===== HERO ===== */}
      <section className="about-hero">
        <div className="container">
          <div className="about-hero__inner">
            <div className="about-hero__label">
              <span className="about-hero__label-dot"></span>
              About Jem 8 Circle Trading Co.
            </div>
            <h1 className="about-hero__title">
              "Your trusted source for<br /><em>equipment and supplies.</em>"
            </h1>
            <p className="about-hero__subtitle">
              We connect trading companies with the industrial equipment and supplies
              they need to operate at peak efficiency — reliably, seamlessly, at scale.
            </p>
            <div className="about-hero__stats">
              <div className="about-hero__stat">
                <span className="about-hero__stat-num">{stats.since}</span>
                <span className="about-hero__stat-label">Est. Year</span>
              </div>
              <div className="about-hero__stat">
                <span className="about-hero__stat-num">{stats.employees}</span>
                <span className="about-hero__stat-label">Employees</span>
              </div>
              <div className="about-hero__stat">
                <span className="about-hero__stat-num">{stats.clients}+</span>
                <span className="about-hero__stat-label">Clients</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== MISSION & VISION ===== */}
      <section className="about-mv">
        <div className="container">
          <div className="about-mv__grid">

            {/* Mission */}
            <div className="about-mv__card about-mv__card--mission">
              <div className="about-mv__card-deco"></div>
              <div className="about-mv__card-tag">Our Mission</div>
              <h2 className="about-mv__card-title">Advancing with heart, integrity, and smart systems.</h2>
              <p className="about-mv__card-desc">
                We advance JEM 8 Circle with heart, integrity, and smart systems. Through ethical distribution,
                structured processes, and strong teamwork, we develop confident, knowledgeable, and responsible
                leaders, expand our global reach, and create sustainable growth for both our people and the organization.
              </p>
              <div className="about-mv__card-since">
                <div className="about-mv__card-since-dot"></div>
                <span className="about-mv__card-since-text">Since {stats.since}</span>
              </div>
            </div>

            {/* Vision */}
            <div className="about-mv__card about-mv__card--vision">
              <div className="about-mv__card-deco"></div>
              <div className="about-mv__card-tag">Our Vision</div>
              <h2 className="about-mv__card-title">Where wellness fuels opportunity and purpose drives action.</h2>
              <p className="about-mv__card-desc">
                To create a world where wellness fuels opportunity, leaders inspire growth, and a united team
                transforms lives through passion, integrity, and purpose-driven action.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ===== LEADERSHIP ===== */}
      <section className="about-leadership">
        <div className="container">
          <div className="about-leadership__header">
            <div className="about-hero__label" style={{ margin: '0 auto 8px' }}>
              <span className="about-hero__label-dot"></span>Our Team
            </div>
            <h2 className="section-title">Leadership</h2>
            <p className="about-hero__subtitle" style={{ marginBottom: 0 }}>
              The people behind JEM 8 Circle Trading Co.
            </p>
          </div>

          {/* Loading skeletons */}
          {leadersLoading && (
            <div className="about-leadership__grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="leader-card" style={{ opacity: 0.6 }}>
                  <div
                    className="leader-card__photo-wrap"
                    style={{
                      background: 'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'about-shimmer 1.4s infinite',
                      borderRadius: '50%',
                      aspectRatio: '1',
                    }}
                  />
                  <div className="leader-card__body">
                    <div style={{ height: '14px', width: '70%', background: '#E2E8F0', borderRadius: '6px', marginBottom: '8px', animation: 'about-shimmer 1.4s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)' }} />
                    <div style={{ height: '11px', width: '90%', background: '#E2E8F0', borderRadius: '6px', animation: 'about-shimmer 1.4s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {!leadersLoading && leadersError && (
            <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '14px', padding: '32px 0' }}>
              Unable to load team members at this time.
            </p>
          )}

          {/* Leaders grid */}
          {!leadersLoading && !leadersError && (
            <div className="about-leadership__grid">
              {leaders.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '14px', gridColumn: '1/-1', padding: '32px 0' }}>
                  No team members to display.
                </p>
              ) : (
                leaders.map((leader) => {
                  const imgSrc = resolveImg(leader.leadership_img);
                  return (
                    <div key={leader.leadership_id ?? leader.id} className="leader-card">
                      <div className="leader-card__photo-wrap">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={leader.name}
                            className="leader-card__photo"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fb = e.target.nextSibling;
                              if (fb) fb.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="leader-card__fallback"
                          style={{ display: imgSrc ? 'none' : 'flex' }}
                        >
                          {getInitials(leader.name)}
                        </div>
                      </div>
                      <div className="leader-card__body">
                        <div className="leader-card__name">{leader.name}</div>
                        <div className="leader-card__role">{leader.position}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </section>

      {/* ===== TRUSTED BANNER ===== */}
      <section className="about-trusted">
        <div className="container">
          <div className="about-trusted__inner">
            <h2 className="about-trusted__title">
              Your Trusted <span>Supply Partner</span>
            </h2>
            <p className="about-trusted__desc">
              From small businesses to established companies, we empower organizations of all sizes with office supplies,
              pantry and janitorial essentials, and health and wellness products — delivered with quality at the best price.
            </p>
          </div>
        </div>
      </section>

      {/* ===== ABOUT DETAIL ===== */}
      <section className="about-detail">
        <div className="container">
          <h2 className="about-detail__title">About JEM 8 Circle</h2>

          {[
            {
              label: 'Who\nWe Are',
              title: 'Registered Business in Makati City',
              desc: `JEM 8 Circle Trading Co. is a registered business situated at Unit 202P, Cityland 10 Tower 1,
                HV Dela Costa St., Salcedo Village, Makati City. Established on July 22, 2016, the company
                operates primarily in the wholesale and retail trade sector and employs between ${stats.employees} staff members.`,
            },
            {
              label: 'Our\nReach',
              title: `${stats.clients} Clients Across Metro Manila & Laguna`,
              desc: `The company has accumulated ${stats.clients} clients as of August 2025 across different
                cities in both Metro Manila and Laguna, steadily growing its presence in the wholesale and retail trade sector.`,
            },
            {
              label: 'What\nWe Do',
              title: 'Office, Pantry, Janitorial & Wellness Products',
              desc: `JEM 8 Circle Trading Co. specializes in supplying office supplies, pantry and janitorial
                supplies, and health and wellness products — and believes in "Supply products with quality in the best price."`,
            },
            {
              label: 'Our\nTeam',
              title: 'Professional Service Rooted in Honesty & Integrity',
              desc: `With a professional team dedicated to understanding and fulfilling client needs promptly and
                at competitive prices, JEM 8 Circle Trading Co. delivers reliable service rooted in honesty and integrity.`,
            },
            {
              label: 'Why\nChoose Us',
              title: 'Direct Delivery. Lower Costs. Better Service.',
              desc: `The company offers stock supplies for quick delivery, helping businesses save on transportation
                and manpower costs by delivering office supplies and promotional items directly to their offices.`,
            },
          ].map((row, i) => (
            <div className="about-row" key={i}>
              <div className="about-row__label">
                {row.label.split('\n').map((l, j) => <span key={j}>{l}<br /></span>)}
              </div>
              <div>
                <p className="about-row__title">{row.title}</p>
                <p className="about-row__desc">{row.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== ENTERPRISE ===== */}
      <section className="about-enterprise">
        <div className="container">
          <div className="about-enterprise__inner">
            <div>
              <div className="about-enterprise__label">Enterprise</div>
              <h2 className="about-enterprise__title">Complete supply solutions for your business</h2>
              <p className="about-enterprise__desc">
                We provide a complete range of office supplies, pantry and janitorial supplies, and health and
                wellness products tailored to your business needs. Delivering quality at the best price —
                directly to your office.
              </p>
              <div className="about-enterprise__features">
                {['Reliable Supply', 'Consistent Quality', 'Timely Delivery'].map((f) => (
                  <div className="about-enterprise__feature" key={f}>{f}</div>
                ))}
              </div>
            </div>
            <div className="about-enterprise__imgs">
              {['/img/download-2-3.png', '/img/download-1.png', '/img/download-1-2.png'].map((src, i) => (
                <div className="about-enterprise__img-wrap" key={i}>
                  <img src={src} alt={`Product ${i + 1}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="about-cta">
        <div className="container">
          <div className="about-cta__inner">
            <p className="about-cta__text">From our hands to your office.</p>
            <p className="about-cta__sub">Ready to work with a trusted supply partner?</p>
            <a href="/contact" className="about-cta__btn">Get Started →</a>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes about-shimmer {
          0%   { background-position: -200% 0 }
          100% { background-position:  200% 0 }
        }
      `}</style>

    </div>
  );
};

export default About;