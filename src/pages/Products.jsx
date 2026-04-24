import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Header, Footer } from "../components/Layout";
import { useCart } from "../context/CartContext";
import axios from "axios";

// ── CATEGORY THEME MAP ──────────────────────────────────────────────────────
const CATEGORY_THEMES = {
  all: {
    bg: "linear-gradient(135deg, #edf4f0 0%, #fff 55%, #f9fdf9 100%)",
    accent: "#4d7b65",
    label: "All Products",
  },
  office: {
    bg: "linear-gradient(135deg, #fdf0f0 0%, #fff 55%, #fff5f5 100%)",
    accent: "#e03131",
    label: "Office Supplies",
  },
  pantry: {
    bg: "linear-gradient(135deg, #fff7ed 0%, #fff 55%, #fffbf5 100%)",
    accent: "#ea6c00",
    label: "Pantry Supplies",
  },
  janitor: {
    bg: "linear-gradient(135deg, #edfaf0 0%, #fff 55%, #f4fdf6 100%)",
    accent: "#2e8b57",
    label: "Janitorial Supplies",
  },
  personal: {
    bg: "linear-gradient(135deg, #e6fafa 0%, #fff 55%, #f0fafa 100%)",
    accent: "#0d9488",
    label: "Personal/Home Care",
  },
  wellness: {
    bg: "linear-gradient(135deg, #e6fafa 0%, #fff 55%, #f0fafa 100%)",
    accent: "#0d9488",
    label: "Wellness Supplies",
  },
  giveaway: {
    bg: "linear-gradient(135deg, #f8f0ff 0%, #fff 55%, #faf5ff 100%)",
    accent: "#7c3aed",
    label: "Promotional Items",
  },
  promo: {
    bg: "linear-gradient(135deg, #f8f0ff 0%, #fff 55%, #faf5ff 100%)",
    accent: "#7c3aed",
    label: "Promotional Items",
  },
};

function resolveThemeKey(label = "") {
  const l = label.toLowerCase();
  if (l.includes("office"))                            return "office";
  if (l.includes("pantry") || l.includes("food"))     return "pantry";
  if (l.includes("janitor") || l.includes("clean"))   return "janitor";
  if (l.includes("personal") || l.includes("home"))   return "personal";
  if (l.includes("wellness") || l.includes("health")) return "wellness";
  if (l.includes("giveaway") || l.includes("promo") || l.includes("custom")) return "giveaway";
  return "all";
}

const BASE = "http://127.0.0.1:8000";

const ph = (w, h, label = "") =>
  `https://placehold.co/${w}x${h}/edf4f0/4d7b65?text=${encodeURIComponent(label)}`;

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
      <div className="p-[14px_16px_16px] flex flex-col gap-2">
        <div className="h-[10px] w-[50%] bg-[#e5ede9] rounded-[6px]" />
        <div className="h-[14px] w-[85%] bg-[#e5ede9] rounded-[6px]" />
        <div className="h-[14px] w-[60%] bg-[#e5ede9] rounded-[6px]" />
        <div className="h-[10px] w-[40%] bg-[#e5ede9] rounded-[6px]" />
        <div className="flex items-center justify-between mt-1">
          <div className="h-[18px] w-[30%] bg-[#e5ede9] rounded-[6px]" />
          <div className="w-[32px] h-[32px] rounded-full bg-[#e5ede9]" />
        </div>
      </div>
    </div>
  );
}

/* ── Toast Notification ── */
function ToastContainer({ toasts }) {
  return (
    <div className="fixed bottom-[24px] right-[24px] z-[9999] flex flex-col gap-[10px] pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-[12px] bg-[#1e293b] text-white px-[16px] py-[13px] rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.28)] min-w-[260px] max-w-[340px]"
          style={{ animation: "toast-slide 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          <div className="w-[36px] h-[36px] bg-[#4d7b65] rounded-[10px] flex items-center justify-center text-[18px] flex-shrink-0">
            🛒
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-white/50 font-medium uppercase tracking-[0.8px]">Added to cart</span>
            <span className="text-[13px] font-semibold leading-[1.3] truncate">{t.name}</span>
          </div>
          <span className="ml-auto text-[#4d7b65] text-[20px] flex-shrink-0 font-bold">✓</span>
        </div>
      ))}
    </div>
  );
}

/* ── Product Card ── */
function ProductCard({ product, onToast }) {
  const [imgError, setImgError] = useState(false);
  const [added, setAdded]       = useState(false);
  const [adding, setAdding]     = useState(false);
  const { addToCart }           = useCart();

  const productId = product.id ?? product.product_id;
  const name      = product.product_name ?? product.name ?? "Product";
  const priceRaw  = parseFloat(product.price ?? 0);
  const price     = `₱${priceRaw.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  const isOnSale  = product.isSale == 1;
  const catRaw    = product.category;
  const catLabel  = typeof catRaw === "object" && catRaw !== null
    ? (catRaw.name ?? catRaw.category_name ?? "")
    : (catRaw ?? product.category_name ?? "");
  const rating    = parseFloat(product.rating ?? 4.5);
const stock = product.status === "out_of_stock" ? 0 : 1;

  const rawImg = product.images?.[0]?.image_path;
  const imgSrc = imgError || !rawImg
    ? ph(400, 300, name)
    : `${BASE}/storage/${rawImg}`;

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (stock === 0 || adding) return;

    setAdding(true);
    try {
      await axios.post(
        `${BASE}/api/cart/add`,
        { product_id: productId, quantity: 1 },
        { withCredentials: true }
      );
      addToCart(product, 1);
      setAdded(true);
      onToast(name);
      setTimeout(() => setAdded(false), 1500);
    } catch (err) {
      console.error("Add to cart failed:", err.response ?? err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="group relative bg-white rounded-[16px] overflow-hidden border border-[#e2e8f0] shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] hover:-translate-y-[5px] hover:border-[#b8d9c8]">
      <Link
        to={`/products/${productId}`}
        className="flex flex-col flex-1 no-underline text-inherit"
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <div className="relative w-full aspect-[4/3] bg-[#f1f5f9] overflow-hidden">
          <img
            src={imgSrc}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-[400ms] ease-in-out group-hover:scale-[1.07]"
            onError={() => setImgError(true)}
          />
          <div className="absolute top-[10px] left-[10px] flex flex-col gap-[5px]">
        {isOnSale && (
          <span className="inline-flex items-center justify-center px-[9px] py-[3px] rounded-[6px] text-[10px] font-semibold leading-[1.4] whitespace-nowrap bg-[#ffe2e2] text-[#9f0712] border border-[#ffc9c9]">
            Sale
          </span>
        )}
  {product.status === "out_of_stock" ? (
          <span className="inline-flex items-center justify-center px-[9px] py-[3px] rounded-[6px] text-[10px] font-semibold leading-[1.4] whitespace-nowrap bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]">
            Out of Stock
          </span>
        ) : product.status === "pre_order" ? (
          <span className="inline-flex items-center justify-center px-[9px] py-[3px] rounded-[6px] text-[10px] font-semibold leading-[1.4] whitespace-nowrap bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
            Pre-Order
          </span>
        ) : (
          <span className="inline-flex items-center justify-center px-[9px] py-[3px] rounded-[6px] text-[10px] font-semibold leading-[1.4] whitespace-nowrap bg-[#D1FAE5] text-[#065F46] border border-[#6EE7B7]">
            In Stock
          </span>
        )}
      </div>
          
        </div>

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
          <div className="flex items-center justify-between gap-[8px] pt-[10px] border-t border-[#e2e8f0]">
            <span className="text-[16px] font-bold text-[#1e293b]">{price}</span>
            <div className="w-[32px] h-[32px] flex-shrink-0" />
          </div>
        </div>
      </Link>

 <button
  className={`absolute bottom-[16px] right-[16px] w-[32px] h-[32px] rounded-[8px] flex items-center justify-center text-[18px] leading-[1] flex-shrink-0 transition-all duration-200 z-10 ${
    stock === 0
      ? "bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed"
      : added
      ? "bg-[#4d7b65] text-white scale-[1.08] shadow-[0_2px_8px_rgba(77,123,101,0.35)]"
      : adding
      ? "bg-[#7aaa93] text-white cursor-wait shadow-[0_2px_8px_rgba(77,123,101,0.35)]"
      : "bg-[#4d7b65] text-white hover:bg-[#3a5e4e] hover:scale-[1.08] shadow-[0_2px_8px_rgba(77,123,101,0.35)]"
  }`}
  aria-label={stock === 0 ? "Out of stock" : "Add to cart"}
  onClick={handleAdd}
  disabled={adding || stock === 0}
  title={stock === 0 ? "Out of stock" : "Add to cart"}
>
  {stock === 0 ? "✕" : added ? "✓" : adding ? "…" : "+"}
</button>
    </div>
  );
}

/* ── Hero Category Badge — same pill style for ALL categories ── */
function HeroCategoryBadge({ accent, label, visible }) {
  return (
    <div
      className={`mb-[20px] category-badge ${visible ? "visible" : "hidden"}`}
    >
      <div
        className="inline-flex items-center gap-[9px] bg-white border rounded-full px-[18px] py-[7px] text-[13px] font-medium"
        style={{ borderColor: `${accent}55`, color: accent, transition: "border-color 0.4s, color 0.4s" }}
      >
        <span
          className="w-[6px] h-[6px] rounded-full flex-shrink-0"
          style={{ background: accent, animation: "ph-pulse 2s infinite" }}
        />
        {label}
      </div>
    </div>
  );
}
    function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex items-center justify-end gap-[6px] mt-[16px] pb-[8px]">
      {/* First page */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="w-[36px] h-[36px] rounded-[8px] flex items-center justify-center text-[13px] font-medium border transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: currentPage === 1 ? "#f1f5f9" : "white",
          borderColor: "#e2e8f0",
          color: "#64748b",
        }}
        title="First page"
      >
        «
      </button>

      {/* Prev page */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-[36px] h-[36px] rounded-[8px] flex items-center justify-center text-[13px] font-medium border transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: "white",
          borderColor: "#e2e8f0",
          color: "#64748b",
        }}
        title="Previous page"
      >
        ‹
      </button>

      {/* Page numbers */}
      {getPages().map((page, idx) =>
        page === "..." ? (
          <span
            key={`ellipsis-${idx}`}
            className="w-[36px] h-[36px] flex items-center justify-center text-[13px] text-[#94a3b8]"
          >
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className="w-[36px] h-[36px] rounded-[8px] flex items-center justify-center text-[13px] font-semibold border transition-all duration-150"
            style={{
              background: currentPage === page ? "#4d7b65" : "white",
              borderColor: currentPage === page ? "#4d7b65" : "#e2e8f0",
              color: currentPage === page ? "white" : "#374151",
              boxShadow: currentPage === page ? "0 2px 8px rgba(77,123,101,0.35)" : "none",
            }}
          >
            {page}
          </button>
        )
      )}

      {/* Next page */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-[36px] h-[36px] rounded-[8px] flex items-center justify-center text-[13px] font-medium border transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: "white",
          borderColor: "#e2e8f0",
          color: "#64748b",
        }}
        title="Next page"
      >
        ›
      </button>

      {/* Last page */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="w-[36px] h-[36px] rounded-[8px] flex items-center justify-center text-[13px] font-medium border transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: currentPage === totalPages ? "#f1f5f9" : "white",
          borderColor: "#e2e8f0",
          color: "#64748b",
        }}
        title="Last page"
      >
        »
      </button>
    </div>
  );
}
/* ── Page ── */
export default function Products() {
  const [products, setProducts]             = useState([]);
  const [categories, setCategories]         = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeCatName, setActiveCatName]   = useState("all");
  const [searchQuery, setSearchQuery]       = useState("");
  const [sortBy, setSortBy]                 = useState("default");
  const [toasts, setToasts]                 = useState([]);
  const [badgeVisible, setBadgeVisible]     = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const [heroStats, setHeroStats]           = useState({
    productCount:  0,
    categoryCount: 0,
    happyClients:  0,
  });

  const [searchParams] = useSearchParams();

  const themeKey = resolveThemeKey(activeCatName);
  const theme    = CATEGORY_THEMES[themeKey] ?? CATEGORY_THEMES.all;

  // Resolve badge label: "All Products" for all, or the active category label
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

  const activeCatLabel = categoryTabs.find(c => c.id === activeCategory)?.label ?? "All Products";

  const showToast = (name) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, name }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const switchCategory = (catId, catName) => {
  setBadgeVisible(false);
  setTimeout(() => {
    setActiveCategory(catId);
    setActiveCatName(catName);
    setSearchQuery("");
    setCurrentPage(1);
    setBadgeVisible(true);
  }, 220);
};

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [prodRes, catRes, reviewRes] = await Promise.all([
          axios.get(`${BASE}/api/admin/products`, { withCredentials: true }),
          axios.get(`${BASE}/api/categories`,     { withCredentials: true }),
          axios.get(`${BASE}/api/reviews`,         { withCredentials: true }),
        ]);

        console.log(prodRes);

        const prodData   = prodRes.data?.data ?? prodRes.data?.products ?? prodRes.data;
        const catData    = catRes.data?.categories ?? catRes.data?.data ?? catRes.data;
        const reviewData = reviewRes.data?.data ?? reviewRes.data?.reviews ?? reviewRes.data;

        const prodArray   = Array.isArray(prodData)   ? prodData   : [];
        const catArray    = Array.isArray(catData)    ? catData    : [];
        const reviewArray = Array.isArray(reviewData) ? reviewData : [];

        const happyClients = reviewArray.filter(
          r => parseFloat(r.rating ?? r.stars ?? 0) >= 3
        ).length;

        setProducts(prodArray);
        setCategories(catArray);
        setHeroStats({
          productCount:  prodArray.length,
          categoryCount: catArray.length,
          happyClients,
        });
      } catch (err) {
        console.error("Failed to fetch:", err);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);
    useEffect(() => {
  setCurrentPage(1);
}, [searchQuery, sortBy]);
  useEffect(() => {
    const param = searchParams.get("category");
    if (!param || categories.length === 0) return;

    const match = categories.find(cat => {
      const label = (cat.name ?? cat.category_name ?? "").toLowerCase();
      return label.includes(param.toLowerCase());
    });

    if (match) {
      const id    = String(match.id ?? match.category_id);
      const label = match.name ?? match.category_name ?? "";
      switchCategory(id, label);
    }
  }, [searchParams, categories]);

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
      const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
const paginated = filtered.slice(
  (currentPage - 1) * ITEMS_PER_PAGE,
  currentPage * ITEMS_PER_PAGE
);
  const HERO_STATS = [
    { icon: "📦", num: heroStats.productCount,  label: "Products Listed" },
    { icon: "🏷️", num: heroStats.categoryCount, label: "Categories"      },
    { icon: "👥", num: heroStats.happyClients,  label: "Happy Clients"   },
    { icon: "🚚", num: "Fast",                  label: "Direct Delivery" },
  ];

  return (
    <div className="bg-white">
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
        @keyframes toast-slide {
          0%   { opacity: 0; transform: translateX(60px) scale(0.92); }
          100% { opacity: 1; transform: translateX(0)    scale(1);    }
        }
        @keyframes badge-pop {
          0%   { opacity: 0; transform: scale(0.85) translateY(4px); }
          100% { opacity: 1; transform: scale(1)    translateY(0);   }
        }
        .hero-bg-layer { transition: background 0.5s ease; }
        .category-badge { transition: opacity 0.22s ease, transform 0.22s ease; }
        .category-badge.hidden  { opacity: 0; transform: scale(0.88) translateY(4px); }
        .category-badge.visible { opacity: 1; transform: scale(1) translateY(0); animation: badge-pop 0.3s cubic-bezier(0.34,1.56,0.64,1); }
      `}</style>

      <ToastContainer toasts={toasts} />

      {/* ── HERO ── */}
      <section
        className="relative px-0 overflow-hidden hero-bg-layer"
        style={{
          background: theme.bg,
          paddingTop: "clamp(64px, 9vw, 120px)",
          paddingBottom: "clamp(48px, 7vw, 88px)",
          transition: "background 0.5s ease",
        }}
      >
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-140px", right: "-140px", width: "520px", height: "520px",
            background: `radial-gradient(circle, ${theme.accent}18 0%, transparent 70%)`,
            transition: "background 0.5s ease",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "-80px", left: "-80px", width: "340px", height: "340px",
            background: `radial-gradient(circle, ${theme.accent}10 0%, transparent 70%)`,
            transition: "background 0.5s ease",
          }}
        />

        <div
          className="relative z-[1] max-w-[1200px] mx-auto px-[24px] grid items-center gap-[56px]"
          style={{ gridTemplateColumns: "1fr 1fr" }}
        >
          {/* Left: text + unified pill badge for ALL categories */}
          <div>
            {/* Single pill badge — same style for "all" and every category */}
            <HeroCategoryBadge
              accent={theme.accent}
              label={activeCategory === "all" ? "JEM 8 Product Catalog" : activeCatLabel}
              visible={badgeVisible}
            />

            <h1
              className="font-bold text-[#1e293b] leading-[1.15] mb-[18px]"
              style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(32px, 4.5vw, 56px)" }}
            >
              Quality Supplies for<br />
              <span style={{ color: theme.accent, fontStyle: "italic", transition: "color 0.4s ease" }}>
                {activeCategory === "all" ? "Every Business Need" : activeCatLabel}
              </span>
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
                className="inline-flex items-center gap-[8px] px-[28px] py-[13px] text-white rounded-[10px] font-semibold text-[15px] transition-all duration-200 hover:-translate-y-[2px]"
                style={{
                  background: theme.accent,
                  boxShadow: `0 4px 16px ${theme.accent}55`,
                  transition: "background 0.4s ease, box-shadow 0.4s ease",
                }}
                onClick={() => document.querySelector(".products-filter-bar")?.scrollIntoView({ behavior: "smooth" })}
              >
                🛒 Browse Products
              </button>
              <Link
                to="/contact"
                className="inline-flex items-center gap-[8px] px-[28px] py-[13px] bg-transparent rounded-[10px] font-semibold text-[15px] transition-all duration-200 hover:-translate-y-[2px] no-underline"
                style={{
                  border: `2px solid ${theme.accent}`,
                  color: theme.accent,
                  transition: "border-color 0.4s, color 0.4s",
                }}
              >
                Request a Quote →
              </Link>
            </div>
          </div>

          {/* Right: stats grid — dynamic */}
          <div className="grid grid-cols-2 gap-[16px]">
            {HERO_STATS.map((s) => (
              <div
                key={s.label}
                className="bg-white border border-[#e2e8f0] rounded-[16px] p-[24px_20px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-300 text-center hover:shadow-[0_8px_28px_rgba(0,0,0,0.1)] hover:-translate-y-[3px]"
                onMouseEnter={e => e.currentTarget.style.borderColor = theme.accent + "66"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}
              >
                <div className="text-[28px] mb-[8px]">{s.icon}</div>
                <span
                  className="block text-[26px] font-bold leading-[1] mb-[4px]"
                  style={{ fontFamily: "var(--font-heading)", color: theme.accent, transition: "color 0.4s" }}
                >
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
        <div className="max-w-[1200px] mx-auto px-[24px] relative">
          <div
            className="absolute left-0 top-0 bottom-0 w-[56px] z-[10] pointer-events-none flex items-center justify-start pl-[6px]"
            style={{ background: "linear-gradient(to right, white 60%, transparent 100%)" }}
          >
            <button
              className="pointer-events-auto w-[28px] h-[28px] rounded-full bg-white border border-[#e2e8f0] shadow-sm flex items-center justify-center text-[#64748b] text-[12px] hover:border-[#b8d9c8] hover:text-[#4d7b65] transition-all duration-150"
              onClick={() => {
                const el = document.querySelector(".filter-scroll-track");
                if (el) el.scrollBy({ left: -200, behavior: "smooth" });
              }}
              aria-label="Scroll left"
            >
              ‹
            </button>
          </div>

          <div
            className="absolute right-0 top-0 bottom-0 w-[56px] z-[10] pointer-events-none flex items-center justify-end pr-[6px]"
            style={{ background: "linear-gradient(to left, white 60%, transparent 100%)" }}
          >
            <button
              className="pointer-events-auto w-[28px] h-[28px] rounded-full bg-white border border-[#e2e8f0] shadow-sm flex items-center justify-center text-[#64748b] text-[12px] hover:border-[#b8d9c8] hover:text-[#4d7b65] transition-all duration-150"
              onClick={() => {
                const el = document.querySelector(".filter-scroll-track");
                if (el) el.scrollBy({ left: 200, behavior: "smooth" });
              }}
              aria-label="Scroll right"
            >
              ›
            </button>
          </div>

          <div
            className="filter-scroll-track flex items-center gap-[10px] py-[16px] overflow-x-auto px-[36px]"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
          >
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    style={{ height: "38px", width: `${80 + i * 20}px`, borderRadius: "24px", background: "#e5ede9", flexShrink: 0 }}
                  />
                ))
              : categoryTabs.map((cat) => {
                  const isActive    = activeCategory === cat.id;
                  const catThemeKey = cat.id === "all" ? "all" : resolveThemeKey(cat.label);
                  const catTheme    = CATEGORY_THEMES[catThemeKey] ?? CATEGORY_THEMES.all;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => switchCategory(cat.id, cat.id === "all" ? "all" : cat.label)}
                      className="inline-flex items-center gap-[8px] px-[18px] py-[9px] rounded-full text-[13px] font-medium whitespace-nowrap flex-shrink-0 border-[1.5px] transition-all duration-200 cursor-pointer"
                      style={
                        isActive
                          ? {
                              background: catTheme.accent,
                              color: "white",
                              borderColor: catTheme.accent,
                              boxShadow: `0 2px 8px ${catTheme.accent}55`,
                            }
                          : {
                              background: "#f1f5f9",
                              color: "#64748b",
                              borderColor: "transparent",
                            }
                      }
                      onMouseEnter={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = catTheme.accent + "15";
                          e.currentTarget.style.color = catTheme.accent;
                          e.currentTarget.style.borderColor = catTheme.accent + "55";
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = "#f1f5f9";
                          e.currentTarget.style.color = "#64748b";
                          e.currentTarget.style.borderColor = "transparent";
                        }
                      }}
                    >
                      <span className="text-[15px]">{cat.icon}</span>
                      {cat.label}
                      <span
                        className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-[6px] rounded-full text-[11px] font-bold"
                        style={
                          isActive
                            ? { background: "rgba(255,255,255,0.25)", color: "white" }
                            : { background: `${catTheme.accent}20`, color: catTheme.accent }
                        }
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
              <div className="flex items-center gap-[10px] flex-1 min-w-[240px]">
                {/* Search */}
                <div className="relative flex-1 max-w-[360px]">
                  <span className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[14px] text-[#94a3b8] pointer-events-none">
                    🔍
                  </span>
                  <input
                    type="text"
                    className="w-full h-[42px] pl-[36px] pr-[14px] bg-[#f1f5f9] border-[1.5px] border-transparent rounded-[10px] text-[14px] text-[#1e293b] outline-none transition-all duration-200 focus:bg-white placeholder:text-[#94a3b8]"
                    onFocus={e => {
                      e.target.style.borderColor = theme.accent;
                      e.target.style.boxShadow = `0 0 0 3px ${theme.accent}25`;
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = "transparent";
                      e.target.style.boxShadow = "none";
                    }}
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
                    className="pl-[12px] pr-[32px] py-[8px] rounded-[8px] bg-white text-[13px] text-[#374151] cursor-pointer outline-none appearance-none"
                    style={{ border: `1px solid ${theme.accent}44`, transition: "border-color 0.4s" }}
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
                      {activeCategory !== "all" && <> in <strong style={{ color: theme.accent }}>{activeCatLabel}</strong></>}
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
                  ? paginated.map((p, i) => (
                      <ProductCard key={(p.id ?? p.product_id) ?? i} product={p} onToast={showToast} />
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
                        onClick={() => { switchCategory("all", "all"); setSortBy("default"); }}
                        className="mt-[14px] px-[20px] py-[9px] bg-[#155DFC] text-white border-none rounded-[8px] cursor-pointer text-[13px] font-semibold hover:bg-[#1248cc] transition-colors"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )
              }
            </div>
          )}
            {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
             onPageChange={(page) => {
            setCurrentPage(page);
            setTimeout(() => {
              window.scrollTo(0, 0);
            }, 0);
          }}
        />
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
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-60px", left: "50%", transform: "translateX(-50%)",
            width: "500px", height: "500px",
            background: "radial-gradient(circle, rgba(77,123,101,0.25) 0%, transparent 65%)",
          }}
        />
        <div className="relative z-[1] max-w-[1200px] mx-auto px-[24px] flex items-center justify-between gap-[40px] flex-wrap">
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

          <div className="flex gap-[14px] flex-wrap">
            <button
              className="inline-flex items-center gap-[8px] px-[28px] py-[13px] bg-[#4d7b65] text-white rounded-[10px] font-semibold text-[15px] shadow-[0_4px_16px_rgba(77,123,101,0.35)] transition-all duration-200 hover:bg-[#3a5e4e] hover:-translate-y-[2px]"
              onClick={() => {
                const wellnessCat = categories.find(c =>
                  (c.name ?? c.category_name ?? "").toLowerCase().includes("wellness") ||
                  (c.name ?? c.category_name ?? "").toLowerCase().includes("health")
                );
                if (wellnessCat) {
                  const label = wellnessCat.name ?? wellnessCat.category_name ?? "";
                  switchCategory(String(wellnessCat.id ?? wellnessCat.category_id), label);
                }
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Shop Wellness →
            </button>
            <a
              href="https://www.iamworldwideonlinestore.com/pages/about-us"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-[8px] px-[28px] py-[13px] bg-transparent border-2 border-white/30 text-white rounded-[10px] font-semibold text-[15px] transition-all duration-200 hover:border-white/60 hover:-translate-y-[2px] no-underline"
            >
              Learn More
            </a>
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
          className="absolute rounded-full pointer-events-none"
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

/* ── Icon mapper ── */
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