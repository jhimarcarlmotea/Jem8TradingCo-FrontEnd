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
  processing: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa", dot: "#f97316" },
  ready:      { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", dot: "#3b82f6" },
  on_the_way: { bg: "#fff7ed", color: "#d97706", border: "#fde68a", dot: "#f59e0b" },
  delivered:  { bg: "#f0fdf4", color: "#166534", border: "#86efac", dot: "#22c55e" },
};

const TRACKER_LABELS = ["Ordered", "Processing", "Ready", "On The Way", "Delivered"];
const TRACKER_ICONS  = ["🛍️", "⚙️", "✅", "🚚", "📦"];

const STATUS_TO_TRACKER_INDEX = {
  processing: 1,
  ready:      2,
  on_the_way: 3,
  delivered:  4,
};

function getTrackerIndex(status) {
  const s = (status ?? "").toLowerCase();
  return STATUS_TO_TRACKER_INDEX[s] ?? 0;
}

function formatStatusText(status) {
  if (!status) return "";
  return status
    .toString()
    .replace(/_/g, " ")
    .trim()
    .toLowerCase()
    .replace(/(^|\s)\S/g, (t) => t.toUpperCase());
}

function normaliseOrder(o, account) {
  const { checkout, delivery } = o;
  const status = (delivery?.status ?? "processing").toLowerCase();
  const addr   = checkout?.delivery_address ?? {};

  const cartItem = checkout?.cart ?? null;
  const product  = cartItem?.product ?? null;

  const imageUrl = product?.primary_image_url
    ?? (product?.images?.find((img) => img.is_primary)?.image_path
        ? `http://127.0.0.1:8000/storage/${product.images.find((img) => img.is_primary).image_path}`
        : "");

  const items = product ? [{
    id:       product.product_id,
    name:     product.product_name ?? "Item",
    image:    imageUrl,
    qty:      Number(cartItem?.quantity ?? 1),
    price:    `₱${Number(product.price ?? 0).toLocaleString()}`,
    rawPrice: Number(product.price ?? 0),
    status:   product.status ?? "in_stock",
  }] : [];

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
      firstName:   account?.first_name   ?? "",
      lastName:    account?.last_name    ?? "",
      phone:       account?.phone_number ?? "",
      email:       account?.email        ?? "",
      companyName: account?.company_name ?? "",
      tinNumber:   account?.tin_number   ?? "",
      address:     addr?.street   ?? "",
      barangay:    addr?.barangay ?? "",
      city:        addr?.city     ?? "",
      province:    addr?.province ?? "",
      zip:         addr?.zip      ?? "",
    },
    items,
  };
}

/* ─── Empty / loading shell ───────────────────────────────── */
function Shell({ children }) {
  return (
    <div className="min-h-screen bg-[#f3f8f5]">
      <Header />
      <div className="min-h-[55vh] flex items-center justify-center px-4 mt-[75px]">
        <div className="text-center">{children}</div>
      </div>
    </div>
  );
}

const TABS = [
  { key: "all",        label: "All" },
  { key: "processing", label: "Processing" },
  { key: "ready",      label: "Ready" },
  { key: "on_the_way", label: "On The Way" },
  { key: "delivered",  label: "Delivered" },
];

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
        console.log(data);
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
      <div className="w-12 h-12 border-4 border-[#4d7b65] border-t-transparent rounded-full animate-spin mx-auto mb-5" />
      <h2 className="text-lg font-semibold text-[#1a2e22]">Loading your orders…</h2>
    </Shell>
  );

  if (error) return (
    <Shell>
      <div className="w-16 h-16 rounded-2xl bg-[#fff7ed] flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
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
          <div className="w-20 h-20 rounded-3xl bg-[#f0fdf4] flex items-center justify-center text-4xl mx-auto mb-5 border border-[#86efac]">🎉</div>
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
          <div className="w-20 h-20 rounded-3xl bg-[#f3f8f5] flex items-center justify-center text-4xl mx-auto mb-5 border border-[#c0ddd0]">📦</div>
          <h2 className="text-xl font-bold text-[#1a2e22] mb-2">No orders yet</h2>
          <p className="text-sm text-slate-500 mb-5">Your order history will appear here once you place your first order.</p>
          <Link to="/products" className="inline-block px-6 py-2.5 bg-[#4d7b65] text-white rounded-xl text-sm font-bold no-underline">
            Start Shopping →
          </Link>
        </>
      )}
    </Shell>
  );

  const filtered = activeTab === "all"
    ? orders
    : orders.filter((o) => o.status === activeTab);

  const selectedOrder = orders.find((o) => String(o.id) === String(selected));

  return (
    <div className="min-h-screen bg-[#f3f8f5]">
      <Header />

      {/* ── Page title bar ── */}
      <div className="bg-white border-b border-[#e8f0eb] mt-[75px]">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-[#6b7c70]">
              <Link to="/" className="text-[#4d7b65] no-underline hover:underline">Home</Link>
              <span className="text-gray-300">›</span>
              <span className="font-medium text-[#1a2e22]">My Orders</span>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#4d7b65] bg-[#f0f7f3] px-3 py-1 rounded-full border border-[#c0ddd0]">
            {orders.length} {orders.length === 1 ? "order" : "orders"} total
          </span>
        </div>
      </div>

      {/* ── Success banner ── */}
      {newOrderId && (
        <div className="bg-[#f0fdf4] border-b border-[#bbf7d0]">
          <div className="container mx-auto px-4 py-3 flex items-center gap-3 text-sm text-[#166534] flex-wrap">
            <span>🎉</span>
            <span><strong>Order #{newOrderId}</strong> placed successfully! We'll contact you to confirm your payment.</span>
            <Link to="/products" className="ml-auto text-[#4d7b65] font-bold no-underline hover:underline text-xs">
              Continue Shopping →
            </Link>
          </div>
        </div>
      )}

      {/* ── MAIN LAYOUT — fixed viewport height, two scrollable cols ── */}
      <div
        className="container mx-auto px-4"
        style={{ height: "calc(100vh - 75px - 53px)", display: "flex", flexDirection: "column" }}
      >
        {/* Two-column grid that fills the remaining height */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 py-6 min-h-0">

          {/* ══ LEFT PANEL — scrollable order list ══ */}
          <div className="flex flex-col min-h-0">

            {/* Tabs — sticky inside panel */}
            <div className="mb-3 flex-shrink-0">
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                {TABS.map((tab) => {
                  const count = tab.key === "all"
                    ? orders.length
                    : orders.filter((o) => o.status === tab.key).length;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all whitespace-nowrap flex-shrink-0
                        ${activeTab === tab.key
                          ? "bg-[#4d7b65] text-white border-[#4d7b65] shadow-sm"
                          : "bg-white text-[#6b7c70] border-[#e8f0eb] hover:border-[#4d7b65] hover:text-[#4d7b65]"
                        }`}
                    >
                      {tab.label}
                      {count > 0 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                          ${activeTab === tab.key
                            ? "bg-white/25 text-white"
                            : "bg-[#f3f8f5] text-[#4d7b65]"
                          }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable order cards */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2" style={{ scrollbarWidth: "thin", scrollbarColor: "#c0ddd0 transparent" }}>
              {filtered.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center gap-2 bg-white rounded-xl border border-dashed border-[#e8f0eb] text-sm text-slate-400">
                  <span className="text-2xl">🗂️</span>
                  No orders in this category
                </div>
              ) : (
                filtered.map((order) => {
                  const colors   = STATUS_COLORS[order.status] ?? STATUS_COLORS.processing;
                  const isActive = String(selected) === String(order.id);
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelected(String(order.id))}
                      className={`bg-white rounded-xl border cursor-pointer transition-all group
                        ${isActive
                          ? "border-[#4d7b65] shadow-[0_2px_12px_rgba(77,123,101,0.15)]"
                          : "border-[#e8f0eb] hover:border-[#4d7b65]/50 hover:shadow-sm"
                        }`}
                    >
                      {/* Colored top accent bar */}
                      <div
                        className="h-1 rounded-t-xl transition-all"
                        style={{ background: isActive ? "#4d7b65" : colors.dot, opacity: isActive ? 1 : 0.4 }}
                      />

                      <div className="p-4">
                        {/* Top row */}
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-sm font-bold text-[#1a2e22] font-mono">#{order.id}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{order.date}</div>
                          </div>
                          {/* Status pill with dot */}
                          <span
                            className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border flex-shrink-0"
                            style={{ background: colors.bg, color: colors.color, borderColor: colors.border }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: colors.dot }} />
                            {formatStatusText(order.status)}
                          </span>
                        </div>

                        {/* Item thumbnails row */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1">
                            {order.items.slice(0, 3).map((item) => (
                              <img
                                key={item.id}
                                src={item.image}
                                alt={item.name}
                                className="w-9 h-9 rounded-lg object-cover bg-[#f3f8f5] border border-[#e8f0eb]"
                                onError={(e) => { e.target.src = ph(36, 36, item.name); }}
                              />
                            ))}
                            {order.items.length > 3 && (
                              <div className="w-9 h-9 rounded-lg bg-[#f3f8f5] flex items-center justify-center text-[10px] font-bold text-slate-400 border border-[#e8f0eb]">
                                +{order.items.length - 3}
                              </div>
                            )}
                          </div>
                          {/* Pre-order badges */}
                          {order.items.some(i => i.status === "pre_order") && (
                            <span className="text-[10px] font-semibold text-[#92400e] bg-[#FEF3C7] border border-[#FDE68A] px-2 py-0.5 rounded-full ml-auto">
                              ⏳ Pre-Order
                            </span>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-[#f3f8f5]">
                          <span className="text-[11px] text-[#6b7c70] capitalize bg-[#f3f8f5] px-2 py-0.5 rounded-md">
                            {order.paymentMethod}
                          </span>
                          <span className="text-sm font-bold text-[#4d7b65]">
                            ₱{order.total.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ══ RIGHT PANEL — scrollable order detail ══ */}
          <div className="min-h-0 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#c0ddd0 transparent" }}>
            {!selectedOrder ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center gap-4 bg-white rounded-2xl border-2 border-dashed border-[#e8f0eb]">
                <div className="w-16 h-16 rounded-2xl bg-[#f3f8f5] flex items-center justify-center text-3xl">📋</div>
                <p className="text-sm text-slate-400 font-medium">Select an order to view details</p>
              </div>
            ) : (() => {
              const colors     = STATUS_COLORS[selectedOrder.status] ?? STATUS_COLORS.processing;
              const trackerIdx = getTrackerIndex(selectedOrder.status);

              return (
                <div className="bg-white rounded-2xl border border-[#e8f0eb] overflow-hidden">

                  {/* ── Detail Hero Header ── */}
                  <div className="px-6 py-5 border-b border-[#f0f7f3]" style={{ background: `linear-gradient(135deg, #f8faf9 0%, ${colors.bg} 100%)` }}>
                    <div className="flex justify-between items-start flex-wrap gap-3">
                      <div>
                        <div className="text-xs font-semibold text-[#6b7c70] uppercase tracking-wider mb-1">Order</div>
                        <h2 className="text-2xl font-bold text-[#1a2e22] font-mono m-0">#{selectedOrder.id}</h2>
                        <div className="text-xs text-slate-400 mt-1">Placed on {selectedOrder.date}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border"
                          style={{ background: colors.bg, color: colors.color, borderColor: colors.border }}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ background: colors.dot }} />
                          {formatStatusText(selectedOrder.status)}
                        </span>
                        <div className="text-xl font-bold text-[#4d7b65]">₱{selectedOrder.total.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-5 space-y-6">

                    {/* ── Progress Tracker ── */}
                    <div>
                      <div className="text-[11px] font-bold text-[#6b7c70] uppercase tracking-widest mb-3">Order Progress</div>
                      <div className="relative">
                        {/* Progress bar background */}
                        <div className="absolute top-4 left-4 right-4 h-0.5 bg-[#e8f0eb]" style={{ zIndex: 0 }} />
                        {/* Progress bar fill */}
                        <div
                          className="absolute top-4 left-4 h-0.5 bg-[#4d7b65] transition-all duration-500"
                          style={{
                            zIndex: 0,
                            width: trackerIdx === 0 ? "0%" : `${(trackerIdx / (TRACKER_LABELS.length - 1)) * 100}%`,
                          }}
                        />
                        {/* Steps */}
                        <div className="relative flex justify-between" style={{ zIndex: 1 }}>
                          {TRACKER_LABELS.map((label, i) => {
                            const isDone    = i < trackerIdx;
                            const isCurrent = i === trackerIdx;
                            return (
                              <div key={label} className="flex flex-col items-center gap-1.5">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all border-2
                                  ${isDone
                                    ? "bg-[#4d7b65] border-[#4d7b65] text-white shadow-sm"
                                    : isCurrent
                                    ? "bg-white border-[#4d7b65] text-[#4d7b65] shadow-[0_0_0_3px_rgba(77,123,101,0.15)]"
                                    : "bg-white border-[#e8f0eb] text-slate-300"
                                  }`}>
                                  {isDone ? "✓" : TRACKER_ICONS[i]}
                                </div>
                                <span className={`text-[10px] font-semibold text-center leading-tight hidden sm:block
                                  ${isDone ? "text-[#4d7b65]" : isCurrent ? "text-[#1a2e22]" : "text-slate-300"}`}>
                                  {label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* ── Two-col info grid ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      {/* Delivery Address */}
                      <div className="bg-[#f8faf9] rounded-xl border border-[#e8f0eb] p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-base">📦</span>
                          <span className="text-[11px] font-bold text-[#6b7c70] uppercase tracking-wider">Delivery Address</span>
                        </div>
                        <div className="text-sm text-[#1a2e22] leading-relaxed space-y-0.5">
                          <div className="font-semibold">{selectedOrder.delivery.firstName} {selectedOrder.delivery.lastName}</div>
                          <div className="text-xs text-slate-500">{selectedOrder.delivery.phone}</div>
                          <div className="text-xs text-slate-500">{selectedOrder.delivery.email}</div>
                          {selectedOrder.delivery.companyName && (
                            <div className="text-xs text-[#4d7b65] font-medium">🏢 {selectedOrder.delivery.companyName}</div>
                          )}
                          {selectedOrder.delivery.tinNumber && (
                            <div className="text-xs text-slate-500">TIN: {selectedOrder.delivery.tinNumber}</div>
                          )}
                          {(selectedOrder.delivery.address || selectedOrder.delivery.city) && (
                            <div className="text-xs text-slate-500 pt-1">
                              {selectedOrder.delivery.address}
                              {selectedOrder.delivery.barangay && `, ${selectedOrder.delivery.barangay}`}
                              {selectedOrder.delivery.city     && `, ${selectedOrder.delivery.city}`}
                              {selectedOrder.delivery.province && `, ${selectedOrder.delivery.province}`}
                              {selectedOrder.delivery.zip      && ` ${selectedOrder.delivery.zip}`}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Payment */}
                      <div className="bg-[#f8faf9] rounded-xl border border-[#e8f0eb] p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-base">💳</span>
                          <span className="text-[11px] font-bold text-[#6b7c70] uppercase tracking-wider">Payment Method</span>
                        </div>
                        <div className="text-sm text-[#1a2e22] space-y-0.5">
                          <div className="font-semibold capitalize">{selectedOrder.paymentMethod}</div>
                          {selectedOrder.paymentDetails && (
                            <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                              {selectedOrder.paymentDetails.account_name  && <div>Name: {selectedOrder.paymentDetails.account_name}</div>}
                              {selectedOrder.paymentDetails.mobile_number && <div>Number: {selectedOrder.paymentDetails.mobile_number}</div>}
                            </div>
                          )}
                        </div>

                        {/* Order summary inline in this card */}
                        <div className="mt-3 pt-3 border-t border-[#e8f0eb] space-y-1.5">
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>Subtotal</span>
                            <span>₱{selectedOrder.subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>Shipping</span>
                            <span className={selectedOrder.shippingFee === 0 ? "text-green-600 font-semibold" : ""}>
                              {selectedOrder.shippingFee === 0 ? "FREE" : `₱${selectedOrder.shippingFee.toLocaleString()}`}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm font-bold text-[#1a2e22] pt-1 border-t border-[#e8f0eb]">
                            <span>Total Paid</span>
                            <span>₱{selectedOrder.total.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Items Ordered ── */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-base">🛒</span>
                        <span className="text-[11px] font-bold text-[#6b7c70] uppercase tracking-wider">Items Ordered</span>
                        <span className="ml-auto text-[11px] text-slate-400">{selectedOrder.items.length} item{selectedOrder.items.length !== 1 ? "s" : ""}</span>
                      </div>

                      {selectedOrder.items.length === 0 ? (
                        <div className="py-6 text-center text-sm text-slate-400 bg-[#f8faf9] rounded-xl border border-[#e8f0eb]">
                          No item details available.
                        </div>
                      ) : (
                        <div className="bg-[#f8faf9] rounded-xl border border-[#e8f0eb] overflow-hidden divide-y divide-[#e8f0eb]">
                          {selectedOrder.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-[#f0f7f3] transition-colors">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-14 h-14 rounded-xl object-cover bg-white border border-[#e8f0eb] flex-shrink-0"
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
                                <div className="mt-1.5">
                                  {item.status === "pre_order" ? (
                                    <span className="inline-block text-[10px] font-semibold text-[#92400e] bg-[#FEF3C7] border border-[#FDE68A] px-2 py-0.5 rounded-full">
                                      ⏳ Pre-Order
                                    </span>
                                  ) : (
                                    <span className="inline-block text-[10px] font-semibold text-[#059669] bg-[#D1FAE5] border border-[#6EE7B7] px-2 py-0.5 rounded-full">
                                      ✅ In Stock
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm font-bold text-[#4d7b65] flex-shrink-0">
                                ₱{(item.rawPrice * item.qty).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ── Special Instructions ── */}
                    {selectedOrder.specialNote && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-base">📝</span>
                          <span className="text-[11px] font-bold text-[#6b7c70] uppercase tracking-wider">Special Instructions</span>
                        </div>
                        <div className="bg-[#fffbeb] rounded-xl border border-[#fde68a] px-4 py-3.5 text-sm text-[#78350f] leading-relaxed">
                          {selectedOrder.specialNote}
                        </div>
                      </div>
                    )}

                    {/* ── Actions ── */}
                    <div className="flex gap-3 flex-wrap pt-1">
                      <Link
                        to="/products"
                        className="flex-1 sm:flex-none text-center px-6 py-2.5 bg-[#4d7b65] text-white rounded-xl text-sm font-bold no-underline hover:bg-[#3d6552] transition-colors"
                      >
                        Order Again →
                      </Link>
                      <Link
                        to="/contact"
                        className="flex-1 sm:flex-none text-center px-6 py-2.5 bg-white text-[#4d7b65] border-2 border-[#c0ddd0] rounded-xl text-sm font-bold no-underline hover:bg-[#f0f7f3] transition-colors"
                      >
                        Need Help?
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

        </div>
      </div>
    </div>
  );
}