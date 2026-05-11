import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StartChatWithAdmin from "../components/StartChatWithAdmin";
import ContactForm from "../components/ContactForm";

const CHAT_OPTIONS = [
  { icon: "✉️", label: "Send us an email",      value: "jem8circletrading@gmail.com", href: "mailto:jem8circletrading@gmail.com" },
  { icon: "📘", label: "Message us on Facebook", value: "facebook.com/jem8circle",      href: "https://www.facebook.com/jem8circle.co" },
  { icon: "💬", label: "Start a live chat",      value: "Available Mon–Fri, 9am–5pm",  href: "/messages" },
];

const CALL_OPTIONS = [
  { label: "(02) 8805-1432",          type: "landline" },
  { label: "Ma'am Shella - +63 932 840 5179", type: "mobile" },
  { label: "Ma'am Jinkie - +63 917 546 2540", type: "mobile" },
  { label: "Ma'am Akiko - +63 906 370 3588",  type: "mobile" },
];

export default function Contact() {
  const navigate = useNavigate();

  

  return (
    <div className="pt-[72px]">

      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-[#1a3828] via-[#2d5a3d] to-[#4d7b65] py-16 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 70% 50%, rgba(255,255,255,0.06) 0%, transparent 60%)" }} />
        <div className="container relative flex flex-col items-center px-5 mx-auto">
          <span className="inline-block bg-white/15 text-[#c8ecd8] border border-white/35 rounded-full px-6 py-2 text-xs font-bold tracking-[2px] uppercase mb-6">
            We're Here to Help
          </span>
          <h1 className="mb-4 font-serif text-4xl leading-tight text-white md:text-5xl">
            Talk to Our Friendly<br />Sales Team
          </h1>
          <p className="text-lg text-white/75">
            We'll help you find the perfect plan, no matter your business size.
          </p>
        </div>
      </section>

      {/* ── MAIN ── */}
      <section className="py-14">
        <div className="container grid items-start grid-cols-1 gap-8 px-5 mx-auto lg:grid-cols-2">

          {/* LEFT */}
          <div>

            <ContactForm />

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
                    <span className="flex-shrink-0 text-2xl">{opt.icon}</span>
                    <div>
                      <div className="text-sm font-bold text-[#1a2e22]">{opt.label}</div>
                      <div className="text-xs text-[#6b7c70] mt-0.5">{opt.value}</div>
                    </div>
                    <span className="ml-auto text-[#4d7b65] text-base font-bold flex-shrink-0">→</span>
                  </a>
                ))}
              </div>

              {/* Immediate start chat (keeps existing link above) */}
              <div className="mt-3">
                <StartChatWithAdmin
                  initialMessage={"Hello admin, I have a question about your products."}
                  onStarted={({ chatroomId }) => navigate(`/messages?chatroom_id=${chatroomId}`)}
                  showButton={false}
                />
              </div>

              <div className="border-t border-[#f0f4f1] pt-5">
                <div className="text-xs font-bold text-[#393e46] mb-2.5">📞 Call Us</div>
                <div className="flex flex-col gap-2 mb-2">
  {CALL_OPTIONS.map((c) => (
    <span
      key={c.label}
      className={`text-sm font-bold text-[#4d7b65] px-4 py-2 rounded-xl border border-[#d1e8da] ${
        c.type === "landline"
          ? "bg-[#e8f5ee] tracking-wide"
          : "bg-[#f3f8f5] pl-6"
      }`}
    >
      {c.type === "landline" ? "☎️ " : "📱 "}{c.label}
    </span>
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
                { icon: "📧", title: "Email Us",       body: "sales1.jem8circle@gmail.com\nsales2.jem8circle@gmail.com\nsales3.jem8circle@gmail.com\nsales4.jem8circle@gmail.com\nsales8.jem8circle@gmail.com" },
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
  href="https://www.google.com/maps?q=Cityland+10+Tower+1+Salcedo+Village+Makati"
  target="_blank"
  rel="noreferrer"
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
        <div className="container px-5 mx-auto">
          <h2 className="mb-3 font-serif text-3xl text-white">Ready to Place an Order?</h2>
          <p className="text-base text-white/80 mb-7">
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