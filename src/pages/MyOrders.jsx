import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Header } from "../components/Layout";

/* ─── Axios instance ──────────────────────────────────────── */
const api = axios.create({
  baseURL:         "http://127.0.0.1:8000/api",
  withCredentials: true,
  headers:         { "Content-Type": "application/json" },
});

/* ─── Helpers ─────────────────────────────────────────────── */
const ph = (w, h, label = "") =>
  `https://placehold.co/${w}x${h}/edf4f0/4d7b65?text=${encodeURIComponent(label)}`;

const STATUS_COLORS = {
  processing: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  confirmed:  { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  shipped:    { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  delivered:  { bg: "#f0fdf4", color: "#166534", border: "#86efac" },
  cancelled:  { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  on_the_way: { bg: "#fff7ed", color: "#d97706", border: "#fde68a" },
  ready:      { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
};

const STATUS_STEPS = ["processing", "confirmed", "shipped", "delivered"];

function normaliseOrder(o, account) {
  const { checkout, delivery, items = [] } = o;
  const status = (delivery?.status ?? "processing").toLowerCase();

  return {
    id:             delivery?.delivery_id ?? checkout?.checkout_id,
    date:           checkout?.created_at
                      ? new Date(checkout.created_at).toLocaleDateString("en-PH", {
                          year: "numeric", month: "long", day: "numeric",
                        })
                      : "—",
    status,
    paymentMethod:  checkout?.payment_method ?? "—",
    paymentDetails: checkout?.payment_details ?? null,
    subtotal:       Number(checkout?.paid_amount ?? 0) - Number(checkout?.shipping_fee ?? 0),
    shippingFee:    Number(checkout?.shipping_fee ?? 0),
    total:          Number(checkout?.paid_amount ?? 0),
    specialNote:    checkout?.special_instructions ?? delivery?.notes ?? "",
    delivery: {
      firstName: account?.first_name   ?? "",
      lastName:  account?.last_name    ?? "",
      phone:     account?.phone_number ?? "",
      email:     account?.email        ?? "",
      address:   delivery?.address  ?? "",
      barangay:  delivery?.barangay  ?? "",
      city:      delivery?.city      ?? "",
      province:  delivery?.province  ?? "",
      zip:       delivery?.zip       ?? "",
    },
    items: items.map((item) => ({
      id:       item.id       ?? item.product_id,
      name:     item.name     ?? item.product_name ?? "Item",
      image:    item.image    ?? item.product_image ?? "",
      qty:      Number(item.qty ?? item.quantity ?? 1),
      price:    `₱${Number(item.unit_price ?? item.price ?? 0).toLocaleString()}`,
      rawPrice: Number(item.unit_price ?? item.price ?? 0),
    })),
  };
}

/* ─── Empty / loading shell ───────────────────────────────── */
function Shell({ children }) {
  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <Header />
      <div className="min-h-[55vh] flex items-center justify-center px-4 mt-[75px]">
        <div className="text-center">{children}</div>
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────── */
export default function MyOrders() {
  const [searchParams] = useSearchParams();
  const newOrderId = searchParams.get("new");

  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [selected,  setSelected]  = useState(newOrderId || null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.get("/my-deliveries")
      .then(({ data }) => {
        if (cancelled) return;
        const account    = data.account ?? {};
        const rawOrders  = Array.isArray(data.orders) ? data.orders : (data.data ?? []);
        const normalised = rawOrders.map((o) => normaliseOrder(o, account));
        setOrders(normalised);
        if (newOrderId && normalised.some((o) => String(o.id) === String(newOrderId))) {
          setSelected(String(newOrderId));
        } else if (normalised.length > 0) {
          setSelected(String(normalised[0].id));
        }
      })
      .catch((err) => {
        if (!cancelled)
          setError(err.response?.data?.message ?? err.message ?? "Unknown error");
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [newOrderId]);

  if (loading) return (
    <Shell>
      <div className="text-5xl mb-4">⏳</div>
      <h2 className="text-xl font-bold text-[#1a2e22]">Loading your orders…</h2>
    </Shell>
  );

  if (error) return (
    <Shell>
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold text-[#1a2e22] mb-2">Could not load orders</h2>
      <p className="text-sm text-slate-500 mb-5">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2.5 bg-[#4d7b65] text-white rounded-xl text-sm font-bold cursor-pointer border-none"
      >
        Try Again
      </button>
    </Shell>
  );

  if (orders.length === 0) return (
    <Shell>
      {newOrderId ? (
        <>
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-[#1a2e22] mb-2">Order Placed Successfully!</h2>
          <p className="text-sm text-slate-500 mb-5 max-w-sm mx-auto">
            Your order <strong>{newOrderId}</strong> has been received and is being processed.
            We'll contact you shortly to confirm your payment.
          </p>
          <Link to="/products" className="inline-block px-6 py-2.5 bg-[#4d7b65] text-white rounded-xl text-sm font-bold no-underline">
            Continue Shopping →
          </Link>
        </>
      ) : (
        <>
          <div className="text-5xl mb-4">📦</div>
          <h2 className="text-xl font-bold text-[#1a2e22] mb-2">No orders yet</h2>
          <p className="text-sm text-slate-500 mb-5">Your order history will appear here once you place your first order.</p>
          <Link to="/products" className="inline-block px-6 py-2.5 bg-[#4d7b65] text-white rounded-xl text-sm font-bold no-underline">
            Start Shopping →
          </Link>
        </>
      )}
    </Shell>
  );

  const filtered = activeTab === "all" ? orders : orders.filter((o) => o.status === activeTab);
  const selectedOrder = orders.find((o) => String(o.id) === String(selected));

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <Header />

      {/* ── Breadcrumb ── */}
      <div className="bg-[#f8faf9] border-b border-[#e8f0eb] mt-[75px]">
        <div className="container mx-auto px-4 flex items-center gap-2 py-3 text-xs text-[#6b7c70] flex-wrap">
          <Link to="/" className="text-[#4d7b65] no-underline hover:underline">Home</Link>
          <span className="text-gray-300">›</span>
          <span>My Orders</span>
        </div>
      </div>

      {/* ── Success banner ── */}
      {newOrderId && (
        <div className="bg-[#f0fdf4] border-b border-[#bbf7d0] py-3.5">
          <div className="container mx-auto px-4 flex items-center gap-4 text-sm text-[#166534] flex-wrap">
            🎉 <strong>Order {newOrderId}</strong> placed successfully! We'll contact you to confirm your payment.
            <Link to="/products" className="ml-auto text-[#4d7b65] font-bold no-underline hover:underline">
              Continue Shopping →
            </Link>
          </div>
        </div>
      )}

      {/* ── Main layout ── */}
      <section className="py-10 pb-20">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 items-start">

          {/* ── ORDER LIST COL ── */}
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-[#1a2e22] m-0">My Orders</h1>
              <span className="text-xs text-slate-400 bg-[#f3f8f5] px-2.5 py-1 rounded-full">
                {orders.length} total
              </span>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
              {["all", "processing", "confirmed", "shipped", "delivered"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-1.5 rounded-full border-[1.5px] text-xs font-semibold cursor-pointer transition-all whitespace-nowrap
                    ${activeTab === tab
                      ? "bg-[#4d7b65] text-white border-[#4d7b65]"
                      : "bg-white text-[#6b7c70] border-[#e8f0eb] hover:border-[#4d7b65] hover:text-[#4d7b65]"
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Empty tab */}
            {filtered.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400 bg-[#f8faf9] rounded-xl border border-[#e8f0eb]">
                No orders in this category.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {filtered.map((order) => {
                  const colors   = STATUS_COLORS[order.status] || STATUS_COLORS.processing;
                  const isActive = String(selected) === String(order.id);
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelected(String(order.id))}
                      className={`bg-white border-[1.5px] rounded-2xl px-4 py-4 cursor-pointer transition-all
                        ${isActive
                          ? "border-[#4d7b65] bg-[#f3f8f5] shadow-[0_4px_14px_rgba(77,123,101,0.12)]"
                          : "border-[#e8f0eb] hover:border-[#4d7b65] hover:shadow-[0_4px_14px_rgba(77,123,101,0.10)]"
                        }`}
                    >
                      {/* Top row */}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-sm font-bold text-[#1a2e22]">#{order.id}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{order.date}</div>
                        </div>
                        <span
                          className="text-[11px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0"
                          style={{ background: colors.bg, color: colors.color, borderColor: colors.border }}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>

                      {/* Item thumbnails */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-3">
                        {order.items.slice(0, 3).map((item) => (
                          <img
                            key={item.id}
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover bg-[#f3f8f5] border border-[#e8f0eb]"
                            onError={(e) => { e.target.src = ph(40, 40, item.name); }}
                          />
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-10 h-10 rounded-lg bg-[#f3f8f5] flex items-center justify-center text-xs font-bold text-slate-400">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex justify-between items-center pt-2.5 border-t border-[#f3f8f5]">
                        <span className="text-xs text-[#6b7c70] bg-[#f3f8f5] px-2.5 py-1 rounded-full capitalize">
                          {order.paymentMethod}
                        </span>
                        <span className="text-base font-bold text-[#4d7b65]">
                          ₱{order.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── ORDER DETAIL COL ── */}
          <div>
            {!selectedOrder ? (
              <div className="h-[300px] flex flex-col items-center justify-center gap-3 bg-[#f8faf9] rounded-2xl border-[1.5px] border-dashed border-[#e8f0eb]">
                <span className="text-4xl">📋</span>
                <p className="text-sm text-slate-400 m-0">Select an order to view details</p>
              </div>
            ) : (() => {
              const colors = STATUS_COLORS[selectedOrder.status] || STATUS_COLORS.processing;
              return (
                <div className="bg-white border-[1.5px] border-[#e8f0eb] rounded-2xl p-7">

                  {/* Detail header */}
                  <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
                    <div>
                      <h2 className="text-[22px] font-bold text-[#1a2e22] m-0">#{selectedOrder.id}</h2>
                      <div className="text-xs text-slate-400 mt-1">Placed on {selectedOrder.date}</div>
                    </div>
                    <span
                      className="text-xs font-bold px-3.5 py-1.5 rounded-full border"
                      style={{ background: colors.bg, color: colors.color, borderColor: colors.border }}
                    >
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </div>

                  {/* Tracker */}
                  {selectedOrder.status !== "cancelled" && (
                    <div className="flex items-center mb-7 p-5 bg-[#f8faf9] rounded-xl border border-[#e8f0eb] overflow-x-auto">
                      {STATUS_STEPS.map((s, i) => {
                        const currentIdx = STATUS_STEPS.indexOf(selectedOrder.status);
                        const isDone    = i < currentIdx;
                        const isCurrent = i === currentIdx;
                        return (
                          <div key={s} className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-all
                                ${isDone    ? "bg-green-600 text-white"
                                : isCurrent ? "bg-[#4d7b65] text-white"
                                :             "bg-[#e8f0eb] text-slate-400"}`}>
                                {isDone ? "✓" : i + 1}
                              </div>
                              <span className={`text-xs font-semibold transition-colors hidden sm:block
                                ${isDone    ? "text-green-600"
                                : isCurrent ? "text-[#4d7b65] font-bold"
                                :             "text-slate-400"}`}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </span>
                            </div>
                            {i < STATUS_STEPS.length - 1 && (
                              <div className={`min-w-6 h-0.5 mx-1.5 transition-colors flex-shrink-0 ${isDone ? "bg-green-600" : "bg-[#e8f0eb]"}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Delivery Address */}
                  <div className="mb-5">
                    <div className="text-[13px] font-bold text-[#6b7c70] uppercase tracking-wide mb-2.5">📦 Delivery Address</div>
                    <div className="px-4 py-3.5 bg-[#f8faf9] rounded-xl border border-[#e8f0eb] text-sm text-slate-700 leading-relaxed">
                      <strong>{selectedOrder.delivery.firstName} {selectedOrder.delivery.lastName}</strong><br />
                      {selectedOrder.delivery.phone} · {selectedOrder.delivery.email}
                      {(selectedOrder.delivery.address || selectedOrder.delivery.city) && (
                        <>
                          <br />
                          {selectedOrder.delivery.address}
                          {selectedOrder.delivery.barangay && `, ${selectedOrder.delivery.barangay}`}
                          {selectedOrder.delivery.city     && `, ${selectedOrder.delivery.city}`}
                          {selectedOrder.delivery.province && `, ${selectedOrder.delivery.province}`}
                          {selectedOrder.delivery.zip      && ` ${selectedOrder.delivery.zip}`}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Payment */}
                  <div className="mb-5">
                    <div className="text-[13px] font-bold text-[#6b7c70] uppercase tracking-wide mb-2.5">💳 Payment Method</div>
                    <div className="px-4 py-3.5 bg-[#f8faf9] rounded-xl border border-[#e8f0eb] text-sm text-slate-700">
                      <strong className="capitalize">{selectedOrder.paymentMethod}</strong>
                      {selectedOrder.paymentDetails && (
                        <div className="mt-1 text-[13px] text-slate-500">
                          {selectedOrder.paymentDetails.account_name  && <div>Name: {selectedOrder.paymentDetails.account_name}</div>}
                          {selectedOrder.paymentDetails.mobile_number && <div>Number: {selectedOrder.paymentDetails.mobile_number}</div>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mb-5">
                    <div className="text-[13px] font-bold text-[#6b7c70] uppercase tracking-wide mb-2.5">🛒 Items Ordered</div>
                    {selectedOrder.items.length === 0 ? (
                      <div className="px-4 py-3.5 bg-[#f8faf9] rounded-xl border border-[#e8f0eb] text-sm text-slate-500">
                        No item details available.
                      </div>
                    ) : (
                      <div>
                        {selectedOrder.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3.5 py-3 border-b border-[#f3f8f5] last:border-b-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-14 h-14 rounded-xl object-cover bg-[#f3f8f5] border border-[#e8f0eb] flex-shrink-0"
                              onError={(e) => { e.target.src = ph(56, 56, item.name); }}
                            />
                            <div className="flex-1 min-w-0">
                              <Link
                                to={`/products/${item.id}`}
                                className="block text-sm font-semibold text-[#1a2e22] no-underline truncate hover:text-[#4d7b65] transition-colors"
                              >
                                {item.name}
                              </Link>
                              <div className="text-xs text-slate-400 mt-0.5">Qty: {item.qty} × {item.price}</div>
                            </div>
                            <div className="text-[15px] font-bold text-[#4d7b65] flex-shrink-0">
                              ₱{(item.rawPrice * item.qty).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Totals */}
                  <div className="px-4 py-4 bg-[#f8faf9] rounded-xl border border-[#e8f0eb] mb-5 flex flex-col gap-2.5">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Subtotal</span>
                      <span>₱{selectedOrder.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Shipping</span>
                      <span className={selectedOrder.shippingFee === 0 ? "text-green-600 font-bold" : ""}>
                        {selectedOrder.shippingFee === 0 ? "FREE" : `₱${selectedOrder.shippingFee.toLocaleString()}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-[17px] font-bold text-[#1a2e22] pt-2.5 border-t border-[#e8f0eb]">
                      <span>Total Paid</span>
                      <span>₱{selectedOrder.total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Special note */}
                  {selectedOrder.specialNote && (
                    <div className="mb-5">
                      <div className="text-[13px] font-bold text-[#6b7c70] uppercase tracking-wide mb-2.5">📝 Special Instructions</div>
                      <div className="px-4 py-3.5 bg-[#f8faf9] rounded-xl border border-[#e8f0eb] text-sm text-slate-700 leading-relaxed">
                        {selectedOrder.specialNote}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 flex-wrap">
                    <Link
                      to="/products"
                      className="inline-block px-6 py-2.5 bg-[#4d7b65] text-white rounded-xl text-sm font-bold no-underline hover:bg-[#3d6552] transition-colors"
                    >
                      Order Again →
                    </Link>
                    <Link
                      to="/contact"
                      className="inline-block px-6 py-2.5 bg-white text-[#4d7b65] border-[1.5px] border-[#c0ddd0] rounded-xl text-sm font-bold no-underline hover:bg-[#f0f7f3] transition-colors"
                    >
                      Need Help?
                    </Link>
                  </div>

                </div>
              );
            })()}
          </div>

        </div>
      </section>
    </div>
  );
}