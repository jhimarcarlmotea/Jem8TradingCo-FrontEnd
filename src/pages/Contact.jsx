import { useState } from "react";
import { Link } from "react-router-dom";
import "../style/global.css";
import "../style/pages.css";

const CHAT_OPTIONS = [
  { icon: "✉️", label: "Send us an email",      value: "jem8circletrading@gmail.com", href: "mailto:jem8circletrading@gmail.com" },
  { icon: "📘", label: "Message us on Facebook", value: "facebook.com/jem8circle",      href: "https://facebook.com" },
  { icon: "💬", label: "Start a live chat",      value: "Available Mon–Fri, 9am–5pm",  href: "/messages" },
];

const CALL_OPTIONS = [
  { label: "(02) 8805-1432" },
  { label: "(02) 8785-0587" },
];

export default function Contact() {
  const [form, setForm]       = useState({ firstName: "", lastName: "", email: "", phone: "", message: "" });
  const [sent, setSent]       = useState(false);
  const [sending, setSending] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSent(true);
      setSending(false);
      setForm({ firstName: "", lastName: "", email: "", phone: "", message: "" });
    }, 1200);
  };

  const valid = form.firstName && form.lastName && form.email && form.message;

  return (
    <div className="contact-page">

      {/* ── HERO ── */}
      <section className="contact-hero">
        <div className="container contact-hero__inner">
          <span className="contact-hero__label">We're Here to Help</span>
          <h1 className="contact-hero__title">Talk to Our Friendly<br />Sales Team</h1>
          <p className="contact-hero__sub">
            We'll help you find the perfect plan, no matter your business size.
          </p>
        </div>
      </section>

      {/* ── MAIN ── */}
      <section className="contact-main">
        <div className="container contact-main__grid">

          {/* LEFT */}
          <div className="contact-left">

            {/* Form Card */}
            <div className="contact-card">
              <h2 className="contact-card__title">Send Us a Message</h2>

              {sent ? (
                <div className="contact-success">
                  <div className="contact-success__icon">✅</div>
                  <h3>Message Sent!</h3>
                  <p>Thank you for reaching out. Our team will get back to you within 1 business day.</p>
                  <button className="contact-success__btn" onClick={() => setSent(false)}>Send Another Message</button>
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="contact-form__row">
                    <div className="co-field">
                      <label>First Name *</label>
                      <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="Juan" required />
                    </div>
                    <div className="co-field">
                      <label>Last Name *</label>
                      <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="dela Cruz" required />
                    </div>
                  </div>
                  <div className="co-field">
                    <label>Email Address *</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="juan@company.com" required />
                  </div>
                  <div className="co-field">
                    <label>Phone Number</label>
                    <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+63 (02) 345-6789" />
                  </div>
                  <div className="co-field">
                    <label>Message *</label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Tell us how we can help you…"
                      rows={5}
                      className="co-textarea"
                      required
                    />
                  </div>
                  {/* Button is ALWAYS visible green — opacity reduces when empty, not hidden */}
                  <button
                    type="submit"
                    className={`contact-submit-btn${!valid ? " contact-submit-btn--dim" : ""}${sending ? " contact-submit-btn--loading" : ""}`}
                    disabled={sending}
                  >
                    {sending ? "Sending…" : "📨 Send Message"}
                  </button>
                </form>
              )}
            </div>

            {/* Chat Card */}
            <div className="contact-card">
              <h2 className="contact-card__title">Chat With Us</h2>
              <div className="contact-chat-options">
                {CHAT_OPTIONS.map((opt) => (
                  <a key={opt.label} href={opt.href} className="contact-chat-item">
                    <span className="contact-chat-item__icon">{opt.icon}</span>
                    <div>
                      <div className="contact-chat-item__label">{opt.label}</div>
                      <div className="contact-chat-item__value">{opt.value}</div>
                    </div>
                    <span className="contact-chat-item__arrow">→</span>
                  </a>
                ))}
              </div>
              <div className="contact-call-section">
                <div className="contact-call-section__label">📞 Call Us</div>
                <div className="contact-call-nums">
                  {CALL_OPTIONS.map((c) => (
                    <a key={c.label} href={`tel:${c.label.replace(/\D/g,"")}`} className="contact-call-num">
                      {c.label}
                    </a>
                  ))}
                </div>
                <div className="contact-call-hours">Mon–Fri, 9am–5pm</div>
              </div>
            </div>

          </div>

          {/* RIGHT */}
          <div className="contact-right">
            <div className="contact-info-cards">
              {[
                { icon: "📍", title: "Our Office",      body: "Unit 202P, Cityland 10 Tower 1\nHV Dela Costa St., Salcedo Village\nMakati City, Metro Manila 1227" },
                { icon: "📧", title: "Email Us",        body: "jem8circletrading@gmail.com\njem8.jinkieacibar@gmail.com\njem8.jinkiedelacruz@gmail.com" },
                { icon: "🕐", title: "Business Hours",  body: "Monday – Friday: 9:00 AM – 5:00 PM\nSaturday: 9:00 AM – 12:00 PM\nSunday & Holidays: Closed" },
              ].map((info) => (
                <div key={info.title} className="contact-info-card">
                  <span className="contact-info-card__icon">{info.icon}</span>
                  <div>
                    <div className="contact-info-card__title">{info.title}</div>
                    <div className="contact-info-card__body">
                      {info.body.split("\n").map((l, i) => <span key={i}>{l}<br /></span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="contact-map-card">
              <div className="contact-map-card__header">
                <span className="contact-map-card__label">🗺️ Search Location by Google Map</span>
              </div>
              <div className="contact-map-embed">
                <iframe
                  title="JEM 8 Circle Trading Co. Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.6!2d121.0209!3d14.5547!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c90264a63cad%3A0x2b0f7e0cb22cc!2sCityland+10+Tower+1%2C+Salcedo+Village%2C+Makati%2C+Metro+Manila!5e0!3m2!1sen!2sph!4v1700000000000!5m2!1sen!2sph"
                  width="100%"
                  height="320"
                  style={{ border: 0, borderRadius: 12 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <a href="https://goo.gl/maps/example" target="_blank" rel="noreferrer" className="contact-map-directions">
                📌 Get Directions →
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ── CTA ── */}
      <section className="contact-cta">
        <div className="container contact-cta__inner">
          <h2>Ready to Place an Order?</h2>
          <p>Browse our full catalog and add items to your cart — or contact us for a custom bulk quote.</p>
          <div className="contact-cta__actions">
            <Link to="/products" className="btn-primary">Browse Products →</Link>
            <Link to="/faq"      className="btn-outline">View FAQs</Link>
          </div>
        </div>
      </section>

    </div>
  );
}