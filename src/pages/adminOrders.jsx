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
async function exportOrderToExcel(delivery) {
  const XLSX = await loadXLSX().catch(() => null);
  if (!XLSX) { alert("XLSX library could not be loaded. Check your internet connection."); return; }

  const checkout = delivery.checkout;
  const user = checkout?.user ?? {};
  const items = checkout?.items ?? [];
  const addr = checkout?.delivery_address ?? {};
  const orderId = checkout?.checkout_id ?? delivery.delivery_id;
  const paid = Number(checkout?.paid_amount ?? 0);
  const grandTotal = paid;

  const wb = XLSX.utils.book_new();
  const ws = {};
  const merges = [];

  const C = (r, c) => XLSX.utils.encode_cell({ r, c });

  const setCell = (r, c, v, s, numFmt, f) => {
    const ref = C(r, c);
    const t = f ? "n" : (typeof v === "number" ? "n" : v instanceof Date ? "d" : "s");
    ws[ref] = { t, s: s || {} };
    if (f)   { ws[ref].f = f; }
    else if (v !== null && v !== undefined) { ws[ref].v = v; }
    if (numFmt) { ws[ref].z = numFmt; }
  };

  const merge = (r1, c1, r2, c2) => merges.push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });

  // ── Borders ──
  const T  = { style: "thin",   color: { rgb: "000000" } };
  const bAll = { top: T, bottom: T, left: T, right: T };
  const bLR  = { left: T, right: T };
  const bTLR = { top: T, left: T, right: T };
  const bBLR = { bottom: T, left: T, right: T };
  const bTB  = { top: T, bottom: T };
  const bR   = { right: T };
  const bBR  = { bottom: T, right: T };
  const bTR  = { top: T, right: T };
  const bTBonly = { top: T, bottom: T };

  // ── Fills ──
  const cyanFill  = { fgColor: { rgb: "AFF0FF" }, patternType: "solid" };
  const blackFill = { fgColor: { rgb: "000000" }, patternType: "solid" };
  const tealFill  = { fgColor: { rgb: "5A9EA0" }, patternType: "solid" };

  // ── Fonts ──
  const CL = (sz, bold = false, color = "000000") => ({
    name: "Calibri Light", sz, bold, color: { rgb: color },
  });

  // ── Alignment ──
  const AL = (h, v = "center", wrap = false) => ({ horizontal: h, vertical: v, wrapText: wrap });

  const MFMT = "#,##0.00";
  const DFMT = "d-mmm-yy";

  // ── Derived values ──
  const vatBase = grandTotal / 1.12;
  const fullAddr = [addr.street, addr.barangay, addr.city, addr.province, addr.zip].filter(Boolean).join(", ");
  const dateVal  = checkout?.created_at ? new Date(checkout.created_at) : new Date();
  const paymentMethod = (checkout?.payment_method ?? "COD").replace(/_/g, " ").toUpperCase();

  // ════════════════════════════════════════════════════════════════════════
  // ROWS 0–3: Empty spacers (matching original template's top blank rows)
  // ════════════════════════════════════════════════════════════════════════
  // (left blank)

  // ════════════════════════════════════════════════════════════════════════
  // ROWS 4–6: QUOTATION header
  //   A4:G6 merged → "QUOTATION"
  //   H4:K6 merged → "# orderId" (white text, black background)
  // ════════════════════════════════════════════════════════════════════════
  setCell(4, 0, "QUOTATION", {
    font: CL(26, true),
    alignment: AL("center", "center"),
    border: bAll,
  });
  merge(4, 0, 6, 6);

  setCell(4, 7, `# ${orderId}`, {
    font: CL(13, false, "FFFFFF"),
    fill: blackFill,
    alignment: AL("center", "center"),
    border: bAll,
  });
  merge(4, 7, 6, 10);

  // ════════════════════════════════════════════════════════════════════════
  // ROW 7: Spacer
  // ════════════════════════════════════════════════════════════════════════
  setCell(7, 0, "", { font: CL(6) });
  merge(7, 0, 7, 10);

  // ════════════════════════════════════════════════════════════════════════
  // ROWS 8–11: Client info
  //   A:B merged = label | C:I merged = value | J = label | K = value
  // ════════════════════════════════════════════════════════════════════════
  const lblSt = (wrap = false) => ({
    font: CL(9, true),
    alignment: AL("left", "center", wrap),
    border: bAll,
  });
  const valSt = (wrap = false) => ({
    font: CL(9, false),
    alignment: AL("center", "center", wrap),
    border: bAll,
  });

  // Row 8: Client Name / Date
  setCell(8, 0, "Client Name:", lblSt()); merge(8, 0, 8, 1);
  setCell(8, 2, `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim(), valSt()); merge(8, 2, 8, 8);
  setCell(8, 9, "Date:", lblSt());
  setCell(8, 10, dateVal, { font: CL(9), alignment: AL("center", "center"), border: bAll }, DFMT);

  // Row 9: Company Name / Deliver
  setCell(9, 0, "Company Name:", lblSt()); merge(9, 0, 9, 1);
  setCell(9, 2, user.company_name ?? "", valSt()); merge(9, 2, 9, 8);
  setCell(9, 9, "Deliver:", lblSt());
  setCell(9, 10, "5 to 7 Days", valSt());

  // Row 10: Contact Details / Validity
  setCell(10, 0, "Contact Details:", lblSt()); merge(10, 0, 10, 1);
  setCell(10, 2, [user.email, user.phone_number].filter(Boolean).join(" | "), valSt()); merge(10, 2, 10, 8);
  setCell(10, 9, "Validity:", lblSt());
  setCell(10, 10, "15 Days", valSt());

  // Row 11: Address / Payment & Terms
  setCell(11, 0, "Address:", lblSt()); merge(11, 0, 11, 1);
  setCell(11, 2, fullAddr, valSt(true)); merge(11, 2, 11, 8);
  setCell(11, 9, "Payment & Terms", { font: CL(9, true), alignment: AL("left", "center", true), border: bAll });
  setCell(11, 10, paymentMethod, valSt());

  // ════════════════════════════════════════════════════════════════════════
  // ROW 12: Spacer
  // ════════════════════════════════════════════════════════════════════════
  setCell(12, 0, "", { font: CL(6) });
  merge(12, 0, 12, 10);

  // ════════════════════════════════════════════════════════════════════════
  // ROW 13: Table header
  //   A | B:F merged | G | H | I | J | K
  // ════════════════════════════════════════════════════════════════════════
  const thSt = { font: CL(10, true), alignment: AL("center", "center", true), border: bAll };
  setCell(13, 0,  "Item\nNo.",          thSt);
  setCell(13, 1,  "Item Description",   thSt); merge(13, 1, 13, 5);
  setCell(13, 6,  "Size / Color",       thSt);
  setCell(13, 7,  "Qty",                thSt);
  setCell(13, 8,  "Unit",               thSt);
  setCell(13, 9,  "Unit Price\n(PHP)",  { ...thSt }, MFMT);
  setCell(13, 10, "Amount\n(PHP)",      { ...thSt }, MFMT);

  // ════════════════════════════════════════════════════════════════════════
  // ITEM ROWS (starting at row index 14)
  // ════════════════════════════════════════════════════════════════════════
  const itemCount = items.length;
  for (let i = 0; i < itemCount; i++) {
    const item    = items[i];
    const product = item?.product ?? {};
    const ri      = 14 + i;
    const exRow   = ri + 1; // 1-indexed Excel row
    const qty     = Number(item.quantity ?? 1);
    const price   = Number(item.price ?? product.price ?? 0);

    setCell(ri, 0, String(i + 1).padStart(2, "0"),
      { font: CL(10), alignment: AL("center", "center"), border: bAll });

    setCell(ri, 1, product.product_name ?? item.name ?? "",
      { font: CL(10), alignment: AL("left", "center", true), border: bAll });
    for (let c = 2; c <= 5; c++) setCell(ri, c, "", { font: CL(10), border: bAll });
    merge(ri, 1, ri, 5);

    setCell(ri, 6, product.size ?? product.variant ?? product.color ?? "",
      { font: CL(10), alignment: AL("center", "center"), border: bAll });

    setCell(ri, 7, qty,
      { font: CL(10), alignment: AL("center", "center"), border: bAll });

    setCell(ri, 8, product.unit ?? "pc",
      { font: CL(10), alignment: AL("center", "center"), border: bAll });

    setCell(ri, 9, price,
      { font: CL(10), alignment: AL("right", "center"), border: bAll }, MFMT);

    // Amount = UnitPrice × Qty  (formula: =J15*H15)
    setCell(ri, 10, null,
      { font: CL(10), alignment: AL("right", "center"), border: bAll }, MFMT,
      `J${exRow}*H${exRow}`);
  }

  // ════════════════════════════════════════════════════════════════════════
  // NOTHING FOLLOWS ROW
  // ════════════════════════════════════════════════════════════════════════
  const nfRow = 14 + itemCount;
  setCell(nfRow, 0, "", { font: CL(10), border: bAll });
  setCell(nfRow, 1, "***Nothing Follows***", {
    font: CL(10, true, "FF0000"),
    alignment: AL("center", "center"),
    border: bAll,
  });
  merge(nfRow, 1, nfRow, 5);
  setCell(nfRow, 6,  "", { font: CL(10), alignment: AL("center"),           border: bAll });
  setCell(nfRow, 7,  "", { font: CL(10), alignment: AL("center", "center"), border: bAll });
  setCell(nfRow, 8,  "", { font: CL(10), alignment: AL("center", "center"), border: bAll });
  setCell(nfRow, 9,  "", { font: CL(10), border: bAll }, MFMT);
  setCell(nfRow, 10, "", { font: CL(10), border: bAll }, MFMT);

  // ════════════════════════════════════════════════════════════════════════
  // TOTALS SECTION
  // Pattern: A = cyan fill + label (right-aligned), B:J = thin borders only (inside merge),
  //          K = cyan fill + value (right-aligned)
  // Order: Subtotal | VAT | blank spacer | Total Amount
  // ════════════════════════════════════════════════════════════════════════
  const sRow  = nfRow + 1; // Subtotal
  const vRow  = nfRow + 2; // VAT
  const blRow = nfRow + 3; // blank spacer
  const tRow  = nfRow + 4; // Total Amount

  // Excel row numbers (1-indexed) for formulas
  const exTRow      = tRow  + 1;
  const exSRow      = sRow  + 1;
  const exFirstItem = 15;               // first item row
  const exLastItem  = 14 + itemCount;  // last item row

  const writeTotRow = (r, label, kFormula, kValue) => {
    // A: cyan fill, label right-aligned
    setCell(r, 0, label, {
      font: CL(10, true),
      fill: cyanFill,
      alignment: AL("right", "center"),
      border: bAll,
    });
    // B:J: no fill, top+bottom borders only (inside the A:J merge)
    for (let c = 1; c <= 9; c++) {
      setCell(r, c, "", { font: CL(10), border: bTBonly });
    }
    merge(r, 0, r, 9);
    // K: cyan fill, value
    if (kFormula) {
      setCell(r, 10, null, {
        font: CL(10, true),
        fill: cyanFill,
        alignment: AL("right", "center"),
        border: bAll,
      }, MFMT, kFormula);
    } else {
      setCell(r, 10, kValue ?? null, {
        font: CL(10, true),
        fill: cyanFill,
        border: bAll,
      }, MFMT);
    }
  };

  writeTotRow(sRow,  "Subtotal:",     `K${exTRow}/1.12`);
  writeTotRow(vRow,  "VAT:",          `K${exTRow}-K${exSRow}`);
  writeTotRow(blRow, "",              null, null);
  writeTotRow(tRow,  "Total Amount:", `SUM(K${exFirstItem}:K${exLastItem})`);

  // ════════════════════════════════════════════════════════════════════════
  // DISCLAIMER BLOCK
  // Row 0 (dRow): "Disclaimer:" label — A:K merged, top+left+right borders
  // Row 1–3 (dRow+1 to dRow+3): disc text 1 — A:K merged, left+right borders
  // Row 4–5 (dRow+4 to dRow+5): disc text 2 — A:K merged, all borders
  // ════════════════════════════════════════════════════════════════════════
  const dRow = tRow + 1;

  const disc1 = "* Cancellations will be considered only if the request is made within 24 hours of placing the order. However, the cancellation request will not be entertained if the orders have been communicated to the manufacturing plant and have initiated the process of processing/shipping the items.  Deposits are non-refundable and client will be charged for the irreversible fees incurred once  item/s has already been processed/shipped;";
  const disc2 = "*JEM8 CIRCLE TRADING CO. will not be held liable for the delays due to holidays, transportation and labor strikes, typhoons, floods, earthquakes, fire, volcanic eruptions, acts of God, and the like.";

  // Disclaimer label row
  setCell(dRow, 0, "Disclaimer:", { font: CL(9, true), alignment: AL("left", "center"), border: bTLR });
  for (let c = 1; c <= 9; c++) setCell(dRow, c, "", { border: { top: T } });
  setCell(dRow, 10, "", { border: bTR });
  merge(dRow, 0, dRow, 10);

  // Disc text 1 (spans 3 rows)
  setCell(dRow + 1, 0, disc1, { font: CL(8), alignment: AL("left", "top", true), border: bLR });
  setCell(dRow + 1, 10, "", { border: bR });
  merge(dRow + 1, 0, dRow + 3, 10);

  // Disc text 2 (spans 2 rows)
  setCell(dRow + 4, 0, disc2, { font: CL(8), alignment: AL("left", "top", true), border: bAll });
  setCell(dRow + 4, 10, "", { border: bBR });
  merge(dRow + 4, 0, dRow + 5, 10);

  // Bottom border on final disclaimer row
  for (let c = 0; c <= 10; c++) {
    const ref = C(dRow + 5, c);
    if (!ws[ref]) ws[ref] = { t: "s", v: "", s: {} };
    ws[ref].s = { ...ws[ref].s, border: { ...(ws[ref].s.border || {}), bottom: T } };
  }

  // ════════════════════════════════════════════════════════════════════════
  // SIGNATURE BLOCK
  // Row sig0: Headers — Prepared By (A:C) | Approved By: (D:G) | Client Signature (H:J) | Reference No. (K)
  // Row sig1: Space   — A:C top+sides | D:G top+sides | H:J space | K merged sig1:sig3
  // Row sig2: Names   — A:C sides | D:G sides | H:J sides
  // Row sig3: Roles   — A:C bottom+sides | D:G bottom+sides | H:J bottom+sides
  // ════════════════════════════════════════════════════════════════════════
  const sig0 = dRow + 6;
  const sig1 = dRow + 7;
  const sig2 = dRow + 8;
  const sig3 = dRow + 9;

  // Row sig0: Header labels
  setCell(sig0, 0, "Prepared By",      { font: CL(10, true), alignment: AL("center", "center", true), border: bAll });
  for (let c = 1; c <= 2; c++) setCell(sig0, c, "", { border: bTB });
  merge(sig0, 0, sig0, 2);

  setCell(sig0, 3, "Approved By:",     { font: CL(10, true), alignment: AL("center", "center", true), border: bAll });
  for (let c = 4; c <= 6; c++) setCell(sig0, c, "", { border: bTB });
  merge(sig0, 3, sig0, 6);

  setCell(sig0, 7, "Client Signature", { font: CL(10, true), alignment: AL("center", "center", true), border: bAll });
  for (let c = 8; c <= 9; c++) setCell(sig0, c, "", { border: bTB });
  merge(sig0, 7, sig0, 9);

  setCell(sig0, 10, "Reference No.",   { font: CL(10, true), alignment: AL("center", "center", true), border: bAll });

  // Row sig1: Signature space
  setCell(sig1, 0, "", { font: CL(10), border: bTLR });
  for (let c = 1; c <= 2; c++) setCell(sig1, c, "", { border: { top: T } });
  merge(sig1, 0, sig1, 2);

  setCell(sig1, 3, "", { font: CL(10), border: bTLR });
  for (let c = 4; c <= 6; c++) setCell(sig1, c, "", { border: { top: T } });
  merge(sig1, 3, sig1, 6);

  setCell(sig1, 7, "", { font: CL(10), border: { bottom: T, left: T } });
  for (let c = 8; c <= 9; c++) setCell(sig1, c, "", { border: { bottom: T } });
  merge(sig1, 7, sig1, 9);

  // K sig1:sig3 merged as one block
  setCell(sig1, 10, "", { font: CL(18, true), alignment: AL("center", "center", true), border: bAll });
  merge(sig1, 10, sig3, 10);

  // Row sig2: Names
  setCell(sig2, 0, "Shella Ricafrente", { font: CL(10, true), alignment: AL("center", "center", true), border: bLR });
  for (let c = 1; c <= 2; c++) setCell(sig2, c, "", { border: bLR });
  merge(sig2, 0, sig2, 2);

  setCell(sig2, 3, "VAR", { font: CL(10, true), alignment: AL("center", "center", true), border: bLR });
  for (let c = 4; c <= 6; c++) setCell(sig2, c, "", { border: bLR });
  merge(sig2, 3, sig2, 6);

  setCell(sig2, 7, "", { font: CL(10), border: { left: T } });
  for (let c = 8; c <= 9; c++) setCell(sig2, c, "", { border: bR });
  merge(sig2, 7, sig2, 9);

  // Row sig3: Roles
  setCell(sig3, 0, "Sales Executive",    { font: CL(10), alignment: AL("center"), border: bBLR });
  for (let c = 1; c <= 2; c++) setCell(sig3, c, "", { border: { bottom: T } });
  merge(sig3, 0, sig3, 2);

  setCell(sig3, 3, "Purchasing Officer", { font: CL(10), alignment: AL("center"), border: bBLR });
  for (let c = 4; c <= 6; c++) setCell(sig3, c, "", { border: { bottom: T } });
  merge(sig3, 3, sig3, 6);

  setCell(sig3, 7, "", { font: CL(10), border: { bottom: T, left: T } });
  for (let c = 8; c <= 8; c++) setCell(sig3, c, "", { border: { bottom: T } });
  setCell(sig3, 9, "", { border: { bottom: T, right: T } });
  merge(sig3, 7, sig3, 9);

  // ════════════════════════════════════════════════════════════════════════
  // WORKSHEET SETTINGS
  // ════════════════════════════════════════════════════════════════════════
  const lastRow = sig3;
  ws["!ref"]    = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: lastRow, c: 10 });
  ws["!merges"] = merges;

  // Column widths — matching original file (A–K, 11 columns)
  ws["!cols"] = [
    { wch: 5.14  }, // A — Item No.
    { wch: 8.86  }, // B
    { wch: 6.86  }, // C
    { wch: 5.86  }, // D
    { wch: 4.14  }, // E
    { wch: 10.71 }, // F — (B:F merged for Item Description)
    { wch: 9.71  }, // G — Size / Color
    { wch: 5.71  }, // H — Qty
    { wch: 5.71  }, // I — Unit
    { wch: 8.71  }, // J — Unit Price
    { wch: 11.71 }, // K — Amount
  ];

  // Row heights — matching original
  ws["!rows"] = [];
  ws["!rows"][4]  = { hpt: 40 };   // QUOTATION title
  ws["!rows"][5]  = { hpt: 20 };
  ws["!rows"][6]  = { hpt: 20 };
  ws["!rows"][7]  = { hpt: 6  };   // spacer
  ws["!rows"][11] = { hpt: 25 };   // Address row (taller for wrap)
  ws["!rows"][12] = { hpt: 6  };   // spacer
  ws["!rows"][13] = { hpt: 38 };   // Table header
  for (let i = 0; i < itemCount; i++) ws["!rows"][14 + i] = { hpt: 16 };
  ws["!rows"][nfRow]      = { hpt: 16 };
  ws["!rows"][sRow]       = { hpt: 16 };
  ws["!rows"][vRow]       = { hpt: 16 };
  ws["!rows"][blRow]      = { hpt: 10 };
  ws["!rows"][tRow]       = { hpt: 18 };
  ws["!rows"][dRow]       = { hpt: 14 };
  ws["!rows"][dRow + 1]   = { hpt: 42 };  // disc1 (tall for wrap)
  ws["!rows"][dRow + 4]   = { hpt: 28 };  // disc2
  ws["!rows"][sig0]       = { hpt: 16 };
  ws["!rows"][sig1]       = { hpt: 30 };  // signature space
  ws["!rows"][sig2]       = { hpt: 16 };
  ws["!rows"][sig3]       = { hpt: 14 };

  ws["!pageSetup"] = { orientation: "portrait", paperSize: 9 };
  ws["!printArea"] = `A1:K${lastRow + 1}`;

  XLSX.utils.book_append_sheet(wb, ws, `Order #${orderId}`);
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