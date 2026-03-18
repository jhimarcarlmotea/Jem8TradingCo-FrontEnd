import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Header, Footer } from "../components/Layout";
import "../style/global.css";
import "../style/cart.css";

const SHIPPING_FEE = 150;
const FREE_SHIPPING_MIN = 2000;
const BASE = "http://127.0.0.1:8000/api";

const ph = (w, h, label = "") =>
  `https://placehold.co/${w}x${h}/edf4f0/4d7b65?text=${encodeURIComponent(label)}`;

export default function Cart() {
  const navigate = useNavigate();

  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // ── Fetch cart ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await axios.get(`${BASE}/cart?isCheckout=false`, { withCredentials: true });
        console.log(res)
        const cartItems = res.data.cartItems ?? [];

        const formatted = cartItems.map((c) => ({
          id:        c.cart_id,
          productId: c.product?.product_id,
          name:      c.product?.product_name || "Unknown product",
          image:     c.product?.primary_image_url
            || (c.product?.images?.find((img) => img.is_primary)?.image_path
              ? `http://127.0.0.1:8000/storage/${c.product.images.find((img) => img.is_primary).image_path}`
              : "https://placehold.co/80x80"),
          rawPrice:  Number(c.product?.price || 0),
          price:     `₱${Number(c.product?.price || 0).toLocaleString()}`,
          qty:       c.quantity,
          cat:       c.product?.category_id || "Product",
        }));

        setItems(formatted);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load cart. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  // ── Remove item ────────────────────────────────────────────────────────────
  const removeFromCart = async (id) => {
    try {
      await axios.delete(`${BASE}/cart/${id}`, { withCredentials: true });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // ── Update quantity ────────────────────────────────────────────────────────
  const updateQty = async (id, qty) => {
    if (qty < 1) { removeFromCart(id); return; }
    try {
      await axios.patch(`${BASE}/cart/${id}`, { quantity: qty }, { withCredentials: true });
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)));
    } catch (err) {
      console.error(err);
    }
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const subtotal    = items.reduce((sum, i) => sum + i.rawPrice * i.qty, 0);
  const shippingFee = subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE;
  const total       = subtotal + shippingFee;
  const remaining   = FREE_SHIPPING_MIN - subtotal;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="cart-page">
        <Header />
        <div className="cart-empty">
          <div className="container cart-empty__inner">
            <div className="cart-empty__icon">⏳</div>
            <h2 className="cart-empty__title">Loading your cart…</h2>
            <p className="cart-empty__desc">Just a moment while we fetch your items.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="cart-page">
        <Header />
        <div className="cart-empty">
          <div className="container cart-empty__inner">
            <div className="cart-empty__icon">⚠️</div>
            <h2 className="cart-empty__title">Something went wrong</h2>
            <p className="cart-empty__desc">{error}</p>
            <button className="btn-primary" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Empty cart ─────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="cart-page">
        <Header />
        <div className="cart-empty">
          <div className="container cart-empty__inner">
            <div className="cart-empty__icon">🛒</div>
            <h2 className="cart-empty__title">Your cart is empty</h2>
            <p className="cart-empty__desc">Looks like you haven't added anything yet.</p>
            <Link to="/products" className="btn-primary">Browse Products →</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Cart with items ────────────────────────────────────────────────────────
  return (
    <div className="cart-page">
      <Header />

      {/* Breadcrumb */}
      <div className="pv-breadcrumb">
        <div className="container pv-breadcrumb__inner">
          <Link to="/">Home</Link>
          <span className="pv-breadcrumb__sep">›</span>
          <Link to="/products">Products</Link>
          <span className="pv-breadcrumb__sep">›</span>
          <span>Cart</span>
        </div>
      </div>

      <section className="cart-main">
        <div className="container cart-main__grid">

          {/* ── Items column ── */}
          <div className="cart-items">
            <h1 className="cart-title">
              Shopping Cart{" "}
              <span className="cart-count">
                ({items.length} item{items.length !== 1 ? "s" : ""})
              </span>
            </h1>

            {/* Free-shipping progress bar */}
            {subtotal < FREE_SHIPPING_MIN ? (
              <div className="cart-shipping-bar">
                <span>
                  🚚 Add <strong>₱{remaining.toLocaleString()}</strong> more for FREE shipping!
                </span>
                <div className="cart-shipping-bar__track">
                  <div
                    className="cart-shipping-bar__fill"
                    style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_MIN) * 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="cart-shipping-bar cart-shipping-bar--free">
                🎉 You qualify for <strong>FREE shipping!</strong>
              </div>
            )}

            {items.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item__img">
                  <img
                    src={item.image}
                    alt={item.name}
                    onError={(e) => { e.target.src = ph(80, 80, item.name); }}
                  />
                </div>

                <div className="cart-item__info">
                  <div className="cart-item__cat">{item.cat}</div>
                  <Link to={`/products/${item.productId}`} className="cart-item__name">
                    {item.name}
                  </Link>
                  <div className="cart-item__unit-price">{item.price} each</div>
                </div>

                <div className="cart-item__qty-ctrl">
                  <button
                    className="cart-item__qty-btn"
                    onClick={() => updateQty(item.id, item.qty - 1)}
                  >
                    −
                  </button>
                  <span className="cart-item__qty-val">{item.qty}</span>
                  <button
                    className="cart-item__qty-btn"
                    onClick={() => updateQty(item.id, item.qty + 1)}
                  >
                    +
                  </button>
                </div>

                <div className="cart-item__total">
                  ₱{(item.rawPrice * item.qty).toLocaleString()}
                </div>

                <button
                  className="cart-item__remove"
                  onClick={() => removeFromCart(item.id)}
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            ))}

            <div className="cart-actions">
              <Link to="/products" className="btn-outline">← Continue Shopping</Link>
            </div>
          </div>

          {/* ── Summary column ── */}
          <div className="cart-summary">
            <h2 className="cart-summary__title">Order Summary</h2>

            <div className="cart-summary__rows">
              <div className="cart-summary__row">
                <span>Subtotal ({items.reduce((s, i) => s + i.qty, 0)} items)</span>
                <span>₱{subtotal.toLocaleString()}</span>
              </div>
              <div className="cart-summary__row">
                <span>Shipping</span>
                <span className={shippingFee === 0 ? "cart-summary__free" : ""}>
                  {shippingFee === 0 ? "FREE" : `₱${shippingFee.toLocaleString()}`}
                </span>
              </div>
              <div className="cart-summary__divider" />
              <div className="cart-summary__row cart-summary__row--total">
                <span>Total</span>
                <span>₱{total.toLocaleString()}</span>
              </div>
            </div>

            <button
              className="cart-summary__checkout-btn"
              onClick={() => navigate("/checkout")}
            >
              Proceed to Checkout →
            </button>

            <div className="cart-summary__secure">
              🔒 Secure checkout · All transactions are protected
            </div>

            <div className="cart-summary__payments">
              {["GCash", "Maya", "BPI", "COD", "Check"].map((p) => (
                <span key={p} className="cart-summary__payment-chip">{p}</span>
              ))}
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}