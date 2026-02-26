import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Header, Footer } from "../components/Layout";
import { useCart } from "../context/CartContext";
import "../style/global.css";
import "../style/product-view.css";

const ph = (w, h, label = "") =>
  `https://placehold.co/${w}x${h}/edf4f0/4d7b65?text=${encodeURIComponent(label)}`;

/* ── All products data (same as Products.jsx) ── */
export const ALL_PRODUCTS = [
  { id: 1,  cat: "office",     name: "Dollar Executive Diary 2024",                rawPrice: 450,   price: "₱450",   oldPrice: "₱560",   badge: "sale", discount: "-20%", rating: 4.8, reviews: 124, image: "/img/image-dollar-executive-diary-2024-2.png",           desc: "Stay organized and professional all year with the Dollar Executive Diary 2024. Features daily planner pages, notes sections, and a durable hardcover binding perfect for business use." },
  { id: 2,  cat: "office",     name: "Piano Premium Gel Pen Set (12 Pcs)",         rawPrice: 180,   price: "₱180",   oldPrice: "₱235",   badge: "new",  discount: "-23%", rating: 4.9, reviews: 89,  image: "/img/image.png",                                         desc: "Smooth, consistent ink flow for every writing task. This set of 12 gel pens includes assorted colors perfect for office use, note-taking, and creative projects." },
  { id: 3,  cat: "office",     name: "Oro Desktop File Organizer",                 rawPrice: 950,   price: "₱950",   oldPrice: null,     badge: null,   discount: null,   rating: 4.7, reviews: 56,  image: "/img/image-oro-desktop-file-organizer-2.png",            desc: "Keep your desk clutter-free with this multi-compartment desktop organizer. Ideal for storing files, folders, and documents in an easily accessible layout." },
  { id: 4,  cat: "office",     name: "Master Permanent Markers (24 Colors)",       rawPrice: 160,   price: "₱160",   oldPrice: null,     badge: "new",  discount: null,   rating: 4.6, reviews: 43,  image: "/img/image-master-permanent-markers-24-colors.png",      desc: "Vibrant, long-lasting permanent markers in 24 bold colors. Quick-drying, water-resistant ink suitable for paper, plastic, glass, and more." },
  { id: 5,  cat: "office",     name: "Dollar Student Spiral Notebook (200 Pages)", rawPrice: 120,   price: "₱120",   oldPrice: "₱150",   badge: "sale", discount: "-20%", rating: 4.5, reviews: 201, image: "/img/image-dollar-student-spiral-notebook-200-pages.png", desc: "200 pages of smooth, ruled paper in a durable spiral-bound notebook. Perfect for students and professionals who need reliable daily notes." },
  { id: 6,  cat: "office",     name: "Master Art Sketch Pad A4 (100 GSM)",         rawPrice: 245,   price: "₱245",   oldPrice: null,     badge: "new",  discount: null,   rating: 4.7, reviews: 38,  image: "/img/image-master-art-sketch-pad-a4-100-GSM.png",        desc: "Heavy 100 GSM acid-free paper ideal for sketching, drawing, and mixed media. 50 sheets per pad in convenient A4 size." },
  { id: 7,  cat: "office",     name: "Piano Weekly Planner 2024",                  rawPrice: 360,   price: "₱360",   oldPrice: null,     badge: null,   discount: null,   rating: 4.6, reviews: 67,  image: "/img/image-piano-weekly-planner-2024.png",               desc: "Plan your week with clarity. Features weekly spreads, monthly overviews, goal tracking, and a notes section — all in a sleek, compact design." },
  { id: 8,  cat: "office",     name: "Dollar A4 Exercise Book (100 Pages)",        rawPrice: 105,   price: "₱105",   oldPrice: null,     badge: null,   discount: null,   rating: 4.3, reviews: 155, image: "/img/image-dollar-a4-exercise-book-100-pages.png",       desc: "100-page ruled exercise book in A4 format. Great value for schools, offices, and everyday note-taking." },
  { id: 9,  cat: "office",     name: "Oro Premium Hardcover Notebook",             rawPrice: 680,   price: "₱680",   oldPrice: "₱830",   badge: "new",  discount: "-18%", rating: 4.8, reviews: 92,  image: "/img/image-oro-premium-hardcover-notebook.png",          desc: "Luxurious hardcover notebook with 192 ivory pages, ribbon bookmark, and elastic closure. A sophisticated companion for professionals." },
  { id: 10, cat: "office",     name: "Dollar Heavy Duty Stapler",                  rawPrice: 320,   price: "₱320",   oldPrice: null,     badge: null,   discount: null,   rating: 4.4, reviews: 78,  image: "/img/image-dollar-heavy-duty-stapler.png",               desc: "Staples up to 50 sheets at once with precision. Built with a durable metal body for long-lasting everyday office use." },
  { id: 11, cat: "pantry",     name: "Premium Arabica Ground Coffee (500g)",       rawPrice: 280,   price: "₱280",   oldPrice: null,     badge: "new",  discount: null,   rating: 4.8, reviews: 310, image: ph(400,300,"Coffee"),     desc: "Rich, aromatic 100% Arabica ground coffee. Medium roast for a smooth, balanced cup — ideal for your office pantry or home kitchen." },
  { id: 12, cat: "pantry",     name: "Assorted Office Snack Bundle (10 pcs)",      rawPrice: 195,   price: "₱195",   oldPrice: "₱240",   badge: "sale", discount: "-19%", rating: 4.5, reviews: 187, image: ph(400,300,"Snacks"),     desc: "10-piece assorted snack bundle including biscuits, chips, and energy bars. Perfect for the office pantry to keep your team energized." },
  { id: 13, cat: "pantry",     name: "Green Tea Sachets Box (25 bags)",            rawPrice: 120,   price: "₱120",   oldPrice: null,     badge: null,   discount: null,   rating: 4.4, reviews: 95,  image: ph(400,300,"Green+Tea"),  desc: "Premium green tea in individually wrapped sachets. Antioxidant-rich and refreshing — a healthy beverage option for your team." },
  { id: 14, cat: "pantry",     name: "Creamer & Sugar Condiment Set",              rawPrice: 85,    price: "₱85",    oldPrice: null,     badge: null,   discount: null,   rating: 4.2, reviews: 44,  image: ph(400,300,"Condiments"), desc: "Complete coffee condiment set with individual creamer and sugar sachets. Convenient and hygienic for office use." },
  { id: 15, cat: "pantry",     name: "Drinking Water Dispenser Bottle (18L)",      rawPrice: 340,   price: "₱340",   oldPrice: null,     badge: "new",  discount: null,   rating: 4.6, reviews: 72,  image: ph(400,300,"Water+Jug"),  desc: "18-liter round dispenser bottle compatible with standard water dispensers. BPA-free and reusable." },
  { id: 16, cat: "janitorial", name: "Industrial Floor Mop & Bucket Set",          rawPrice: 520,   price: "₱520",   oldPrice: "₱640",   badge: "sale", discount: "-19%", rating: 4.7, reviews: 63,  image: ph(400,300,"Mop+Set"),        desc: "Heavy-duty mop with wringer bucket for efficient floor cleaning. Suitable for large office spaces, corridors, and commercial areas." },
  { id: 17, cat: "janitorial", name: "Multi-Surface Disinfectant Spray (1L)",      rawPrice: 145,   price: "₱145",   oldPrice: null,     badge: null,   discount: null,   rating: 4.5, reviews: 128, image: ph(400,300,"Disinfectant"),   desc: "Hospital-grade disinfectant spray effective against bacteria and viruses. Safe for use on desks, doorknobs, and commonly touched surfaces." },
  { id: 18, cat: "janitorial", name: "Microfiber Cleaning Cloths (10-Pack)",       rawPrice: 210,   price: "₱210",   oldPrice: null,     badge: "new",  discount: null,   rating: 4.6, reviews: 84,  image: ph(400,300,"Microfiber"),     desc: "Ultra-absorbent microfiber cloths that trap dust and bacteria without chemicals. Machine washable and reusable up to 500 times." },
  { id: 19, cat: "janitorial", name: "Heavy Duty Trash Bags (50 pcs)",             rawPrice: 130,   price: "₱130",   oldPrice: null,     badge: null,   discount: null,   rating: 4.3, reviews: 211, image: ph(400,300,"Trash+Bags"),     desc: "Extra-strong 60-liter trash bags with tie handles. Puncture and leak-resistant for heavy office waste." },
  { id: 20, cat: "janitorial", name: "Toilet Bowl Cleaner & Brush Kit",            rawPrice: 175,   price: "₱175",   oldPrice: "₱210",   badge: "sale", discount: "-17%", rating: 4.4, reviews: 57,  image: ph(400,300,"Cleaner+Kit"),    desc: "Complete toilet cleaning kit with angled brush and powerful cleaner. Removes stains and eliminates odors effectively." },
  { id: 21, cat: "personal",   name: "Antibacterial Hand Soap (500ml)",            rawPrice: 95,    price: "₱95",    oldPrice: null,     badge: null,   discount: null,   rating: 4.5, reviews: 334, image: ph(400,300,"Hand+Soap"),   desc: "Gentle yet effective antibacterial hand soap. Moisturizing formula with aloe vera — kills 99.9% of germs without drying skin." },
  { id: 22, cat: "personal",   name: "Facial Tissue Box Set (3 boxes)",            rawPrice: 120,   price: "₱120",   oldPrice: null,     badge: "new",  discount: null,   rating: 4.3, reviews: 176, image: ph(400,300,"Tissue"),      desc: "Soft, 3-ply facial tissues in a pack of 3 boxes. Gentle on skin, ideal for office and personal use." },
  { id: 23, cat: "personal",   name: "Alcohol Gel Sanitizer (250ml)",              rawPrice: 75,    price: "₱75",    oldPrice: "₱95",    badge: "sale", discount: "-21%", rating: 4.6, reviews: 289, image: ph(400,300,"Sanitizer"),   desc: "70% isopropyl alcohol gel sanitizer. Fast-drying, fragrance-free formula that keeps hands clean and germ-free throughout the day." },
  { id: 24, cat: "personal",   name: "Premium Laundry Powder (1kg)",               rawPrice: 165,   price: "₱165",   oldPrice: null,     badge: null,   discount: null,   rating: 4.2, reviews: 88,  image: ph(400,300,"Laundry"),     desc: "Concentrated laundry powder with stain-lifting enzymes. Works on both handwash and machine wash for brilliant clean results." },
  { id: 25, cat: "giveaways",  name: "Custom Embroidered Polo Shirt",              rawPrice: 480,   price: "₱480",   oldPrice: null,     badge: "new",  discount: null,   rating: 4.9, reviews: 145, image: ph(400,300,"Polo+Shirt"),  desc: "High-quality polo shirt with custom in-house embroidery of your company logo. Available in various colors and sizes — minimum order applies." },
  { id: 26, cat: "giveaways",  name: "Corporate Tote Bag w/ Logo Print",           rawPrice: 220,   price: "₱220",   oldPrice: "₱280",   badge: "sale", discount: "-21%", rating: 4.7, reviews: 98,  image: ph(400,300,"Tote+Bag"),    desc: "Durable canvas tote bag with full-color screen printing of your brand. Eco-friendly and functional — perfect for events and corporate giveaways." },
  { id: 27, cat: "giveaways",  name: "Personalized Tumbler (500ml)",               rawPrice: 350,   price: "₱350",   oldPrice: null,     badge: null,   discount: null,   rating: 4.8, reviews: 112, image: ph(400,300,"Tumbler"),     desc: "Stainless steel double-walled tumbler with laser-engraved personalization. Keeps drinks hot for 12 hours and cold for 24 hours." },
  { id: 28, cat: "wellness",   name: "IAM Amazing Pure Organic Barley (250g)",     rawPrice: 850,   price: "₱850",   oldPrice: null,     badge: "new",  discount: null,   rating: 4.9, reviews: 523, image: "/img/download-2-3.png",  desc: "100% pure organic barley grass powder packed with vitamins, minerals, and antioxidants. Supports immunity, digestion, and energy levels. Our flagship wellness product." },
  { id: 29, cat: "wellness",   name: "Organic Barley Starter Pack (3 pouches)",    rawPrice: 2200,  price: "₱2,200", oldPrice: "₱2,550", badge: "sale", discount: "-14%", rating: 4.8, reviews: 234, image: "/img/download-1.png",    desc: "Three-pouch starter set perfect for trying the full IAM Amazing Barley lineup. Includes Original, Lemon, and Moringa variants." },
  { id: 30, cat: "wellness",   name: "Barley Wellness Bundle + Shaker",            rawPrice: 1450,  price: "₱1,450", oldPrice: null,     badge: null,   discount: null,   rating: 4.7, reviews: 167, image: "/img/download-1-2.png",  desc: "Complete wellness kit: 2 pouches of Organic Barley + premium shaker bottle. Everything you need to start your health journey." },
];

const RELATED_COUNT = 4;

function StarRating({ rating, count }) {
  return (
    <div className="pv-stars">
      {[1,2,3,4,5].map((s) => (
        <span key={s} className={s <= Math.round(rating) ? "pv-star" : "pv-star pv-star--empty"}>★</span>
      ))}
      <span className="pv-stars__score">{rating}</span>
      {count !== undefined && <span className="pv-stars__count">({count} reviews)</span>}
    </div>
  );
}

export default function ProductView() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { addToCart, totalItems } = useCart();

  const product = ALL_PRODUCTS.find((p) => p.id === Number(id));
  const related = ALL_PRODUCTS.filter((p) => p.id !== Number(id) && p.cat === product?.cat).slice(0, RELATED_COUNT);

  const [qty, setQty]           = useState(1);
  const [added, setAdded]       = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  if (!product) {
    return (
      <div className="pv-page">
        <Header />
        <div className="container" style={{ padding: "120px 0", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 32, marginBottom: 16 }}>Product not found</h2>
          <Link to="/products" className="btn-primary">← Back to Products</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const handleAdd = () => {
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, qty);
    navigate("/cart");
  };

  return (
    <div className="pv-page">
      <Header />

      {/* ── BREADCRUMB ── */}
      <div className="pv-breadcrumb">
        <div className="container pv-breadcrumb__inner">
          <Link to="/">Home</Link>
          <span className="pv-breadcrumb__sep">›</span>
          <Link to="/products">Products</Link>
          <span className="pv-breadcrumb__sep">›</span>
          <span>{product.name}</span>
        </div>
      </div>

      {/* ── MAIN PRODUCT ── */}
      <section className="pv-main">
        <div className="container pv-main__grid">

          {/* Image */}
          <div className="pv-image-col">
            <div className="pv-image-wrap">
              <img
                src={product.image}
                alt={product.name}
                className="pv-image"
                onError={(e) => { e.target.src = ph(600, 600, product.name); }}
              />
              {product.badge === "sale" && (
                <span className="pv-image-badge pv-image-badge--sale">{product.discount}</span>
              )}
              {product.badge === "new" && (
                <span className="pv-image-badge pv-image-badge--new">New</span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="pv-info-col">
            <span className="pv-cat">{product.cat.toUpperCase()}</span>
            <h1 className="pv-name">{product.name}</h1>

            <StarRating rating={product.rating} count={product.reviews} />

            <div className="pv-price-row">
              <span className="pv-price">{product.price}</span>
              {product.oldPrice && (
                <>
                  <span className="pv-price-old">{product.oldPrice}</span>
                  <span className="pv-price-badge">{product.discount} OFF</span>
                </>
              )}
            </div>

            <p className="pv-desc">{product.desc}</p>

            <div className="pv-divider" />

            {/* Quantity */}
            <div className="pv-qty-row">
              <span className="pv-qty-label">Quantity</span>
              <div className="pv-qty-ctrl">
                <button className="pv-qty-btn" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <span className="pv-qty-val">{qty}</span>
                <button className="pv-qty-btn" onClick={() => setQty((q) => q + 1)}>+</button>
              </div>
            </div>

            {/* Actions */}
            <div className="pv-actions">
              <button className={`pv-add-btn${added ? " pv-add-btn--added" : ""}`} onClick={handleAdd}>
                {added ? "✓ Added to Cart!" : "🛒 Add to Cart"}
              </button>
              <button className="pv-buy-btn" onClick={handleBuyNow}>
                Buy Now
              </button>
            </div>

            {/* Cart link */}
            {totalItems > 0 && (
              <Link to="/cart" className="pv-cart-link">
                View Cart ({totalItems} item{totalItems !== 1 ? "s" : ""}) →
              </Link>
            )}

            {/* Trust badges */}
            <div className="pv-trust">
              {["🚚 Free delivery in Metro Manila", "✅ Quality guaranteed", "🔄 Easy returns"].map((t) => (
                <span key={t} className="pv-trust__item">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TABS ── */}
      <section className="pv-tabs-section">
        <div className="container">
          <div className="pv-tabs">
            {["overview", "specifications", "reviews"].map((tab) => (
              <button
                key={tab}
                className={`pv-tab${activeTab === tab ? " active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="pv-tab-content">
            {activeTab === "overview" && (
              <div className="pv-overview">
                <h3>Product Overview</h3>
                <p>{product.desc}</p>
                <p>JEM 8 Circle Trading Co. sources only quality-assured products for your business. This item is available for bulk ordering with discounted pricing for orders of 10 units or more. Contact us for bulk quotations.</p>
                <div className="pv-overview-features">
                  {["Premium quality materials", "Suitable for office and commercial use", "Available for bulk orders", "Direct delivery to your office"].map((f) => (
                    <div key={f} className="pv-overview-feature">
                      <span className="pv-overview-feature__check">✓</span> {f}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === "specifications" && (
              <div className="pv-specs">
                <h3>Specifications</h3>
                <table className="pv-specs-table">
                  <tbody>
                    <tr><td>Category</td><td>{product.cat.charAt(0).toUpperCase() + product.cat.slice(1)}</td></tr>
                    <tr><td>Brand</td><td>JEM 8 Certified</td></tr>
                    <tr><td>Rating</td><td>{product.rating} / 5.0</td></tr>
                    <tr><td>Reviews</td><td>{product.reviews} verified reviews</td></tr>
                    <tr><td>Availability</td><td>In Stock</td></tr>
                    <tr><td>Delivery</td><td>Metro Manila: 1–2 days · Laguna: 2–3 days</td></tr>
                    <tr><td>Bulk Pricing</td><td>Available for 10+ units</td></tr>
                  </tbody>
                </table>
              </div>
            )}
            {activeTab === "reviews" && (
              <div className="pv-reviews">
                <h3>Customer Reviews</h3>
                <div className="pv-reviews-summary">
                  <div className="pv-reviews-big">{product.rating}</div>
                  <div>
                    <StarRating rating={product.rating} />
                    <div className="pv-reviews-count">Based on {product.reviews} reviews</div>
                  </div>
                </div>
                {[
                  { name: "Maria S.", text: "Excellent quality! Exactly as described and arrived on time.", rating: 5 },
                  { name: "Juan D.",  text: "Great product for the price. Will definitely order again in bulk.", rating: 5 },
                  { name: "Ana R.",   text: "Good value for money. Delivery was fast.", rating: 4 },
                ].map((r) => (
                  <div key={r.name} className="pv-review-card">
                    <div className="pv-review-card__header">
                      <div className="pv-review-card__avatar">{r.name[0]}</div>
                      <div>
                        <div className="pv-review-card__name">{r.name}</div>
                        <StarRating rating={r.rating} />
                      </div>
                    </div>
                    <p className="pv-review-card__text">{r.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── RELATED ── */}
      {related.length > 0 && (
        <section className="pv-related">
          <div className="container">
            <span className="section-label">More from this Category</span>
            <h2 className="section-title" style={{ marginBottom: 32 }}>You May Also Like</h2>
            <div className="pv-related-grid">
              {related.map((p) => (
                <Link to={`/products/${p.id}`} key={p.id} className="pv-related-card">
                  <div className="pv-related-card__img">
                    <img src={p.image} alt={p.name} onError={(e) => { e.target.src = ph(300,300,p.name); }} />
                  </div>
                  <div className="pv-related-card__body">
                    <div className="pv-related-card__name">{p.name}</div>
                    <div className="pv-related-card__price">{p.price}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}