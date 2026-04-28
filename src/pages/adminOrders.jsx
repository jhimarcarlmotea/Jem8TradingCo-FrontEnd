import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import axios from "axios";
import AdminNav from "../components/AdminNav";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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

// Resolve a readable address string from various API shapes
function resolveCheckoutAddress(checkout) {
  if (!checkout) return "";

  // Prefer explicit formatted field if present
  if (checkout.delivery_address_formatted && String(checkout.delivery_address_formatted).trim())
    return String(checkout.delivery_address_formatted).trim();

  // If nested object exists
  const da = checkout.delivery_address;
  if (da) {
    if (typeof da === "string" && da.trim()) return da.trim();
    if (typeof da === "object") {
      if (da.formatted && String(da.formatted).trim()) return String(da.formatted).trim();
      const parts = [da.street, da.barangay, da.city, da.province, da.zip, da.country].filter(Boolean);
      if (parts.length) return parts.join(", ");
    }
  }

  // Fall back to flat fields on checkout
  const parts2 = [
    checkout.delivery_street,
    checkout.delivery_barangay,
    checkout.delivery_city,
    checkout.delivery_province,
    checkout.delivery_zip,
    checkout.delivery_country,
  ].filter(Boolean);
  if (parts2.length) return parts2.join(", ");

  return "";
}

function ViewOrderModal({ delivery, onClose }) {
  const checkout = delivery.checkout;
  const user = checkout?.user;
  const items = checkout?.items ?? [];
  const status = (delivery.status ?? "processing").toLowerCase();
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.processing;
  const trackerIdx = STATUS_TO_TRACKER[status] ?? 0;
  const fullAddress = resolveCheckoutAddress(checkout);
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
              {fullAddress ? (
                <div className="mt-1 text-xs text-gray-500">{fullAddress}</div>
              ) : null}
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
  const fullAddr = resolveCheckoutAddress(checkout);
  const orderId = checkout?.checkout_id ?? delivery.delivery_id;
  const paid = Number(checkout?.paid_amount ?? 0);
  const shipping = Number(checkout?.shipping_fee ?? 0);
  const grandTotal = paid; // paid_amount is the total
  const vatBase = grandTotal / 1.12;
  const vat = grandTotal - vatBase;
  // fullAddr handled by resolveCheckoutAddress to support multiple API shapes
  const dateStr = checkout?.created_at
    ? new Date(checkout.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
    : new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  const paymentMethod = (checkout?.payment_method ?? "COD").replace(/_/g, " ").toUpperCase();

  // Render up to ITEM_MAX item rows. Leave empty rows after Nothing Follows
  const itemCount = items.length;

  const itemRowsArr = [];
  for (let i = 0; i < itemCount; i++) {
    const item = items[i];
    const product = item.product ?? {};
    const qty = Number(item.quantity ?? 1);
    const price = Number(item.price ?? product.price ?? 0);
    const amount = price * qty;
    itemRowsArr.push(`
      <tr>
        <td style="text-align:center;padding:5px 4px;">${String(i + 1).padStart(2, "0")}</td>
        <td style="padding:5px 6px;">${product.product_name ?? "Product"}</td>
        <td style="text-align:center;padding:5px 4px;">${product.size ?? product.variant ?? product.color ?? ""}</td>
        <td style="text-align:center;padding:5px 4px;">${qty}</td>
        <td style="text-align:center;padding:5px 4px;">${product.unit ?? "pc"}</td>
        <td style="text-align:right;padding:5px 6px;">${fmt(price)}</td>
        <td style="text-align:right;padding:5px 6px;">${fmt(amount)}</td>
      </tr>`);
  }
  const itemRows = itemRowsArr.join("");
  const nfRowHtml = `\n      <tr class="nothing-follows">\n        <td colspan="7" style="border-top:2px solid #333;padding:8px 0;text-align:center;font-weight:bold;">***Nothing Follows***</td>\n      </tr>`;
  // Note: removed padded blank rows — show only actual items then "Nothing Follows"

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
    border: 1.5px solid #333;
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
      <div class="info-val"></div>
    </div>
    <div class="info-row">
      <div class="info-label">Deliver:</div>
      <div class="info-val"></div>
    </div>
    <div class="info-row">
      <div class="info-label">Validity:</div>
      <div class="info-val"></div>
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
      ${itemRows}${nfRowHtml}
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
    <td class="sig-space">&nbsp;</td>
    <td class="sig-space">&nbsp;</td>
    <td class="sig-space">&nbsp;</td>
    <td class="sig-space" rowspan="3">&nbsp;</td>
  </tr>
  <tr>
    <td>&nbsp;</td>
    <td>&nbsp;</td>
    <td>&nbsp;</td>
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
  const orderId = checkout?.checkout_id ?? delivery.delivery_id;
  const paid = Number(checkout?.paid_amount ?? 0);
  const grandTotal = paid;
  const fullAddr = resolveCheckoutAddress(checkout);
  const paymentMethod = (checkout?.payment_method ?? "COD").replace(/_/g, " ").toUpperCase();
 
  // ── Load template ──
  const TEMPLATE_B64 = "UEsDBBQAAAAIADxGl1xGx01IlQAAAM0AAAAQAAAAZG9jUHJvcHMvYXBwLnhtbE3PTQvCMAwG4L9SdreZih6kDkQ9ip68zy51hbYpbYT67+0EP255ecgboi6JIia2mEXxLuRtMzLHDUDWI/o+y8qhiqHke64x3YGMsRoPpB8eA8OibdeAhTEMOMzit7Dp1C5GZ3XPlkJ3sjpRJsPiWDQ6sScfq9wcChDneiU+ixNLOZcrBf+LU8sVU57mym/8ZAW/B7oXUEsDBBQAAAAIADxGl1wbZrDyMAEAAJsCAAARAAAAZG9jUHJvcHMvY29yZS54bWzFktFPwjAQxv8Vsvdx7QaozViCGB8MIMElGt+a7oDGdWvamsF/bzfZAPXdx/vuu999l1wiNBOVwbWpNBon0Q4OqigtE3oa7J3TDMCKPSpuh95R+ua2Moo7X5odaC4++A4hImQCCh3PuePQAEPdE4M0yQUTBrmrzAmfix6vP03RwnIBWKDC0lmgQwpBOttsnler2SIjNIEzo+E5NMp+C5j30Fb9k9x2IDg5D1b2rrquh3Xc+vwZFN6Wi5f24lCW1vFSoJ+ykrmjxmnQbX6N5w/ZY5BGJKIhJSGhGRmx8R0bx+9N1qt858CqyuVW/nfiSUhGYRRn5JaNfOLJReIuYJr4zyi4dcuTcH9Mn/ZScTOYc1MMlpVDnsBvUze3NrJsTr9cd8OiiJFm3Q9TK1z/YfoFUEsDBBQAAAAIADxGl1yLgm5Y7AUAAI4aAAATAAAAeGwvdGhlbWUvdGhlbWUxLnhtbO1ZW4sbNxR+L/Q/iHl35j62l3iDPbaTNrtJyG5S8iiPZY9izciM5N01IVCSx0KhNC19KfStD6VtIIG+pL9m25Q2hfyFajS+aGxNLs0GUhob7NHRd44+nXN0pJk5f+EkIeAIZQzTtGXY5ywDoDSiQ5yOW8aNw36tYQDGYTqEhKaoZcwRMy7sfvjBebjDY5QgIPRTtgNbRsz5dMc0WSTEkJ2jU5SKvhHNEshFMxubwwweC7sJMR3LCswE4tQAKUyE2aujEY4QOMxNGrtL4z0iflLOckFEsoNIjqhqSOxwYud/bM5CkoEjSFqGGGdIjw/RCTcAgYyLjpZhyY9h7p43V0qEV+gqen35WegtFIYTR+pl48FK0fN8L2iv7DuF/W1cr94LesHKngTAKBIztbewfqfZ6foLrAIqLjW2u/Wua5fwin13C9/2828J767x3ha+3w/XPlRAxaWv8UndCb0S3l/jgy183Wp3vXoJL0ExwelkC235gRsuZ7uCjCi5pIU3fa9fdxbwNcpUsqvQT3lVriXwNs36AiCDCzlOAZ9P0QhGAhdCggcZBnt4HIvEm8KUMiG2HKtvueI3/3rySnoE7iCoaBeiiG2Jcj6ARRme8pbxsbBqKJDnT358/uQReP7k4em9x6f3fjm9f//03s8axUswHauKz77/4u9vPwV/Pfru2YOv9Him4n//6bPffv1SD+Qq8OnXD/94/PDpN5//+cMDDbydwYEKP8QJYuAKOgbXaSLmphkADbLX0ziMIS5pwFggNcAej0vAK3NIdLgOKjvvZiaKhA54cXa7xPUgzmYca4CX46QE3KeUdGimnc7lfCx1OrN0rB88m6m46xAe6cYON0Lbm01FtmOdyTBGJZrXiIg2HKMUcZD30QlCGrVbGJf8uo+jjDI64uAWBh2ItS45xAOuV7qEExGXuY6gCHXJN/s3QYcSnfkuOiojxYKARGcSkZIbL8IZh4mWMUyIityDPNaRPJhnUcnhjItIjxGhoDdEjOl0rmbzEt3Lorjow75P5kkZmXE80SH3IKUqsksnYQyTqZYzTmMV+xGbiBSF4BrlWhK0vELytogDTCvDfRMj/nrL+oaoq/oEyXtmmW5JIFpej3Mygihd7AGlap7g9KWlfaOo+++Lur6otzOsXVqbpbwK9x8s4F04S68hsWbe1+/39fv/WL+r1vLZV+11oTbV07o0k1Qe3UeYkAM+J2iPyRLPxPSGfSGUDam0ulOYxuJyMVwJN86gvAYZ5Z9gHh/EcCqGseUIY7YwPWZgSpnYJIxK23KTmSX7dFhIbXt5cyoUIF/LxSazlIstiRfSoL6+C1uZl60xUwn40uirk1AGK5NwNSTq7quRsK2zYtHUsGjYL2JhKlER6w/A/LmG7xWMRL5BgoZ5nAr9ZXTPPNJVzixP29FMr+mdWaRLJJR0K5NQ0jCGQ7QpPuNYN5v6UDtaGvXG24i1uV0bSFpugWOx5lxfmIngtGWMxPFQXCZTYY/ldROScdoyIr5w9L+pLNOM8S5kcQGTXcX8E8xRBghORK6rYSDpmpvt1K13l1zTevc8Z24GGY1GKOIVknVT9BVGtL1vCM4bdCZIH8TDYzAgs+w6FI7y63buwCFmfOXNIc6U5F57caNcLZZi6aHZeolCMo3hYkdRi3kBl9crOso8JNPNWZk6Fw7G/bPYdV+utFE0KzaQemUVe3ubvMLK1bPytbWu2bBevEu8+YagUGvoqbl6alV7xxkeCJThggq/OZXRfMPdYDNrTeVcKVtbbyfo4LbI/K44rs4IZ8VjgBNxjxAunysXlUBKl9XlhINZhlvGHctve6HjhzWr4fdqnutZtYbfdmtt33ftnm9b3Y5zVziFx4ntF2P3xf0MmS9evkj51guYZHnMPhfRxKTyHGxKZfkCxnaqX8AALDxzJ3D6TbfZCWpNt92ved1Oo9YMg06tG4T1br8b+o1m/64BjiTYa7uhF/QatcAOw5oXWDn9RrNW9xyn7dXbjZ7XvrvwtZj58n/pXslr9x9QSwMEFAAAAAgAPEaXXJvjKQjgDQAAj1IAABgAAAB4bC93b3Jrc2hlZXRzL3NoZWV0MS54bWydnF1zozgWhv8KlYut3a7Z2Aj8AZNOVWy+3dOd6WRmr4ktt6nB4AGcTObXr4QlbCeH19m9SQwPOpLeI2ReAb55Kas/6g3njfHXNi/qz1ebptm5g0G93PBtWl+XO14Isi6rbdqIzerHoN5VPF21hbb5gA2H48E2zYqr25t23311e1Pumzwr+H1l1PvtNq1eZzwvXz5fmVd6x/fsx6aROwa3N7v0B3/gzW+7+0psDbooq2zLizorC6Pi689Xd6b7aI9lgfaI3zP+Up98Npr06YHnfNnwVVtTU+6+8HUz53kuC4+vjL/LcvuwTHP++Wo6Otn8KnuXv9n5IAN/SV9FX2R4EdIaXhlSr6ey/EPuikU9Q9nttlbZzlT8e+aHGr+YE9HbP9umy89d12TR08+6E0GrsdDsKa35vMz/k62ajWjUlbHi63SfN8d9zrU5dKzJqEPfy5eIK0nta1tWtizzuv1rvBwKjbpCy33dlFsVS+akeZWamKKqbVa0u7bpXyo7JxGm19PpeGJOUQwVgqkQ7E2I8cdDWCqE9SbE6OMhbBXCfhPCviiFCjBSAUZvApjD6/HYHo7Z5RBjFWL8JoRzOYLpqBgTFWPyToqLMXSIqQrhvMvpxRC2HhZDPS6Gb+Uw/4co3eh6O7ycj2bF1KPLfCuIyIuO8cTrJsjaOeZiPC2O+PD/NsnRIcbWtB1ug8MJ2J7aXtqktzdV+WJUsoioQn64k2FUmkU75Qw6WCo2U2wyfs/mgHmA+YAFgIWARYDFgCWALWg2EPp1IrJORNYfaAbYHDAPMB+wALAQsAiwGLAEsAXNzkS0OhEtICJgc8A8wHzAAsBCwCLAYsASwBY0OxPR7kS0gYiAzQHzAPMBCwALAYsAiwFLAFvQ7EzEUSfi6HAwG7YHZ4W8jnxoKsEzMZs2t7/+9u3x7jH+9vVm0IggcudRZVV4MiFUBswDzAcsACzUbEqorDtpEiqDmAlgC7q+M5XHncpjdTD1zTMGQxUwDzAfsACwULHpkBAR9CEGMRPAFnR9ZyJOOhEn6mAiizPNGCEiYB5gPmABYKFmFiEi6EMMYiaALej6zkScdiJO1alANG6mmLieei8iYB5gPmABYCFgEWAxYAlgC5qdieh0IjrqQnLaM2nO84wXjfE13XKXmjdVeel/3wmtmE0kyHOA0IAFgIWARYDFoA/JJX3E9TkpzOJQcETUd69iToj6fgXt/A7YA2CPdP/OBoQ5PFqLoeqy1Tckyu0uLV77x4SOQA4KDclR0ZWkhgWCAYIhghGCMepK0inVOzh4nj3zihwfPTqcZ+XE8JkXs1I06bIxPN6kWV7TiTFRYjQkvaGJEgNggGCIYIRgjLqSKGj3SPV7mmerrHml82J+IC/iu0sumDH72tH+/rAG9/m4ZtCtqrXxjhdQJsOjRi6nuvUuXfLPV7uK17x65le3d6uV+Fy7BplXhvLKUF4ZyiuAAYIhghGCMepKouCoJ6/36etWfln9I93ufjYeebWtyQyzswwTp9I377zcefKP3tdUJm9IXFXPNCQtBYIegj6CAYIhghGCMYIJgoseeC6ofTibbPPafn/ydForLzjsm2zjhm+Nr+U1eYJ8qLDH62WV7eR6PBFkroOQF44I+ggGHSRGfHix4Q/Z39wYGPMyLyui0dHFAL82r0S5+GK534qsIQomqiAqZtxX2ZIb/7yP7v9FnqA4xN223IuznCh+PqyOKwPmweE6PQGHJjlmlC0eEi5xriE9FgD0EQw6SI6FAxwRhivSBSkzBliiGVHfQjPiQu27ZsBjyNtm7Sk8Aif1GCeGkYkZo8SMUWIA9BEMOkgmZgwSMwaJ6WeJZmRixiAx48uJmajE2HC+neDUWGRqJig1E5QaAH0Egw6SqTnAEbHYEOmCZGr6WaIZmZoJSM3kcmqOqxvmFOtvk/pPkf5o4QNBH8Ggg6T+U6D/FOjfzxLNSP2nQP/pZf2dD50aDk7NiEyNg1ID7LuHoI9gYIKVjVBBOjUOSE0/SzQjU+NQqTm/NXdchWBDrPGY0lgVojVmwOd7CPoIBgysEIQKkhrrgpTGgCWaURprhjQ+jmNmYo0npMYm0hhYdg9BH8GAAbMfKkhrbAKN+1miGamxeVnjk3vMDGs8JTVWDtUibl7MGbDPHoI+ggEDxjtUkNaYAY37WaIZdR+gE4CYxjUD07i8JXDp0pNZODEOmRgLDX4LJQZAH8Ggg2RiLJAYCySmnyWakYPfujz47Q+Ib0PxzSEpvrKkjBQfmXMEfQSDDpLi20B8G4jfzxLNSPHty+KPPiA+dsMm6YbZCImP3DCCPoJBB0nxR0B84IYBSzQjxSfd8Ln4x0Veho2tSRpbhowtQ8YWQR/BgCFjqyCtMTC2gCUMGFtGGttzjY830Rl2qCbpUFWhnnGMHCqCPoIBQw6VAYfKgEMFLGHAoTLSoZ5rfHShDLtQk3ShDLlQhlwogj6CAUMulAEXyoALBSxhwIUy0oWea3y8Bc+wnTRJO6kK9YxjZCcR9BEMGLKTCtrUQ0sM2EnAEgbsJLtsJ62jnbSwnTRJO6kK0RpbyE4i6CMYWMhOKkguNFrATgKWWMBOWpftpGVevuCwsM80SZ+pCvWIj3wmgj6CQQdJ8U0gPvCZgCVdJynxL/tM6+gzrVOfeRZoZunnefvum3769Olr2Wyy4ocRlHlevtRiD3UHzELWE0EfwcBC1lND6jk+C1hPwBILWE+LtJ7nsp88/axc5KRH2of9U1M2aU4+jmEB2zdH0EPQRzBAMEQwQjBGMLGAg11oiB42Pz4obdlY79/vHmmpgcmbI+gh6CMYIBgiGCEYI5h0kJTaviz18aapNTqV+s2UAmzbHEEPQR/BAMEQwQjBGMGkg6Sco8tyHh2hNcYj91FOE8bh3jY9hIGNmyPoIegjGCAYIhghGCOYWMCRLjREmh8doqWNV5/oXlYv8zTb0s/ozXR58hEeBD0EfQQDBEMEIwRjBBMEFx0ErwdY08NV4ARdBWqH1vdcxydjnhZLnuepfAKnNl6yPDeeuLEUG9mKV3xllEX+amRro9lwo+J/7nndGFltbNMVF4fLSxiD2cam3Fe1Ua6NXZ4u5VWNPLysRIhrIypf+DOvfmr3LU/q6+K11RZlI6vmRcOrJhUNXelq2zi1sUmfuTiCF6J52+2+yJZpIw5qyvagbVrs1+my2VeyetGMojHSYnUolRVZkx2OFofuqnLJ60NzDx9FkUG9yXY73fSs4dv62jA8vivrrKmNtOKihcW/K77eF6v0Kedt9OXhWe1Ot01a/RC1rMvqEKaqZNfrTB6/5rwWLVnuq4OuS2609Qxk10QNuXxT+/XQQ9Uuvjo0i69+Jk8WlV/6bS8APQR9BAMEQwQjBGMEEwQX3SAHr4FY6ibz8Jp4VrQ7W/RD4uQVvYOkBtBD0EcwQDBEMEIwRjBBcKEhktoefkBqewik7iD5+h2AHoI+ggGCIYIRgjGCCYILDaHUaiFArn31Kq39dd9SwKfE/2VqzOPv8y++8fj9zou/hsb82/XZpLzh+crIs3ba03Pbiufpa22s9lxOwZsyz1ZiW8zyVVrUu1LM4YdfWRCzZJ4+iUJ1U2V/cHnE625Tim+Yn4x1XpYr8Z+nVbP5c5+2eJ1V/CfjuczFd0W2NHi1b58PFURM7+2sHZarn9rAsh25CEo+gaq7To8j9Fo2gj6CAYIhghGCMYIJgosu/2gcsY+csnrFgHqBroPUG3QIegj6CAYIhghGCMYIJgguOgjWMewP3Ca3lT13+t6qva/4LpXXEDPqOeKZjdY4bLAw4F2s+W4nLkye25qpq3cfVR0gGKJ2RRfbpV6Ze8h+FKm4AuTU49Wo+gRVv9Cwz9J852txqSyv5949C3+e/JO3z9W6gEOeTTbwQB0kVv09FNZHYQMEQ1Rn1NVJnk12/9yUaEi9MLzowqKz6QO33m21ZOAQaZ9pSH9FjPqb56GwPgobIBiiOqOuJPUSNQqboLCLrivgZUX7uKpiq/UAh/zlBL2SQH4RaEi9h4jC+ihsgGCI6ow6SK1mo7AJCrvoukK9gTM4+Y2ZLRduUf4AVS0s7b5o2lsdJ7sPP6U1M8eufBp+8I6IXLhzmySm6c4Ov9nzNhobufIxD6KM484car81cuWyHBHLMl15B4coM3LDCVk7c+VzbwQxp25w+EmfN+TecR+pds3YxJU3+iki2sWodokZ0pXTGdVL25VruVQ0y5WPhL0n0chdkPWbtitfMqKIaLNJlbmzJq5c+KGybLnye5vqzdgNe/LPXPmOItUbx5W3lakWjF25FEi1wHbnpGpiHnTlpEXVI/LJqHzOTNECk2qBmPTdBdmfuTl048MvWb1t29RdkLVYQ1fe2iWyJvRMSD3njhvTI03kk5GjRvR/3tN/UT+j6p+Z4gw0yTPQEp2xyV6K/s/I/ovvXzfp0Yy5MTkGhCt05eUqVY8AZJ4tNyQ1uzMtV75zSGVAnOsWVctczE5xz+wk5jpGjkFLZM1q6xkc583D7xH+klY/sqI2cr5ubYyYd6vDdUD7uSl37Sf5O2NlI64S9NaGpyteyS0xja/LstEbx9853O+MspIXl62b/XwljW2VZs2VsUt3vJLvAra3gDfiqL/l++C5t8ukpXJsZzxhThvrUE/QVnB7U65WUbvjtn1r9kv7N7wZHPfLQ9TR7w7RUfgzL/Thg9MN+VkfNDjdEL66broiZ1vtRlfofOu88YPuNyhv/wtQSwMEFAAAAAgAPEaXXLS4whAfHAAAG7kAABgAAAB4bC93b3Jrc2hlZXRzL3NoZWV0Mi54bWy1nW+Xmsi2xr8Kq1/cOydrphUoqtCT6bVaBQU7/SedzNy3RDHNGhUH6U56Pv0tlELRXU/15Mx5k7T+qKLYe1PU84D6/lte/LF9StPS+r5arre/XjyV5abf6WxnT+kq2V7mm3QtySIvVkkpXxZfO9tNkSbzXaPVsuN0u7yzSrL1xdX73Xv3xdX7/LlcZuv0vrC2z6tVUrwO0mX+7dcL+0K98TH7+lRWb3Su3m+Sr+ljWn7e3BfyVafpZZ6t0vU2y9dWkS5+vbi2+w89v2qw2+K3LP22PfrbKvPNTbooh+lyWW3ML6y/8nz1OEuW6a8Xonv08rY6muXJm49VRzfJqxx71Z0cm3uM7+Ugj6nvX1hV8L7k+R/VO9H814tuFYN0mc7KatCJ/O8l3Q8ndoU89D93x1H93Rxn1fT4b3VE4S7gMoBfkm06zJe/Z/PySe71wpqni+R5WR7e613a3Z4rvAZ9zL9N0jq+7JJVO5vly+3uX+vbvhG/ZMxmXe7IZrPnbZmv6t6qFJWvVcjkX6tsvf8/+V7n6qgL27vk/G1dOHUXzkkX/NL3ubB9Ye7CrbtwT7rw3t4Fq7tgJ12wJoCGDry6A++kA/ftweR1F/w0mPal5zH+lsMQdRfiNJjGln7dsnfSsvfmRNpdVQzd0wPovr2TpqJOS6pnzARTfaiSsk/DYO5DdaHCYXPX39VEZ3+a7E7AUVImV++L/JtVVE3kLqo/rqtuqoH3Lix5elWTXmdWs0HNBD9nQ8BGgAWAhYCNAZsAFgEWAzalWUfGrwmi0wTR0Xc0AGwI2AiwALAQsDFgE8AiwGLApjRrBdFtguiCIAI2BGwEWABYCNgYsAlgEWAxYFOatYLImiAyEETAhoCNAAsACwEbAzYBLAIsBmxKs1YQvSaI3n5jp7vbOFtXS7/HspA8k7NpefXw+e7T9afo7vZ9p5SdVG8eolw3FoKIMmAjwALAQsDGivlElNVB2kSUQZ8xYFN6f60o8ybKvN6YuvJwUKqAjQALAAsBG9fM7xJBBMcQgT5jwKb0/lpBFE0QRb0xkcWBYg4RRMBGgAWAhYCNFXOJIIJjiECfMWBTen+tIPpNEP36VCAGN6iZXE+dBxGwEWABYCFgY8AmgEWAxYBNadYKYq8JYq9eSPqaSXO4zNJ1ad0mq7RPzZt1e98jAl0z5mr6/lBc/patZ6k1SJMyJ3of9UA6AAsBGwM2ASwCRxqboihX8WT4pvuGHtO0u5uVlu1bTtdh7datbNrdgy7o1iPRxXyYrzbJ+lWfUNUDmVEFdSmt3Jv+dpPMpL7ZFOk2LV7Si6vH8tKK86e1VT7JXCebMtuW1od0ns2SpTWU5ZUWFpX9ZihU+hEMERwjOEEwQrGJm9BriyBdZi9p8UoWgimyV55V5pawRsnrFpWCnI13hkujOxsL5lAjtrFG1mUiK2+Ulkm23NJlYqMyUfBwoXy56glPyEK2We9956WVZhulGcAQwTGCEwQjdGxxDXVn7G/JMptnpSbJtiHJtmdMsLNPsMMueyrFe5Nu5yic5rza3WHtZju4ROnT93o+l39v+9Q5OlBd0nVQQ4f/nf1Z90mRJWtrmCyT1ZfEGspw/mzdJF+f1wk5TTiofgAMERwjOEEwQjCuoaepgPvkdVVdcD+lxYo886aqd20RDe9GRLubuh0j1msfALsF7A6we8AeaNYu9IPFYLtgpacgqdwQHCEYIBgiOEZwgmCEYIzgVAPbAT3YDTbTr8EHCA4RHCEYIBgiOEZwgmCEYIzgFME7BQ+n98uVfbiqtaPu1fO1uOTgklxL8K5u7RCV6cq6zS/JKfhNjUfpdlZkm+qWENHJUHVCqiIEAwTDBhKXh7Fx4I/ZX6nVsYb5Mi+IQU+MHTyUr0S7yNju8zoriYbxmxpa90UmRc1P95P7f5ETuKmT61X+LC8Bug7uVAfH9ec4mvo7uvrvLYqeZq9dmyyu2tfo6poN5UrxeWuJ7tftSmZq8yov35uUStdQ9UXXGIABgmEDyRrbQ8/RxZqRhVV3aR+f4cJrL1yj9lbnfRdpstqSZVQ3JAY8rRmrblMsruSm7+Ro3ncW1RDa+79T3bTqwNbUwcF8sgWuA4esA/EP1oFAdQBggGDYQLIOBK6Dx6e8oE75ieq1VQrd7mkpiB8tBQFKQbRLQchSEGQp3KpujkvBOyrYdi0cPDTbx7XgkrXg/4O1gNw4BAMEwwaSteDjWrjJ11/JUvDfVAr+j5aCD0rBb5eCL0vBPy2FdpIPHp/dw0mmpsBB3eifSTLw1UYIBgiGNrDkxjXUT/xUaU9Ul8cp9s8y3PvRDPdAhnvtDPdkhnvkyf6gutF4EBpVDUwF52AgOl1cKx5VK3Ujfa3cpt+2myKTi5pdjVg/MV9WDbW4GTrAgBshGCAYOsC6G9fw718cVK/H5eKelkt7o79RLqohVS41U+XidN/JwcAJwTnIDcfGSeZkkm1Dku8WC7nu/ZB8t5xud/lla02LZFFao3z2vLM0gvVLusw3KZl14MeNEAwQDB3g5I1r6OnyIo/zu2U7F2Ti7fPEn18K2lud72Ezo/Nug7zb7bzbMu82zvvRAy8Ozrsg8+78N/MOrLIRggGCYQPJvDv4bK+seJl4j06886bEOz+WeAckfs92U/Xi6vHzh5/k5jL5zr/Ii8QH1dfxitA9sd5vDxtVnco27+xLx+t0L3ue/MtmuLAODp3j4sLyycJyTSuMZbLdZjPr96esTK0PSSY3+NqUk+V1u/9LhXGoOqaLCsAAwbCBZFG5pqL6/p2sJ5eqp9NycnE5fXlez5fU+RWrlt5R9+z0CjWtt2omFVfWlUuW1Y3qUO8zOgef0WG4LHpkWTBDWTy+bst01anutCRyerHZptzWNRLmyzm9BFW90jUBYIBg2ECyJphBZ6RlSY52orrF6woGq4JeBm6ydJZSd3Ji1d1xqfDTQmHtQmGyUAyTxOH5LMeD1VBVPVEN3n+lGpDbiWCAYOggt7OG2uXGTfo1WZLF4L2lGDw8ReiuON550sVp0r120j2ZdA8n/WA6Oth0tEnT0TGZjp/X2Z/Paef/fgmzZbq1Pl8+Xlr31U3KL3lSzOvEWz8Nls8pLTKQE4lggGDoICeyhkzn+upcB4fwIr2z9BusSF36z4zIlyund+mdVkDbk3S4rIAzT7JdAaJ+DqH64If2toeDnUibdCIdkxN5Xew+9VOtD673M8G+Kj4kxR9VVYQS0lWBfEkEAwRDB/mSNdTOCoNlMvuDLAvCl3RPq8LgSn7Jv6d0XZy5knJa6DqnZdH2Jx0hy4L2J29Uh2DZ4J8+uWJ4rOHofqaDXUybdDEdk4v543WEPE0EAwRDB3maNQR19EwtECcO4Wk6p2VkcDT1ZXTmaJJl1PY2HV+W0Zm3WZeRbyyjg+3pYNvTJm1Px2R7/nhVIBMUwQDBsIFkVfRwVXxM52RREC7oWVEYTFB9UZyZoGRRtO1QpyeL4swObX8kpUtMHO15wsXmpk2am3Wj3ccwyWb3T3m6zr5bwfdNsp63JOq3jjVOiur5xp/GRZquycJwkeOJYIBg6CLH0zU4ntrFqEs4nmerEdfgeGpWI+6Z3ym1MD9bjbht69Ptvpu4Z9bnfr5QPernC9c2Vw12S23SLa0bgapZJtsym1k3v3x63SitYtkObWmo7ugaQf4ogmEDyRqxcY3Qt85Vl62546xAfswYVc1aU8dZebQdUteW5XHmkNblYRPlsbfP3KYMjmrRPrHP3KNaWVzJNgb7bNfqrt3qtmrl4JnNMdcodnZt0tmtG+lrdDL43er5XdsaJMvlJl3Li56mPJGNi2CAYOgiG7eGTHfM2pWzS1i4p492uAYDd6C7urlnFm5V/qeGmxq7qlFH1uhZDdQ16hinMNdcHtiftUl/tm6kyqP9IKCLPFYEAwRDF3msNWTEx7Ym7pmPepRMPYvdM4P0KEttW9R1ZZbObNF2Kpg5FdgTtUlPtG6kSQWyNhEMEAwbSKaiZW2epOLMvDxKhZ7FipGpaBuPLpOpwMajS+nIk1RgQ9IhDUlXfQKTqMKhC9zBEYIBgmEDyVTUviL1uLFixCdJI8BixYhjnLptO9D1ZCqwHehycyqwTeiQNmHdyO4RhzB0kcWHYIBg6CKLr4Z0KjhIhZ7FipGpaPtyLpepoJ8VvHFbzwq+9ZkR9NBI9VUypqxif88h/b26keYEQxYdggGCoYssuhpy6pPENaOzqmexYmRW27aaK2RWz2y1dip8cyqwReaQFpnro1QglwvBAMHQRS5XDTlx+ZjUjE6FnsWKkaloW1OuL1NBW1MPatz/4AlGfcDrJKvY4jr91Gid1R7KKnKpEAwQDF3kUtWQnjZ7IKt6FitGZrXtLbk9mVXsLTGzt8Swt+SQ3lLdiE4FQ74QggGCIUO+UA3JVChGpQKwWDEqFazt5bDuO7kb+gqmxt162p1p8mV2dRh2dRzS1akbafKFPBoEAwTDBpL5svUTYs3ofOlZrBiZr7a5wmyZL425wuzzfLmuJl9mh4Nhh8MhHQ7moHwh0wLBAMGQIdOihuRaomZ0vvQsVozMV9toYI7Ml8ZoYKdGw8uV51xqPkJQffj09P7u2+/XMWxHOKQdwVyUS2RHIBggGDJkR9SQPvdckEs9ixUjc9m2I5grc6l5SosZn9Ji7D9KIDYxHNLEqBtpEohMDAQDBMMGkglkIIEMJFDPYsXIBLZNDMZkArGJwcwmBsMmhksqZ4ZMDIZMDAQDBEOGTAymNyMmgEWAxTXj1Od7WdvEYJ5MBTYxmNnEYNjEcEm5WzfSpAKZGAgGCIYMmRhMb0ZMAIsAi2tGp6JtYjAuU4EfLmJm54Fh58El5S5DzgNDzgOCAYIhQ85DDTn19VsMOA+AxapPMhW18+DWqRAyFdh5YGbngWHnwSU1KtML9iFDxgOCAYJhA8lMnD0mc5QJPYvAccQ1o77Kb1qzJhO+zAT+vB8zuwVsr3up8h7UzHaJ0AwVpL9nEsAAwRDBMRjsBLBIdUrdYaiZS0a8Zu3zov1Vk2YXwOvqQ+x1QYgVJEOMYIBgiOAYDHYCWARYXDMyxIqhEJuFu6eerCDOqYGC5FdQIjhCMEAwRHCM4ATBCMEYwakGtgNtVtxerR2Jch0ANgRsBFgAWAjYGLAJYBFgMWBTmrWja74l77kguno2BGzkqa8BIi5hgYeELoJjBCcekMgRGGwM2JRm7RCbb7V7WKW6pCXr6cXd0EMiFcEAwbCB1MpDjYdaeaiG1MoDsFgx6k671xapnhSpHhapnlmkegaRSpqtdSP6oQcPiVQEAwRDD4lUBclU6FkEWKwYmYq2SPWkSPWwSPXMItUziFTSR60baVKBRCqCAYKhh0RqDemz4uwDM0ep0LNYMTIVbZHqSZHqYZHqmUWqZxCppA1aN9KkAolUBAMEQw+JVAUpS1sxMhV6FitGpqJ9e9yTItXDItUzi1TPIFJJQ7NuZLuUX+AhlYpggGDoIZXqAZUKWARYrBiZivbtcU+qVA+rVM+sUj18T5uRT2V5PXRWoHvaCAYIhg0kU6GXoRPAIsBixchUtO9pez2ZCnxPm5vVLMf3tBnpLfMuSAVH97QRDBAMObqnrSCVCsAiwGLFqFTw9j1t3n0nd4NTYVa9HN+uZqS3zG2UCnS7GsEAwbCBZCps/WVbNSRToWexYmQq2reruS1Tgb8thZt1Mcd3ohnpLXMHpQLdiUYwQDDk6E60gmQq9CwCLFaMTEX7TjR3ZCrwxx64WURzfCOZkd4yR8+1c3QjGcEAwZCjG8kKkqkAz7UDFitGpqJ9I5m7MhX4uXZuFtsci21Giu26kSYVSG0jGCAYNpBMhV41TwCLAItrximjg7fVNpdqm2O1zc1qm2O1zUi1zZHa5khtIxggGHKktjlQ24BFgMU1o1PRVttcqm2O1TY3q21+rLbbJh9XvybkafL07t2727x8qj5QGubLZf5tK9+hPn3FkQBHMEAw5EiAc72QngAWARZzIMB5I8CPWTsdZsXNhT4dSFdzpKsRDBAMOdLVXK+PJ4BFgMUc6GouzBE2C2nu6yPsowgjuYxggGDIkVyuoUfdXudALgMWcyCXuW+OsFkf854+wkgFc6SCEQwQDDlSwRyoYMAiwOKakbfNec8YYWGWvaKrjbBA4lYgcYtggGAokLgVrQ/ytyMsgLgFLBZA3IquOcJmNStsfYTVzUti70MF6QgjzYpg2EAywjaIMNCsgMWKkRG2zRE2i1Th6COMHooWSIoiGCAYCiRFhQMiDKQoYLEAUlQ45gibtadw9RFGClMghYlggGAokMIULogwUJiAxQIoTOGaI2yWlILpI4yEo4J0hJFwRDBsIBlhIBwBiwCLFSMjzMwRNitF4ekjjPSgQHoQwQDBUCA9KIAeBCwCLFaMjLBnjrBZAAq9ABTopqpAmg7BAMFQIE0ngKYDLAIsFkDTCbOmE2ZNJ/SarkaatQTSdAgGCIYCaToBNB1gEWCxAJpOmDWdMGs6odd0Amk6gTQdggGCoUCaToBboIBFgMUCaDph1nTCrOmEXtMJpOkE0nQIBgiGAmk6ATQdYBFgsWJkhM2azjdrOl+v6Xyk6Xyk6RAMEAx9pOl8vTabABYBFvtA0/lmTeebNZ2v13Q+ug+pIB1hpOkQDBtIRlivzSaARYDFipERNms636zpfL2m89HtRR9pOgQDBEMfaTpfr80mgEWAxT7QdL5Z0/lmTefrNZ2PNJ2PNB2CAYKhjzSdD+4aAhYBFvtA0/lmTeebNZ2v1zsDxcjlmoJ0iJGoQzBsIBliIOoAiwCLFaM+f6WYC0Ls/fjXJPu12unp7gw+fh58uvt0fUP+4rcPlNsQwRGCAYIhgmMEJwhGCMYNJE+CWhRWv2qwuJr6fse+NHx7o28WiT43JOa36090ToDWGyI4QjBAMERwjOAEwQjB2AeydVrDQ05+kWnCKTGrSl+0UnIyUQEBOERwhGCAYIjgGMEJghGCsQ+07LSGzAOT1X/wne6+bzgnPuVlsrT2v5VLnxxARA4RHCEYIBgiOEZwgmCEYOwDPTytYX1yVD8bNbV5X17Mz342qp25w9eo+0oMCk0iRtl2tkyyVVrQaVCf8qR+oB3BEYIBgiGCYwQnCEYIxghOG0h8rOhGwXP0QY9u9ehOj+716IFErarodU/P5/Pf9OgpZav7nZN31jBZz9LlMql+i3xrfcuWS+tLas3ki2yeFuncytfLVytbWOVTahXpn8/ptrSyrbVK5qncvHokxnKY9ZQ/F1srX1ibZTKrnpKpNs8L2cWlNcm/pS9p8fPuvdnR/pr+drtd52W163RdpkWZyIHO1W53/Wytp+QllVukazm81ep5nc2SUm5U5ruNVsn6eVH9DGpR7V4OY11ayXq+b5WtszLbby033RT5LN3uh7v/UzbpbJ+yzUYNPSvT1fbSskbpJt9m5dZKilSOcP1LkS6e1/PkyzLd9T5bZtXP6jVxe0qKr3Ivi7zYd1MU1aFvs2r7RZpu5Uhmz8U+rrPU2u2nUx2a3MOySJP56/4I63Gl8/2w0vm/qdNZ5Zf8hC2CIwQDBEMExwhOEIwQjBGcNkVOiMEbBYnTWY9u9ehOj+716IFE7dP56KxVd92p5U4DyZQDOEIwQDBEcIzgBMEIwRjBqYJ0ym19yrXoVo/u9Ohejx5I1E754cdAew5KuYNSDuAIwQDBEMExghMEIwRjBKcK0imnvpe9TrkW3erRnR7d69EDidopd99w0VZGk26x/S4OPvjWMPo4vAmsTx+vR9Ht2BreXbYuo0/pcm4ts92FSl2N5ukyed1a8+e0umg+5ctsLl/L63KRrLebXF51d1fl6rq2TL7IRtuyyP5Iqy1eN0+5XBP8bC2WeT6X/6dJUT79+Zzs8CIr0p+tl3wpr+7ZzEqL581uPfGzJS/Iu+vsOJ//vOu4GsdSdnpJXs9cVOkAjhAMEAwRHCM4QTBCMEZw2uSfrHTqy+TqSteiWz2606N7PXogUbvSD+qxp2w9ymdsIOHBDREcIRggGCI4RnCCYIRgjOC0gcTTrzcKUinXols9utOjez16IFE75Wd2KDG5KdtT+1M8RbpJqvXx4JWcIZDx2QNu4ci45+uNXHS/7PZMaecA7TpEcIzGNTGOa7iXGI/Z13Ui1Q31y3ER2n2Mdj9VUGcofEwXUgZWWuU2p+bsG9UBVZ5adKtHd3p0r0cPJGqX5+GHUHvK4yVnJPVZEMojaSDhHYxQtwHqNkRwjPY5afZJzkiqJXkRUj4ucZ2ZNt2SMxLXp1yLbvXoTo/u9eiBRO2UizfMSMpcZpoz4PGp8ius61n2JaF+wHigeqBXLUIf5ZFx379dfySnIrDHEMExGs6kaUl90RjqNkbdTpujJOafGwWpWtKiWz2606N7PXogUbuW/EPJKDuc60omqX4JOfiezp7L7IWasQeqD3rdoyBx9o2Me79/LmZPSeVpWXeLRTYjf3Y7QAMIERyj0U0aSN2LRd3GqNtpc9DEBHmjIFVDWnSrR3d6dK9HDyTa11Bn+5Sm5Sgpk6v3q7T4mg7lnLK1ZtX9Etmi2704et8q0sVuCu5Xh905IwOb90ObU8S3+9XDNgRxvH71k+jn5Nqz+9W31BFthOxNkMT25QjIsXmSeCRxRL/6+WWCMKdffVM7QXi3X32fBDHqntuvls3nRC6o+tWSh9oP61dfQn1ORp7br748jWjjyjYu1WbgyCN1yCN15ZG61JHKRWh/TI/Nl/vxyf24MgYuFYOBI4lDEXlh6VdTPZU5WQc2PQLZm0/Huj/okbmWY/bIMQuZUUFl9Nq2+wObqik5r/XHZL1L0dAf0lHz5JngkWeCkEcjyKgxt199lzw1NllTNnU8cpHQH2riKXNtU0QuMvvVcpEatWzjkb35Mm4+Gbdet195YNQIenIEZH6EzI8gj8fvT8nK5bKmOUl8GTWfjlpXZpSMtJDZEVQEhrbTj2zyaJisT0bOUz7vV88eUPuRbQR9xstIMzLSXEaakyPwZDw9Mp6unA9dcj5k8kgZNbZrecKT+3dkXw7Zlyv375L7ZzI7jJ5bZXYcKjsTrz+l9i91Qz+mzza/169ukVKZdmSmyZgJuX9BVofv96ub4lQNdGUNkHXDZT45WQNyjhiSox72+hEZMy5Hxum67U/p+Vbm0qXPWzmneNSIh3JWi8hZ7dqXVyOfrE0u98PJ/TiyNh06zrKeBV3PknCayErj9JpAVppDR00STp8DsgZdsgaFJIIiUhf3x+RMeO2LfvVgC1XrMtaMnr/l2Bh9PZJ145GxduRM6JDZ5pJwug5k5bjkmkDIEQg6OjJzLpk5R2bbIbPNZH4YPRPI43F3x9M5LBqv3m+Sr+mHpPiarbfWMl3IBWT3Ui6Li72y3f1d5pvdX1JxfclLqXvVq6c0madF9Uqushd5XqoXnX2/j2n5vLHyorKcdncDfr2obgwUSVZeWJtkkxaP2V/p7qncJ7nVX7ncbDnaZNWzqD3W48Lp7fra7yfc7eDqfT6fT3ZvXP1Pstr8+2b37/h95/B+tUm99dkmqpf0JV2rzTvHL6q/1Uad4xeLrNiWTZPWq92LplH7VXvwnW958cdu/X71/1BLAwQUAAAACAA8Rpdc/aMFsYInAABYCgEAGAAAAHhsL3dvcmtzaGVldHMvc2hlZXQzLnhtbLWda3fbtrqt/wqHP+zdld1awoU3rSRjxBIhkUra7CZtz/nI2LStEVnUouQk7q8/gMyr9GJCTXu+tLEfEgTfCV7mJEi//FpWn3f3RbH3vj2sN7tXF/f7/XYyGu2u74uHfHdZbouNJrdl9ZDv9Y/V3Wi3rYr85rDSw3rEx+Ng9JCvNhevXx5+9756/bJ83K9Xm+J95e0eHx7y6umqWJdfX12wi+YXv67u7vfmF6PXL7f5XfGh2P+2fV/pn0ZtKzerh2KzW5UbrypuX128YZO3TIZmjcMiv6+Kr7vev719uX1b3O6nxXqtl+b+hfdnWT58uM7XxasLv//jz2Z31ke//GAaeps/6c6b5nTnxLiH3+te9mkUXXimep/K8rP5TXrz6mJsilCsi+u96XWu//eleO7OlHG97/857Ij+9yTVP7c7a1bv/7vZK3Wouq7ip3xXTMv1H6ub/b3e8oV3U9zmj+t997v4ko1jEfot+rX8uijqIstLaTZ2Xa53h/96X59XCi6lZHIcmFJdP+725UPdmtFp/2TKpv/1sNo8/z//VgvWa4L5l0FwXhO8boIfNRFcRlEQsih0NyHqJsRRE/75Tci6CXnUhGwL6GjArxvwTxo4u5hB3URw1ER46fsyOGcvwrqF8LgF55pRvWZ8LOT4bCHZuBkMx6MhPreIrBkMLBDRQYrR8+g8jPtZvs9fv6zKr15lVtGbMP94Y5oxG40vPD2qzQlndF2zq5qFwSmbAjYDLAFMATYHbAFYClgG2JJmI12/toi8LSK3N3QF2BSwGWAJYAqwOWALwFLAMsCWNBsUUbRFFKCIgE0BmwGWAKYAmwO2ACwFLANsSbNBEWVbRAmKCNgUsBlgCWAKsDlgC8BSwDLAljQbFNFvi+iDIgI2BWwGWAKYAmwO2AKwFLAMsCXNBkUM2iIGzwvz8WHh1cbcu37YV5qv9CVp//p/f/vl45uP6S8/vxztdSPml12V65XDkKgyYDPAEsAUYPOGRUSVm51kLfvymkkevBx96RccNJ8BtqQ3PSh42BY8rBemruQhGLWAzQBLAFOAzWsWjYl6gn1IQZsZYEt6e4MiRm0Ro3phRhSxYZwoImAzwBLAFGDzhgmiiGAfUtBmBtiS3t6giHFbxPh54TExpK9icGQDNgMsAUwBNgdsAVgKWAbYkmaDIrJxd2c+RrfmY3RvDuAMwQRBheAcwQWCKYIZgksLHBa0Z3UarxNZLknT9arY7L2f84diQl2VmgYinyp6DSVxSM7aNSVVdAAVgnMEFwimaFcyZ6G0lyQrtLQUYahI55tYbRCYsClSPmzzzROQhCNJ+KA3xH6Uj5/WxV3x4L2vym1R7VfF7kcv3VwTm5q1myI1BFAhOEdwgWCK9j1rS2vVsFivvhTVE60jP0PHzrox4dRxs8+v996s2Oer9Y6WUiApBTq6BFIGQIXgHMEFginalayG0lKq3/P16ma1t+hCl2Goi27ZJJRcXsZNZvQcer4yUdHzL9oY89Bed9fOJB42JtGe7Lb5dfHqYlsVu6L6Uly8fnNzo/+9m3ikrhLpWkNOXqok0hVAheAcwQWCKYJZDX2Lru/zpwdzdflYVA/kAbBsWofidi6V+eA2q4HkfRaCMwQTBBWCcwQXCKYIZgguLXBY0KA+WsLL4PTgaGtdO7Gx7Wya7vVF5OfykjwAzlp5Vuyuq9XWPOQgGpk2jVBDb4ZggqBqIXFwzp0d/7D6s/BG3rRclxXR6YWzgf/dPxHrpc71ftus9sSK2Vkr6ov96rrwfni/eP8v8jh0NfLmoXzURzLRwHBodd6cPZvQ2NLgmJHjpnauwhahLPLqRhd/++SF47vdw/M/3+f6RoYcQSEaQQAmCKoWkiPoGfrMVklJDpu6yUGqchSpDJc5bbkq8gdyhNTr+b22uQwv/WH7y3o5bvzY7Wu92gvdrZejW7N8u+hQ7i5FYBGWm5NyR/+s3BGSG8AEQdVCUu4Ii/Lhvqyo43YxXNGiuKNxq+IRpfj4WO9oqHek9Y6w3l3gwWKstyD1jv9ZvWOkN4AJgqqFpN4xluRtubkj5Y7PkNvRtlXumJA7Ojm846HcsZY7hnLzLpnhYyw3dVK7qlf6p+RumiPlRjBBULWQkruB1rM5Nc4Xw7VosV0t28Ru1uuLLeNjseulGrH5+IXuFBa7u/XjDIvtk2Izh9i/3N7qe5B3+TePj8frTztvWeW32h+X148Hl5BsvhTrcluQ0oNgZ4ZggqDiIBKa19Dnlv3R5fnmMX5BDgB2xgBgeABsqUgma9YayH8sPhuKz7T4DIvfe7DPsfgBKT7//yk+SIRmCCYIKg6ypHkNreKbHFar79Pq8zPU59+lPifUP7mRq5dq9edaf47174ItLrD+Iam/cOj/frUutQspqod8Y/R+l1efi8r74aoq8xvKkkw5SJtmCCYIKg5yqnkDbaL8WtyQeosz9HY0bdH7ea3Bw1YpTgUXfcE//PbuB72mFl38C6veTaLgEqsekarLf151EDfNEEwQVC0kVZdYmqv1I3VeWgzXs8juaNsiuzxPdjk8zqWWXGLFuyyN+1jxmFTc/+cV95HiACYIqhaSij9Dbju7X63z68+k5P4ZkvvfJbl/nuT+UHJfS+5jybukmwdQcjYmJQ/OkvyPp33xqTT3843kSi/nlZUHpEcBH4IJgoqjgK+Bf/UUH5whvKNpi/DB6SU9CI5lD4ayB1r2AMveJXEcJ3GMTOK4K4n7G7KjVA7BBEHFUSrHHdmZ9Rx/Ri7natuiO5HKneo+jOR4qHXHkRzvIjmOIzlGRnLcFcn9Dd1RPIdggqDiKJ7jjgTNfqY/I55zNW4RngjnToUfZnM80sLjbI532RzH2RwjsznuyubelZu7cq2v7Zvr1dr74V1xs3p8+Jd2wP+9I9VG4RyCCYKKo3COOwK0n8tLatAv+BnhnKvtT+U3Um0im2NcHMs9zOZ4rOXG2ZzosjmBszlGZnPClc1N82rtvdncFWvPN0/qPu/LrffhPq+2xYbO5wTK5xBMEFQC5XPiJGnrVD1lp6oKRwpHH8KCyOAC/1hUMczgxPiF7hIWtcvgBM7gGJnBCVcG1+YtV+U374/V/t6bll/02VutvhU3+i5dXwXJU3fTMC0tyt8QVC0kpa3zN9sEm8VPRrVv3tufmH/pm3/9YX5DHd/NduBI+K44rllrEMiI+HgkDAM5wfRIwIGc6AI5gQM5RgZywhXI/XG/2hf64r3S4K6N37yvIz0sNje6E/54TJ/YBYrjEEwQVALFccKRlrHxN+rsuxBnJHGuti3CE0mcL0+zODHM4gTX0uMsTvTeD8JZHCOzOOHI4uj5TL9tVv95LEb/5ye1Whc777fLD5feezPD6fkuT5XrG32eIMcDCuoQTBBUAgV1wpGm2Z7CiTOSOlfblvFQT3ELey3z+HQ4iCZXfh4OQg8HgYdDF9IJHNIxMqQTrpDuMJVlN/H+b7Fel19H5how0jf1ZbkZ/VLl+gZgpD3x6PdVuS72o/erDXW7PG22Qg8ClNshqFpIDoIaxtT8KgRTBDMEl6KJ3MCrFaIL2QQO2RgZsglHyPaPH8AogUMwQVAJlMAJRwJnnTYhzkjgxHclcPVawyM4PD5+/eb4tS/0ttm+ZfPzqig23n/lD9t/e88HGphRJbr4TuD4jpPxnXDFd83h/9yrN5sbsk/1SEGBHYIJgkqgwK6B9FEOYIpghuBSBGcc5V3AJnDAxsmATTgDtnW+26+u9f3txyd9Z1YfwDa7LVCohmCCoBIoVBOO4OuNHNmP4zOCNVf7luOYCNbCk+vwMFgTob4O42BNdMGawMEaJ4M14QzW/preKExDMEFQCRSmCUfeZb3rOiNLc7Vt0ZrI0iJ2rPUwSxOR1hpnaaLL0gTO0jiZpQlHlkZfwd/fl8Vm9c1Lvm3zzc2xLZvn1d52AUdRG4IJgkqgqK2G1gkSb4v9noyJFuKMsE04wjbLaKCyttN5rmIYtolYjwcctskubJM4bONk2CYdYds/PB4kCuIQTBBUEgVxNQTj4S5fU8NBnpHSye9K6SSR0hmPNBgMchjSyfGLhcQhnexCOolDOk6GdNIV0mXlk9dcDJT+ny1vlSBamyGYIKhaSMpcvz0VWPoeXlOTFhfyjABOOgI4S8AuqQRufHLQy2EEJ5nWGUdwsovgJI7gOBnBSVcEd7bOKHBDMEFQSRS41dD6FkPksRE99VGeEblJR+Rmk5rI3OLjJ2dyGLhJroXGgZvsAjeJAzdOBm7SNfkt+XZdrEcfHkze/mGfb9eF98eqIuc6ShSmIZggqCQK06Qj8Pq5vBTUmWwhz0jTXI3bpBanUosTqcVQaqGlxmGa7H02CIdpnAzTpCtM0/J+Wq1L76rc7bzF6u5+bd6rsxzXKDNDMEFQtZDUWuLjuh8C1unfIRg4BH91CEgOhTPmwg2XOfsqLonz+2mwKodz4aTUYwHPhZP+82uQ5tOD9tcgJU7wOJngSdc0OX3qHy3zlfd25X0s9Dlhdf35yfu53Bfe+/zG++FZBfJJnERhHYIJgkqisK6Gvu2izw4XA++bZ7kinBHZSVdkl1PTsrJ6NS76TR+/59Qs1AwNXw8NPGdOdqGbxKGbIEM36Qrd/ob+KIJDMEFQSRTBScfENn7xzaL8GbPmXI3blCemzZkZTUPl6xxP1soHWnk8bU52qZ7EqZ4gUz3pSvX+hvIo4UMwQVBJlPBJRwInLr6J/yaVPyPeczVuU556nfVE+WG+J0OtPM73ZJfvSZzvCTLfk658728oj7I+BBMElURZn3TkcVp5+uUXeUbY52rcpjz1Wmt0eiswzPtkpLXHeZ/s8j5Zh0NETa5qxiRRzWkDyS9MIJggqBCcN50lPylp35EUsKxh1HORhoGP8/ldVObX0Qr1MS+/ScSoUjaQ/qok+pgXggrBeQMl9c1DsCcpYFnNBDE7bdkwDmrZ3Yb6DNSSoVoyVEsAEwQVgvMG0rW070kKWFYzupbMXcsuzfE5qCVHtUQfL0YwQVAhOAedXQCWApbVjC4ld5eyy0t8AUopUCnRJ4wRTBBUCM5BZxeApYBlNaNLKdyl7PIIH+cRgnzQ5DvyCMuDhXK399I9+ezAR6EEggmCykehhO8IBqTxlpK82/DPyB1czVvuNurV6vkgRCw2ekOstvTbIKLr0Zi+7fB731/GMYMgHyv5rphBvPOM1j9prc2N5g7eZfooWUAwQVD5KFmoYWD7gthB+YBW/oxUwf++VKFZbXCfKfyTG01/GCz4/gvdK3ij6XfBgu8IFshnR/55L+P97v/60VusfvpYXG/L1ca8kLnxfhhf+rTwKFJAMEFQ+ShS8B2u3/pejn9GpOBqnA4afSJRiI4/reAPX8TzAy05ThT8LlHwHYkC+RjJP+9FvN/9vyA4ShIQTBBUPkoSfIfZtwt+RpLgatwiOPUG3ul0AX8YJfihlhxHCX4XJfiOKIF8oOSf9w7eX5IcRQgIJggqH0UIvsPlW1619c8IEFxNWwSn3rwjBB/mB36kBcf5gd/lBz6eLyTIx0r+980XOoyCq/c/ffCu8vVaX+qbYUCOADRJCMEEQdVCcgQ4pvHYD/oz5gi5GreMAepbWcezfP3hDCE/1iMAzxAKutgjwDOEBPnEKPi+GUJ/aQQ02yBHAIIJgqqF1Aho4F9973q4Hj0AXG3TA6BZCw6AYDgrKBi/0D3CA6DLagI8K0iSj4wCx6ygf2QAoAlDCCYIqhaSA8Axq8dyERiuZtH/u97Ya9bC+g9nCwVM649nCwVdvhTg2UKSfHAUuGYLqfxTUf00NfOEtNBMclFLji77AZo6hGCCoArQ1KHAMbnHetIPzpg55GrcojkxcYgdX/aD4cShgGvNTyYOHRZ927TXb87i8YMuLAvw5CJJPlYKXJOLvm9coGlGCCYIqgBNMwocM4Gsl4IzZhm52rYMC2KS0emwGE4yCoQeFniSUdCFegEO9SQZ6gWuSUbfJzkK9hBMEFQtJCV3JG+2k/8ZoZ6raYvixGSiU8WHU4kCqRXHU4mCs6YSBTjjk2TGF7gyvmRTVHerP4tKjwEz5f7Js7wxEoCUboZggqBqITkA6plDtnzvzRsqQ10E/hkDwJntkVeZrFlvMIn0eMpQMEz2Al8PAZzsBb0/A4eTPUkme4Er2TtfZxTnIZggqAIU5wWOxM0i8xlZnqtlq8xEmncyVzgYpnlBoGXGaV7QpXkBTvMkmeYFrjRvWpXXpZklbP4qglH5Y74tvB+uVnfetKzor3MEKM9DMEFQBSjPq6H9A6kmuffHTzfUGF0EZ4R6gSPUq8o19UJJFhCx3uk5fhjqBaFWHod6QRfqBTjUk2SoF7hCve9SHsV6CCYIqgDFejW0Kz/iUPoz4r3AEe9ZpadeBzxWfpjuBZFWHqd7QZfuBTjdk2S6F7i+rPWs/Lt899m85GVkJ7VGAR6CCYIqQAFe4HjL73CUc98m9RkpXuBI8axSEzmePJ4FGAxzvCDWWuMcL+xyvBDneJLM8ULnZ7UOWr/XV638rlHb+2G6LvLKfD3vY74hD/QQZXcIJgiqEGV3oeOVvsOUbzYek298hWcEeKEjwLNpHxIRnn8c4YTDCC8cv9B9wtp3t+ohjvB8MsILhxHecMJLA2kBUfaGoGohKeBJiNbTx85SwLKGEdtbhsPULGS65Dg1C7vULMSpmU+mZiFHJUfhF4IJgipE4VcDqT/atwhPAq5eze0sC0/iq17Nh6lVyHXN8etuYZdIhTiR8slEKhSo5ihYQjBBUIUoWGogXfOT9KhXczvLwpNsqFfzYSQUCl1zHAmFXSQU4kjIJyOhUKKao2QHwQRB1UKy5hLV/CS/6dXczrKGkTUfhjKh1DXHoUzYza4KcfLik8lL6KOaozAFwQRBFaIwJTxJRXolt7MUsCw8SUN6JR+GIKGvS45DkLALQUIcgvhkCBIGqOQo10AwQVCFKNdoINGfRXiSXvRKbmdZeJJM9Eo+DCTCQJccBxJhF0iEOJDwyUAiDFHJUbCAYIKgClGwEJ5EA72S21kKWFYzTrBlOEwCwlCXHCcBYZcEhDgJ8MkkIIxQyZGjRzBBUIXI0TeQPpmf+PVeze0sC0+8eK/mQw8eag8eYg8edh48xB7cJz14GKOaI2eNYIKgCpGzDk+8ca/kdpYCloUnnrhX8qEVDrUVDrEVjjorHGEr7JNWOBqDkkfIzyKYIKgi5GcbSJ3MoxO72pUcsCw6saJdyaOhA420A42wA406BxphBxqQDjRCDrSBdMmRA0VQtZAsOXCggKWAZTUjT+YNa0quHWiEHWjUOdAIO9CAdKARcqARcqAIJgiqCDnQyG4kF4ClgGU1o0s+NKCRNqARNqBRZ0AjbEAD0oBGyIBGyIAimCCoImRAI7uPXACWApZFJ3/5q1fyof+MtP+MsP+MOv8ZtQas+VthWoX/YSd/KayuNTKeDaRrjYwngqqFZK3t/nEBWApYVjO61kPfGWnfGWHfGXW+M/JPay3ttUaGM0KGE8EEQRUhwxkBwwlYClhWM7rWQ8MZacMZYcMZdYYzCk5r7dtrjZxmhJwmggmCKkJOM7I7xgVgKWBZzehaD51mpJ1mhJ1m1DnNKDytdWCvNbKYEbKYCCYIqghZzAhYTMBSwLIIWMxoaDEjbTEjbDGjzmJG0WmtQ3utkbeMkLdEMEFQRchbRnaLuAAsBSyrGV3robWMtLWMsLWMOmsZxae1juy1Rp4yQp4SwQRBFSFPGQFPCVgKWFYzutZDTxlpTxlhTxl3njIen9Y6ttY6RmYyRmYSwQRBFSMzGdtN4QKwFLCsZmSt46GZjLWZjLGZjDszGbOTWsdje62Ri2wgXWvkIhFULSRrDVwkYClgWQxcZMOaWmsXGWMXGXcuMuantWb2WiP7GCP7iGCCoIqRfYyBfQQsBSyLgX2Mh/Yx1vYxxvYx7uxjLE5rze21Rr4xRr4RwQRBFSPfGAPfCFgKWBYD3xgPfWOsfWOMfWPc+cb41DfGdt/YLE3XGvlGBBMEVQvJWgPfCFgKWBYD39iwptbaN8bYN8adb4xPfWNs940x8o0x8o0IJgiqGPnGGPhGwFLAshj4xnjoG2PtG2PsG+PON8anvjG2+8YY+cYY+UYEEwRVjHxjDHwjYClgWQx8Yzz0jbH2jTH2jXHnG+NnIyQiS94Xko8oY+QfY+QfEUwQVDHyjzHwj4ClgGVNaYiPDC3bAtQ11/4xxv4x7vxjHDlqTj6jjJGPjJGPRDBBUMXIR8bARwKWApbFwEe2Bahrrn1kjH1k3PnIuDZG1Gex4sY1EiWYNpD8LBaCCYIKwTno7AKwFLCsZuRnsRoGPovFxp1PNP+2FrOBdDVbSpYT0gRSBekcdXmBYIpg1kCyqi2EZWXNe2r2t9QOCx1KSny976ql1I5PIZ1BmkCqIJ1DuoA0hTSDdGmjR1XnveKCbw82kPxu4rSlltqizw9CqiCdoy4vEEwRzBooiDknyxZKVFbRK2v9qT3iynHVQCaJfkxbGnGyrIAmkCpI56jLCwRTBLMW0sO1hiEqq+yVVTruHci5Ns1qfEycqKYNtRUc0ARS1VFiTM1bSt1BIJgimLU1om7c2jXruwj98wuzLXgfwcZ+TwHfoQA59aZZzaaADxUANIFUdZRWAPhCBFMEs7ZGtAL+kQK+UQC7QzYOegoEWIGInInTrGZTIIAKAJpAqjpKKwDcIoIpgllbI1qB4EiBwCiAPSMbhz0FHK4xIifmNKvZFAihAoAmkKqO0goA74hgimDW1ohWIDxSIDQKYAfJxlFPAYeHjMh5Os1qNgUiqACgCaSqo7QCwEkimCKYtTWiFYiOFIiMAthPsnHcUyB2KEC+NtKsZlMghgoAmkCqOkorAJ5TIpgimLU1ohWIjxSIjQL4aSVjPRvKxg4FyJdImtUsCrAxUgDRBFLVUVIBBp5eIpgimLU1IhVo1mwUYOMXZlsOBXrGlDGHAuQ7Jc1qNgUYVADQBFLVUVoB8EwTwRTBrN1ZMiJo1mwVYEYB/GSTsZ57ZdyhAJnfNqvZFOBQAUATSFVHaQXAk04EUwSztkb0McCPFOBGAfy8k7Ge0WXCoQCZ5jar2RSAFhjRBFLVUVoB8PwTwRTBrK0RrYA4UkAYBfBTUMZ6npg5PHFEe2IGPTGDnhjRBFLVUVoB5IkBTBHM2hrRChx5YmY8MXN4YtbzxMzhiSPaEzPoiRn0xIgmkKqO0gogTwxgimDW1ohW4MgTM+OJmcMTs54nZg5PHNOemEFPzKAnRjSBVHWUVgB5YgBTBLO2RrQCR56YGU/MHJ6Y9Twxc3jimPbEDHpiBj0xogmkqqO0AsgTA5gimLU1ohU48sTMeGLm8MSs54mZwxPHtCdm0BMz6IkRTSBVHaUVQJ4YwBTBrK0RrcCRJ2bGEzOHJ2Y9T8wcnjimPTGDnphBT4xoAqnqKK0A8sQApghmbY1oBY48MTOemDk8Me95Yu7wxDHtiTn0xBx6YkQTSFVHSQU48sQApghmbY1IBfiRJ+bGE3OHJ+Y9T8wdnjimPTGHnphDT4xoAqnqKK0A8sQApghmbY1oBY48MTeemDs8Me95Yu7wxDHtiTn0xBx6YkQTSFVHaQWQJwYwRTBra0QrcOSJufHE3OGJec8Tc4cnjmlPzKEn5tATI5pAqjpKK9B8d4j4+5uLltISIFPMkSnmR6aYG1PMHaaY90wxd5jimDbFHJpiDk0xogmkqqO0BBJKgFwxgFlbJFqCI1fMjSvmDlfMe66YO1xxTLtiDl0xh64Y0QRS1VFaAh9KgGwxgFlbJFqCI1vMjS3mDlvMe7aYO2wxG9O+mENfzKEvRjSBVHWU1iCAGiBjDGDWVonW4MgYc2OMucMY854x5g5jzMa0M+bQGXPojBFNIFUdpTUIoQbIGgOYtVWiNTiyxtxYY+6wxrxnjbnDGrMx7Y059MYcemNEE0hVR2kNIqgBMscAZm2VaA2OzDE35pg7zDHvmWPuMMdsTLtjDt0xh+4Y0QRS1VFagxhqgOwxgFlbJVqDI3vMjT3mDnssevZYOOzxYSYYoYGA/lhAf4xoAqnqKKlBQ2kNBDLIAGZtlUgNxJFBFsYgC4dBFj2DLBwG+TAXjNIAOmQBHTKiCaSqo7QGDGqALDKAWVslWoMjiyyMRRYOiyx6Flk4LPJhNhilAfTIAnpkRBNIVUdpDTjUAJlkALO2SrQGRyZZGJMsHCZZ9EyyGJjkQetXDeRjblHoxYsX5i9I35svlqvS/Anpnad/R32pvGnMpgt0zoiqjtK6QOeMaApp1taOVqb1zn14JIRs3rdQZfWQ6+XqQ6pnocWzAYxtf278w+OnfbnP1xP6UAEvxk4hnUGaQKognUO6gDSFNOso9eG9lgYXzTud+nfhiF0yfvJe55FS/hlK+Vip3998tIgE3qidQjqDNIFUQTqHdAFpCmnWUVoknxLpJ6OeS6TgDJEaT02cK64aalMCvccLaQKpgnQO6QLSFNKso7QSQaMEOIWFZ9Q8xAfGR3P+8t48lI+bveUIAe/kTiGdQZpAqiCdQ7qANIU06yitS3h6hIQTczPgOkB6Zlw05tamymy1u17nq4eismhSNxAS18YppDNIE0gVpHNIF5CmkGaQLjsaoYMlPuM9S9E4Xttt8Qtvmm+ui/X68Behdt7X1XrtfSq8a/3D6qaoihuv3KyfvNWtt78vvKr4z2Ox23urnfeQ3xR6cXO/5nHp3ZeP1c4rb73tOr82t3Bm8bLSTVx6i/Jr8aWofjz87rq3vba9w2Y35d5sutjsi2qf647eNJs9tLPz7vMvhV6i2OjuPTw8blbX+V4vtC8PCz3km8fb/Hr/WJnN625s9l6+uXlea7VZ7VfPS+tFt1V5Xeyeu/v8T73KaHe/2m6brq/2xcPu0vNmxbbcrfY7L68K3cPNT1Vx+7i5yT+ti0Pr1+uV7nBXt/u8utNbuS2r52aqyuz6bmWWvy2Kne7J9WP1XNfrwjtsZ2R2TW9hXRX5zdPzHtb9Km6eu1Xc/Js+cMBb11NIZ5AmkCpI55AuIE0hzSBddsN9DA4c2UtPZPOKNfmubEvJ4iI6gzSBVEE6h3QBaQppBumypbi4vZOPZLC4DBYX0BmkCaQK0jmkC0hTSDNIly3FxeVnnPJlEyzYPnj8IkveRd40/XX6NvE+/vpmlv4896a/XA5OwvfF+sZbrw6nueZcdlOs86edd/NYmFPufble3eif9Vm9yje7bVk9/1XBw1lxnX/SK+321epzYZZ42t6X+oryo3e7Lssb/f8ir/b3/3nMD/h2VRU/el/Ktb42rK69onrcHq5GP3r6dH44S8/Lmx8PDZt+rHWjl+TZsNl3y5gCdAZpAqmCdA7pAtIU0gzSZTcS4Jjq5TeyyT6I7Oiqo0RuMoV0BmkCqYJ0DukC0hTSDNJlR1EmI+XzActD9DebD4uZtmLbH/R7XxXb3NwzXD3R4x4mMxLkGDP3xt9s9b3Il8PGqZv3BG5dQTqHfVu4+zZ9vvv6sLrb5PrGj/qblinsQQZ7sGypzdj8Wtzqm2RzJ/dzeXROOhoKvWkUsk4lYvo485EXaikRss5gywlsWUE6h9tddNuljzPffprKWnp0mmoEaFoWVgW+XDJY+eCcq2YdT8TStplyl282uTfXR+JTSR+FAbz6BPbdnLm3n602n1eF9y7XIL+jj0OwfQXpHPZu0a1LfoIFtZzBlpfdfg+PviMFe3MvZJ1XxIGlUB/ytXZZybfi+nG/+kKdEa7aRiyXMjBdYubuwPvHSrtA4yi9X25vV9dFRasFp2wgOoc9XHSUfD6EWs5gy8tu36mPu2ijWhT7Wb7PX798KLQLnmqbv9NW/XFjjrXA2K7299r53z5/wmJy+J7E6ISZY2JyGJinzEwhmBye51PMNEmuFbGJ+VMyp+QN8ydLfX4g1uH+RHGSxOOJ+Xwz2Ts+OcyCJVio+xBSfTCPgyeHZ7MUizSKKOJr4pOEh7rnIbmO7p5P9k5qIkkS6L0NyL31hW5NkK1J3ZokiD7GJnokEmQuxGQuKGI+GjY5fA2Lqs9BdFp1oXthaVHEk4P1oqqn68rJugpdV0HWlY2NTGNyrUj3IqL32Nd7TI/yg+yk7qleK6XXirWGMamh0BoKesTqsh+efVKV0Gtxcq1Ik4gksd7bmKy5rjh51Pp6DZ9aw0wfnRzmclJHk97XkNrXN4xNdP3o9sxxxkkW62EUk1X1NfFJEuoqhHRVx6bnY7LnUhdckvVmzPTP1vfx5PCOCdV3PVhicuyxcTg5fDOGqtNkSfUv1QMiJY+aK2Yao9rK9JjMyDFpLtuTw4WVGkW63xF9zGh1I3Ik+7oPPn0MmgsDOcJiTWKShHrsheS+BrpvAd03rV9E68fl5DD9m9qSHkWhpULBZGq52kk9jCSl0pRxfR4lKxTpdSJqHX0eNadRuufmLMrpUa7bC8mRzMam5GOyslp2RaseaG0D+sg1w8g8uaV015vyyS2Ziyd57TQucnKweVT/9A6TNTdzJSaHKQDUGVFviz5/6AuKEnQl9EiS1EgyDnwyp/tnooHJ1NJ3rkcgp0bgGz0qrshRYdLBySG7oBTW7YUkibSKEaWiMX6TzHJcM3MJZeQ1VPdD99ByTQ4nh2eW1JjRYzAgx7S+U6S2s9BnsQWpYaZJZjm/MXP8kr27CnSNAstRb66gpB5XQo8y+lrt69O5Tx2LU30RSC3XAGauAeQRvNCHzsJ2L2H6x6j+GZM9WVpUjPVYj+l+jE0/xlQ/lrq6S7q6ga5FYDkD+pNDvkH23lxJLXfo+kxC3mub59KTw9NUar90OWJaybG5ex9TLS51fZeW+pqbK0bfXYX6+Amp6k61KCmpiXmNfnJ4p506HnUNI7IXgV4poI8drWNg8R1mfwV5FWGHyyl9PTUWjHZggSYBfZbWpwRaDzY243NMn5n0WiG9FjN9p6+AzBggRjsgqcWSlFYmQpvMLaNQ6v2S9N2rHp4+PTr1yYS8F1gEkyU9MnVbMdlWoNsKyKPK3L7Td++R7nNE++SxOc+NLWfhYHKY0UPtqx5JPjWSTDYymdPnEd2iPuPT6uoehvRo0eLS49LcqND3KVL3jnZ0sR4OMTka9FGtnu83Ri3avX65ze+Kd3l1t9rsvHVxu391Mb4ML7zqOTw8/Htfbg//8i+8T+V+Xz40P90X+U1RmZ/EhXdblvvmh9Fzux+K/ePWKysTXx8em726ME/Qqny1v/C2+baoPqz+LA5/tfReL/VnqRdbz7arVxeSxzIOQv588nrejjps4PXL8uZmcfjF6//KH7b/fnv47/zlqPu9WaRe+mSRppXiS7FpFh/1fzD/bhYa9X+4XVW7fbvK4KfDD+1Kw5+GnV8Xd/n106zKv5ro7NvDerOb6KLd7/fbyWi0u74vHvLdZbktNprdHiaI6R+ru1F5SNlm5fXjg67miI/Hwagq6hkt96vtTms2Wd28usg3T7svD+uD0F/L6vMhsHr9/wBQSwMEFAAAAAgAPEaXXAMcnPahAAAA/QAAABgAAAB4bC9jb21tZW50cy9jb21tZW50MS54bWxNjVEKwjAQRP89RcgB3KigUNJCQRChVCheILRbU2iSkl2hxzfQVv17szM7o9vgHHomMbvRUy4t85QBUGvRGdqHCX1y+hCd4STjC2iKaDqyiOxGOCp1BmcGLwtt3mxDpA2KsmkedV1WT3XQsN42SKl1uhqIv0JE7HN5O1ykWHL3LpdKCrJmwoULzTinD/7vz3bXk1JKQzJg8WGt/NGytCkqPlBLAwQUAAAACAA8Rpdck5pgpxkCAAC+BAAAIAAAAHhsL2RyYXdpbmdzL2NvbW1lbnRzRHJhd2luZzEudm1slVRNb9swDP0rhnat29htM1SJAwwdetsGbAN6LBSLidnIomExidNfP8lWvCSHrvPBlkmKH+89ad7VZjG3biJdpRow6kBbTrzROumthdi2Vrqyglq5tMayJUcrTkuqJa1WWEL8iHFP9t6eXW1E4mMkdFwI0MhiqI66Vs2FJ9GKVSEycbOY31y0GHblg4EPDYzV839WP0be/sdsqAvx0k3888L5JBdJSdRqh29QiDybTiZX/TuMditd4wfooxrFVSHqKzO42yHUDJ8ORByCW9pA8kpoHR+MT1kjQxumDu6QJFm3SiNY7gemTSF4qFWStVBygKAQrV9FrE6gOWH3Y7yeofQumxcoDV18OgMqTtSQQ0ayUi0dmS3DLKlVu0abGlixvH+4zu8bnkUbUyOz62DYo+ZKZnd3TTerANcVy88Pfv2WotXQyWy2Q4dLNMgHWaHWYEWyQmNKMtT6Zlb+gWzQnMcXuCbt+1FbpjNaXTbJp1GLYX/SJ8j/ZrgZcdS0T2L6pVHlRiS0dOW2BR1oiXE9a6HoGUOWLBwj2At9Sd0RodpRqjFQ6GFKlWHZ97iYa9wdY8IW78K1lQG28VzEVINeHk0Qyld/dD52KCKJ0JXgef+xfPUt/O67/U581Og32sEzcvUIxrgozF9e/pe2L77nJw/f4kkZB4MSR1sf8ZP2i2w6eMJ66NlroraLaI5/8Wcc5/QS8Otwcf0BUEsDBBQAAAAIADxGl1zzJMirqAAAAJUBAAAjAAAAeGwvd29ya3NoZWV0cy9fcmVscy9zaGVldDMueG1sLnJlbHO1kUsOgjAQhq/S9AAMuHBhwBUbt4YLTEopjX2lrQi3t0RBSFy4cTf/PL58yZRXrjBKa0IvXSCjViZUtI/RnQAC67nGkFnHTZp01muMKXoBDtkNBYdDnh/Bbxn0XG6ZpJkc/4Vou04yXlt219zEL2BgVs+jQEmDXvBYURjV2l2KIktgSi5tRdcD+JvToFXt8SGN2Fu1r+ZH+r1VZMNih2YKc0hysPvC+QlQSwMEFAAAAAgAPEaXXGn+a2nTKAAAhD0BABgAAAB4bC93b3Jrc2hlZXRzL3NoZWV0NC54bWyNnV1z2ziaRv+KyhdbM12ziUCABKlNpyqxAInwTHdvp2f2Wm3LHdXYlkdW0pP59QvI4pf65ZFuEttHJMHnBUEeQqLe/b7d/fPl83q9n/z78eHp5furz/v98+zt25fbz+vH1cub7fP6KZL77e5xtY+/7n57+/K8W6/uDgs9PrzNptPi7eNq83T1/t3hbz/t3r/bftk/bJ7WP+0mL18eH1e7bx/XD9vfv79SV80fft789nmf/vD2/bvn1W/rT+v9359/2sXf3rZruds8rp9eNtunyW59//3VBzX7UVVlWuLwkn9s1r+/9H6e7LfPf13f76/XDw/p1cXV5D/b7eOn29XDOm7JZL3ff0j783D6109pVX9dfYvNTyuMWE97+KfYzj4ty6tJyu/X7faf6S/13fdX0xTD+mF9u0/tXsX/vq5fG3St0t7/67Ar8edZrcxVu7tp8f7PzX75Q+4xx19XL+vr7cP/be72n+OWryZ36/vVl4d997fqjZpW2uYt+nn7+3J9jNm8OWzsdvvwcvh38vvrQsUbY5SZFllc7PbLy377eFxbauv+2yG4q8nj5un1/9W/jyXrrULlb4rislVkx1VkJ6so3pRlYVVpz69CH1ehT1aRX74Kc1yFOVmFaQM8s4L8uIL8Dyu4OMziuIriZBX2TZ6b4pK9sMc12NM1nF2yPC5ZnRZyenEh1bTpDKe9obo0RNV0BlXo8vVIeO2dh34/X+1X79/ttr9PdmmRuIn0w4e0mrTR6moSe3Uact7eHtnHI7PFH9k1sDkwB8wDWwBbAquBBWA3Mnsb82tDzNoQs/EVfQR2DWwOzAHzwBbAlsBqYAHYjcwGIeo2RA0hArsGNgfmgHlgC2BLYDWwAOxGZoMQTRuigRCBXQObA3PAPLAFsCWwGlgAdiOzQYh5G2IOIQK7BjYH5oB5YAtgS2A1sADsRmaDEIs2xOL1xdn08OLNU7p6/bTfRb6Jp6T9+//9+4+/fPil/vGHd2/3cSXpj13Kx4WtFVIGNgfmgHlgi4aVQsrNTiohZVhnAHYjb2+Qsm1TtscXS6dvC10V2ByYA+aBLY6snAohwj7UsM4A7Ebe3iDEsg2xPL5YqOLHhmVCiMDmwBwwD2zRMC2ECPtQwzoDsBt5e4MQqzbE6ngoCI37eGTxovSPIQKbA3PAPLAFsCWwGlgAdiOzQYhq2l2OTyHGBoo5EpwTdAQ9wQXBJcGaYCB4MwKHgfb8phGccuQ8dP2wWT/tJz+sHtcz6VTUrKDMpdCP0AjlmrdLiqED9AQXBJcEa9qVcDaoKJBiQjcjIQwr0smSOlqB0mMV2T4+r56+QUkyKklGJcmoJAA9wQXBJcGadiW0SY2WZP2w+brefZPLIgcxLEunX0qfLcvTfnW7n8zX+9Xm4UWujKbKaKqMpsoA9AQXBJcEa9qVcIRmJKp/rB42d5v9SF3kGIZ1iWtOdxkz86Zq7vu83rj8Pt3uef1DeyvysL7uylsZ7jbpvvTs5Xl1u/7+6nm3flnvvq6v3n+4u4s/v8wmYl0N1fUIM/FekKG6AvQEFwSXBGuC4Qjzkbr+tPr2mE4Wv6x3j+IBcNOsHYvbmabK6XTf+JZkQQTnBB1BT3BBcEmwJhgI3ozAYaC9vt/Yk+TuBK8Jzgk6gp7gguCSYE0wELwZgcNAO8FUjUkJgvCR4DXBOUFH0BNcEFwSrAkGgjcjcBhoeRzP7Zvij8N3m/VRuKZj5/t6v36c/LB9Iw7RFy08X7/c7jbPaSpNWMl1sxJZIgA6gr6Fwuljcbbhnzb/WU/eTq63D9ud0Ojl2RX87/6bsFx9drm/P232woLhogUnP+02t+vJn35a/vRn8UxxbiUfHrdf4rlGWMGwa3UKrl5dsxpZ4VSJ/eYoqFPh9su1Ijsn6Aj6For94RUa6X5bs6B0lwNYaJiwvZsjy5KE37+PL/0ububd2/v3777Gl30VIs86X8+mHHkmRX5cSI48I48n6Aj6FkqRH6EYebOgFDmw0DAp8iNrIs+m38XNcOTdKJkpjlyLkSuKHKR5TtAR9Bno9uIIjdCeZbOgGPk4Cw0TI1fDyFWMXHHkvfnNjCM3YuQZRQ5SPCfoCPoMdHpxhHLkGUQ+zkLDxMizYeRZjDzjyDsdzzRHnouRa4ocbHdO0BH0GXjy4gjlyDVEPs5Cw8TI9TByHSPXHHk3d5oZjrwQIzcUObjmnKAj6FsoRm4gcgORj7PQMDFyM4zcxMgNR56/XgyrfPxSOMu5FlasRU61yKkWAB1B30KxFjmcV3OoxTgLDRNrkfdr8envf/tTfHmsR/5nLkhxQUEKLkgpFqSgghRUEICOoG+hWJACClJAQcZZaJhYkGJ4cBSxGAXXwl5QC8u1qMRaWKqFpVoAdAR9C8VaWKiFhVqMs9AwsRZ2WAsba2G5FuUFtSixFmoq1qKkWpCDE3QEfUYOfoRyLUqoxTgLDRNrUQ5rUcZalFyL6oJasP8q0X8z8t8GyrUg/yXoWyjWAvy3WVCsBfhvw8RaDP03i/6bsf+mt3Cfq4VmMVaiGGsSY01iTNAR9JrEWIMYaxBjYEGDGOuhGOsoxprFWKsLasHGrERj1mTMmoyZoCPoNRnzEcq1AGMGFjQYsx4as47GrNmYdWfMmo1ZicZ8XOjwEYk/Rk7GTNAR9JqMWY+b7xJYDSxoMGY9NGYdjVmzMWt9QfdnlVaiSh8XGqkFqTRBR9BrUmk9rsRLYDWwoEGl9VCldVRpzSqtzQW1YMdWomMfFxqpBTk2QUfQt1CshYGhCBwbWGiYWIuhY+vo2JodW3dzzJpVWokqfVxoJHJSaYKOoG+hGDmodLOgGDmodMPEyPNh5FGjdc6RX2DRmi1aiRatyaI1WTRBR9BrsmgNFq3BooEFDRathxato0VrtmjdTWBrlmUlyvJxoZHuT7JM0BH0mmRZgyxrkGVgQYMs66Es6yjLmmVZd++n1uzEmejEx4VGIicnJugIek1OrMGJNTgxsKDBifXQiXV0Ys1OrLupX83qm4nqe1xoJHJSX4KOoNekvhrUV4P6Agsa1FcP1VdH9dWsvqab+jVsuJlouMeF5MgNGS5BR9AbMlwzbqpLYDWwYMBwzdBwTTRcw4ZrutOnYZHNRJE9LjQSOYksQUfQt1CMHN40vjTjtloDCw0TMx+arIkma9hkTWeyhk02E03WkMkaMlmCjqA3ZLIGTBZYDSwYMFkzNFkTTdawyZpu7tewsGaisBoSVkPCStAR9IaE1YCwAquBBQPCaobCaqKwGhZW0/vcLHtpJnqpIS9toBw5eSlB30Ix8nG/XAKrgYWGiZEPvdRELzXspabzUsNemoleashLDXkpQUfQG/JSM+6XS2A1sGDAS83QS030UsNearp3RxvWz0zUz+NCI5GTfhJ0BL0h/TTjGrkEVgMLBvTTDPXTRP00rJ+m00/D+pmJ+mlIPw3pJ0FH0BvSTzOukUtgNbBgQD/NUD9N1E/D+mk6/TSsn1rUT0P6aUg/CTqC3pB+mnGNXAKrgQUD+nlkh/dDpcijfhrWT9PppzmKlLDij0emjBDBdQPFj7EQdAQ9wUXTWPHZE+M7UgMLDZM+wtIw+EB/3mllfhQk6RP9eWOPUpQNlB8/AdAR9AQXDRSNHfakBhaOTAs9+KZh8FmLvPPFXEGWirKERwPNCTqCnuCigXKW43tSAwtHJmepzmfZeWCeQZYZZUlPOSLoCHqCC2jsElgNLByZHGV2PsrO73INUWqKkp51RNAR9AQX0NglsBpYODI5Sn0+ys7bcvY2Ld73zMnbcvI2go6gz8nbcvA2YDWwkIO35UNvy6O35extee/pSOxtWrzvmZO35eRtBB1Bn5O35eBtwGpgIQdvy4felkdvy9nb8s7bcvY2Ld73zMnbcvI2go6gz8nbcvA2YDWwkIO35UNvy6O35exteedtOXubFm975uRtOXkbQUfQ5+RtOXgbsBpYyMHb8qG35dHbcva2vPO2/Iy3ibc9c/K2nLyNoCPoc/K2HLwNWA0sHJn0lICbfDhtmEdvy9nb8s7bcp421OJtz5ymDRsoR07ThgR9C8XIx6f/lsBqYOHI5MiH04Z5FSPnacOi87uCpw21eNuzoGnDBoqRE3QEfQulyBsoRQ6sBhaOTIy8YcfIi+l3cTMceaeBBU8bavG2Z0HThg2UI6dpQ4K+hWLk47N/S2A1sNAwaSwvhrOGhYqR86xh0dliwbOGWrztWdCsYUGzhgQdQV/QrGEBs4bAamChgFnDYjhrWGQxcp41LDqrLHjW0Ii3PQuaNSxo1pCgI+gLmjUsYNYQWA0sFDBrWAxnDQsdI+dZw6Kzz4Lt04j2WZB9NlCOnOyToG+hGDnYJ7AaWGiYGPnQPotonwXbZ9HZZ8H2aUT7LMg+C7JPgo6gL8g+C7BPYDWwUIB9FkP7LKJ9FmyfRe9JvmyfRrTPguyzIPsk6Aj6guyzAPsEVgMLBdhnMbTPItpnwfZZdPZZsH0a0T4Lss+C7JOgI+gLss8GSg/9LcA+gYUC7LMY2mcR7bNg+yw6+yzYPo1onwXZZ0H2SdAR9AXZZwH2CawGFgqYNSyG9llE+yzYPovOPgu2TyPaZ0H2WZB9EnQEfUH2WYB9AquBhYaJkQ/ts4j2WbB92s4+LdunEe3Tkn1ask+CjqC3ZJ8W7BNYDSw0TIrcDu3TRvu0bJ+2s0/L9mlE+7Rknw2UIyf7JOhbKEYO9gmsBhYaJkY+tE8b7dOyfdrOPi3bpxHt05J9WrJPgo6gt2Sfg704SRzkE1iwIJ92KJ82yqdl+bSdfFqWz1yUT0vyaUk+CTqC3pJ8WpBPYDWwYEE+7VA+bZRPy/JpO/m0LJ+5KJ+W5LOBcuQknwR9C8XIQT6B1cBCw8TIh/Jpo3xalk/byadl+cxF+bQkn5bkk6Aj6C3JpwX5BFYDCxbk0w7l00b5tCyftpNPy/KZi/JpST4tySdBR9Bbkk8L8gmsBhYsyKcdyqeN8mlZPm3vO2VYPnNRPi3JpyX5JOgIekvyaWHqE1gNLFiQTzuUTxvl07J82k4+LctnLsqnJfm0JJ8EHUFvST4tyCewGliwIJ92KJ82yqdl+bSdfFqWz1yUT0vyaUk+CTqC3pJ8WpBPYDWwYEE+7VA+bZRPy/JZdvJZsnzmonyWJJ8lySdBR9CXJJ8lyCewGlgoQT7LoXyWUT5Lls+yk8+S5TMX5bMk+WygHDnJJ0HfQjFykE9gNbDQMDHyoXyWUT5Lls+yk8+S5TMX5bMk+SxJPgk6gr4k+Sxh6hNYDSyUYJ/l0D7LaJ8l22fZ2WfJ9lmI9lmSfZZknwQdQV+SfZZgn8BqYKEE+yyH9llG+yzZPsvOPku2z0K0z5Lss4Fy5GSfBH0LxcjBPoHVwELDxMiH9llG+yzZPsvOPku2z0K0z5LssyT7JOgI+pLsswT7BFYDCyXYZzm0zzLaZ8n2WXb2WbJ9FqJ9lmSfJdknQUfQl2SfJdgnsBpYODLxzVrl0D7LaJ8l22fZ2WfJ9lmI9lmSfZZknwQdQV+SfZZgn8BqYOHI5MiH9llG+yzZPsve95+yfRaifZZknyXZJ0FH0JdknyXYJ7AaWCjhjbfl0D7LaJ8l22fZ2WfJ9lmI9lmSfZZknwQdQV+SfZZgn8BqYKEE+yyH9llG+yzZPqvOPiu2z0K0z4rssyL7JOgI+orsswL7BFYDCxXYZzW0zyraZ8X2WXX2WbF9FqJ9VmSfDZQjJ/sk6FsoRg72CawGFhomRj60zyraZ8X2WXX2WbF9FqJ9VmSfFdknQUfQV2SfFdgnsBpYqMA+q6F9VtE+K7bPqrPPiu3TivZZkX1WZJ8EHUFfkX1WYJ/AamChAvushvZZRfus2D6rzj4rtk8r2mdF9tlAOXKyT4K+hWLkYJ/AamChYWLkQ/uson1Wf7DPw0t/aFYj7NOPMhuWqrPWiq3VitZakbVWZK0EHUFfkbVWYK3AamChAmuthtZaRWut2FqrzlortlYrWmtF1lqRtRJ0BH1F1lqBtQKrgYUK5kyrobVW0Vorttaqs9aKrdWK1lrRV7JUZK0EHUFfkbVW8JTZCqwVWKhgzrQaWmsVrbVia606a63YWq1orRVZa0XWStAR9BVZawXWCqwGFo4sE9hNNbTWKlprxdZaddZaHf1LenBF1cipEMF1A8UHVxB0BD3BBTR2CawGFo5MfHBFw+hrgKedjqafR8NsoJxmS+XvqibqkHqkC2rykmBNMDRQTLWFGKs6/+j1w4sOkQqj28eWyt8NTnSO1CH1SBdIl0hrpAHpzRg9ST3rhQtPB2qg+GSj65aOZEsPCELqkS6oyUuCNcHQQC3dMmwhXDqrqe7FenwYjnDm+NhAJX3V43VL5a9fJ+qQeqQLavKSYE0wtFDurkdoKVbTi/WMPop3X5ul5GuHlooXD0gdUt9R6fqhpdIFBMGaYGihdNnWwPYrs6fRJNWUJzLVNO8V4IwUivdim6XGCkBaiNQh9R2VCwBqSLAmGFooFyA/KUCeCsCCqKZFrwBnFFG8M9ssNVYAkkSkDqnvqFwAEEWCNcHQQrkAxUkBilQA1kU1tb0CnBFG8T5ts9RYAUgZkTqkvqNyAWCyk2BNMLRQLoA9KYBNBWB5VNOyVwDWx1K8a9ssNVYAEkikDqnvqFwAkEiCNcHQQHH2s4VtAcpUAFbJdKejKwBPgZbiPdxmqbEC0CQoUofUd1QuAEyEEqwJhgaOFKA6KUCVCsDToUr1BFTxhGgp3pltlhopQEPlAhB1SH1HxQI0VCwAwJpgaKBcgAY2BVDT79K2zhSgZ6SKp0dL8T5ts9RYAWiCFKlD6jsqFwAmSQnWBEMLxXOAUicFUKkAPFWqVM9aFU+WluJd22apsQLQdClSh9R3VC4ATJkSrAmGFsoFyE4KkKUC8MSpUj2/VTx1Wor3cJulxgpAk6dIHVLfUbkAMIFKsCYYWigXQJ8UQKcC8DSqUj0TVmzCpWzCCk24oSMFQBMm6jsqF4BMGGBNMLRQLsCJCatkwuqMCaueCSs24VI2YYUmrNCEiTqkvqNyAciEAdYEQwvlApyYsEomrM6YsOqZsGITLmUTVmjCCk2YqEPqOyoXgEwYYE0wtFAuwIkJq2TC6owJq54JKzbhUjZhhSas0ISJOqS+o3IB4IlHLZQLQCasyITViQmrZMLqjAmrngkrNuFKNmGFJqzQhIk6pL6jcgHIhAHWBEML5QKcmLBKJqzOmLDqmbBiE65kE1ZowgpNmKhD6jsqF4BMGGBNMLRQLsCJCatkwuqMCWc9E87YhCvZhDM04QxNmKhD6jsqFiAjEwZYEwwtFAuQnZhwlkw4O2PCWc+EMzbhSjbhDE24oSMFQBMm6jsqF4BMGGBNMLRQLsCJCWfJhLMzJpz1TDhjE65kE87QhDM0YaIOqe+oXIDx5ya1S8r5kwhnJMLZiQhnSYSzMyKc9UQ4YxGuZBHOUIQzFGGiDqnvqJw/iTDAmmBooVyAExHOkghnZ0Q464lwxiJcySKcoQg3dKQAKMJEfUflApAIA6wJhhbKBTgR4SyJcHZGhLOeCGcswpUswhmKcIYiTNQh9R2VC0AiDLAmGFooF+BEhLMkwtkZEc56IpyxCFeyCGcowhmKMFGH1HdULgCJMMCaYGihXIATEc6SCGdnRDjriXDGIlzJIpyhCGcowkQdUt9RuQA0JQywJhhaKBfgRISzJMLZGRHOeiKcsQirqWzCGZpwhiZM1CH1HZUrQCYMsCYYWihX4MSEs2TC2RkTznomnLEJq6mswhmqcIYqTNQh9R2VK0AqDLAmGFooV+BEhbOkwtkZFdY9Fdaswmoqu7BGF9bowkQdUt9RsQKaXBhgTTC0UKyAPnFhnVxYn3Fh3XNhzS6sprIMa5Thho5UAGWYqO+oXAGSYYA1wdBCuQInMqyTDOszMqx7MqxZhg/vdJQqgDas0YaJOqS+o3IFaF4YYE0wtFCuwIkO66TD+owO654Oa9bhw1sdpQqgD2v0YaIOqe+oXAHyYYA1wdBCuQInPqyTD+szPqx7PqzZhw/vdZQqgELc0JEKoBAT9R2VK0BCDLAmGFooV+BEiHUSYn1GiHVPiDUL8eHNjlIF0Ig1GjFRh9R3VK4AGTHAmmBooVyBEyPWyYj1GSPWPSPWbMSHdztKFUAl1qjERB1S31G5AqTEAGuCoYHyO+T0iRLrpMT6jBLrnhJrVuLD2x2lCqATa3Riog6p76hcAXJigDXB0MCRCpw4sU5OrM84se45sT7jxEp2Yo1OrNGJiTqkvqNyBciJAdYEQwNHKnDixDo5sT7jxLrnxPqMEyvZiTU6sUYnJuqQ+o7KFSAnBlgTDC2UzwMnTqyTE+szTmx6TmzOOLGSndigExt0YqIOqe+oWAFDTgywJhhaKFbAnDixSU5szjix6TmxOePESnZig07c0JEKoBMT9R2VK0BODLAmGFooV+DEiU1yYnPGiU3Pic0ZJ1ayExt0YoNOTNQh9R2VK0BODLAmGFooV+DEiU1yYnPGiU3Pic0ZJ1ayExt0YoNOTNQh9R2VK0BODLAmGFooV+DEiU1yYnPGiU3Pic0ZJ1ayExt04oaOVACdmKjvqFwBcmKANcHQQrkCJ05skhObkUdQtasSdu7HEXhSu55NmzM2rWSbNmjTBm2aqEPqOyrXjmwaYE0wtFCu3YlNm2TT5oxNm55NmzM2rWSbNmjTBm2aqEPqOypXgGwaYE0wtFCuwIlNm2TT5oxNm55NmzM2rWSbNvSYqpaOVABtmqjvqFwBeFZVu6hcAbJpQzPM5sSmTbJpc8amTc+mzRmbzmSbNmjTBm2aqEPqOypXgGwaYE0wNFB8elUL2wokmzZnbNr0bNrAI6waOPLUpYbKD6oh6pB6pAtq8pJgTTA0UH7qUgPpqUt5T5FzephVjg+zaqgcK1GH1CNdUJOXBGuCoYFyrA3EWNUFD7PKG7MVH2bVUPlhVkTnSB1Sj3SBdIm0RhqQ3ozRk9R7rpvTw6xyfJhVQ0eyxYdZEfVIF9TkJcGaYGig/DCrBtIleN4T2JweZpXjw6waKj/MiqhD6pEuqMlLgjXB0EK5u17wMKu8Z6X5qwkdRwLpokK+QZyjluaglnOkDqnvqHhRkY/L5ZJgTTA0UL6oaJM4XlTkSUvzM1O1eU8u8/xcCeQ7xDnaZY52SdQh9R2VS0B2CbAmGBo4UoL8pATJLvMzdpn37DIv+iU4HVwac8pGCvTdd99NftjuP2+efpv47cPD9veXSfybULTrZmVjYxFQh9R3VBhuFy3NrVgXoDXS0GYnDL037aKahqOeZOaWCoETszmqJFGH1HdU7vA0MQuwJhhaKKpkmwTF2jPHvKRYGysS2nHd0LEOC9Qh9R2VOyz5IcCaYGiTkHtreUGsPR3MK4q1wlgrjBWoQ+o7KsdKU6gAa4KhTUKOtTofa9HTwWIKsRZTirWYUqxEHVLfUTHWguZFAdYEQ5uEGGuzJMbas75CUaw42dlQeWwl6pD6jopja0PlWGmy8whzYXdCu6Q4trZJUKw93ysyihVnMBs6EivOYBL1HZVjpRlMgHUDR2KlGcw2CYq153uFpliP3iXfVC5ganGO1CH1HZVjfaWShC7bReVYaVqygXKs+oJYe75XGIrVYKwodUQdUt9ROVZDsZLUAQwtlGM1F8Tac7gip1hzjBVFjahD6jsqx5pTrCRqAEML5VjzC2LteVlBXlY0XiZfCaBoEXVIfUflKwGa2wNYEwxtEvKVwAWWVfQsqyDLKizGajFWoA6p76gcK1kWwJpgaJOQY73AsoqeZRVkWQVaVoGWRdQh9R2VYyXLAlgTDG0ScqwXWFbRs6yCLKtAyyrQsog6pL6jcqxkWQBrgqFNQo71AsuyPcuyZFkWLcuiZRF1SH1HxVgtWRbAmmBokxBjtRdYlu1ZliXLsgpjVRgrUIfUd1SOlSwLYE0wtEnIsV5gWbZnWZYsy2YYa4axAnVIfUflWMmyANYEQ5uEHOsFlmV7lmXJsqzGWHFWjahD6jsqx0pv/gRYEwxtEnKsF1iW7VmWJcuyBmM1GCtQh9R3VI6Vps4A1gRDm4Qc6wWWZXuWZcmybI6x5hgrUIfUd1SOlabDANYEQ5uEHOsFlmV7lmXJsixalkXLIuqQ+o7KseJ0liXNAhjaKORcL9As29MsS5plUbMsahZRh9R3VM7VYq7kWQBDG4Wc6wWeZXueZcmzLHqWRc8i6pD6jsq5lpgriRbA0EYh53qBaNmeaFkSLYuiZVG0iDqkvqNyrhXmSqYFMLRRyLleYFplz7RKMq0STatE0yLqkPqOirk2VM61JNUCGNooxFzLC1Sr7KlWSapVomqVqFpEHVLfUTlXhbmSawEMbRRyrhe4VtlzrZJcq0TXKtG1iDqkvqNyrhnmSrIFMLRRyLleIFtlT7ZKkq0SZatE2SLqkPqOyrlqzJVsC2Boo5BzvcC2yp5tlWRbJdpWibZF1CH1HZVzNZgr6RbA0EYh53qBbpXt+8b9dve4iq87Dh79vI+fhntt+x/fD/fpy6/77X71MBPftljCnNU10jlSh9QjXSBdIq2Rho6KM2INTTp2//7T3//2p/i38q16o7I/8/sXy+KCShVcqX98+GWkSPDptmukc6QOqUe6QLpEWiMNHZWLVEhF+u9UvXNFshcUqTFBYaT42NCxSuCbHok6pB7pAukSaY00dFSuhG0qAUNYeUHmJR8Yv6Txa/LhcfvlaT9yhMBn366RzpE6pB7pAukSaY00dFSuS/nHI6SapVPOuQOk559lo3pjVZlvXm4fVpvH9W6kJs0n4YSz6jXSOVKH1CNdIF0irZEGpDcdLeFgqaYXfF6salxx7CMK302uV0+364eH1X6zfXqZ/L55eJj8up7cxl82d+vd+m6yfXr4NtncT/af15Pd+l9f1i/7yeZl8ri6W8eXpzfPTzIz+bz9snuZbO8nzw+r2/R++vTy7S6u4s1kuf19/XW9+8vhb7e97bXrO2z2abtPm14/7de7/So29K7Z7GE9L5PPq6/r+Ir1U2ze4+OXp83tah9ftN8eXvS4evpyv7rdf9mlzcdmPO0nq6e716U2T5v95vXV8aXPu+3t+uW1ua8/xkXevnzePD83Td/s148vbyaT+fp5+7LZv0xWu3Vs4dN/79b3X57uVr8+rA9rv33YxAZ3uX1e7X6LW7nf7l5Xs9ulXX/ZpNffr9cvsSW3X3avud6uJ4ftvE27FrfwsFuv7r697uGxXeu712at7/5HPHCaAssf+SM6R+qQeqQLpEukNdKA9Kbr7lM6cPrHx/EEY8XP/LVUDhfoHKlD6pEukC6R1kgD0puWcri9uxFVhuHCBxuvkc6ROqQe6QLpEmmNNCC9aSmHqy8Z8pvbAmNPG/guuL+Vk+v65+u/uskvP3+Y1z8sJtc/vhkMwp/XD3eTh81hmGvGsrv1w+rby+TuyzoNuZ+3D5u7+Hsc1Xerp5fnbRyzD2N6GhUfVr/GhV72u80/1+kV354/b+MZ5S+T+4ft9i7+v17t9p//9WV1wPeb3fovk6/bh3hu2NxO1rsvz4ez0V8mcTg/jNKL7d1fDitO7XiIK30jj4Ya+xTQOVKH1CNdIF0irZEGpDddT8A+1bu2rpo7H8Idio8dFe6aXCOdI3VIPdIF0iXSGmlAetNRuidT5a8HbGbfFHTIHm8lVNORQ/an3fp5la4ZPn6T+z3emangPsb8/MY/PMdrka+HjUsX7w637pEusG3L8227fr36+rT57WkVL/zWQvtqbEHAFty0dExsfl7fx4vkdCX3w/ZkTDrpCr1p++p4V6KSj7OCXKilwj3TOa7Z4Zo90gVud9ltVz7OivFhKrT0ZJhqCtCsGY8ze8mJ8XgHojIjtfz0OXnJ5OeoFfe7ZCHysWbxHGPHd2Z+vgnh57/Jhxhs1CNdYJOW3bLiUyJozQHXfNPtbE6V6707oDreiqiKsQKtHqJAuX+vb7/sN19HygNz/dcdFe7Yzc834Kcvuyh4SRYnP97fb27XO7la+H4Dogts4bKj4gQDrTngmm+6fZeePxEddL3ez1f71ft3j+souNfxSHmJFv7lKR1jVboV1P49Sv19qsS0mPn4z9VbgWXV7PA1OgIr1czH3RNIls98lkukms58PEeIW8pmhy+OFJiNW7LiluKpYnaYCJKYjoulLxsRWF7OfF7Ka0wrFPfKxr2y4tpi03Ox5fGImx3eCCAwE5cy4lJFXKiQU7JpfXaEpVpZsVYqj41PU2FSO2KERkrwWplZrcRscx33WItbKlJvKqTe9EFN1ewm/iMtp2MrtFxHldao5P5pU6+xYopZrGQmVlLHMLSYhbKpP1m5HdPUNaZyrykSKySWngU1OzzkSDqG4uZGeq+JEadHooqJpK3JvbSKgVRiHjp2HS33nHQ4KPl4yOJSmbyUTi3UcgtT51Zy706HhHxEVDGNSk4jHRJKPCbSVdrscLklMj07KIDY/nx2+FoMYblqdiMfR+lgUeLRku7hzg73B6TjJS6Wy61Ig6USR8sPSs1ircURMcYr93qVDiQlHknpxD07nFrFdqTRMpNHy3gA5uLxF6P3YvLpQ26zwyfOpNbHYo6MYdOUxlQ8d6QDYuR4sGmEsHI7VNovOUWVOreSe3eMyotJpSnf2WE6U2x/2uuptNcf4igg7peyaZ+tyNKwLY/aZWxfKVfSpKPZiKyM/aaU+02RjthCZukErEbOwOmkM3KspKoYKacks7ODU0rJxzVW0hrTPO7sMH0prrGcLUb6dhrU5TE9DdviqP2xjL2tlHpbkoPZ4WJd7FHp6MtGjj47u5aXu1ZZPNPK1z4xRLFnx7NpOpmKR0rsUEbMtoyklEgyw1kYGxtsGumtfOxlqcqZeDSkji33azVN3WYq9hsT+7wR001ddKSHmtRDjTx6xU3lI1dF6fjPxQzTxaN87Zi6tdir0wNpZoenw0jn0bg+eXTVcSE90r50TMpXlukgl49xVaQsCvlo1alaWmp9MvjZzUgPyGIHyEbO9Gn0knubSoqgREf4EHv8x5EeH7cl9rV0m2kWRkaNODR4cWRIz0eeHR5WLPbsNFbakTNiYuIV5Id4ZfxRvjJW6eJSjVxdpkFFiaPKxyLGWIhXAcVsMVLnNNYUI61IPXGkV6m0nNz6IjawGDnOU9vlPpA6ldin0kMMZ4cnCkrHZTz4xGPvOp6y65EztkpHrDzqqdR4NdJ6nWqp5RxVWk6Jy1WxA1dyS6apJdOR6+l0lIlXTOl9MbPDWz3EM0sxW8hXsukRF7PD8yZEw4gHrjxixoaILpa+/WZ2+Coa6WiPw45s4kqlVij5vB1jrEbGiNQbzcgYl9aYj5wl0vg3lVqS7sXPrkfGApVUR4mucx2LXcu1tvHAtfK1Vkxx5HpPpaN9JPuI5OvfNECPjc9pj/VI9ilF8VorvbFndng7ilTNuJh8B6eIpJCrki4UlXylmA6lkSNpmo6kqZxuXEoeZ5OGiRYW9zi1Qj5LqHQ7Rsn3Y1LXlnt26ohyP0zdUO6F6ZJOvKJbxvOluEdpYJbH5dhpvdxnk0zLLh1L6+XKqmkaXafyGSB1ZyX35zz2P/l+hEpdQol94kM8cj6OHDlxIfm+U+rOcm9Ol43yVWO6lJOv5OIFtB+57k43pJR4Ryq9mXp2eI9wZG9b+PL+3fPqt/XfVrvfNk8vk4f1/f77q+kbezXZvU5IHH7eb58PP+VXk1+3+/32sfnt83p1t96l3/TV5H673Te/vH1d76f1/svzZLtLs16H2fbvr9LE+2612V9NnlfP692nzX/Wh28a+Bxf9Z9tfNnD/Hnz/ZXJKlMVNnsdSl+34w8beP9ue3e3PPzh/X+tHp//56+Hfxfv3nZ/Ty85vvoPL2nWsv66fmpe/rb/S/q5edHb/i/3m93Lvl1k8Nvhl3ah4W/Dxr/9fbv75+H+9Pv/B1BLAwQUAAAACAA8RpdcZ5QOtsgyAACPkQEAGAAAAHhsL3dvcmtzaGVldHMvc2hlZXQ1LnhtbI2dXXcbN5pu/wqXL87qzumxCaA+NYnXiqUCCag7nel0zzm3jEXHWi2JaopOJv3rp0ATRLH8YsM3ia3NKhafp742QJW//W23/+fLx+32sPifx4enl+9efTwcnq/evHl5/3H7uHl5vXvePo3kw27/uDmMf93/8ubleb/d3B0Xenx4o5fL5s3j5v7p1dtvjz/7cf/2292nw8P90/bH/eLl0+PjZv/7u+3D7rfvXqlX8Qd/u//l4yH84M3bb583v2x/2h7+8fzjfvzbm/Na7u4ft08v97unxX774btX36urW111YYnjS/77fvvby+TPi8Pu+c/bD4fr7cNDeLVuXy3+vds9/vR+87Ad36rSk7//ED7Qw/ynP4V1/Xnz+7j9YY0jNssJ/nHc0CntuleLEODPu90/w0/c3XevliGH7cP2/SFs+Gb836/buEVVP37+f50+TNVf/X97E352/tBhHdM/x09nj+mPaf68edle7x7+3/3d4eP49q8Wd9sPm08Ph/Sz/rVa9qatz+hvu9/W21PY1esqvNn73cPL8b+L3z4v1LyuKlUtGz0u9v7Ty2H3eFpb6Ovw+zG9V4vH+6fP/9/8z6m4ySpU/bppvm4V+rQKPVtF87rrmlZ1bXkV5rQKM1tF/fWrqE6rqGarqM4BFlZQn1ZQf7GCrw6zOa2ima2ie13XVfM1n6I9raGdraEtLtmdluxnS/Zf3aNaxn1hOd8Zll+/kvMONd+j+q8tQsUdSjWmO9b55vMefjx2bjaHzdtv97vfFvuwyPgW4Q/fh9WENx2PyPHICCevN+9P7N2Jtc2X7BrYDbABmAW2ArYG5oB5YLcyezPmdw5Rn0PU+RW9A3YN7AbYAMwCWwFbA3PAPLBbmV2EaM4hGggR2DWwG2ADMAtsBWwNzAHzwG5ldhFidQ6xghCBXQO7ATYAs8BWwNbAHDAP7FZmFyHW5xBrCBHYNbAbYAMwC2wFbA3MAfPAbmV2EWJzDrH5/GK9PL74/incB/902I/8frwkHd7+1z/++vfv/+7++sO3bw7jSsIPU8qnhdtWSBnYDbABmAW2iqwTUo4fUp3Zr2/HVzbfvvl1Gjis3gO7ld/6IvD2HHh7erF0JW9hrwV2A2wAZoGtTqxbCnnCZ3CwTg/sVn6/ixC7c4jd6cVKCDEyLYQI7AbYAMwCW0VmhBDhMzhYpwd2K7/fRYj9OcT+dFQIG/fuxMb70y9DBHYDbABmga2ArYE5YB7YrcwuQlTLdGe+hBgjFHMkeENwIGgJrgiuCTqCnuBtBl4GOlGd6Dpd5pJ0/XC/fTosftg8bq+kq1JcQVdLoZ9gJdR1c15SDB2gJbgiuCbo6KP4YlCjS4oJ3c5CEJbcvn+9WOo/6aVWlyu4bC25lTpJhMqt8nr3+Lx5+h1q01Sbpto01QbQElwRXBN09FH8OalsbduH+1+3+9/l6nShOrM47Bb14mbz+ws1l4ROmWJzT4fN+8PiZnvY3D+8yOUZKi9CcRTCUHkALcEVwTVBRx/Fn2CVieq/Nw/3d/eHTHWmVN3yP0q1jW8chkZ19bqPA02fR1u/C+NLn39wHj89vl261VcV73hhSP3q5Xnzfvvdq+f99mW7/3X76u33d3fjn1+uFmLtFdV+glqsvaLaAVqCK4Jrgo6gP8E6U9yPm98fwyXp79v9o3h83Ma1Z7u//usN9Z6sV9V0vxHdTzIygjcEB4KW4IrgmqAj6AneZuBloJPDIuqbNI5A8JrgDcGBoCW4Irgm6Ah6grcZeBloMlwVVU4wlHcErwneEBwIWoIrgmuCjqAneJuBl4F2p1N9+7r58sx+zvpkfMvczYQ7bB8XP+xei2fvr1r4Zvvyfn//HOYHhZVcx5XIFgNwIGjPULiyrIob/tP9v7eLN4vr3cNuL2z0uriC/zr8Liznisv94+n+ICzov2rBxY/7+/fbxR9+XP/4R/EiUlrJ94+7T+NlSFjB5a6VxgDUZ9ntMytcKnG/ORmyEcZ/rhUNDxAcCNozFPeHExSGUtbAHDAfmfB+tyemwyjAh7fjS78Z3+bbNx/CuOJ5TPFyEioNGOglR66lyE8LyZFrGkggOBC0ZyhFHqEUOTAHzEcmRX5iMXK9/GZ8G448nSW14siNGLmiyMHabwgOBK0G319FKEaeZw6Yj0yMXF1GrsbIFUc+mWvVHHklRn6SWyMMOl9rMO4bggNBq8HVVxGKkeeZA+YjEyPXl5HrMXLNkSeR14Yjr8XIDUUOnnxDcCBoNRj2KkIx8jxzwHxkYuTmMnIzRm448jSPqyuOvBEjryhy0NAbggNBe4Zi5BVEnmcOmI9MjLy6jLwaI6848uS/uubIWzHymiKvKXKAA0F7hmLkNUSeZw6Yj0yMvJ5G/tM//vKH8eVj7PUfOfekybrh3Dsx94Zybyh3gANBe4Zi7g3knmcOmI9MzL253NWbMfOGI08irVuOvBcjbynyliIHOBC0ZyhG/hlqya/jgmLkeeYjEyNvLyNvx8hbjjxNLOsOI1dLMfKOIic/JjgQtJr8OEJxL88zB8xHJkbeXUbejZF3HHlSUM0KqkQF1T1FTgpKcCBoNSmoBgUF5oB5DQqqLxVUjwqqWUFNUlDDCqpEBTVLiNyQghIcCFpDCmpAQYE5YN6AgppLBTWjghpWUJMU1LCCKlFBjaLISUEJDgTtGYqRg4ICc8B8ZGLklwpqRgU1rKAmKahhBVWighpSUEMKSnAgaA0pqAEFBeaAeQMKai4V1IwKalhBzeTLwaygSlRQQwpqSEEJDgStIQU1oKDAHDBvQEHNpYKaUUENK6hJCmpYQZWooIYUNEI5clJQgvYMxchBQYE5YD4yMfJLBTWjghpWUJMU1LCCKlFBDSmoIQUlOBC0hhTUgIICc8C8AQU19WXko36amiNP9mnYPpVon4bs05B9EhwIWkP2acA+gTlg3oB9mkv7NKN9GrZPk+zTsH0q0T4N2ach+yQ4ELSG7NPkLXINzAHzBuzTXNqnGe3TsH2aZJ+G7VOL9mnIPg3ZJ8GBoDVknwbsE5gD5g3Yp7m0TzPap2H7NMk+Ddvn/OuPp8jJPg3ZJ8GBoDVknwbsE5gD5g3Yp7m0TzPap2H7rJJ9VmyfWrTPiuyzIvskOBC0FdnnCYrDWhXYJzBfgX1Wl/ZZjfZZsX1WyT4rtk8t2mdF9hmhHDnZJ0F7hmLkCiIH+wTmIxMjv7TParTPiu2zSvZZsX1q0T4rss+K7JPgQNBWZJ8V2CcwB8xXYJ/VpX1Wo31WbJ9Vss+K7VOL9lmRfVZknwQHgrYi+6zAPoE5YL4C+6wu7bMa7bNi+6wmv8jK9qlF+6zIPiOUIyf7JGjPUIwc7BOYA+YjEyO/tM9qtM+K7bNK9lmxfWrRPiuyz4rsk+BA0FZknxXYJzAHzFdgn9WlfVajfVZsn1Wyz4rtU4v2WZF9VmSfBAeCtiL7rMA+gTlgvgL7rC7tsxrts2L7rJJ9VmyfWrTPiuyzIvskOBC0FdlnBfYJzAHzJyZ9//+2urTParTPiu2zSvZZsX0a0T4rss+K7JPgQNBWZJ8V2CcwB8yfWCX9tsGJ6bShv75dZrJO2lmdBEr4BO9OTFXCZ7+OUPwlDoIDQUtwFTdWfApE/oM4YD4yMdITg9+nr5NO1icxkn6hvo7WKEUZofwgCIADQUtwFWElPaYAPokD5k/MCLvubWTwmwZ18sRaQZaKslSUJcCBoCW4ilDOMv9JHDB/YnKWqpxlEsBaQ5aasqTnDREcCFqCK9jYNTAHzJ+YHKUuR5nErjYQpaEo6alDBAeCluAKNnYNzAHzJyZHacpRJmGrWdiMON5Zk7DVJGwEB4K2JmGrQdiAOWC+BmGrL4WtHoWtZmGrJ88pYmEz4nhnTcJWk7ARHAjamoStBmED5oD5GoStvhS2ehS2moWtTsJWs7AZcbyzJmGrSdgIDgRtTcJWg7ABc8B8DcJWXwpbPQpbzcJWJ2GrWdiMON5Zk7DVJGwEB4K2JmGrQdiAOWC+hunC+lLY6lHYaha2OglbXRA2cbyzJmGrSdgIDgRtTcJWg7ABc8B8DdOF9eV0Yd2NkfN0YZ28rebpQiOOd9Y0XRihHDlNFxK0ZyhGHg1Tei5VhGLmMF8YmZj55Xxh3Y+Z83xhkwSv4flCIw54NjRfGKGYOcGBoD1DKfMIxcwjlDIH5iOTMm8uJwyb5Tfj23DmSQQbnjA04ohnQxOGEcqZ04QhQXuGYuaKMocZQ2A+MjHzyxnDRo2Z84xhk4Sx4RlDIw55NjRj2NCMIcGBoG1oxrCBGUNgDphvYMawuZwxbPQYOc8YNkksG54xrMQhz4ZmDBuaMSQ4ELQNzRg2MGMIzAHzDcwYNpczho0ZI+cZwyYJaMMCWokC2pCARihHTgJK0J6hGDkIKDAHzJ+YOMrcnAU0suwoc5PMs2HzrETzbMg8GzJPggNB25B5NmCewBww34B5Npfm2Yzm2bB5NpPn6bJ5VqJ5NmSeDZknwYGgbcg8GzBPYA6Yb8A8m0vzbEbzbNg8m2SeDZtnJZpnQ+bZkHkSHAjahsyzAfME5oD5BsyzuTTPZjTPhs2zSebZsHlWonk2ZJ4NmSfBgaBtyDwjlB5x3IB5AvORSY99ai7NsxnNs2HzbJJ5NmyelWieDZlnQ+ZJcCBoGzLPJi+Qa2AOmG9APJtL8WxG8WxYPNskni2LZyWKZ0vi2ZJ4EhwI2pbEs8374xqYA+Zb8M720jvb0Ttb9s42eWfL3lmJ3tmSd0YoR07eSdCeoRh5Xh/XwBwwH5kY+aV2tqN2tqydbdLOlrWzErWzJe1sSTsJDgRtS9rZgnYCc8B8C9rZXmpnO2pny9rZJu1sWTtrUTtb0s6WtJPgQNC2pJ0taCcwB8y3oJ3tpXa2o3a2rJ1t0s6WtbMWtbMl7YxQjpy0k6A9QzHyExQHtCIUMwfvjEzM/HLis63GzHnis0362bJ+1qJ+tqSfLeknwYGgbUk/I5QzB/8E5lvwz/bSP9vRP1v2zzb5Z8v+WYv+2ZJ/tuSfBAeCtiX/jFDOHAQUmG9BQNtLAW1HAW1ZQNvJP+nCAlqLAtqSgLYkoAQHgrYlAY1QzhwMFJhvwUDbSwNtRwNt2UDbZKAtG2gtGmhLBtqSgRIcCNqWDDRCOXNQUGC+hcnP9lJB21FBW1bQNiloywpaiwrakoK2pKAEB4K2JQWNUM4cHBSYPzEtsNv20kHb0UFbdtAuOWjHDlqLDtqRg3bkoAQHgrYjB41QzLwDCQXmO5DQ7lJCu1FCO5bQLkloxxJaixLakYRGKGdOEkrQnqGYOU1+dnnTdMB8ZGLmlxbajRbasYV2yUI7ttBatNCOLLQjCyU4ELQdWWiEcuagocB8BxraXWpoN2poxxraJQ3tWEMbUUM70tCONJTgQNB2pKERypmDhwLzJyaez7tLD+1GD+3YQ7vkoR17aCN6aEceGqGcOXkoQXuGYuYw/QnMAfMnJkd+qaHdqKEda2iXNLRjDW1EDe1IQzvSUIIDQduRhnZ5m1wDc8D8icmRX1poN1poxxbaJQvtzhoWHzc7tvB/1RcPmz1lTfrZkX4SHAjajvSzg+lPYA6YPzE560v77Eb77Ng+u2SfXftl1k0+a9LOjrST4EDQdqSdHcx7AnPA/InJWV9aZzdaZ8fW2U3+3dHuy6zbfNakmx3pJsGBoO1IN7u8Na6BOWD+xOSsL22zG22zY9vskm12/ZdZd/msSTM70kyCA0HbkWZ2eVtcA3PAfAeW2V1aZjdaZseW2SfL7JdfZt1ns+5JL3vSS4IDQduTXvZ5S1wDc8D8iYlZ95d22Y922bNd9skue/VF1v0ynzVpZYRy1qSVBO0ZilnD3CYwB8yfmJz1pVX2o1X2bJV9sspef5m1ymdNOtmTThIcCNqedLKHSU1gDpg/MTnrS5vsR5vs2Sb7ZJO9+TJrnc+aNLInjSQ4ELQ9aWQPs5nAHDDfg0X2lxbZjxbZs0X2ySL76susTT5r0scI5axJHwnaMxSzBn0E5oD5HvQxspj1qI8962Of9LGvv8y6ymdN3tiTNxIcCNqevLEHbwTmgPkevLG/9MZ+9MaevbFP3th/6Y193ht78saevJHgQND25I09eCMwB8z34I39pTf2ozf27I198sb+S2/s897Ykzf25I0EB4K2J2/swRuBOWC+B2/sL72xH72xZ2/skzf2X3pjn/fGnryxJ28kOBC0PXljD94IzAHzPXhjf+mN/eiNPXtjn7yxh0fr9PRonQjFR+sQHAhagqu4sdKjdeCDOGA+Mun3SCKDR+uoZfLC8Ofj66Unb0QoP3rjTOV/HZnogNQiXZ2p+FgY+kCOoI9QfAbHGdI/6Luc/LO9S0W5KsxVYa5AB6QW6epMM7nmP5Aj6CPM5Kq+Ilc9yRUeuhNhLld67A7SAalFuqJNXhN0BH2EmVjLj99RSzOJFR7AE2EuVnoED9IBqUW6ok1eE3QEfYSZWMuP4lHLahIrTwa24hdq4lLy7cGZivcHSAekNlHpFuFMpXsEgo6gj1C8TTjD+O8wL0exU0s2O7WsJwXw1GArfrsmLpUrgCQP6YDUJioXAKJH0BH0EWYKqGcF1KEA1j21bCYF8NdVW/GrNnGpXAFkfkgHpDZRuQCwP4KOoI8wU0AzK6AJBbADqmU7KYC/u9qK37uJS+UKIB1EOiC1icoFgBISdAR9hJkC2lkBbSiAxVAtu0kB/EXWTvwSTlwqVwA5ItIBqU1ULgA8kaAj6CPMFNDNCuhCAWyLatlPCuBvtXbiN3LiUrkCaMIR6YDUJioXAJOOBB1BH2GmgH5WQB8K4KlHpSaOqfgrrp34/Zy4VKaASOUCiA5IbaJiAZGKBQB0BH2EcgERxgLU8pvwXoUCJjKqFBcg/s5IXCpXAE1NIh2Q2kTlAmB6kqAj6CPMFKBmBahQAE9SKjWxVsVffu3EXyCJS+UKoPlKpANSm6hcAMxZEnQEfYSZAvSsAB0K4JlLpSZ+q/ibsJ342yRxqVwBNImJdEBqE5ULgIlMgo6gjzBTgJkVYEIBPJ2p1MSEFZtwJ5uwQhOONFMAmjBRm6hcAJkwQEfQR5gpYGbCKpiwKpiwmpiwYhPuZBNWaMIKTZjogNQmKhdAJgzQEfQRZgqYmbAKJqwKJqwmJqzYhDvZhBWasEITJjogtYnKBZAJA3QEfYSZAmYmrIIJq4IJq4kJKzbhTjZhhSas0ISJDkhtonIBZMIAHUEfYaaAmQmrYMKqYMJqYsKKTbiXTVihCSs0YaIDUpuoXACZMEBH0EeYKWBmwiqYsCqYsJqYsGIT7mUTVmjCCk2Y6IDUJioXQCYM0BH0EWYKmJmwCiasCiasJyas2YR72YQ1mrBGEyY6ILWJigVoMmGAjqCPUC5Az0xYBxPWBRPWExPWbMK9bMIaTTjSTAFowkRtonIBZMIAHUEfYaaAmQnrYMK6YMJ6YsKaTbiXTVijCWs0YaIDUpuoXACZMEBH0EeYKWBmwjqYsC6YsJ6YsGYT7mUT1mjCGk2Y6IDUJioXQCYM0BH0EWYKmJmwDiasCyasJyas2YR72YQ1mnCkmQLQhInaROUCyIQBOoI+wkwBMxPWwYR1wYT1xIQ1m3Avm7BGE9ZowkQHpDZRuQAyYYCOoI8wU8DMhHUwYV0wYT0xYc0m3MsmrNGENZow0QGpTVQugEwYoCPoI8wUMDNhHUxYF0xYT0xYswn3sglrNGGNJkx0QGoTlQsgEwboCPoIMwXMTFgHE9YFE9YTE9Zswmopq7BGFdaowkQHpDZRuQFSYYCOoI8w08BMhXVQYV1QYT1RYc0qrJayC2t0YY0uTHRAahOVGyAXBugI+ggzDcxcWAcX1gUXNhMXNuzCainLsEEZNijDRAekNlGxAUMyDNAR9BHKDZiZDJsgw6Ygw2Yiw4ZlWC1lGzZow5FmGkAbJmoTlRsgGwboCPoIMw3MbNgEGzYFGzYTGzZsw8evOkoNoA4b1GGiA1KbqNwA6TBAR9BHmGlgpsMm6LAp6LCZ6LBhHT5+11FqAH3YoA8THZDaROUGyIcBOoI+wkwDMx82wYdNwYfNxIcN+/Dxy45SAyjEkWYaQCEmahOVGyAhBugI+ggzDcyE2AQhNgUhNhMhNizEx287Sg2gERs0YqIDUpuo3AAZMUBH0EeYaWBmxCYYsSkYsZkYsWEjPn7dUWoAldigEhMdkNpE5QZIiQE6gj7CTAMzJTZBiU1Bic1EiQ0r8fH7jlID6MQGnZjogNQmKjdATgzQEfQRZhqYObEJTmwKTmwmTmwKTqxkJzboxAadmOiA1CYqN0BODNAR9BFmGpg5sQlObApObCZObApOrGQnNujEBp2Y6IDUJio3QE4M0BH0EWYamDmxCU5sCk5cTZy4Kjixkp24Qieu0ImJDkhtomIDFTkxQEfQRyg3UM2cuApOXBWcuJo4cVVwYiU7cYVOHGmmAXRiojZRuQFyYoCOoI8w08DMiavgxFXBiauJE1cFJ1ayE1foxBU6MdEBqU1UboCcGKAj6CPMNDBz4io4cVVw4mrixFXBiZXsxBU6cYVOTHRAahOVGyAnBugI+ggzDcycuApOXBWcuJo4cVVwYiU7cYVOHGmmAXRiojZRuQFyYoCOoI8w08DMiavgxFXBiauJE1cFJ1ayE1foxBU6MdEBqU1UboCcGKAj6CPMNDBz4io4cVVw4mrixFXBiZXsxBU6cYVOTHRAahOVGyAnBugI+ggzDcycuApOXBWcuJo4cVVwYiU7cYVOXKETEx2Q2kTlBsiJATqCPsJMAzMnroITVwUnriZOXBWcWMtOXKETV+jERAekNlG5AXJigI6gjzDTwMyJq+DEVcGJq4kTV/CwqQjlp02dqfi4KaQDUot0dd5k6ZFT9HkcQX+G0lOnzpAeO1VPRLemx07V+NipSOXnzRAdkFqkqzOVH48EH8gR9BHKD5yJkB44U0/0tVaUq8JcFeYKdEBqka7ONJNr/gM5gj7CTK7qK3KdSGlNj52q8bFTkWZyxcdOEbVIV7TJa4KOoI8wE+tXPHaqnphmTY+dqvGxU5FmYsXHThG1SFe0yWuCjqCPMBPrVzx2qp7oY13QRy0P5NaojzXqI9EBqU1UvG2oSR8BOoI+Qvm2oZ7pYx30sS7oYz3Rx7qgj1oeyK1RH2vUR6IDUpuo3ADpI0BH0EeYaWCmj3XQx7qgj/VEH+uCPmp5ILdGfaxRH4kOSG2icgOkjwAdQR9hpoGZPtZBH+uCPtYTfawL+qjlgdwa9bFGfSQ6ILWJyg2QPgJ0BH2EmQZm+lgHfawL+lhP9LEu6aM8kFujPtaoj0QHpDZRuQHSR4COoI8w08BMH+ugj3VBH+uJPtaFKVUtD+TWOKUaaaYBnFIlahOVG6ApVYCOoI8w08BsSrUOU6p1YUq1mZhmU5hS1fJAboNTqpHKDRAdkNpExQYiFRsA6Aj6COUGIowNNGFKtSlMqTYTJ20KU6paHshtcEo10kwDOKVK1CYqN0BTqgAdQR9hpoHZlGoTplSbwpRqM7HXpjClquWB3AanVBucUiU6ILWJyg3QlCpAR9BHmGlgNqXahCnVpjCl2kxEtylMqRp5ILfBKdUGp1SJDkhtonIDNKUK0BH0EWYamE2pNmFKtSlMqTYTJ24KTmxkJ27QiSPNNIBOTNQmKjdATgzQEfQRZhqYOXETnLgpOHEzceKm4MRGduIGnbhBJyY6ILWJyg2QEwN0BH2EmQZmTtwEJ24KTtxMnLgpOLGRnbhBJ27QiYkOSG2icgPkxAAdQR9hpoGZEzfBiZuCEzcTJ24KTmxkJ27QiRt0YqIDUpuo3AA5MUBH0EeYaWDmxE1w4qbgxM3EiZuCExvZiRt04gadmOiA1CYqN0BODNAR9BFmGpg5cROcuCk4cTNx4qbgxEZ24gaduEEnJjogtYnKDZATA3QEfYSZBmZO3AQnbgpO3E6cuC04sZGduEUnbtGJiQ5IbaJiAy05MUBH0EcoN9DOnLgNTtwWnLidOHFbcGIjO3GLThxppgF0YqI2UbkBcmKAjqCPMNPAzInb4MRtwYnbiRO3BSc2shO36MQtOjHRAalNVG6AnBigI+gjzDQwc+I2OHFbcOJ24sRtwYkr2YlbdOIWnZjogNQmKjdATgzQEfQRZhqYOXEbnLgtOHE7ceK24MSV7MQtOnGkmQbQiYnaROUGyIkBOoI+wkwDMydugxO3BSduJ07cFpy4kp24RSdu0YmJDkhtonID5MQAHUEfYaaBmRO3wYnbghO3EyduC05cyU7cohO36MREB6Q2UbkBcmKAjqCPMNPAzInb4MRtwYnbiRO3BSeuZCdu0YlbdGKiA1KbqNwAOTFAR9BHmGlg5sRtcOK24MTtxInbghNXshO36MQtOjHRAalNVG6AnBigI+gjzDQwc+I2OHFbcOJ24sRtwYkr2YlbdOIWnZjogNQmKjdATgzQEfQRZhqYOXEbnLgtOHE3ceKu4MSV7MQdOnGHTkx0QGoTFRvoyIkBOoI+QrmBbubEXXDiruDE3cSJu4ITV7ITd+jEkWYaQCcmahOVGyAnBugI+ggzDcycuAtO3BWcuJs4cVdw4kp24g6duEMnJjogtYnKDZATA3QEfYSZBmZO3AUn7gpO3E2cuCs4cS07cYdO3KETEx2Q2kTlBsiJATqCPsJMAzMn7oITdwUn7iZO3BWcuJaduEMnjjTTADoxUZuo3AA5MUBH0EeYaWDmxF1w4q7gxN3EibuCE9eyE3foxB06MdEBqU1UboCcGKAj6CPMNDBz4i44cVdw4m7ixF3BiWvZiTt04g6dmOiA1CYqN0BODNAR9BFmGpg5cRecuCs4cTdx4q7gxLXsxB06cYdOTHRAahOVGyAnBugI+ggzDcycuAtO3BWcuJs4cVdw4lp24g6duEMnJjogtYnKDZATA3QEfYSZBmZO3AUn7gpO3E2cuCs4cS07cYdO3KETEx2Q2kTlBsiJATqCPsJMAzMn7oITdwUn7idO3BecuJaduEcn7tGJiQ5IbaJiAz05MUBH0EcoN9DPnLgPTtwXnLifOHFfcOJaduIenTjSTAPoxERtonID5MQAHUEfYaaBmRP3wYn7ghP3EyfuC05cy07coxP36MREB6Q2UbkBcmKAjqCPMNPAzIn74MR9wYn7iRP3BSduZCfu0Yl7dGKiA1KbqNwAOTFAR9BHmGlg5sR9cOK+4MT9xIn7ghM3shP36MSRZhpAJyZqE5UbICcG6Aj6CDMNzJy4D07cF5y4nzhxX3DiRnbiHp24RycmOiC1icoNkBMDdAR9hJkGZk7cByfuC07cT5y4LzhxIztxj07coxMTHZDaROUGyIkBOoI+wkwDMyfugxP3BSfuJ07cF5y4kZ24Ryfu0YmJDkhtonID5MQAHUEfYaaBmRP3wYn7ghP3EyfuC07cyE7coxP36MREB6Q2UbkBcmKAjqCPMNPAzIn74MR9wYn7iRP3J6UTH5jS4+OoIpUfR0V0QGqRrmiT1wQdQR+h/MCUCOGBKXqZRDf8ORtrhPJzaM5UfA4N0gGpRbqiTV4TdAR9hGKsZ4ixjkt+HKkaD7r3n14Ou8f19v6X408meUc/FZ759O5MpQ9+jfQG6YDUIl0hXSN1SD3S2xydpa4n4cKzqiIUn7Z1faaZbOlZVUgt0hVt8pqgI+gjDP9EjZDrCVYUq5nEenoIk/QkwAiPz8ETYo1KqMVYgQ5ILdIVbfKaoCPoz1DeXU+wpVirSayf1eh0JpBuKsRh3ricfFNxpuJNBdIBqU1Uuqk4U+mmgqAj6M8hCXvXbUri803F+PdvwnvhTYVe1pMK6lIF4jhvXC5XAdkl0gGpTVSuAOySoCPoIxTv61ISsYI6VMB2qZfNpIKmVIE40BuXy1VAeol0QGoTlSsAvSToCPpzSPJR0MwqaEIFrJd62U4qaEsViCO9cblcBeSXSAekNlG5AvBLgo6gP4ckV9DOKmhDBeyXetlNKugKFbTiUG9cLlcBCSbSAalNVK4ABJOgI+jPIckVdLMKulABC6Ze9pMK+lIF4lhvXC5XAc26Ih2Q2kTlCmDWlaAj6M8hyRX0swr6UAHPumo1kVG1LFUgDvbG5TIVRCpXQHRAahMVK4hUrACgI+jPIYkVnJM4VaCW34T3KlQw8VOlShWIo71xuVwFNO+KdEBqE5UrgHlXgo6gP4ckV6BmFahQAc+7ajWxWKVLFYjDvXG5XAU08Yp0QGoTlSuAiVeCjqA/hyRXoGcV6FABT7xqNTFeZUoViOO9cblcBTTzinRAahOVK4CZV4KOoI9Q9oJzErECEyrgmVetJnasSnbcynas0I4jzVSAdkzUJipXQHYM0BH055Dko2BmxyrYsSrYsZrYsSrZcSvbsUI7VmjHRAekNlG5ArJjgI6gP4ckVzCzYxXsWBXsWE3sWJXsuJXtWKEdK7RjogNSm6hcAdkxQEfQn0OSK5jZsQp2rAp2rCZ2rEp23Mp2rNCOFdox0QGpTVSugOwYoCPozyHJFczsWAU7VgU7VhM7ViU77mQ7VmjHCu2Y6IDUJipXQHYM0BH055DkCmZ2rIIdq4Idq4kdq5Idd7IdK7RjhXZMdEBqE5UrIDsG6Aj6c0hyBTM7VsGOVcGO9cSOdcmOO9mONdqxRjsmOiC1iYoVaLJjgI6gP4ckVqBndqyDHeuCHeuJHeuSHXeyHWu040gzFaAdE7WJyhWQHQN0BP05JLmCmR3rYMe6YMd6Yse6ZMedbMca7VijHRMdkNpE5QrIjgE6gv4cklzBzI51sGNdsGM9sWNdsuNOtmONdqzRjokOSG2icgVkxwAdQX8OSa5gZsc62LEu2LGe2LEu2XEn27FGO440UwHaMVGbqFwB2TFAR9CfQ5IrmNmxDnasC3asJ3asS3bcyXas0Y412jHRAalNVK7gRGvhm2zrM5U7ID3WpMd6psc66LEu6LGe6LEu6XEn67FGPdaox0QHpDZRuYMGOyA/BujPKckdzPxYBz/WBT/WEz/WJT/uZD/W6Mca/ZjogNQmKnfQYgckyAD9OSW5g5kg6yDIuiDIeiLIuiTIvSzIGgVZoyATHZDaROUOOuyADBmgP6ckdzAzZB0MWRcMWU8MWZcMuZcNWaMhazRkogNSm6jcQY8dkCID9OeU5A5miqyDIuuCIpuJIpuSIveyIhtUZIOKTHRAahMVO4hU7sCQIwP055TEDszMkU1wZFNwZDNxZFNy5F52ZIOOHGmmA3RkojZRuQOFHZAkA/TnlOQOZpJsgiSbgiSbiSSbkiT3siQblGSDkkx0QGoTlTvQ2AFZMkB/TknuYGbJJliyKViymViyKVlyL1uyQUs2aMlEB6Q2UbkDgx2QJgP055TkDmaabIImm4Imm4kmm5Im97ImG9TkSDMdoCYTtYnKHVTYAXkyQH9OSe5g5skmeLIpeLKZeLK58OSLtb+L8PhNbrGhb775ZvHD7vDx/umXhd09POx+e1mMPxNau44ry/WC7kzUJir3gu5M1CH15+zkZs72PIWzIpr4u0h2t3/cjK87XVqmB8np93vbTAU/ffr5sDtsHq7kQwWE9xrpDdIBqUW6QrpG6pD6RIVd4fZMm+PR8tM//vKH8WfdG/Va6T8WDpn2K5pquan//v7vmZLAiK+R3iAdkFqkK6RrpA6pT1QuqZVK+o/QXqmk7itK6rikv4djafH94+7T0yHTFrjzNdIbpANSi3SFdI3UIfWJym11X7Sl+qtwYSqVNZFzE2U318rN/cv7h83943af6QR+0/ca6Q3SAalFukK6RuqQeqS3iV5e1C/zr5Zf8fuwVTTg3C3aN4vrzdP77cPD5nC/e3pZ/Hb/8LD4ebt4P/7l/m67394tdk8Pvy/uPywOH7eL/fZfn7Yvh8X9y+Jxc7cdXx7uHRa6Wnzcfdq/LHYfFs8Pm/fhdiK8fLcfV/F6sd79tv11u//T8WfvJ+93Xt/xbZ92h/DW26fDdn/YjBt6F9/2uJ6XxcfNr9vxFduncfMeHz893b/fHMYXHXbHFz1unj592Lw/fNqHtx834+mw2DzdfV7q/un+cP/51eNLn/e799uXz5v7+Y/jIm9ePt4/P8dNvz9sH19eLxY32+fdy/3hZbHZb8ctfPqP/fbDp6e7zc8P2+Pa3z/cjxuccvu42f8yvsuH3f7zavb78NFf7sPrP2y3L+OWvP+0/5zr++3i+D5vwkcb3+Fhv93c/f75E562a3v3ebO2d/8pHjixYPlXmoneIB2QWqQrpGukDqlHept29yUdONPjI/4OtPg7zWcqhwv0BumA1CJdIV0jdUg90tsz5XAnwySVxnDhF7evkd4gHZBapCuka6QOqUd6e6YcrvmaU34caMg9TeUbP/ylW1y7v13/eVj8/W/f37gfVovrv76+OAl/3D7cLR7uj6e5eC672z5sfn9Z3H3ahlPux93D/d349/Gsvt88vTzvxnP28ZwezooPm5/HhV4O+/t/bsMrfn/+uBuvKH9afHjY7e7G/283+8PHf33aHPGH+/32T4tfdw/jteH+/WK7//R8vBr9aTGezo9n6dXu7k/HFYfteBhX+lo+Gxrcp4DeIB2QWqQrpGukDqlHepv2BNynJvfWVRwfEcYx3iUqPBLgGukN0gGpRbpCukbqkHqkt4nS+EBVfz5gdf0aD9nTUEO/zByyP+63z5twz/Dud3m/h+GV60QFAbgpv/n3z+O9yK/HN5du3gd8d4t0hdu2Lm/b9ee7r5/uf3najDd+W2H7HG6Bxy24PdOc2Pxt+2G8SQ53cj/sZuek2a7QfM25+zS+0csHYEOSdKbCSOANrnnANVukK3zfdaTHBxkIByCs2eOab9MnwgOw/ZrUTwMWfW6UdLXfjAX/uPnXp/u73dMvmyf5IGzx4hPHTIQx75vyJvi//UU+9uBNLdIVbtI6LSs+HofW7HHNt+nD1tRc9zXNnQYv+iYT20+bh1G5hv/Zvv90uP9VOj28O68kc12LVHjWz015A378tB+VMOjl4q8fPty/3+7lGmEbLNIVbuE6UXHigtbscc236bNLT+QZrXW7PdxsDpu33z5uRyW+Hp3/ZfT2T0/heliFwaPzzxejU4fnzC2bKzv+59Ubgel+ZLqXmF4ur45PNZOW66ur44NbBdapKzvGIq6xvzo+AkBi9YhqifTjZvTyVmgdtl5LrB23ohW3YrxgXR3/IRaJmXGx8T/iFqpxufD7iQKruytbd/K7hTcT19eOq2tFos3V8QvA4vqWV8d/TkzaijGOWkojnIyvjidLscv66vgIWIFV4xorMd9m3IxG3AodMtRyhqoNW9/KbbZhX2zFvUPVY1hhuknaxrGWSmrleizMZfoaA67lfJtwtDTi0aJN2AOMuMaAZKJUWKOSj7827MGtmLAe9xwt7jlmDMPIXbZh327l7ViGXXGZ2UvDNnbyNjZhuUbeh004Rxh5PxhXqcU1hgMwc/xVYzHjf+Qcw3bIx1I/xtiLKYYNlLdPhYNWiUdtmA+5Og7xi2excBKTzx5h64289eFQUvKxFA5p+YjWKpwJlLjGcAqWz8AqHJxKPjqVCUe7kY727/urW/noC4eYEo+x8M2Pq+PXMMTzWDjF5c5x4VjS8tE5oloi4Vb+6nhPLl4NwicTryHfK3U17j/idWKsRT7+VDikVeaY7sJ7deI5U/XhPNZnrqnhoM4cgzpce7S4lfV4LNXip+5H0meO23DObMT0w2k4cxZehk+2FD+ZVuH6rcRPFg7czHHbhnNLK21juNW8Ot4MintIyEo+A2oVDkIlfwIVcpTbVuHgVfLR249v18vNLEOSSynJ79XVrbwXtCHHVmThYiZfy7pxGzp5G6pwtpKT6sZ9uJP34SacdRqZhVskJd4jhUn7q+OEtLh/h91b3sbQtHx0ahXOBUpcYzhg5OMlXM4yV7MudNKJ6wsXLPl61Y17aSftpeELJVfH70mIe004E8jnKh32DS3uG9dKj/cf8t3pGJR8RIw79q28X1fjDlWJ+1M4GWXORV0oq5PbCju8kvd4vQxn56X8icP9jM7dz4QrYJu5cz3eCmfOfWHPke8WwoEkH0cq+ISSfWK84bXy/W44JOQjQoc7DJ25Wzf66viVT3G/D0dSJZ+5x02sM/mHrHo5qzqcp+qMewUmG1G49ZbvvMOhmbluhk1U8jbqZfjUy0xaQdlU5koRkLiF45uZzD1+OFeJ/hKGpa5uM9eJcGKUiWpCL420HWEI7cpn1qhM2Bvlc4EOxqwzxny8FZL3kHA1EI/eMEp1tcq5WZBplbHpozKL9zthiPfqOAYrnWH0eC8k78d9eLdevk8aP5t8XIcTsXweVuEgVJlP1oazQZs5GwQmXvm/H53unex0KmiRkq9Z+igj8vlFhYuCEq8K75ox4kZMsblaydseVETJLqKacB1pMlsfjkL5yNBhnEPL4xwqjEooOZFm/GCNfLUbb9eOky1i+iEPeT8OB0bmGhlu2pV41x4e8nZ1fOKadH4cT2biee56vI1zmbu4cPenMnd/4UMr8VOHx35fHZ/BLbKwh8ijZPp4OpPPZ8qEfVU2RRXsTWXsbVylfKSpMO6mMuNuQQSUaALhKf1Xx8fPi6mE84+8J4+n8Vv5viwMhcgjIaoK21jJznrcWeU8wlbIV4xwMcxcC6twZFSZa0ZYYy1fg46injH1cF1T8nVNhSEDJY4ZXI+FOrnPdjz5tPI9/ZhiZmQl3BMrOXtVh3NxLZ/5g8Nr0eHfBemTnS9cDMVr4ZhGeK/MnhPue1TmvueoAqILhKmxq1XG1I+XULHPZiSN3HSQHCVbTjgEM0dgOOKVfMSHC1Dm+hOkWmWsOpzLlHwu08GdtejO4cucV8evIIpZdVcr+V4kzGJfXctX8vFMHfYfeXwlHKCZ41Mdb87ku8Qxf/lICwda5jgLqiCd99fjPZuYb7gMylfBMBQtj0SHYSZ5lCkoTsZwgsUo2WJUOGCVfMSGQ08+8lTYQZW4h4ZvhV4dv3EknWPNeNci74XjCsUx7/AVgqtVpvlwUGaOyT58rl7eJ8bPJVtKWEheRoWhciWPlYfT0Oez0Jszenn77fPml+1fNvtf7p9eFg/bD4fvXi1ft68W+8/zjMc/H3bPxz/VrxY/7w6H3WP828ft5m67D38zrxYfdrtD/Mubz+v9aXv49LzY7cP3E47fi/ruVfiK1H5zf3i1eN48b/c/3f97e/w3rz6Or/r3bnzZw83z/XevKt1XfdPqzxeZz+9jj2/w9tvd3d36+IO3/2fz+Pyffz7+d/Xtm/Tz8JLTq794SVzL9tftU3z5m+lfwp/ji95M//Lhfv9yOC9y8bfjX84LXf7tcuPf/Lbb//M4L/j2fwFQSwMEFAAAAAgAPEaXXAmg1vmsEAAAI10AABgAAAB4bC93b3Jrc2hlZXRzL3NoZWV0Ni54bWydnGuTm7gShv8KNR/O2U3tji2BL7DJVI1twJdcZjPJns+KLY+pYPACntnZX38kDNjYzYuTStXE5pFaorsR0mvQ25c4+Z5upMyMf7ZhlL672WTZzul00uVGbkV6G+9kpMg6TrYiU1+Tp066S6RY5ZW2YYd3u/3OVgTRzd3b/NhDcvc23mdhEMmHxEj3261IXkcyjF/e3bCb8sDn4GmT6QOdu7c78SQfZfZ195Cob53KyirYyigN4shI5PrdzT1zPlsDXSEv8VcgX9KTz0YW797LdTaWYagKW90b49843j4uRSg/6u6ro6x7evRRV30vXlVvtQGFTYW1R77F8Xd9aLZ6d9PVJyZDucx0T4T671ke2pjb6nT+zvs2t5054zdV93Xl089lR73cj8ov30Qqx3H4v2CVbd7dDG+MlVyLfZgdj9m3rGubg16FPscvU1m4zbq1dGPLOEzzv8bLoVKvqrTcp1m8LWxpv2evoVSfVFPbIMoPbcU/RQROLAxvh8P+gA2RjcIEL0zwMxP9602YhQnzzETvehNWYcI6M2G1uqIw0CsM9M4MsO5tv291+7zdRL8w0T8zYbdbYHZhY1DYGFy4otVGaWJYmLAvYtpqwirTolvmRffcHewHrFTZdZ5e9rVRYWV2sXOHqLiUNr7JNPOCfBxptVc6R3342S7ZpYm+OczTrXO4APNLeyIycfc2iV+MRFdRTegP99pMEWbVTz1KdpYFGxVs0L9kY8AmgLmAeYD5gE0BmwE2B2xBs47yX+VEXjmRNxsaATYGbAKYC5gHmA/YFLAZYHPAFjSrOdGsnGgCJwI2BmwCmAuYB5gP2BSwGWBzwBY0qznRqpxoAScCNgZsApgLmAeYD9gUsBlgc8AWNKs5sVc5sXcozLt54SDSc8XHLFE8UKNpdvfn109f7r/MPn1828mUEX3w6OWi8mBAeBmwCWAuYB5gfsmGhJfLk2QNJ/kgoiR7NR73u10YyJQ41Rloeg7Ygu5WLRj9Khj9ojB1g+qDjAZsApgLmAeYX7Bhl/A1OIcZsDkHbEG3V3PioHLioCjMCCeWjBNOBGwCmAuYB5hfMpNwIjiHGbA5B2xBt1dz4rBy4rC4YojOjQqmpl2XTgRsApgLmAeYD9gUsBlgc8AWNKs50a6caBfzzWHDsDNWg02UGR/FVjrU8FrUH/YIRxfMIgI0sYGjAfMA8wGbAjYD5zBv84+axpOOWdAnX4sC6x6n/d2iHbMpDvF2J6LX5kCUFshIlJAMRVWTigWCHoI+glMEZ+hU5pWnGiMiw+BZJq9kVBocUQ/LyWqMtYYlysQyMyYyE0GY0pFhKDIlJBduDEUGQA9BH8EpgjN0KvMCWg2u+kuEwSrIGuLCroiLumNoNYtbt3a5+D4IZO+OC/pK8srtHactjOO00Xqmk+7EUi3gd4lMZfIsb+7uVyv1OXUMMq4cxbWAnIwrR3EF0EPQR3CK4AzBeQF7jRPT162+RXyRyZa8ABaldRjc48KTFSusLjFXHZWQnM8jOEHQRdBD0EdwiuAMwTmCiwZYd6h1uFosdmtdXhyVr4uFWLdpNJ1lcmt8jG/JC+CqyhOZLpNgp+Vwwsi4NEJOxxB0EfQqSFycfmvHH4N/pdExxnEYJ0Snp60G/sxeqRVaa72vUZARFedFRVTNeEiCpTR+eZg+/EpehdjE/Tbeq6uYqF5Pq+OynB3WjXaDwS4jc6ZYbJpNi3k/kUINJiLNpDojuQ32W2MWpZlQnRvH67WUZBb1UBYB6CLoVZDMogI2rdhZt/tEJk+tnrb5fKd89VxLlBbb6kb1ncyTol7v1HaX3/bq9hdVGFSJ9Z2q9kZ1621nrcvXi34oi55YHPbrZT5WZbQ1VeMNu+W9TvfWHqhPzCINfy4rgXUK6x8GMdYDQ1gfpyEn07DfkoYf1agl1tIYhyJNgyVKvT5KPQBdBL0KkqnX/8nU61+Rei22G1OvT6WefZl6/Xrq9VXq9RsypN+eIUdRhQ1wIphkIgyuTAQziFiRBcYvn5LgKYhE+Kthdv9LaXHj0i6dFQC6CHoVJLOigE2nwod0UgyuSIrBTyZFUY+f2OYD8zwlBvWUGKiUGJynRD3sRxmIDXHYLTLsw1rYz6aRSCFC0EXQqyAZu+Fp7M5mkcPzAJ0EppnNS0YpbZUDCpcPlcuH2OVH0YjZ2OU90uV2y5U2VQsIEcXGSDUYGY/7J0HNvcYMSDkTBF0EPQZUIL+EjePt95C8suwrrqwW041Xln053PYHl6OtXY+zreJsN4y2pWTVPNryo2LFuzgH+lQOFJXac+B/It3IVXMScKAfTRB0EfQ4UJ78Ev5gEtSr0UnQZropCcp6p0kw4GcpUDn9kAK8+0b1iU6BsihKAdY+JeMM58aAzA12bW5sArU2aE4NIGBNEHQR9DiQvvwS/mhqsCtSo8V0Y2qwy9QYXqQGq6cGU6nB4F2A8yvCz3H4h2T4eftELAtlMQX7/YPIys/GWC0ZtzI5mZaReQE0rgmCLoIeByqgX8Km4Fk9ep5er9eQGC22GxODE/N03r+4c1QBKXKDq9zgODfMK3LDxLlhk7lR6F1mU7UfyQ3DGtJT9rIVOkEAdBH0KkgmSKl1NpxYj04P84r0MH8yPczLGTvj7Dw5zHpymCo5TJwcx4diuAVzgHXJHLBaxocPQbSKk9i4fwpCYXzOtbBJEMWJWMX0gICURwRdBL0KkvG2cFR4r+FOYV0R8RbbaVPEreZlQuX1Is6WivOFnFOP81Eg5FggZKRAyNsEwq/e2PgitkFq3EdPGxE9GSMRqX/GWGTpfkdGGqmDCLoIehUkI92i4Jm8Yei/Qh1ss/0to5JoXlYjA10XBHlPBfpCEKwH+vjjGscSHCMlON4mwX3Qsf0Sb4WKdBga90m8j9SSQCSpIIOMdDgEXQQ9jnS4EjadgskbBvArdDjeosM1BbkPglyX3nhfBblBeuPt0hs/Sm8cS2+MlN54m/Q2EdneeNhngfGXIk3TfSS0Iegi6HEktPEWNczsdbf0MH6F1NZmvCnuF0rbSdzr+hofqLhjfY0f9TWO9TVG6mt8eHVsH+NXdVHvl6S4zpEUh6CLoMeRFMeHPxvdCy2OiG6L8aboHqpxQuZb8LqUx4cquljK40cpj2Mpj5FSHm+T8o7RfRBZQM+2kYyHoIugx5GMx1u0tubIXiHktRlviqwNrtu6eMdtFdkL8a7++P5RoDOxQMdIgc5sE+g+iKcndc2K5zgx3gd/7wN1R5YijaNA3ax/KX4tI6fbJpLsEHQR9Ewk2ZWw6WzUedIBN68Q7cwW0a4h4GU1KuBmXaozu29UT3DAr5DjTCzHMVKOM9vkuJZMEKHYiigN6FxAGh2CLoJeBclcYD+bC1eodPUy1+cCA7lQ1+ZMpnIBa3Pm8Q0oE0twjJTgzDYJDod8GmfGeBOEDSFH8huCLoKeieS3Ev54yK/Q38wW/a0p5ByEvC65mVyFHEtu5sn7WqfKWs3uyCyfF2t6hu/NmzfGxzjb6Dh6cRjGL6mhjpFxRCoZgi6CnolUMrOmktV/HDUvtLCTEDWzuXmhc53EoVK3Ghc/5lHOMgs5a9Dg3Mf9tyzOREg+HGwCKWmM4ARBF0EPQR/BKYIzBOcVJOK7KGE/z/uFOeiwW9aS+EeZyexh//91/4V2PdB2xghOEHQR9BD0EZwiOENwbgKZalHCyvW/q2hgzx91H7N/6vmzMQeIKmMEJwi6CHoI+ghOEZwhODeBPrQoIXrh9qiimAOcyF/0KGIcHtSkMxooGmMEJwi6CHoI+ghOEZwhODeBOLMo4SGjH79++GXBeo6aTv2K0/qoeJilOtAUiEmQLkMRbGVCh6GoTz6jjuAEQRdBD0EfwSmCMwTnCC4qCN4q1b/ntS5eygV904PLb4yxiJYyDIV+xDw1XoIwNL5JY6m+BCuZyJURR+GrEayNbCONRP69l2lmBKmxFSupiutpj8EtYxPvk9SI18YuFEs9E9LF40SZuDWm8Yt8lslv+bHlSXuVvbzZSE2BVdMyymSSCdXRVdlsbic1NuJZqhIyUt3bbvdRsBSZKpTFeSG1YNqvxTLbJ7p51Y0oM0S0OtQKoiALDqVV0V0SL2V66O7ho6rSSTfBbld2PcjkNr01jIncxWmQpYZIpOph9Hsi1/toJb6FMre+PLziV/ltI5In1cpaTfJzM0miTz0NdPm1lKnqyXKfHPy6lEbeTkefmmoh1Hv9vB7OsOiXXB26JVd/kBdLEV96LwEAJwi6CHoI+ghOEZwhOEdwUSU5eHvYOko7ViETkC9hV5DcVwDACYIugh6CPoJTBGcIzhFclBA69DjIWAw5FO27guAEQRdBD0EfwSmCMwTnCC5KCB16xbNBVrleb5Im3szdD0NjPPs8fu8aXz7fT2YffWP86bY2wG5kuDLCIB/CynFqJUPxmhqrvdTD6SYOg5X6rkbsRETpLlbj8WFHLjXiheKbqpRmSfBd6hKvu02s7ha/GeswjlfqfymSbPP3XuR4HSTyN+M5DtW4HywNmezzl5kUUUN1PgL78eq33LDuR6iMkq9LladO5xHaewZBF0EPQR/BKYIzBOcILqr4ozw6ihpWKQtQOyVUkNoqAcEJgi6CHoI+glMEZwjOEVxUEIgVlnXFhVmswe0msewhkTuh7/oj6tW2kQVW/2MLrP4nrS3f79RU4jlvmZpvu6hpD0Ef9Wva2q9ib4TH4CkSas5G/YA5Q83PUfOLEjYtQj7LtZrc6hnYxeuZ9eAflRKrWOzb5NWEdsqpILF1zQSZdZFZD0EftTmt2iSvpl7zCDQvIbUzzKIyi66mK15Ks4qFv201RO9xo1cQxv0y+EY+1zAqLdB3C7C7zeSatpMXteZ51FkbBTF5TaF9dxD0Ud+mVU1q6x1kdo7MLqpT7oGwHYUWq5AI7H6Th0So1jnuP3K51/t3kvFB+/RUkNpvo7X1h32iFmF6QWd8Wq+DpaQSxEUd8BD0Ue+mFaQEdWR2jswuqpOmXlnvnOyIuJVq9ak3TE3VEnkfqbI9fVlVhw+bu45Y39GvSHYuiLr0HH19EIQxZ3TYYfLcGu85+mm+S6LGGWd+2EX23JqpiEnVGZnM0T9FEnV6jk/ZGnHu6AfJCcKGjnfYgvKizsDRTylRPbMdPV+n6qiecbJn1sAZ0+dpcUdPMi6JunE7+g5K9cBytOJP9cB09BPRhKd7zoL0DbMc/TY/RZQHGFVHDYGO35AD3Bkx0tPcdvTTI9TZ9B0t81K+sZwx6QF1T3T0DYzKDhVrk+qBuvk4CzIGI66ygJNZwFSvGdXrMes6s8OurOe9HjoL0pbZdfTjFJQHBo4WXYlWbGdGtT7iKmqczA11lmPaM1y1z6n21VTMmZN+Hpkqn0wqn0ZMXdOMakcNwI5P57ry2Yj2mamcZlJeG6uMmpEZdc9UOMnjpqO38CCI7YzoWDJn1jByqXGQ57nZOY6chz2yP4jkKYhSI5RrNYp2b9XImxzmKfnnLN7ln/S+uHGmZjHlt40UK5nob2ogX8dxVn457r293xlxoie/+Zr63Y1eXiciyG6MndjJRG+fkf8SvVGl/tVbJIWTXaAFAtuy+wNu57YO7Xh5A3dv49Vqmh+4+4/Y7v54n//133aOx3WRovRFkdKKfJZRWbxz+kV/Lgt1Tr+o1X2aVVVq3/IvVaX6t3rnO9W+6Hf/B1BLAwQUAAAACAA8RpdcmW29gX8PAAALWAAAGAAAAHhsL3dvcmtzaGVldHMvc2hlZXQ3LnhtbK2cb5eiSLLGvwqnXtyd7TNTSib+ga2uc0oFBGd6art6Zl/TmracRnEAq6bm028mkiAaPHrn3jfdyi8zMoknSDOigIe3NPueb4QojD+3yS7/eLcpir3T6+XLjdhG+X26FztJ1mm2jQr5NfvWy/eZiFZlp23SY/3+sLeN4t3d40N57Dl7fEgPRRLvxHNm5IftNsreJyJJ3z7emXf6wOf426ZQB3qPD/vom3gRxW/750x+69VWVvFW7PI43RmZWH+8ezKdz9ZIdShb/B6Lt/zks1Gk+5/FupiKJJGN+Z3xV5puX5ZRIj6p2cuDZr9/cvRF9fw5epeTVf0l5hIrh3xN0+/qULD6eNdX5yUSsSzURCL536s4DvHMmDydP8q5qc/13FXX0896ll7pROmUr1Eupmnyn3hVbD7eje+MlVhHh6Rojtn3Zt/mo0GNPqdvc1H5zLq31GDLNMnLf423Y6dB3Wl5yIt0W9lSTi/eEyE/yaG28a48tI3+rNx/YmF8Px4PR+YY2ahMsMoEOzMxvN0Er0zwMxOD201YlQnrzIR11RWVgUFlYHBmwOzfD4dWf8iumxhWJoZnJuzrFky7sjGqbIwuXHHVhjYxrkzYF5peNWHpsOjruOifu8P8X1ipo+s8vOxbVTF1dJnnDpG6aBtfRV54cbmIXLWnnSM//N0p2drEkI/LcOsdL8Dy0p5FRfT4kKVvRqa6yCHUhydlppJZzlMtkb1lxSYVGw0v2RSwGWAuYB5gPmBzwALAQsAWNOtJ/9VOZLUTWbehCWBTwGaAuYB5gPmAzQELAAsBW9Cs5UReO5EDJwI2BWwGmAuYB5gP2BywALAQsAXNWk60aidawImATQGbAeYC5gHmAzYHLAAsBGxBs5YT5QJb7l3qhbbezdTeHRytsH5pJd6pHeRLkUkey2W2ePz3b79+efoS/PrpoVdI6+pg4/6q82hEuB+wGWAuYB5gvmZjwv36JM2Ok3yOdlnxbrwc9vskFjlxqgEYOgRsQU+rpdKwFmNYNaZ+uYYg1AGbAeYC5gHmV2zcJ3wNziEANkPAFvR4LSeOaieOqsYm4UTNGOFEwGaAuYB5gPmaccKJ4BwCYDMEbEGP13LiuHbiuLpiiMlNKib3Y5dOBGwGmAuYB5gP2BywALAQsAXNWk60ayfa1UZ03LHsTOVisyuMT9FWONTyWvUfDwhHV8wiBJrZwNGAeYD5gM0BC8A5hNf8I/f3pGMW9Mm3VDD7TT7Qr8bhXTqk2320e+8WQlsgldCQlKLuSWmBoIegj+AcwQCdSlh7qlMRkcSvInsnVelwRFuWkzTNvCrLroiWhTETRRQnOa2MiZTRkMzoTKQMgB6CPoJzBAN0KmEFrQ5X/R4l8SouOnQxb9CFHbeKzLq39WbxWDn72GT6ze5R2Wu2LSbDYaOqnE6+j5Yys99nIhfZq7h7fFqt5OfcMUhdGdK1gozUlSFdAfQQ9BGcIxggGFZw0Lkxfd+qn4gvItuSF8BCW4fiNhmpWaVefWKvOtGQ3M8jOEPQRdBD0EdwjmCAYIjgogO2HWodrxbLvLe6UyuzytD6XatpUIit8Sm9Jy+AmzrPRL7M4r2qkhNGptoIuR1D0EXQqyFxcfpXJ/4S/yWMnjFNkzQjJj2/auDfxTuVoV3t99suLoiOYdURdTOes3gpjB+e58//JK9CbOJpmx7kVUx0b4fVoImdY95odxg0bTJmqmSTdyXzszjfp3n0NRHGyz5NdwYb/IPKdqfaEh04ALoIejUkA6eCXUn6fzZxIciAaXVURl8fzYfeays4rhiXP07fydio+g1ObY/bxhe13yVeP8o+H+ScHnpr1bjd9JNuWrb8RbY079mg17+3R/KTaZGdPutOIOkwh9dLPeYQxhTrkzE1vD2m5Ibhe3dIDVFIAegi6NWQDKnh3w2p4Q0hdcV4Z0gNbwmpYTukhjKkhh3RMbweHU11xBzhIDDJIBhdCYLnaC8y4zmRCVveHQEjFAEAugh6NSQjYHQu5InIF4wQefQ3RR5dimwNzkUetUUeSZFH5yK3hWwqNOYYC8lIIcc3CTk97HNj0O+QEdV4EHQR9GpIyjjGMozTv8jLeHyDwldMdyo8vlR4ZJ0rPG4rPJYKj7HCTfnItLHCnFTY/n9QGBR0Zgi6CHomqAX5GnbJYPY7JLZvkPiK7U6J7UuJx/a5xHZbYltKbHes1Lpu1b1Ss6ZsxfpYfouSv+r0f5KfgfrRDEEXQY+BypOvYaf8LP2Tkr/dj5b/mu0u+XW/U/nt/pn8tcOP8rP+h7naSFHy66ZIfvP6No6ZOC4GZFyYV+Jimq7XQqYFRZxlMkB+kL/leREvqWxnykAZa4agi6DHQAHM17AzQHrse0JGiHlDhFwx3hkhJrGVG1yEiNkOEVOGiAl/BBi7IQwYDoMhGQasFQbtCg8DhaoZgi6CHgOlPF9Dan8GWABYqBkx3qJ2QKUFk1owrAW/QQuOtRiRWlSFJk78pXSqIa0FgC6CXg1JLXRtkNKCAy26WagZ9QfJ2gGVFlxqwbEWzV0hzMIuH5Mut1D4o2IZgi6CXg1Jl1sg/LtZAFioGelyq+1yS7r8oujQdnlTk2K4JsXImhQbIJejMhOCLoJeDUmXX1SLTlzezQLAQs1Il7eLQ2wgXX5RHGq7vPnLCsMlG06WbNgQuRyVYRB0EfQYKsNoSC4sF5WWE5d3s1Az0uXt4gkbSpd3FE/Y9eIJa4onDBdPOFk8YSMkB6qJIOgi6DFUE2GgJgJYAFioGSlHu8zBRlIOXOZgTZmD4TIHJ8scbIxcjuoXCLoIegzVL9hFIeLE5d0sACysGCPYgrXrDmwsXY7rDqypOzBcd+Bk3YHZyOWooICgi6DHUEGBXRQGTlzezQLAQs3IKG/XAZgtXX5RB2jfJ9zk+hzn+pzM9XkfuJyjJB5BF0GPoyReQ2qd5xeJeuNywELNKJfzdu7NZe7NL3LvtstvyK85zq85mV9zE2mB8mUEXQS9GpJamECLi5T4RItuFmpGatFOcrlMcjlOcnnzsAHHuSwnc1mOclmOclkEXQQ9jnJZDUmXg1wWsFAz0uXtXJbLXJbjXJafPJpwmrK27E64vgOi666UDx8+GJ/SYhPvvhlemiTpW27IY1SpiKM8FkEXQY+jPJaDPJaDPBawkIM8ltd5bOcekjeJK68S11GHc18OX4u0iBLydjcOMs0pgjMEXQQ9BH0E5wgGCIY1pGo4Gg7LuF/wUc+8N68EfpPF8gH2/+9PX2jXg4xziuAMQRdBD0EfwTmCAYIhB8nzQsPa9T8tOK4f8CaZ5cNTz5+tOSC5nCI4Q9BF0EPQR3COYIBgyEGevNAQPVvWJKN8hAP5i1pFjOOtR3REgwxyiuAMQRdBD0EfwTmCAYIhB8nwQsNjRL/89ssPC3PgyO3MP3FYNxkq14lflxCzOF8mUbwVGS1D1Z+86xLBGYIugh6CPoJzBAMEQwQXNQTPSalC+dXNu04Ju27F+2BMo91SJEmkbprMjbc4SYyvwljKL/FKZGJlpLvk3YjXRrERRib+OIi8MOLc2EYrIZurbY/BLGOTHrLcSNfGPomWaiekmqeZNHFvzNM38SqyH8tjy5PxanvlsLu0UEOLXSGyIpITXelhSzu5sYlehWwhdnJ62+1hFy+jQjYq0rLRNtod1tGyOGRqeDmNXWFEu9WxV7yLi/jYWjbdZ+lS5MfpHj/KLr18E+/3eupxIbb5vWHMxD7N4yI3okzIGe5+ysT6sFuVN3gp68vjQyu13zZR9k2Osk6zo5ksU6eex6r9WohczmR5yI5+XQqjHKenTk2OkKh3Wrwfz7Cal1gdpyVW/yIvlkpf+rFZAGcIugh6CPoIzhEMEAwRXNRBDp6Hs5riglWlyeRjhTUkH6EFcIagi6CHoI/gHMEAwRDBhYbQoc0iY5nIoegVAwjOEHQR9BD0EZwjGCAYIrjQEDr0hj9yWzrf7ioNfAjdX8bGNPg8/dk1vnx+mgWffGP6631rgd2IZGUkcbmE6XVqJZLoPTdWB6GW002axCv5Xa7YWbTL96lcj4+vnpErXhJ9lZ3yIou/C9Xifb9J5a/Fj8Y6SdOV/F9EWbH54xCVeB1n4kfjNU3kuh8vDZEdytvzJZFLdbkC++nqx9KwmkcijZIPAOhTp+MIvWYBQRdBD0EfwTmCAYIhgotafxRHTVHD0mUB6tnfGlIP/yI4Q9BF0EPQR3COYIBgiOCihqBYYVk3XJhVDm533meWiX2kfvUn1MMaEwtk/1MLZP+zqyM/7eVW4rUcmdpvu2hoD0EfzWt+dV7V074v8bddJPds1H3nARo+RMMvNOxKQj6Ltdzcqh3YxQNHbfGbSolVJfs2eTWhdz/UkHgZwwyZdZFZD0EfjTmvxySvpkH3ChRqSL3rYFGbRVfTDU9mWFXib1sd6r1sVAZhPC3jrxH10NREW6B/LcD7Gma3jJ29yZznRUXtLk7Jawq9SQJBH81tXvekXiaBzIbI7KI+5QGQrSm0WFWJwB52eShKZJ7j/imWB/WiOlIf9OaJGlJPkF8d/fmQySRMJXTGr+t1vBRUgLhoAh6CPprdvIZUQR2ZDZHZRX3S1EOYvZOXf22FzD7VmwFzmSIfdrLtQF1W9eHjSwwn5tBRTwr1Loi89Bx1fRDENJ3J8WVq59bYwFH3GF0Suc444fFtiefWuCSc6jPhpqP+lEf0GTg+ZWvCmOMdX314cZ5jxzu+be2iz8hRd4VQM7MdtV+n+siZMXJm1siZ0udpMUdtMi6J/OF21C8oNQPLURV/agbcUfcsEp4eOAvSN6blqOdTKSI9YFJ95BLo+B0xwBz1KDo1M9tR9x9QZzN0VJmX8o3lTEkPyN9ER/2AUdEhtebUDOSPj7MgNZgwGQWMjAJTztqkZj01+05wfAHh+azHzoK0xfuOuh2A8sDIUUVXYhTbCajRJ0yqxsjYkGc5pT3D5PiMGl9uxZyQ9POEy3jiVDxNTHlNm9Q4cgF2fDrWpc8mtM+4dBqnvDaVERWQEfVkSjnJ49xRD6UTxHYmtJamE3SsXHIdZGVs9pqV8/gu2F+i7Fu8y41ErOUq2r+XK2923KeUn4t0X35Sr4BMC7mL0d82IlqJTH2TC/k6TQv9pXnH7GFvpJna/JY59cc7lV5nUVzcGXv1NIp6ILz8S/RGtvpLvfQjme1jVSCwLXs4YnZp6ziOVw7w+JCuVvPywOP/RNv9v34u//Ufes1x1aRqfdFEWxGvYqeb906/qM+6Ue/0i8zu86Lu0vpWfqk7tb+1J9+r3//7+F9QSwMEFAAAAAgAPEaXXKt9F9cCTQAAnYECABgAAAB4bC93b3Jrc2hlZXRzL3NoZWV0OC54bWyNvV933Daad/tVtHJx1kxOT1z4Q4D0m85aiQ1IgKe783Z65lyr7UpHa2zLI8vpyXz6Q5SFAot5sOEb29IussjnR4LYQBX87T/vH/7r4y/H4+PV/7x7+/7jH7/65fHxw/Nnzz6+/uX47vbjN/cfju9X8vP9w7vbx/XHh388+/jh4Xj75rTRu7fP9OHgnr27vXv/1Xffnn7348N3395/enx79/7448PVx0/v3t0+/PbD8e39P//4lfqq/uKvd//45bH84tl33364/cfxp+Pjf3z48WH96dl5L2/u3h3ff7y7f3/1cPz5j199r56/Mstctji95D/vjv/8uPn31eP9h38//vz44vj27fpqY9Z3+9/7+3c/vb59e1zfyurNz38uJ/R2/9ufyr7+/fa39fjLHldsDhv843qgWzrPX12VAv79/v6/ym/Smz9+dSh1OL49vn4sB367/vXr8fMR/cnM03r+/306mdMP57MtG2//XU8rnsq+lvHvtx+PL+7f/n93bx5/Wd/3q6s3x59vP719bL9bvlGHxfjpjP56/8+b41OV7Te2vNnr+7cfT39e/fPzRu4ba5U9OL1u9vrTx8f7d097K0E9/nYq21dX7+7ef/779n+eEtvsQk3fOPdlu9BPu9C7Xbhv5tl5NfvxLszTLsxuF9OX78I+7cLudmHPBRzsYHrawfS7HXxxMd3TLtxuF/M302Tdl5yFf9qD3+3BD7ecn7ZcdlsuX5yjOtRr4bC/GA5fvpPzBbW/opYvDULVC0o5M5/ifPb5Cj/dOy9vH2+/+/bh/p9XD2WT9S3KP74vuylvunx1td4ZpdV69vqJ/fDEvPs9ewHsJbAALAK7BnYDLAHLwF7J7Nlav3MR9bmIur+jH4C9APYSWAAWgV0DuwGWgGVgr2R2UURzLqKBIgJ7AewlsAAsArsGdgMsAcvAXsnsooj2XEQLRQT2AthLYAFYBHYN7AZYApaBvZLZRRGncxEnKCKwF8BeAgvAIrBrYDfAErAM7JXMLorozkV0n1+sD6cX370vHeCfHh9Wfrc+kh6/+7//8Ze/ff+39Jc/f/vscd1J+WWr8tPG3gtVBvYSWAAWgV1XNgtVriepzuzX79ZXum+f/botOOw+A3slv/VFwf254P7pxdKT3MNVC+wlsAAsArt+YvNBqCecQ4J9ZmCv5Pe7KOJ8LuL89GIlFLEyLRQR2EtgAVgEdl2ZEYoI55BgnxnYK/n9Loq4nIu4PN0VwsH98MTW/unviwjsJbAALAK7BnYDLAHLwF7J7KKI6tB65gcoY4ViHQm+JBgIRoLXBG8IJoKZ4KsOvCzoRnWq68ydR9KLt3fH949Xf759d3wuPZXqDsq4xe+L/gStENfL85Zi0QFGgtcEbwgmOpU8LNTqkmKFXu2KIGx5fP3N1UH/QR+0utzBZWrNrdSTRKjeLl/cv/tw+/43iE1TbJpi0xQbwEjwmuANwUSnks+V6sZ2fHv36/HhNzk6PYjOXD3eX01XL29/+0jJNaFTZpjc+8fb149XL4+Pt3dvP8rhGQqvQnEUwlB4ACPBa4I3BBOdSn6CtlOq/7x9e/fm7rETnRlFd/i3UWzrG5ehUW2/WepA0+fR1j+W8aXPvziPn57ernX1leULr4ylP//44fb18Y9ffXg4fjw+/Hr86rvv37xZ//3x+ZUYu6XYn6AWY7cUO8BI8JrgDcFEMD/BqRPcj7e/vSuPpL8dH96J98eruvdu9i/+8pJyb9arJupvVPeTjIzgS4KBYCR4TfCGYCKYCb7qwMuCbm6Lqm/SOALBFwRfEgwEI8FrgjcEE8FM8FUHXha0Ga6qKicYyg8EXxB8STAQjASvCd4QTAQzwVcdeFnQ+amp99+437fs51o/Gd+h15lIj8d3V3++/0Zsvb9o45fHj68f7j6UiUFhJy/qTmSLARgIxjMUnizXwwP/6e5/j1fPrl7cv71/EA76ZriD//v4m7BdGm73H+/vHoUN8xdtePXjw93r49W//Hjz47+KD5HRTr5/d/9pfQwJO7i8tNoYgPosu0tnhwclXjdPhmyE8Z8XioYHCAaC8QzF6+EJCkMpN8ASsFyZ8H6vnpguowA/f7e+9Ov1bb599nMZVzyPKV5OQrUBA33gkmup5E8bySXXNJBAMBCMZyiVvEKp5MASsFyZVPInVkuuD1+vb8Mlb62kVlxyI5ZcUcnB2l8SDASjBt+/rlAseZ8lYLkyseTqsuRqLbnikm/mWjWX3Iolf5JbIww6v9Bg3C8JBoJRg6tfVyiWvM8SsFyZWHJ9WXK9llxzyZvIa8Mln8SSGyo5ePJLgoFg1GDY1xWKJe+zBCxXJpbcXJbcrCU3XPI2j6stl9yJJbdUctDQlwQDwXiGYsktlLzPErBcmVhye1lyu5bccsmb/+qJS+7Fkk9U8olKDjAQjGcolnyCkvdZApYrE0s+bUv+03/86V/Wl69ln/6V6940WTuu+yzW3VHdHdUdYCAYz1Csu4O691kClisT6+4uL3W31txxyZtIa88lX8SSeyq5p5IDDATjGYol/wy15Nd1Q7HkfZYrE0vuL0vu15J7LnmbWNYzllwdxJLPVHLyY4KBYNTkxxWKV3mfJWC5MrHk82XJ57XkM5e8KahmBVWiguqFSk4KSjAQjJoUVIOCAkvAsgYF1ZcKqlcF1aygpimoYQVVooKaA5TckIISDASjIQU1oKDAErBsQEHNpYKaVUENK6hpCmpYQZWooEZRyUlBCQaC8QzFkoOCAkvAcmViyS8V1KwKalhBTVNQwwqqRAU1pKCGFJRgIBgNKagBBQWWgGUDCmouFdSsCmpYQc3mw8GsoEpUUEMKakhBCQaC0ZCCGlBQYAlYNqCg5lJBzaqghhXUNAU1rKBKVFBDClqhXHJSUILxDMWSg4ICS8ByZWLJLxXUrApqWEFNU1DDCqpEBTWkoIYUlGAgGA0pqAEFBZaAZQMKaqbLkq/6aSYuebNPw/apRPs0ZJ+G7JNgIBgN2acB+wSWgGUD9mku7dOs9mnYPk2zT8P2qUT7NGSfhuyTYCAYDdmn6VvkDbAELBuwT3Npn2a1T8P2aZp9GrZPLdqnIfs0ZJ8EA8FoyD4N2CewBCwbsE9zaZ9mtU/D9mmafRq2z/3HH59KTvZpyD4JBoLRkH0asE9gCVg2YJ/m0j7Nap+G7dM2+7Rsn1q0T0v2ack+CQaC0ZJ9PkFxWMuCfQLLFuzTXtqnXe3Tsn3aZp+W7VOL9mnJPiuUS072STCeoVhyBSUH+wSWKxNLfmmfdrVPy/Zpm31atk8t2qcl+7RknwQDwWjJPi3YJ7AELFuwT3tpn3a1T8v2aZt9WrZPLdqnJfu0ZJ8EA8FoyT4t2CewBCxbsE97aZ92tU/L9mk3X2Rl+9SifVqyzwrlkpN9EoxnKJYc7BNYApYrE0t+aZ92tU/L9mmbfVq2Ty3apyX7tGSfBAPBaMk+LdgnsAQsW7BPe2mfdrVPy/Zpm31atk8t2qcl+7RknwQDwWjJPi3YJ7AELFuwT3tpn3a1T8v2aZt9WrZPLdqnJfu0ZJ8EA8FoyT4t2CewBCw/Menz/6/spX3a1T4t26dt9mnZPo1on5bs05J9EgwEoyX7tGCfwBKw/MSs9G2DJ6bbgf763aFT66ad9kmghDP44YkpK5z7iwrFL3EQDAQjwet6sOIqEP0TScByZWJJnxh8n35qOjk9iZH0hfqpWqNUygrlhSAABoKR4HWFVlqmAM4kActPzAiX7qvK4JsGU/PESUEtFdVSUS0BBoKR4HWFci37Z5KA5Scm11KNa9kEcNJQS021pPWGCAaCkeA1HOwNsAQsPzG5lHpcyiZ2k4FSGiolrTpEMBCMBK/hYG+AJWD5icmlNONSNmGbWNiMON45kbBNJGwEA8E4kbBNIGzAErA8gbBNl8I2rcI2sbBNm3WKWNiMON45kbBNJGwEA8E4kbBNIGzAErA8gbBNl8I2rcI2sbBNTdgmFjYjjndOJGwTCRvBQDBOJGwTCBuwBCxPIGzTpbBNq7BNLGxTE7aJhc2I450TCdtEwkYwEIwTCdsEwgYsAcsTTBdOl8I2rcI2sbBNTdimgbCJ450TCdtEwkYwEIwTCdsEwgYsAcsTTBdOl9OF07yWnKcLp+ZtE08XGnG8c6LpwgrlktN0IcF4hmLJq2FK61JVKNYc5gsrE2t+OV84LWvNeb7QNcFzPF9oxAFPR/OFFYo1JxgIxjOUal6hWPMKpZoDy5VJNXeXE4bu8PX6NlzzJoKOJwyNOOLpaMKwQrnmNGFIMJ6hWHNFNYcZQ2C5MrHmlzOGTq015xlD14TR8YyhEYc8Hc0YOpoxJBgIRkczhg5mDIElYNnBjKG7nDF0ei05zxi6JpaOZwytOOTpaMbQ0YwhwUAwOpoxdDBjCCwByw5mDN3ljKEza8l5xtA1AXUsoFYUUEcCWqFcchJQgvEMxZKDgAJLwPITE0eZ3VlAK+uOMrtmno7N04rm6cg8HZknwUAwOjJPB+YJLAHLDszTXZqnW83TsXm6zXq6bJ5WNE9H5unIPAkGgtGReTowT2AJWHZgnu7SPN1qno7N0zXzdGyeVjRPR+bpyDwJBoLRkXk6ME9gCVh2YJ7u0jzdap6OzdM183RsnlY0T0fm6cg8CQaC0ZF5VigtcezAPIHlyqRln9ylebrVPB2bp2vm6dg8rWiejszTkXkSDASjI/N0fYG8AZaAZQfi6S7F063i6Vg8fRNPz+JpRfH0JJ6exJNgIBg9iafv++MNsAQse/BOf+mdfvVOz97pm3d69k4reqcn76xQLjl5J8F4hmLJ+/p4AywBy5WJJb/UTr9qp2ft9E07PWunFbXTk3Z60k6CgWD0pJ0etBNYApY9aKe/1E6/aqdn7fRNOz1r5yRqpyft9KSdBAPB6Ek7PWgnsAQse9BOf6mdftVOz9rpm3Z61s5J1E5P2lmhXHLSToLxDMWSP0FxQKtCsebgnZWJNb+c+PR2rTlPfPqmn571cxL105N+etJPgoFg9KSfFco1B/8Elj34p7/0T7/6p2f/9M0/PfvnJPqnJ//05J8EA8HoyT8rlGsOAgosexBQfymgfhVQzwLqN/+lCwvoJAqoJwH1JKAEA8HoSUArlGsOBgosezBQf2mgfjVQzwbqm4F6NtBJNFBPBurJQAkGgtGTgVYo1xwUFFj2MPnpLxXUrwrqWUF9U1DPCjqJCupJQT0pKMFAMHpS0ArlmoODAstPTAvslb90UL86qGcHnZuDzuygk+igMznoTA5KMBCMMzlohWLNZ5BQYHkGCZ0vJXReJXRmCZ2bhM4soZMooTNJaIVyzUlCCcYzFGtOk59z3zQTsFyZWPNLC51XC53ZQudmoTNb6CRa6EwWOpOFEgwE40wWWqFcc9BQYHkGDZ0vNXReNXRmDZ2bhs6soU7U0Jk0dCYNJRgIxpk0tEK55uChwPITE9vz+dJD59VDZ/bQuXnozB7qRA+dyUMrlGtOHkownqFYc5j+BJaA5Scml/xSQ+dVQ2fW0Llp6Mwa6kQNnUlDZ9JQgoFgnElD575N3gBLwPITk0t+aaHzaqEzW+jcLHQ+a1hdbnZN4f9Vv1ts9qnWpJ8z6SfBQDDOpJ8zTH8CS8DyE5NrfWmf82qfM9vn3Oxz9r+vtevXmrRzJu0kGAjGmbRzhnlPYAlYfmJyrS+tc16tc2brnDf/7+j8+1r7fq1JN2fSTYKBYJxJN+e+Nd4AS8DyE5NrfWmb82qbM9vm3GxzXn5f67lfa9LMmTSTYCAYZ9LMuW+LN8ASsDyDZc6XljmvljmzZS7NMpfD72u9dGu9kF4upJcEA8G4kF4ufUu8AZaA5Scm1nq5tMtltcuF7XJpdrmo39V6OfRrTVpZoVxr0kqC8QzFWsPcJrAELD8xudaXVrmsVrmwVS7NKhf9+1qrfq1JJxfSSYKBYFxIJxeY1ASWgOUnJtf60iaX1SYXtsml2eRifl9r3a81aeRCGkkwEIwLaeQCs5nAErC8gEUulxa5rBa5sEUuzSIX+/tam36tSR8rlGtN+kgwnqFYa9BHYAlYXkAfK6u1XvVxYX1cmj4u0+9rbfu1Jm9cyBsJBoJxIW9cwBuBJWB5AW9cLr1xWb1xYW9cmjcuv/fGpe+NC3njQt5IMBCMC3njAt4ILAHLC3jjcumNy+qNC3vj0rxx+b03Ln1vXMgbF/JGgoFgXMgbF/BGYAlYXsAbl0tvXFZvXNgbl+aNy++9cel740LeuJA3EgwE40LeuIA3AkvA8gLeuFx647J648LeuDRvXGBpnYWW1qlQXFqHYCAYCV7Xg5WW1oETScByZdL3SCqDpXXUoXlh+ffp9dLKGxXKS2+cqfy/IxMNSCPS6zMVl4WhE0oEc4XiGhxnSP+h72Hz3/YeFNVVYV0V1hVoQBqRXp9pp679E0oEc4WduqovqKve1BUW3amwV1dadgdpQBqRXtMh3xBMBHOFnbKOl99RB7MpKyzAU2GvrLQED9KANCK9pkO+IZgI5go7ZR0vxaMOdlNWngz04gdq6lZy9+BMxf4B0oA0Nip1Ec5U6iMQTARzhWI34Qzr/8N8WMVOHdjs1GHaBMBTg178dE3dqhcASR7SgDQ2KgcAokcwEcwVdgKYdgFMJQDWPXVwmwD446pe/KhN3aoXAJkf0oA0NioHAPZHMBHMFXYCcLsAXAmAHVAd/CYA/uyqFz93U7fqBUA6iDQgjY3KAYASEkwEc4WdAPwuAF8CYDFUh3kTAH+QdRY/hFO36gVAjog0II2NygGAJxJMBHOFnQDmXQBzCYBtUR2WTQD8qdZZ/ERO3aoXAE04Ig1IY6NyADDpSDARzBV2Alh2ASwlAJ56VGrjmIo/4jqLn8+pW3UCqFQOgGhAGhsVA6hUDABgIpgrlAOosAagDl+X9xoEsJFRpTgA8TsjdateADQ1iTQgjY3KAcD0JMFEMFfYCUDtAlAlAJ6kVGpjrYo//DqLXyCpW/UCoPlKpAFpbFQOAOYsCSaCucJOAHoXgC4B8MylUhu/VfxJ2Fn8NkndqhcATWIiDUhjo3IAMJFJMBHMFXYCMLsATAmApzOV2piwYhOeZRNWaMKVdgJAEyYaG5UDIBMGmAjmCjsB7ExYFRNWAxNWGxNWbMKzbMIKTVihCRMNSGOjcgBkwgATwVxhJ4CdCatiwmpgwmpjwopNeJZNWKEJKzRhogFpbFQOgEwYYCKYK+wEsDNhVUxYDUxYbUxYsQnPsgkrNGGFJkw0II2NygGQCQNMBHOFnQB2JqyKCauBCauNCSs24UU2YYUmrNCEiQaksVE5ADJhgIlgrrATwM6EVTFhNTBhtTFhxSa8yCas0IQVmjDRgDQ2KgdAJgwwEcwVdgLYmbAqJqwGJqw3JqzZhBfZhDWasEYTJhqQxkbFADSZMMBEMFcoB6B3JqyLCeuBCeuNCWs24UU2YY0mXGknADRhorFROQAyYYCJYK6wE8DOhHUxYT0wYb0xYc0mvMgmrNGENZow0YA0NioHQCYMMBHMFXYC2JmwLiasByasNyas2YQX2YQ1mrBGEyYakMZG5QDIhAEmgrnCTgA7E9bFhPXAhPXGhDWb8CKbsEYTrrQTAJow0dioHACZMMBEMFfYCWBnwrqYsB6YsN6YsGYTXmQT1mjCGk2YaEAaG5UDIBMGmAjmCjsB7ExYFxPWAxPWGxPWbMKLbMIaTVijCRMNSGOjcgBkwgATwVxhJ4CdCetiwnpgwnpjwppNeJFNWKMJazRhogFpbFQOgEwYYCKYK+wEsDNhXUxYD0xYb0xYswmrg6zCGlVYowoTDUhjo3ICpMIAE8FcYSeBnQrrosJ6oMJ6o8KaVVgdZBfW6MIaXZhoQBoblRMgFwaYCOYKOwnsXFgXF9YDFzYbFzbswuogy7BBGTYow0QD0tiomIAhGQaYCOYK5QTMToZNkWEzkGGzkWHDMqwOsg0btOFKOwmgDRONjcoJkA0DTARzhZ0EdjZsig2bgQ2bjQ0btuHTRx2lBFCHDeow0YA0NionQDoMMBHMFXYS2OmwKTpsBjpsNjpsWIdPn3WUEkAfNujDRAPS2KicAPkwwEQwV9hJYOfDpviwGfiw2fiwYR8+fdhRSgCFuNJOAijERGOjcgIkxAATwVxhJ4GdEJsixGYgxGYjxIaF+PRpRykBNGKDRkw0II2NygmQEQNMBHOFnQR2RmyKEZuBEZuNERs24tPHHaUEUIkNKjHRgDQ2KidASgwwEcwVdhLYKbEpSmwGSmw2SmxYiU+fd5QSQCc26MREA9LYqJwAOTHARDBX2Elg58SmOLEZOLHZOLEZOLGSndigExt0YqIBaWxUToCcGGAimCvsJLBzYlOc2Ayc2Gyc2AycWMlObNCJDTox0YA0NionQE4MMBHMFXYS2DmxKU5sBk5sN05sB06sZCe26MQWnZhoQBobFROw5MQAE8FcoZyA3TmxLU5sB05sN05sB06sZCe26MSVdhJAJyYaG5UTICcGmAjmCjsJ7JzYFie2Aye2Gye2AydWshNbdGKLTkw0II2NygmQEwNMBHOFnQR2TmyLE9uBE9uNE9uBEyvZiS06sUUnJhqQxkblBMiJASaCucJOAjsntsWJ7cCJ7caJ7cCJlezEFp240k4C6MREY6NyAuTEABPBXGEngZ0T2+LEduDEduPEduDESnZii05s0YmJBqSxUTkBcmKAiWCusJPAzoltcWI7cGK7cWI7cGIlO7FFJ7boxEQD0tionAA5McBEMFfYSWDnxLY4sR04sd04sR04sZKd2KITW3RiogFpbFROgJwYYCKYK+wksHNiW5zYDpzYbpzYDpxYy05s0YktOjHRgDQ2KidATgwwEcwVdhLYObEtTmwHTmw3TmxhsakK5dWmzlRcbgppQBqRXp8PWVpyis4nEcxnKK06dYa07NS0Ed2Jlp2acNmpSuX1ZogGpBHp9ZnKyyPBCSWCuUJ5wZkKacGZaaOvk6K6KqyrwroCDUgj0usz7dS1f0KJYK6wU1f1BXXdSOlEy05NuOxUpZ264rJTRCPSazrkG4KJYK6wU9YvWHZq2pjmRMtOTbjsVKWdsuKyU0Qj0ms65BuCiWCusFPWL1h2atro4zTQRy0P5E6ojxPqI9GANDYqdhsm0keAiWCuUO42TDt9nIo+TgN9nDb6OA30UcsDuRPq44T6SDQgjY3KCZA+AkwEc4WdBHb6OBV9nAb6OG30cRroo5YHcifUxwn1kWhAGhuVEyB9BJgI5go7Cez0cSr6OA30cdro4zTQRy0P5E6ojxPqI9GANDYqJ0D6CDARzBV2Etjp41T0cRro47TRx2mkj/JA7oT6OKE+Eg1IY6NyAqSPABPBXGEngZ0+TkUfp4E+Tht9nAZTqloeyJ1wSrXSTgI4pUo0NionQFOqABPBXGEngd2U6lSmVKfBlKrbmKYbTKlqeSDX4ZRqpXICRAPS2KiYQKViAgATwVyhnECFNQFXplTdYErVbZzUDaZUtTyQ63BKtdJOAjilSjQ2KidAU6oAE8FcYSeB3ZSqK1OqbjCl6jb26gZTqloeyHU4pepwSpVoQBoblROgKVWAiWCusJPAbkrVlSlVN5hSdRvRdYMpVSMP5DqcUnU4pUo0II2NygnQlCrARDBX2ElgN6XqypSqG0ypuo0Tu4ETG9mJHTpxpZ0E0ImJxkblBMiJASaCucJOAjsndsWJ3cCJ3caJ3cCJjezEDp3YoRMTDUhjo3IC5MQAE8FcYSeBnRO74sRu4MRu48Ru4MRGdmKHTuzQiYkGpLFROQFyYoCJYK6wk8DOiV1xYjdwYrdxYjdwYiM7sUMndujERAPS2KicADkxwEQwV9hJYOfErjixGzix2zixGzixkZ3YoRM7dGKiAWlsVE6AnBhgIpgr7CSwc2JXnNgNnNhtnNgNnNjITuzQiR06MdGANDYqJ0BODDARzBV2Etg5sStO7AZO7DdO7AdObGQn9ujEHp2YaEAaGxUT8OTEABPBXKGcgN85sS9O7AdO7DdO7AdObGQn9ujElXYSQCcmGhuVEyAnBpgI5go7Ceyc2Bcn9gMn9hsn9gMnNrITe3Rij05MNCCNjcoJkBMDTARzhZ0Edk7sixP7gRP7jRP7gRNb2Yk9OrFHJyYakMZG5QTIiQEmgrnCTgI7J/bFif3Aif3Gif3Aia3sxB6duNJOAujERGOjcgLkxAATwVxhJ4GdE/vixH7gxH7jxH7gxFZ2Yo9O7NGJiQaksVE5AXJigIlgrrCTwM6JfXFiP3Biv3FiP3BiKzuxRyf26MREA9LYqJwAOTHARDBX2Elg58S+OLEfOLHfOLEfOLGVndijE3t0YqIBaWxUToCcGGAimCvsJLBzYl+c2A+c2G+c2A+c2MpO7NGJPTox0YA0NionQE4MMBHMFXYS2DmxL07sB07sN07sB05sZSf26MQenZhoQBoblRMgJwaYCOYKOwnsnNgXJ/YDJ543TjwPnNjKTjyjE8/oxEQD0tiomMBMTgwwEcwVygnMOyeeixPPAyeeN048D5zYyk48oxNX2kkAnZhobFROgJwYYCKYK+wksHPiuTjxPHDieePE88CJrezEMzrxjE5MNCCNjcoJkBMDTARzhZ0Edk48FyeeB048b5x4HjjxJDvxjE48oxMTDUhjo3IC5MQAE8FcYSeBnRPPxYnngRPPGyeeB048yU48oxNX2kkAnZhobFROgJwYYCKYK+wksHPiuTjxPHDieePE88CJJ9mJZ3TiGZ2YaEAaG5UTICcGmAjmCjsJ7Jx4Lk48D5x43jjxPHDiSXbiGZ14RicmGpDGRuUEyIkBJoK5wk4COyeeixPPAyeeN048D5x4kp14Riee0YmJBqSxUTkBcmKAiWCusJPAzonn4sTzwInnjRPPAyeeZCee0YlndGKiAWlsVE6AnBhgIpgr7CSwc+K5OPE8cOJ548TzwIkn2YlndOIZnZhoQBoblRMgJwaYCOYKOwnsnHguTjwPnHjZOPEycOJJduIFnXhBJyYakMZGxQQWcmKAiWCuUE5g2TnxUpx4GTjxsnHiZeDEk+zECzpxpZ0E0ImJxkblBMiJASaCucJOAjsnXooTLwMnXjZOvAyceJKdeEEnXtCJiQaksVE5AXJigIlgrrCTwM6Jl+LEy8CJl40TLwMndrITL+jECzox0YA0NionQE4MMBHMFXYS2DnxUpx4GTjxsnHiZeDETnbiBZ240k4C6MREY6NyAuTEABPBXGEngZ0TL8WJl4ETLxsnXgZO7GQnXtCJF3RiogFpbFROgJwYYCKYK+wksHPipTjxMnDiZePEy8CJnezECzrxgk5MNCCNjcoJkBMDTARzhZ0Edk68FCdeBk68bJx4GTixk514QSde0ImJBqSxUTkBcmKAiWCusJPAzomX4sTLwImXjRMvAyd2shMv6MQLOjHRgDQ2KidATgwwEcwVdhLYOfFSnHgZOPGyceKFlqNacDmqSuXlqIgGpBHp9fmQxeWo4HwSwXyG4nJUFcJyVPrQRLf8+/R6aR2aCuV1aM5UXIcGaUAakV6fqbhsEp1QIpgrFBeiOUNYiEYf1KauiuqqsK4K6wo0II1Ir8+0U9f+CSWCucJOXdUX1FVv6grLUVXYqystR4U0II1Ir+mQbwgmgrnCTlnHy1Hpg9mUFZajqrBXVlqOCmlAGpFe0yHfEEwEc4Wdso6Xo9IHuynrSB/Fgdy6mdxtOFOx24A0II2NSt2GM5W6DQQTwVyh2G04w6duw/rz1+W9sNugD9MmgZE+igO5dbNeAqSPSAPS2KicAOgjwUQwV9hJYNolMJUEWB/1wW0SGOmjOJBbN+slQPqINCCNjcoJgD4STARzhZ0E3C4BVxJgfdQHv0lgpI/iQG7drJcA6SPSgDQ2KicA+kgwEcwVdhLwuwR8SYD1UR/mTQIDffTiQG7drJcA6SPSgDQ2KicA+kgwEcwVdhKYdwnMJQHWR31YNgkMplS9OJBbN+slQFOqSAPS2KicAEypEkwEc4WdBJZdAktJgKdUtdqYphpMqXpxILdu1kmgUjkBogFpbFRMoFIxAYCJYK5QTqDCmoA6fF3ea5DAxknVYErViwO5dbNeAjSlijQgjY3KCcCUKsFEMFfYSUDtElAlAZ5S1Wpjr2owperFgdy6WS8BmlJFGpDGRuUEYEqVYCKYK+wkoHcJ6JIAT6lqtRFdNZhS9eJAbt2slwBNqSINSGOjcgIwpUowEcwVdhIwuwRMSYCnVLXaOLEaOLGXnVihE1faSQCdmGhsVE6AnBhgIpgr7CSwc2JVnFgNnFhtnFgNnNjLTqzQiRU6MdGANDYqJ0BODDARzBV2Etg5sSpOrAZOrDZOrAZO7GUnVujECp2YaEAaG5UTICcGmAjmCjsJ7JxYFSdWAydWGydWAyf2shMrdGKFTkw0II2NygmQEwNMBHOFnQR2TqyKE6uBE6uNE6uBE8+yEyt0YoVOTDQgjY3KCZATA0wEc4WdBHZOrIoTq4ETq40Tq4ETz7ITK3RihU5MNCCNjcoJkBMDTARzhZ0Edk6sihOrgRPrjRPrgRPPshNrdGKNTkw0II2NiglocmKAiWCuUE5A75xYFyfWAyfWGyfWAyeeZSfW6MSVdhJAJyYaG5UTICcGmAjmCjsJ7JxYFyfWAyfWGyfWAyeeZSfW6MQanZhoQBoblRMgJwaYCOYKOwnsnFgXJ9YDJ9YbJ9YDJ55lJ9boxBqdmGhAGhuVEyAnBpgI5go7CeycWBcn1gMn1hsn1gMnnmUn1ujElXYSQCcmGhuVEyAnBpgI5go7CeycWBcn1gMn1hsn1gMnnmUn1ujEGp2YaEAaG5UTICcGmAjmCjsJ7JxYFyfWAyfWGyfWAyeeZSfW6MQanZhoQBoblRMgJwaYCOYKOwnsnFgXJ9YDJ9YbJ9YDJ55lJ9boxBqdmGhAGhuVEyAnBpgI5go7CeycWBcn1gMn1hsn1gMnXmQn1ujEGp2YaEAaG5UTICcGmAjmCjsJ7JxYFyfWAyfWGyfWAydeZCfW6MQanZhoQBoblRMgJwaYCOYKOwnsnFgXJ9YDJzYbJzYDJ15kJzboxAadmGhAGhsVEzDkxAATwVyhnIDZObEpTmwGTmw2TmwGTrzITmzQiSvtJIBOTDQ2KidATgwwEcwVdhLYObEpTmwGTmw2TmwGTrzITmzQiQ06MdGANDYqJ0BODDARzBV2Etg5sSlObAZObDZObAZOvMhObNCJDTox0YA0NionQE4MMBHMFXYS2DmxKU5sBk5sNk5sBk68yE5s0Ikr7SSATkw0NionQE4MMBHMFXYS2DmxKU5sBk5sNk5sBk68yE5s0IkNOjHRgDQ2KidATgwwEcwVdhLYObEpTmwGTmw2TmwGTrzITmzQiQ06MdGANDYqJ0BODDARzBV2Etg5sSlObAZObDZObAZOvMhObNCJDTox0YA0NionQE4MMBHMFXYS2DmxKU5sBk5sNk5s2In1QXZig05s0ImJBqSxUTkBcmKAiWCusJPAzolNcWIzcGKzcWLDTqwPshMbdGKDTkw0II2NygmQEwNMBHOFnQR2TmyKE5uBE9uNE1t2Yn2QndiiE1t0YqIBaWxUTMCSEwNMBHOFcgJ258S2OLEdOLHdOLFlJ9YH2YktOnGlnQTQiYnGRuUEyIkBJoK5wk4COye2xYntwIntxoktO/HpW4FSAujEFp2YaEAaG5UTICcGmAjmCjsJ7JzYFie2Aye2Gye27MSnbwVKCaATW3RiogFpbFROgJwYYCKYK+wksHNiW5zYDpzYbpzYshOfvhUoJYBOXGknAXRiorFROQFyYoCJYK6wk8DOiW1xYjtwYrtxYstOfPpWoJQAOrFFJyYakMZG5QTIiQEmgrnCTgI7J7bFie3Aie3GiS078elbgVIC6MQWnZhoQBoblRMgJwaYCOYKOwnsnNgWJ7YDJ7YbJ7bsxKdvBUoJoBNbdGKiAWlsVE6AnBhgIpgr7CSwc2JbnNgOnNhunNgOnFjJTmzRiS06MdGANDYqJ0BODDARzBV2Etg5sS1ObAdObDdObGE5qgrl5ajOVFyOCmlAGpFenw9ZWo6KzicRzGcoLUd1hrQc1bQR3YmWo5pwOapK5XVoiAakEen1mcrLJsEJJYK5QnkhmgppIZppo6+ToroqrKvCugINSCPS6zPt1LV/QolgrrBTV/UFdd1I6UTLUU24HFWlnbriclREI9JrOuQbgolgrrBT1i9YjmramOZEy1FNuBxVpZ2y4nJURCPSazrkG4KJYK6wU9YvWI5q2ujjNNBHJQ/kTqiPE+oj0YA0Nip2GybSR4CJYK5Q7jZMO32cij5OA32cNvo4DfRRyQO5E+rjhPpINCCNjcoJkD4CTARzhZ0Edvo4FX2cBvo4bfRxGuijkgdyJ9THCfWRaEAaG5UTIH0EmAjmCjsJ7PRxKvo4DfRx2ujjNNBHJQ/kTqiPE+oj0YA0NionQPoIMBHMFXYS2OnjVPRxGujjtNHHaaSP8kDuhPo4oT4SDUhjo3ICpI8AE8FcYSeBnT5ORR+ngT5OG32cBlOqSh7InXBKtdJOAjilSjQ2KidAU6oAE8FcYSeB3ZTqVKZUp8GUqtuYphtMqSp5INfhlGqlcgJEA9LYqJhApWICABPBXKGcQIU1AVemVN1gStVtnNQNplSVPJDrcEq10k4COKVKNDYqJ0BTqgATwVxhJ4HdlKorU6puMKXqNvbqBlOqSh7IdTil6nBKlWhAGhuVE6ApVYCJYK6wk8BuStWVKVU3mFJ1G9F1gylVLQ/kOpxSdTilSjQgjY3KCdCUKsBEMFfYSWA3perKlKobTKm6jRO7gRNr2YkdOnGlnQTQiYnGRuUEyIkBJoK5wk4COyd2xYndwIndxondwIm17MQOndihExMNSGOjcgLkxAATwVxhJ4GdE7vixG7gxG7jxG7gxFp2YodO7NCJiQaksVE5AXJigIlgrrCTwM6JXXFiN3Bit3FiN3BiLTuxQyd26MREA9LYqJwAOTHARDBX2Elg58SuOLEbOLHbOLEbOLGWndihEzt0YqIBaWxUToCcGGAimCvsJLBzYlec2A2c2G2c2A2cWMtO7NCJHTox0YA0NionQE4MMBHMFXYS2DmxK07sBk7sN07sB06sZSf26MQenZhoQBobFRPw5MQAE8FcoZyA3zmxL07sB07sN07sB06sZSf26MSVdhJAJyYaG5UTICcGmAjmCjsJ7JzYFyf2Ayf2Gyf2AyfWshN7dGKPTkw0II2NygmQEwNMBHOFnQR2TuyLE/uBE/uNE/uBExvZiT06sUcnJhqQxkblBMiJASaCucJOAjsn9sWJ/cCJ/caJ/cCJjezEHp240k4C6MREY6NyAuTEABPBXGEngZ0T++LEfuDEfuPEfuDERnZij07s0YmJBqSxUTkBcmKAiWCusJPAzol9cWI/cGK/cWI/cGIjO7FHJ/boxEQD0tionAA5McBEMFfYSWDnxL44sR84sd84sR84sZGd2KMTe3RiogFpbFROgJwYYCKYK+wksHNiX5zYD5zYb5zYD5zYyE7s0Yk9OjHRgDQ2KidATgwwEcwVdhLYObEvTuwHTuw3TuwHTmxkJ/boxB6dmGhAGhuVEyAnBpgI5go7Ceyc2Bcn9gMnnjdOPA+c2MhOPKMTz+jERAPS2KiYwExODDARzBXKCcw7J56LE88DJ543TjwPnNjITjyjE1faSQCdmGhsVE6AnBhgIpgr7CSwc+K5OPE8cOJ548TzwImN7MQzOvGMTkw0II2NygmQEwNMBHOFnQR2TjwXJ54HTjxvnHgeOLGVnXhGJ57RiYkGpLFROQFyYoCJYK6wk8DOiefixPPAieeNE88DJ7ayE8/oxJV2EkAnJhoblRMgJwaYCOYKOwnsnHguTjwPnHjeOPE8cGIrO/GMTjyjExMNSGOjcgLkxAATwVxhJ4GdE8/FieeBE88bJ54HTmxlJ57RiWd0YqIBaWxUToCcGGAimCvsJLBz4rk48Txw4nnjxPPAia3sxDM68YxOTDQgjY3KCZATA0wEc4WdBHZOPBcnngdOPG+ceB44sZWdeEYnntGJiQaksVE5AXJigIlgrrCTwM6J5+LE88CJ540TzwMntrITz+jEMzox0YA0NionQE4MMBHMFXYS2DnxXJx4HjjxsnHiZeDEVnbiBZ14QScmGpDGRsUEFnJigIlgrlBOYNk58VKceBk48bJx4mXgxFZ24gWduNJOAujERGOjcgLkxAATwVxhJ4GdEy/FiZeBEy8bJ14GTmxlJ17QiRd0YqIBaWxUToCcGGAimCvsJLBz4qU48TJw4mXjxMvAiSfZiRd04gWdmGhAGhuVEyAnBpgI5go7CeyceClOvAyceNk48TJw4kl24gWduNJOAujERGOjcgLkxAATwVxhJ4GdEy/FiZeBEy8bJ14GTjzJTrygEy/oxEQD0tionAA5McBEMFfYSWDnxEtx4mXgxMvGiZeBE0+yEy/oxAs6MdGANDYqJ0BODDARzBV2Etg58VKceBk48bJx4mXgxJPsxAs68YJOTDQgjY3KCZATA0wEc4WdBHZOvBQnXgZOvGyceBk48SQ78YJOvKATEw1IY6NyAuTEABPBXGEngZ0TL8WJl4ETLxsnXmg5qgWXo6pUXo6KaEAakV6fD1lcjgrOJxHMZyguR1UhLEdlDk10y79Pr5fWoalQXofmTMV1aJAGpBHp9ZmKyybRCSWCuUJxIZozhIVozEFt6qqorgrrqrCuQAPSiPT6TDt17Z9QIpgr7NRVfUFd9aausBxVhb260nJUSAPSiPSaDvmGYCKYK+yUdbwclTmYTVlhOaoKe2Wl5aiQBqQR6TUd8g3BRDBX2CnreDkqc7Cbso70URzIrZvJ3YYzFbsNSAPS2KjUbThTqdtAMBHMFYrdhjN86jasP39d3gu7DeYwbRIY6aM4kFs36yVA+og0II2NygmAPhJMBHOFnQSmXQJTSYD10RzcJoGRPooDuXWzXgKkj0gD0tionADoI8FEMFfYScDtEnAlAdZHc/CbBEb6KA7k1s16CZA+Ig1IY6NyAqCPBBPBXGEnAb9LwJcEWB/NYd4kMNBHJw7k1s16CZA+Ig1IY6NyAqCPBBPBXGEngXmXwFwSYH00h2WTwGBK1YkDuXWzXgI0pYo0II2NygnAlCrBRDBX2Elg2SWwlAR4StWojWmqwZSqEwdy62adBCqVEyAakMZGxQQqFRMAmAjmCuUEKqwJqMPX5b0GCWycVA2mVJ04kFs36yVAU6pIA9LYqJwATKkSTARzhZ0E1C4BVRLgKVWjNvaqBlOqThzIrZv1EqApVaQBaWxUTgCmVAkmgrnCTgJ6l4AuCfCUqlEb0VWDKVUnDuTWzXoJ0JQq0oA0NionAFOqBBPBXGEnAbNLwJQEeErVqI0Tq4ETO9mJFTpxpZ0E0ImJxkblBMiJASaCucJOAjsnVsWJ1cCJ1caJ1cCJnezECp1YoRMTDUhjo3IC5MQAE8FcYSeBnROr4sRq4MRq48Rq4MROdmKFTqzQiYkGpLFROQFyYoCJYK6wk8DOiVVxYjVwYrVxYjVwYic7sUInVujERAPS2KicADkxwEQwV9hJYOfEqjixGjix2jixGjixl51YoRMrdGKiAWlsVE6AnBhgIpgr7CSwc2JVnFgNnFhtnFgNnNjLTqzQiRU6MdGANDYqJ0BODDARzBV2Etg5sSpOrAZOrDdOrAdO7GUn1ujEGp2YaEAaGxUT0OTEABPBXKGcgN45sS5OrAdOrDdOrAdO7GUn1ujElXYSQCcmGhuVEyAnBpgI5go7CeycWBcn1gMn1hsn1gMn9rITa3RijU5MNCCNjcoJkBMDTARzhZ0Edk6sixPrgRPrjRPrgRN72Yk1OrFGJyYakMZG5QTIiQEmgrnCTgI7J9bFifXAifXGifXAib3sxBqduNJOAujERGOjcgLkxAATwVxhJ4GdE+vixHrgxHrjxHrgxF52Yo1OrNGJiQaksVE5AXJigIlgrrCTwM6JdXFiPXBivXFiPXBiLzuxRifW6MREA9LYqJwAOTHARDBX2Elg58S6OLEeOLHeOLEeOLGXnVijE2t0YqIBaWxUToCcGGAimCvsJLBzYl2cWA+cWG+cWA+ceJadWKMTa3RiogFpbFROgJwYYCKYK+wksHNiXZxYD5xYb5xYD5x4lp1YoxNrdGKiAWlsVE6AnBhgIpgr7CSwc2JdnFgPnNhsnNgMnHiWndigExt0YqIBaWxUTMCQEwNMBHOFcgJm58SmOLEZOLHZOLEZOPEsO7FBJ660kwA6MdHYqJwAOTHARDBX2Elg58SmOLEZOLHZOLEZOPEsO7FBJzboxEQD0tionAA5McBEMFfYSWDnxKY4sRk4sdk4sRk48Sw7sUEnNujERAPS2KicADkxwEQwV9hJYOfEpjixGTix2TixGTjxLDuxQSeutJMAOjHR2KicADkxwEQwV9hJYOfEpjixGTix2TixGTjxLDuxQSc26MREA9LYqJwAOTHARDBX2Elg58SmOLEZOLHZOLEZOPEsO7FBJzboxEQD0tionAA5McBEMFfYSWDnxKY4sRk4sdk4sRk48Sw7sUEnNujERAPS2KicADkxwEQwV9hJYOfEpjixGTix2TixGTjxIjuxQSc26MREA9LYqJwAOTHARDBX2Elg58SmOLEZOLHZOLEZOPEiO7FBJzboxEQD0tionAA5McBEMFfYSWDnxKY4sRk4sd04sR048SI7sUUntujERAPS2KiYgCUnBpgI5grlBOzOiW1xYjtwYrtxYjtw4kV2YotOXGknAXRiorFROQFyYoCJYK6wk8DOiW1xYjtwYrtxYjtw4kV2YotObNGJiQaksVE5AXJigIlgrrCTwM6JbXFiO3Biu3FiO3DiRXZii05s0YmJBqSxUTkBcmKAiWCusJPAzoltcWI7cGK7cWI7cOJFdmKLTlxpJwF0YqKxUTkBcmKAiWCusJPAzoltcWI7cGK7cWI7cOJFdmKLTmzRiYkGpLFROQFyYoCJYK6wk8DOiW1xYjtwYrtxYjtw4kV2YotObNGJiQaksVE5AXJigIlgrrCTwM6JbXFiO3Biu3FiO3DiRXZii05s0YmJBqSxUTkBcmKAiWCusJPAzoltcWI7cGK7cWLLTmwOshNbdGKLTkw0II2NygmQEwNMBHOFnQR2TmyLE9uBE9uNE9snpRMXTLG0HNWZistRIQ1II9JrOuQbgolgrlBeMKVCWjBl2ojuRMtRTbgcVaXyOjREA9KI9JoO+YZgIpgrlMtaIZZ13fKXlZYvK73+9PHx/t3N8e4fp99s6l39VFjz6YczlU78BdKXSAPSiPQa6Q3ShDQjfdWju6pvjHWitaqeoLja1osz7dQW16oiGpFe0yHfEEwEc4VlTlCo6xO0VNaNhk5PizBJKwFWqKxwHC/OdNZiWYEGpBHpNR3yDcFEMJ+hfLk+QU9l3bjl9FmNnloCoVOh5GHeCeVyQrkkGpDGRsVOxURyCTARzOciCVfXq1aJp07FVORyGsjltJHLaRpFII/zTmiXE9ol0YA0NipHQHYJMBHMFcr9unMlagTFLqeBXU4bu5zcKAJ5oHdCvZxQL4kGpLFROQLSS4CJYD4XSb4L3C6CopfTQC+njV5OfhSBPNI7oV9O6JdEA9LYqBwB+SXARDCfiyRH4HcRFL+cBn45bfxymkcRyEO9EwrmhIJJNCCNjcoRkGACTATzuUhyBPMugiKY00Awp41gTssoAnmsd8JZ10o7EeCsK9HYqBwBzboCTATzuUhyBMsugjLrOg1mXd1GRt1hFIE82Otw2rVSOQKiAWlsVIygUjECgIlgPhdJjOBciacIXJl2dYNpV7fxU6dGEcijvQ7nXSvtRIDzrkRjo3IENO8KMBHM5yLJEahdBGXe1Q3mXd3GYp0eRSAP9zqceHU48Uo0II2NyhHQxCvARDCfiyRHoHcRlIlXN5h4dRvjdWYQgZbHex3OvDqceSUakMZG5Qho5hVgIpgrlL3gXIkaQZl5dYOZV7exYzeyYy3bsUM7rrQTAdox0dioHAHZMcBEMJ+LJN8FOzt2xY7dwI7dxo7dyI61bMcO7dihHRMNSGOjcgRkxwATwXwukhzBzo5dsWM3sGO3sWM3smMt27FDO3Zox0QD0tioHAHZMcBEMJ+LJEews2NX7NgN7Nht7NiN7FjLduzQjh3aMdGANDYqR0B2DDARzOciyRHs7NgVO3YDO3YbO3YjO9ayHTu0Y4d2TDQgjY3KEZAdA0wE87lIcgQ7O3bFjt3Ajt3Gjt3IjrVsxw7t2KEdEw1IY6NyBGTHABPBfC6SHMHOjl2xYzewY7+xYz+yYy3bsUc79mjHRAPS2KgYgSc7BpgI5nORxAj8zo59sWM/sGO/sWM/smMt27FHO660EwHaMdHYqBwB2THARDCfiyRHsLNjX+zYD+zYb+zYj+xYy3bs0Y492jHRgDQ2KkdAdgwwEcznIskR7OzYFzv2Azv2Gzv2Izs2sh17tGOPdkw0II2NyhGQHQNMBPO5SHIEOzv2xY79wI79xo79yI6NbMce7bjSTgRox0Rjo3IEZMcAE8F8LpIcwc6OfbFjP7Bjv7FjP7JjI9uxRzv2aMdEA9LYqBzBE52ET7LdnKmcAemxJz32Oz32RY/9QI/9Ro/9SI+NrMce9dijHhMNSGOjcgYOMyA/BpjPVZIz2PmxL37sB37sN37sR35sZD/26Mce/ZhoQBoblTPwmAEJMsB8rpKcwU6QfRFkPxBkvxFkPxJkIwuyR0H2KMhEA9LYqJzBjBmQIQPM5yrJGewM2RdD9gND9htD9iNDNrIhezRkj4ZMNCCNjcoZLJgBKTLAfK6SnMFOkX1RZD9Q5HmjyPNIkY2syDMq8oyKTDQgjY2KGVQqZzCTIwPM5yqJGcw7R56LI88DR543jjyPHNnIjjyjI1fayQAdmWhsVM5AYQYkyQDzuUpyBjtJnoskzwNJnjeSPI8k2ciSPKMkzyjJRAPS2KicgcYMyJIB5nOV5Ax2ljwXS54HljxvLHkeWbKVLXlGS57RkokGpLFROQODGZAmA8znKskZ7DR5Lpo8DzR53mjyPNJkK2vyjJpcaScD1GSisVE5A4sZkCcDzOcqyRnsPHkunjwPPHneePJ84ckXe/+hQn2wnYS+/vrrqz/fP/5y9/4fV/H+7dv7f368Wn8npPai7qyXC7oz0dionAu6M9GENJ9rJydztuct3AXh6neR4v3Du9v1dU+Plu1N8vT9Xt+J4KdPf3+8f7x9+1y+VUB4XyB9iTQgjUivkd4gTUhzo8Kl8OpM3elu+ek//vQv6+/mZ+obpf91cMv4L0jKc1L/+f3fOiGBEb9A+hJpQBqRXiO9QZqQ5kblkLwU0r+V9EYhzV8Q0swh/a3cS1ffv7v/9P6xkxa48wukL5EGpBHpNdIbpAlpblROa/5dWmp5Xh5Mo7A2cj5X2e2l8vLu4+u3t3fvjg+dTOCbvi+QvkQakEak10hvkCakGemrRi8f6pf1Xw5f8H3YpRpwr4v29dWL2/evj2/f3j7e3b//ePXPu7dvr/5+vHq9/nD35vhwfHN1//7tb1d3P189/nK8ejj+96fjx8eru49X727fHNeXl77DlbZXv9x/evh4df/z1Ye3t69Ld6K8/P5h3cU3Vzf3/zz+enz4w+l3rzfvd97f6W3f3z+Wtz6+fzw+PN6uB/qmvu1pPx+vfrn99bi+4vh+Pbx37z69v3t9+7i+6PH+9KJ3t+8//Xz7+vHTQ3n79TDeP17dvn/zeau793ePd59fvb70w8P96+PHz4f7+Z/rJs8+/nL34UM99LvH47uP31xdvTx+uP949/jx6vbhuB7h+397OP786f2b27+/PZ72/vrt3XrArW6/3D78Y32Xn+8fPu/m4aGc+se78vqfj8eP65G8/vTwua6vj1en93lWTm19h7cPx9s3v30+w6fjOr75fFjHN/9HvHFqwPJXmom+RBqQRqTXSG+QJqQZ6at2uR/oxtneH/U70OJ3ms9ULi7Ql0gD0oj0GukN0oQ0I311plzczTDJorG48MXtF0hfIg1II9JrpDdIE9KM9NWZcnHNlzT5daCht5rK1zn8ab56kf764t/D1d/++v3L9Ofrqxd/+eaiEf7l+PbN1du7UzNX27I3x7e3v328evPpWJrcX+7f3r1Zf15b9Yfb9x8/3K9t9qlNL63i29u/rxt9fHy4+69jecVvH365X58of7j6+e39/Zv17+Ptw+Mv//3p9oR/vns4/uHq1/u367Ph7vXV8eHTh9PT6A9Xa3N+aqWv79/84bTjchxv151+I7eGBq8poC+RBqQR6TXSG6QJaUb6ql0JeE1t+tZLHR8RxjF+aFRYEuAF0pdIA9KI9BrpDdKENCN91SiNDyzT5xtWT9/gLfs01LAcOrfsjw/HD7elz/DDb/J1D8MrLxoVBODl+M2//7D2RX49vbnUeQ/47hHpNR7bzfjYXnzuff1094/3t2vH7ygcX8IjyHgEr860JzZ/Pf68dpJLT+7P97s2aXcpuC9pu5/GNxb5BnQkSWcqjAS+xD0H3HNEeo3ve1OpPoirgdCeM+75VTsjvAH9l1T9acBi6Y2SXj/crgH/ePvfn+7e3L//x+17+Sb0+PCpYybCmPfL8SHkv/5JvvfgTSPSazykm7atuDwO7Tnjnl+1k50ouflLknsavFhcp2w/3b5dlSv8z/H1p8e7X6Xm4YfzTjrPtUqFtX5ejg/gx08PqxIWvbz6y88/370+PsgxwjFEpNd4hDeNihMXtOeMe37Vzl1akWe11uPx8eXt4+133747rkr8YnX+j6u3f3r/WNItg0fn31+tTr0moQ/L87j+8dWz3zNzUM/j+ofElNbP4/qHxLR36z7Xq1Riyq5MWXGf87rLWdzKrGj9Qz5KU47SyEdStvPyPqd1u/UPcZ92Pbuy2LF0lFM5zEncpzLrPtc/xH26tdLlKxMSm9aKlVVPpH26w7pPd5D3OT8/fTdHPJapHMsk16y830FOqJyDls9Ba78y7WVWktVisn4tp5eruaxVWf8Qj9KvZ16+4SC927Jem+sf4rutm3W20uV60PL1sJTzXuTsytVu5Kt9Xnc5ywnYcqVYkc3rDudORUpB5P25sj8xNaPWZNY/5HuupCYzc7DlShBTM356fvqQrXT8a7Fm+RqZynUwyXssJ2fks5vXN5vlq7W8mZHfTVlVaiK3UVMp5SS9W1H25yehEFsNXVoNOR1X3s+J76fL+2nx/da7sWRn5Duu3ANavge0nsoVK9ZF+1JpL5+DLfu08j5tudJtp5UqtXYy84V5iZU5ouenaQ8xB1tykK+Icn5GPr9yi8t3uCrtpRLby9K1fH7q+onvVu6SXvtVCi2/W2lJJ/kY15LIbYYqCahOAq4k5+Tk9KEciNzeF2Zkpm25y6183uXmMvLdNa+lnOXr0pWSuE5Nyn0wyemUfoPq9BtKw6fklq885OVnvC4tn5ZbPruWxMoVUeUZocTjMKc3E9+tiNvzk2NJx+/XKhd3EvdZdilXpNwBciurSyur5VbWlJMz8tn59fLy0tVVesjPT11UsQUuV4IS3600pXJLWroSvZ5EeTIe5Guk9DJUp5dR6qjlOs7rccydFrZckZN89bjSp3Hy07Hs0sj7XIWpXJFijVXpSii5L6GmciVMnXamXF2dfoYp976RW8PyMJb7xuWZpORn0qlTI79XOX7dOf5y46vOnV/OTcvnpufT24nvt6wHucjplAtZPI5lPefOc9iVO8OJ1115pMhPFFWeKEp+oqjSDiq5HSyPlE4P/FC2Osj3zHrPy09SVSxIyRZkSlttOm11uQ1Np0dT2n8ltv9lRPP5adxRPINyrR7E9ytRi0mXEZLn150nqfKljfed1qL08uR+kC5HouUj0aWV1GIr+b06PH+l5Ot4Kb1subXTS3lu9Fry4mpib2a9b8qTQz670lzLrXV5XMpPS1MilVu00n5quf3U5Qi1fISmlFju2c7++enjQmKtSmpyn8qU/oqR+yuqeLSSPVqV5kd12p/Sc9Jyz0nrko2W74/SPzJy/6g0CmKb8P361JaPsDRLSmyXyvDv8xedZ72ey/U4d3ppp+6inLY9NePy0a+Ryr1rpcv1qEU2rbf9JF39L9YuTpJ7OEqVtkK+Z7Qu17eWtisDfM9fdHoPujwzdOeZUWxXy7arl3LXyy2JLp0L3eldlFvKdO4pU9pQI7ehqmynOr2SUmd5vKhc5p3RovIM0PIzwJSW3nRa+jLeZeTxLnO6icW7+Idy48j3jSrjSEoeR1K6MN1peUtf4NAZRyodPPlJq8oDWnWe0KfbW0683B9yX6A0rnLbqkpDqTotZTFoLRu0KU8V03m+rZnKo3WlMyn3JXW5F7V8L+pSDy3Xw5Qb1Yh36lrH0ouQn89liE8e4dOlIrpTkbncVXJLb8ppm855rycnjnu+WC/WJF+rei7jCbN0ZZUpw+e50/MoTWinBS39HN3p55TxVyWPvxpVNEuJ2ZSuvNyT12UrLW9lykEa+ShNaRKM3CaY0iYYuU1Q5Rmg5GeALmen5bPTh9KKHuQ2qIyeaXn0TJfWXout/ffq+Su53SoD7kYecTefZVauVzlGIx9jGcrqjOaWi9zIV3kZyJLHscoAtzy+bYoRmY4RlZZVyy2rKZUy8nOxNOSddrwcopGP0ZQxQdMZEzQlayP3Pdan6enT99L1U1oSJbckpjy9jfj0Xq+D0iTLfn966MtblW6J7vRLSjOpOs5d2knTaSfLHaA7d0B5TunOc+o0/SDfU6UFtR2zK08O2fBLMym3krq0krozl1McTcmOpsuRaPlIdLnOdW++plwo8lO99Eo6466nYYHOuEAZx1LyqJkqbZ7qtXnlLpDbSlPmBI08J6hKL0LJvQhVehFK7kWY06mL5/79esm+6sxOqJM4dfq35d3kK92UUUbTmV8pY2pKHlNTxcaUbGNlwEoer9Jlj1reoymbGXG78j8nPT/9l0BiL6N0MuR7rqQjs6JwssEZVeqvpPqXD4w8z70e/+kmFlv6tfzyM1+XkTgtj8SVboTYi1ivkJK13NMxp+k3+b3KW8n7K1e4POaky2NFd54r5ZSNfM6qeIySPaagzlhJ6XApeaZ5WQ9y6Rxjaa7lp4oqPRYl9ljKh3Sev+qleRp0Fa+ctcKd+e4y0KzEkea1/SxXvvyUKs2/3Pqrcn0o+fpQ5TpV4nVa/r+r56f/fEq8z8ptJh9/qZX85FalJ6M6va1y/Wj5+lHl+lHy9aNLvbRcL1WGC1VnvPD08YfO5x/K0013xsRPWieQ8jHD59edfrkuw51ankFbnr/qfErhNA0gjr2sDfUPnXa6PL1U5+lVuiRK7pOYMjBp5DHoMqzXGdVz5Q51nfmZcv3I7YgqTxoln0EZYJTvJ1UGA5U8GqjK2IWSxy50OUotH6Uufq87fl+6Mkrsy5TvHT0/faZd7Gmevl7WGTMo+cjtnS6zfLozy1eaciXu84XSq0eKZ146Tp1+U7nzdefOL/eN6dw38+ljQ52xydKayM8HVXo5Su7l6NI70nLvqHQLO73Ccgfrjk+VEzfymZfh8s6nBsr0surML5dHh+o8O8rDWct3fplKlWdSdek1abnXVAb35LE9U3ZoxD1+v14HP8jXQRna7oxsl+EhI44Pfa/sur9OP7jcGZ3RwNIiG7lFNofTxFRnhqxUv/MplzLHrTtz3GX0Wsmj16qYqeqY6WmaVR4JVWUcUXXGZspop5brrMscrO7MwZaRUC2PhJZHdGcutdxTpnNPlWemEp+ZL1YZSbKLqPL5JNUxgNJ3MnLfqTSichtauk6dnlN5BqjeM6Bk0xlfKXeblu+20mB3PtdXDtHIx6jKQ0x1nmIlUdVJtFyVWr4qTZkWNZ1P2pRb2Mj3sCodQ9X5XEx5/OnefEBpZ8T51Ju1FypuU24O+d4oDxvxWfP9eu38IF87utz3+vN9/+wMP3737Yfbfxz/dPvwj7v3H6/eHn9+/ONXh2/8V1cPnz/PfPr34/2H07+mr67+fv/4eP+u/vTL8fbN8aH8ZL66+vn+/rH+8Ozzfn86Pn76cHX/UL4Hcfr+1R+/Kl/Feri9e/zq6sPth+PDT3f/ezz939q/rK/63/v1ZW9ffrj741dWL3Zx/uljhp/fJ57e4Ltv79+8uTn94rv/5/bdh//z76c/r7991n5fXvL06t+9pO7l+OvxfX35s+0P5d/1Rc+2P/x89/Dx8bzJxU+nH84bXf50efDP/nn/8F+nzx9/9/8DUEsDBBQAAAAIADxGl1ycOF5nhwgAAHrBAAANAAAAeGwvc3R5bGVzLnhtbO1dbW+jOBD+K4gfsAkhIXBqK+1WqnTS3mml9sN+pYmTcMdLjpC9dH/92UAT2jJdSOwZ415WqwLGM/N4xvZ4/MLVrniK2f2GscI6JHG6u7Y3RbH9bTTaLTYsCXefsi1Lecoqy5Ow4Lf5erTb5ixc7kSmJB5NxmNvlIRRat9cpfvkLil21iLbp8W1PbZHN1erLD09cQK7esLfDRNm/Qjja/s2jKPHPCpfDpMofqoeT8SDRRZnuVVwWRjPLZ7sflbJTnUnxKzpJFGa5eLhqOIA8LG+RutNcTm38K8LuT3WpN/nPPHkc8bl1g1ngAlTAbNuKJ0xJkwV3N7izNeP1/Yd/435D589VnWFuflkbUPvAv6cR2HcyvEFmAsLCdUiLqbdt1JN+nY8D+EmS8KOeo7SJTuwJVfE2xarP/2zaZ5ZNm918Kpsyj87TjSK46Nb4NvVg5urbVgULE/v+E2Zp3z4Jsmqrx+etlyCdR4+OZOZ3TnDLoujpWC5vm2a62dur3d3pVbqhGO5edOSeoPiubzqUvNsq4hKH+nTPAgC3/F83w+mrjOd4ggwPQngcgHms5k/c4LJlP/HESA4CTDjAgSuH3gTXhDjqY+uAuQSqO3ty/zO7W9v5R9egR6zfMnyk2ft2c/Pbq5itip4/ly0mfxvkW0Fk6wosoRfLKNwnaVhWcGeczRzWuWg4NouNqVTv2gVTbxYc+j0fvlmKUqn1/l7zxJ3er969dfYXpYKqSh9i1kDkUcfTuMKqosyQZC0o6xI+rRRZ2JV2Qy+AqHQiNXyOLdISRvH4dm8RpZLpvH6gnszCxbH94La99XJpeE0DyurCir+vhTxREuMHp4vuR9UX1ZkqhtBv0mtot0gOxl7ZxG2ttGPrPiy53DS8v6ffVawbzlbRYfy/rA6SgBRd2Dq4XYbP33LOclFEQkOTneO3Pc8ZrTibPE3q2huouWSpc+lcljBgk0BwZxasM9xtE4TVqnlQlnDZ1rWJsujn1wCMVAU9mhbP1heRAtxv+AvsHLkeCm2GTm2GosSdJDmxgZoTlurtP7Nw+0DOxR1/ONSoL9qF4asRI9ciWD1k6LG6ceB2tDqXC1Uh7ZRVYyuuyJNwiJPU9Pu6HA9qm6CnetITnV1JHvoQ421qbCsRmM+ka/ABvVpk/qUsFbysZ2Bno3KfoIGHUU7+hLJpTopgwntKtGwdeko+cXGBMUeDO+pXXMqSzsU1NrSwfObDdeedESn0KBmurpzMynhUIi6Gc6BNugUGqi2442xFC+dXoWy/Y2zwenWiTmGe0XDdWnPR6edjUnyJSiimV20gOcqKRw2aYBOpfLoAyiSp4ZQgw7yIgzyhna9mydoWonc+WoINpcUIiUPruH6zwN2Yro0wfToZMezNV5MIj10P0GNCb9noBKtD1dMsgi7/NJUE9vsJ6fw6QZQE2VUPhCeDnroJKgGcjb96H6LyejKk37Rm9LhDA08JVX0f4vSw2ehNy+sGWIQXXusYyC+jjotyChzfxi1vGcYTDs5PcMWPmkzPU2Ec/5BcPofBCd61I0IZ/BBcDofRaGkE8WoQCcmAG0689AMgOIlgzQjFxAs5ZJwdLAaTNrKrq+NWbKZyZ4DhNO0jgbCabDn4NF6DirBoHsHKsGgewASwDRiWi5NQEDd3ucAwIbXy+Fjwxv4q8PW3Irj0vTZr8Ep2ZwHwcRr4Ulh4vXYpDARO2xanHh9OS1OvG4eAye0FZpykI+J04iwTQecpm1tf+eAgMFNckITy3h1UKEzB4Gja0YRwOHVNnXgoEg3uVVihfTJLRQLKLm1ygYKrRrRYOZCRqvjkhssCTwNpmJkwNNlaYpcJ2xM44SZcuSePm2ntt2+yT29yZ273FkKxMqHeRyyGZ4JhM4MxwRCZ4ZfotgyHT0P6ibvvhV6lOMBepT9dr0OrY5BIxsz0IHLyoxGN/BVH8b5+CaHZDX2HrGOetDAlcQ6pXmQq+M02AOKP8Y2AZuGs5Bi3tjMKUjVyOg6O0nI6DfCGV3TlDrK9NWNBJ4ZYaBfHXc3JF+E/pAilA97zWnaEGnrnyAoeO2Fcih4bYM0KPSVh+LQRBP2hmiw6ZwAnAmNugaby/HBDdGz0MAK5YEBz1gaomZAMEZpZoiTDtCKffRRr0IsJukFfTyrsl02I7Ri+NcWTNSeXl8C0Uh7+h2PqdlZjfAXKQdcHTrhG3B9aOCDjtYwIcQAYTPh+AltNg8pxDJEPxXCMkQ/lX4spCLkTTQUUg7FoOi9CSv86JeG4WMzYfViv7Pch+buQd7s+FIoqgSj+bx1B8Hmugrm6ypYoKtgjrbW71zcxCiTbKKrZNoKNqUWTPFiCUfPSAZiIIrgtEnEo79pD7SjC0hhHoBG6WWifojAtJP7tJw2wf3iAv0ACesYd9LvLaiwXtDLI/dZwHPMh3gSEVjM5KNcDTfESdqj884H6IcWLn3PfLoKOdK6CyMI6w2xHaE/VtbAeKtKJ3Cg7sJoweL4+2p3cyUu7ounmO2sRbavADSeWmmYsGv7zyxPwvgkpfW4j+IiSo9Nz+hE5+aqCB9j9pIoz7Jkq3AfFw/HxGv7dP0HW0b7ZHJ865sorvqt0/VX0eA6nmC4yOIs57yidMkObHlb3+brx/LS4heca/0TGV6n3JW/9hQoT5XWniLSID6QBFCeKhfExyQ8PoinSoNk81tTfDCPD+apcrWl3Jb/ID7teQL+a0caBK7reVCJ3t62SnALlZvnif/t1CDZRA6Ij+DUr6xhbcMW8r4dQDp9z0IgpLAlQkjhshYp7eUmcgRBu7YhPiIHpAXIdgT/dj7CptrzuK7QKiQbVIPhlCCAUoQtttuo5wGl44l/7fqBaonrBkF7ikhrl8B1oRRRG+EUSAIhA5TiumU/+Ko/Gj33U6Od6MDuN4wVN/8BUEsDBBQAAAAIADxGl1yXirscwAAAABMCAAALAAAAX3JlbHMvLnJlbHOdkrluwzAMQH/F0J4wB9AhiDNl8RYE+QFWog/YEgWKRZ2/r9qlcZALGXk9PBLcHmlA7TiktoupGP0QUmla1bgBSLYlj2nOkUKu1CweNYfSQETbY0OwWiw+QC4ZZre9ZBanc6RXiFzXnaU92y9PQW+ArzpMcUJpSEszDvDN0n8y9/MMNUXlSiOVWxp40+X+duBJ0aEiWBaaRcnToh2lfx3H9pDT6a9jIrR6W+j5cWhUCo7cYyWMcWK0/jWCyQ/sfgBQSwMEFAAAAAgAPEaXXPDjmHlJAgAAEgoAAA8AAAB4bC93b3JrYm9vay54bWy9ll1v2jAUhv9KmiGxXaz5Di0iSN3armjThtqqvYxMYshRHRvZToH++jkJGYFU6SqgV/GH8vjR6/jEgwXjTxPGnrRlSqgI9ETKed8wRJTgFIlTNsdUzUwZT5FUXT4zxJxjFIsEY5kSwzZN30gRUH04qFhjbgwHeeMB8EJsxvOu9gwCJkBArgK9aBOsaylQSOEFx4Fu6ppI2OKGcXhhVCJyF3FGSKBb5cQD5hKixvBd7nOPJqIYWT4CjdmioK2qtuOr3qLoPEIsk0C3Hdvzq7EbDLNEqtdtNx+UaHKLJLBA90313hS4kMUiBRRFEp6xWq/sZZJdA5GYXyKJf3CWzYHOchMVhFFLokitepaR9/n/hM6mU4jwJYuyFFNZps4xyQWpSGAudI2iFKsltTGaYe2z/SXPRa0yisuMpDKrJc77oCb4KC4cj+djFz6iJmO3yNjHlXEaMk6LjHNcGbch47bIuMeV8b7uyngtMt5xZcaISr6qufgtLv5HuOycp16LT+9DNmpH6KxF6KwoQlXlifEUKI5/K9h2b82/WkaYhN8yVc1GNBxzoDK8B0mwCK1Q1RHC8tpbrWvqw0+3V9cnA6NGeg0bLglNT0vchfp/vALqbkpX96Rz0bH6nZ8d198bbSn0ugptuI61N9dWXKfBdd7kvi9h51AJK1DXbeh6e3NdxV1/lAfleopbHr7a19DbG+v/w+58aG+j37dxvUNtXG8T8LZyI2Rj+3ArSDTmWv4ozsG5Zdrn6iaTEfJdjf2hvxiKq0tKdUcb/gVQSwMEFAAAAAgAPEaXXJ8mmWjXAAAA8AUAABoAAAB4bC9fcmVscy93b3JrYm9vay54bWwucmVsc8XUzQ6CMAwH8FchewCLoIgGPHnxanyBBctHBLasNerbi3rAGg9eyE5L2+zf36nZAVvNjempbiwFt67tKVc1s90AUFFjp2lmLPbDpDSu0zyUrgKri7OuEKIwTMB9Zqht9pkZHO8W/0k0ZdkUuDPFpcOefwTD1bgz1YisgqN2FXKu4NaObYLXM58NySrYn3Ll9qe5At+gSIAi/6BYgGL/oIUALfyDlgK09A9KBCjxD1oJ0Mo/KBWgdEIQ8b1FGjXvWqxfT7ieh784bn+V7+bX5QufCBAHfvsAUEsDBBQAAAAIADxGl1wHEN2fVAEAAG8IAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbM2Wz07CQBDGX6Xp1dBFVDSGchGvysEXWLdTumH/ZWcp8PbOFkuigSqBhF66bWfm+307s0k7+dg6wGSjlcE8rUJwz4yhqEBzzKwDQ5HSes0DPfoFc1ws+QLYaDgcM2FNABMGIWqk08kMSr5SIXnd0GuU1uSpB4Vp8rJLjKw85c4pKXigOKtN8Ysy+CZkVNnkYCUd3lBCyg4SYuQ44Hhd3Vl3wJgtSymgsGKlqSSj+pnna2kWEfBeg/eygGTOfXjjmuTYRjEMWwWYdXv8m4XOAy+wAghaZTvRtiVHyIFGCLvr7dn8RqYLSJlzbx3SkfBwOq6deaweOBICH2T3FvdEkj57fxCPRQHFP9nU3rX1y2YeyJrl/B7/nPFe/0Qfo574uLuSD2F1rMb25tJzafVPbMd9T8by0BMf4574eOyJj6cr+vi0dnnpL1RcM82lafms+c+YfgFQSwECFAMUAAAACAA8RpdcRsdNSJUAAADNAAAAEAAAAAAAAAAAAAAAgAEAAAAAZG9jUHJvcHMvYXBwLnhtbFBLAQIUAxQAAAAIADxGl1wbZrDyMAEAAJsCAAARAAAAAAAAAAAAAACAAcMAAABkb2NQcm9wcy9jb3JlLnhtbFBLAQIUAxQAAAAIADxGl1yLgm5Y7AUAAI4aAAATAAAAAAAAAAAAAACAASICAAB4bC90aGVtZS90aGVtZTEueG1sUEsBAhQDFAAAAAgAPEaXXJvjKQjgDQAAj1IAABgAAAAAAAAAAAAAAICBPwgAAHhsL3dvcmtzaGVldHMvc2hlZXQxLnhtbFBLAQIUAxQAAAAIADxGl1y0uMIQHxwAABu5AAAYAAAAAAAAAAAAAACAgVUWAAB4bC93b3Jrc2hlZXRzL3NoZWV0Mi54bWxQSwECFAMUAAAACAA8Rpdc/aMFsYInAABYCgEAGAAAAAAAAAAAAAAAgIGqMgAAeGwvd29ya3NoZWV0cy9zaGVldDMueG1sUEsBAhQDFAAAAAgAPEaXXAMcnPahAAAA/QAAABgAAAAAAAAAAAAAAIABYloAAHhsL2NvbW1lbnRzL2NvbW1lbnQxLnhtbFBLAQIUAxQAAAAIADxGl1yTmmCnGQIAAL4EAAAgAAAAAAAAAAAAAACAATlbAAB4bC9kcmF3aW5ncy9jb21tZW50c0RyYXdpbmcxLnZtbFBLAQIUAxQAAAAIADxGl1zzJMirqAAAAJUBAAAjAAAAAAAAAAAAAACAAZBdAAB4bC93b3Jrc2hlZXRzL19yZWxzL3NoZWV0My54bWwucmVsc1BLAQIUAxQAAAAIADxGl1xp/mtp0ygAAIQ9AQAYAAAAAAAAAAAAAACAgXleAAB4bC93b3Jrc2hlZXRzL3NoZWV0NC54bWxQSwECFAMUAAAACAA8RpdcZ5QOtsgyAACPkQEAGAAAAAAAAAAAAAAAgIGChwAAeGwvd29ya3NoZWV0cy9zaGVldDUueG1sUEsBAhQDFAAAAAgAPEaXXAmg1vmsEAAAI10AABgAAAAAAAAAAAAAAICBgLoAAHhsL3dvcmtzaGVldHMvc2hlZXQ2LnhtbFBLAQIUAxQAAAAIADxGl1yZbb2Bfw8AAAtYAAAYAAAAAAAAAAAAAACAgWLLAAB4bC93b3Jrc2hlZXRzL3NoZWV0Ny54bWxQSwECFAMUAAAACAA8Rpdcq30X1wJNAACdgQIAGAAAAAAAAAAAAAAAgIEX2wAAeGwvd29ya3NoZWV0cy9zaGVldDgueG1sUEsBAhQDFAAAAAgAPEaXXJw4XmeHCAAAesEAAA0AAAAAAAAAAAAAAIABTygBAHhsL3N0eWxlcy54bWxQSwECFAMUAAAACAA8Rpdcl4q7HMAAAAATAgAACwAAAAAAAAAAAAAAgAEBMQEAX3JlbHMvLnJlbHNQSwECFAMUAAAACAA8Rpdc8OOYeUkCAAASCgAADwAAAAAAAAAAAAAAgAHqMQEAeGwvd29ya2Jvb2sueG1sUEsBAhQDFAAAAAgAPEaXXJ8mmWjXAAAA8AUAABoAAAAAAAAAAAAAAIABYDQBAHhsL19yZWxzL3dvcmtib29rLnhtbC5yZWxzUEsBAhQDFAAAAAgAPEaXXAcQ3Z9UAQAAbwgAABMAAAAAAAAAAAAAAIABbzUBAFtDb250ZW50X1R5cGVzXS54bWxQSwUGAAAAABMAEwANBQAA9DYBAAAA";
  const bin = atob(TEMPLATE_B64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const wb = XLSX.read(arr, { type: "array", cellStyles: true });
 
  const oldName = wb.SheetNames[0];
  const ws = wb.Sheets[oldName];
 
  // ── Helper: set cell value while keeping template style ──
  const setVal = (ref, value) => {
    if (!ws[ref]) ws[ref] = {};
    if (typeof value === "number") {
      ws[ref].t = "n"; ws[ref].v = value;
    } else {
      ws[ref].t = "s"; ws[ref].v = String(value ?? "");
    }
    delete ws[ref].f;
    // Ensure text wraps in key columns (keep column widths from template)
    try {
      const col = (ref.match(/^[A-Z]+/i) || [""])[0];
      // Columns we want to enforce wrapping for: item description (B), client info/value (C), address (C), disclaimer area (B)
      if (col === "B" || col === "C") {
        ws[ref].s = ws[ref].s || {};
        ws[ref].s.alignment = Object.assign({}, ws[ref].s.alignment || {}, { wrapText: true, vertical: "top" });
      }
    } catch (e) {
      // ignore style application errors
    }
  };
 
  const setFormula = (ref, formula) => {
    if (!ws[ref]) ws[ref] = {};
    ws[ref].t = "n";
    ws[ref].f = formula;
    ws[ref].v = 0;
    if (!ws[ref].z) ws[ref].z = "#,##0.00";
  };
 
  // ── Quotation number ──
  setVal("H5", `# ${orderId}`);
 
  // ── Client info ──
  setVal("C9",  `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim());
  setVal("C10", user.company_name ?? "");
  setVal("C11", [user.email, user.phone_number].filter(Boolean).join(" | "));
  setVal("C12", fullAddr);
  setVal("K12", paymentMethod);
 
  // ── Item rows (write actual items sequentially, then place "Nothing Follows" immediately)
  const ITEM_START = 15; // first item row
  const itemCount = items.length;

  // Write actual items starting at ITEM_START
  for (let i = 0; i < itemCount; i++) {
    const item = items[i];
    const product = item?.product ?? {};
    const row = ITEM_START + i;
    const qty = Number(item.quantity ?? 1);
    const price = Number(item.price ?? product.price ?? 0);

    setVal(`B${row}`, product.product_name ?? item.name ?? "");
    setVal(`G${row}`, product.size ?? product.variant ?? product.color ?? "");
    setVal(`H${row}`, qty);
    setVal(`I${row}`, product.unit ?? "pc");
    setVal(`J${row}`, price);
    setFormula(`K${row}`, `J${row}*H${row}`);
  }

  // Place "Nothing Follows" immediately after the last item row (no padded blank rows)
  const lastItemRow = ITEM_START + Math.max(0, itemCount) - 1; // if itemCount==0 => 14
  const nfRow = lastItemRow + 1 >= ITEM_START ? lastItemRow + 1 : ITEM_START;
  const nfBRef = `B${nfRow}`;
  ws[nfBRef] = ws[nfBRef] || {};
  ws[nfBRef].t = 's';
  ws[nfBRef].v = '***Nothing Follows***';
  // Ensure wrapText and reasonable row heights for item rows so long text doesn't overlap
  ws['!rows'] = ws['!rows'] || [];
  for (let r = ITEM_START; r <= lastItemRow; r++) {
    // set a minimum height (in points) to allow wrapped text to show; Excel will auto-adjust further
    ws['!rows'][r - 1] = Object.assign({}, ws['!rows'][r - 1] || {}, { hpt: 18 });
    // also ensure each item description cell has wrapText alignment (in case template lost it)
    const bRef = `B${r}`;
    if (!ws[bRef]) ws[bRef] = { t: 's', v: '' };
    ws[bRef].s = ws[bRef].s || {};
    ws[bRef].s.alignment = Object.assign({}, ws[bRef].s.alignment || {}, { wrapText: true, vertical: 'top' });
  }
  // ensure client/info columns wrap (C9-C12) and disclaimer area (B rows) keep wrap
  ['C9','C10','C11','C12'].forEach((ref) => {
    if (ws[ref]) {
      ws[ref].s = ws[ref].s || {};
      ws[ref].s.alignment = Object.assign({}, ws[ref].s.alignment || {}, { wrapText: true, vertical: 'top' });
    }
  });
  // If template lacks explicit column widths, set sane defaults for B (description) and K (amount)
  ws['!cols'] = ws['!cols'] || [];
  if (!ws['!cols'][1]) ws['!cols'][1] = { wch: 60 }; // B
  if (!ws['!cols'][2]) ws['!cols'][2] = { wch: 18 }; // C
 
  // ── Totals (compute immediately after the NF row so layout is compact)
  const itemsStart = 15;
  const sumEnd = Math.max(lastItemRow, itemsStart);
  const subtotalRow = nfRow + 1;
  const vatBaseRow = subtotalRow + 1;
  const vatRow = subtotalRow + 2;
  const totalRow = subtotalRow + 4;

  setFormula(`K${subtotalRow}`, `SUM(K${itemsStart}:K${sumEnd})`);
  setFormula(`K${vatBaseRow}`, `K${subtotalRow}/1.12`);
  setFormula(`K${vatRow}`, `K${subtotalRow}-K${vatBaseRow}`);
  setFormula(`K${totalRow}`, `K${vatBaseRow}+K${vatRow}`);
 
  // ── Rename sheet ──
  const newName = `Order #${orderId}`;
  wb.SheetNames[0] = newName;
  wb.Sheets[newName] = ws;
  delete wb.Sheets[oldName];
 

  // Ensure disclaimer and long text cells wrap: detect cells containing known disclaimer fragments
  try {
    const keys = Object.keys(ws);
    for (const k of keys) {
      const cell = ws[k];
      if (!cell || typeof cell.v !== 'string') continue;
      const v = cell.v;
      if (v.includes('Cancellations will be considered') || v.includes('JEM8 CIRCLE TRADING CO.')) {
        // enforce wrap and top alignment
        cell.s = cell.s || {};
        cell.s.alignment = Object.assign({}, cell.s.alignment || {}, { wrapText: true, vertical: 'top' });
        // set row height for this row
        const match = k.match(/(\d+)$/);
        if (match) {
          const rowIdx = Number(match[1]);
          ws['!rows'] = ws['!rows'] || [];
          ws['!rows'][rowIdx - 1] = Object.assign({}, ws['!rows'][rowIdx - 1] || {}, { hpt: 30 });
        }
      }
    }
  } catch (e) {
    // ignore
  }

  // Also if the template uses merged cells for the disclaimer, ensure merged columns have sufficient width
  try {
    const ensureWidth = (cIdx, minW) => {
      ws['!cols'] = ws['!cols'] || [];
      ws['!cols'][cIdx] = Object.assign({}, ws['!cols'][cIdx] || {}, { wch: Math.max((ws['!cols'][cIdx] && ws['!cols'][cIdx].wch) || 0, minW) });
    };

    const colLetterToIndex = (col) => {
      let idx = 0;
      for (let i = 0; i < col.length; i++) {
        idx = idx * 26 + (col.charCodeAt(i) - 64);
      }
      return idx - 1; // zero-based
    };

    const merges = ws['!merges'] || [];
    for (const m of merges) {
      // m.s.c..m.e.c , m.s.r..m.e.r (zero-based)
      // check top-left cell ref
      const startCol = m.s.c;
      const endCol = m.e.c;
      const startRow = m.s.r + 1;
      const endRow = m.e.r + 1;
      // examine top-left cell text to see if it contains disclaimer fragment
      const tlRef = `${String.fromCharCode(65 + startCol)}${startRow}`;
      const tl = ws[tlRef];
      if (tl && typeof tl.v === 'string' && (tl.v.includes('Cancellations will be considered') || tl.v.includes('JEM8 CIRCLE TRADING CO.'))) {
        // set widths across the merged columns to reasonable defaults
        const span = endCol - startCol + 1;
        const totalW = 90; // desired total width in characters
        const perCol = Math.max(12, Math.floor(totalW / span));
        for (let c = startCol; c <= endCol; c++) ensureWidth(c, perCol);
        // also set the row height for the merged rows
        for (let r = startRow; r <= endRow; r++) {
          ws['!rows'] = ws['!rows'] || [];
          ws['!rows'][r - 1] = Object.assign({}, ws['!rows'][r - 1] || {}, { hpt: 30 });
        }
      }
    }
  } catch (e) {
    // ignore
  }

  // Consolidate disclaimer paragraph cells into one wrapped cell (handles non-contiguous paragraph rows)
  try {
    const keysAll = Object.keys(ws);
    const labelKey = keysAll.find((k) => {
      const v = ws[k] && ws[k].v;
      return typeof v === 'string' && v.trim().toLowerCase().startsWith('disclaimer');
    });
    if (labelKey) {
      const m = labelKey.match(/([A-Z]+)(\d+)$/);
      if (m) {
        const bodyCol = 'B';
        const labelRow = Number(m[2]);
        const startRow = labelRow + 1;
        const collected = [];
        // scan a reasonable window (8 rows) and record any non-empty paragraph cells and their rows
        for (let r = startRow; r < startRow + 12; r++) {
          const ref = `${bodyCol}${r}`;
          if (ws[ref] && ws[ref].v && String(ws[ref].v).trim()) {
            collected.push({ row: r, text: String(ws[ref].v).trim() });
          }
        }
        if (collected.length) {
          const targetRef = `${bodyCol}${collected[0].row}`;
          const joined = collected.map((p) => p.text).join('\n\n');
          ws[targetRef] = ws[targetRef] || {};
          ws[targetRef].t = 's';
          ws[targetRef].v = joined;
          ws[targetRef].s = ws[targetRef].s || {};
          ws[targetRef].s.alignment = Object.assign({}, ws[targetRef].s.alignment || {}, { wrapText: true, vertical: 'top' });
          ws['!rows'] = ws['!rows'] || [];
          ws['!rows'][collected[0].row - 1] = Object.assign({}, ws['!rows'][collected[0].row - 1] || {}, { hpt: 100 });
          // clear the original paragraph cells except the target
          for (let i = 1; i < collected.length; i++) {
            const cref = `${bodyCol}${collected[i].row}`;
            if (ws[cref]) delete ws[cref];
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }
  // Ensure all text cells have wrap enabled and reasonable row heights before saving
  try {
    ws['!rows'] = ws['!rows'] || [];
    ws['!cols'] = ws['!cols'] || [];
    const keys = Object.keys(ws);
    for (const k of keys) {
      if (!k || k[0] === '!') continue;
      const cell = ws[k];
      if (!cell) continue;
      const isStringCell = cell.t === 's' || typeof cell.v === 'string';
      if (!isStringCell) continue;
      cell.s = cell.s || {};
      cell.s.alignment = Object.assign({}, cell.s.alignment || {}, { wrapText: true, vertical: 'top' });
      const m = k.match(/(\d+)$/);
      if (m) {
        const rowIdx = Number(m[1]);
        // estimate needed height: count lines and average wrap width
        const text = String(cell.v || '');
        const explicitLines = text.split(/\r?\n/).length;
        const approxCharsPerLine = 60; // conservative estimate for wrapped width
        const extraLines = Math.ceil(text.length / approxCharsPerLine);
        const lines = Math.max(explicitLines, extraLines);
        const hpt = Math.min(200, Math.max(18, lines * 14));
        ws['!rows'][rowIdx - 1] = Object.assign({}, ws['!rows'][rowIdx - 1] || {}, { hpt });
      }
    }

    // Ensure minimum column widths for key columns (B: description, C: client info/address)
    if (!ws['!cols'][1] || !ws['!cols'][1].wch || ws['!cols'][1].wch < 40) ws['!cols'][1] = Object.assign({}, ws['!cols'][1] || {}, { wch: 60 });
    if (!ws['!cols'][2] || !ws['!cols'][2].wch || ws['!cols'][2].wch < 20) ws['!cols'][2] = Object.assign({}, ws['!cols'][2] || {}, { wch: 30 });

    XLSX.writeFile(wb, `Quotation_Order_${orderId}.xlsx`, { bookType: 'xlsx', cellStyles: true });
  } catch (e) {
    console.error('Failed to write XLSX file', e);
    alert('Failed to generate XLSX file.');
  }
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

// Generic browser-friendly Excel export using ExcelJS + file-saver
export async function exportToExcel(data = [], filename = `export-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.xlsx`) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');

  // derive columns from union of object keys in order of appearance
  const keys = data && data.length
    ? Array.from(data.reduce((set, obj) => {
        Object.keys(obj || {}).forEach((k) => set.add(k));
        return set;
      }, new Set()))
    : [];

  if (!keys.length) {
    worksheet.addRow(['No data to export']);
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
      };
    });
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    const buf = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);
    return;
  }

  worksheet.columns = keys.map((k) => ({ header: String(k), key: k, width: 10 }));

  // add rows using object form so keys map correctly
  for (const rowObj of data) worksheet.addRow(rowObj);

  // compute optimal column widths based on longest line in each column
  const maxColLengths = worksheet.columns.map((col, colIndex) => {
    const headerText = String(col.header ?? '');
    let max = headerText.length;
    for (let r = 2; r <= worksheet.rowCount; r++) {
      const cell = worksheet.getRow(r).getCell(colIndex + 1);
      const val = cell.value;
      let text = '';
      if (val == null) text = '';
      else if (typeof val === 'object' && val.richText) text = val.richText.map((t) => t.text).join('');
      else text = String(val);
      const longestLine = text.split(/\r?\n/).reduce((a, b) => Math.max(a, b.length), 0);
      max = Math.max(max, longestLine);
    }
    return max;
  });

  worksheet.columns.forEach((col, i) => {
    const calculated = Math.min(Math.max(8, Math.ceil(maxColLengths[i] + 2)), 60);
    col.width = calculated;
  });

  // freeze header
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  // header styling using getRow(1)
  const headerRow = worksheet.getRow(1);
  headerRow.height = Math.max(20, headerRow.height || 20);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
    };
  });

  // style all data cells: wrap, vertical middle, borders
  for (let r = 2; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    row.alignment = { wrapText: true, vertical: 'middle' };
    for (let c = 1; c <= worksheet.columnCount; c++) {
      const cell = row.getCell(c);
      const prev = cell.alignment || {};
      cell.alignment = { wrapText: true, vertical: 'middle', horizontal: prev.horizontal || 'left' };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
      };
    }
    row.commit();
  }

  headerRow.commit();

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
}