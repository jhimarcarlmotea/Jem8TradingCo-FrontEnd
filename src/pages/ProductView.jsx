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

/* ── Star Rating ── */
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

  // ── Fetch product ──
  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoading(true);
      setError(null);
      setActiveImg(0);
      setQty(1);
      setActiveTab("overview");
      try {
        const res  = await axios.get(`${BASE}/api/products/${id}`, { withCredentials: true });
        const data = res.data?.product ?? res.data?.data ?? res.data;
        console.log("Product API response:", data); // debug — check which id field is used
        setProduct(data);

        // fetch related from same category
        const catId = data?.category_id ?? data?.category?.id ?? data?.category?.category_id;
        const pid   = data?.id ?? data?.product_id;
        if (catId) {
          try {
            const all  = await axios.get(`${BASE}/api/admin/products`, { withCredentials: true }); // admin list for related
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
    fetch();
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
  const rating   = parseFloat(product.rating ?? 4.5);
  const reviews  = product.reviews ?? product.reviews_count ?? 0;

  // ── Shared cart API call (session cookie auth) ──
  const callAddToCart = async () => {
    const productId = product.product_id ?? product.id;
    const data = { product_id: productId, quantity: qty };
    console.log(data)
    return axios.post(
      `${BASE}/api/cart/add`,
      data,
      {
        withCredentials: true,
      }
    );
  };

  const handleAdd = async () => {
    if (cartLoading || stock === 0) return;
    setCartLoading(true);
    setCartError(null);
    try {
      await callAddToCart();
      addToCart(product, qty); // keep local CartContext in sync
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

            {/* Thumbnail strip */}
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

            <StarRating rating={rating} count={reviews > 0 ? reviews : undefined} />

            {/* Stock status */}
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
                  transform: added ? "none" : "translateY(0)",
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

            {/* Trust badges */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginTop:"16px" }}>
              {["🚚 Free delivery in Metro Manila","✅ Quality guaranteed","🔄 Easy returns"].map(t => (
                <span key={t} style={{ fontSize:"12px", padding:"6px 12px", background:"#f0faf5",
                  color:"#2d5a42", borderRadius:"20px", border:"1px solid #D1FAE5", fontWeight:500 }}>{t}</span>
              ))}
            </div>

            {/* Cart error toast */}
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
                  padding:"12px 24px", border:"none", background:"transparent",
                  fontSize:"14px", fontWeight: activeTab===tab ? 700 : 500,
                  color: activeTab===tab ? "#4d7b65" : "#64748B",
                  borderBottom: activeTab===tab ? "2px solid #4d7b65" : "2px solid transparent",
                  marginBottom:"-2px", cursor:"pointer", borderRadius:"4px 4px 0 0",
                  transition:"all 0.15s",
                  background: activeTab===tab ? "#f0faf5" : "transparent",
                }}
              >
                {tab.charAt(0).toUpperCase()+tab.slice(1)}
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
                    <tr><td>Rating</td><td>{rating.toFixed(1)} / 5.0</td></tr>
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
                <div className="pv-reviews-summary">
                  <div className="pv-reviews-big">{rating.toFixed(1)}</div>
                  <div>
                    <StarRating rating={rating} />
                    {reviews > 0 && <div className="pv-reviews-count">Based on {reviews} reviews</div>}
                  </div>
                </div>
                {[
                  { name:"Maria S.", text:"Excellent quality! Exactly as described and arrived on time.", rating:5 },
                  { name:"Juan D.",  text:"Great product for the price. Will definitely order again in bulk.", rating:5 },
                  { name:"Ana R.",   text:"Good value for money. Delivery was fast.", rating:4 },
                ].map(r => (
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