import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const BASE = "http://127.0.0.1:8000/api";

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
  const [error, setError]     = useState(null);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    try {
      await axios.post(`${BASE}/contact`, {
        first_name:   form.firstName,
        last_name:    form.lastName,
        email:        form.email,
        phone_number: form.phone || undefined,
        message:      form.message,
      });

      setSent(true);
      setForm({ firstName: "", lastName: "", email: "", phone: "", message: "" });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Something went wrong. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  const valid = form.firstName && form.lastName && form.email && form.message;

  return (
    <div className="pt-[72px]">

      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-[#1a3828] via-[#2d5a3d] to-[#4d7b65] py-16 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 70% 50%, rgba(255,255,255,0.06) 0%, transparent 60%)" }} />
        <div className="relative container mx-auto px-5 flex flex-col items-center">
          <span className="inline-block bg-white/15 text-[#c8ecd8] border border-white/35 rounded-full px-6 py-2 text-xs font-bold tracking-[2px] uppercase mb-6">
            We're Here to Help
          </span>
          <h1 className="font-serif text-4xl md:text-5xl text-white mb-4 leading-tight">
            Talk to Our Friendly<br />Sales Team
          </h1>
          <p className="text-white/75 text-lg">
            We'll help you find the perfect plan, no matter your business size.
          </p>
        </div>
      </section>

      {/* ── MAIN ── */}
      <section className="py-14">
        <div className="container mx-auto px-5 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* LEFT */}
          <div>

            {/* Form Card */}
            <div className="bg-white border border-[#e8f0eb] rounded-2xl p-8 mb-6">
              <h2 className="font-serif text-2xl text-[#2d5a3d] mb-6 pb-3 border-b-2 border-[#d1e8da]">
                Send Us a Message
              </h2>

              {sent ? (
                <div className="flex flex-col items-center text-center py-6 gap-3">
                  <div className="text-5xl">✅</div>
                  <h3 className="font-serif text-2xl text-[#1a2e22]">Message Sent!</h3>
                  <p className="text-[#4b5563] text-sm">Thank you for reaching out. Our team will get back to you within 1 business day.</p>
                  <button
                    className="mt-2 px-6 py-2.5 border border-[#4d7b65] rounded-xl text-sm font-semibold text-[#4d7b65] hover:bg-[#4d7b65] hover:text-white transition-all"
                    onClick={() => setSent(false)}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#374151]">First Name *</label>
                      <input
                        name="firstName" value={form.firstName} onChange={handleChange}
                        placeholder="Juan" required
                        className="px-3.5 py-2.5 border border-[#c5ddd0] rounded-xl text-sm text-[#1a2e22] bg-[#fafcfb] outline-none focus:border-[#4d7b65] focus:ring-2 focus:ring-[#4d7b65]/10 focus:bg-white transition-all placeholder-[#9ca3af]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#374151]">Last Name *</label>
                      <input
                        name="lastName" value={form.lastName} onChange={handleChange}
                        placeholder="dela Cruz" required
                        className="px-3.5 py-2.5 border border-[#c5ddd0] rounded-xl text-sm text-[#1a2e22] bg-[#fafcfb] outline-none focus:border-[#4d7b65] focus:ring-2 focus:ring-[#4d7b65]/10 focus:bg-white transition-all placeholder-[#9ca3af]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#374151]">Email Address *</label>
                    <input
                      name="email" type="email" value={form.email} onChange={handleChange}
                      placeholder="juan@company.com" required
                      className="px-3.5 py-2.5 border border-[#c5ddd0] rounded-xl text-sm text-[#1a2e22] bg-[#fafcfb] outline-none focus:border-[#4d7b65] focus:ring-2 focus:ring-[#4d7b65]/10 focus:bg-white transition-all placeholder-[#9ca3af]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#374151]">Phone Number</label>
                    <input
                      name="phone" type="tel" value={form.phone} onChange={handleChange}
                      placeholder="+63 (02) 345-6789"
                      className="px-3.5 py-2.5 border border-[#c5ddd0] rounded-xl text-sm text-[#1a2e22] bg-[#fafcfb] outline-none focus:border-[#4d7b65] focus:ring-2 focus:ring-[#4d7b65]/10 focus:bg-white transition-all placeholder-[#9ca3af]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#374151]">Message *</label>
                    <textarea
                      name="message" value={form.message} onChange={handleChange}
                      placeholder="Tell us how we can help you…"
                      rows={5} required
                      className="w-full px-3.5 py-3 border border-[#c5ddd0] rounded-xl text-sm text-[#1a2e22] bg-[#fafcfb] resize-y outline-none focus:border-[#4d7b65] focus:ring-2 focus:ring-[#4d7b65]/10 focus:bg-white transition-all placeholder-[#9ca3af] box-border"
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      ⚠️ {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={sending || !valid}
                    className={`self-start inline-flex items-center gap-2 px-8 py-3.5 bg-[#2d5a3d] text-white border-2 border-[#2d5a3d] rounded-xl text-sm font-bold tracking-wide transition-all
                      ${!valid ? "opacity-50 cursor-default" : ""}
                      ${sending ? "opacity-75 cursor-wait" : ""}
                      ${valid && !sending ? "hover:bg-[#3d6552] hover:border-[#3d6552] hover:-translate-y-px hover:shadow-lg hover:shadow-[#4d7b65]/30" : ""}
                    `}
                  >
                    {sending ? "Sending…" : "📨 Send Message"}
                  </button>
                </form>
              )}
            </div>

            {/* Chat Card */}
            <div className="bg-white border border-[#e8f0eb] rounded-2xl p-8">
              <h2 className="font-serif text-2xl text-[#2d5a3d] mb-6 pb-3 border-b-2 border-[#d1e8da]">
                Chat With Us
              </h2>

              <div className="flex flex-col gap-2.5 mb-6">
                {CHAT_OPTIONS.map((opt) => (
                  <a
                    key={opt.label} href={opt.href}
                    className="flex items-center gap-3.5 px-4 py-3.5 border border-[#e8f0eb] rounded-xl bg-[#fafcfb] no-underline transition-all hover:border-[#4d7b65] hover:bg-[#f3f8f5] hover:translate-x-1"
                  >
                    <span className="text-2xl flex-shrink-0">{opt.icon}</span>
                    <div>
                      <div className="text-sm font-bold text-[#1a2e22]">{opt.label}</div>
                      <div className="text-xs text-[#6b7c70] mt-0.5">{opt.value}</div>
                    </div>
                    <span className="ml-auto text-[#4d7b65] text-base font-bold flex-shrink-0">→</span>
                  </a>
                ))}
              </div>

              <div className="border-t border-[#f0f4f1] pt-5">
                <div className="text-xs font-bold text-[#374151] mb-2.5">📞 Call Us</div>
                <div className="flex gap-2.5 flex-wrap mb-2">
                  {CALL_OPTIONS.map((c) => (
                    <a
                      key={c.label}
                      href={`tel:${c.label.replace(/\D/g, "")}`}
                      className="text-sm font-bold text-[#4d7b65] bg-[#f3f8f5] px-4 py-2 rounded-xl border border-[#d1e8da] no-underline transition-all hover:bg-[#4d7b65] hover:text-white"
                    >
                      {c.label}
                    </a>
                  ))}
                </div>
                <div className="text-xs text-[#9ca3af]">Mon–Fri, 9am–5pm</div>
              </div>
            </div>

          </div>

          {/* RIGHT */}
          <div>
            <div className="flex flex-col gap-3 mb-6">
              {[
                { icon: "📍", title: "Our Office",     body: "Unit 202P, Cityland 10 Tower 1\nHV Dela Costa St., Salcedo Village\nMakati City, Metro Manila 1227" },
                { icon: "📧", title: "Email Us",       body: "jem8circletrading@gmail.com\njem8.jinkieacibar@gmail.com\njem8.jinkiedelacruz@gmail.com" },
                { icon: "🕐", title: "Business Hours", body: "Monday – Friday: 9:00 AM – 5:00 PM\nSaturday: 9:00 AM – 12:00 PM\nSunday & Holidays: Closed" },
              ].map((info) => (
                <div
                  key={info.title}
                  className="flex gap-3.5 p-4 bg-white border border-[#e8f0eb] rounded-2xl transition-shadow hover:shadow-md hover:shadow-[#4d7b65]/10"
                >
                  <span className="text-2xl flex-shrink-0 mt-0.5">{info.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-[#374151] uppercase tracking-wide mb-1.5">{info.title}</div>
                    <div className="text-xs text-[#4b5563] leading-relaxed">
                      {info.body.split("\n").map((l, i) => <span key={i}>{l}<br /></span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-[#e8f0eb] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#f0f4f1]">
                <span className="text-sm font-bold text-[#374151]">🗺️ Search Location by Google Map</span>
              </div>
              <div>
                <iframe
                  title="JEM 8 Circle Trading Co. Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.6!2d121.0209!3d14.5547!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c90264a63cad%3A0x2b0f7e0cb22cc!2sCityland+10+Tower+1%2C+Salcedo+Village%2C+Makati%2C+Metro+Manila!5e0!3m2!1sen!2sph!4v1700000000000!5m2!1sen!2sph"
                  width="100%"
                  height="320"
                  style={{ border: 0, display: "block" }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <a
                href="https://goo.gl/maps/example"
                target="_blank" rel="noreferrer"
                className="block px-5 py-3.5 text-sm font-bold text-[#4d7b65] no-underline border-t border-[#f0f4f1] transition-colors hover:bg-[#f3f8f5]"
              >
                📌 Get Directions →
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-gradient-to-br from-[#2d5a3d] to-[#4d7b65] py-16 text-center">
        <div className="container mx-auto px-5">
          <h2 className="font-serif text-3xl text-white mb-3">Ready to Place an Order?</h2>
          <p className="text-white/80 text-base mb-7">
            Browse our full catalog and add items to your cart — or contact us for a custom bulk quote.
          </p>
          <div className="flex gap-3.5 justify-center flex-wrap">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#4d7b65] text-white border-2 border-[#4d7b65] rounded-xl text-sm font-semibold shadow-lg shadow-[#4d7b65]/35 transition-all hover:bg-[#3a6350] hover:border-[#3a6350] hover:-translate-y-0.5"
            >
              Browse Products →
            </Link>
            <Link
              to="/faq"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-transparent text-white border-2 border-white/40 rounded-xl text-sm font-semibold transition-all hover:border-white hover:-translate-y-0.5"
            >
              View FAQs
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}