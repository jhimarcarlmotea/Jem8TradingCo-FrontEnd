import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header, Footer } from "../components/Layout";
import { useCart } from "../context/CartContext";
import axios from "axios";
import "../style/global.css";
import "../style/products.css";

const BASE = "http://127.0.0.1:8000";

const ph = (w, h, label = "") =>
  `https://placehold.co/${w}x${h}/edf4f0/4d7b65?text=${encodeURIComponent(label)}`;

const HERO_STATS = [
  { icon: "📦", num: "250+", label: "Products Listed" },
  { icon: "🏷️", num: "6",   label: "Categories"      },
  { icon: "👥", num: "250+", label: "Happy Clients"   },
  { icon: "🚚", num: "Fast", label: "Direct Delivery" },
];

/* ── Star Rating ── */
function StarRating({ rating }) {
  const r = parseFloat(rating) || 0;
  return (
    <div className="pcard__stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= Math.round(r) ? "pcard__star" : "pcard__star--empty"}>★</span>
      ))}
      <span className="pcard__rating">({r.toFixed(1)})</span>
    </div>
  );
}

/* ── Skeleton Card ── */
function SkeletonCard() {
  return (
    <div className="pcard" style={{ pointerEvents: "none" }}>
      <div className="pcard__img-wrap" style={{ background: "#e5ede9", borderRadius: "12px 12px 0 0" }}>
        <div style={{ width: "100%", aspectRatio: "4/3", background: "linear-gradient(90deg,#e5ede9 25%,#d0ddd6 50%,#e5ede9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
      </div>
      <div className="pcard__body">
        <div style={{ height: "10px", width: "50%", background: "#e5ede9", borderRadius: "6px", marginBottom: "8px" }} />
        <div style={{ height: "14px", width: "85%", background: "#e5ede9", borderRadius: "6px", marginBottom: "6px" }} />
        <div style={{ height: "14px", width: "60%", background: "#e5ede9", borderRadius: "6px", marginBottom: "12px" }} />
        <div style={{ height: "10px", width: "40%", background: "#e5ede9", borderRadius: "6px", marginBottom: "14px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ height: "18px", width: "30%", background: "#e5ede9", borderRadius: "6px" }} />
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#e5ede9" }} />
        </div>
      </div>
    </div>
  );
}

/* ── Product Card ── */
function ProductCard({ product }) {
  const [imgError, setImgError] = useState(false);
  const [added, setAdded]       = useState(false);
  const { addToCart }           = useCart();

  // Normalise fields from API response
  const productId = product.id ?? product.product_id;
  const name      = product.product_name ?? product.name ?? "Product";
  const priceRaw = parseFloat(product.price ?? 0);
  const price    = `₱${priceRaw.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  const isOnSale = product.isSale == 1;
  const catRaw   = product.category;
  const catLabel = typeof catRaw === "object" && catRaw !== null
    ? (catRaw.name ?? catRaw.category_name ?? "")
    : (catRaw ?? product.category_name ?? "");
  const rating   = parseFloat(product.rating ?? 4.5);
  const stock    = Number(product.product_stocks ?? product.stock ?? 0);

  // Resolve image
  const rawImg = product.images?.[0]?.image_path;
  const imgSrc = imgError || !rawImg
    ? ph(400, 300, name)
    : `${BASE}/storage/${rawImg}`;

  const handleAdd = (e) => {
    e.preventDefault();
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Link to={`/products/${productId}`} className="pcard" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <div className="pcard__img-wrap">
        <img
          src={imgSrc}
          alt={name}
          className="pcard__img"
          onError={() => setImgError(true)}
        />
        <div className="pcard__badges">
          {isOnSale && <span className="pcard__badge pcard__badge--sale">Sale</span>}
          {stock === 0 && <span className="pcard__badge" style={{ background: "#DC2626", color: "#fff" }}>Out of Stock</span>}
          {stock > 0 && stock <= 10 && <span className="pcard__badge" style={{ background: "#D97706", color: "#fff" }}>Low Stock</span>}
        </div>
        <button className="pcard__wishlist" aria-label="Add to wishlist">🤍</button>
      </div>
      <div className="pcard__body">
        {catLabel && <div className="pcard__cat">{catLabel}</div>}
        <div className="pcard__name">{name}</div>
        <StarRating rating={rating} />
        <div className="pcard__footer">
          <div className="pcard__price-group">
            <span className="pcard__price">{price}</span>
          </div>
          <button
            className={`pcard__add-btn${added ? " pcard__add-btn--added" : ""}`}
            aria-label="Add to cart"
            onClick={handleAdd}
            disabled={stock === 0}
            style={stock === 0 ? { opacity: 0.4, cursor: "not-allowed" } : {}}
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
  const [products, setProducts]             = useState([]);
  const [categories, setCategories]         = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery]       = useState("");
  const [sortBy, setSortBy]                 = useState("default");

  // ── Fetch products & categories ──
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [prodRes, catRes] = await Promise.all([
          axios.get(`${BASE}/api/admin/products`, { withCredentials: true }),
          axios.get(`${BASE}/api/categories`, { withCredentials: true }),
        ]);

        const prodData = prodRes.data?.data ?? prodRes.data?.products ?? prodRes.data;
        const catData  = catRes.data?.categories ?? catRes.data?.data ?? catRes.data;

        setProducts(Array.isArray(prodData) ? prodData : []);
        setCategories(Array.isArray(catData) ? catData : []);
      } catch (err) {
        console.error("Failed to fetch:", err);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Build category tabs from API ──
  const categoryTabs = useMemo(() => {
    const all = { id: "all", label: "All Products", icon: "🛒", count: products.length };
    const tabs = categories.map(cat => {
      const catId   = String(cat.id ?? cat.category_id);
      const label   = cat.name ?? cat.category_name ?? cat.title ?? "Other";
      const count   = products.filter(p => {
        const pCatId = String(p.category_id ?? p.category?.id ?? "");
        return pCatId === catId;
      }).length;
      return { id: catId, label, icon: resolveCatIcon(label), count };
    });
    return [all, ...tabs];
  }, [categories, products]);

  // ── Filter + sort ──
  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const name     = (p.product_name ?? p.name ?? "").toLowerCase();
      const catId    = String(p.category_id ?? p.category?.id ?? p.category?.category_id ?? "");
      const matchCat = activeCategory === "all" || catId === activeCategory;
      const matchQ   = name.includes(searchQuery.toLowerCase());
      return matchCat && matchQ;
    });

    if (sortBy === "price-asc")  list = [...list].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    if (sortBy === "price-desc") list = [...list].sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    if (sortBy === "name-az")    list = [...list].sort((a, b) => (a.product_name ?? a.name ?? "").localeCompare(b.product_name ?? b.name ?? ""));
    if (sortBy === "name-za")    list = [...list].sort((a, b) => (b.product_name ?? b.name ?? "").localeCompare(a.product_name ?? a.name ?? ""));
    if (sortBy === "sale")       list = [...list].sort((a, b) => (b.isSale == 1 ? 1 : 0) - (a.isSale == 1 ? 1 : 0));

    return list;
  }, [products, activeCategory, searchQuery, sortBy]);

  const activeCatLabel = categoryTabs.find(c => c.id === activeCategory)?.label ?? "All Products";

  return (
    <div className="products-page">
      <Header />

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>

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
            {loading
              ? /* skeleton tabs */
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ height: "38px", width: `${80 + i * 20}px`, borderRadius: "24px", background: "#e5ede9", flexShrink: 0 }} />
                ))
              : categoryTabs.map((cat) => (
                  <button
                    key={cat.id}
                    className={`products-filter__btn${activeCategory === cat.id ? " active" : ""}`}
                    onClick={() => { setActiveCategory(cat.id); setSearchQuery(""); }}
                  >
                    <span className="products-filter__btn-icon">{cat.icon}</span>
                    {cat.label}
                    <span className="products-filter__count">{cat.count}</span>
                  </button>
                ))
            }
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
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: "14px", padding: "0 6px" }}
                    >✕</button>
                  )}
                </div>

                {/* Sort */}
                <div style={{ position: "relative" }}>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    style={{
                      padding: "8px 32px 8px 12px", border: "1px solid #D1FAE5",
                      borderRadius: "8px", background: "#fff", fontSize: "13px",
                      color: "#374151", cursor: "pointer", outline: "none",
                      appearance: "none", WebkitAppearance: "none"
                    }}
                  >
                    <option value="default">Sort: Default</option>
                    <option value="price-asc">Price: Low → High</option>
                    <option value="price-desc">Price: High → Low</option>
                    <option value="name-az">Name: A → Z</option>
                    <option value="name-za">Name: Z → A</option>
                    <option value="sale">On Sale First</option>
                  </select>
                  <div style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94A3B8", fontSize: "11px" }}>▾</div>
                </div>
              </div>

              <div className="products-toolbar__results">
                {loading
                  ? "Loading products…"
                  : <>Showing <strong>{filtered.length}</strong> result{filtered.length !== 1 ? "s" : ""}
                    {activeCategory !== "all" && <> in <strong>{activeCatLabel}</strong></>}
                    {searchQuery && <> for <strong>"{searchQuery}"</strong></>}
                  </>
                }
              </div>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#DC2626" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>⚠️</div>
              <p style={{ fontSize: "15px", fontWeight: 500 }}>{error}</p>
              <button
                onClick={() => window.location.reload()}
                style={{ marginTop: "12px", padding: "9px 20px", background: "#155DFC", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Grid */}
          {!error && (
            <div className="products-grid">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                : filtered.length > 0
                  ? filtered.map((p, i) => <ProductCard key={(p.id ?? p.product_id) ?? i} product={p} />)
                  : (
                    <div className="products-empty">
                      <div className="products-empty__icon">🔍</div>
                      <div className="products-empty__title">No products found</div>
                      <p className="products-empty__desc">
                        Try adjusting your search or browsing a different category.
                      </p>
                      <button
                        onClick={() => { setActiveCategory("all"); setSearchQuery(""); setSortBy("default"); }}
                        style={{ marginTop: "14px", padding: "9px 20px", background: "#155DFC", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
                      >
                        Clear Filters
                      </button>
                    </div>
                  )
              }
            </div>
          )}
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
                onClick={() => {
                  // find wellness category id from fetched data
                  const wellnessCat = categories.find(c =>
                    (c.name ?? c.category_name ?? "").toLowerCase().includes("wellness") ||
                    (c.name ?? c.category_name ?? "").toLowerCase().includes("health")
                  );
                  if (wellnessCat) setActiveCategory(String(wellnessCat.id ?? wellnessCat.category_id));
                  setSearchQuery("");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
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

/* ── Icon mapper based on category name keywords ── */
function resolveCatIcon(label = "") {
  const l = label.toLowerCase();
  if (l.includes("office"))     return "🖊️";
  if (l.includes("pantry") || l.includes("food") || l.includes("coffee")) return "☕";
  if (l.includes("janitor") || l.includes("clean")) return "🧹";
  if (l.includes("personal") || l.includes("care") || l.includes("home")) return "🧴";
  if (l.includes("giveaway") || l.includes("custom") || l.includes("promo")) return "🎁";
  if (l.includes("wellness") || l.includes("health")) return "🌿";
  if (l.includes("paper") || l.includes("bond"))  return "📄";
  return "📦";
}