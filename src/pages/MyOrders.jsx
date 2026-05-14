import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
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

function safeJsonParse(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
}
function normaliseOrder(o, account) {
  const { checkout, delivery } = o;

  const status = (delivery?.status ?? "processing").toLowerCase();

  /* ── Address: flat columns ── */
  const deliveryStreet   = checkout?.delivery_street   ?? "";
  const deliveryBarangay = checkout?.delivery_barangay ?? "";
  const deliveryCity     = checkout?.delivery_city     ?? "";
  const deliveryProvince = checkout?.delivery_province ?? "";
  const deliveryZip      = checkout?.delivery_zip      ?? "";
  const deliveryCountry  = checkout?.delivery_country  ?? "";

  const formattedAddress = [
    deliveryStreet,
    deliveryBarangay,
    deliveryCity,
    deliveryProvince,
    deliveryZip,
    deliveryCountry,
  ].filter(Boolean).join(", ");

  /* ── Items ── */
  const items = (checkout?.items ?? []).map((item) => {
    const product = item.product ?? {};

    const resolveImage = () => {
      if (product?.primary_image_url) return product.primary_image_url;
      if (product?.image_url)         return product.image_url;
      if (product?.image)             return product.image;

      const imgs = product?.images || product?.images_list || product?.media || [];
      if (Array.isArray(imgs) && imgs.length) {
        const primary =
          imgs.find((i) => i.is_primary || i.primary || i.isPrimary) || imgs[0];
        if (primary) {
          return (
            primary.image_url  ||
            primary.url        ||
            primary.path       ||
            primary.image_path ||
            primary.src        ||
            primary.file       ||
            null
          );
        }
      }

      if (item?.image)      return item.image;
      if (item?.image_path) return `http://127.0.0.1:8000/storage/${item.image_path}`;

      return null;
    };

    const imgCandidate = resolveImage();
    const imageUrl = imgCandidate
      ? String(imgCandidate).startsWith("http")
        ? imgCandidate
        : imgCandidate.startsWith("/")
        ? imgCandidate
        : `http://127.0.0.1:8000/${String(imgCandidate).replace(/^\/+/, "")}`
      : null;

    const qty      = Number(item.quantity ?? item.qty ?? item.qty_selected ?? 1) || 1;
    const rawPrice = Number(item.price ?? item.unit_price ?? item.raw_price ?? product?.price ?? 0) || 0;

    return {
      id: item.product_id ?? item.id,
      name:
        item.product_name     ??
        product?.product_name ??
        product?.name         ??
        item.name             ??
        "Product",
      qty,
      quantity: qty,
      rawPrice,
      price:  `₱${rawPrice.toLocaleString()}`,
      total:  Number(item.total ?? rawPrice * qty),
      product,
      image:  imageUrl,
      raw:    item,
    };
  });

  /* ── Receipt ── */
  const receipt = checkout?.receipt
    ? {
        id:     checkout.receipt.receipt_id        ?? null,
        number: checkout.receipt.receipt_number    ?? null,
        image:  checkout.receipt.receipt_image_url ?? null,
      }
    : null;

  return {
    id: delivery?.delivery_id ?? checkout?.checkout_id,

    date: checkout?.created_at
      ? new Date(checkout.created_at).toLocaleDateString("en-PH", {
          year:  "numeric",
          month: "long",
          day:   "numeric",
        })
      : "—",

    status,

    paymentMethod:  checkout?.payment_method  ?? "—",
    paymentDetails: checkout?.payment_details ?? null,

    receipt,

    subtotal:    Number(checkout?.paid_amount  ?? 0) - Number(checkout?.shipping_fee ?? 0),
    shippingFee: Number(checkout?.shipping_fee ?? 0),
    total:       Number(checkout?.paid_amount  ?? 0),

    specialNote: checkout?.special_instructions ?? delivery?.notes ?? "",

    delivery: {
      firstName:   account?.first_name   ?? "",
      lastName:    account?.last_name    ?? "",
      phone:       account?.phone_number ?? "",
      email:       account?.email        ?? "",
      companyName: account?.company_name ?? null,
      tinNumber:   account?.tin_number   ?? null,
      address:          deliveryStreet,
      barangay:         deliveryBarangay,
      city:             deliveryCity,
      province:         deliveryProvince,
      zip:              deliveryZip,
      country:          deliveryCountry,
      formattedAddress,
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
        data-overlay
        className="w-full max-w-lg overflow-hidden bg-white shadow-2xl rounded-2xl"
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

const PAYMENT_TAGS = {
  gcash:         { label: "E-Wallet", color: "#0078FF" },
  deposit:       { label: "Deposit",  color: "#0ea5e9" },
  bank_transfer: { label: "Bank",     color: "#6366f1" },
  cod:           { label: "COD",      color: "#f59e0b" },
  check:         { label: "Check",    color: "#64748b" },
};

function hexToRgba(hex, alpha = 1) {
  const h       = hex.replace("#", "");
  const bigint  = parseInt(
    h.length === 3 ? h.split("").map((c) => c + c).join("") : h,
    16
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >>  8) & 255;
  const b =  bigint        & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function renderPaymentTag(method) {
  if (!method) return null;
  const key   = String(method).trim().toLowerCase().replace(/\s+/g, "_");
  const meta  = PAYMENT_TAGS[key] || PAYMENT_TAGS[method] || null;
  const label = meta?.label ?? String(method).replace(/_/g, " ");
  const color = meta?.color ?? "#d1d5db";
  const style = {
    background:  hexToRgba(color, 0.12),
    borderColor: hexToRgba(color, 0.28),
    color,
  };
  return (
    <span
      className="inline-block px-3 py-1 text-xs font-semibold border rounded-full"
      style={style}
    >
      {label}
    </span>
  );
}

/* ─── Order Detail Panel ──────────────────────────────────── */
function OrderDetail({ order, onReceiptClick }) {
  const navigate      = useNavigate();
  const [actionMsg, setActionMsg] = useState(null);
  // Quote modal/form state (order-level quote request)
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [sendingQuote, setSendingQuote] = useState(false);
  const [quoteName, setQuoteName] = useState("");
  const [quoteEmail, setQuoteEmail] = useState("");
  const [quotePhone, setQuotePhone] = useState("");
  const [quoteCompany, setQuoteCompany] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const colors        = STATUS_COLORS[order.status] ?? STATUS_COLORS.processing;
  const trackerIdx    = getTrackerIndex(order.status);
  const receiptImage  = order.receipt?.image  ?? null;
  const receiptNumber = order.receipt?.number ?? null;

  /* Build a readable address string from all parts */
  const addressParts = [
    order.delivery.address,
    order.delivery.barangay,
    order.delivery.city,
    order.delivery.province,
    order.delivery.zip,
    order.delivery.country,
  ].filter(Boolean);

  const hasAddress = addressParts.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-[#e8f0eb] overflow-hidden">

      {/* ── Header ── */}
      <div className="flex justify-between items-start p-6 border-b border-[#e8f0eb] flex-wrap gap-3">
        <div>
          <h2 className="text-[22px] font-bold text-[#1a2e22] m-0">#{order.id}</h2>
          <div className="mt-1 text-xs text-slate-400">Placed on {order.date}</div>
        </div>
        <span
          className="text-xs font-bold px-3.5 py-1.5 rounded-full border"
          style={{ background: colors.bg, color: colors.color, borderColor: colors.border }}
        >
          {formatStatusText(order.status)}
        </span>
      </div>

      <div className="flex flex-col gap-5 p-6">

        {/* ── Tracker ── */}
        <div className="flex items-center p-4 bg-[#f8faf9] rounded-xl border border-[#e8f0eb] overflow-x-auto gap-2">
          {TRACKER_LABELS.map((label, i) => {
            const isDone    = i < trackerIdx;
            const isCurrent = i === trackerIdx;
            return (
              <div key={label} className="flex items-center flex-shrink-0 gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-all
                      ${isDone    ? "bg-green-600 text-white"
                      : isCurrent ? "bg-[#4d7b65] text-white"
                      :             "bg-[#e8f0eb] text-slate-400"}`}
                  >
                    {isDone ? "✓" : i + 1}
                  </div>
                  <span
                    className={`text-xs font-semibold transition-colors hidden sm:block
                      ${isDone    ? "text-green-600"
                      : isCurrent ? "text-[#4d7b65] font-bold"
                      :             "text-slate-400"}`}
                  >
                    {label}
                  </span>
                </div>
                {i < TRACKER_LABELS.length - 1 && (
                  <div
                    className={`min-w-[24px] h-0.5 mx-1.5 flex-shrink-0 transition-colors ${isDone ? "bg-green-600" : "bg-[#e8f0eb]"}`}
                  />
                )}
              </div>
            );
          })}
        </div>
{/* ── Delivery Address ── */}
<div>
  <div className="text-[11px] font-bold text-[#6b7c70] uppercase tracking-wider mb-2">
    📦 Delivery Address
  </div>
  <div className="px-4 py-3.5 bg-[#f8faf9] rounded-xl border border-[#e8f0eb] text-sm text-slate-700 leading-relaxed">
    <strong>
      {order.delivery.firstName} {order.delivery.lastName}
    </strong>
    <br />
    {order.delivery.phone && <>{order.delivery.phone} · </>}
    {order.delivery.email}

    {order.delivery.companyName && (
      <div className="mt-1 text-xs font-medium text-blue-600">
        🏢 {order.delivery.companyName}
      </div>
    )}
    {order.delivery.tinNumber && (
      <div className="text-xs text-slate-400">TIN: {order.delivery.tinNumber}</div>
    )}

    <br />
    {/* Use formatted address if available, otherwise build from components */}
    {order.delivery.formattedAddress ? (
      order.delivery.formattedAddress
    ) : (
      <>
        {order.delivery.address && <>{order.delivery.address}<br /></>}
        {order.delivery.barangay && <>{order.delivery.barangay}<br /></>}
        {order.delivery.city && <>{order.delivery.city}<br /></>}
        {order.delivery.province && <>{order.delivery.province}<br /></>}
        {order.delivery.zip && <>{order.delivery.zip}<br /></>}
        {order.delivery.country}
      </>
    )}
    
    {!order.delivery.address && !order.delivery.barangay && !order.delivery.city && 
     !order.delivery.province && !order.delivery.formattedAddress && (
      <div className="mt-1 text-xs italic text-slate-400">
        No delivery address on record.
      </div>
    )}
  </div>
</div>

        {/* ── Payment Method ── */}
        <div>
          <div className="text-[11px] font-bold text-[#6b7c70] uppercase tracking-wider mb-2">
            💳 Payment Method
          </div>
          <div className="px-4 py-3.5 bg-[#f8faf9] rounded-xl border border-[#e8f0eb] text-sm text-slate-700">
            {renderPaymentTag(order.paymentMethod)}
            {order.paymentDetails && (
              <div className="mt-1 text-[13px] text-slate-500 space-y-0.5">
                {order.paymentDetails.account_name  && (
                  <div>Name: {order.paymentDetails.account_name}</div>
                )}
                {order.paymentDetails.mobile_number && (
                  <div>Number: {order.paymentDetails.mobile_number}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Receipt ── */}
        {receiptImage && (
          <div>
            <div className="text-[11px] font-bold text-[#6b7c70] uppercase tracking-wider mb-2">
              🧾 Payment Receipt
            </div>
            <div className="px-4 py-3.5 bg-[#f8faf9] rounded-xl border border-[#e8f0eb]">
              {receiptNumber && (
                <div className="mb-3 font-mono text-xs text-slate-400">{receiptNumber}</div>
              )}
              <button
                onClick={() => onReceiptClick({ image: receiptImage, number: receiptNumber })}
                className="block w-full p-0 bg-transparent border-none cursor-pointer"
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
            <span className="text-[11px] font-bold text-[#6b7c70] uppercase tracking-wider">
              🛒 Items Ordered
            </span>
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
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 hover:bg-[#f0f7f3] transition-colors"
                >
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
                    <div className="text-xs text-slate-400 mt-0.5">
                      Qty: {item.qty} × {item.price}
                    </div>
                    <div className="mt-1.5">
                      {item.raw?.status === "pre_order" ? (
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
            <div className="text-[11px] font-bold text-[#6b7c70] uppercase tracking-wider mb-2">
              📝 Special Instructions
            </div>
            <div className="px-4 py-3.5 bg-[#f8faf9] rounded-xl border border-[#e8f0eb] text-sm text-slate-700 leading-relaxed">
              {order.specialNote}
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex flex-wrap gap-3">
          <div>
            <button
              onClick={() => {
                setQuoteName(`${order.delivery.firstName || ''} ${order.delivery.lastName || ''}`.trim());
                setQuoteEmail(order.delivery.email || "");
                setQuotePhone(order.delivery.phone || "");
                setQuoteCompany(order.delivery.companyName || "");
                setQuoteNotes("");
                setShowQuoteModal(true);
              }}
              className="inline-block px-6 py-2.5 bg-[#155DFC] text-white rounded-xl text-sm font-bold cursor-pointer border-none hover:bg-[#1248cc] transition-colors"
            >
              Request Quote →
            </button>
          </div>
          <div>
            <button
              onClick={() => exportOrderToExcelJS(order)}
              className="inline-block px-4 py-2 bg-white text-[#4d7b65] border-[1.5px] border-[#c0ddd0] rounded-xl text-sm font-bold hover:bg-[#f8faf9]"
            >
              Export Excel
            </button>
          </div>
          <div>
            <button
              onClick={() => exportOrderToPDF(order)}
              className="inline-block px-4 py-2 bg-white text-[#4d7b65] border-[1.5px] border-[#c0ddd0] rounded-xl text-sm font-bold hover:bg-[#f8faf9]"
            >
              Export PDF
            </button>
          </div>
          {actionMsg && (
            <div className="text-sm text-[#334155] bg-white border border-[#e8f0eb] px-3 py-2 rounded shadow-sm">
              {actionMsg}
            </div>
          )}

          {showQuoteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowQuoteModal(false)} />
              <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Request a Quote</h3>
                  <button onClick={() => setShowQuoteModal(false)} className="text-gray-600 hover:text-gray-900">✕</button>
                </div>
                <p className="text-sm text-slate-500 mb-3">You're requesting a quote for order <strong>#{order.id}</strong>. The items will be included but not shown here.</p>
                <div className="grid grid-cols-1 gap-3 mb-3">
                  <input value={quoteName} onChange={(e) => setQuoteName(e.target.value)} placeholder="Your name" className="px-3 py-2 border rounded" />
                  <input value={quoteEmail} onChange={(e) => setQuoteEmail(e.target.value)} placeholder="Email" className="px-3 py-2 border rounded" />
                  <input value={quotePhone} onChange={(e) => setQuotePhone(e.target.value)} placeholder="Phone" className="px-3 py-2 border rounded" />
                  <input value={quoteCompany} onChange={(e) => setQuoteCompany(e.target.value)} placeholder="Company (optional)" className="px-3 py-2 border rounded" />
                  <textarea value={quoteNotes} onChange={(e) => setQuoteNotes(e.target.value)} placeholder="Notes (optional)" rows={3} className="px-3 py-2 border rounded" />
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button onClick={() => setShowQuoteModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                  <button
                    onClick={async () => {
                      if (sendingQuote) return;
                      setSendingQuote(true);
                      setActionMsg('Sending quote request…');
                      const payload = {
                        items: order.items.map((it) => ({ product_id: it.id, quantity: it.qty })),
                        contact: {
                          name: quoteName || `${order.delivery.firstName || ''} ${order.delivery.lastName || ''}`.trim(),
                          email: quoteEmail || order.delivery.email || null,
                          phone: quotePhone || order.delivery.phone || null,
                          company: quoteCompany || order.delivery.companyName || null,
                        },
                        notes: quoteNotes || null,
                        order_reference: order.id,
                      };
                      try {
                        await api.post('/quotes', payload);
                        setActionMsg('Quote request sent. Our sales team will contact you.');
                        setShowQuoteModal(false);
                        setTimeout(() => setActionMsg(null), 4500);
                      } catch (err) {
                        console.error('Quote request failed', err);
                        setActionMsg('Failed to send quote request.');
                        setTimeout(() => setActionMsg(null), 4500);
                      } finally {
                        setSendingQuote(false);
                      }
                    }}
                    className="px-4 py-2 bg-[#155DFC] text-white rounded"
                  >
                    {sendingQuote ? 'Sending…' : 'Send Quote'}
                  </button>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() =>
              navigate("/checkout", {
                state: {
                  reorderItems: order.items.map((item) => ({
                    productId: item.id,
                    name:      item.name,
                    quantity:  item.quantity,
                    image:     item.image,
                  })),
                },
              })
            }
            className="inline-block px-6 py-2.5 bg-[#4d7b65] text-white rounded-xl text-sm font-bold cursor-pointer border-none hover:bg-[#3d6552] transition-colors"
          >
            Order Again →
          </button>
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
  const [searchParams]  = useSearchParams();
  const newOrderId      = searchParams.get("new");

  const [orders,        setOrders]       = useState([]);
  const [loading,       setLoading]      = useState(true);
  const [error,         setError]        = useState(null);
  const [selected,      setSelected]     = useState(newOrderId || null);
  const [activeTab,     setActiveTab]    = useState("all");
  const [receiptModal,  setReceiptModal] = useState(null);

useEffect(() => {
  let cancelled = false;
  setLoading(true);
  setError(null);

  api.get("/my-deliveries")
    .then(({ data }) => {
      if (cancelled) return;
      
      // Debug: I-print ang raw delivery_address
      console.log('First order delivery_address:', data.orders?.[0]?.checkout?.delivery_address);
      
      const account    = data.account ?? {};
      const rawOrders  = Array.isArray(data.orders) ? data.orders : (data.data ?? []);
      const normalised = rawOrders.map((o) => normaliseOrder(o, account));
      
      // Debug: I-print ang extracted address
      if (normalised[0]) {
        console.log('Extracted address:', normalised[0].delivery);
      }
      
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
      <p className="mb-5 text-sm text-slate-500">{error}</p>
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
          <p className="max-w-sm mx-auto mb-5 text-sm text-slate-500">
            Your order <strong>{newOrderId}</strong> has been received and is being processed.
            We'll contact you shortly to confirm your payment.
          </p>
          <Link
            to="/products"
            className="inline-block px-6 py-2.5 bg-[#4d7b65] text-white rounded-xl text-sm font-bold no-underline"
          >
            Continue Shopping →
          </Link>
        </>
      ) : (
        <>
          <div className="w-20 h-20 rounded-3xl bg-[#f3f8f5] flex items-center justify-center text-4xl mx-auto mb-5 border border-[#c0ddd0]">📦</div>
          <h2 className="text-xl font-bold text-[#1a2e22] mb-2">No orders yet</h2>
          <p className="mb-5 text-sm text-slate-500">
            Your order history will appear here once you place your first order.
          </p>
          <Link
            to="/products"
            className="inline-block px-6 py-2.5 bg-[#4d7b65] text-white rounded-xl text-sm font-bold no-underline"
          >
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


      {/* New order banner */}
      {newOrderId && (
        <div className="bg-[#f0fdf4] border-b border-[#bbf7d0]">
          <div className="container mx-auto px-4 py-3 flex items-center gap-3 text-sm text-[#166534] flex-wrap">
            <span>🎉</span>
            <span>
              <strong>Order #{newOrderId}</strong> placed successfully! We'll contact you to confirm your payment.
            </span>
            <Link
              to="/products"
              className="ml-auto text-[#4d7b65] font-bold no-underline hover:underline text-xs"
            >
              Continue Shopping →
            </Link>
          </div>
        </div>
      )}

<section className="py-10 pb-20 mt-[70px]">
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
            <div className="flex gap-1 pb-1 mb-4 overflow-x-auto">
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
                      <div className="flex items-start justify-between mb-3">
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
                        <div>{renderPaymentTag(order.paymentMethod)}</div>
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
                <p className="text-sm font-medium text-slate-400">Select an order to view details</p>
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
// Small currency formatter matching adminOrders style
const fmt = (n) =>
  Number(n ?? 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Build a delivery-shaped object expected by admin export helpers
function buildDeliveryForExport(order) {
  const checkout = {
    checkout_id: order.id,
    paid_amount: order.total,
    shipping_fee: order.shippingFee,
    payment_method: order.paymentMethod || 'COD',
    created_at: new Date().toISOString(),
    user: {
      first_name: order.delivery.firstName || '',
      last_name: order.delivery.lastName || '',
      email: order.delivery.email || '',
      phone_number: order.delivery.phone || '',
      company_name: order.delivery.companyName || '',
    },
    items: (order.items || []).map((it) => ({
      product: Object.assign({}, it.product || {}, {
        product_name: it.name || (it.product && it.product.product_name) || 'Product',
        price: it.rawPrice || (it.product && (it.product.price || 0)) || 0,
        size: (it.product && (it.product.size || it.product.variant || it.product.color)) || '',
        unit: (it.product && (it.product.unit || 'pc')) || 'pc',
      }),
      quantity: it.qty || it.quantity || 1,
      price: it.rawPrice || it.price || (it.product && it.product.price) || 0,
    })),
  };
  return { checkout, delivery_id: order.id };
}

function resolveCheckoutAddress(checkout) {
  if (!checkout) return "";
  const parts = [
    checkout.delivery_street,
    checkout.delivery_barangay,
    checkout.delivery_city,
    checkout.delivery_province,
    checkout.delivery_zip,
    checkout.delivery_country,
  ].filter(Boolean);
  return parts.join(", ") || "";
}

// ExcelJS-based export (dynamic import, with CSV fallback)
async function exportOrderToExcelJS(order) {
  const delivery = buildDeliveryForExport(order);
  try {
    let ExcelJS = null;
    let saveAs = null;
    try {
      const mod = await import('exceljs');
      ExcelJS = mod && (mod.default || mod);
    } catch (e) { ExcelJS = null; }
    try {
      const fs = await import('file-saver');
      saveAs = fs && (fs.saveAs || fs.default || null);
    } catch (e) { saveAs = null; }

    const checkout = delivery.checkout || {};
    const user = checkout.user || {};
    const items = checkout.items || [];
    const orderId = checkout.checkout_id || delivery.delivery_id || "order";
    const paid = Number(checkout.paid_amount || 0);
    const shipping = Number(checkout.shipping_fee || 0);
    const subtotal = Math.max(0, paid - shipping);
    if (!ExcelJS) throw new Error('exceljs-not-available');

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`Order_${orderId}`);
    ws.mergeCells('A5:G7');
    ws.getCell('A5').value = 'QUOTATION';
    ws.getCell('A5').font = { bold: true, size: 24 };
    ws.getCell('A5').alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(5).height = 28;
    const ciStart = 9;
    ws.getCell(`A${ciStart}`).value = 'Client Name:';
    ws.mergeCells(`B${ciStart}:F${ciStart}`);
    ws.getCell(`B${ciStart}`).value = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    ws.getCell(`B${ciStart}`).alignment = { wrapText: true, vertical: 'top' };
    ws.getCell(`G${ciStart}`).value = 'Date:';
    ws.getCell(`A${ciStart}`).font = { bold: true };
    ws.getCell(`A${ciStart+1}`).value = 'Company Name:';
    ws.mergeCells(`B${ciStart+1}:F${ciStart+1}`);
    ws.getCell(`B${ciStart+1}`).value = user.company_name || '';
    ws.getCell(`B${ciStart+1}`).alignment = { wrapText: true, vertical: 'top' };
    ws.getCell(`G${ciStart+1}`).value = 'Deliver:';
    ws.getCell(`A${ciStart+1}`).font = { bold: true };
    ws.getCell(`A${ciStart+2}`).value = 'Contact Details:';
    ws.mergeCells(`B${ciStart+2}:F${ciStart+2}`);
    ws.getCell(`B${ciStart+2}`).value = [user.email, user.phone_number].filter(Boolean).join(' | ');
    ws.getCell(`B${ciStart+2}`).alignment = { wrapText: true, vertical: 'top' };
    ws.getCell(`G${ciStart+2}`).value = 'Validity:';
    ws.getCell(`A${ciStart+2}`).font = { bold: true };
    ws.getCell(`A${ciStart+3}`).value = 'Address:';
    ws.mergeCells(`B${ciStart+3}:F${ciStart+3}`);
    const addr = order.delivery && order.delivery.formattedAddress ? order.delivery.formattedAddress : resolveCheckoutAddress(checkout);
    ws.getCell(`B${ciStart+3}`).value = addr || '';
    ws.getCell(`B${ciStart+3}`).alignment = { wrapText: true, vertical: 'top' };
    ws.getCell(`G${ciStart+3}`).value = 'Payment & Terms';
    ws.getCell(`A${ciStart+3}`).font = { bold: true };
    ws.getCell(`G${ciStart+3}`).font = { bold: true };
    ws.getCell(`G${ciStart+3}`).value = (checkout.payment_method || 'COD').toString().replace(/_/g,' ').toUpperCase();
    for (let r = ciStart; r <= ciStart+3; r++) {
      ['A','B','C','D','E','F','G'].forEach((col) => {
        const c = ws.getCell(`${col}${r}`);
        c.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
      });
    }
    const headerRow = 14;
    const cols = ['No','Description','Size/Variant','Qty','Unit','Unit Price','Amount'];
    ws.columns = [ { width: 16 }, { width: 18 }, { width: 18 }, { width: 16 }, { width: 18 }, { width: 16 }, { width: 34 } ];
    try { ws.getColumn(2).alignment = { wrapText: true, vertical: 'top' }; } catch (e) {}
    cols.forEach((c, i) => {
      const cell = ws.getCell(headerRow, i+1);
      cell.value = c; cell.font = { bold: true }; cell.alignment = { horizontal: 'center' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE3F0' } };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
    });
    const ITEM_START = headerRow + 1;
    const ITEM_COUNT = Math.max(1, (items && items.length) || 0);
    for (let r = 0; r < ITEM_COUNT; r++) {
      const rowNumber = ITEM_START + r;
      const it = items[r] || null;
      if (it) {
        const product = it.product || {};
        const qty = Number(it.quantity || 1);
        const price = Number(it.price ?? product.price ?? 0);
        const amount = qty * price;
        ws.getCell(rowNumber, 1).value = String(r + 1).padStart(2, '0');
        ws.getCell(rowNumber, 2).value = product.product_name || it.name || '';
        ws.getCell(rowNumber, 3).value = product.size || product.variant || product.color || '';
        ws.getCell(rowNumber, 4).value = qty;
        ws.getCell(rowNumber, 5).value = product.unit || 'pc';
        ws.getCell(rowNumber, 6).value = price;
        ws.getCell(rowNumber, 6).numFmt = '#,##0.00';
        ws.getCell(rowNumber, 7).value = amount;
        ws.getCell(rowNumber, 7).numFmt = '#,##0.00';
      } else {
        for (let c = 1; c <= 7; c++) ws.getCell(rowNumber, c).value = '';
      }
      ws.getCell(rowNumber,1).alignment = { horizontal: 'center' };
      ws.getCell(rowNumber,4).alignment = { horizontal: 'center' };
      ws.getCell(rowNumber,6).alignment = { horizontal: 'right' };
      ws.getCell(rowNumber,7).alignment = { horizontal: 'right' };
      for (let c = 1; c <= 7; c++) {
        ws.getCell(rowNumber, c).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
      }
    }
    let rowIdx = ITEM_START + ITEM_COUNT;
    ws.mergeCells(`A${rowIdx}:G${rowIdx}`);
    ws.getCell(`A${rowIdx}`).value = '***Nothing Follows***';
    ws.getCell(`A${rowIdx}`).font = { bold: true, color: { argb: 'FFB91C1C' } };
    ws.getCell(`A${rowIdx}`).alignment = { horizontal: 'center' };
    rowIdx++;
    ws.getCell(`F${rowIdx}`).value = 'Subtotal';
    ws.getCell(`G${rowIdx}`).value = subtotal;
    ws.getCell(`G${rowIdx}`).numFmt = '#,##0.00';
    const cyanFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFAFF0FF' } };
    for (let col = 1; col <= 6; col++) { const letter = String.fromCharCode(64 + col); const cell = ws.getCell(`${letter}${rowIdx}`); cell.fill = cyanFill; cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } }; }
    const rightCell = ws.getCell(`G${rowIdx}`); rightCell.fill = cyanFill; rightCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
    rowIdx++;
    ws.getCell(`F${rowIdx}`).value = 'Shipping';
    ws.getCell(`G${rowIdx}`).value = shipping === 0 ? 'FREE' : shipping;
    if (shipping !== 0) ws.getCell(`G${rowIdx}`).numFmt = '#,##0.00';
    for (let col = 1; col <= 6; col++) { const letter = String.fromCharCode(64 + col); const cell = ws.getCell(`${letter}${rowIdx}`); cell.fill = cyanFill; cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } }; }
    ws.getCell(`G${rowIdx}`).fill = cyanFill; ws.getCell(`G${rowIdx}`).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
    rowIdx++;
    const VAT_RATE = 0.12; const vatAmount = Math.round((subtotal * VAT_RATE) * 100) / 100;
    ws.getCell(`F${rowIdx}`).value = `VAT (${Math.round(VAT_RATE * 100)}%)`;
    ws.getCell(`G${rowIdx}`).value = vatAmount; ws.getCell(`G${rowIdx}`).numFmt = '#,##0.00'; ws.getCell(`F${rowIdx}`).font = { bold: false };
    for (let col = 1; col <= 6; col++) { const letter = String.fromCharCode(64 + col); const cell = ws.getCell(`${letter}${rowIdx}`); cell.fill = cyanFill; cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } }; }
    ws.getCell(`G${rowIdx}`).fill = cyanFill; ws.getCell(`G${rowIdx}`).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
    rowIdx++;
    ws.getCell(`F${rowIdx}`).value = 'Total Paid'; ws.getCell(`G${rowIdx}`).value = paid; ws.getCell(`G${rowIdx}`).numFmt = '#,##0.00'; ws.getCell(`F${rowIdx}`).font = { bold: true }; ws.getCell(`G${rowIdx}`).font = { bold: true };
    for (let col = 1; col <= 6; col++) { const letter = String.fromCharCode(64 + col); const cell = ws.getCell(`${letter}${rowIdx}`); cell.fill = cyanFill; cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } }; }
    ws.getCell(`G${rowIdx}`).fill = cyanFill; ws.getCell(`G${rowIdx}`).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };

    ws.columns = [ { width: 16 }, { width: 18 }, { width: 18 }, { width: 16 }, { width: 18 }, { width: 16 }, { width: 34 } ];
    try { ws.getColumn(2).alignment = { wrapText: true, vertical: 'top' }; } catch (e) {}

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    if (saveAs) {
      saveAs(blob, `Quotation_Order_${orderId}.xlsx`);
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `Quotation_Order_${orderId}.xlsx`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }
  } catch (e) {
    console.error('exportOrderToExcelJS failed', e);
    try {
      const checkout = (buildDeliveryForExport(order).checkout) || {};
      const user = checkout.user || {};
      const items = checkout.items || [];
      const orderId = checkout.checkout_id || "order";
      const rows = [];
      rows.push(["Quotation"]);
      rows.push([]);
      rows.push(["Client Name", `${user.first_name || ''} ${user.last_name || ''}`.trim()]);
      rows.push(["Company", user.company_name || '']);
      rows.push(["Contact", [user.email, user.phone_number].filter(Boolean).join(' | ')]);
      rows.push(["Address", order.delivery && order.delivery.formattedAddress ? order.delivery.formattedAddress : '']);
      rows.push([]);
      rows.push(["No","Description","Size/Variant","Qty","Unit","Unit Price","Amount"]);
      for (let i = 0; i < Math.max(items.length, 1); i++) {
        const it = items[i] || {};
        const product = it.product || {};
        const qty = Number(it.quantity || 1);
        const price = Number(it.price ?? product.price ?? 0);
        const amount = qty * price;
        rows.push([String(i + 1).padStart(2, '0'), product.product_name || it.name || '', product.size || product.variant || '', qty, product.unit || 'pc', price.toFixed(2), amount.toFixed(2)]);
      }
      const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `Quotation_Order_${orderId}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (e2) { console.error('CSV fallback failed', e2); alert('Failed to export Excel file.'); }
  }
}

// PDF export using printable HTML (opens in new tab and triggers print)
function exportOrderToPDF(order) {
  const checkout = buildDeliveryForExport(order).checkout;
  const user = checkout.user || {};
  const items = checkout.items || [];
  const fullAddr = order.delivery && order.delivery.formattedAddress ? order.delivery.formattedAddress : resolveCheckoutAddress(checkout);
  const orderId = checkout.checkout_id || order.id;
  const paid = Number(checkout.paid_amount || 0);
  const shipping = Number(checkout.shipping_fee || 0);
  const grandTotal = paid;
  const vatBase = grandTotal / 1.12;
  const vat = grandTotal - vatBase;
  const dateStr = new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  const paymentMethod = (checkout.payment_method || 'COD').replace(/_/g, ' ').toUpperCase();
  const itemRowsArr = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const product = item.product || {};
    const qty = Number(item.quantity || 1);
    const price = Number(item.price || product.price || 0);
    const amount = price * qty;
    itemRowsArr.push(`<tr><td style="text-align:center;padding:5px 4px;">${String(i + 1).padStart(2, "0")}</td><td style="padding:5px 6px;">${product.product_name ?? 'Product'}</td><td style="text-align:center;padding:5px 4px;">${product.size ?? product.variant ?? product.color ?? ''}</td><td style="text-align:center;padding:5px 4px;">${qty}</td><td style="text-align:center;padding:5px 4px;">${product.unit ?? 'pc'}</td><td style="text-align:right;padding:5px 6px;">${fmt(price)}</td><td style="text-align:right;padding:5px 6px;">${fmt(amount)}</td></tr>`);
  }
  const itemRows = itemRowsArr.join('');
  const nfRowHtml = `\n      <tr class="nothing-follows">\n        <td colspan="7" style="border-top:2px solid #333;padding:8px 0;text-align:center;font-weight:bold;">***Nothing Follows***</td>\n      </tr>`;
  const html = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8"/>\n<title>Quotation #${orderId}</title>\n<style>body{font-family:Arial,sans-serif;font-size:10pt;color:#111}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px}th{background:#f3f4f6}</style>\n</head>\n<body>\n<h2>Quotation #${orderId}</h2>\n<div><strong>Client:</strong> ${(`${user.first_name || ''} ${user.last_name || ''}`).trim() || '—'}</div>\n<div><strong>Company:</strong> ${user.company_name || ''}</div>\n<div><strong>Contact:</strong> ${[user.email, user.phone_number].filter(Boolean).join(' | ')}</div>\n<div><strong>Address:</strong> ${fullAddr || '—'}</div>\n<br/>\n<table><thead><tr><th style="width:40px">No.</th><th>Item Description</th><th style="width:80px">Size/Variant</th><th style="width:40px">Qty</th><th style="width:50px">Unit</th><th style="width:90px">Unit Price</th><th style="width:90px">Amount</th></tr></thead><tbody>${itemRows}${nfRowHtml}</tbody></table>\n<br/>\n<table style="width:100%"><tr><td style="text-align:right">Subtotal:</td><td style="width:120px;text-align:right">${fmt(vatBase)}</td></tr><tr><td style="text-align:right">VAT:</td><td style="text-align:right">${fmt(vat)}</td></tr><tr><td style="text-align:right">Total Amount:</td><td style="text-align:right">${fmt(grandTotal)}</td></tr></table>\n</body>\n</html>`;
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}