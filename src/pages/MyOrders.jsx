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

const STATUS_TO_TRACKER_INDEX = {
  processing: 1,
  ready:      2,
  on_the_way: 3,
  delivered:  4,
};

function getTrackerIndex(status) {
  return STATUS_TO_TRACKER_INDEX[(status ?? "").toLowerCase()] ?? 0;
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

  const rawReceipt = checkout?.receipt ?? null;
  const receipt = rawReceipt ? {
    id:     rawReceipt.receipt_id     ?? null,
    number: rawReceipt.receipt_number ?? null,
    image:  rawReceipt.receipt_image_url ?? null,
  } : null;

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
    receipt,
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

/* ─── Receipt Image Modal ─────────────────────────────────── */
function ReceiptModal({ imageUrl, receiptNumber, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8f0eb]">
          <div>
            <div className="text-sm font-bold text-[#1a2e22]">Payment Receipt</div>
            {receiptNumber && (
              <div className="text-xs text-slate-400 mt-0.5 font-mono">{receiptNumber}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f3f8f5] flex items-center justify-center text-slate-500 hover:bg-[#e8f0eb] transition-colors cursor-pointer border-none text-lg font-bold"
          >
            ×
          </button>
        </div>
        <div className="p-4 bg-[#f8faf9]">
          <img
            src={imageUrl}
            alt="Payment receipt"
            className="w-full rounded-xl object-contain max-h-[70vh]"
            onError={(e) => { e.target.src = ph(400, 300, "Receipt Not Found"); }}
          />
        </div>
        <div className="px-5 py-3 text-center">
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#4d7b65] font-semibold no-underline hover:underline"
          >
            Open full image ↗
          </a>
        </div>
      </div>
    </div>
  );
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

/* ─── Order Detail Panel ──────────────────────────────────── */
function OrderDetail({ order, onReceiptClick }) {
  const colors     = STATUS_COLORS[order.status] ?? STATUS_COLORS.processing;
  const trackerIdx = getTrackerIndex(order.status);
  const receiptImage  = order.receipt?.image  ?? null;
  const receiptNumber = order.receipt?.number ?? null;

  return (
    <div className="bg-white rounded-2xl border border-[#e8f0eb] overflow-hidden">

      {/* ── Header ── */}
      <div className="flex justify-between items-start p-6 border-b border-[#e8f0eb] flex-wrap gap-3">
        <div>
          <h2 className="text-[22px] font-bold text-[#1a2e22] m-0">#{order.id}</h2>
          <div className="text-xs text-slate-400 mt-1">Placed on {order.date}</div>
        </div>
        <span
          className="text-xs font-bold px-3.5 py-1.5 rounded-full border"
          style={{ background: colors.bg, color: colors.color, borderColor: colors.border }}
        >
          {formatStatusText(order.status)}
        </span>
      </div>

      <div className="p-6 flex flex-col gap-5">

        {/* ── Tracker ── */}
        <div className="flex items-center p-4 bg-[#f8faf9] rounded-xl border border-[#e8f0eb] overflow-x-auto gap-2">
          {TRACKER_LABELS.map((label, i) => {
            const isDone    = i < trackerIdx;
            const isCurrent = i === trackerIdx;
            return (
              <div key={label} className="flex items-center gap-2 flex-shrink-0">
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
                    {label}
                  </span>
                </div>
                {i < TRACKER_LABELS.length - 1 && (
                  <div className={`min-w-[24px] h-0.5 mx-1.5 flex-shrink-0 transition-colors ${isDone ? "bg-green-600" : "bg-[#e8f0eb]"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Delivery Address ── */}
        <div>
          <div className="text-[11px] font-bold text-[#6b7c70] uppercase tracking-wider mb-2">📦 Delivery Address</div>
          <div className="px-4 py-3.5 bg-[#f8faf9] rounded-xl border border-[#e8f0eb] text-sm text-slate-700 leading-relaxed">
            <strong>{order.delivery.firstName} {order.delivery.lastName}</strong><br />
            {order.delivery.phone} · {order.delivery.email}
            {(order.delivery.address || order.delivery.city) && (
              <>
                <br />
                {[
                  order.delivery.address,
                  order.delivery.barangay,
                  order.delivery.city,
                  order.delivery.province,
                  order.delivery.zip,
                ].filter(Boolean).join(", ")}
              </>
            )}
          </div>
        </div>

        {/* ── Payment Method ── */}
        <div>
          <div className="text-[11px] font-bold text-[#6b7c70] uppercase tracking-wider mb-2">💳 Payment Method</div>
          <div className="px-4 py-3.5 bg-[#f8faf9] rounded-xl border border-[#e8f0eb] text-sm text-slate-700">
            <strong className="capitalize">{order.paymentMethod}</strong>
            {order.paymentDetails && (
              <div className="mt-1 text-[13px] text-slate-500 space-y-0.5">
                {order.paymentDetails.account_name  && <div>Name: {order.paymentDetails.account_name}</div>}
                {order.paymentDetails.mobile_number && <div>Number: {order.paymentDetails.mobile_number}</div>}
              </div>
            )}
          </div>
        </div>

        {/* ── Receipt ── */}
        {receiptImage && (
          <div>
            <div className="text-[11px] font-bold text-[#6b7c70] uppercase tracking-wider mb-2">🧾 Payment Receipt</div>
            <div className="px-4 py-3.5 bg-[#f8faf9] rounded-xl border border-[#e8f0eb]">
              {receiptNumber && (
                <div className="text-xs text-slate-400 mb-3 font-mono">{receiptNumber}</div>
              )}
              <button
                onClick={() => onReceiptClick({ image: receiptImage, number: receiptNumber })}
                className="block w-full cursor-pointer border-none p-0 bg-transparent"
                title="Click to enlarge"
              >
                <img
                  src={receiptImage}
                  alt="Payment receipt"
                  className="w-full max-h-48 object-cover rounded-xl border border-[#e8f0eb] hover:opacity-90 transition-opacity"
                  onError={(e) => { e.target.src = ph(400, 192, "Receipt"); }}
                />
                <div className="mt-2 text-xs text-[#4d7b65] font-semibold text-center">
                  🔍 Click to view full receipt
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── Items Ordered ── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold text-[#6b7c70] uppercase tracking-wider">🛒 Items Ordered</span>
            <span className="ml-auto text-[11px] text-slate-400">
              {order.items.length} item{order.items.length !== 1 ? "s" : ""}
            </span>
          </div>
          {order.items.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-400 bg-[#f8faf9] rounded-xl border border-[#e8f0eb]">
              No item details available.
            </div>
          ) : (
            <div className="bg-[#f8faf9] rounded-xl border border-[#e8f0eb] overflow-hidden divide-y divide-[#e8f0eb]">
              {order.items.map((item) => (
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

        {/* ── Totals ── */}
        <div className="px-4 py-4 bg-[#f8faf9] rounded-xl border border-[#e8f0eb] flex flex-col gap-2.5">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span>₱{order.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Shipping</span>
            <span className={order.shippingFee === 0 ? "text-green-600 font-bold" : ""}>
              {order.shippingFee === 0 ? "FREE" : `₱${order.shippingFee.toLocaleString()}`}
            </span>
          </div>
          <div className="flex justify-between text-[17px] font-bold text-[#1a2e22] pt-2.5 border-t border-[#e8f0eb]">
            <span>Total Paid</span>
            <span>₱{order.total.toLocaleString()}</span>
          </div>
        </div>

        {/* ── Special Instructions ── */}
        {order.specialNote && (
          <div>
            <div className="text-[11px] font-bold text-[#6b7c70] uppercase tracking-wider mb-2">📝 Special Instructions</div>
            <div className="px-4 py-3.5 bg-[#f8faf9] rounded-xl border border-[#e8f0eb] text-sm text-slate-700 leading-relaxed">
              {order.specialNote}
            </div>
          </div>
        )}

        {/* ── Actions ── */}
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
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────── */
export default function MyOrders() {
  const [searchParams] = useSearchParams();
  const newOrderId = searchParams.get("new");

  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [selected,     setSelected]     = useState(newOrderId || null);
  const [activeTab,    setActiveTab]    = useState("all");
  const [receiptModal, setReceiptModal] = useState(null);

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

      {receiptModal && (
        <ReceiptModal
          imageUrl={receiptModal.image}
          receiptNumber={receiptModal.number}
          onClose={() => setReceiptModal(null)}
        />
      )}

      {/* Breadcrumb */}
      <div className="bg-[#f8faf9] border-b border-[#e8f0eb] mt-[75px]">
        <div className="container mx-auto px-4 flex items-center gap-2 py-3 text-xs text-[#6b7c70] flex-wrap">
          <Link to="/" className="text-[#4d7b65] no-underline hover:underline">Home</Link>
          <span className="text-gray-300">›</span>
          <span>My Orders</span>
        </div>
      </div>

      {/* New order banner */}
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

      <section className="py-10 pb-20">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 items-start">

          {/* ── ORDER LIST ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-[#1a2e22] m-0">My Orders</h1>
              <span className="text-xs text-slate-400 bg-[#f3f8f5] px-2.5 py-1 rounded-full">
                {orders.length} total
              </span>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3.5 py-1.5 rounded-full border-[1.5px] text-xs font-semibold cursor-pointer transition-all whitespace-nowrap
                    ${activeTab === tab.key
                      ? "bg-[#4d7b65] text-white border-[#4d7b65]"
                      : "bg-white text-[#6b7c70] border-[#e8f0eb] hover:border-[#4d7b65] hover:text-[#4d7b65]"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400 bg-[#f8faf9] rounded-xl border border-[#e8f0eb]">
                No orders in this category.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {filtered.map((order) => {
                  const colors   = STATUS_COLORS[order.status] ?? STATUS_COLORS.processing;
                  const isActive = String(selected) === String(order.id);
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelected(String(order.id))}
                      className={`bg-white rounded-xl border p-4 cursor-pointer transition-all
                        ${isActive
                          ? "border-[#4d7b65] bg-[#f3f8f5] shadow-[0_4px_14px_rgba(77,123,101,0.12)]"
                          : "border-[#e8f0eb] hover:border-[#4d7b65] hover:shadow-[0_4px_14px_rgba(77,123,101,0.10)]"
                        }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-sm font-bold text-[#1a2e22]">#{order.id}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{order.date}</div>
                        </div>
                        <span
                          className="text-[11px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0"
                          style={{ background: colors.bg, color: colors.color, borderColor: colors.border }}
                        >
                          {formatStatusText(order.status)}
                        </span>
                      </div>

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

          {/* ── ORDER DETAIL ── */}
          <div>
            {!selectedOrder ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center gap-4 bg-white rounded-2xl border-2 border-dashed border-[#e8f0eb]">
                <div className="w-16 h-16 rounded-2xl bg-[#f3f8f5] flex items-center justify-center text-3xl">📋</div>
                <p className="text-sm text-slate-400 font-medium">Select an order to view details</p>
              </div>
            ) : (
              <OrderDetail order={selectedOrder} onReceiptClick={setReceiptModal} />
            )}
          </div>

        </div>
      </section>
    </div>
  );
}