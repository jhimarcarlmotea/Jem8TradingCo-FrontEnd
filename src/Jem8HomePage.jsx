import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header, Footer } from "./components/Layout";
import { me } from "./api/auth";
import axios from "axios";


import officeSuppliesImg from "./assets/Office supplies & equipment.png";
import personalCareImg   from "./assets/Personal & Home care products.png";
import janitorialImg     from "./assets/Janitorial.png";
import pantrySuppliesImg from "./assets/Pantry supplies.png";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api",
  withCredentials: true,
  headers: { Accept: "application/json" },
});

const img = (w, h, label = "") =>
  `https://placehold.co/${w}x${h}/edf4f0/4d7b65?text=${encodeURIComponent(label)}`;

const CAROUSEL_IMAGES = [
  { src: officeSuppliesImg, label: "Office Supplies & Equipment" },
  { src: personalCareImg,   label: "Personal & Home Care" },
  { src: pantrySuppliesImg, label: "Pantry Supplies" },
  { src: janitorialImg,     label: "Janitorial Supplies" },
];

const PRODUCT_CARDS = [
  {
    id: 1,
    imgSrc: officeSuppliesImg,
    title: "Office Supplies, Stationery & Equipment",
    desc: "A complete range of office essentials — pens, paper, folders, printers, and equipment. Everything your workplace needs, sourced from one trusted supplier.",
    category: "office",
  },
  {
    id: 2,
    imgSrc: personalCareImg,
    title: "Personal & Home Care-Wellness Products",
    desc: "From personal hygiene products to home care essentials and everyday consumer goods — we supply both businesses and households with quality brands.",
    category: "personal",
  },
  {
    id: 3,
    imgSrc: pantrySuppliesImg,
    title: "Office Pantry Supplies",
    desc: "Keep your team fueled and happy. We supply coffee, beverages, snacks, and all the pantry essentials that make the office feel like a second home.",
    category: "pantry",
  },
  {
    id: 4,
    imgSrc: img(800, 500, "Giveaways"),
    title: "Customized Items for Giveaways",
    desc: "Boost your brand with custom merchandise and giveaways. We also offer in-house embroidery services to personalize uniforms, caps, bags, and corporate gifts.",
    category: "giveaway",
  },
  {
    id: 5,
    imgSrc: janitorialImg,
    title: "Janitorial Supplies",
    desc: "Maintain a clean and safe workplace with our full line of janitorial products — cleaning agents, tools, sanitation supplies, and more.",
    category: "janitor",
  },
  {
    id: 6,
    imgSrc: img(800, 500, "Health & Wellness"),
    title: "Health & Wellness Products",
    desc: "We proudly carry IAM Amazing Pure Organic Barley — a premium wellness product packed with nutrients to support a healthier lifestyle for you and your family.",
    category: "wellness",
  },
];

const WHY_ITEMS = [
  { num: "1", title: "Quality at the Right Price",    desc: "High-standard products at competitive prices — no compromises." },
  { num: "2", title: "One-Stop Shop Convenience",     desc: "Six product categories, one supplier. Save time and simplify procurement." },
  { num: "3", title: "Dedicated & Professional Team", desc: "Every order, big or small, gets the same level of care and commitment." },
];


function StarRating({ rating, max = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={`text-base ${i < rating ? "text-amber-400" : "text-gray-200"}`}>★</span>
      ))}
    </div>
  );
}


function ProductCard({ imgSrc, title, desc, category }) {
  return (
    <Link
      to={`/products?category=${category}`}
      className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col no-underline text-inherit transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 hover:border-[#b8d9c8]"
    >
      {/* rest of the card stays the same */}
      <div className="w-full overflow-hidden bg-slate-100 aspect-[16/10]">
        <img
          src={imgSrc}
          alt={title}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col flex-1 px-6 py-5">
        <h3 className="text-[15px] font-bold text-slate-800 mb-2.5 leading-snug">{title}</h3>
        <p className="flex-1 mb-4 text-sm leading-relaxed text-slate-500">{desc}</p>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4d7b65] self-start transition-all duration-200 group-hover:gap-3 group-hover:text-[#3a5e4e]">
          Shop Now
          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  );
}


function Hero() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      className="relative flex items-center min-h-screen overflow-hidden bg-gradient-to-br from-[#f9fdf9] via-white to-[#edf4f0]"
      style={{ paddingTop: "var(--header-h, 80px)" }}
    >
      <div className="absolute -top-40 -right-40 w-[560px] h-[560px] rounded-full bg-[#4d7b65]/5 pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-[#4d7b65]/4 pointer-events-none" />

      <div className="relative z-10 max-w-[1200px] w-full mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 items-center gap-14 pt-16 pb-20">
      
        <div>
          <div className="inline-flex items-center gap-2 bg-white border border-[#b8d9c8] rounded-full px-4 py-1.5 text-[13px] font-medium text-[#4d7b65] mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 bg-[#4d7b65] rounded-full animate-pulse" />
            Premium Business Supplies
          </div>

          <h1 className="mb-5 text-4xl font-bold leading-tight text-slate-800 sm:text-5xl lg:text-6xl">
            Everything Your{" "}
            <span className="text-[#4d7b65]">Business</span> Needs
          </h1>

          <p className="text-slate-500 leading-[1.8] mb-10 max-w-lg text-base lg:text-lg">
            Discover premium essentials, everyday must-haves, and exclusive finds — all in one
            place. JEM 8 brings quality, convenience, and curated products together for a smarter
            way to shop.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#4d7b65] text-white rounded-xl font-semibold text-[15px] shadow-lg shadow-[#4d7b65]/30 transition-all duration-300 hover:bg-[#3a5e4e] hover:-translate-y-0.5 no-underline"
            >
              🛒 Shop Now
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-transparent border-2 border-[#4d7b65] text-[#4d7b65] rounded-xl font-semibold text-[15px] transition-all duration-300 hover:bg-[#edf4f0] hover:-translate-y-0.5 no-underline"
            >
              Learn More →
            </Link>
          </div>
        </div>

       
        <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[16/14] bg-slate-100">
          {CAROUSEL_IMAGES.map((item, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-700 ${
                i === current ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              <img
                src={item.src}
                alt={item.label}
                className="object-cover w-full h-full"
              />
            </div>
          ))}

        
          <div className="absolute z-20 flex gap-2 -translate-x-1/2 bottom-5 left-1/2">
            {CAROUSEL_IMAGES.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-500 ${
                  i === current ? "bg-[#4d7b65] w-5" : "bg-white/60 w-2"
                }`}
              />
            ))}
          </div>

         
          <div className="absolute z-20 flex items-center gap-3 px-4 py-3 shadow-lg bottom-6 left-6 bg-white/95 backdrop-blur-md rounded-xl">
            <span className="text-2xl">🏆</span>
            <div>
              <strong className="block text-sm font-bold text-slate-800">Trusted Supplier</strong>
              <span className="text-xs text-slate-500">6 product categories</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


function ProductsSection() {
  return (
    <section className="py-20 bg-white lg:py-28">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col gap-3 mb-14">
          <span className="inline-block text-[11px] font-bold tracking-[3px] uppercase text-[#4d7b65] bg-[#edf4f0] border border-[#b8d9c8] rounded-full px-3.5 py-1 self-start">
            What We Offer
          </span>
          <h2 className="text-3xl font-bold leading-tight text-slate-800 lg:text-4xl">
            Products We Offer
          </h2>
          <p className="text-base text-slate-500">
            Everything your office and home needs — sourced from one trusted supplier.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {PRODUCT_CARDS.map((card) => (
            <ProductCard key={card.id} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Why Choose Us ── */
function WhyChooseUs() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-[#edf4f0] to-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col gap-3 mb-14">
          <span className="inline-block text-[11px] font-bold tracking-[3px] uppercase text-[#4d7b65] bg-[#edf4f0] border border-[#b8d9c8] rounded-full px-3.5 py-1 self-start">
            Why JEM 8
          </span>
          <h2 className="text-3xl font-bold leading-tight text-slate-800 lg:text-4xl">
            Why Choose JEM 8 Circle Co.?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-7">
          {WHY_ITEMS.map((item) => (
            <div
              key={item.num}
              className="group bg-white rounded-2xl border border-slate-200 shadow-sm text-center px-8 py-10 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 hover:border-[#b8d9c8]"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-[#edf4f0] border-2 border-[#b8d9c8] rounded-full text-2xl font-bold text-[#4d7b65] mx-auto mb-5">
                {item.num}
              </div>
              <h3 className="text-[17px] font-bold text-slate-800 mb-3">{item.title}</h3>
              <p className="text-[15px] text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials ── */
function Testimonials() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data } = await api.get("/reviews");
        const all = data.data ?? [];
        const published = all
          .filter((r) => ["published", "approved"].includes(r.status?.toLowerCase()))
          .slice(0, 6);
        setReviews(published);
      } catch (err) {
        console.error("Failed to load reviews:", err);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  return (
    <section className="py-20 bg-slate-50 lg:py-28">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col gap-3 mb-14">
          <span className="inline-block text-[11px] font-bold tracking-[3px] uppercase text-[#4d7b65] bg-[#edf4f0] border border-[#b8d9c8] rounded-full px-3.5 py-1 self-start">
            What Clients Say
          </span>
          <h2 className="text-3xl font-bold leading-tight text-slate-800 lg:text-4xl">
            Customer Feedback
          </h2>
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="py-8 bg-white border shadow-sm rounded-2xl px-7 border-slate-200 h-52 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && reviews.length === 0 && (
          <div className="py-16 text-sm text-center text-slate-400">
            No customer reviews yet. Be the first to leave one!
          </div>
        )}

        {!loading && reviews.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => {
              const rid        = review.review_id ?? review.id;
              const userName   = review.user?.name ?? review.name ?? "Customer";
              const userRole   = review.user?.role ?? review.role ?? "Verified Buyer";
              const reviewText = review.review_text ?? review.review ?? "";
              const rating     = Number(review.rating ?? 5);
              const productName =
                typeof review.product === "object"
                  ? (review.product?.product_name ?? review.product?.name ?? null)
                  : review.product ?? null;

              return (
                <div
                  key={rid}
                  className="bg-white rounded-2xl px-7 py-8 border border-slate-200 shadow-sm flex flex-col gap-4 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-[#b8d9c8]"
                >
                  <StarRating rating={rating} />

{productName && (
  <Link
    to={`/products/${review.product?.id ?? review.product_id}`}
    className="self-start inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#edf4f0] border border-[#b8d9c8] text-[#4d7b65] hover:bg-[#dcefe5] transition"
  >
    📦 {productName}
  </Link>
)}

                  <p className="text-[15px] text-slate-600 leading-relaxed italic flex-1">
                    "{reviewText}"
                  </p>

                  {review.admin_reply && (
                    <div className="bg-slate-50 rounded-xl px-4 py-3 border-l-[3px] border-[#4d7b65]">
                      <div className="text-[11px] font-semibold text-[#4d7b65] mb-1">Reply from JEM 8</div>
                      <p className="m-0 text-xs leading-relaxed text-slate-500">{review.admin_reply}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-[#edf4f0] border-2 border-[#b8d9c8] flex items-center justify-center text-base font-bold text-[#4d7b65] flex-shrink-0">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{userName}</div>
                      <div className="text-xs text-slate-400">{userRole}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

/* ── CTA Banner ── */
function CtaBanner() {
  return (
    <section className="relative py-20 overflow-hidden bg-slate-800 lg:py-28">
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#4d7b65]/20 pointer-events-none blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#4d7b65]/15 pointer-events-none blur-3xl" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 text-center">
        <h2 className="max-w-2xl mx-auto mb-4 text-3xl font-bold leading-tight text-white lg:text-5xl">
          From Office to Essentials — A Partner That Will Last
        </h2>
        <p className="mb-10 text-base text-white/60">
          From Product to Purpose. Quality you can count on, service you can trust.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/products"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#4d7b65] text-white rounded-xl text-[15px] font-semibold border-2 border-[#4d7b65] shadow-lg shadow-[#4d7b65]/30 transition-all duration-300 hover:bg-[#3a5e4e] hover:border-[#3a5e4e] hover:-translate-y-0.5 no-underline"
          >
            Start Shopping →
          </Link>
          <Link
            to="/about"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-transparent text-white/85 rounded-xl text-[15px] font-semibold border-2 border-white/30 transition-all duration-300 hover:border-white/70 hover:text-white hover:-translate-y-0.5 no-underline"
          >
            Learn About Us
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Complete Profile Modal ── */
function CompleteProfileModal({ onGo }) {
  return (
    <div className="fixed inset-0 bg-black/55 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden">
        <div className="pb-5 border-b px-7 pt-7 border-slate-100">
          <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-[11px] font-bold px-2.5 py-1 rounded-full mb-3">
            ✦ Complete Profile
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1.5">Complete your profile</h2>
          <p className="text-[13px] text-slate-500 leading-relaxed">
            You signed in with Google. Please complete your profile details to continue using your account.
          </p>
        </div>
        <div className="py-5 px-7">
          <button
            onClick={onGo}
            className="w-full bg-slate-900 text-white border-none rounded-xl py-3.5 text-sm font-bold cursor-pointer transition-colors hover:bg-slate-700"
          >
            Go to Profile →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function Jem8HomePage() {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const res = await me();
        if (res.status === 200 && res.data.status === "success") {
          const user = res.data.data;
          if (!user.first_name || !user.phone_number) {
            setShowModal(true);
          }
        }
      } catch (err) {
        // not logged in or network error — do nothing
      }
    };
    checkProfile();
  }, []);

  return (
    <>
      {showModal && (
        <CompleteProfileModal
          onGo={() => { setShowModal(false); navigate("/Profilepersonal"); }}
        />
      )}
      <Header />
      <main>
        <Hero />
        <ProductsSection />
        <WhyChooseUs />
        <Testimonials />
        <CtaBanner />
      </main>
    </>
  );
}