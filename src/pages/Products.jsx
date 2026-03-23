import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header, Footer } from "../components/Layout";
import { useCart } from "../context/CartContext";
import axios from "axios";

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
    <div className="flex items-center gap-[3px] mb-[10px]">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={s <= Math.round(r) ? "text-[#f5a623] text-[12px]" : "text-[#e2e8f0] text-[12px]"}
        >
          ★
        </span>
      ))}
      <span className="text-[11px] text-[#64748b] ml-[3px] font-[var(--font-sub)]">
        ({r.toFixed(1)})
      </span>
    </div>
  );
}

/* ── Skeleton Card ── */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-[16px] overflow-hidden border border-[#e2e8f0] shadow-sm pointer-events-none flex flex-col">
      {/* image skeleton */}
      <div className="w-full aspect-[4/3] bg-[#e5ede9] rounded-t-[12px] overflow-hidden">
        <div
          className="w-full h-full"
          style={{
            background: "linear-gradient(90deg,#e5ede9 25%,#d0ddd6 50%,#e5ede9 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.4s infinite",
          }}
        />
      </div>
      {/* body skeleton */}
      <div className="p-[14px_16px_16px] flex flex-col gap-2">
        <div className="h-[10px] w-[50%] bg-[#e5ede9] rounded-[6px]" />
        <div className="h-[14px] w-[85%] bg-[#e5ede9] rounded-[6px]" />
        <div className="h-[14px] w-[60%] bg-[#e5ede9] rounded-[6px]" />
        <div className="h-[10px] w-[40%] bg-[#e5ede9] rounded-[6px]" />
        <div className="flex justify-between items-center mt-1">
          <div className="h-[18px] w-[30%] bg-[#e5ede9] rounded-[6px]" />
          <div className="w-[32px] h-[32px] rounded-full bg-[#e5ede9]" />
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
    <Link
      to={`/products/${productId}`}
      className="group bg-white rounded-[16px] overflow-hidden border border-[#e2e8f0] shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col cursor-pointer no-underline text-inherit hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] hover:-translate-y-[5px] hover:border-[#b8d9c8]"
      style={{ textDecoration: "none", color: "inherit", display: "flex" }}
    >
      {/* Image wrap */}
      <div className="relative w-full aspect-[4/3] bg-[#f1f5f9] overflow-hidden">
        <img
          src={imgSrc}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-[400ms] ease-in-out group-hover:scale-[1.07]"
          onError={() => setImgError(true)}
        />

        {/* Badges */}
        <div className="absolute top-[10px] left-[10px] flex flex-col gap-[5px]">
          {isOnSale && (
            <span className="inline-flex items-center justify-center px-[9px] py-[3px] rounded-[6px] text-[10px] font-semibold leading-[1.4] whitespace-nowrap bg-[#ffe2e2] text-[#9f0712] border border-[#ffc9c9]">
              Sale
            </span>
          )}
          {stock === 0 && (
            <span className="inline-flex items-center justify-center px-[9px] py-[3px] rounded-[6px] text-[10px] font-semibold leading-[1.4] whitespace-nowrap bg-[#DC2626] text-white">
              Out of Stock
            </span>
          )}
          {stock > 0 && stock <= 10 && (
            <span className="inline-flex items-center justify-center px-[9px] py-[3px] rounded-[6px] text-[10px] font-semibold leading-[1.4] whitespace-nowrap bg-[#D97706] text-white">
              Low Stock
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          className="absolute top-[10px] right-[10px] w-[32px] h-[32px] bg-white/90 rounded-full flex items-center justify-center text-[15px] opacity-0 scale-[0.8] transition-all duration-200 shadow-sm group-hover:opacity-100 group-hover:scale-100 hover:!bg-white hover:!scale-110"
          aria-label="Add to wishlist"
        >
          🤍
        </button>
      </div>

      {/* Card Body */}
      <div className="px-[16px] pt-[14px] pb-[16px] flex-1 flex flex-col">
        {catLabel && (
          <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-[1.5px] mb-[5px]">
            {catLabel}
          </div>
        )}
        <div className="text-[13.5px] font-semibold text-[#1e293b] mb-[8px] leading-[1.45] flex-1">
          {name}
        </div>

        <StarRating rating={rating} />

        {/* Footer */}
        <div className="flex items-center justify-between gap-[8px] pt-[10px] border-t border-[#e2e8f0]">
          <div className="flex items-baseline gap-[6px]">
            <span className="text-[16px] font-bold text-[#1e293b]">{price}</span>
          </div>
          <button
            className={`w-[32px] h-[32px] rounded-[8px] flex items-center justify-center text-[18px] leading-[1] flex-shrink-0 transition-all duration-200 shadow-[0_2px_8px_rgba(77,123,101,0.35)] ${
              added
                ? "bg-[#4d7b65] text-white scale-[1.08]"
                : "bg-[#4d7b65] text-white hover:bg-[#3a5e4e] hover:scale-[1.08]"
            }`}
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
    <div className="pt-[var(--header-h)] bg-white">
      <Header />

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes ph-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
      `}</style>

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden px-0"
        style={{
          background: "linear-gradient(135deg, #edf4f0 0%, #fff 55%, #f9fdf9 100%)",
          paddingTop: "clamp(64px, 9vw, 120px)",
          paddingBottom: "clamp(48px, 7vw, 88px)",
        }}
      >
        {/* decorative circles */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-140px", right: "-140px", width: "520px", height: "520px",
            background: "radial-gradient(circle, rgba(77,123,101,0.09) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "-80px", left: "-80px", width: "340px", height: "340px",
            background: "radial-gradient(circle, rgba(77,123,101,0.06) 0%, transparent 70%)",
          }}
        />

        <div
          className="relative z-[1] max-w-[1200px] mx-auto px-[24px] grid items-center gap-[56px]"
          style={{ gridTemplateColumns: "1fr 1fr" }}
        >
          {/* Left: text */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-[9px] bg-white border border-[#b8d9c8] rounded-full px-[18px] py-[7px] text-[13px] font-medium text-[#4d7b65] mb-[20px]">
              <span
                className="w-[6px] h-[6px] bg-[#4d7b65] rounded-full"
                style={{ animation: "ph-pulse 2s infinite" }}
              />
              JEM 8 Product Catalog
            </div>

            <h1
              className="font-bold text-[#1e293b] leading-[1.15] mb-[18px]"
              style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(32px, 4.5vw, 56px)" }}
            >
              Quality Supplies for<br />
              <span className="text-[#4d7b65] italic">Every Business Need</span>
            </h1>

            <p
              className="text-[#64748b] leading-[1.8] max-w-[480px] mb-[36px]"
              style={{ fontSize: "clamp(14px, 1.5vw, 17px)" }}
            >
              From office essentials to pantry supplies, janitorial products, health &amp; wellness
              items, and customized giveaways — all in one place, delivered directly to your office.
            </p>

            <div className="flex items-center gap-[14px] flex-wrap">
              <button
                className="inline-flex items-center gap-[8px] px-[28px] py-[13px] bg-[#4d7b65] text-white rounded-[10px] font-semibold text-[15px] shadow-[0_4px_16px_rgba(77,123,101,0.35)] transition-all duration-200 hover:bg-[#3a5e4e] hover:-translate-y-[2px]"
                onClick={() => document.querySelector(".products-filter-bar")?.scrollIntoView({ behavior: "smooth" })}
              >
                🛒 Browse Products
              </button>
              <Link
                to="/contact"
                className="inline-flex items-center gap-[8px] px-[28px] py-[13px] bg-transparent border-2 border-[#4d7b65] text-[#4d7b65] rounded-[10px] font-semibold text-[15px] transition-all duration-200 hover:bg-[#edf4f0] hover:-translate-y-[2px] no-underline"
              >
                Request a Quote →
              </Link>
            </div>
          </div>

          {/* Right: stats grid */}
          <div className="grid grid-cols-2 gap-[16px]">
            {HERO_STATS.map((s) => (
              <div
                key={s.label}
                className="bg-white border border-[#e2e8f0] rounded-[16px] p-[24px_20px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-300 text-center hover:shadow-[0_8px_28px_rgba(0,0,0,0.1)] hover:-translate-y-[3px] hover:border-[#b8d9c8]"
              >
                <div className="text-[28px] mb-[8px]">{s.icon}</div>
                <span className="block text-[26px] font-bold text-[#4d7b65] leading-[1] mb-[4px]" style={{ fontFamily: "var(--font-heading)" }}>
                  {s.num}
                </span>
                <span className="text-[12px] text-[#64748b] font-medium uppercase tracking-[1px]">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORY FILTER BAR ── */}
      <div
        className="products-filter-bar bg-white border-b border-[#e2e8f0] sticky z-[100] shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
        style={{ top: "var(--header-h)" }}
      >
        <div className="max-w-[1200px] mx-auto px-[24px]">
          <div
            className="flex items-center gap-[10px] py-[16px] overflow-x-auto"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    style={{ height: "38px", width: `${80 + i * 20}px`, borderRadius: "24px", background: "#e5ede9", flexShrink: 0 }}
                  />
                ))
              : categoryTabs.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { setActiveCategory(cat.id); setSearchQuery(""); }}
                      className={`inline-flex items-center gap-[8px] px-[18px] py-[9px] rounded-full text-[13px] font-medium whitespace-nowrap flex-shrink-0 border-[1.5px] transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-[#4d7b65] text-white border-[#4d7b65] shadow-[0_2px_8px_rgba(77,123,101,0.35)]"
                          : "bg-[#f1f5f9] text-[#64748b] border-transparent hover:text-[#4d7b65] hover:bg-[#edf4f0] hover:border-[#b8d9c8]"
                      }`}
                    >
                      <span className="text-[15px]">{cat.icon}</span>
                      {cat.label}
                      <span
                        className={`inline-flex items-center justify-center min-w-[20px] h-[20px] px-[6px] rounded-full text-[11px] font-bold ${
                          isActive
                            ? "bg-white/25 text-white"
                            : "bg-[rgba(77,123,101,0.12)] text-[#4d7b65]"
                        }`}
                      >
                        {cat.count}
                      </span>
                    </button>
                  );
                })
            }
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <section className="pb-[clamp(64px,8vw,120px)]">
        <div className="max-w-[1200px] mx-auto px-[24px]">

          {/* Toolbar */}
          <div className="pt-[24px]">
            <div className="flex items-center justify-between gap-[16px] flex-wrap mb-[24px]">
              {/* Left: search + sort */}
              <div className="flex items-center gap-[10px] flex-1 min-w-[240px]">
                {/* Search */}
                <div className="relative flex-1 max-w-[360px]">
                  <span className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[14px] text-[#94a3b8] pointer-events-none">
                    🔍
                  </span>
                  <input
                    type="text"
                    className="w-full h-[42px] pl-[36px] pr-[14px] bg-[#f1f5f9] border-[1.5px] border-transparent rounded-[10px] text-[14px] text-[#1e293b] outline-none transition-all duration-200 focus:border-[#4d7b65] focus:bg-white focus:shadow-[0_0_0_3px_rgba(77,123,101,0.15)] placeholder:text-[#94a3b8]"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-[6px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[#94a3b8] text-[14px] px-[6px] hover:text-[#64748b]"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Sort */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="pl-[12px] pr-[32px] py-[8px] border border-[#D1FAE5] rounded-[8px] bg-white text-[13px] text-[#374151] cursor-pointer outline-none appearance-none"
                  >
                    <option value="default">Sort: Default</option>
                    <option value="price-asc">Price: Low → High</option>
                    <option value="price-desc">Price: High → Low</option>
                    <option value="name-az">Name: A → Z</option>
                    <option value="name-za">Name: Z → A</option>
                    <option value="sale">On Sale First</option>
                  </select>
                  <div className="absolute right-[10px] top-1/2 -translate-y-1/2 pointer-events-none text-[#94a3b8] text-[11px]">
                    ▾
                  </div>
                </div>
              </div>

              {/* Results count */}
              <div className="text-[14px] text-[#64748b] whitespace-nowrap">
                {loading
                  ? "Loading products…"
                  : (
                    <>
                      Showing <strong className="text-[#1e293b] font-semibold">{filtered.length}</strong> result{filtered.length !== 1 ? "s" : ""}
                      {activeCategory !== "all" && <> in <strong className="text-[#1e293b] font-semibold">{activeCatLabel}</strong></>}
                      {searchQuery && <> for <strong className="text-[#1e293b] font-semibold">"{searchQuery}"</strong></>}
                    </>
                  )
                }
              </div>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="text-center py-[60px] px-[20px] text-[#DC2626]">
              <div className="text-[40px] mb-[12px]">⚠️</div>
              <p className="text-[15px] font-medium">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-[12px] px-[20px] py-[9px] bg-[#155DFC] text-white border-none rounded-[8px] cursor-pointer text-[13px] font-semibold hover:bg-[#1248cc] transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Grid */}
          {!error && (
            <div
              className="grid gap-[22px]"
              style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
            >
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                : filtered.length > 0
                  ? filtered.map((p, i) => (
                      <ProductCard key={(p.id ?? p.product_id) ?? i} product={p} />
                    ))
                  : (
                    <div className="col-span-full text-center py-[80px] px-[24px]">
                      <div className="text-[56px] mb-[16px]">🔍</div>
                      <div className="text-[22px] font-bold text-[#1e293b] mb-[8px]" style={{ fontFamily: "var(--font-heading)" }}>
                        No products found
                      </div>
                      <p className="text-[15px] text-[#64748b]">
                        Try adjusting your search or browsing a different category.
                      </p>
                      <button
                        onClick={() => { setActiveCategory("all"); setSearchQuery(""); setSortBy("default"); }}
                        className="mt-[14px] px-[20px] py-[9px] bg-[#155DFC] text-white border-none rounded-[8px] cursor-pointer text-[13px] font-semibold hover:bg-[#1248cc] transition-colors"
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
      <section
        className="relative overflow-hidden mb-[clamp(48px,7vw,88px)]"
        style={{
          background: "#1e293b",
          padding: "clamp(48px, 7vw, 88px) 0",
        }}
      >
        {/* decorative glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-60px", left: "50%", transform: "translateX(-50%)",
            width: "500px", height: "500px",
            background: "radial-gradient(circle, rgba(77,123,101,0.25) 0%, transparent 65%)",
          }}
        />
        <div className="relative z-[1] max-w-[1200px] mx-auto px-[24px] flex items-center justify-between gap-[40px] flex-wrap">
          {/* Text */}
          <div className="flex-1 min-w-[280px]">
            <span className="inline-block bg-[rgba(77,123,101,0.25)] text-[#4d7b65] text-[11px] font-bold tracking-[3px] uppercase px-[14px] py-[5px] rounded-full mb-[14px]">
              Health &amp; Wellness
            </span>
            <h2
              className="font-bold text-white mb-[12px] leading-[1.25]"
              style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(24px, 3vw, 38px)" }}
            >
              Try <span className="text-[#4d7b65]">IAM Amazing</span><br />
              Pure Organic Barley
            </h2>
            <p className="text-[15px] text-white/65 leading-[1.7]">
              Packed with nutrients and antioxidants, our flagship wellness product supports a
              healthier lifestyle for you and your family. Available in single pouches or bundle packs.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-[14px] flex-wrap">
            <button
              className="inline-flex items-center gap-[8px] px-[28px] py-[13px] bg-[#4d7b65] text-white rounded-[10px] font-semibold text-[15px] shadow-[0_4px_16px_rgba(77,123,101,0.35)] transition-all duration-200 hover:bg-[#3a5e4e] hover:-translate-y-[2px]"
              onClick={() => {
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
            <Link
              to="/contact"
              className="inline-flex items-center gap-[8px] px-[28px] py-[13px] bg-transparent border-2 border-white/30 text-white rounded-[10px] font-semibold text-[15px] transition-all duration-200 hover:border-white/60 hover:-translate-y-[2px] no-underline"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        className="relative overflow-hidden text-center"
        style={{
          background: "linear-gradient(135deg, #4d7b65 0%, #3a5e4e 100%)",
          padding: "clamp(60px, 8vw, 100px) 0",
        }}
      >
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            top: "-60px", right: "-60px",
            width: "280px", height: "280px",
            background: "rgba(255,255,255,0.06)",
          }}
        />
        <div className="relative z-[1] max-w-[1200px] mx-auto px-[24px]">
          <h2
            className="font-bold text-white mb-[12px] leading-[1.25]"
            style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(24px, 3.5vw, 42px)" }}
          >
            Need a Bulk Order or Custom Quote?
          </h2>
          <p className="text-[16px] text-white/75 mb-[36px]">
            We deliver office supplies and promotional items directly to your business — at the best price.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-[10px] px-[38px] py-[15px] bg-white text-[#4d7b65] rounded-[10px] text-[16px] font-bold shadow-[0_8px_28px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_14px_36px_rgba(0,0,0,0.22)] hover:bg-[#f0faf5] no-underline"
          >
            Contact Us Today →
          </Link>
        </div>
      </section>

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