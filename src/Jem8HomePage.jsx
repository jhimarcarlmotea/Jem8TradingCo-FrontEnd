import { Link } from "react-router-dom";
import { Header, Footer } from "./components/Layout";
import "./style/global.css";
import "./style/home.css";

const img = (w, h, label = "") =>
  `https://placehold.co/${w}x${h}/edf4f0/4d7b65?text=${encodeURIComponent(label)}`;

const PRODUCT_CARDS = [
  { id: 1, imgSrc: img(800, 500, "Office Supplies"),    title: "Office Supplies, Stationery & Equipment",  desc: "A complete range of office essentials — pens, paper, folders, printers, and equipment. Everything your workplace needs, sourced from one trusted supplier." },
  { id: 2, imgSrc: img(800, 500, "Personal & Home Care"), title: "Personal & Home Care Products",           desc: "From personal hygiene products to home care essentials and everyday consumer goods — we supply both businesses and households with quality brands." },
  { id: 3, imgSrc: img(800, 500, "Pantry Supplies"),    title: "Pantry Supplies",                          desc: "Keep your team fueled and happy. We supply coffee, beverages, snacks, and all the pantry essentials that make the office feel like a second home." },
  { id: 4, imgSrc: img(800, 500, "Giveaways"),          title: "Customized Items for Giveaways",           desc: "Boost your brand with custom merchandise and giveaways. We also offer in-house embroidery services to personalize uniforms, caps, bags, and corporate gifts." },
  { id: 5, imgSrc: img(800, 500, "Janitorial Supplies"), title: "Janitorial Supplies",                     desc: "Maintain a clean and safe workplace with our full line of janitorial products — cleaning agents, tools, sanitation supplies, and more." },
  { id: 6, imgSrc: img(800, 500, "Health & Wellness"),  title: "Health & Wellness Products",               desc: "We proudly carry IAM Amazing Pure Organic Barley — a premium wellness product packed with nutrients to support a healthier lifestyle for you and your family." },
];

const WHY_ITEMS = [
  { num: "1", title: "Quality at the Right Price",       desc: "High-standard products at competitive prices — no compromises." },
  { num: "2", title: "One-Stop Shop Convenience",        desc: "Six product categories, one supplier. Save time and simplify procurement." },
  { num: "3", title: "Dedicated & Professional Team",    desc: "Every order, big or small, gets the same level of care and commitment." },
];

const TESTIMONIALS = [
  { name: "Sarah Johnson",   role: "Business Owner",  review: "Absolutely fantastic service! The team went above and beyond to ensure everything was perfect. Highly recommend to anyone looking for a reliable supplier." },
  { name: "Michael Chen",    role: "Office Manager",  review: "Great experience from start to finish. The product quality exceeded my expectations and delivery was super fast. Will definitely order again." },
  { name: "Emily Rodriguez", role: "HR Director",     review: "Outstanding quality and customer care. This is exactly what I was looking for. Will definitely be a returning customer — the giveaways were a hit!" },
];

function ProductCard({ imgSrc, title, desc }) {
  return (
    <div className="product-card">
      <div className="product-card__img-wrap"><img src={imgSrc} alt={title} /></div>
      <div className="product-card__body">
        <h3 className="product-card__title">{title}</h3>
        <p className="product-card__desc">{desc}</p>
        <span className="product-card__link">Shop Now <span className="product-card__link-arrow">→</span></span>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero__inner container">
        <div className="hero__content">
          <div className="hero__badge"><span className="hero__badge-dot" /> Premium Business Supplies</div>
          <h1 className="hero__title">Everything Your <span>Business</span> Needs</h1>
          <p className="hero__desc">Discover premium essentials, everyday must-haves, and exclusive finds — all in one place. JEM 8 brings quality, convenience, and curated products together for a smarter way to shop.</p>
          <div className="hero__actions">
            <button className="btn-primary">🛒 Shop Now</button>
            <Link to="/about" className="btn-outline">Learn More →</Link>
          </div>
        </div>
        <div className="hero__image-wrap">
          <img src={img(693, 612, "JEM 8 Products")} alt="JEM 8 Circle Trading products showcase" />
          <div className="hero__image-badge">
            <span className="hero__image-badge-icon">🏆</span>
            <div className="hero__image-badge-text">
              <strong>Trusted Supplier</strong>
              <span>6 product categories</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Products() {
  return (
    <section className="products">
      <div className="container">
        <div className="products__header">
          <span className="section-label">What We Offer</span>
          <h2 className="section-title">Products We Offer</h2>
          <p className="section-subtitle">Everything your office and home needs — sourced from one trusted supplier.</p>
        </div>
        <div className="products__grid">
          {PRODUCT_CARDS.map((card) => <ProductCard key={card.id} {...card} />)}
        </div>
      </div>
    </section>
  );
}

function WhyChooseUs() {
  return (
    <section className="why">
      <div className="container">
        <div className="why__header">
          <span className="section-label">Why JEM 8</span>
          <h2 className="section-title">Why Choose JEM 8 Circle Co.?</h2>
        </div>
        <div className="why__grid">
          {WHY_ITEMS.map((item) => (
            <div className="why__card" key={item.num}>
              <div className="why__card-number">{item.num}</div>
              <h3 className="why__card-title">{item.title}</h3>
              <p className="why__card-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="testimonials">
      <div className="container">
        <div className="testimonials__header">
          <span className="section-label">What Clients Say</span>
          <h2 className="section-title">Customer Feedback</h2>
        </div>
        <div className="testimonials__grid">
          {TESTIMONIALS.map((fb) => (
            <div className="testimonial-card" key={fb.name}>
              <div className="testimonial-card__stars">★★★★★</div>
              <p className="testimonial-card__review">"{fb.review}"</p>
              <div className="testimonial-card__author">
                <div className="testimonial-card__avatar">{fb.name.charAt(0)}</div>
                <div>
                  <div className="testimonial-card__name">{fb.name}</div>
                  <div className="testimonial-card__role">{fb.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="cta-banner">
      <div className="container cta-banner__inner">
        <h2 className="cta-banner__title">From Office to Essentials — A Partner That Will Last</h2>
        <p className="cta-banner__subtitle">From Product to Purpose. Quality you can count on, service you can trust.</p>
        <div className="cta-banner__actions">
          <button className="btn-primary-light">Start Shopping →</button>
          <Link to="/about" className="btn-outline-light">Learn About Us</Link>
        </div>
      </div>
    </section>
  );
}

export default function Jem8HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Products />
        <WhyChooseUs />
        <Testimonials />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}