import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Header, Footer } from "../components/Layout";
import { useCart } from "../context/CartContext";
import axios from "axios";
import "../style/global.css";
import "../style/product-view.css";

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
    <div className="pv-stars">
      {[1,2,3,4,5].map((s) => (
        <span key={s} className={s <= Math.round(r) ? "pv-star" : "pv-star pv-star--empty"}>★</span>
      ))}
      <span className="pv-stars__score">{r.toFixed(1)}</span>
      {count !== undefined && <span className="pv-stars__count">({count} reviews)</span>}
    </div>
  );
}

/* ── Star Picker (interactive) ── */
function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: "4px" }}>
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
    <div className="pv-page">
      <Header />
      <div className="pv-breadcrumb">
        <div className="container pv-breadcrumb__inner">
          <Link to="/">Home</Link>
          <span className="pv-breadcrumb__sep">›</span>
          <Link to="/products">Products</Link>
          <span className="pv-breadcrumb__sep">›</span>
          <span style={{ display:"inline-block", width:"140px", height:"12px", background:"#e5ede9", borderRadius:"6px", verticalAlign:"middle" }} />
        </div>
      </div>
      <section className="pv-main">
        <div className="container pv-main__grid">
          <div className="pv-image-col">
            <div className="pv-image-wrap" style={{ background:"#e5ede9", minHeight:"360px", borderRadius:"16px",
              animation:"shimmer 1.4s infinite", backgroundSize:"200% 100%",
              backgroundImage:"linear-gradient(90deg,#e5ede9 25%,#d0ddd6 50%,#e5ede9 75%)" }} />
          </div>
          <div className="pv-info-col" style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            {[80,200,60,100,40].map((w,i) => (
              <div key={i} style={{ height: i===1 ? "28px" : "14px", width:`${w}%`.replace("200%","100%"),
                background:"#e5ede9", borderRadius:"6px",
                animation:"shimmer 1.4s infinite", backgroundSize:"200% 100%",
                backgroundImage:"linear-gradient(90deg,#e5ede9 25%,#d0ddd6 50%,#e5ede9 75%)" }} />
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
    <Link to={`/products/${product.id ?? product.product_id}`} className="pv-related-card">
      <div className="pv-related-card__img">
        <img src={thumb} alt={name} onError={(e) => { e.target.src = ph(300,300,name); }} />
      </div>
      <div className="pv-related-card__body">
        <div className="pv-related-card__name">{name}</div>
        <div className="pv-related-card__price">
          ₱{price.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
        </div>
      </div>
    </Link>
  );
}

/* ── Review Form ── */
function ReviewForm({ productId, user, onSubmitted }) {
  const [rating,      setRating]      = useState(0);
  const [comment,     setComment]     = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [error,       setError]       = useState(null);

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
      <div style={{
        padding: "28px 32px", borderRadius: "16px",
        background: "linear-gradient(135deg,#f0faf5,#e6f7ef)",
        border: "1.5px solid #a7f3d0",
        textAlign: "center", marginTop: "32px",
      }}>
        <div style={{ fontSize: "40px", marginBottom: "10px" }}>🎉</div>
        <h4 style={{ fontSize: "18px", fontWeight: 700, color: "#065f46", margin: "0 0 8px" }}>
          Thank you for your review!
        </h4>
        <p style={{ color: "#047857", margin: "0 0 20px", fontSize: "14px" }}>
          Your feedback helps other customers make better decisions.
        </p>
        <button
          onClick={() => setSuccess(false)}
          style={{
            padding: "10px 24px", background: "#4d7b65", color: "#fff",
            border: "none", borderRadius: "8px", fontWeight: 600,
            fontSize: "14px", cursor: "pointer",
          }}
        >
          Write Another Review
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: "32px", padding: "28px 32px", borderRadius: "16px",
        background: "#fafcfb", border: "1.5px solid #e2ede8",
        boxShadow: "0 2px 12px rgba(77,123,101,0.07)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "50%",
          background: "linear-gradient(135deg,#4d7b65,#2d5a42)",
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "17px", fontWeight: 700, flexShrink: 0,
          boxShadow: "0 2px 8px rgba(77,123,101,0.25)",
        }}>
          {(user?.name ?? user?.first_name ?? "?")[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A" }}>
            ✍️ Write a Review
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
            Posting as{" "}
            <strong style={{ color: "#374151" }}>
              {[user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.name || user?.email || "you"}
            </strong>
            {user?.email && (
              <span style={{ color: "#9ca3af", marginLeft: "6px" }}>· {user.email}</span>
            )}
          </div>
        </div>
      </div>

      {/* Star picker */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
          Your Rating *
        </label>
        <StarPicker value={rating} onChange={setRating} />
        {rating > 0 && (
          <span style={{
            display: "inline-block", marginTop: "6px",
            fontSize: "12px", fontWeight: 600,
            color: "#f59e0b", background: "#fffbeb",
            padding: "3px 10px", borderRadius: "20px",
            border: "1px solid #fde68a",
          }}>
            {STAR_LABELS[rating]}
          </span>
        )}
      </div>

      {/* Comment */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
          Your Review *
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product…"
          required
          rows={4}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: "10px",
            border: "1.5px solid #d1d5db", fontSize: "14px",
            resize: "vertical", outline: "none", boxSizing: "border-box",
            transition: "border-color 0.15s", fontFamily: "inherit",
          }}
          onFocus={(e) => e.target.style.borderColor = "#4d7b65"}
          onBlur={(e)  => e.target.style.borderColor = "#d1d5db"}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{
          marginBottom: "16px", padding: "10px 14px", borderRadius: "8px",
          background: "#FEF2F2", border: "1px solid #FECACA",
          color: "#DC2626", fontSize: "13px", fontWeight: 500,
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          ⚠️ {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !comment.trim()}
        style={{
          padding: "12px 28px",
          background: submitting || !comment.trim()
            ? "#9ca3af"
            : "linear-gradient(135deg,#4d7b65,#2d5a42)",
          color: "#fff", border: "none", borderRadius: "10px",
          fontSize: "14px", fontWeight: 700, cursor: submitting || !comment.trim() ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", gap: "8px",
          transition: "all 0.2s",
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

  const [product, setProduct]     = useState(null);
  const [related, setRelated]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty]             = useState(1);
  const [added, setAdded]         = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError]     = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [reviewRefresh, setReviewRefresh] = useState(0);
  const [currentUser,   setCurrentUser]   = useState(null);  // null = loading, false = guest
  const [reviewsList,   setReviewsList]   = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // ── Fetch current user (/me) ──
  useEffect(() => {
    axios.get(`${BASE}/api/me`, { withCredentials: true })
      .then(res => {
        const u = res.data?.data ?? res.data?.user ?? res.data;
        setCurrentUser(u && typeof u === "object" && (u.id || u.user_id) ? u : false);
      })
      .catch(() => setCurrentUser(false));
  }, []);

  // ── Fetch reviews + hydrate user from /accounts/:id if user relation is null ──
  useEffect(() => {
    if (!id) return;
    setReviewsLoading(true);

    axios.get(`${BASE}/api/products/${id}/reviews`, { withCredentials: true })
      .then(async (res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.reviews ?? res.data?.data ?? []);

        // For any review where r.user is null, fetch account by user_id
        const hydrated = await Promise.all(
          list.map(async (r) => {
            if (r.user) return r; // already has user relation loaded
            if (!r.user_id) return r;
            try {
              const acc = await axios.get(`${BASE}/api/findaccount/${r.user_id}`);
              console.log(acc)
              const u = acc.data?.data ?? acc.data?.user ?? acc.data;
              return { ...r, user: u };
            } catch {
              return r; // leave as-is if fetch fails
            }
          })
        );

        setReviewsList(hydrated);
      })
      .catch(() => setReviewsList([]))
      .finally(() => setReviewsLoading(false));
  }, [id, reviewRefresh]);

  // ── Fetch product ──
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
      <div className="pv-page">
        <Header />
        <div className="container" style={{ padding:"120px 0", textAlign:"center" }}>
          <div style={{ fontSize:"48px", marginBottom:"16px" }}>😕</div>
          <h2 style={{ fontSize:"24px", marginBottom:"12px", color:"#0F172A" }}>Product not found</h2>
          <p style={{ color:"#64748B", marginBottom:"24px" }}>{error}</p>
          <Link to="/products" className="btn-primary">← Back to Products</Link>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Normalise fields ──
  const name     = resolveName(product);
  const price    = resolvePrice(product);
  const catLabel = resolveCat(product);
  const stock    = resolveStock(product);
  const isOnSale = product.isSale == 1;
  const desc     = product.description ?? "";
  const images   = product.images ?? [];
  const mainSrc  = images[activeImg]?.image_path
    ? `${BASE}/storage/${images[activeImg].image_path}`
    : ph(600, 600, name);
  // Derive real average from fetched reviews; only show if reviews exist
  const reviews     = reviewsList.length;
  const avgRating   = reviews > 0
    ? reviewsList.reduce((sum, r) => sum + Number(r.rating ?? r.stars ?? 0), 0) / reviews
    : 0;
  const productId = product.product_id ?? product.id;

  // ── Cart helpers ──
  const callAddToCart = async () => {
    return axios.post(
      `${BASE}/api/cart/add`,
      { product_id: productId, quantity: qty },
      { withCredentials: true }
    );
  };

  const handleAdd = async () => {
    if (cartLoading || stock === 0) return;
    setCartLoading(true);
    setCartError(null);
    try {
      await callAddToCart();
      addToCart(product, qty);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.message ?? err.response?.data?.error ?? "Failed to add to cart.";
      setCartError(status === 401 ? "You must be logged in to add items to cart." : msg);
      setTimeout(() => setCartError(null), 4000);
    } finally {
      setCartLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (cartLoading || stock === 0) return;
    setCartLoading(true);
    setCartError(null);
    try {
      await callAddToCart();
      addToCart(product, qty);
      navigate("/cart");
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.message ?? err.response?.data?.error ?? "Failed to add to cart.";
      setCartError(status === 401 ? "You must be logged in to add items to cart." : msg);
      setTimeout(() => setCartError(null), 4000);
      setCartLoading(false);
    }
  };

  const deriveStatus = () => {
    if (stock === 0) return { label:"Out of Stock", color:"#DC2626", bg:"#FEE2E2" };
    if (stock <= 10) return { label:"Low Stock",    color:"#D97706", bg:"#FEF3C7" };
    return              { label:"In Stock",         color:"#059669", bg:"#D1FAE5" };
  };
  const stockStatus = deriveStatus();

  return (
    <div className="pv-page">
      <Header />

      <style>{`
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* ── BREADCRUMB ── */}
      <div className="pv-breadcrumb">
        <div className="container pv-breadcrumb__inner">
          <Link to="/">Home</Link>
          <span className="pv-breadcrumb__sep">›</span>
          <Link to="/products">Products</Link>
          <span className="pv-breadcrumb__sep">›</span>
          {catLabel && <><Link to={`/products`}>{catLabel}</Link><span className="pv-breadcrumb__sep">›</span></>}
          <span>{name}</span>
        </div>
      </div>

      {/* ── MAIN ── */}
      <section className="pv-main">
        <div className="container pv-main__grid">

          {/* Image column */}
          <div className="pv-image-col">
            <div className="pv-image-wrap">
              <img
                src={mainSrc}
                alt={name}
                className="pv-image"
                onError={(e) => { e.target.src = ph(600, 600, name); }}
              />
              {isOnSale && <span className="pv-image-badge pv-image-badge--sale">Sale</span>}
              {stock === 0 && <span className="pv-image-badge" style={{ background:"#DC2626", color:"#fff", right:"12px", top:"12px" }}>Out of Stock</span>}
            </div>

            {images.length > 1 && (
              <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginTop:"12px" }}>
                {images.map((img, i) => (
                  <button key={img.id ?? i} onClick={() => setActiveImg(i)}
                    style={{ width:"60px", height:"60px", borderRadius:"8px", overflow:"hidden", padding:0, cursor:"pointer",
                      border: i===activeImg ? "2px solid #4d7b65" : "2px solid #e2e8f0",
                      background:"#f8fafc", transition:"border-color 0.15s", flexShrink:0 }}>
                    <img
                      src={`${BASE}/storage/${img.image_path}`}
                      alt={`thumb-${i+1}`}
                      style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                      onError={(e) => { e.target.src = ph(60,60,""); }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info column */}
          <div className="pv-info-col">
            {catLabel && <span className="pv-cat">{catLabel.toUpperCase()}</span>}
            <h1 className="pv-name">{name}</h1>

            {reviews > 0
              ? <StarRating rating={avgRating} count={reviews} />
              : <div style={{ fontSize:"13px", color:"#9ca3af", marginBottom:"8px" }}>No reviews yet</div>
            }

            <div style={{ display:"inline-flex", alignItems:"center", gap:"6px", padding:"4px 12px",
              borderRadius:"20px", background:stockStatus.bg, color:stockStatus.color,
              fontSize:"12px", fontWeight:700, marginBottom:"12px" }}>
              <span>{stock > 0 ? "●" : "○"}</span> {stockStatus.label}
              {stock > 0 && stock <= 10 && <span style={{ fontWeight:400 }}>({stock} left)</span>}
            </div>

            <div className="pv-price-row">
              <span className="pv-price">
                ₱{price.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </span>
              {isOnSale && <span className="pv-price-badge">ON SALE</span>}
            </div>

            {desc && <p className="pv-desc">{desc}</p>}

            <div className="pv-divider" />

            {/* Quantity */}
            <div style={{ display:"flex", alignItems:"center", gap:"16px", margin:"16px 0" }}>
              <span style={{ fontSize:"14px", fontWeight:600, color:"#374151" }}>Quantity</span>
              <div style={{ display:"flex", alignItems:"center", gap:"0", border:"1.5px solid #D1FAE5", borderRadius:"10px", overflow:"hidden" }}>
                <button
                  onClick={() => setQty(q => Math.max(1, q-1))}
                  style={{ width:"38px", height:"38px", border:"none", background:"#f0faf5", color:"#4d7b65",
                    fontSize:"18px", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
                >−</button>
                <span style={{ minWidth:"40px", textAlign:"center", fontSize:"15px", fontWeight:700, color:"#0F172A", background:"#fff" }}>{qty}</span>
                <button
                  onClick={() => setQty(q => q+1)}
                  style={{ width:"38px", height:"38px", border:"none", background:"#f0faf5", color:"#4d7b65",
                    fontSize:"18px", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
                >+</button>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display:"flex", gap:"12px", marginTop:"8px", flexWrap:"wrap" }}>
              <button
                onClick={handleAdd}
                disabled={stock === 0 || cartLoading}
                style={{
                  flex:"1", minWidth:"160px", padding:"14px 24px",
                  background: added ? "#059669" : "linear-gradient(135deg,#4d7b65,#2d5a42)",
                  color:"#fff", border:"none", borderRadius:"12px",
                  fontSize:"15px", fontWeight:700, cursor: stock===0 ? "not-allowed" : "pointer",
                  opacity: stock===0 ? 0.5 : 1,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
                  transition:"all 0.2s", boxShadow: added ? "none" : "0 4px 14px rgba(77,123,101,0.35)",
                }}
                onMouseEnter={e => { if(stock>0 && !added) e.currentTarget.style.transform="translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; }}
              >
                {cartLoading
                  ? <span style={{ display:"inline-block", width:"18px", height:"18px", border:"2.5px solid rgba(255,255,255,0.4)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
                  : <span style={{ fontSize:"18px" }}>{added ? "✓" : "🛒"}</span>
                }
                {cartLoading ? "Adding..." : added ? "Added to Cart!" : "Add to Cart"}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={stock === 0 || cartLoading}
                style={{
                  flex:"1", minWidth:"160px", padding:"14px 24px",
                  background: "linear-gradient(135deg,#1e40af,#1d4ed8)",
                  color:"#fff", border:"none", borderRadius:"12px",
                  fontSize:"15px", fontWeight:700, cursor: stock===0 ? "not-allowed" : "pointer",
                  opacity: stock===0 ? 0.5 : 1,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
                  transition:"all 0.2s", boxShadow:"0 4px 14px rgba(29,78,216,0.35)",
                }}
                onMouseEnter={e => { if(stock>0) e.currentTarget.style.transform="translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; }}
              >
                <span style={{ fontSize:"18px" }}>⚡</span>
                Buy Now
              </button>
            </div>

            {totalItems > 0 && (
              <Link to="/cart" className="pv-cart-link">
                View Cart ({totalItems} item{totalItems !== 1 ? "s" : ""}) →
              </Link>
            )}

            <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginTop:"16px" }}>
              {["🚚 Free delivery in Metro Manila","✅ Quality guaranteed","🔄 Easy returns"].map(t => (
                <span key={t} style={{ fontSize:"12px", padding:"6px 12px", background:"#f0faf5",
                  color:"#2d5a42", borderRadius:"20px", border:"1px solid #D1FAE5", fontWeight:500 }}>{t}</span>
              ))}
            </div>

            {cartError && (
              <div style={{
                marginTop:"12px", padding:"12px 16px", borderRadius:"10px",
                background: cartError.includes("logged in") ? "#EFF6FF" : "#FEF2F2",
                border: `1px solid ${cartError.includes("logged in") ? "#BFDBFE" : "#FECACA"}`,
                color: cartError.includes("logged in") ? "#1D4ED8" : "#DC2626",
                fontSize:"13px", fontWeight:500,
                display:"flex", alignItems:"center", justifyContent:"space-between", gap:"8px"
              }}>
                <span style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                  <span style={{ fontSize:"16px" }}>{cartError.includes("logged in") ? "🔒" : "⚠️"}</span>
                  {cartError}
                </span>
                {cartError.includes("logged in") && (
                  <Link to="/login" style={{ fontWeight:700, color:"#1D4ED8", whiteSpace:"nowrap", textDecoration:"none", padding:"4px 10px", background:"#DBEAFE", borderRadius:"6px" }}>
                    Log in →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── TABS ── */}
      <section className="pv-tabs-section">
        <div className="container">
          <div style={{ display:"flex", gap:"4px", borderBottom:"2px solid #e2e8f0", marginBottom:"32px" }}>
            {["overview","specifications","reviews"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding:"12px 24px", border:"none",
                  fontSize:"14px", fontWeight: activeTab===tab ? 700 : 500,
                  color: activeTab===tab ? "#4d7b65" : "#64748B",
                  borderBottom: activeTab===tab ? "2px solid #4d7b65" : "2px solid transparent",
                  marginBottom:"-2px", cursor:"pointer", borderRadius:"4px 4px 0 0",
                  transition:"all 0.15s",
                  background: activeTab===tab ? "#f0faf5" : "transparent",
                }}
              >
                {tab === "reviews"
                  ? `Reviews${reviews > 0 ? ` (${reviews})` : ""}`
                  : tab.charAt(0).toUpperCase()+tab.slice(1)
                }
              </button>
            ))}
          </div>

          <div style={{ background:"#fff", borderRadius:"12px", padding:"28px 0", minHeight:"200px" }}>

            {activeTab === "overview" && (
              <div className="pv-overview">
                <h3>Product Overview</h3>
                <p>{desc || "No description available for this product."}</p>
                <p>JEM 8 Circle Trading Co. sources only quality-assured products for your business. This item is available for bulk ordering with discounted pricing for orders of 10 units or more. Contact us for bulk quotations.</p>
                <div className="pv-overview-features">
                  {["Premium quality materials","Suitable for office and commercial use","Available for bulk orders","Direct delivery to your office"].map(f => (
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
                    <tr><td>Product ID</td><td>#{product.id}</td></tr>
                    <tr><td>Category</td><td>{catLabel || "—"}</td></tr>
                    <tr><td>Brand</td><td>JEM 8 Certified</td></tr>
                    <tr><td>Stock</td><td>{stock} units</td></tr>
                    <tr><td>Status</td><td style={{ color:stockStatus.color, fontWeight:600 }}>{stockStatus.label}</td></tr>
                    <tr><td>On Sale</td><td>{isOnSale ? "Yes" : "No"}</td></tr>
                    <tr><td>Rating</td><td>{reviews > 0 ? `${avgRating.toFixed(1)} / 5.0 (${reviews} reviews)` : "No reviews yet"}</td></tr>
                    <tr><td>Delivery</td><td>Metro Manila: 1–2 days · Laguna: 2–3 days</td></tr>
                    <tr><td>Bulk Pricing</td><td>Available for 10+ units</td></tr>
                    {product.created_at && (
                      <tr><td>Listed</td><td>{new Date(product.created_at).toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"})}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="pv-reviews">
                <h3>Customer Reviews</h3>

                {/* ── Summary bar ── */}
                {reviews > 0 && (
                  <div className="pv-reviews-summary">
                    <div className="pv-reviews-big">{avgRating.toFixed(1)}</div>
                    <div>
                      <StarRating rating={avgRating} />
                      <div className="pv-reviews-count">
                        Based on {reviews} review{reviews !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Reviews list ── */}
                {reviewsLoading ? (
                  <div style={{ padding: "32px 0", textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>
                    <span style={{ display:"inline-block", width:"20px", height:"20px", border:"2.5px solid #d1d5db", borderTopColor:"#4d7b65", borderRadius:"50%", animation:"spin 0.7s linear infinite", marginRight:"10px", verticalAlign:"middle" }} />
                    Loading reviews…
                  </div>
                ) : reviewsList.length === 0 ? (
                  <div style={{ padding: "32px 0", textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>
                    <div style={{ fontSize: "36px", marginBottom: "10px" }}>💬</div>
                    No reviews yet. Be the first to review this product!
                  </div>
                ) : (
                  reviewsList.map((r, i) => {
                    const reviewer = (r.user ? [r.user.first_name, r.user.last_name].filter(Boolean).join(" ") : null) ?? r.user?.name ?? r.name ?? "Anonymous";
                    const reviewRating = Number(r.rating ?? r.stars ?? 0);
                    const reviewText   = r.review_text ?? r.comment ?? r.body ?? "";
                    const reviewDate   = r.created_at
                      ? new Date(r.created_at).toLocaleDateString("en-PH", { year:"numeric", month:"short", day:"numeric" })
                      : "";
                    return (
                      <div key={r.id ?? i} className="pv-review-card">
                        <div className="pv-review-card__header">
                          <div className="pv-review-card__avatar" style={{color:""}}>{reviewer[0].toUpperCase()}</div>
                          <div style={{ flex: 1 }}>
                            <div className="pv-review-card__name">{reviewer}</div>
                            <StarRating rating={reviewRating} />
                          </div>
                          {reviewDate && (
                            <div style={{ fontSize: "12px", color: "#9ca3af", whiteSpace: "nowrap" }}>
                              {reviewDate}
                            </div>
                          )}
                        </div>
                        {reviewText && <p className="pv-review-card__text">{reviewText}</p>}
                      </div>
                    );
                  })
                )}

                {/* ── Write a review ── */}
                <div style={{ borderTop: "1.5px solid #e2ede8", marginTop: "32px", paddingTop: "8px" }}>
                  {currentUser ? (
                    <ReviewForm
                      productId={productId}
                      user={currentUser}
                      onSubmitted={() => setReviewRefresh(r => r + 1)}
                    />
                  ) : currentUser === false ? (
                    <div style={{
                      marginTop: "24px", padding: "20px 24px", borderRadius: "12px",
                      background: "#f8fafc", border: "1.5px dashed #d1d5db",
                      textAlign: "center",
                    }}>
                      <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔒</div>
                      <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 14px" }}>
                        You need to be logged in to write a review.
                      </p>
                      <Link to="/login" style={{
                        display: "inline-block", padding: "9px 22px",
                        background: "linear-gradient(135deg,#4d7b65,#2d5a42)",
                        color: "#fff", borderRadius: "8px", fontWeight: 600,
                        fontSize: "13px", textDecoration: "none",
                      }}>
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
        <section className="pv-related">
          <div className="container">
            <span className="section-label">More from this Category</span>
            <h2 className="section-title" style={{ marginBottom:32 }}>You May Also Like</h2>
            <div className="pv-related-grid">
              {related.map((p, i) => <RelatedCard key={p.id ?? i} product={p} />)}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}