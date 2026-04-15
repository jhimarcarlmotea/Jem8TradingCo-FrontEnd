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
  ready:      { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  on_the_way: { bg: "#fff7ed", color: "#d97706", border: "#fde68a" },
  delivered:  { bg: "#f0fdf4", color: "#166534", border: "#86efac" },
};

const TRACKER_LABELS = ["Ordered", "Processing", "Ready", "On The Way", "Delivered"];

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
  }] : [];

  // ── Extract receipt — use receipt_image_url directly from backend ──
  const rawReceipt = checkout?.receipt ?? null;
  const receipt = rawReceipt
    ? {
        id:     rawReceipt.receipt_id     ?? null,
        number: rawReceipt.receipt_number ?? null,
        image:  rawReceipt.receipt_image_url ?? null,  // exact key from your API
      }
    : null;

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
      firstName: account?.first_name   ?? "",
      lastName:  account?.last_name    ?? "",
      phone:     account?.phone_number ?? "",
      email:     account?.email        ?? "",
      address:   delivery?.address     ?? "",
      barangay:  delivery?.barangay    ?? "",
      city:      delivery?.city        ?? "",
      province:  delivery?.province    ?? "",
      zip:       delivery?.zip         ?? "",
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
    <div className="min-h-screen bg-[#f8faf9]">
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

  const filtered = activeTab === "all"
    ? orders
    : orders.filter((o) => o.status === activeTab);

  const selectedOrder = orders.find((o) => String(o.id) === String(selected));

  return (
    <div className="min-h-screen bg-[#f8faf9]">
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

      <section className="py-10 pb-20">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 items-start">

          {/* ORDER LIST */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-[#1a2e22] m-0">My Orders</h1>
              <span className="text-xs text-slate-400 bg-[#f3f8f5] px-2.5 py-1 rounded-full">
                {orders.length} total
              </span>
            </div>

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
                      className={`bg-white border-[1.5px] rounded-2xl px-4 py-4 cursor-pointer transition-all
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

          {/* ORDER DETAIL */}
          <div>
            {!selectedOrder ? (
              <div className="h-[300px] flex flex-col items-center justify-center gap-3 bg-[#f8faf9] rounded-2xl border-[1.5px] border-dashed border-[#e8f0eb]">
                <span className="text-4xl">📋</span>
                <p className="text-sm text-slate-400 m-0">Select an order to view details</p>
              </div>
            ) : (() => {
              const colors     = STATUS_COLORS[selectedOrder.status] ?? STATUS_COLORS.processing;
              const trackerIdx = getTrackerIndex(selectedOrder.status);

              // Pull these out explicitly so the condition is dead-simple
              const receiptImage  = selectedOrder.receipt?.image  ?? null;
              const receiptNumber = selectedOrder.receipt?.number ?? null;

              return (
                <div className="bg-white border-[1.5px] border-[#e8f0eb] rounded-2xl p-7">

                  {/* Header */}
                  <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
                    <div>
                      <h2 className="text-[22px] font-bold text-[#1a2e22] m-0">#{selectedOrder.id}</h2>
                      <div className="text-xs text-slate-400 mt-1">Placed on {selectedOrder.date}</div>
                    </div>
                    <span
                      className="text-xs font-bold px-3.5 py-1.5 rounded-full border"
                      style={{ background: colors.bg, color: colors.color, borderColor: colors.border }}
                    >
                      {formatStatusText(selectedOrder.status)}
                    </span>
                  </div>

                  {/* Tracker */}
                  <div className="flex items-center mb-7 p-5 bg-[#f8faf9] rounded-xl border border-[#e8f0eb] overflow-x-auto">
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
                            <div className={`min-w-6 h-0.5 mx-1.5 transition-colors flex-shrink-0 ${isDone ? "bg-green-600" : "bg-[#e8f0eb]"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>

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

                  {/* Receipt — only shown when receiptImage is a real string */}
                  {receiptImage && (
                    <div className="mb-5">
                      <div className="text-[13px] font-bold text-[#6b7c70] uppercase tracking-wide mb-2.5">🧾 Payment Receipt</div>
                      <div className="px-4 py-3.5 bg-[#f8faf9] rounded-xl border border-[#e8f0eb]">
                        {receiptNumber && (
                          <div className="text-xs text-slate-400 mb-3 font-mono">{receiptNumber}</div>
                        )}
                        <button
                          onClick={() => setReceiptModal({ image: receiptImage, number: receiptNumber })}
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