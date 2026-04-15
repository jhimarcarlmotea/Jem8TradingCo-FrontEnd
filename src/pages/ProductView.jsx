import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Header, Footer } from "../components/Layout";
import { useCart } from "../context/CartContext";
import axios from "axios";
import StartChatWithAdmin from "../components/StartChatWithAdmin";

const BASE = "http://127.0.0.1:8000";

const ph = (w, h, label = "") =>
  `https://placehold.co/${w}x${h}/edf4f0/4d7b65?text=${encodeURIComponent(label)}`;

/* ── Helpers ── */
const resolveName  = (p) => p?.product_name ?? p?.name ?? "Product";
const resolvePrice = (p) => parseFloat(p?.price ?? 0);
const resolveCat   = (p) => {
  const raw = p?.category;
  if (typeof raw === "object" && raw !== null)
    return raw.name ?? raw.category_name ?? "";
  return raw ?? p?.category_name ?? "";
};
const resolveStock = (p) => Number(p?.product_stocks ?? p?.stock ?? 0);
const resolveImg   = (img, fallback = "") =>
  img?.image_path ? `${BASE}/storage/${img.image_path}` : fallback;

/* ── Star Rating (display) ── */
function StarRating({ rating, count }) {
  const r = parseFloat(rating) || 0;
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map((s) => (
        <span key={s} className={`text-lg ${s <= Math.round(r) ? "text-amber-400" : "text-gray-300"}`}>★</span>
      ))}
      <span className="font-bold text-sm text-gray-700 ml-1">{r.toFixed(1)}</span>
      {count !== undefined && <span className="text-xs text-gray-400 ml-0.5">({count} reviews)</span>}
    </div>
  );
}

/* ── Star Picker (interactive) ── */
function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: "32px", padding: "0 2px", lineHeight: 1,
            color: s <= (hovered || value) ? "#f59e0b" : "#d1d5db",
            transition: "color 0.1s, transform 0.1s",
            transform: s <= (hovered || value) ? "scale(1.15)" : "scale(1)",
          }}
          aria-label={`${s} star${s !== 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/* ── Skeleton ── */
function Skeleton() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="bg-[#f8faf9] border-b border-[#e8f0eb] mt-[75px]">
        <div className="container mx-auto px-4 flex items-center gap-2 py-3 text-sm text-[#6b7c70] flex-wrap">
          <Link to="/" className="text-[#4d7b65]">Home</Link>
          <span className="text-gray-300">›</span>
          <Link to="/products" className="text-[#4d7b65]">Products</Link>
          <span className="text-gray-300">›</span>
          <span className="inline-block w-36 h-3 bg-[#e5ede9] rounded-md align-middle" />
        </div>
      </div>
      <section className="py-12 px-4">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-14">
          <div
            className="rounded-2xl min-h-[360px]"
            style={{
              background: "#e5ede9",
              animation: "shimmer 1.4s infinite",
              backgroundSize: "200% 100%",
              backgroundImage: "linear-gradient(90deg,#e5ede9 25%,#d0ddd6 50%,#e5ede9 75%)",
            }}
          />
          <div className="flex flex-col gap-3.5">
            {[80,100,60,100,40].map((w,i) => (
              <div
                key={i}
                style={{
                  height: i===1 ? "28px" : "14px",
                  width: `${Math.min(w,100)}%`,
                  background: "#e5ede9",
                  borderRadius: "6px",
                  animation: "shimmer 1.4s infinite",
                  backgroundSize: "200% 100%",
                  backgroundImage: "linear-gradient(90deg,#e5ede9 25%,#d0ddd6 50%,#e5ede9 75%)",
                }}
              />
            ))}
          </div>
        </div>
      </section>
      <style>{`
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
      <Footer />
    </div>
  );
}

/* ── Related Card ── */
function RelatedCard({ product }) {
  const name  = resolveName(product);
  const price = resolvePrice(product);
  const thumb = resolveImg(product.images?.[0], ph(300, 300, name));
  return (
    <Link
      to={`/products/${product.id ?? product.product_id}`}
      className="block bg-white rounded-2xl border border-[#e8f0eb] overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(77,123,101,0.12)] hover:border-[#4d7b65] no-underline text-inherit"
    >
      <div className="aspect-square overflow-hidden bg-[#f3f8f5]">
        <img
          src={thumb}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => { e.target.src = ph(300,300,name); }}
        />
      </div>
      <div className="p-3.5">
        <div className="text-xs font-semibold text-[#1a2e22] mb-1 line-clamp-2">{name}</div>
        <div className="text-sm font-bold text-[#4d7b65]">
          ₱{price.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
        </div>
      </div>
    </Link>
  );
}

/* ── Review Form ── */
function ReviewForm({ productId, user, onSubmitted }) {
  const [rating,     setRating]     = useState(0);
  const [comment,    setComment]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState(null);

  const STAR_LABELS = ["","Terrible","Poor","Okay","Good","Excellent"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) { setError("Please select a star rating."); return; }
    setSubmitting(true);
    setError(null);
    try {
      await axios.post(
        `${BASE}/api/products/${productId}/reviews`,
        { rating, review_text: comment },
        { withCredentials: true }
      );
      setSuccess(true);
      setRating(0);
      setComment("");
      if (onSubmitted) onSubmitted();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="mt-8 p-7 rounded-2xl text-center border border-[#a7f3d0] bg-gradient-to-br from-[#f0faf5] to-[#e6f7ef]">
        <div className="text-4xl mb-2.5">🎉</div>
        <h4 className="text-lg font-bold text-[#065f46] mb-2">Thank you for your review!</h4>
        <p className="text-sm text-[#047857] mb-5">Your feedback helps other customers make better decisions.</p>
        <button
          onClick={() => setSuccess(false)}
          className="px-6 py-2.5 bg-[#4d7b65] text-white rounded-lg font-semibold text-sm cursor-pointer border-none"
        >
          Write Another Review
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 p-7 rounded-2xl bg-[#fafcfb] border border-[#e2ede8] shadow-[0_2px_12px_rgba(77,123,101,0.07)]"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#4d7b65] to-[#2d5a42] text-white flex items-center justify-center text-base font-bold flex-shrink-0 shadow-[0_2px_8px_rgba(77,123,101,0.25)]">
          {(user?.name ?? user?.first_name ?? "?")[0].toUpperCase()}
        </div>
        <div>
          <div className="text-sm font-bold text-[#0F172A]">✍️ Write a Review</div>
          <div className="text-xs text-gray-500 mt-0.5">
            Posting as{" "}
            <strong className="text-gray-700">
              {[user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.name || user?.email || "you"}
            </strong>
            {user?.email && <span className="text-gray-400 ml-1.5">· {user.email}</span>}
          </div>
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-xs font-semibold text-gray-700 mb-2">Your Rating *</label>
        <StarPicker value={rating} onChange={setRating} />
        {rating > 0 && (
          <span className="inline-block mt-1.5 text-xs font-semibold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            {STAR_LABELS[rating]}
          </span>
        )}
      </div>

      <div className="mb-5">
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Your Review *</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product…"
          required
          rows={4}
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm resize-y outline-none transition-colors font-[inherit] focus:border-[#4d7b65] box-border"
        />
      </div>

      {error && (
        <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2">
          ⚠️ {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !comment.trim()}
        className="px-7 py-3 rounded-xl text-white text-sm font-bold flex items-center gap-2 transition-all border-none"
        style={{
          background: submitting || !comment.trim() ? "#9ca3af" : "linear-gradient(135deg,#4d7b65,#2d5a42)",
          cursor: submitting || !comment.trim() ? "not-allowed" : "pointer",
          boxShadow: submitting || !comment.trim() ? "none" : "0 4px 12px rgba(77,123,101,0.3)",
        }}
      >
        {submitting
          ? <><span style={{ display:"inline-block", width:"14px", height:"14px", border:"2px solid rgba(255,255,255,0.4)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} /> Submitting…</>
          : <>⭐ Submit Review</>
        }
      </button>
    </form>
  );
}

/* ── Main Page ── */
export default function ProductView() {
  const { id }                    = useParams();
  const navigate                  = useNavigate();
  const { addToCart, totalItems } = useCart();

  const [product,        setProduct]        = useState(null);
  const [related,        setRelated]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [activeImg,      setActiveImg]      = useState(0);
  const [qty,            setQty]            = useState(1);
  const [added,          setAdded]          = useState(false);
  const [cartLoading,    setCartLoading]    = useState(false);
  const [cartError,      setCartError]      = useState(null);
  const [activeTab,      setActiveTab]      = useState("overview");
  const [reviewRefresh,  setReviewRefresh]  = useState(0);
  const [currentUser,    setCurrentUser]    = useState(null);
  const [reviewsList,    setReviewsList]    = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    axios.get(`${BASE}/api/me`, { withCredentials: true })
      .then(res => {
        const u = res.data?.data ?? res.data?.user ?? res.data;
        setCurrentUser(u && typeof u === "object" && (u.id || u.user_id) ? u : false);
      })
      .catch(() => setCurrentUser(false));
  }, []);

  useEffect(() => {
    if (!id) return;
    setReviewsLoading(true);
    axios.get(`${BASE}/api/products/${id}/reviews`, { withCredentials: true })
      .then(async (res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.reviews ?? res.data?.data ?? []);
        const hydrated = await Promise.all(
          list.map(async (r) => {
            if (r.user) return r;
            if (!r.user_id) return r;
            try {
              const acc = await axios.get(`${BASE}/api/findaccount/${r.user_id}`);
              const u = acc.data?.data ?? acc.data?.user ?? acc.data;
              return { ...r, user: u };
            } catch { return r; }
          })
        );
        setReviewsList(hydrated);
      })
      .catch(() => setReviewsList([]))
      .finally(() => setReviewsLoading(false));
  }, [id, reviewRefresh]);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      setActiveImg(0);
      setQty(1);
      setActiveTab("overview");
      try {
        const res  = await axios.get(`${BASE}/api/products/${id}`, { withCredentials: true });
        const data = res.data?.product ?? res.data?.data ?? res.data;
        setProduct(data);
        const catId = data?.category_id ?? data?.category?.id ?? data?.category?.category_id;
        if (catId) {
          try {
            const all  = await axios.get(`${BASE}/api/admin/products`, { withCredentials: true });
            const list = all.data?.data ?? all.data?.products ?? all.data;
            const rel  = (Array.isArray(list) ? list : [])
              .filter(p => {
                const pCat = p.category_id ?? p.category?.id ?? p.category?.category_id;
                const pId  = p.id ?? p.product_id;
                return String(pCat) === String(catId) && String(pId) !== String(id);
              })
              .slice(0, 4);
            setRelated(rel);
          } catch { setRelated([]); }
        }
      } catch (err) {
        console.error(err);
        setError("Product not found or failed to load.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <Skeleton />;

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-32 text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-[#0F172A] mb-3">Product not found</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <Link to="/products" className="btn-primary">← Back to Products</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const name        = resolveName(product);
  const price       = resolvePrice(product);
  const catLabel    = resolveCat(product);
  const stock       = resolveStock(product);
  const isOnSale    = product.isSale == 1;
  const desc        = product.description ?? "";
  const images      = product.images ?? [];
  const mainSrc     = images[activeImg]?.image_path
    ? `${BASE}/storage/${images[activeImg].image_path}`
    : ph(600, 600, name);
  const reviews     = reviewsList.length;
  const avgRating   = reviews > 0
    ? reviewsList.reduce((sum, r) => sum + Number(r.rating ?? r.stars ?? 0), 0) / reviews
    : 0;
  const productId   = product.product_id ?? product.id;

  const callAddToCart = async () =>
    axios.post(`${BASE}/api/cart/add`, { product_id: productId, quantity: qty }, { withCredentials: true });

  const handleAdd = async () => {
    if (cartLoading) return;
    const isBackorder = product.status === "pre_order";
   
    setCartLoading(true);
    setCartError(null);
    const productToAdd = isBackorder ? { ...product, backorder: true } : product;
    try {
      // attempt server add; if it fails we'll still add locally for backorders
      await callAddToCart();
      addToCart(productToAdd, qty);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
      if (isBackorder) {
        setCartError("Note: This item is out of stock and will be backordered; delivery may take longer.");
        setTimeout(() => setCartError(null), 6000);
      }
    } catch (err) {
      if (isBackorder) {
        // server likely rejected due to stock, but allow user to place backorder locally
        addToCart(productToAdd, qty);
        setCartError("Added as backorder — delivery may take longer.");
        setTimeout(() => setCartError(null), 6000);
      } else {
        const status = err.response?.status;
        const msg    = err.response?.data?.message ?? err.response?.data?.error ?? "Failed to add to cart.";
        setCartError(status === 401 ? "You must be logged in to add items to cart." : msg);
        setTimeout(() => setCartError(null), 4000);
      }
    } finally {
      setCartLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (cartLoading) return;
    const isBackorder = product.status === "pre_order";
   
    setCartLoading(true);
    setCartError(null);
    const productToAdd = isBackorder ? { ...product, backorder: true } : product;
    try {
      await callAddToCart();
      addToCart(productToAdd, qty);
      if (isBackorder) {
        setCartError("Note: This item is out of stock and will be backordered; delivery may take longer.");
        setTimeout(() => setCartError(null), 6000);
      }
      navigate("/cart");
    } catch (err) {
      if (isBackorder) {
        addToCart(productToAdd, qty);
        setCartError("Added as backorder — delivery may take longer.");
        setTimeout(() => setCartError(null), 6000);
        navigate("/cart");
      } else {
        const status = err.response?.status;
        const msg    = err.response?.data?.message ?? err.response?.data?.error ?? "Failed to add to cart.";
        setCartError(status === 401 ? "You must be logged in to add items to cart." : msg);
        setTimeout(() => setCartError(null), 4000);
        setCartLoading(false);
      }
    }
  };

const isPreOrder  = product.status === "pre_order";
const stockStatus = isPreOrder
  ? { label: "Pre-Order", color: "#92400E", bg: "#FEF3C7" }
  : { label: "In Stock",  color: "#059669", bg: "#D1FAE5" };


  return (
    <div className="min-h-screen bg-white">
      <Header />

      <style>{`
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* ── BREADCRUMB ── */}
      <div className="bg-[#f8faf9] border-b border-[#e8f0eb] mt-[75px]">
        <div className="container mx-auto px-4 flex items-center gap-2 py-3 text-xs text-[#6b7c70] flex-wrap">
          <Link to="/" className="text-[#4d7b65] no-underline hover:underline">Home</Link>
          <span className="text-gray-300">›</span>
          <Link to="/products" className="text-[#4d7b65] no-underline hover:underline">Products</Link>
          <span className="text-gray-300">›</span>
          {catLabel && (
            <>
              <Link to="/products" className="text-[#4d7b65] no-underline hover:underline">{catLabel}</Link>
              <span className="text-gray-300">›</span>
            </>
          )}
          <span>{name}</span>
        </div>
      </div>

      {/* ── MAIN ── */}
      <section className="py-12 pb-16">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-14 items-start">

          {/* Image column */}
          <div>
            <div className="relative rounded-[20px] overflow-hidden bg-[#f3f8f5] aspect-square flex items-center justify-center shadow-[0_8px_40px_rgba(77,123,101,0.12)] group">
              <img
                src={mainSrc}
                alt={name}
                className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-[1.03]"
                onError={(e) => { e.target.src = ph(600, 600, name); }}
              />
              {isOnSale && (
                <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-full">Sale</span>
              )}
              {product.status === "pre_order" ? (
                  <span className="absolute top-3 right-3 text-xs font-bold px-3.5 py-1.5 rounded-full"
                    style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }}>
                    Pre-Order
                  </span>
                ) : (
                  <span className="absolute top-3 right-3 text-xs font-bold px-3.5 py-1.5 rounded-full"
                    style={{ background: "#D1FAE5", color: "#059669", border: "1px solid #6EE7B7" }}>
                    In Stock
                  </span>
                )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 flex-wrap mt-3">
                {images.map((img, i) => (
                  <button
                    key={img.id ?? i}
                    onClick={() => setActiveImg(i)}
                    className="rounded-lg overflow-hidden p-0 cursor-pointer transition-all"
                    style={{
                      width: "60px", height: "60px",
                      border: i === activeImg ? "2px solid #4d7b65" : "2px solid #e2e8f0",
                      background: "#f8fafc", flexShrink: 0,
                    }}
                  >
                    <img
                      src={`${BASE}/storage/${img.image_path}`}
                      alt={`thumb-${i+1}`}
                      className="w-full h-full object-cover block"
                      onError={(e) => { e.target.src = ph(60,60,""); }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info column */}
          <div className="flex flex-col gap-4">
            {catLabel && (
              <span className="text-[11px] font-bold tracking-[2px] text-[#4d7b65] uppercase">
                {catLabel.toUpperCase()}
              </span>
            )}
            <h1 className="text-[clamp(22px,3vw,32px)] font-bold text-[#1a2e22] leading-tight m-0">
              {name}
            </h1>

            {reviews > 0
              ? <StarRating rating={avgRating} count={reviews} />
              : <div className="text-xs text-gray-400 mb-2">No reviews yet</div>
            }

            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 w-fit"
              style={{ background: stockStatus.bg, color: stockStatus.color }}
            >
             <span>●</span>
              {stockStatus.label}
              
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[34px] font-bold text-[#4d7b65]">
                ₱{price.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </span>
              {isOnSale && (
                <span className="bg-red-50 text-red-600 border border-red-200 rounded-lg px-2.5 py-1 text-xs font-bold">
                  ON SALE
                </span>
              )}
            </div>

            {desc && <p className="text-sm text-gray-600 leading-relaxed m-0">{desc}</p>}

            <hr className="border-none border-t border-[#e8f0eb] my-0" />

            {/* Quantity */}
            <div className="flex items-center gap-4 my-0">
              <span className="text-sm font-semibold text-gray-700">Quantity</span>
              <div className="flex items-center border border-[#D1FAE5] rounded-xl overflow-hidden">
                <button
                  onClick={() => setQty(q => Math.max(1, q-1))}
                  className="w-[38px] h-[38px] border-none bg-[#f0faf5] text-[#4d7b65] text-lg font-bold cursor-pointer flex items-center justify-center"
                >−</button>
                <span className="min-w-[40px] text-center text-sm font-bold text-[#0F172A] bg-white">{qty}</span>
                <button
                 onClick={() => setQty(q => q + 1)}
                  disabled={false}
                  className="w-[38px] h-[38px] border-none bg-[#f0faf5] text-[#4d7b65] text-lg font-bold cursor-pointer flex items-center justify-center"
                  title={stock > 0 ? (qty >= stock ? `Max available: ${stock}` : "Increase quantity") : "Increase quantity"}
                >+</button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-2 flex-wrap">
              <button
                onClick={handleAdd}
                disabled={cartLoading}
                className="flex-1 min-w-[160px] py-3.5 px-6 text-white border-none rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={{
                  background: added ? "#059669" : "linear-gradient(135deg,#4d7b65,#2d5a42)",
                  cursor: cartLoading ? "not-allowed" : "pointer",
                  opacity: cartLoading ? 0.7 : 1,
                  boxShadow: added ? "none" : "0 4px 14px rgba(77,123,101,0.35)",
                }}
                onMouseEnter={e => { if(!cartLoading && !added) e.currentTarget.style.transform="translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; }}
                aria-disabled={cartLoading}
                title={stock === 0 ? "Out of stock — you can still order; delivery may take longer" : "Add to cart"}
              >
              
                {cartLoading
                  ? <span style={{ display:"inline-block", width:"18px", height:"18px", border:"2.5px solid rgba(255,255,255,0.4)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
                  : <span className="text-lg">{added ? "✓" : "🛒"}</span>
                    }
                  {cartLoading ? "Adding..." : added ? "Added to Cart!" : "Add to Cart"}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={cartLoading}
                className="flex-1 min-w-[160px] py-3.5 px-6 text-white border-none rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={{
                  background: "linear-gradient(135deg,#1e40af,#1d4ed8)",
                  cursor: cartLoading ? "not-allowed" : "pointer",
                  opacity: cartLoading ? 0.7 : 1,
                  boxShadow: "0 4px 14px rgba(29,78,216,0.35)",
                }}
                onMouseEnter={e => { if(!cartLoading) e.currentTarget.style.transform="translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; }}
                aria-disabled={cartLoading}
                title={stock === 0 ? "Out of stock — you can still order; delivery may take longer" : "Buy now"}
              >
                <span className="text-lg">⚡</span>
                {product.status === "pre_order" ? "Pre-Order Now" : "Buy Now"}
              </button>
            </div>

            {totalItems > 0 && (
              <Link to="/cart" className="text-sm text-[#4d7b65] font-semibold no-underline hover:underline">
                View Cart ({totalItems} item{totalItems !== 1 ? "s" : ""}) →
              </Link>
            )}

            {/* Start chat with admin */}
            <div className="mt-3">
              <StartChatWithAdmin
                initialMessage={`Hello admin, I'm interested in ${name} (ID ${productId})`}
                onStarted={({ chatroomId }) => {
                  navigate(`/messages?chatroom_id=${chatroomId}`);
                }}
              />
            </div>

            <div className="flex flex-wrap gap-2 mt-1">
              {["🚚 Free delivery in Metro Manila","✅ Quality guaranteed","🔄 Easy returns"].map(t => (
                <span key={t} className="text-xs px-3 py-1.5 bg-[#f0faf5] text-[#2d5a42] rounded-full border border-[#D1FAE5] font-medium">
                  {t}
                </span>
              ))}
            </div>

            {cartError && (
              <div
                className="mt-3 px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between gap-2"
                style={{
                  background: cartError.includes("logged in") ? "#EFF6FF" : "#FEF2F2",
                  border: `1px solid ${cartError.includes("logged in") ? "#BFDBFE" : "#FECACA"}`,
                  color: cartError.includes("logged in") ? "#1D4ED8" : "#DC2626",
                }}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">{cartError.includes("logged in") ? "🔒" : "⚠️"}</span>
                  {cartError}
                </span>
                {cartError.includes("logged in") && (
                  <Link to="/login" className="font-bold text-[#1D4ED8] whitespace-nowrap no-underline px-2.5 py-1 bg-[#DBEAFE] rounded-md">
                    Log in →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── TABS ── */}
      <section className="bg-[#f8faf9] border-t border-b border-[#e8f0eb] py-12">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 border-b-2 border-[#e2e8f0] mb-8">
            {["overview","specifications","reviews"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-6 py-3 border-none text-sm cursor-pointer rounded-t transition-all"
                style={{
                  fontWeight: activeTab === tab ? 700 : 500,
                  color: activeTab === tab ? "#4d7b65" : "#64748B",
                  borderBottom: activeTab === tab ? "2px solid #4d7b65" : "2px solid transparent",
                  marginBottom: "-2px",
                  background: activeTab === tab ? "#f0faf5" : "transparent",
                }}
              >
                {tab === "reviews"
                  ? `Reviews${reviews > 0 ? ` (${reviews})` : ""}`
                  : tab.charAt(0).toUpperCase() + tab.slice(1)
                }
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl p-7 min-h-[200px]">

            {/* Overview */}
            {activeTab === "overview" && (
              <div className="max-w-2xl">
                <h3 className="text-lg font-bold text-[#1a2e22] mb-4">Product Overview</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  {desc || "No description available for this product."}
                </p>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  JEM 8 Circle Trading Co. sources only quality-assured products for your business. This item is available for bulk ordering with discounted pricing for orders of 10 units or more. Contact us for bulk quotations.
                </p>
                <div className="flex flex-col gap-2.5 mt-4">
                  {["Premium quality materials","Suitable for office and commercial use","Available for bulk orders","Direct delivery to your office"].map(f => (
                    <div key={f} className="text-sm text-gray-700 flex items-center gap-2.5">
                      <span className="text-[#4d7b65] font-bold">✓</span> {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specifications */}
            {activeTab === "specifications" && (
              <div className="max-w-2xl">
                <h3 className="text-lg font-bold text-[#1a2e22] mb-4">Specifications</h3>
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    {[
                      ["Product ID", `#${product.id}`],
                      ["Category", catLabel || "—"],
                      ["Brand", "JEM 8 Certified"],
                      ["Stock", `${stock} units`],
                      ["Status", stockStatus.label, stockStatus.color],
                      ["On Sale", isOnSale ? "Yes" : "No"],
                      ["Rating", reviews > 0 ? `${avgRating.toFixed(1)} / 5.0 (${reviews} reviews)` : "No reviews yet"],
                      ["Delivery", "Metro Manila: 1–2 days · Laguna: 2–3 days"],
                      ["Bulk Pricing", "Available for 10+ units"],
                      ...(product.created_at ? [["Listed", new Date(product.created_at).toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"})]] : []),
                    ].map(([label, value, color], i) => (
                      <tr key={i} className="border-b border-[#f0f4f1]">
                        <td className="px-4 py-3 font-semibold text-[#1a2e22] w-2/5 bg-[#f8faf9]">{label}</td>
                        <td className="px-4 py-3 text-gray-700" style={color ? { color, fontWeight: 600 } : {}}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Reviews */}
            {activeTab === "reviews" && (
              <div className="max-w-full">
                <h3 className="text-lg font-bold text-[#1a2e22] mb-4">Customer Reviews</h3>

                {reviews > 0 && (
                  <div className="flex items-center gap-6 mb-6 p-5 bg-[#f8faf9] rounded-xl border border-[#e8f0eb]">
                    <div className="text-[56px] font-bold text-[#4d7b65] leading-none">{avgRating.toFixed(1)}</div>
                    <div>
                      <StarRating rating={avgRating} />
                      <div className="text-xs text-[#6b7c70] mt-1">Based on {reviews} review{reviews !== 1 ? "s" : ""}</div>
                    </div>
                  </div>
                )}

                {reviewsLoading ? (
                  <div className="py-8 text-center text-gray-400 text-sm">
                    <span style={{ display:"inline-block", width:"20px", height:"20px", border:"2.5px solid #d1d5db", borderTopColor:"#4d7b65", borderRadius:"50%", animation:"spin 0.7s linear infinite", marginRight:"10px", verticalAlign:"middle" }} />
                    Loading reviews…
                  </div>
                ) : reviewsList.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-sm">
                    <div className="text-4xl mb-2.5">💬</div>
                    No reviews yet. Be the first to review this product!
                  </div>
                ) : (
                  reviewsList.map((r, i) => {
                    const reviewer     = (r.user ? [r.user.first_name, r.user.last_name].filter(Boolean).join(" ") : null) ?? r.user?.name ?? r.name ?? "Anonymous";
                    const reviewRating = Number(r.rating ?? r.stars ?? 0);
                    const reviewText   = r.review_text ?? r.comment ?? r.body ?? "";
                    const reviewDate   = r.created_at
                      ? new Date(r.created_at).toLocaleDateString("en-PH", { year:"numeric", month:"short", day:"numeric" })
                      : "";
                    const repliedDate  = r.replied_at
                      ? new Date(r.replied_at).toLocaleDateString("en-PH", { year:"numeric", month:"short", day:"numeric" })
                      : "";
                    return (
                      <div key={r.review_id ?? r.id ?? i} className="p-5 bg-white rounded-xl border border-[#e8f0eb] mb-3">
                        {/* Reviewer header */}
                        <div className="flex items-center gap-3 mb-2.5">
                          <div className="w-10 h-10 rounded-full bg-[#3b5234] text-white flex items-center justify-center font-bold text-base flex-shrink-0">
                            {reviewer[0].toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-bold text-[#1a2e22]">{reviewer}</div>
                            <StarRating rating={reviewRating} />
                          </div>
                          {reviewDate && (
                            <div className="text-xs text-gray-400 whitespace-nowrap">{reviewDate}</div>
                          )}
                        </div>

                        {/* Review text */}
                        {reviewText && (
                          <p className="text-sm text-gray-600 leading-relaxed m-0">{reviewText}</p>
                        )}

                        {/* ── Admin Reply ── */}
                        {r.admin_reply && (
                          <div className="mt-3 px-3.5 py-3 rounded-lg bg-[#F0F7FF] border-l-[3px] border-[#155DFC]">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#155DFC] mb-1.5">
                              <span>💬</span> Admin Reply
                              {repliedDate && (
                                <span className="font-normal text-gray-400 ml-1">· {repliedDate}</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-700 m-0 leading-relaxed italic">
                              {r.admin_reply}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Write a review */}
                <div className="border-t border-[#e2ede8] mt-8 pt-2">
                  {currentUser ? (
                    <ReviewForm
                      productId={productId}
                      user={currentUser}
                      onSubmitted={() => setReviewRefresh(r => r + 1)}
                    />
                  ) : currentUser === false ? (
                    <div className="mt-6 p-5 rounded-xl bg-[#f8fafc] border border-dashed border-gray-300 text-center">
                      <div className="text-3xl mb-2">🔒</div>
                      <p className="text-sm text-gray-500 mb-3.5">You need to be logged in to write a review.</p>
                      <Link
                        to="/login"
                        className="inline-block px-5 py-2.5 rounded-lg text-white font-semibold text-sm no-underline"
                        style={{ background: "linear-gradient(135deg,#4d7b65,#2d5a42)" }}
                      >
                        Log in to Review →
                      </Link>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ── RELATED ── */}
      {related.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <span className="section-label">More from this Category</span>
            <h2 className="section-title mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {related.map((p, i) => <RelatedCard key={p.id ?? i} product={p} />)}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}