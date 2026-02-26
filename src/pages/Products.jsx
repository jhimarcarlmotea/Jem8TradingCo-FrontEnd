import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Header, Footer } from "../components/Layout";
import { useCart } from "../context/CartContext";
import "../style/global.css";
import "../style/products.css";

const ph = (w, h, label = "") =>
  `https://placehold.co/${w}x${h}/edf4f0/4d7b65?text=${encodeURIComponent(label)}`;

/* ── Star Rating ── */
function StarRating({ rating }) {
  return (
    <div className="pcard__stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= Math.round(rating) ? "pcard__star" : "pcard__star--empty"}>★</span>
      ))}
      <span className="pcard__rating">({rating})</span>
    </div>
  );
}

/* ── Data ── */
const CATEGORIES = [
  { id: "all",        label: "All Products",        icon: "🛒", count: 30 },
  { id: "office",     label: "Office Supplies",      icon: "🖊️", count: 10 },
  { id: "pantry",     label: "Pantry Supplies",      icon: "☕", count: 5  },
  { id: "janitorial", label: "Janitorial Supplies",  icon: "🧹", count: 5  },
  { id: "personal",   label: "Personal & Home Care", icon: "🧴", count: 4  },
  { id: "giveaways",  label: "Customized Giveaways", icon: "🎁", count: 3  },
  { id: "wellness",   label: "Health & Wellness",    icon: "🌿", count: 3  },
];

const CAT_LABEL = {
  office: "Office", pantry: "Pantry", janitorial: "Janitorial",
  personal: "Personal Care", giveaways: "Giveaways", wellness: "Wellness",
};

const PRODUCTS = [
  /* OFFICE */
  { id: 1,  cat: "office",     name: "Dollar Executive Diary 2024",                price: "₱450",   oldPrice: "₱560",   badge: "sale", discount: "-20%", rating: 4.8, image: "/img/image-dollar-executive-diary-2024-2.png" },
  { id: 2,  cat: "office",     name: "Piano Premium Gel Pen Set (12 Pcs)",         price: "₱180",   oldPrice: "₱235",   badge: "new",  discount: "-23%", rating: 4.9, image: "/img/image.png" },
  { id: 3,  cat: "office",     name: "Oro Desktop File Organizer",                 price: "₱950",   oldPrice: null,     badge: null,   discount: null,   rating: 4.7, image: "/img/image-oro-desktop-file-organizer-2.png" },
  { id: 4,  cat: "office",     name: "Master Permanent Markers (24 Colors)",       price: "₱160",   oldPrice: null,     badge: "new",  discount: null,   rating: 4.6, image: "/img/image-master-permanent-markers-24-colors.png" },
  { id: 5,  cat: "office",     name: "Dollar Student Spiral Notebook (200 Pages)", price: "₱120",   oldPrice: "₱150",   badge: "sale", discount: "-20%", rating: 4.5, image: "/img/image-dollar-student-spiral-notebook-200-pages.png" },
  { id: 6,  cat: "office",     name: "Master Art Sketch Pad A4 (100 GSM)",         price: "₱245",   oldPrice: null,     badge: "new",  discount: null,   rating: 4.7, image: "/img/image-master-art-sketch-pad-a4-100-GSM.png" },
  { id: 7,  cat: "office",     name: "Piano Weekly Planner 2024",                  price: "₱360",   oldPrice: null,     badge: null,   discount: null,   rating: 4.6, image: "/img/image-piano-weekly-planner-2024.png" },
  { id: 8,  cat: "office",     name: "Dollar A4 Exercise Book (100 Pages)",        price: "₱105",   oldPrice: null,     badge: null,   discount: null,   rating: 4.3, image: "/img/image-dollar-a4-exercise-book-100-pages.png" },
  { id: 9,  cat: "office",     name: "Oro Premium Hardcover Notebook",             price: "₱680",   oldPrice: "₱830",   badge: "new",  discount: "-18%", rating: 4.8, image: "/img/image-oro-premium-hardcover-notebook.png" },
  { id: 10, cat: "office",     name: "Dollar Heavy Duty Stapler",                  price: "₱320",   oldPrice: null,     badge: null,   discount: null,   rating: 4.4, image: "/img/image-dollar-heavy-duty-stapler.png" },
  /* PANTRY */
  { id: 11, cat: "pantry",     name: "Premium Arabica Ground Coffee (500g)",       price: "₱280",   oldPrice: null,     badge: "new",  discount: null,   rating: 4.8, image: ph(400, 300, "Coffee") },
  { id: 12, cat: "pantry",     name: "Assorted Office Snack Bundle (10 pcs)",      price: "₱195",   oldPrice: "₱240",   badge: "sale", discount: "-19%", rating: 4.5, image: ph(400, 300, "Snacks") },
  { id: 13, cat: "pantry",     name: "Green Tea Sachets Box (25 bags)",            price: "₱120",   oldPrice: null,     badge: null,   discount: null,   rating: 4.4, image: ph(400, 300, "Green+Tea") },
  { id: 14, cat: "pantry",     name: "Creamer & Sugar Condiment Set",              price: "₱85",    oldPrice: null,     badge: null,   discount: null,   rating: 4.2, image: ph(400, 300, "Condiments") },
  { id: 15, cat: "pantry",     name: "Drinking Water Dispenser Bottle (18L)",      price: "₱340",   oldPrice: null,     badge: "new",  discount: null,   rating: 4.6, image: ph(400, 300, "Water+Jug") },
  /* JANITORIAL */
  { id: 16, cat: "janitorial", name: "Industrial Floor Mop & Bucket Set",          price: "₱520",   oldPrice: "₱640",   badge: "sale", discount: "-19%", rating: 4.7, image: ph(400, 300, "Mop+Set") },
  { id: 17, cat: "janitorial", name: "Multi-Surface Disinfectant Spray (1L)",      price: "₱145",   oldPrice: null,     badge: null,   discount: null,   rating: 4.5, image: ph(400, 300, "Disinfectant") },
  { id: 18, cat: "janitorial", name: "Microfiber Cleaning Cloths (10-Pack)",       price: "₱210",   oldPrice: null,     badge: "new",  discount: null,   rating: 4.6, image: ph(400, 300, "Microfiber") },
  { id: 19, cat: "janitorial", name: "Heavy Duty Trash Bags (50 pcs)",             price: "₱130",   oldPrice: null,     badge: null,   discount: null,   rating: 4.3, image: ph(400, 300, "Trash+Bags") },
  { id: 20, cat: "janitorial", name: "Toilet Bowl Cleaner & Brush Kit",            price: "₱175",   oldPrice: "₱210",   badge: "sale", discount: "-17%", rating: 4.4, image: ph(400, 300, "Cleaner+Kit") },
  /* PERSONAL */
  { id: 21, cat: "personal",   name: "Antibacterial Hand Soap (500ml)",            price: "₱95",    oldPrice: null,     badge: null,   discount: null,   rating: 4.5, image: ph(400, 300, "Hand+Soap") },
  { id: 22, cat: "personal",   name: "Facial Tissue Box Set (3 boxes)",            price: "₱120",   oldPrice: null,     badge: "new",  discount: null,   rating: 4.3, image: ph(400, 300, "Tissue") },
  { id: 23, cat: "personal",   name: "Alcohol Gel Sanitizer (250ml)",              price: "₱75",    oldPrice: "₱95",    badge: "sale", discount: "-21%", rating: 4.6, image: ph(400, 300, "Sanitizer") },
  { id: 24, cat: "personal",   name: "Premium Laundry Powder (1kg)",               price: "₱165",   oldPrice: null,     badge: null,   discount: null,   rating: 4.2, image: ph(400, 300, "Laundry") },
  /* GIVEAWAYS */
  { id: 25, cat: "giveaways",  name: "Custom Embroidered Polo Shirt",              price: "₱480",   oldPrice: null,     badge: "new",  discount: null,   rating: 4.9, image: ph(400, 300, "Polo+Shirt") },
  { id: 26, cat: "giveaways",  name: "Corporate Tote Bag w/ Logo Print",           price: "₱220",   oldPrice: "₱280",   badge: "sale", discount: "-21%", rating: 4.7, image: ph(400, 300, "Tote+Bag") },
  { id: 27, cat: "giveaways",  name: "Personalized Tumbler (500ml)",               price: "₱350",   oldPrice: null,     badge: null,   discount: null,   rating: 4.8, image: ph(400, 300, "Tumbler") },
  /* WELLNESS */
  { id: 28, cat: "wellness",   name: "IAM Amazing Pure Organic Barley (250g)",     price: "₱850",   oldPrice: null,     badge: "new",  discount: null,   rating: 4.9, image: "/img/download-2-3.png" },
  { id: 29, cat: "wellness",   name: "Organic Barley Starter Pack (3 pouches)",    price: "₱2,200", oldPrice: "₱2,550", badge: "sale", discount: "-14%", rating: 4.8, image: "/img/download-1.png" },
  { id: 30, cat: "wellness",   name: "Barley Wellness Bundle + Shaker",            price: "₱1,450", oldPrice: null,     badge: null,   discount: null,   rating: 4.7, image: "/img/download-1-2.png" },
];

const HERO_STATS = [
  { icon: "📦", num: "250+", label: "Products Listed" },
  { icon: "🏷️", num: "6",   label: "Categories"      },
  { icon: "👥", num: "250+", label: "Happy Clients"   },
  { icon: "🚚", num: "Fast", label: "Direct Delivery" },
];

/* ── Product Card ── */
function ProductCard({ product }) {
  const [imgError, setImgError] = useState(false);
  const [added, setAdded]       = useState(false);
  const { addToCart }           = useCart();

  const handleAdd = (e) => {
    e.preventDefault();
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Link to={`/products/${product.id}`} className="pcard" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <div className="pcard__img-wrap">
        <img
          src={imgError ? ph(400, 300, product.name) : product.image}
          alt={product.name}
          className="pcard__img"
          onError={() => setImgError(true)}
        />
        <div className="pcard__badges">
          {product.badge === "new"  && <span className="pcard__badge pcard__badge--new">New</span>}
          {product.badge === "sale" && <span className="pcard__badge pcard__badge--sale">{product.discount}</span>}
        </div>
        <button className="pcard__wishlist" aria-label="Add to wishlist">🤍</button>
      </div>
      <div className="pcard__body">
        <div className="pcard__cat">{CAT_LABEL[product.cat] || product.cat}</div>
        <div className="pcard__name">{product.name}</div>
        <StarRating rating={product.rating} />
        <div className="pcard__footer">
          <div className="pcard__price-group">
            <span className="pcard__price">{product.price}</span>
            {product.oldPrice && <span className="pcard__price-old">{product.oldPrice}</span>}
          </div>
          <button
            className={`pcard__add-btn${added ? " pcard__add-btn--added" : ""}`}
            aria-label="Add to cart"
            onClick={handleAdd}
          >
            {added ? "✓" : "+"}
          </button>
        </div>
      </div>
    </Link>
  );
}

/* ── Page ── */
export default function Products() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery,    setSearchQuery]    = useState("");

  const filtered = useMemo(() => PRODUCTS.filter((p) => {
    const matchCat    = activeCategory === "all" || p.cat === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  }), [activeCategory, searchQuery]);

  const activeCatLabel = CATEGORIES.find((c) => c.id === activeCategory)?.label || "All Products";

  return (
    <div className="products-page">
      <Header />

      {/* ── HERO ── */}
      <section className="products-hero">
        <div className="container products-hero__inner">
          <div>
            <div className="products-hero__badge">
              <span className="products-hero__badge-dot" />
              JEM 8 Product Catalog
            </div>
            <h1 className="products-hero__title">
              Quality Supplies for<br /><span>Every Business Need</span>
            </h1>
            <p className="products-hero__desc">
              From office essentials to pantry supplies, janitorial products, health &amp; wellness
              items, and customized giveaways — all in one place, delivered directly to your office.
            </p>
            <div className="products-hero__actions">
              <button
                className="btn-primary"
                onClick={() => document.querySelector(".products-filter")?.scrollIntoView({ behavior: "smooth" })}
              >
                🛒 Browse Products
              </button>
              <Link to="/contact" className="btn-outline">Request a Quote →</Link>
            </div>
          </div>
          <div className="products-hero__stats">
            {HERO_STATS.map((s) => (
              <div className="products-hero__stat-card" key={s.label}>
                <div className="products-hero__stat-icon">{s.icon}</div>
                <span className="products-hero__stat-num">{s.num}</span>
                <span className="products-hero__stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORY FILTER BAR ── */}
      <div className="products-filter">
        <div className="container">
          <div className="products-filter__inner">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`products-filter__btn${activeCategory === cat.id ? " active" : ""}`}
                onClick={() => { setActiveCategory(cat.id); setSearchQuery(""); }}
              >
                <span className="products-filter__btn-icon">{cat.icon}</span>
                {cat.label}
                <span className="products-filter__count">{cat.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <section className="products-main">
        <div className="container">
          {/* Toolbar */}
          <div className="products-toolbar">
            <div className="products-toolbar__inner">
              <div className="products-toolbar__left">
                <div className="products-toolbar__search-wrap">
                  <span className="products-toolbar__search-icon">🔍</span>
                  <input
                    type="text"
                    className="products-toolbar__search-input"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="products-toolbar__results">
                Showing <strong>{filtered.length}</strong> results
                {activeCategory !== "all" && <> in <strong>{activeCatLabel}</strong></>}
                {searchQuery && <> for <strong>"{searchQuery}"</strong></>}
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="products-grid">
            {filtered.length > 0
              ? filtered.map((p) => <ProductCard key={p.id} product={p} />)
              : (
                <div className="products-empty">
                  <div className="products-empty__icon">🔍</div>
                  <div className="products-empty__title">No products found</div>
                  <p className="products-empty__desc">Try adjusting your search or browsing a different category.</p>
                </div>
              )
            }
          </div>
        </div>
      </section>

      {/* ── FEATURED WELLNESS BANNER ── */}
      <section className="products-featured">
        <div className="container">
          <div className="products-featured__inner">
            <div className="products-featured__text">
              <span className="products-featured__label">Health &amp; Wellness</span>
              <h2 className="products-featured__title">
                Try <span>IAM Amazing</span><br />Pure Organic Barley
              </h2>
              <p className="products-featured__desc">
                Packed with nutrients and antioxidants, our flagship wellness product supports a
                healthier lifestyle for you and your family. Available in single pouches or bundle packs.
              </p>
            </div>
            <div className="products-featured__actions">
              <button
                className="btn-primary"
                onClick={() => { setActiveCategory("wellness"); setSearchQuery(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              >
                Shop Wellness →
              </button>
              <Link to="/contact" className="btn-outline-light">Learn More</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="products-cta">
        <div className="container products-cta__inner">
          <h2 className="products-cta__title">Need a Bulk Order or Custom Quote?</h2>
          <p className="products-cta__sub">
            We deliver office supplies and promotional items directly to your business — at the best price.
          </p>
          <Link to="/contact" className="products-cta__btn">Contact Us Today →</Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}