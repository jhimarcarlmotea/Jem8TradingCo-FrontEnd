import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import axios from "axios";
import AdminNav from "../components/AdminNav";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

const ITEMS_PER_PAGE = 20;

const STATUS_MAP = {
  processing: {
    label: "Processing",
    badge: "bg-violet-100 text-violet-700 border border-violet-300",
    radio: "accent-violet-600",
    selected: "border-2 border-violet-600 bg-violet-50",
  },
  ready: {
    label: "Ready",
    badge: "bg-blue-100 text-blue-700 border border-blue-300",
    radio: "accent-blue-700",
    selected: "border-2 border-blue-700 bg-blue-50",
  },
  on_the_way: {
    label: "On the way",
    badge: "bg-amber-100 text-amber-700 border border-amber-300",
    radio: "accent-amber-600",
    selected: "border-2 border-amber-600 bg-amber-50",
  },
  delivered: {
    label: "Delivered",
    badge: "bg-emerald-100 text-emerald-700 border border-emerald-300",
    radio: "accent-emerald-600",
    selected: "border-2 border-emerald-600 bg-emerald-50",
  },
};

const getStatusCfg = (status) =>
  STATUS_MAP[status] ?? {
    label: status ?? "—",
    badge: "bg-gray-100 text-gray-500 border border-gray-200",
    radio: "accent-gray-400",
    selected: "border-2 border-gray-400 bg-gray-50",
  };

const fmt = (n) =>
  Number(n ?? 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

const SORT_OPTIONS = [
  { value: "id_desc", label: "ID: Newest First" },
  { value: "id_asc", label: "ID: Oldest First" },
  { value: "name_asc", label: "Name: A → Z" },
  { value: "name_desc", label: "Name: Z → A" },
  { value: "amount_desc", label: "Amount: Highest" },
  { value: "amount_asc", label: "Amount: Lowest" },
];

const EXPORTED_KEY = "admin_exported_orders";
function getExportedSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem(EXPORTED_KEY) || "[]"));
  } catch {
    return new Set();
  }
}
function markExported(ids) {
  const prev = getExportedSet();
  ids.forEach((id) => prev.add(String(id)));
  localStorage.setItem(EXPORTED_KEY, JSON.stringify([...prev]));
}

const ProductCell = memo(function ProductCell({ checkout }) {
  const items = checkout?.items ?? [];
  const firstItem = items[0] ?? null;
  const product = firstItem?.product ?? null;
  const imageUrl = product?.image ?? null;

  const handleImgError = useCallback((e) => { e.currentTarget.style.display = "none"; }, []);

  if (!product) return <span className="text-gray-400">—</span>;

  const isPreOrder = product.status === "pre_order";
  const totalItems = items.length;

  return (
    <div className="flex items-center gap-2.5 min-w-[180px] max-w-[260px]">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={product.product_name}
          className="flex-shrink-0 object-cover bg-gray-100 border border-gray-200 rounded-lg w-9 h-9"
          onError={handleImgError}
        />
      ) : (
        <div className="flex items-center justify-center flex-shrink-0 text-xs text-gray-400 bg-gray-100 border border-gray-200 rounded-lg w-9 h-9">
          📦
        </div>
      )}
      <div className="min-w-0">
        <div className="text-xs font-medium leading-tight text-gray-900 truncate" title={product.product_name}>
          {product.product_name}
        </div>
        <div className="text-gray-400 text-[11px] mt-0.5">
          Qty: {firstItem?.quantity ?? 1} · ₱{fmt(firstItem?.price ?? product.price)}
        </div>
        {totalItems > 1 && (
          <div className="text-[10px] text-blue-500 mt-0.5">
            +{totalItems - 1} more item{totalItems - 1 > 1 ? "s" : ""}
          </div>
        )}
        <span className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border
          ${isPreOrder
            ? "text-amber-700 bg-amber-50 border-amber-200"
            : "text-emerald-700 bg-emerald-50 border-emerald-200"}`}>
          {isPreOrder ? "⏳ Pre-order" : "✅ In stock"}
        </span>
      </div>
    </div>
  );
});

// ── Status Update Modal ────────────────────────────────────────────────────────
function StatusModal({ delivery, onClose, onUpdated }) {
  const [status, setStatus] = useState(delivery.status ?? "processing");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await api.patch(`/deliveries/${delivery.delivery_id}/status`, { status });
      onUpdated(res.data);
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update status.");
    } finally {
      setSaving(false);
    }
  };

  const checkout = delivery.checkout;

  return (
    <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-[999]">
      <div data-overlay className="bg-white rounded-2xl p-7 w-[min(420px,90vw)] shadow-2xl">
        <h2 className="mb-1 text-base font-bold text-gray-900">Update Delivery Status</h2>
        <p className="mb-1 text-xs text-gray-500">Order #{checkout?.checkout_id}</p>
        {checkout && (
          <div className="flex items-center gap-2.5 mb-4 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
            <ProductCell checkout={checkout} />
          </div>
        )}
        <div className="flex flex-col gap-2.5 mb-5">
          {Object.entries(STATUS_MAP).map(([key, cfg]) => (
            <label
              key={key}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg cursor-pointer transition-all ${
                status === key ? cfg.selected : "border border-gray-200 bg-white"
              }`}
            >
              <input
                type="radio"
                name="status"
                value={key}
                checked={status === key}
                onChange={() => setStatus(key)}
                className={cfg.radio}
              />
              <span className={`text-xs font-semibold ${cfg.badge.split(" ").find((c) => c.startsWith("text-"))}`}>
                {cfg.label}
              </span>
            </label>
          ))}
        </div>
        {error && <p className="text-red-600 text-xs mb-2.5">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs cursor-pointer hover:bg-gray-50 transition-colors"
          >Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-1.5 rounded-lg border-none text-white text-xs font-semibold transition-colors ${
              saving ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
            }`}
          >{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

// ── View Order Modal ───────────────────────────────────────────────────────────
const STATUS_COLORS = {
  processing: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  ready:      { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  on_the_way: { bg: "#fff7ed", color: "#d97706", border: "#fde68a" },
  delivered:  { bg: "#f0fdf4", color: "#166534", border: "#86efac" },
};
const TRACKER_LABELS = ["Ordered", "Processing", "Ready", "On The Way", "Delivered"];
const STATUS_TO_TRACKER = { processing: 1, ready: 2, on_the_way: 3, delivered: 4 };
const PAYMENT_TAGS = {
  gcash:        { label: "GCash",   color: "#0078FF" },
  deposit:      { label: "Deposit", color: "#0ea5e9" },
  bank_transfer:{ label: "Bank",    color: "#6366f1" },
  cod:          { label: "COD",     color: "#f59e0b" },
  check:        { label: "Check",   color: "#64748b" },
};

function hexToRgba(hex, alpha = 1) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  return `rgba(${(bigint >> 16) & 255},${(bigint >> 8) & 255},${bigint & 255},${alpha})`;
}

function renderPaymentTag(method) {
  if (!method) return null;
  const key = String(method).trim().toLowerCase().replace(/\s+/g, "_");
  const meta = PAYMENT_TAGS[key] || null;
  const label = meta?.label ?? String(method).replace(/_/g, " ");
  const color = meta?.color ?? "#d1d5db";
  return (
    <span className="inline-block px-3 py-1 text-xs font-semibold border rounded-full"
      style={{ background: hexToRgba(color, 0.12), borderColor: hexToRgba(color, 0.28), color }}>
      {label}
    </span>
  );
}

function ViewOrderModal({ delivery, onClose }) {
  const checkout = delivery.checkout;
  const user = checkout?.user;
  const items = checkout?.items ?? [];
  const status = (delivery.status ?? "processing").toLowerCase();
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.processing;
  const trackerIdx = STATUS_TO_TRACKER[status] ?? 0;
  const addr = checkout?.delivery_address ?? {};
  const subtotal = Number(checkout?.paid_amount ?? 0) - Number(checkout?.shipping_fee ?? 0);
  const receipt = checkout?.receipt;

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
          <div>
            <h2 className="m-0 text-lg font-bold text-gray-900">Order #{checkout?.checkout_id}</h2>
            <div className="text-xs text-gray-400 mt-0.5">Placed on {fmtDate(checkout?.created_at)}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full border"
              style={{ background: colors.bg, color: colors.color, borderColor: colors.border }}>
              {delivery.status?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
            <button onClick={onClose} className="flex items-center justify-center w-8 h-8 text-lg font-bold text-gray-500 transition-colors bg-gray-100 border-none rounded-full cursor-pointer hover:bg-gray-200">×</button>
          </div>
        </div>
        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-center gap-2 p-4 overflow-x-auto border border-gray-100 bg-gray-50 rounded-xl">
            {TRACKER_LABELS.map((label, i) => {
              const isDone = i < trackerIdx;
              const isCurrent = i === trackerIdx;
              return (
                <div key={label} className="flex items-center flex-shrink-0 gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0
                      ${isDone ? "bg-green-600 text-white" : isCurrent ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"}`}>
                      {isDone ? "✓" : i + 1}
                    </div>
                    <span className={`text-xs font-semibold hidden sm:block ${isDone ? "text-green-600" : isCurrent ? "text-blue-600 font-bold" : "text-gray-400"}`}>
                      {label}
                    </span>
                  </div>
                  {i < TRACKER_LABELS.length - 1 && (
                    <div className={`min-w-[20px] h-0.5 mx-1 flex-shrink-0 ${isDone ? "bg-green-600" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">👤 Client Details</div>
            <div className="px-4 py-3.5 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-700 leading-relaxed">
              <strong>{user?.first_name} {user?.last_name}</strong><br />
              {user?.email} · {user?.phone_number}
              {user?.company_name && <div className="mt-1 text-xs font-medium text-blue-600">🏢 {user.company_name}</div>}
              {user?.tin_number && <div className="text-xs text-gray-400">TIN: {user.tin_number}</div>}
              {(addr.street || addr.city) && (
                <div className="mt-1 text-xs text-gray-500">
                  {[addr.street, addr.barangay, addr.city, addr.province, addr.zip].filter(Boolean).join(", ")}
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">💳 Payment</div>
            <div className="px-4 py-3.5 bg-gray-50 rounded-xl border border-gray-100 text-sm">
              {renderPaymentTag(checkout?.payment_method)}
              {checkout?.payment_details?.account_name && (
                <div className="mt-1 text-xs text-gray-500">Name: {checkout.payment_details.account_name}</div>
              )}
              {checkout?.payment_details?.mobile_number && (
                <div className="text-xs text-gray-500">Number: {checkout.payment_details.mobile_number}</div>
              )}
            </div>
          </div>
          {receipt?.receipt_image_url && (
            <div>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">🧾 Receipt</div>
              <div className="px-4 py-3.5 bg-gray-50 rounded-xl border border-gray-100">
                {receipt.receipt_number && <div className="mb-2 font-mono text-xs text-gray-400">{receipt.receipt_number}</div>}
                <img src={receipt.receipt_image_url} alt="Receipt" className="object-cover w-full border border-gray-200 max-h-48 rounded-xl" />
              </div>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">🛒 Items Ordered</span>
              <span className="ml-auto text-[11px] text-gray-400">{items.length} item{items.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="overflow-hidden border border-gray-100 divide-y divide-gray-100 bg-gray-50 rounded-xl">
              {items.length === 0 ? (
                <div className="py-6 text-sm text-center text-gray-400">No item details available.</div>
              ) : (
                items.map((item, idx) => {
                  const product = item.product ?? {};
                  const qty = Number(item.quantity ?? 1);
                  const price = Number(item.price ?? product.price ?? 0);
                  const imgUrl = product.image ?? product.image_url ?? null;
                  return (
                    <div key={idx} className="flex items-center gap-4 p-4">
                      {imgUrl ? (
                        <img src={imgUrl} alt={product.product_name} className="flex-shrink-0 object-cover w-12 h-12 border border-gray-200 rounded-xl" />
                      ) : (
                        <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-xl bg-gray-200 rounded-xl">📦</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{product.product_name ?? "Product"}</div>
                        <div className="text-xs text-gray-400 mt-0.5">Qty: {qty} × ₱{fmt(price)}</div>
                      </div>
                      <div className="flex-shrink-0 text-sm font-bold text-gray-700">₱{fmt(price * qty)}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 px-4 py-4 border border-gray-100 bg-gray-50 rounded-xl">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span><span>₱{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Shipping</span>
              <span className={Number(checkout?.shipping_fee ?? 0) === 0 ? "text-green-600 font-bold" : ""}>
                {Number(checkout?.shipping_fee ?? 0) === 0 ? "FREE" : `₱${fmt(checkout?.shipping_fee)}`}
              </span>
            </div>
            <div className="flex justify-between pt-2 text-base font-bold text-gray-900 border-t border-gray-200">
              <span>Total Paid</span><span>₱{fmt(checkout?.paid_amount)}</span>
            </div>
          </div>
          {(checkout?.special_instructions || delivery?.notes) && (
            <div>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">📝 Special Instructions</div>
              <div className="px-4 py-3.5 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-700">
                {checkout?.special_instructions ?? delivery?.notes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT UTILITIES
// ══════════════════════════════════════════════════════════════════════════════

function loadXLSX() {
  return new Promise((resolve, reject) => {
    if (window.XLSX) { resolve(window.XLSX); return; }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.onload = () => resolve(window.XLSX);
    script.onerror = () => reject(new Error("Failed to load XLSX"));
    document.head.appendChild(script);
  });
}

// ── PDF Export ─────────────────────────────────────────────────────────────────
// Matches the original Jem8 Circle quotation template exactly:
// - Teal header bar with logo area (left) + quotation number box (right)
// - Client info grid (2-column)
// - Items table with all columns
// - Nothing Follows row
// - Cyan-highlighted totals (Subtotal, VAT, blank row, Total Amount)
// - Disclaimer text
// - Signature block (4 columns)
// - Footer with contact info
function exportOrderToPDF(delivery) {
  const checkout = delivery.checkout;
  const user = checkout?.user ?? {};
  const items = checkout?.items ?? [];
  const addr = checkout?.delivery_address ?? {};
  const orderId = checkout?.checkout_id ?? delivery.delivery_id;
  const paid = Number(checkout?.paid_amount ?? 0);
  const shipping = Number(checkout?.shipping_fee ?? 0);
  const grandTotal = paid; // paid_amount is the total
  const vatBase = grandTotal / 1.12;
  const vat = grandTotal - vatBase;
  const fullAddr = [addr.street, addr.barangay, addr.city, addr.province, addr.zip].filter(Boolean).join(", ");
  const dateStr = checkout?.created_at
    ? new Date(checkout.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
    : new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  const paymentMethod = (checkout?.payment_method ?? "COD").replace(/_/g, " ").toUpperCase();

  const itemRows = items.map((item, i) => {
    const product = item.product ?? {};
    const qty = Number(item.quantity ?? 1);
    const price = Number(item.price ?? product.price ?? 0);
    const amount = price * qty;
    return `
      <tr>
        <td style="text-align:center;padding:5px 4px;">${String(i + 1).padStart(2, "0")}</td>
        <td style="padding:5px 6px;">${product.product_name ?? "Product"}</td>
        <td style="text-align:center;padding:5px 4px;">${product.size ?? product.variant ?? product.color ?? ""}</td>
        <td style="text-align:center;padding:5px 4px;">${qty}</td>
        <td style="text-align:center;padding:5px 4px;">${product.unit ?? "pc"}</td>
        <td style="text-align:right;padding:5px 6px;">${fmt(price)}</td>
        <td style="text-align:right;padding:5px 6px;">${fmt(amount)}</td>
      </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Quotation #${orderId}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Calibri Light', Calibri, 'Segoe UI', Arial, sans-serif;
    font-size: 9.5pt;
    color: #1a1a1a;
    background: #fff;
    padding: 14px 18px;
  }

  /* ── TOP HEADER: teal bar with logo left + number box right ── */
  .top-header {
    display: flex;
    align-items: stretch;
    margin-bottom: 0;
  }
  .logo-area {
    flex: 1;
    background: #5a9ea0;
    padding: 10px 16px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .logo-area .company-name {
    font-size: 18pt;
    font-weight: bold;
    color: #fff;
    font-style: italic;
    letter-spacing: 0.5px;
    line-height: 1.1;
  }
  .logo-area .company-name span {
    color: #f0c040;
  }
  .logo-area .tagline {
    font-size: 8pt;
    color: #e0f0f0;
    margin-top: 2px;
    letter-spacing: 0.5px;
  }
  .quote-num-box {
    background: #5a9ea0;
    min-width: 130px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10px 14px;
    border-left: 2px solid rgba(255,255,255,0.3);
  }
  .quote-num-box .qnum-label {
    font-size: 7pt;
    color: #c8eaeb;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 3px;
  }
  .quote-num-box .qnum-val {
    font-size: 13pt;
    font-weight: bold;
    color: #fff;
    letter-spacing: 1px;
  }

  /* ── QUOTATION TITLE BAR ── */
  .quotation-bar {
    display: flex;
    border: 1.5px solid #333;
    margin-top: 6px;
    margin-bottom: 0;
  }
  .quotation-bar .qt-title {
    flex: 1;
    text-align: center;
    font-size: 18pt;
    font-weight: bold;
    letter-spacing: 2px;
    padding: 8px 0;
    color: #1a1a1a;
    border-right: 1.5px solid #333;
  }
  .quotation-bar .qt-num {
    min-width: 130px;
    background: #1a1a1a;
    color: #fff;
    font-size: 11pt;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 10px;
    letter-spacing: 1px;
  }

  /* ── CLIENT INFO GRID ── */
  .info-grid {
    display: flex;
    border: 1.5px solid #333;
    border-top: none;
    margin-bottom: 0;
  }
  .info-left { flex: 1; border-right: 1.5px solid #333; }
  .info-right { min-width: 200px; }
  .info-row {
    display: flex;
    border-bottom: 1px solid #aaa;
    min-height: 22px;
  }
  .info-row:last-child { border-bottom: none; }
  .info-label {
    font-weight: bold;
    font-size: 8.5pt;
    padding: 4px 7px;
    min-width: 105px;
    max-width: 105px;
    border-right: 1px solid #aaa;
    color: #111;
    white-space: nowrap;
  }
  .info-val {
    font-size: 8.5pt;
    padding: 4px 7px;
    flex: 1;
    color: #222;
  }

  /* ── ITEMS TABLE ── */
  .items-wrap {
    border: 1.5px solid #333;
    border-top: none;
  }
  table.items {
    width: 100%;
    border-collapse: collapse;
  }
  table.items thead tr {
    background: #fff;
  }
  table.items th {
    font-size: 8.5pt;
    font-weight: bold;
    padding: 6px 4px;
    text-align: center;
    border: 1px solid #aaa;
    color: #111;
  }
  table.items td {
    font-size: 8.5pt;
    border: 1px solid #aaa;
    vertical-align: middle;
    color: #222;
  }
  .col-itemno  { width: 40px; }
  .col-desc    { width: auto; }
  .col-size    { width: 80px; }
  .col-qty     { width: 32px; }
  .col-unit    { width: 36px; }
  .col-price   { width: 90px; }
  .col-amount  { width: 90px; }

  /* ── NOTHING FOLLOWS ── */
  .nothing-follows td {
    text-align: center;
    font-weight: bold;
    color: #e00;
    font-size: 8.5pt;
    padding: 5px;
    border: 1px solid #aaa;
  }

  /* ── TOTALS ── */
  .totals-table {
    width: 100%;
    border-collapse: collapse;
    border: 1.5px solid #333;
    border-top: none;
  }
  .totals-table td {
    font-size: 8.5pt;
    padding: 5px 8px;
    border: 1px solid #aaa;
  }
  .tot-label {
    background: #aff0ff;
    font-weight: bold;
    text-align: right;
    color: #111;
    width: 88%;
  }
  .tot-val {
    background: #aff0ff;
    font-weight: bold;
    text-align: right;
    color: #111;
    width: 12%;
    white-space: nowrap;
  }
  .tot-blank {
    background: #aff0ff;
    height: 10px;
  }

  /* ── DISCLAIMER ── */
  .disclaimer-wrap {
    border: 1.5px solid #333;
    border-top: none;
    padding: 6px 8px;
  }
  .disc-title {
    font-weight: bold;
    font-size: 8.5pt;
    color: #111;
    margin-bottom: 3px;
  }
  .disc-text {
    font-size: 7.5pt;
    color: #333;
    line-height: 1.4;
    margin-bottom: 3px;
  }

  /* ── SIGNATURE BLOCK ── */
  .sig-table {
    width: 100%;
    border-collapse: collapse;
    border: 1.5px solid #333;
    border-top: none;
  }
  .sig-table td {
    border: 1px solid #aaa;
    font-size: 8.5pt;
    text-align: center;
    padding: 4px 6px;
    vertical-align: top;
  }
  .sig-header {
    font-weight: bold;
    color: #111;
    background: #f9f9f9;
    padding: 5px 6px !important;
  }
  .sig-space { height: 28px; }
  .sig-name {
    font-weight: bold;
    color: #111;
    padding: 3px 6px !important;
    background: #e8f4e8;
  }
  .sig-role {
    color: #444;
    font-size: 7.5pt;
    padding: 3px 6px !important;
  }

  /* ── FOOTER ── */
  .footer {
    background: #5a9ea0;
    margin-top: 6px;
    padding: 7px 14px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .footer-left, .footer-right {
    font-size: 7.5pt;
    color: #fff;
    font-style: italic;
    line-height: 1.6;
  }
  .footer-right { text-align: right; }

  @media print {
    body { padding: 8px 12px; }
    @page { margin: 10mm; }
  }
</style>
</head>
<body>

<!-- TOP HEADER: Logo + Number -->
<div class="top-header">
  <div class="logo-area">
    <div class="company-name">Jem <span>8</span> circle</div>
    <div class="tagline">Trading Co.</div>
  </div>
  <div class="quote-num-box">
    <div class="qnum-label">Quotation</div>
    <div class="qnum-val"># ${orderId}</div>
  </div>
</div>

<!-- QUOTATION TITLE BAR -->
<div class="quotation-bar">
  <div class="qt-title">QUOTATION</div>
  <div class="qt-num"># ${orderId}</div>
</div>

<!-- CLIENT INFO -->
<div class="info-grid">
  <div class="info-left">
    <div class="info-row">
      <div class="info-label">Client Name:</div>
      <div class="info-val">${(`${user.first_name ?? ""} ${user.last_name ?? ""}`).trim() || "—"}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Company Name:</div>
      <div class="info-val">${user.company_name ?? ""}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Contact Details:</div>
      <div class="info-val">${[user.email, user.phone_number].filter(Boolean).join(" | ") || "—"}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Address:</div>
      <div class="info-val">${fullAddr || "—"}</div>
    </div>
  </div>
  <div class="info-right">
    <div class="info-row">
      <div class="info-label">Date:</div>
      <div class="info-val">${dateStr}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Deliver:</div>
      <div class="info-val">5 to 7 Days</div>
    </div>
    <div class="info-row">
      <div class="info-label">Validity:</div>
      <div class="info-val">15 Days</div>
    </div>
    <div class="info-row">
      <div class="info-label">Payment &amp; Terms</div>
      <div class="info-val">${paymentMethod}</div>
    </div>
  </div>
</div>

<!-- ITEMS TABLE -->
<div class="items-wrap">
  <table class="items">
    <thead>
      <tr>
        <th class="col-itemno">Item<br/>No.</th>
        <th class="col-desc">Item Description</th>
        <th class="col-size">Size / Color</th>
        <th class="col-qty">Qty</th>
        <th class="col-unit">Unit</th>
        <th class="col-price">Unit Price<br/>(PHP)</th>
        <th class="col-amount">Amount<br/>(PHP)</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      <tr class="nothing-follows">
        <td></td>
        <td colspan="4">***Nothing Follows***</td>
        <td></td>
        <td></td>
      </tr>
    </tbody>
  </table>
</div>

<!-- TOTALS -->
<table class="totals-table">
  <tr>
    <td class="tot-label">Subtotal:</td>
    <td class="tot-val">${fmt(vatBase)}</td>
  </tr>
  <tr>
    <td class="tot-label">VAT:</td>
    <td class="tot-val">${fmt(vat)}</td>
  </tr>
  <tr>
    <td class="tot-blank"></td>
    <td class="tot-blank"></td>
  </tr>
  <tr>
    <td class="tot-label">Total Amount:</td>
    <td class="tot-val">${fmt(grandTotal)}</td>
  </tr>
</table>

<!-- DISCLAIMER -->
<div class="disclaimer-wrap">
  <div class="disc-title">Disclaimer:</div>
  <p class="disc-text">* Cancellations will be considered only if the request is made within 24 hours of placing the order. However, the cancellation request will not be entertained if the orders have been communicated to the manufacturing plant and have initiated the process of processing/shipping the items. Deposits are non-refundable and client will be charged for the irreversible fees incurred once item/s has already been processed/shipped;</p>
  <p class="disc-text">*JEM8 CIRCLE TRADING CO. will not be held liable for the delays due to holidays, transportation and labor strikes, typhoons, floods, earthquakes, fire, volcanic eruptions, acts of God, and the like.</p>
</div>

<!-- SIGNATURE BLOCK -->
<table class="sig-table">
  <tr>
    <td class="sig-header">Prepared By</td>
    <td class="sig-header">Approved By:</td>
    <td class="sig-header">Client Signature</td>
    <td class="sig-header">Reference No.</td>
  </tr>
  <tr>
    <td class="sig-space"></td>
    <td class="sig-space"></td>
    <td class="sig-space"></td>
    <td class="sig-space" rowspan="3"></td>
  </tr>
  <tr>
    <td class="sig-name">Shella Ricafrente</td>
    <td class="sig-name">VAR</td>
    <td></td>
  </tr>
  <tr>
    <td class="sig-role">Sales Executive</td>
    <td class="sig-role">Purchasing Officer</td>
    <td class="sig-role">Date and Signature</td>
  </tr>
</table>

<!-- FOOTER -->
<div class="footer">
  <div class="footer-left">
    Tel nos: (02)624-3627 / (02) 514-656 / (02) 785-0587<br/>
    TeleFax: (02)805-1432<br/>
    Address: Unit 202 P Cityland 10 Tower1 HV Dela Costa St.Salcedo Village, Makati City
  </div>
  <div class="footer-right">
    Email: sales1.jem8circle@gmail.com /<br/>
    sales3.jem8circle@gmail.com
  </div>
</div>

<script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
}

// ── Excel Export ───────────────────────────────────────────────────────────────
// Matches the original quotation XLSX template exactly:
// Rows 1-4: empty spacer
// Row 5-7: QUOTATION title (A:G merged) + # orderId (H:K merged, black bg)
// Row 8: spacer
// Rows 9-12: client info grid (label A:B, value C:I, label J, value K)
// Row 13: spacer
// Row 14: table header
// Row 15+: item rows (dynamic)
// After items: Nothing Follows row
// After that: Subtotal, VAT, blank spacer, Total Amount (all cyan)
// Disclaimer block
// Signature block (4 columns: Prepared By, Approved By, Client Signature, Reference No.)
// ── Excel Export ───────────────────────────────────────────────────────────────
async function exportOrderToExcel(delivery) {
  const XLSX = await loadXLSX().catch(() => null);
  if (!XLSX) { alert("XLSX library could not be loaded."); return; }
 
  const checkout = delivery.checkout;
  const user = checkout?.user ?? {};
  const items = checkout?.items ?? [];
  const addr = checkout?.delivery_address ?? {};
  const orderId = checkout?.checkout_id ?? delivery.delivery_id;
  const paid = Number(checkout?.paid_amount ?? 0);
  const grandTotal = paid;
  const fullAddr = [addr.street, addr.barangay, addr.city, addr.province, addr.zip].filter(Boolean).join(", ");
  const paymentMethod = (checkout?.payment_method ?? "COD").replace(/_/g, " ").toUpperCase();
 
  // ── Load template from embedded base64 ──
  const TEMPLATE_B64 = "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";
 
  const bin = atob(TEMPLATE_B64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const wb = XLSX.read(arr, { type: "array", cellStyles: true });
 
  const oldName = wb.SheetNames[0];
  const ws = wb.Sheets[oldName];
 
  // Helper: set cell value while preserving existing template style
  const setVal = (ref, value) => {
    if (!ws[ref]) ws[ref] = {};
    if (typeof value === "number") {
      ws[ref].t = "n"; ws[ref].v = value;
    } else {
      ws[ref].t = "s"; ws[ref].v = String(value ?? "");
    }
    delete ws[ref].f;
  };
 
  const setFormula = (ref, formula) => {
    if (!ws[ref]) ws[ref] = {};
    ws[ref].t = "n";
    ws[ref].f = formula;
    ws[ref].v = 0;
    if (!ws[ref].z) ws[ref].z = "#,##0.00";
  };
 
  // ── Quotation Number — H5:K7 merged cell ──
  setVal("H5", `# ${orderId}`);
 
  // ── Client Info rows 9-12 ──
  setVal("C9",  `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim());
  setVal("C10", user.company_name ?? "");
  setVal("C11", [user.email, user.phone_number].filter(Boolean).join(" | "));
  setVal("C12", fullAddr);
  setVal("K12", paymentMethod);
  // K9=Date, K10=Deliver, K11=Validity → LEFT BLANK (matches template)
 
  // ── Item Rows 15–31 (template has 17 pre-built rows: 01-17) ──
  const itemCount = Math.min(items.length, 17);
  for (let i = 0; i < itemCount; i++) {
    const item    = items[i];
    const product = item?.product ?? {};
    const row     = 15 + i;
    const qty     = Number(item.quantity ?? 1);
    const price   = Number(item.price ?? product.price ?? 0);
 
    setVal(`B${row}`, product.product_name ?? item.name ?? "");
    setVal(`G${row}`, product.size ?? product.variant ?? product.color ?? "");
    setVal(`H${row}`, qty);
    setVal(`I${row}`, product.unit ?? "pc");
    setVal(`J${row}`, price);
    setFormula(`K${row}`, `J${row}*H${row}`);
  }
 
  // ── Totals ──
  // Row 32 = Nothing Follows, 33 = Subtotal, 34 = VAT, 35 = blank spacer, 36 = Total
  setFormula("K36", "SUM(K15:K31)");
  setFormula("K33", "K36/1.12");
  setFormula("K34", "K36-K33");
 
  // ── Rename sheet ──
  const newName = `Order #${orderId}`;
  wb.SheetNames[0] = newName;
  wb.Sheets[newName] = ws;
  delete wb.Sheets[oldName];
 
  XLSX.writeFile(wb, `Quotation_Order_${orderId}.xlsx`);
}






// ── Export multiple orders sequentially ──────────────────────────────────────
async function exportSelectedOrders(deliveries, onProgress) {
  for (let i = 0; i < deliveries.length; i++) {
    onProgress && onProgress(i, deliveries.length);
    await exportOrderToExcel(deliveries[i]);
    await new Promise((r) => setTimeout(r, 600));
  }
  onProgress && onProgress(deliveries.length, deliveries.length);
}

// ── Export Progress Modal ─────────────────────────────────────────────────────
function ExportProgressModal({ current, total, onClose }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]">
      <div className="p-8 text-center bg-white shadow-2xl rounded-2xl w-80">
        <div className="mb-3 text-3xl">📊</div>
        <h3 className="mb-1 text-base font-bold text-gray-900">Exporting Orders</h3>
        <p className="mb-4 text-xs text-gray-500">
          Downloading {current} of {total} file{total > 1 ? "s" : ""}…
        </p>
        <div className="w-full h-2 mb-3 bg-gray-100 rounded-full">
          <div className="h-2 transition-all duration-300 bg-green-600 rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-gray-400">{pct}%</p>
        {current === total && (
          <button onClick={onClose} className="px-5 py-2 mt-4 text-xs font-semibold text-white bg-green-600 border-none rounded-lg cursor-pointer hover:bg-green-700">
            Done ✓
          </button>
        )}
      </div>
    </div>
  );
}

// ── Export Menu ───────────────────────────────────────────────────────────────
function ExportMenu({ selectedIds, deliveries, onExportDone }) {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(null);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = deliveries.filter((d) => selectedIds.has(d.delivery_id));

  const handleExcelExport = async () => {
    setOpen(false);
    if (selected.length === 0) return;
    setProgress({ current: 0, total: selected.length });
    await exportSelectedOrders(selected, (i, total) => {
      setProgress({ current: i, total });
    });
    markExported(selected.map((d) => d.delivery_id));
    onExportDone && onExportDone(selected.map((d) => d.delivery_id));
  };

  const handlePDFExport = () => {
    setOpen(false);
    if (selected.length === 0) return;
    selected.forEach((d) => exportOrderToPDF(d));
    markExported(selected.map((d) => d.delivery_id));
    onExportDone && onExportDone(selected.map((d) => d.delivery_id));
  };

  return (
    <>
      {progress && (
        <ExportProgressModal
          current={progress.current}
          total={progress.total}
          onClose={() => setProgress(null)}
        />
      )}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          disabled={selectedIds.size === 0}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-xs font-semibold transition-colors
            ${selectedIds.size > 0
              ? "bg-green-600 text-white border-green-600 hover:bg-green-700 cursor-pointer"
              : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"}`}
        >
          ⬇ Export {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
        </button>
        {open && (
          <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-44 py-1.5">
            <button
              onClick={handleExcelExport}
              className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer border-none bg-transparent flex items-center gap-2"
            >📊 Export as Excel</button>
            <button
              onClick={handlePDFExport}
              className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer border-none bg-transparent flex items-center gap-2"
            >📄 Export as PDF</button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminOrders() {
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [deliveries,    setDeliveries]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [searchTerm,    setSearchTerm]    = useState("");
  const [statusFilter,  setStatusFilter]  = useState("All");
  const [sortBy,        setSortBy]        = useState("id_desc");
  const [currentPage,   setCurrentPage]   = useState(1);
  const [modalTarget,   setModalTarget]   = useState(null);
  const [viewTarget,    setViewTarget]    = useState(null);
  const [selectedIds,   setSelectedIds]   = useState(new Set());
  const [exportedIds,   setExportedIds]   = useState(getExportedSet);

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = statusFilter !== "All" ? { status: statusFilter } : {};
      const res = await api.get("/deliveries", { params });
      setDeliveries(res.data.deliveries ?? []);
      setCurrentPage(1);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, sortBy]);

  const handleUpdated = (updated) => {
    setDeliveries((prev) =>
      prev.map((d) =>
        d.delivery_id === updated.delivery_id ? { ...d, status: updated.status } : d
      )
    );
  };

  const handleExportDone = (ids) => {
    setExportedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(String(id)));
      return next;
    });
    setSelectedIds(new Set());
  };

  const totalRevenue = deliveries.reduce((sum, d) => sum + Number(d.checkout?.paid_amount ?? 0), 0);
  const count = (s) => deliveries.filter((d) => d.status === s).length;

  const summaryStats = [
    { label: "Orders",     value: deliveries.length,       icon: "🛒", bg: "bg-blue-50",    accent: "text-blue-600"   },
    { label: "Processing", value: count("processing"),     icon: "⚙️", bg: "bg-violet-50",  accent: "text-violet-700" },
    { label: "Ready",      value: count("ready"),          icon: "📦", bg: "bg-blue-100",   accent: "text-blue-700"   },
    { label: "On the way", value: count("on_the_way"),     icon: "⏳", bg: "bg-amber-50",   accent: "text-amber-600"  },
    { label: "Delivered",  value: count("delivered"),      icon: "✅", bg: "bg-emerald-50", accent: "text-emerald-600"},
    { label: "Revenue",    value: `₱${fmt(totalRevenue)}`, icon: "💰", bg: "bg-orange-50",  accent: "text-orange-600" },
  ];

  const filtered = useMemo(() => {
    const searched = deliveries.filter((d) => {
      const user = d.checkout?.user;
      const name = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.toLowerCase();
      const checkoutId = String(d.checkout?.checkout_id ?? d.checkout_id ?? "").toLowerCase();
      const productName = (d.checkout?.items?.[0]?.product?.product_name ?? "").toLowerCase();
      return (
        name.includes(searchTerm.toLowerCase()) ||
        checkoutId.includes(searchTerm.toLowerCase()) ||
        productName.includes(searchTerm.toLowerCase())
      );
    });

    return [...searched].sort((a, b) => {
      switch (sortBy) {
        case "id_desc":   return (b.checkout?.checkout_id ?? 0) - (a.checkout?.checkout_id ?? 0);
        case "id_asc":    return (a.checkout?.checkout_id ?? 0) - (b.checkout?.checkout_id ?? 0);
        case "name_asc": {
          const na = `${a.checkout?.user?.first_name ?? ""} ${a.checkout?.user?.last_name ?? ""}`.toLowerCase();
          const nb = `${b.checkout?.user?.first_name ?? ""} ${b.checkout?.user?.last_name ?? ""}`.toLowerCase();
          return na.localeCompare(nb);
        }
        case "name_desc": {
          const na = `${a.checkout?.user?.first_name ?? ""} ${a.checkout?.user?.last_name ?? ""}`.toLowerCase();
          const nb = `${b.checkout?.user?.first_name ?? ""} ${b.checkout?.user?.last_name ?? ""}`.toLowerCase();
          return nb.localeCompare(na);
        }
        case "amount_desc": return Number(b.checkout?.paid_amount ?? 0) - Number(a.checkout?.paid_amount ?? 0);
        case "amount_asc":  return Number(a.checkout?.paid_amount ?? 0) - Number(b.checkout?.paid_amount ?? 0);
        default: return 0;
      }
    });
  }, [deliveries, searchTerm, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    return Array.from({ length: 5 }, (_, i) => start + i);
  }, [totalPages, currentPage]);

  const isAllPageSelected  = paginated.length > 0 && paginated.every((d) => selectedIds.has(d.delivery_id));
  const isSomePageSelected = paginated.some((d) => selectedIds.has(d.delivery_id));

  const toggleAll = () => {
    if (isAllPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((d) => next.delete(d.delivery_id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((d) => next.add(d.delivery_id));
        return next;
      });
    }
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      {modalTarget && (
        <StatusModal delivery={modalTarget} onClose={() => setModalTarget(null)} onUpdated={handleUpdated} />
      )}
      {viewTarget && (
        <ViewOrderModal delivery={viewTarget} onClose={() => setViewTarget(null)} />
      )}

      <div className="flex min-h-screen bg-[#F0F7F2] font-sans">
        <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 min-w-0 px-5 py-6 overflow-x-hidden">

          {/* Top bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden bg-transparent border-none text-[22px] cursor-pointer text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100"
                onClick={() => setSidebarOpen(true)}
              >☰</button>
              <div>
                <h1 className="m-0 text-xl font-bold text-gray-900">Orders</h1>
                <p className="text-xs text-gray-500 mt-0.5 mb-0">Manage deliveries and order statuses</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ExportMenu selectedIds={selectedIds} deliveries={deliveries} onExportDone={handleExportDone} />
              <button
                onClick={fetchDeliveries}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-xs font-medium cursor-pointer hover:bg-gray-50 transition-colors"
              >↻ Refresh</button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-3 lg:grid-cols-6">
            {summaryStats.map((s) => (
              <div key={s.label} className="bg-white rounded-xl px-4 py-3.5 flex items-center justify-between shadow-sm">
                <div>
                  <div className={`text-lg font-bold ${s.accent}`}>{s.value}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{s.label}</div>
                </div>
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center text-base`}>{s.icon}</div>
              </div>
            ))}
          </div>

          {/* Selected bar */}
          {selectedIds.size > 0 && (
            <div className="mb-3 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-xs">
              <span className="font-semibold text-green-700">
                {selectedIds.size} order{selectedIds.size > 1 ? "s" : ""} selected
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="font-medium text-green-600 bg-transparent border-none cursor-pointer hover:text-green-800"
              >Clear selection</button>
            </div>
          )}

          {/* Table Card */}
          <div className="overflow-hidden bg-white shadow-sm rounded-2xl">

            {/* Search & Filter */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-nowrap">
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 flex-1 min-w-0">
                <span className="text-sm text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search by name, order ID, product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs text-gray-700 placeholder-gray-400 bg-transparent border-none outline-none"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="border border-gray-200 rounded-lg px-3.5 py-2 bg-gray-50 text-sm text-gray-700 cursor-pointer outline-none shrink-0"
              >
                <option value="All">All Status</option>
                <option value="processing">Processing</option>
                <option value="ready">Ready</option>
                <option value="on_the_way">On the way</option>
                <option value="delivered">Delivered</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-200 rounded-lg px-3.5 py-2 bg-gray-50 text-sm text-gray-700 cursor-pointer outline-none shrink-0"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button
                onClick={() => { setSearchTerm(""); setStatusFilter("All"); setSortBy("id_desc"); setCurrentPage(1); }}
                className="border border-gray-200 rounded-lg px-3.5 py-2 bg-white text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors shrink-0"
              >✕ Clear</button>
            </div>

            {loading && (
              <div className="py-12 text-sm text-center text-gray-400">Loading orders…</div>
            )}

            {error && !loading && (
              <div className="flex items-center gap-2 px-4 py-3 m-4 text-xs text-red-600 border border-red-300 rounded-lg bg-red-50">
                ⚠️ {error}
                <button
                  onClick={fetchDeliveries}
                  className="ml-2 px-2.5 py-0.5 rounded-md border border-red-300 bg-white text-red-600 text-xs cursor-pointer hover:bg-red-50"
                >Retry</button>
              </div>
            )}

            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-3.5 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={isAllPageSelected}
                          ref={(el) => { if (el) el.indeterminate = !isAllPageSelected && isSomePageSelected; }}
                          onChange={toggleAll}
                          className="cursor-pointer w-3.5 h-3.5 accent-green-600"
                        />
                      </th>
                      {["Order ID", "Product", "Client", "Contact", "Payment", "Shipping Fee", "Total Paid", "Status", "Date", "Action"].map((h) => (
                        <th
                          key={h}
                          className="px-3.5 py-3 text-left font-semibold text-gray-700 whitespace-nowrap text-[11px] uppercase tracking-wide"
                        >{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((d, index) => {
                      const user     = d.checkout?.user;
                      const checkout = d.checkout;
                      const cfg      = getStatusCfg(d.status);
                      const isSelected = selectedIds.has(d.delivery_id);
                      const isExported = exportedIds.has(String(d.delivery_id));
                      return (
                        <tr
                          key={d.delivery_id}
                          className={`border-b border-gray-100 transition-colors ${
                            isSelected
                              ? "bg-green-50"
                              : index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                          }`}
                        >
                          <td className="px-3.5 py-3.5 w-10">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleOne(d.delivery_id)}
                              className="cursor-pointer w-3.5 h-3.5 accent-green-600"
                            />
                          </td>
                          <td className="px-3.5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-blue-600">#{checkout?.checkout_id ?? "—"}</span>
                              {isExported && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 whitespace-nowrap">
                                  ✓ Exported
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3.5 py-3.5">
                            <ProductCell checkout={checkout} />
                          </td>
                          <td className="px-3.5 py-3.5 text-gray-900 whitespace-nowrap">
                            {user ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() : "—"}
                          </td>
                          <td className="px-3.5 py-3.5 text-gray-500 leading-relaxed">
                            <div>{user?.email ?? "—"}</div>
                            <div>{user?.phone_number ?? ""}</div>
                            {user?.company_name && (
                              <div className="text-[11px] text-blue-600 font-medium">🏢 {user.company_name}</div>
                            )}
                            {user?.tin_number && (
                              <div className="text-[11px] text-gray-400">TIN: {user.tin_number}</div>
                            )}
                          </td>
                          <td className="px-3.5 py-3.5 text-gray-700 whitespace-nowrap capitalize">
                            {checkout?.payment_method ?? "—"}
                          </td>
                          <td className="px-3.5 py-3.5 text-gray-700 whitespace-nowrap">
                            ₱{fmt(checkout?.shipping_fee)}
                          </td>
                          <td className="px-3.5 py-3.5 text-gray-900 font-semibold whitespace-nowrap">
                            ₱{fmt(checkout?.paid_amount)}
                          </td>
                          <td className="px-3.5 py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-block whitespace-nowrap ${cfg.badge}`}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-3.5 py-3.5 text-gray-500 whitespace-nowrap">
                            {fmtDate(checkout?.created_at)}
                          </td>
                          <td className="px-3.5 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setViewTarget(d)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-200 bg-white text-gray-600 text-[11px] font-medium cursor-pointer whitespace-nowrap hover:bg-gray-50 transition-colors"
                              >👁 View</button>
                              <button
                                onClick={() => setModalTarget(d)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 text-[11px] font-medium cursor-pointer whitespace-nowrap hover:bg-gray-50 transition-colors"
                              >✏️ Update</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {paginated.length === 0 && (
                      <tr>
                        <td colSpan={11} className="py-10 text-xs text-center text-gray-400">
                          No orders found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && (
              <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>
                  Showing {paginated.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} orders
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="text-xs font-medium text-gray-700 transition-colors bg-white border border-gray-200 rounded-md cursor-pointer w-7 h-7 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >‹</button>
                  {pageNumbers.map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-7 h-7 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                        p === currentPage
                          ? "bg-blue-600 text-white border-none"
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                      }`}
                    >{p}</button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="text-xs font-medium text-gray-700 transition-colors bg-white border border-gray-200 rounded-md cursor-pointer w-7 h-7 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >›</button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}