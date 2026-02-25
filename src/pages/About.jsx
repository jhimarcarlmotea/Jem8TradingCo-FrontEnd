import { useState } from "react";
import { Link } from "react-router-dom";
import { Header, Footer } from "../components/Layout";
import "../style/global.css";
import "../style/about.css";

const img = (w, h, label = "") =>
  `https://placehold.co/${w}x${h}/edf4f0/4d7b65?text=${encodeURIComponent(label)}`;

const STATS = [
  { num: "2016", label: "Est. Year" },
  { num: "250+", label: "Clients" },
  { num: "6",    label: "Categories" },
  { num: "1–7",  label: "Team Size" },
];

const LEADERS = [
  { id: 1,  name: "Ms. Shella R. Acibar",       role: "Co-Owner",                        image: "/img/Shella_Ricafrente-Acibar.png" },
  { id: 2,  name: "Ms. Jinkie Malinag",          role: "Co-Owner",                        image: "/img/Jinkie_Ricafrente-Malinag.png" },
  { id: 3,  name: "Ms. Akiko Serrano",           role: "Sales Executive",                 image: "/img/Akiko_Serrano.png" },
  { id: 4,  name: "Ms. Ruby Ann Castillo",       role: "Sales Executive",                 image: "/img/Ruby_Ann_Castillo.png" },
  { id: 5,  name: "Ms. Charisse Mae Decano",     role: "Admin / HR Representative",       image: "/img/Charisse_Decano.png" },
  { id: 6,  name: "Mr. Adrian Mallanao",         role: "Liaison Head Officer",             image: "/img/Adrian_Mallanao.png" },
  { id: 7,  name: "Mr. Vhernaldo Ricafrente",    role: "Marketing / Admin Assistant",     image: "/img/Vhernaldo_Ricafrente.png" },
  { id: 8,  name: "Mr. Mark Edward Malinag",     role: "Marketing / Admin Assistant",     image: "/img/Mark_Edward_C_Malinag.png" },
  { id: 9,  name: "Mr. Daniel Kian Cadena",      role: "Business Associate",              image: "/img/Daniel_Kian_Rodriguez_Cadena.png" },
  { id: 10, name: "Ms. Kayla R. Bacsafra",       role: "Sales Executive (South Luzon)",   image: "/img/Kayla_R_Bacsafra.png" },
  { id: 11, name: "Ms. Cristina A. Saturnio",    role: "Accounting and Finance",          image: "/img/Cristina_A_Saturnio.png" },
];

const ABOUT_ROWS = [
  { label: "Who We Are",    title: "Registered Business in Makati City",               desc: "JEM 8 Circle Trading Co. is a registered business situated at Unit 202P, Cityland 10 Tower 1, HV Dela Costa St., Salcedo Village, Makati City. Established on July 22, 2016, the company operates primarily in the wholesale and retail trade sector and employs between 1–7 staff members." },
  { label: "Our Reach",     title: "250+ Clients Across Metro Manila & Laguna",        desc: "The company has accumulated 250 clients as of August 2025 across different cities in both Metro Manila and Laguna, steadily growing its presence in the wholesale and retail trade sector." },
  { label: "What We Do",    title: "Office, Pantry, Janitorial & Wellness Products",   desc: 'JEM 8 Circle Trading Co. specializes in supplying office supplies, pantry and janitorial supplies, and health and wellness products — and believes in "Supply products with quality in the best price."' },
  { label: "Our Team",      title: "Professional Service Rooted in Honesty & Integrity", desc: "With a professional team dedicated to understanding and fulfilling client needs promptly and at competitive prices, JEM 8 Circle Trading Co. delivers reliable service rooted in honesty and integrity." },
  { label: "Why Choose Us", title: "Direct Delivery. Lower Costs. Better Service.",    desc: "The company offers stock supplies for quick delivery, helping businesses save on transportation and manpower costs by delivering office supplies and promotional items directly to their offices." },
];

const ENTERPRISE_IMGS = [
  { src: "/img/download-2-3.png", label: "Product 1" },
  { src: "/img/download-1.png",   label: "Product 2" },
  { src: "/img/download-1-2.png", label: "Product 3" },
];

function LeaderCard({ name, role, image }) {
  const [imgError, setImgError] = useState(false);
  const initials = name.split(" ").filter((w) => w.match(/^[A-Z]/)).slice(0, 2).map((w) => w[0]).join("");
  return (
    <div className="leader-card">
      <div className="leader-card__photo-wrap">
        {!imgError ? (
          <img src={image} alt={name} className="leader-card__photo" onError={() => setImgError(true)} />
        ) : (
          <div className="leader-card__fallback">{initials}</div>
        )}
      </div>
      <div className="leader-card__body">
        <div className="leader-card__name">{name}</div>
        <div className="leader-card__role">{role}</div>
      </div>
    </div>
  );
}

export default function About() {
  return (
    <div className="about-page">
      <Header />

      {/* HERO */}
      <section className="about-hero">
        <div className="container about-hero__inner">
          <div className="about-hero__label">
            <span className="about-hero__label-dot" />
            JEM 8 Circle Trading Co.
          </div>
          <h1 className="about-hero__title">Your Trusted Source for <em>Equipment & Supplies</em></h1>
          <p className="about-hero__subtitle">We connect trading companies with the industrial equipment and supplies they need to operate at peak efficiency — reliably, seamlessly, and at scale.</p>
          <div className="about-hero__stats">
            {STATS.map((s) => (
              <div className="about-hero__stat" key={s.label}>
                <span className="about-hero__stat-num">{s.num}</span>
                <span className="about-hero__stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="about-mv">
        <div className="container">
          <div className="about-mv__grid">
            <div className="about-mv__card about-mv__card--mission">
              <div className="about-mv__card-deco" />
              <span className="about-mv__card-tag">Our Mission</span>
              <h2 className="about-mv__card-title">Advancing with Heart, Integrity & Smart Systems</h2>
              <p className="about-mv__card-desc">We advance JEM 8 Circle with heart, integrity, and smart systems. Through ethical distribution, structured processes, and strong teamwork, we develop confident, knowledgeable, and responsible leaders — expanding our global reach and creating sustainable growth for both our people and the organization.</p>
              <div className="about-mv__card-since">
                <span className="about-mv__card-since-dot" />
                <span className="about-mv__card-since-text">Established Since 2016</span>
              </div>
            </div>
            <div className="about-mv__card about-mv__card--vision">
              <div className="about-mv__card-deco" />
              <span className="about-mv__card-tag">Our Vision</span>
              <h2 className="about-mv__card-title">Where Wellness Fuels Opportunity & Purpose Drives Action</h2>
              <p className="about-mv__card-desc">To create a world where wellness fuels opportunity, leaders inspire growth, and a united team transforms lives through passion, integrity, and purpose-driven action.</p>
            </div>
          </div>
        </div>
      </section>

      {/* LEADERSHIP */}
      <section className="about-leadership">
        <div className="container">
          <div className="about-leadership__header">
            <span className="section-label">The People Behind JEM 8</span>
            <h2 className="section-title">Our Leadership Team</h2>
          </div>
          <div className="about-leadership__grid">
            {LEADERS.map((leader) => <LeaderCard key={leader.id} {...leader} />)}
          </div>
        </div>
      </section>

      {/* TRUSTED BANNER */}
      <section className="about-trusted">
        <div className="container about-trusted__inner">
          <h2 className="about-trusted__title">Your Trusted <span>Supply Partner</span></h2>
          <p className="about-trusted__desc">From small businesses to established companies, we empower organizations of all sizes with office supplies, pantry and janitorial essentials, and health and wellness products — delivered with quality at the best price.</p>
        </div>
      </section>

      {/* ABOUT DETAIL ROWS */}
      <section className="about-detail">
        <div className="container">
          <h2 className="about-detail__title">About JEM 8 Circle</h2>
          {ABOUT_ROWS.map((row) => (
            <div className="about-row" key={row.label}>
              <div className="about-row__label">{row.label}</div>
              <div>
                <p className="about-row__title">{row.title}</p>
                <p className="about-row__desc">{row.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ENTERPRISE */}
      <section className="about-enterprise">
        <div className="container">
          <div className="about-enterprise__inner">
            <div>
              <span className="about-enterprise__label">Enterprise Solutions</span>
              <h2 className="about-enterprise__title">Built for Businesses of Every Size</h2>
              <p className="about-enterprise__desc">We provide a complete range of office supplies, pantry and janitorial supplies, and health and wellness products tailored to your business needs. Delivering quality at the best price — directly to your office.</p>
              <div className="about-enterprise__features">
                {["Reliable Supply", "Consistent Quality", "Timely Delivery"].map((f) => (
                  <div className="about-enterprise__feature" key={f}>{f}</div>
                ))}
              </div>
              <Link to="/contact" className="btn-primary">Get Started →</Link>
            </div>
            <div className="about-enterprise__imgs">
              {ENTERPRISE_IMGS.map((im, i) => (
                <div className="about-enterprise__img-wrap" key={i}>
                  <img src={im.src} alt={im.label} onError={(e) => { e.target.src = img(300, 400, im.label); }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <div className="container about-cta__inner">
          <h2 className="about-cta__text">From Our Hands to Your Office.</h2>
          <p className="about-cta__sub">Ready to experience quality supply with professional service?</p>
          <Link to="/contact" className="about-cta__btn">Contact Us Today →</Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}