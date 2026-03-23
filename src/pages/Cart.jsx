import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Header, Footer } from "../components/Layout";

const SHIPPING_FEE = 150;
const FREE_SHIPPING_MIN = 2000;
const BASE = "http://127.0.0.1:8000/api";

const ph = (w, h, label = "") =>
  `https://placehold.co/${w}x${h}/edf4f0/4d7b65?text=${encodeURIComponent(label)}`;

export default function Cart() {
  const navigate = useNavigate();

  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // ── Fetch cart ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await axios.get(`${BASE}/cart?isCheckout=false`, { withCredentials: true });
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

  // ── Remove item ─────────────────────────────────────────────────────────
  const removeFromCart = async (id) => {
    try {
      await axios.delete(`${BASE}/cart/${id}`, { withCredentials: true });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // ── Update quantity ─────────────────────────────────────────────────────
  const updateQty = async (id, qty) => {
    if (qty < 1) { removeFromCart(id); return; }
    try {
      await axios.patch(`${BASE}/cart/${id}`, { quantity: qty }, { withCredentials: true });
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)));
    } catch (err) {
      console.error(err);
    }
  };

  // ── Derived values ──────────────────────────────────────────────────────
  const subtotal    = items.reduce((sum, i) => sum + i.rawPrice * i.qty, 0);
  const shippingFee = subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE;
  const total       = subtotal + shippingFee;
  const remaining   = FREE_SHIPPING_MIN - subtotal;

  // ── Shared empty/loading/error wrapper ──────────────────────────────────
  const PageShell = ({ children }) => (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-4">
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <PageShell>
        <div className="text-6xl">⏳</div>
        <h2 className="text-[28px] font-bold text-[#1a2e22] m-0">Loading your cart…</h2>
        <p className="text-[#6b7c70] text-base m-0">Just a moment while we fetch your items.</p>
      </PageShell>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────
  if (error) {
    return (
      <PageShell>
        <div className="text-6xl">⚠️</div>
        <h2 className="text-[28px] font-bold text-[#1a2e22] m-0">Something went wrong</h2>
        <p className="text-[#6b7c70] text-base m-0">{error}</p>
        <button className="btn-primary" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </PageShell>
    );
  }

  // ── Empty cart ──────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <PageShell>
        <div className="text-6xl">🛒</div>
        <h2 className="text-[28px] font-bold text-[#1a2e22] m-0">Your cart is empty</h2>
        <p className="text-[#6b7c70] text-base m-0">Looks like you haven't added anything yet.</p>
        <Link to="/products" className="btn-primary">Browse Products →</Link>
      </PageShell>
    );
  }

  // ── Cart with items ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-[#f8faf9] border-b border-[#e8f0eb] mt-[75px]">
        <div className="container mx-auto px-4 flex items-center gap-2 py-3 text-xs text-[#6b7c70] flex-wrap">
          <Link to="/" className="text-[#4d7b65] no-underline hover:underline">Home</Link>
          <span className="text-gray-300">›</span>
          <Link to="/products" className="text-[#4d7b65] no-underline hover:underline">Products</Link>
          <span className="text-gray-300">›</span>
          <span>Cart</span>
        </div>
      </div>

      {/* Main */}
      <section className="py-12 pb-20">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 items-start">

          {/* ── Items column ── */}
          <div>
            <h1 className="text-[28px] font-bold text-[#1a2e22] m-0 mb-6">
              Shopping Cart{" "}
              <span className="text-lg text-[#6b7c70] font-normal">
                ({items.length} item{items.length !== 1 ? "s" : ""})
              </span>
            </h1>

            {/* Free-shipping progress bar */}
            {subtotal < FREE_SHIPPING_MIN ? (
              <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl px-4 py-3.5 mb-5 text-sm text-[#166534] flex flex-col gap-2">
                <span>
                  🚚 Add <strong>₱{remaining.toLocaleString()}</strong> more for FREE shipping!
                </span>
                <div className="h-1.5 bg-[#d1fae5] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#16a34a] rounded-full transition-all duration-400"
                    style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_MIN) * 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-[#f0fdf4] border border-[#86efac] rounded-xl px-4 py-3.5 mb-5 text-sm text-[#166534]">
                🎉 You qualify for <strong>FREE shipping!</strong>
              </div>
            )}

            {/* Cart items */}
            {items.map((item) => (
              <div
                key={item.id}
                className="grid gap-4 items-center bg-white border border-[#e8f0eb] rounded-2xl px-5 py-4 mb-3 transition-shadow hover:shadow-[0_4px_16px_rgba(77,123,101,0.08)]"
                style={{ gridTemplateColumns: "80px 1fr auto auto auto" }}
              >
                {/* Image */}
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#f3f8f5] flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = ph(80, 80, item.name); }}
                  />
                </div>

                {/* Info */}
                <div className="min-w-0">
                  <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#4d7b65] mb-1">
                    {item.cat}
                  </div>
                  <Link
                    to={`/products/${item.productId}`}
                    className="block text-sm font-semibold text-[#1a2e22] no-underline mb-1 truncate hover:text-[#4d7b65]"
                  >
                    {item.name}
                  </Link>
                  <div className="text-xs text-gray-400">{item.price} each</div>
                </div>

                {/* Qty control */}
                <div className="flex items-center bg-[#f3f8f5] rounded-xl border border-[#d1e8da] overflow-hidden">
                  <button
                    className="w-[34px] h-[34px] bg-transparent border-none text-lg cursor-pointer text-[#4d7b65] font-bold hover:bg-[#e8f0eb] transition-colors flex items-center justify-center"
                    onClick={() => updateQty(item.id, item.qty - 1)}
                  >
                    −
                  </button>
                  <span className="min-w-[32px] text-center font-bold text-sm text-[#1a2e22]">
                    {item.qty}
                  </span>
                  <button
                    className="w-[34px] h-[34px] bg-transparent border-none text-lg cursor-pointer text-[#4d7b65] font-bold hover:bg-[#e8f0eb] transition-colors flex items-center justify-center"
                    onClick={() => updateQty(item.id, item.qty + 1)}
                  >
                    +
                  </button>
                </div>

                {/* Line total */}
                <div className="text-[17px] font-bold text-[#4d7b65] min-w-[80px] text-right">
                  ₱{(item.rawPrice * item.qty).toLocaleString()}
                </div>

                {/* Remove */}
                <button
                  className="bg-transparent border-none text-gray-300 cursor-pointer text-lg px-2 py-1 rounded-md transition-all hover:text-red-500 hover:bg-red-50"
                  onClick={() => removeFromCart(item.id)}
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* Continue shopping */}
            <div className="mt-4 flex gap-3">
              <Link to="/products" className="btn-outline">← Continue Shopping</Link>
            </div>
          </div>

          {/* ── Summary column ── */}
          <div className="bg-white border border-[#e8f0eb] rounded-[20px] p-7 lg:sticky lg:top-[100px]" style={{ borderWidth: "1.5px" }}>
            <h2 className="text-xl font-bold text-[#1a2e22] m-0 mb-5">Order Summary</h2>

            <div className="flex flex-col gap-3 mb-5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal ({items.reduce((s, i) => s + i.qty, 0)} items)</span>
                <span>₱{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span className={shippingFee === 0 ? "text-[#16a34a] font-bold" : ""}>
                  {shippingFee === 0 ? "FREE" : `₱${shippingFee.toLocaleString()}`}
                </span>
              </div>
              <hr className="border-none border-t border-[#e8f0eb] my-0" />
              <div className="flex justify-between text-lg font-bold text-[#1a2e22]">
                <span>Total</span>
                <span>₱{total.toLocaleString()}</span>
              </div>
            </div>

            <button
              className="w-full py-4 bg-[#3d6552] text-white border-none rounded-xl text-base font-bold cursor-pointer transition-all mb-3.5 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(77,123,101,0.25)]"
              onClick={() => navigate("/checkout")}
            >
              Proceed to Checkout →
            </button>

            <div className="text-center text-xs text-gray-400 mb-4">
              🔒 Secure checkout · All transactions are protected
            </div>

            <div className="flex flex-wrap gap-1.5 justify-center">
              {["GCash", "Maya", "BPI", "COD", "Check"].map((p) => (
                <span
                  key={p}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#f3f8f5] text-[#4d7b65] border border-[#d1e8da]"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}