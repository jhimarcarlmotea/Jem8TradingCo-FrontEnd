import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Header, Footer } from "../components/Layout";
import { useCart } from "../context/CartContext";

const SHIPPING_FEE = 150;
const FREE_SHIPPING_MIN = 2000;
const BASE = "http://127.0.0.1:8000/api";

const ph = (w, h, label = "") =>
  `https://placehold.co/${w}x${h}/edf4f0/4d7b65?text=${encodeURIComponent(label)}`;

export default function Cart() {
  const navigate = useNavigate();
  const { syncCart } = useCart();

  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [checkedIds, setCheckedIds] = useState(new Set()); // ← new

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
          status:    c.product?.status ?? "in_stock",
          }));

        const merged = Object.values(
          formatted.reduce((acc, item) => {
            if (acc[item.productId]) {
              acc[item.productId].qty += item.qty;
              acc[item.productId].allIds.push(item.id);
            } else {
              acc[item.productId] = { ...item, allIds: [item.id] };
            }
            return acc;
          }, {})
        );

        setItems(merged);
        // Keep global cart context in sync so header badge updates correctly
        try { syncCart(merged); } catch (e) { /* ignore if not available */ }
        // Check all items by default
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load cart. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  // ── Checkbox helpers ────────────────────────────────────────────────────
  const toggleCheck = (id) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allChecked   = items.length > 0 && checkedIds.size === items.length;
  const someChecked  = checkedIds.size > 0 && !allChecked;
  const checkedItems = items.filter((i) => checkedIds.has(i.id));

  const toggleAll = () => {
    if (allChecked) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(items.map((i) => i.id)));
    }
  };

  // ── Remove item ─────────────────────────────────────────────────────────
  const removeFromCart = async (id, allIds = null) => {
    try {
      const idsToDelete = allIds ?? [id];
      await Promise.all(
        idsToDelete.map((rid) => axios.delete(`${BASE}/cart/${rid}`, { withCredentials: true }))
      );
      setItems((prev) => {
        const next = prev.filter((i) => i.id !== id);
        try { syncCart(next); } catch (e) { /* ignore */ }
        return next;
      });
      setCheckedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  };

  // ── Update quantity ─────────────────────────────────────────────────────
  const updateQty = async (id, qty) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    if (qty < 1) { removeFromCart(id, item.allIds); return; }

    try {
      const dupes = item.allIds?.filter((rid) => rid !== id) ?? [];
      await Promise.all(
        dupes.map((rid) => axios.delete(`${BASE}/cart/${rid}`, { withCredentials: true }))
      );
      await axios.patch(`${BASE}/cart/${id}`, { quantity: qty }, { withCredentials: true });
      setItems((prev) => {
        const next = prev.map((i) => (i.id === id ? { ...i, qty, allIds: [id] } : i));
        try { syncCart(next); } catch (e) { /* ignore */ }
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  };

  // ── Derived values (checked items only) ────────────────────────────────
  const subtotal    = checkedItems.reduce((sum, i) => sum + i.rawPrice * i.qty, 0);
  const shippingFee = subtotal > 0 && subtotal >= FREE_SHIPPING_MIN ? 0 : subtotal > 0 ? SHIPPING_FEE : 0;
  const total       = subtotal + shippingFee;
  const remaining   = FREE_SHIPPING_MIN - subtotal;

  // ── Shared empty/loading/error wrapper ──────────────────────────────────
  const PageShell = ({ children }) => (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
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
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-[28px] font-bold text-[#1a2e22] m-0">
                Shopping Cart{" "}
                <span className="text-lg text-[#6b7c70] font-normal">
                  ({items.length} item{items.length !== 1 ? "s" : ""})
                </span>
              </h1>
            </div>

            {/* Free-shipping progress bar */}
            {subtotal > 0 && subtotal < FREE_SHIPPING_MIN ? (
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
            ) : subtotal >= FREE_SHIPPING_MIN ? (
              <div className="bg-[#f0fdf4] border border-[#86efac] rounded-xl px-4 py-3.5 mb-5 text-sm text-[#166534]">
                🎉 You qualify for <strong>FREE shipping!</strong>
              </div>
            ) : null}

            {/* Select All row */}
            <div className="flex items-center gap-3 px-5 py-3 mb-2 bg-[#f8faf9] border border-[#e8f0eb] rounded-xl">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => { if (el) el.indeterminate = someChecked; }}
                  onChange={toggleAll}
                  className="w-4 h-4 accent-[#3d6552] cursor-pointer"
                />
                <span className="text-sm font-semibold text-[#1a2e22]">
                  Select All
                </span>
              </label>
              {checkedIds.size > 0 && (
                <span className="ml-auto text-xs text-[#6b7c70]">
                  {checkedIds.size} of {items.length} selected
                </span>
              )}
            </div>

            {/* Cart items */}
            {items.map((item) => {
              const isChecked = checkedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`grid gap-4 items-center bg-white border rounded-2xl px-5 py-4 mb-3 transition-all
                    ${isChecked
                      ? "border-[#4d7b65] shadow-[0_2px_12px_rgba(77,123,101,0.1)]"
                      : "border-[#e8f0eb] opacity-60"
                    } hover:shadow-[0_4px_16px_rgba(77,123,101,0.08)]`}
                  style={{ gridTemplateColumns: "24px 80px 1fr auto auto auto" }}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCheck(item.id)}
                    className="w-4 h-4 accent-[#3d6552] cursor-pointer flex-shrink-0"
                  />

                  {/* Image */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#f3f8f5] flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="object-cover w-full h-full"
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
                    {item.status === "pre_order" ? (
                        <div className="mt-1 inline-block text-[11px] font-semibold text-[#92400e] bg-[#FEF3C7] border border-[#FDE68A] px-2 py-1 rounded-full">
                          ⏳ Pre-Order — delivery may take longer
                        </div>
                      ) : (
                        <div className="mt-1 inline-block text-[11px] font-semibold text-[#059669] bg-[#D1FAE5] border border-[#6EE7B7] px-2 py-1 rounded-full">
                          ✅ In Stock
                        </div>
                      )}
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
                    className="px-2 py-1 text-lg text-gray-300 transition-all bg-transparent border-none rounded-md cursor-pointer hover:text-red-500 hover:bg-red-50"
                    onClick={() => removeFromCart(item.id, item.allIds)}
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </div>
              );
            })}

            {/* Continue shopping */}
            <div className="flex gap-3 mt-4">
              <Link to="/products" className="btn-outline">← Continue Shopping</Link>
            </div>
          </div>

          {/* ── Summary column ── */}
          <div
            className="bg-white border border-[#e8f0eb] rounded-[20px] p-7 lg:sticky lg:top-[100px]"
            style={{ borderWidth: "1.5px" }}
          >
            <h2 className="text-xl font-bold text-[#1a2e22] m-0 mb-5">Order Summary</h2>

            <div className="flex flex-col gap-3 mb-5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal ({checkedItems.reduce((s, i) => s + i.qty, 0)} items)</span>
                <span>₱{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span className={shippingFee === 0 && subtotal > 0 ? "text-[#16a34a] font-bold" : ""}>
                  {subtotal === 0 ? "—" : shippingFee === 0 ? "FREE" : `₱${shippingFee.toLocaleString()}`}
                </span>
              </div>
              <hr className="border-none border-t border-[#e8f0eb] my-0" />
              <div className="flex justify-between text-lg font-bold text-[#1a2e22]">
                <span>Total</span>
                <span>₱{total.toLocaleString()}</span>
              </div>
            </div>

            {/* ── Selected items breakdown ── */}
            {checkedItems.length > 0 && (
              <div className="mb-5 bg-[#f8faf9] border border-[#e8f0eb] rounded-xl p-4">
                <p className="text-xs font-bold text-[#4d7b65] uppercase tracking-wide mb-3 m-0">
                  Selected Items ({checkedItems.length})
                </p>
                <div className="flex flex-col gap-2.5">
                  {checkedItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2.5">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-9 h-9 rounded-lg object-cover bg-[#edf4f0] flex-shrink-0"
                        onError={(e) => { e.target.src = ph(36, 36, item.name); }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#1a2e22] m-0 truncate">{item.name}</p>
                        <p className="text-[11px] text-gray-400 m-0">x{item.qty}</p>
                      </div>
                      <span className="text-xs font-bold text-[#4d7b65] flex-shrink-0">
                        ₱{(item.rawPrice * item.qty).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {checkedItems.length === 0 && (
              <div className="mb-5 bg-[#fff8f0] border border-[#fde68a] rounded-xl px-4 py-3 text-xs text-[#92400e] text-center">
                ⚠️ Select at least one item to proceed.
              </div>
            )}

            <button
              className={`w-full py-4 text-white border-none rounded-xl text-base font-bold transition-all mb-3.5
                ${checkedItems.length > 0
                  ? "bg-[#3d6552] cursor-pointer hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(77,123,101,0.25)]"
                  : "bg-gray-300 cursor-not-allowed"
                }`}
              disabled={checkedItems.length === 0}
              onClick={() => checkedItems.length > 0 && navigate("/checkout", { state: { selectedItems: checkedItems } })}
            >
              Proceed to Checkout →
            </button>

            <div className="mb-4 text-xs text-center text-gray-400">
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