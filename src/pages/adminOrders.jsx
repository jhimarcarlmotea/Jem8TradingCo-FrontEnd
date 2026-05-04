import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import axios from "axios";
import AdminNav from "../components/AdminNav";
//import ExcelJS from 'exceljs';
//import { saveAs } from 'file-saver';

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

const ITEMS_PER_PAGE = 20;

// ── Design tokens (matches AdminProducts) ─────────────────────────────────────
const T = {
  blue50: "#EFF6FF", blue100: "#DBEAFE", blue500: "#3B82F6", blue600: "#2563EB", blue700: "#1D4ED8",
  green50: "#ECFDF5", green100: "#D1FAE5", green500: "#10B981", green600: "#059669",
  amber50: "#FFFBEB", amber100: "#FEF3C7", amber500: "#F59E0B", amber600: "#D97706",
  purple50: "#F5F3FF", purple100: "#EDE9FE", purple500: "#8B5CF6", purple600: "#7C3AED",
  violet50: "#F5F3FF", violet100: "#EDE9FE", violet600: "#7C3AED", violet700: "#6D28D9",
  red50: "#FEF2F2", red100: "#FEE2E2", red500: "#EF4444", red600: "#DC2626",
  emerald50: "#ECFDF5", emerald100: "#D1FAE5", emerald600: "#059669",
  slate50: "#F8FAFC", slate100: "#F1F5F9", slate200: "#E2E8F0", slate300: "#CBD5E1",
  slate400: "#94A3B8", slate500: "#64748B", slate600: "#475569",
  slate700: "#374151", slate800: "#1E293B", slate900: "#0F172A",
  radius: { sm: 8, md: 12, lg: 16, xl: 20 },
  shadow: { sm: "0 1px 2px rgba(15,23,42,0.05)", md: "0 4px 12px rgba(15,23,42,0.08)", hover: "0 8px 24px rgba(15,23,42,0.12)" },
  font: "'DM Sans','Nunito',system-ui,sans-serif",
};

const STATUS_MAP = {
  processing: {
    label: "Processing",
    badge: { bg: T.violet50, color: T.violet700, border: T.violet100 },
    radio: "accent-violet-600",
    selected: "border-2 border-violet-600 bg-violet-50",
  },
  ready: {
    label: "Ready",
    badge: { bg: T.blue50, color: T.blue700, border: T.blue100 },
    radio: "accent-blue-700",
    selected: "border-2 border-blue-700 bg-blue-50",
  },
  on_the_way: {
    label: "On the way",
    badge: { bg: T.amber50, color: T.amber600, border: T.amber100 },
    radio: "accent-amber-600",
    selected: "border-2 border-amber-600 bg-amber-50",
  },
  delivered: {
    label: "Delivered",
    badge: { bg: T.emerald50, color: T.emerald600, border: T.emerald100 },
    radio: "accent-emerald-600",
    selected: "border-2 border-emerald-600 bg-emerald-50",
  },
};

const getStatusCfg = (status) =>
  STATUS_MAP[status] ?? {
    label: status ?? "—",
    badge: { bg: T.slate100, color: T.slate500, border: T.slate200 },
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

// New ExcelJS-based exporter using Reports.tsx style
async function exportOrderToExcelJS(delivery) {
  try {
    const checkout = delivery.checkout || {};
    const user = checkout.user || {};
    const items = checkout.items || [];
    const orderId = checkout.checkout_id || delivery.delivery_id || "order";
    const paid = Number(checkout.paid_amount || 0);
    const shipping = Number(checkout.shipping_fee || 0);
    const subtotal = Math.max(0, paid - shipping);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`Order_${orderId}`);

    // Layout to match sample: title at rows 5-7, client info rows 9-12, table header row 14
    ws.mergeCells('A5:G7');
    ws.getCell('A5').value = 'QUOTATION';
    ws.getCell('A5').font = { bold: true, size: 24 };
    ws.getCell('A5').alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(5).height = 28;

    // Client Info grid (rows 9-12)
    const ciStart = 9;
    // labels on A, values on B-F with right-side meta in G
    ws.getCell(`A${ciStart}`).value = 'Client Name:';
    ws.mergeCells(`B${ciStart}:F${ciStart}`);
    ws.getCell(`B${ciStart}`).value = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    ws.getCell(`G${ciStart}`).value = 'Date:';
    ws.getCell(`A${ciStart}`).font = { bold: true };

    ws.getCell(`A${ciStart+1}`).value = 'Company Name:';
    ws.mergeCells(`B${ciStart+1}:F${ciStart+1}`);
    ws.getCell(`B${ciStart+1}`).value = user.company_name || '';
    ws.getCell(`G${ciStart+1}`).value = 'Deliver:';
    ws.getCell(`A${ciStart+1}`).font = { bold: true };

    ws.getCell(`A${ciStart+2}`).value = 'Contact Details:';
    ws.mergeCells(`B${ciStart+2}:F${ciStart+2}`);
    ws.getCell(`B${ciStart+2}`).value = [user.email, user.phone_number].filter(Boolean).join(' | ');
    ws.getCell(`G${ciStart+2}`).value = 'Validity:';
    ws.getCell(`A${ciStart+2}`).font = { bold: true };

    ws.getCell(`A${ciStart+3}`).value = 'Address:';
    ws.mergeCells(`B${ciStart+3}:F${ciStart+3}`);
    ws.getCell(`B${ciStart+3}`).value = resolveCheckoutAddress(checkout) || '';
    ws.getCell(`G${ciStart+3}`).value = 'Payment & Terms';
    ws.getCell(`A${ciStart+3}`).font = { bold: true };
    // fill payment method
    ws.getCell(`G${ciStart+3}`).font = { bold: true };
    ws.getCell(`G${ciStart+3}`).value = (checkout.payment_method || 'COD').toString().replace(/_/g,' ').toUpperCase();

    // draw borders for client info grid
    for (let r = ciStart; r <= ciStart+3; r++) {
      ['A','B','C','D','E','F','G'].forEach((col) => {
        const c = ws.getCell(`${col}${r}`);
        c.border = {
          top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' }
        };
      });
    }

    const headerRow = 14;
    const cols = ['No','Description','Size/Variant','Qty','Unit','Unit Price','Amount'];
    // set column widths before laying out signature/footer so merges align
    ws.columns = [
      { width: 6 },
      { width: 36 },
      { width: 18 },
      { width: 8 },
      { width: 10 },
      { width: 14 },
      { width: 14 },
    ];
    cols.forEach((c, i) => {
      const cell = ws.getCell(headerRow, i+1);
      cell.value = c;
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE3F0' } };
      // header borders
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
    });

    // Fixed item table height to match template: rows 15..31 (17 rows)
    const ITEM_START = headerRow + 1; // 15
    const ITEM_MAX = 17;
    for (let r = 0; r < ITEM_MAX; r++) {
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
        // leave blank cells but ensure borders exist
        for (let c = 1; c <= 7; c++) ws.getCell(rowNumber, c).value = '';
      }
      // common alignment and thin borders to emulate template grid
      ws.getCell(rowNumber,1).alignment = { horizontal: 'center' };
      ws.getCell(rowNumber,4).alignment = { horizontal: 'center' };
      ws.getCell(rowNumber,6).alignment = { horizontal: 'right' };
      ws.getCell(rowNumber,7).alignment = { horizontal: 'right' };
      for (let c = 1; c <= 7; c++) {
        ws.getCell(rowNumber, c).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
      }
    }
    // place "Nothing Follows" at fixed row after items per template
    let rowIdx = ITEM_START + ITEM_MAX; // NF row

    ws.mergeCells(`A${rowIdx}:G${rowIdx}`);
    ws.getCell(`A${rowIdx}`).value = '***Nothing Follows***';
    ws.getCell(`A${rowIdx}`).font = { bold: true, color: { argb: 'FFB91C1C' } };
    ws.getCell(`A${rowIdx}`).alignment = { horizontal: 'center' };
    rowIdx++;

    ws.getCell(`F${rowIdx}`).value = 'Subtotal';
    ws.getCell(`G${rowIdx}`).value = subtotal;
    ws.getCell(`G${rowIdx}`).numFmt = '#,##0.00';
    // cyan highlight for totals area and borders (apply across A-F to match template)
    const cyanFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFAFF0FF' } };
    for (let col = 1; col <= 6; col++) {
      const letter = String.fromCharCode(64 + col);
      const cell = ws.getCell(`${letter}${rowIdx}`);
      cell.fill = cyanFill;
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
    }
    // ensure the rightmost amount cell also has border/fill (G)
    const rightCell = ws.getCell(`G${rowIdx}`);
    rightCell.fill = cyanFill;
    rightCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
    rowIdx++;
    ws.getCell(`F${rowIdx}`).value = 'Shipping';
    ws.getCell(`G${rowIdx}`).value = shipping === 0 ? 'FREE' : shipping;
    if (shipping !== 0) ws.getCell(`G${rowIdx}`).numFmt = '#,##0.00';
    // Totals rows style and borders (apply across A-F to match template)
    for (let col = 1; col <= 6; col++) {
      const letter = String.fromCharCode(64 + col);
      const cell = ws.getCell(`${letter}${rowIdx}`);
      cell.fill = cyanFill;
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
    }
    ws.getCell(`G${rowIdx}`).fill = cyanFill;
    ws.getCell(`G${rowIdx}`).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
    rowIdx++;
    ws.getCell(`F${rowIdx}`).value = 'Total Paid';
    ws.getCell(`G${rowIdx}`).value = paid;
    ws.getCell(`G${rowIdx}`).numFmt = '#,##0.00';
    ws.getCell(`F${rowIdx}`).font = { bold: true };
    ws.getCell(`G${rowIdx}`).font = { bold: true };
    // apply cyan fill and borders across A-F and G for final totals row
    for (let col = 1; col <= 6; col++) {
      const letter = String.fromCharCode(64 + col);
      const cell = ws.getCell(`${letter}${rowIdx}`);
      cell.fill = cyanFill;
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
    }
    ws.getCell(`G${rowIdx}`).fill = cyanFill;
    ws.getCell(`G${rowIdx}`).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };

    // ── Disclaimer & Signature block (mimic original template) ──
    rowIdx += 2; // add a small spacer
    const discText = `* Cancellations will be considered only if the request is made within 24 hours of placing the order. However, the cancellation request will not be entertained if the orders have been communicated to the manufacturing plant and have initiated the process of processing/shipping the items. Deposits are non-refundable and client will be charged for the irreversible fees incurred once item/s has already been processed/shipped.\n\n* JEM8 CIRCLE TRADING CO. will not be held liable for the delays due to holidays, transportation and labor strikes, typhoons, floods, earthquakes, fire, volcanic eruptions, acts of God, and the like.`;
    // Disclaimer header (light gray)
    ws.mergeCells(`A${rowIdx}:G${rowIdx}`);
    const discHeader = ws.getCell(`A${rowIdx}`);
    discHeader.value = 'Disclaimer:';
    discHeader.font = { bold: true };
    discHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    discHeader.alignment = { vertical: 'center', horizontal: 'left' };
    ws.getRow(rowIdx).height = 18;
    // Disclaimer body (merge a few rows below)
    const bodyStart = rowIdx + 1;
    ws.mergeCells(`A${bodyStart}:G${bodyStart + 2}`);
    const dcell = ws.getCell(`A${bodyStart}`);
    dcell.value = discText;
    dcell.alignment = { wrapText: true, vertical: 'top' };
    ws.getRow(bodyStart).height = 60;
    rowIdx = bodyStart + 3;

    // Signature table header (merge A:B, C:D, E:F, G)
    const sigHeaderRow = rowIdx;
    ws.mergeCells(`A${sigHeaderRow}:B${sigHeaderRow}`);
    ws.mergeCells(`C${sigHeaderRow}:D${sigHeaderRow}`);
    ws.mergeCells(`E${sigHeaderRow}:F${sigHeaderRow}`);
    // G remains single
    ws.getCell(`A${sigHeaderRow}`).value = 'Prepared By';
    ws.getCell(`C${sigHeaderRow}`).value = 'Approved By:';
    ws.getCell(`E${sigHeaderRow}`).value = 'Client Signature';
    ws.getCell(`G${sigHeaderRow}`).value = 'Reference No.';
    // make headers bold, centered, with blue background and white text to match sample
    const sigHeaderFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3A66' } };
    ['A','C','E','G'].forEach((col) => {
      const c = ws.getCell(`${col}${sigHeaderRow}`);
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      c.alignment = { horizontal: 'center', vertical: 'middle' };
      c.fill = sigHeaderFill;
      c.border = { bottom: { style: 'thin' } };
    });
    ws.getRow(sigHeaderRow).height = 18;

    // Empty signature rows (2 rows spacing) and signature lines (bottom border)
    const sigRow1 = sigHeaderRow + 1;
    const sigRow2 = sigHeaderRow + 2;
    // create merged cells for rows
    ws.mergeCells(`A${sigRow1}:B${sigRow1}`);
    ws.mergeCells(`C${sigRow1}:D${sigRow1}`);
    ws.mergeCells(`E${sigRow1}:F${sigRow1}`);
    ws.mergeCells(`A${sigRow2}:B${sigRow2}`);
    ws.mergeCells(`C${sigRow2}:D${sigRow2}`);
    ws.mergeCells(`E${sigRow2}:F${sigRow2}`);
    // add bottom border in the second row for signature lines and set heights
    ['A','C','E'].forEach((col) => {
      ws.getCell(`${col}${sigRow2}`).border = { bottom: { style: 'thin' } };
      ws.getCell(`${col}${sigRow1}`).alignment = { vertical: 'top' };
      ws.getCell(`${col}${sigRow2}`).alignment = { vertical: 'bottom' };
    });
    // highlight signature rows: sigRow1 light green, sigRow2 gray
    const greenFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDFF7E6' } };
    const grayFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6E6' } };
    ['A','B','C','D','E','F','G'].forEach((col) => {
      ws.getCell(`${col}${sigRow1}`).fill = greenFill;
      ws.getCell(`${col}${sigRow2}`).fill = grayFill;
    });
    // also give G column a signature line
    ws.getCell(`G${sigRow1}`).value = '';
    ws.getCell(`G${sigRow2}`).border = { bottom: { style: 'thin' } };
    ws.getRow(sigRow1).height = 22;
    ws.getRow(sigRow2).height = 20;

    // Role row (below signature lines)
    const roleRow = sigHeaderRow + 3;
    ws.mergeCells(`A${roleRow}:B${roleRow}`);
    ws.mergeCells(`C${roleRow}:D${roleRow}`);
    ws.mergeCells(`E${roleRow}:F${roleRow}`);
    ws.getCell(`A${roleRow}`).value = '';
    ws.getCell(`C${roleRow}`).value = '';
    ws.getCell(`E${roleRow}`).value = 'Date and Signature';
    ['A','C','E'].forEach((col) => {
      ws.getCell(`${col}${roleRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getCell(`${col}${roleRow}`).font = { italic: true };
    });
    ws.getRow(roleRow).height = 18;

    rowIdx = roleRow + 2;

    // Footer contact info (merged right area) — text removed per request
    ws.mergeCells(`A${rowIdx}:E${rowIdx}`);
    ws.getCell(`A${rowIdx}`).value = '';
    ws.getCell(`A${rowIdx}`).alignment = { wrapText: true, vertical: 'top' };
    // place email in F:G merged area to avoid truncation (left empty)
    ws.mergeCells(`F${rowIdx}:G${rowIdx}`);
    ws.getCell(`F${rowIdx}`).value = '';
    ws.getCell(`F${rowIdx}`).alignment = { vertical: 'top', horizontal: 'right', wrapText: true };

    ws.columns = [
      { width: 6 },
      { width: 36 },
      { width: 18 },
      { width: 8 },
      { width: 10 },
      { width: 14 },
      { width: 14 },
    ];

    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf]), `Quotation_Order_${orderId}.xlsx`);
  } catch (e) {
    console.error('exportOrderToExcelJS failed', e);
    alert('Failed to export Excel file.');
  }
}

function markExported(ids) {
  const prev = getExportedSet();
  ids.forEach((id) => prev.add(String(id)));
  localStorage.setItem(EXPORTED_KEY, JSON.stringify([...prev]));
}

// ── Shared inline styles (matches AdminProducts) ──────────────────────────────
const cardStyle = {
  background: "#fff",
  borderRadius: T.radius.lg,
  border: `1px solid ${T.slate200}`,
  boxShadow: T.shadow.sm,
  overflow: "hidden",
};

const inputStyle = {
  width: "100%", padding: "8px 12px",
  border: `1px solid ${T.slate200}`, borderRadius: T.radius.sm,
  fontSize: 13, color: T.slate900, background: "#fff",
  outline: "none", boxSizing: "border-box", fontFamily: T.font,
  transition: "border-color 0.15s",
};

const labelStyle = {
  display: "block", fontSize: 10, fontWeight: 700,
  color: T.slate400, marginBottom: 6,
  textTransform: "uppercase", letterSpacing: "0.5px",
};

const btnBase = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "8px 14px", borderRadius: T.radius.sm,
  fontSize: 12, fontWeight: 600, cursor: "pointer",
  transition: "all 0.12s", border: "none", fontFamily: T.font,
};

// ── Status Badge (inline-style version matching AdminProducts StatusBadge) ────
const StatusBadge = ({ status }) => {
  const cfg = getStatusCfg(status);
  return (
    <span style={{
      display: "inline-block", fontSize: 9, fontWeight: 700,
      padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap",
      background: cfg.badge.bg, color: cfg.badge.color,
      border: `1px solid ${cfg.badge.border}`,
    }}>
      {cfg.label}
    </span>
  );
};

// ── Modal Overlay (matches AdminProducts) ─────────────────────────────────────
const Overlay = ({ children, onClose, wide }) => (
  <div
    onClick={onClose}
    style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
      backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 1000, padding: 16,
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "#fff",
        width: "100%",
        maxWidth: wide ? 720 : 460,
        borderRadius: T.radius.xl,
        boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
        maxHeight: "94vh",
        overflowY: "auto",
      }}
    >
      {children}
    </div>
  </div>
);

// ── Modal Header (matches AdminProducts) ──────────────────────────────────────
const ModalHeader = ({ title, subtitle, onClose }) => (
  <div style={{
    position: "sticky", top: 0, zIndex: 10,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 20px", background: "#fff",
    borderBottom: `1px solid ${T.slate100}`,
    borderRadius: `${T.radius.xl}px ${T.radius.xl}px 0 0`,
  }}>
    <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.slate900 }}>{title}</h2>
      {subtitle && <p style={{ margin: "2px 0 0", fontSize: 11, color: T.slate400 }}>{subtitle}</p>}
    </div>
    <button
      onClick={onClose}
      style={{
        width: 32, height: 32, borderRadius: T.radius.sm,
        border: `1px solid ${T.slate200}`, background: T.slate50,
        color: T.slate500, fontSize: 16, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.12s", fontFamily: T.font,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = T.slate100)}
      onMouseLeave={(e) => (e.currentTarget.style.background = T.slate50)}
    >
      ×
    </button>
  </div>
);

// ── Product Cell ──────────────────────────────────────────────────────────────
const ProductCell = memo(function ProductCell({ checkout }) {
  const items = checkout?.items ?? [];
  const firstItem = items[0] ?? null;
  const product = firstItem?.product ?? null;
  const imageUrl = product?.image ?? null;

  const handleImgError = useCallback((e) => { e.currentTarget.style.display = "none"; }, []);

  if (!product) return <span style={{ color: T.slate300, fontSize: 11 }}>—</span>;

  const isPreOrder = product.status === "pre_order";
  const totalItems = items.length;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 180, maxWidth: 260 }}>
      <div style={{
        width: 36, height: 36, borderRadius: T.radius.sm, flexShrink: 0,
        background: T.slate100, border: `1px solid ${T.slate200}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, overflow: "hidden",
      }}>
        {imageUrl ? (
          <img src={imageUrl} alt={product.product_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={handleImgError} />
        ) : "📦"}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.slate900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={product.product_name}>
          {product.product_name}
        </div>
        <div style={{ fontSize: 10, color: T.slate400, marginTop: 2 }}>
          Qty: {firstItem?.quantity ?? 1} · ₱{fmt(firstItem?.price ?? product.price)}
        </div>
        {totalItems > 1 && (
          <div style={{ fontSize: 10, color: T.blue500, marginTop: 2 }}>
            +{totalItems - 1} more item{totalItems - 1 > 1 ? "s" : ""}
          </div>
        )}
        <span style={{
          display: "inline-block", marginTop: 2, fontSize: 9, fontWeight: 700,
          padding: "2px 7px", borderRadius: 20,
          background: isPreOrder ? T.amber50 : T.emerald50,
          color: isPreOrder ? T.amber600 : T.emerald600,
          border: `1px solid ${isPreOrder ? T.amber100 : T.emerald100}`,
        }}>
          {isPreOrder ? "⏳ Pre-order" : "✅ In stock"}
        </span>
      </div>
    </div>
  );
});

// ── Status Update Modal ───────────────────────────────────────────────────────
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
    <Overlay onClose={onClose}>
      <ModalHeader
        title="Update Delivery Status"
        subtitle={`Order #${checkout?.checkout_id}`}
        onClose={onClose}
      />
      <div style={{ padding: "20px 20px 24px" }}>
        {checkout && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            marginBottom: 16, padding: "12px 14px",
            background: T.slate50, border: `1px solid ${T.slate200}`,
            borderRadius: T.radius.md,
          }}>
            <ProductCell checkout={checkout} />
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {Object.entries(STATUS_MAP).map(([key, cfg]) => {
            const isActive = status === key;
            return (
              <label key={key} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: T.radius.md, cursor: "pointer",
                border: isActive ? `2px solid ${cfg.badge.color}` : `1px solid ${T.slate200}`,
                background: isActive ? cfg.badge.bg : "#fff",
                transition: "all 0.12s",
              }}>
                <input
                  type="radio" name="status" value={key}
                  checked={isActive} onChange={() => setStatus(key)}
                  style={{ accentColor: cfg.badge.color, width: 14, height: 14 }}
                />
                <span style={{ fontSize: 12, fontWeight: 600, color: cfg.badge.color }}>
                  {cfg.label}
                </span>
              </label>
            );
          })}
        </div>
        {error && (
          <div style={{
            padding: "8px 12px", marginBottom: 12, borderRadius: T.radius.sm,
            background: T.red50, border: `1px solid ${T.red100}`,
            fontSize: 11, color: T.red600,
          }}>{error}</div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ ...btnBase, flex: 1, justifyContent: "center", background: "#fff", color: T.slate700, border: `1px solid ${T.slate200}`, padding: "10px 0" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            ...btnBase, flex: 2, justifyContent: "center", padding: "10px 0",
            background: saving ? T.slate300 : T.blue600, color: "#fff",
            cursor: saving ? "not-allowed" : "pointer",
          }}>
            {saving ? "Saving…" : "💾 Save Changes"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── View Order Modal ──────────────────────────────────────────────────────────
const STATUS_COLORS = {
  processing: { bg: T.violet50,  color: T.violet700, border: T.violet100 },
  ready:      { bg: T.blue50,    color: T.blue700,   border: T.blue100 },
  on_the_way: { bg: T.amber50,   color: T.amber600,  border: T.amber100 },
  delivered:  { bg: T.emerald50, color: T.emerald600, border: T.emerald100 },
};
const TRACKER_LABELS = ["Ordered", "Processing", "Ready", "On The Way", "Delivered"];
const STATUS_TO_TRACKER = { processing: 1, ready: 2, on_the_way: 3, delivered: 4 };
const PAYMENT_TAGS = {
  gcash:         { label: "GCash",   color: "#0078FF" },
  deposit:       { label: "Deposit", color: "#0ea5e9" },
  bank_transfer: { label: "Bank",    color: "#6366f1" },
  cod:           { label: "COD",     color: "#f59e0b" },
  check:         { label: "Check",   color: "#64748b" },
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
    <span style={{
      display: "inline-block", padding: "3px 10px", fontSize: 11, fontWeight: 700,
      borderRadius: 20, border: `1px solid ${hexToRgba(color, 0.28)}`,
      background: hexToRgba(color, 0.12), color,
    }}>
      {label}
    </span>
  );
}

function resolveCheckoutAddress(checkout) {
  if (!checkout) return "";
  if (checkout.delivery_address_formatted && String(checkout.delivery_address_formatted).trim())
    return String(checkout.delivery_address_formatted).trim();
  const da = checkout.delivery_address;
  if (da) {
    if (typeof da === "string" && da.trim()) return da.trim();
    if (typeof da === "object") {
      if (da.formatted && String(da.formatted).trim()) return String(da.formatted).trim();
      const parts = [da.street, da.barangay, da.city, da.province, da.zip, da.country].filter(Boolean);
      if (parts.length) return parts.join(", ");
    }
  }
  const parts2 = [checkout.delivery_street, checkout.delivery_barangay, checkout.delivery_city, checkout.delivery_province, checkout.delivery_zip, checkout.delivery_country].filter(Boolean);
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
    <Overlay wide onClose={onClose}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", background: "#fff",
        borderBottom: `1px solid ${T.slate100}`,
        borderRadius: `${T.radius.xl}px ${T.radius.xl}px 0 0`,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.slate900 }}>Order #{checkout?.checkout_id}</h2>
          <div style={{ fontSize: 11, color: T.slate400, marginTop: 2 }}>Placed on {fmtDate(checkout?.created_at)}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 20,
            background: colors.bg, color: colors.color, border: `1px solid ${colors.border}`,
          }}>
            {delivery.status?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: T.radius.sm,
            border: `1px solid ${T.slate200}`, background: T.slate50,
            color: T.slate500, fontSize: 16, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "20px 20px 24px" }}>
        {/* Tracker */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "14px 16px",
          background: T.slate50, border: `1px solid ${T.slate200}`,
          borderRadius: T.radius.md, overflowX: "auto",
        }}>
          {TRACKER_LABELS.map((label, i) => {
            const isDone = i < trackerIdx;
            const isCurrent = i === trackerIdx;
            return (
              <div key={label} style={{ display: "flex", alignItems: "center", flexShrink: 0, gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, flexShrink: 0,
                    background: isDone ? T.green600 : isCurrent ? T.blue600 : T.slate200,
                    color: isDone || isCurrent ? "#fff" : T.slate400,
                  }}>
                    {isDone ? "✓" : i + 1}
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    color: isDone ? T.green600 : isCurrent ? T.blue600 : T.slate400,
                    display: "none",
                  }}
                    className="tracker-label"
                  >{label}</span>
                </div>
                {i < TRACKER_LABELS.length - 1 && (
                  <div style={{
                    minWidth: 20, height: 2, flexShrink: 0,
                    background: isDone ? T.green600 : T.slate200,
                    borderRadius: 2,
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Client */}
        <div>
          <div style={{ ...labelStyle, marginBottom: 8 }}>👤 Client Details</div>
          <div style={{
            padding: "12px 14px", background: T.slate50,
            border: `1px solid ${T.slate200}`, borderRadius: T.radius.md,
            fontSize: 12, color: T.slate700, lineHeight: 1.8,
          }}>
            <strong style={{ color: T.slate900 }}>{user?.first_name} {user?.last_name}</strong><br />
            {user?.email} · {user?.phone_number}
            {user?.company_name && (
              <div style={{ marginTop: 2, fontSize: 11, fontWeight: 600, color: T.blue600 }}>🏢 {user.company_name}</div>
            )}
            {user?.tin_number && (
              <div style={{ fontSize: 10, color: T.slate400 }}>TIN: {user.tin_number}</div>
            )}
            {fullAddress && (
              <div style={{ marginTop: 4, fontSize: 10, color: T.slate500 }}>{fullAddress}</div>
            )}
          </div>
        </div>

        {/* Payment */}
        <div>
          <div style={{ ...labelStyle, marginBottom: 8 }}>💳 Payment</div>
          <div style={{
            padding: "12px 14px", background: T.slate50,
            border: `1px solid ${T.slate200}`, borderRadius: T.radius.md,
          }}>
            {renderPaymentTag(checkout?.payment_method)}
            {checkout?.payment_details?.account_name && (
              <div style={{ marginTop: 4, fontSize: 11, color: T.slate500 }}>Name: {checkout.payment_details.account_name}</div>
            )}
            {checkout?.payment_details?.mobile_number && (
              <div style={{ fontSize: 11, color: T.slate500 }}>Number: {checkout.payment_details.mobile_number}</div>
            )}
          </div>
        </div>

        {/* Receipt */}
        {receipt?.receipt_image_url && (
          <div>
            <div style={{ ...labelStyle, marginBottom: 8 }}>🧾 Receipt</div>
            <div style={{
              padding: "12px 14px", background: T.slate50,
              border: `1px solid ${T.slate200}`, borderRadius: T.radius.md,
            }}>
              {receipt.receipt_number && (
                <div style={{ marginBottom: 8, fontSize: 10, color: T.slate400, fontFamily: "monospace" }}>{receipt.receipt_number}</div>
              )}
              <img src={receipt.receipt_image_url} alt="Receipt" style={{ width: "100%", maxHeight: 192, objectFit: "cover", borderRadius: T.radius.md, border: `1px solid ${T.slate200}` }} />
            </div>
          </div>
        )}

        {/* Items */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={labelStyle}>🛒 Items Ordered</div>
            <span style={{ fontSize: 10, color: T.slate400 }}>{items.length} item{items.length !== 1 ? "s" : ""}</span>
          </div>
          <div style={{ border: `1px solid ${T.slate200}`, borderRadius: T.radius.md, overflow: "hidden" }}>
            {items.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", fontSize: 11, color: T.slate400 }}>No item details available.</div>
            ) : (
              items.map((item, idx) => {
                const product = item.product ?? {};
                const qty = Number(item.quantity ?? 1);
                const price = Number(item.price ?? product.price ?? 0);
                const imgUrl = product.image ?? product.image_url ?? null;
                return (
                  <div key={idx} style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "12px 14px",
                    borderBottom: idx < items.length - 1 ? `1px solid ${T.slate100}` : "none",
                    background: idx % 2 === 0 ? "#fff" : T.slate50,
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: T.radius.sm, flexShrink: 0,
                      background: T.slate100, border: `1px solid ${T.slate200}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20, overflow: "hidden",
                    }}>
                      {imgUrl ? <img src={imgUrl} alt={product.product_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "📦"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.slate900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.product_name ?? "Product"}</div>
                      <div style={{ fontSize: 10, color: T.slate400, marginTop: 2 }}>Qty: {qty} × ₱{fmt(price)}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.slate800, flexShrink: 0 }}>₱{fmt(price * qty)}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Totals */}
        <div style={{
          padding: "14px 16px", background: T.slate50,
          border: `1px solid ${T.slate200}`, borderRadius: T.radius.md,
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          {[
            { label: "Subtotal", value: `₱${fmt(subtotal)}`, bold: false },
            {
              label: "Shipping",
              value: Number(checkout?.shipping_fee ?? 0) === 0 ? "FREE" : `₱${fmt(checkout?.shipping_fee)}`,
              bold: false,
              color: Number(checkout?.shipping_fee ?? 0) === 0 ? T.green600 : undefined,
            },
          ].map((row) => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.slate600 }}>
              <span>{row.label}</span>
              <span style={{ fontWeight: row.bold ? 700 : 500, color: row.color }}>{row.value}</span>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${T.slate200}`, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.slate900 }}>Total Paid</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: T.blue600 }}>₱{fmt(checkout?.paid_amount)}</span>
          </div>
        </div>

        {/* Special Instructions */}
        {(checkout?.special_instructions || delivery?.notes) && (
          <div>
            <div style={{ ...labelStyle, marginBottom: 8 }}>📝 Special Instructions</div>
            <div style={{
              padding: "12px 14px", background: T.slate50,
              border: `1px solid ${T.slate200}`, borderRadius: T.radius.md,
              fontSize: 12, color: T.slate700,
            }}>
              {checkout?.special_instructions ?? delivery?.notes}
            </div>
          </div>
        )}
      </div>
    </Overlay>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT UTILITIES (unchanged)
// ══════════════════════════════════════════════════════════════════════════════
async function loadXLSX() {
  try {
    const mod = await import("https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.mjs");
    return mod;
  } catch (e) {
    console.error("Failed to load XLSX module:", e);
    return null;
  }
}

function exportOrderToPDF(delivery) {
  const checkout = delivery.checkout;
  const user = checkout?.user ?? {};
  const items = checkout?.items ?? [];
  const fullAddr = resolveCheckoutAddress(checkout);
  const orderId = checkout?.checkout_id ?? delivery.delivery_id;
  const paid = Number(checkout?.paid_amount ?? 0);
  const shipping = Number(checkout?.shipping_fee ?? 0);
  const grandTotal = paid;
  const vatBase = grandTotal / 1.12;
  const vat = grandTotal - vatBase;
  const dateStr = checkout?.created_at
    ? new Date(checkout.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
    : new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  const paymentMethod = (checkout?.payment_method ?? "COD").replace(/_/g, " ").toUpperCase();
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

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Quotation #${orderId}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Calibri Light', Calibri, 'Segoe UI', Arial, sans-serif; font-size: 9.5pt; color: #1a1a1a; background: #fff; padding: 14px 18px; }
  .top-header { display: flex; align-items: stretch; margin-bottom: 0; }
  .logo-area { flex: 1; background: #5a9ea0; padding: 10px 16px; display: flex; flex-direction: column; justify-content: center; }
  .logo-area .company-name { font-size: 18pt; font-weight: bold; color: #fff; font-style: italic; letter-spacing: 0.5px; line-height: 1.1; }
  .logo-area .company-name span { color: #f0c040; }
  .logo-area .tagline { font-size: 8pt; color: #e0f0f0; margin-top: 2px; letter-spacing: 0.5px; }
  .quote-num-box { background: #5a9ea0; min-width: 130px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 14px; border-left: 2px solid rgba(255,255,255,0.3); }
  .quote-num-box .qnum-label { font-size: 7pt; color: #c8eaeb; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 3px; }
  .quote-num-box .qnum-val { font-size: 13pt; font-weight: bold; color: #fff; letter-spacing: 1px; }
  .quotation-bar { display: flex; border: 1.5px solid #333; margin-top: 6px; margin-bottom: 0; }
  .quotation-bar .qt-title { flex: 1; text-align: center; font-size: 18pt; font-weight: bold; letter-spacing: 2px; padding: 8px 0; color: #1a1a1a; border-right: 1.5px solid #333; }
  .quotation-bar .qt-num { min-width: 130px; background: #1a1a1a; color: #fff; font-size: 11pt; font-weight: bold; display: flex; align-items: center; justify-content: center; padding: 8px 10px; letter-spacing: 1px; }
  .info-grid { display: flex; border: 1.5px solid #333; border-top: none; margin-bottom: 0; }
  .info-left { flex: 1; border-right: 1.5px solid #333; }
  .info-right { min-width: 200px; }
  .info-row { display: flex; border-bottom: 1px solid #aaa; min-height: 22px; }
  .info-row:last-child { border-bottom: none; }
  .info-label { font-weight: bold; font-size: 8.5pt; padding: 4px 7px; min-width: 105px; max-width: 105px; border-right: 1px solid #aaa; color: #111; white-space: nowrap; }
  .info-val { font-size: 8.5pt; padding: 4px 7px; flex: 1; color: #222; }
  .items-wrap { border: 1.5px solid #333; border-top: none; }
  table.items { width: 100%; border-collapse: collapse; }
  table.items thead tr { background: #fff; }
  table.items th { font-size: 8.5pt; font-weight: bold; padding: 6px 4px; text-align: center; border: 1px solid #aaa; color: #111; }
  table.items td { font-size: 8.5pt; border: 1px solid #aaa; vertical-align: middle; color: #222; }
  .col-itemno { width: 40px; } .col-desc { width: auto; } .col-size { width: 80px; } .col-qty { width: 32px; } .col-unit { width: 36px; } .col-price { width: 90px; } .col-amount { width: 90px; }
  .nothing-follows td { text-align: center; font-weight: bold; color: #e00; font-size: 8.5pt; padding: 5px; border: 1px solid #aaa; }
  .totals-table { width: 100%; border-collapse: collapse; border: 1.5px solid #333; border-top: none; }
  .totals-table td { font-size: 8.5pt; padding: 5px 8px; border: 1px solid #aaa; }
  .tot-label { background: #aff0ff; font-weight: bold; text-align: right; color: #111; width: 88%; }
  .tot-val { background: #aff0ff; font-weight: bold; text-align: right; color: #111; width: 12%; white-space: nowrap; }
  .sig-table { width: 100%; border-collapse: collapse; border: 1.5px solid #333; border-top: none; }
  .sig-table td { border: 1.5px solid #333; font-size: 8.5pt; text-align: center; padding: 4px 6px; vertical-align: top; }
  .sig-header { font-weight: bold; color: #111; background: #f9f9f9; padding: 5px 6px !important; }
  .sig-space { height: 28px; }
  .sig-name { font-weight: bold; color: #111; padding: 3px 6px !important; background: #e8f4e8; }
  .sig-role { color: #444; font-size: 7.5pt; padding: 3px 6px !important; }
  .footer { background: #5a9ea0; margin-top: 6px; padding: 7px 14px; display: flex; justify-content: space-between; align-items: flex-start; }
  .footer-left, .footer-right { font-size: 7.5pt; color: #fff; font-style: italic; line-height: 1.6; }
  .footer-right { text-align: right; }
  @media print { body { padding: 8px 12px; } @page { margin: 10mm; } }
</style>
</head>
<body>
<div class="top-header">
  <div class="logo-area"><div class="company-name">Jem <span>8</span> circle</div><div class="tagline">Trading Co.</div></div>
  <div class="quote-num-box"><div class="qnum-label">Quotation</div><div class="qnum-val"># ${orderId}</div></div>
</div>
<div class="quotation-bar"><div class="qt-title">QUOTATION</div><div class="qt-num"># ${orderId}</div></div>
<div class="info-grid">
  <div class="info-left">
    <div class="info-row"><div class="info-label">Client Name:</div><div class="info-val">${(`${user.first_name ?? ""} ${user.last_name ?? ""}`).trim() || "—"}</div></div>
    <div class="info-row"><div class="info-label">Company Name:</div><div class="info-val">${user.company_name ?? ""}</div></div>
    <div class="info-row"><div class="info-label">Contact Details:</div><div class="info-val">${[user.email, user.phone_number].filter(Boolean).join(" | ") || "—"}</div></div>
    <div class="info-row"><div class="info-label">Address:</div><div class="info-val">${fullAddr || "—"}</div></div>
  </div>
  <div class="info-right">
    <div class="info-row"><div class="info-label">Date:</div><div class="info-val"></div></div>
    <div class="info-row"><div class="info-label">Deliver:</div><div class="info-val"></div></div>
    <div class="info-row"><div class="info-label">Validity:</div><div class="info-val"></div></div>
    <div class="info-row"><div class="info-label">Payment &amp; Terms</div><div class="info-val">${paymentMethod}</div></div>
  </div>
</div>
<div class="items-wrap">
  <table class="items">
    <thead><tr><th class="col-itemno">Item<br/>No.</th><th class="col-desc">Item Description</th><th class="col-size">Size / Color</th><th class="col-qty">Qty</th><th class="col-unit">Unit</th><th class="col-price">Unit Price<br/>(PHP)</th><th class="col-amount">Amount<br/>(PHP)</th></tr></thead>
    <tbody>${itemRows}${nfRowHtml}</tbody>
  </table>
</div>
<table class="totals-table">
  <tr><td class="tot-label">Subtotal:</td><td class="tot-val">${fmt(vatBase)}</td></tr>
  <tr><td class="tot-label">VAT:</td><td class="tot-val">${fmt(vat)}</td></tr>
  <tr><td class="tot-blank"></td><td class="tot-blank"></td></tr>
  <tr><td class="tot-label">Total Amount:</td><td class="tot-val">${fmt(grandTotal)}</td></tr>
</table>
<div class="disclaimer-wrap">
  <div class="disc-title">Disclaimer:</div>
  <p class="disc-text">* Cancellations will be considered only if the request is made within 24 hours of placing the order. However, the cancellation request will not be entertained if the orders have been communicated to the manufacturing plant and have initiated the process of processing/shipping the items. Deposits are non-refundable and client will be charged for the irreversible fees incurred once item/s has already been processed/shipped;</p>
  <p class="disc-text">*JEM8 CIRCLE TRADING CO. will not be held liable for the delays due to holidays, transportation and labor strikes, typhoons, floods, earthquakes, fire, volcanic eruptions, acts of God, and the like.</p>
</div>
<table class="sig-table">
  <tr><td class="sig-header">Prepared By</td><td class="sig-header">Approved By:</td><td class="sig-header">Client Signature</td><td class="sig-header">Reference No.</td></tr>
  <tr><td class="sig-space">&nbsp;</td><td class="sig-space">&nbsp;</td><td class="sig-space">&nbsp;</td><td class="sig-space" rowspan="3">&nbsp;</td></tr>
  <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
  <tr><td class="sig-role">Sales Executive</td><td class="sig-role">Purchasing Officer</td><td class="sig-role">Date and Signature</td></tr>
</table>
<div class="footer">
  <div class="footer-left">Tel nos: (02)624-3627 / (02) 514-656 / (02) 785-0587<br/>TeleFax: (02)805-1432<br/>Address: Unit 202 P Cityland 10 Tower1 HV Dela Costa St.Salcedo Village, Makati City</div>
  <div class="footer-right">Email: sales1.jem8circle@gmail.com /<br/>sales3.jem8circle@gmail.com</div>
</div>
<script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
}

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

  const TEMPLATE_B64 = "UEsDBBQAAAAIADxGl1xGx01IlQAAAM0AAAAQAAAAZG9jUHJvcHMvYXBwLnhtbE3PTQvCMAwG4L9SdreZih6kDkQ9ip68zy51hbYpbYT67+0EP255ecgboi6JIia2mEXxLuRtMzLHDUDWI/o+y8qhiqHke64x3YGMsRoPpB8eA8OibdeAhTEMOMzit7Dp1C5GZ3XPlkJ3sjpRJsPiWDQ6sScfq9wcChDneiU+ixNLOZcrBf+LU8sVU57mym/8ZAW/B7oXUEsDBBQAAAAIADxGl1wbZrDyMAEAAJsCAAARAAAAZG9jUHJvcHMvY29yZS54bWzFktFPwjAQxv8Vsvdx7QaozViCGB8MIMElGt+a7oDGdWvamsF/bzfZAPXdx/vuu999l1wiNBOVwbWpNBon0Q4OqigtE3oa7J3TDMCKPSpuh95R+ua2Moo7X5odaC4++A4hImQCCh3PuePQAEPdE4M0yQUTBrmrzAmfix6vP03RwnIBWKDC0lmgQwpBOttsnler2SIjNIEzo+E5NMp+C5j30Fb9k9x2IDg5D1b2rrquh3Xc+vwZFN6Wi5f24lCW1vFSoJ+ykrmjxmnQbX6N5w/ZY5BGJKIhJSGhGRmx8R0bx+9N1qt858CqyuVW/nfiSUhGYRRn5JaNfOLJReIuYJr4zyi4dcuTcH9Mn/ZScTOYc1MMlpVDnsBvUze3NrJsTr9cd8OiiJFm3Q9TK1z/YfoFUEsDBBQAAAAIADxGl1yLgm5Y7AUAAI4aAAATAAAAeGwvdGhlbWUvdGhlbWUxLnhtbO1ZW4sbNxR+L/Q/iHl35j62l3iDPbaTNrtJyG5S8iiPZY9izciM5N01IVCSx0KhNC19KfStD6VtIIG+pL9m25Q2hfyFajS+aGxNLs0GUhob7NHRd44+nXN0pJk5f+EkIeAIZQzTtGXY5ywDoDSiQ5yOW8aNw36tYQDGYTqEhKaoZcwRMy7sfvjBebjDY5QgIPRTtgNbRsz5dMc0WSTEkJ2jU5SKvhHNEshFMxubwwweC7sJMR3LCswE4tQAKUyE2aujEY4QOMxNGrtL4z0iflLOckFEsoNIjqhqSOxwYud/bM5CkoEjSFqGGGdIjw/RCTcAgYyLjpZhyY9h7p43V0qEV+gqen35WegtFIYTR+pl48FK0fN8L2iv7DuF/W1cr94LesHKngTAKBIztbewfqfZ6foLrAIqLjW2u/Wua5fwin13C9/2828J767x3ha+3w/XPlRAxaWv8UndCb0S3l/jgy183Wp3vXoJL0ExwelkC235gRsuZ7uCjCi5pIU3fa9fdxbwNcpUsqvQT3lVriXwNs36AiCDCzlOAZ9P0QhGAhdCggcZBnt4HIvEm8KUMiG2HKtvueI3/3rySnoE7iCoaBeiiG2Jcj6ARRme8pbxsbBqKJDnT358/uQReP7k4em9x6f3fjm9f//03s8axUswHauKz77/4u9vPwV/Pfru2YOv9Him4n//6bPffv1SD+Qq8OnXD/94/PDpN5//+cMDDbydwYEKP8QJYuAKOgbXaSLmphkADbLX0ziMIS5pwFggNcAej0vAK3NIdLgOKjvvZiaKhA54cXa7xPUgzmYca4CX46QE3KeUdGimnc7lfCx1OrN0rB88m6m46xAe6cYON0Lbm01FtmOdyTBGJZrXiIg2HKMUcZD30QlCGrVbGJf8uo+jjDI64uAWBh2ItS45xAOuV7qEExGXuY6gCHXJN/s3QYcSnfkuOiojxYKARGcSkZIbL8IZh4mWMUyIityDPNaRPJhnUcnhjItIjxGhoDdEjOl0rmbzEt3Lorjow75P5kkZmXE80SH3IKUqsksnYQyTqZYzTmMV+xGbiBSF4BrlWhK0vELytogDTCvDfRMj/nrL+oaoq/oEyXtmmW5JIFpej3Mygihd7AGlap7g9KWlfaOo+++Lur6otzOsXVqbpbwK9x8s4F04S68hsWbe1+/39fv/WL+r1vLZV+11oTbV07o0k1Qe3UeYkAM+J2iPyRLPxPSGfSGUDam0ulOYxuJyMVwJN86gvAYZ5Z9gHh/EcCqGseUIY7YwPWZgSpnYJIxK23KTmSX7dFhIbXt5cyoUIF/LxSazlIstiRfSoL6+C1uZl60xUwn40uirk1AGK5NwNSTq7quRsK2zYtHUsGjYL2JhKlER6w/A/LmG7xWMRL5BgoZ5nAr9ZXTPPNJVzixP29FMr+mdWaRLJJR0K5NQ0jCGQ7QpPuNYN5v6UDtaGvXG24i1uV0bSFpugWOx5lxfmIngtGWMxPFQXCZTYY/ldROScdoyIr5w9L+pLNOM8S5kcQGTXcX8E8xRBghORK6rYSDpmpvt1K13l1zTevc8Z24GGY1GKOIVknVT9BVGtL1vCM4bdCZIH8TDYzAgs+w6FI7y63buwCFmfOXNIc6U5F57caNcLZZi6aHZeolCMo3hYkdRi3kBl9crOso8JNPNWZk6Fw7G/bPYdV+utFE0KzaQemUVe3ubvMLK1bPytbWu2bBevEu8+YagUGvoqbl6alV7xxkeCJThggq/OZXRfMPdYDNrTeVcKVtbbyfo4LbI/K44rs4IZ8VjgBNxjxAunysXlUBKl9XlhINZhlvGHctve6HjhzWr4fdqnutZtYbfdmtt33ftnm9b3Y5zVziFx4ntF2P3xf0MmS9evkj51guYZHnMPhfRxKTyHGxKZfkCxnaqX8AALDxzJ3D6TbfZCWpNt92ved1Oo9YMg06tG4T1br8b+o1m/64BjiTYa7uhF/QatcAOw5oXWDn9RrNW9xyn7dXbjZ7XvrvwtZj58n/pXslr9x9QSwMEFAAAAAgAPEaXXJvjKQjgDQAAj1IAABgAAAB4bC93b3Jrc2hlZXRzL3NoZWV0MS54bWydnF1zozgWhv8KlYut3a7Z2Aj8AZNOVWy+3dOd6WRmr4ktt6nB4AGcTObXr4QlbCeH19m9SQwPOpLeI2ReAb55Kas/6g3njfHXNi/qz1ebptm5g0G93PBtWl+XO14Isi6rbdqIzerHoN5VPF21hbb5gA2H84G+7xDaLq5e5f5sYflum/RZ/5IJDR4uFePV+KBuKd5Mq+oL7oB5o4bmJfOb6/TfcnuXmbrMsqXvNWw6DRKvT5n28eVQ+lPrKqq8YCZt3s3+3+zuvupfJeX7ovj7dffHO+cvr7fLq5/97W79UrVebhijr+p2X9oBWujKaKJ1yW2JoU3bA0YEt7/0wKfvdqzrRgrtJRPPLFf6m/lTWJFB6oJeHPbqpjLgXZW3/PiO9I7e+tnRGsT0Ur0yD/g7ZsluSTu4kxGl0pFONR1bFfPGS7P6aq+hQXD7mU8ZfHzaF6z7kT1WL9nnK0d9btVdg2p7i3L/rMSP1i+rq5P1nuQRmDLqM6J8W4+V0EvT17sJ0uaK/bxYfYR57P4OqbFyHfnRFYVNeRsRKZ1r+b/ZlYKd+qE2VE7RjFdlcbzXOzXPY0Z0iiLBbD3iBzymHRp+TBuWumWbpNGq/0WkwTZnhR7HJLZMCFXVWz5xdHIyezKJ4bq9vYG7Gc3OLXFAbCM7BsC12HVnDpvJYWS8aLvW7S6IFTTw8vqMidJTqBKoD0/Ss91/fqAiX9HtXJQVBp8LRNYn6gJPJbfSb1mU09bFHv/Vt/t0UDmG2Y7r2xIYv6SZGHvmqWC3VIbPDt93+pJaHFNJZSXlLukmcJDFcqnp1m8VGnKcFbPSzTpjHb14QBK+XhcP3vT7fzXRYvfOlm+LFlZxXqwlkVbZW5ZEF1NqZo05DyrO0e6cbPdl0RP2Z+YYoI1aP9OfOoZf1Vt5T2Naq5UQCZ+YnKfqQOZ7EEQK4CkS7R5bI59mKD/Q91cLfRHsWbXYibp6xWUzY1jJY0ZDiDRiG1PaBdINFT2KvqKrOlF9OhZblH7R89MhWFdbbIqo1lUf2lRX7dqFvtOUplSNVJaE7v2Z1LUzf5K2pHLB0yIqzj3SFEZ2mEZ9jZEkrNm5V/Z6O7Mz5JoPWp1nTw6UaHhNILMaW0opFHxr2h25iCjZ0hkEVJF8EI7uoFe8mq6WoWN4cZsRWVqidHqzaMStJmFiPqYL1k3qZilhXp4h5YXIV7J5pHRhxM6K3nT3Wr1G6fZO6U2GxLGKjhDCQN7MiKf15ZMjU1Wlq86YFyqIi7RR5R6LNFahfFDFlIBo+1Q4UTPqrymm7PFW+KjM3x3GOHMsJmhUOjv6MLWkOXU0d0Qj3VJMRbMoMKdJNPB7bk7/jj5akIbRSE5bQlzJL2JRqoYJOo0Wk1ROCORIMbRdBEGqTiV0s0mfxJCTiRYy60WjNkLZMi8P4FPjQjIQa00nV3Cw2kxTbAiSjL3lEQpCdJFE6EBQKXzDdRbqh7gmcxqJuqqlNKijIk9GJz08M6bI2lDT5jZW0IJ0lNHYRN0lVRH5N3lUFfYrRtVjqgVQG1gaSfcqn6GvqVm9xHm2JkLG8djU9eW8OdX5DaxjY2aJ4vXjMJIKE/kR1VlpPT70pkVdBFd4TIrZpbNJINNVOQ9JqleHVDaRKUpFqijqq0YUJaUUlUPkrSqRST6N3LqiI0l1TuqKIzQIhDmpJIJq/ysj1J80BXUU0PVGDRD0LH3DPVB61iV2VpgJIijFTTHpR4QXzNJ5GIFxWJSJNJ9PVJK0NN58RcXkX3Wm1ks+fQTK2tqYtR4HgX0amh0mVeacPyXOgJj68ZdNUlwS4f2DVEjxqC0FLSmjXfR2z3lraLRsRPMREfL6SFn6ywVA6UBhAVhJFhLHZxnIpKHMJoaXGE4O8kJWBCPwUhYAI7FQhBSJdxlRiocgQ6mJaLSaEiSQkZjUiKSHIRShFCEIIJIqBUqLe4pIkqMKQI1EoEDiFFHQVIJLVajYeW0M46Ro04AUz1MORUmqAi9YiuUlKqJXJTSQpBRi3DqS0CWJKFJlIJIJx4rJR4XJFYBkRR6QDESSHAOCUBj4UghUgRygdwpR6eoqGjPmKVLBXVFEDCKkkhJp4BJRgDCJIGCyI1iLZfyHQxkJCDHgCyCCVPCICABiqUmpMZ7JFYRnEhkJqiRJiIb2gSKIUCCGGMcIJAgb2JRqUBkBaHQoqiYsRFqJIKABjBCJEhGEERJfB5lBsqNVRoQJqMCBlhC2M0YahB9lRQ1oJAqiCIQAixiiiSF0loxBihJCBtASRkAoSBCmjDEalYhQKFJDI1AuCVFASRJIYQGBoKJEKBiICElmBISCCRoIBiGECR4RgiBKIJSyiRRgGJiAiEEmCIFkFJJqCQJ0AIQYQCM0CMhIYJYGAWKtIaoBFoEFYAoFCKQBBMAUKYQOBAKIIokEBCIASyCCCCKIJiCECJKCBCFERIgRJZBCKEIRoYJEImCIESIREBYMJCKKKBIJCCBIAQiRFCIBCIIiAgCGCJiCiBIQhBFRCMCRiAFTVAUCpQZBIIJEAgGAiCIBxKQKFooiJIqKGJiKBCiIJRFAIJBgFRiCiJaGAiiCECgGACQIiChFChBJCAiECBhCRMAEJCiQAQogFgQAAABQSwMEFAAAAAgAPEaXXLS4whAfHAAAG7kAABgAAAB4bC93b3Jrc2hlZXRzL3NoZWV0Mi54bWw=";

  const bin = atob(TEMPLATE_B64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const wb = XLSX.read(arr, { type: "array", cellStyles: true });

  const oldName = wb.SheetNames[0];
  const ws = wb.Sheets[oldName];

  const setVal = (ref, value) => {
    if (!ws[ref]) ws[ref] = {};
    if (typeof value === "number") { ws[ref].t = "n"; ws[ref].v = value; }
    else { ws[ref].t = "s"; ws[ref].v = String(value ?? ""); }
    delete ws[ref].f;
  };

  const setFormula = (ref, formula) => {
    if (!ws[ref]) ws[ref] = {};
    ws[ref].t = "n"; ws[ref].f = formula; ws[ref].v = 0;
    if (!ws[ref].z) ws[ref].z = "#,##0.00";
  };

  setVal("H5", `# ${orderId}`);
  setVal("C9", `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim());
  setVal("C10", user.company_name ?? "");
  setVal("C11", [user.email, user.phone_number].filter(Boolean).join(" | "));
  setVal("C12", fullAddr);
  setVal("K12", paymentMethod);

  const ITEM_START = 15;
  const itemCount = items.length;

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

  const lastItemRow = ITEM_START + Math.max(0, itemCount) - 1;
  const nfRow = lastItemRow + 1 >= ITEM_START ? lastItemRow + 1 : ITEM_START;
  const nfBRef = `B${nfRow}`;
  // Remove any pre-existing "***Nothing Follows***" entries in the template
  // so we don't end up with duplicates if the template already contains one.
  Object.keys(ws).forEach((k) => {
    if (!k || k.startsWith("!")) return;
    try {
      if (ws[k] && ws[k].v === '***Nothing Follows***' && k !== nfBRef) delete ws[k];
    } catch (e) {
      // ignore non-cell entries
    }
  });

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
  if (!ws['!cols'][1]) ws['!cols'][1] = { wch: 30 }; // B (conservative default to allow wrapping)
  if (!ws['!cols'][2]) ws['!cols'][2] = { wch: 18 }; // C
 
  // ── Totals (compute immediately after the NF row so layout is compact)
  const itemsStart = 15;
  const sumEnd = Math.max(lastItemRow, itemsStart);
  
  // Trim worksheet range to last non-empty cell to avoid exporting many empty rows
  try {
    const dataCellKeys = Object.keys(ws).filter((k) => k && k[0] !== '!');
    let maxRow = 0;
    let maxCol = 0;
    for (const k of dataCellKeys) {
      const m = k.match(/([A-Z]+)(\d+)$/);
      if (!m) continue;
      const colLetters = m[1];
      const rowIdx = Number(m[2]);
      if (rowIdx > maxRow) maxRow = rowIdx;
      // convert column letters to 1-based index
      let colIdx = 0;
      for (let i = 0; i < colLetters.length; i++) colIdx = colIdx * 26 + (colLetters.charCodeAt(i) - 64);
      if (colIdx > maxCol) maxCol = colIdx;
    }
    if (maxRow > 0 && maxCol > 0) {
      let lastCol = '';
      let n = maxCol;
      while (n > 0) {
        const rem = (n - 1) % 26;
        lastCol = String.fromCharCode(65 + rem) + lastCol;
        n = Math.floor((n - 1) / 26);
      }
      ws['!ref'] = `A1:${lastCol}${maxRow}`;
      // store for ExcelJS trimming
      ws.__lastRow = maxRow;
    }
  } catch (e) {
    // ignore trimming failures
  }
  const subtotalRow = nfRow + 1;
  const vatBaseRow = subtotalRow + 1;
  const vatRow = subtotalRow + 2;
  const totalRow = subtotalRow + 4;
  

  setFormula(`K${subtotalRow}`, `SUM(K${itemsStart}:K${sumEnd})`);
  setFormula(`K${vatBaseRow}`, `K${subtotalRow}/1.12`);
  setFormula(`K${vatRow}`, `K${subtotalRow}-K${vatBaseRow}`);
  setFormula(`K${totalRow}`, `K${vatBaseRow}+K${vatRow}`);

  const newName = `Order #${orderId}`;
  wb.SheetNames[0] = newName;
  wb.Sheets[newName] = ws;
  delete wb.Sheets[oldName];
 

  // Ensure disclaimer and long text cells wrap: detect cells containing known disclaimer fragments
  try {
    const keys = Object.keys(ws);
    // helper: insert soft line breaks at word boundaries to avoid overflow
    const softWrap = (text, lineLen) => {
      if (!text) return text;
      const words = String(text).split(/(\s+)/); // keep spaces
      let line = "";
      const out = [];
      for (const w of words) {
        // if adding this word would exceed lineLen, break
        if ((line + w).replace(/\t/g, '    ').length > lineLen) {
          if (line.trim()) out.push(line.trimRight());
          // if the single word itself is longer than lineLen, hard-break it
          if (w.length > lineLen) {
            let start = 0;
            while (start < w.length) {
              out.push(w.slice(start, start + lineLen));
              start += lineLen;
            }
            line = "";
            continue;
          }
          line = w.trimStart();
        } else {
          line += w;
        }
      }
      if (line.trim()) out.push(line.trimRight());
      return out.join('\n');
    };

    for (const k of keys) {
      const cell = ws[k];
      if (!cell || typeof cell.v !== 'string') continue;
      const v = cell.v;
      if (v.includes('Cancellations will be considered') || v.includes('JEM8 CIRCLE TRADING CO.')) {
        // enforce wrap and top alignment
        cell.s = cell.s || {};
        cell.s.alignment = Object.assign({}, cell.s.alignment || {}, { wrapText: true, vertical: 'top' });

        // Insert explicit line breaks so Excel displays wrapped lines
        try {
          let newV = String(v);
          // break sentences into separate lines
          newV = newV.replace(/\.\s+/g, '.\n');
          // break after semicolons
          newV = newV.replace(/;\s+/g, ';\n');
          // ensure 'However' begins on a new line
          newV = newV.replace(/\n?However/g, '\nHowever');
          // normalize multiple newlines
          newV = newV.replace(/\n{2,}/g, '\n\n');
          cell.v = newV;
        } catch (e) {
          // ignore transform errors
        }

        // set row height for this row to allow wrapped text to be visible
        const match = k.match(/(\d+)$/);
        if (match) {
          const rowIdx = Number(match[1]);
          ws['!rows'] = ws['!rows'] || [];
          ws['!rows'][rowIdx - 1] = Object.assign({}, ws['!rows'][rowIdx - 1] || {}, { hpt: 80 });
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
    // helper: column letter -> zero-based index
    const colLetterToIndexLocal = (col) => {
      let idx = 0;
      for (let i = 0; i < col.length; i++) idx = idx * 26 + (col.charCodeAt(i) - 64);
      return idx - 1;
    };
    for (const k of keys) {
      if (!k || k[0] === '!') continue;
      const cell = ws[k];
      if (!cell) continue;
      const isStringCell = cell.t === 's' || typeof cell.v === 'string';
      if (!isStringCell) continue;
      cell.s = cell.s || {};
      cell.s.alignment = Object.assign({}, cell.s.alignment || {}, { wrapText: true, vertical: 'top' });
      const m = k.match(/([A-Z]+)(\d+)$/);
      if (m) {
        const colLetters = m[1];
        const rowIdx = Number(m[2]);
        let text = String(cell.v || '');
        const explicitLines = text.split(/\r?\n/).length;

        // Determine available width in characters for this cell. If the cell
        // is inside a merge, use the merged span width; otherwise use the
        // single-column width. Fall back to a conservative default.
        let availChars = 40; // default fallback
        try {
          const colIdx = colLetterToIndexLocal(colLetters);
          // if merges exist, see if this cell is within a merged range
          const merges = ws['!merges'] || [];
          let spanCols = 1;
          for (const mm of merges) {
            const startCol = mm.s.c;
            const endCol = mm.e.c;
            const startRow = mm.s.r + 1;
            const endRow = mm.e.r + 1;
            if (rowIdx >= startRow && rowIdx <= endRow && colIdx >= startCol && colIdx <= endCol) {
              spanCols = (endCol - startCol + 1);
              break;
            }
          }

          // Sum widths of spanned columns (wch = characters width)
          const cols = ws['!cols'] || [];
          let totalW = 0;
          for (let c = colIdx; c < colIdx + spanCols; c++) {
            const cw = (cols[c] && cols[c].wch) || 0;
            totalW += cw;
          }
          if (totalW > 0) availChars = Math.floor(totalW);
        } catch (e) {
          // ignore and use fallback
        }

        // Estimate lines required using available characters per line.
        const approxCharsPerLine = Math.max(20, availChars);
        // For key text columns (B, C) force soft-wrapping at word boundaries
        try {
          if (['B','C'].includes(colLetters)) {
            text = softWrap(text, approxCharsPerLine);
            cell.v = text;
          }
        } catch (e) {
          // ignore
        }
        const extraLines = Math.ceil(text.length / approxCharsPerLine);
        const lines = Math.max(explicitLines, extraLines);
        const hpt = Math.min(400, Math.max(18, lines * 14));
        ws['!rows'] = ws['!rows'] || [];
        ws['!rows'][rowIdx - 1] = Object.assign({}, ws['!rows'][rowIdx - 1] || {}, { hpt });
      }
    }

    // Ensure minimum column widths for key columns (B: description, C: client info/address)
    if (!ws['!cols'][1] || !ws['!cols'][1].wch || ws['!cols'][1].wch < 20) ws['!cols'][1] = Object.assign({}, ws['!cols'][1] || {}, { wch: 30 });
    if (!ws['!cols'][2] || !ws['!cols'][2].wch || ws['!cols'][2].wch < 12) ws['!cols'][2] = Object.assign({}, ws['!cols'][2] || {}, { wch: 18 });

    // Write workbook to array then load into ExcelJS so we can reliably set
    // alignment and row heights (Excel desktop honors these settings).
    const outArray = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
    try {
      const workbookExcel = new ExcelJS.Workbook();
      await workbookExcel.xlsx.load(outArray);
      const sheet = workbookExcel.worksheets[0];

      // Apply wrap alignment for all populated cells and transfer row heights
      const keysAll = Object.keys(ws || {});
      for (const k of keysAll) {
        if (!k || k[0] === '!') continue;
        const match = k.match(/([A-Z]+)(\d+)$/);
        if (!match) continue;
        try {
          const excelCell = sheet.getCell(k);
          excelCell.alignment = Object.assign({}, excelCell.alignment || {}, { wrapText: true, vertical: 'top' });
        } catch (e) {
          // ignore per-cell failures
        }
      }

      if (ws['!rows'] && Array.isArray(ws['!rows'])) {
        for (let i = 0; i < ws['!rows'].length; i++) {
          const r = ws['!rows'][i];
          if (r && r.hpt) {
            const row = sheet.getRow(i + 1);
            // Increase height slightly to add padding so wrapped text doesn't overlap
            const newHeight = Math.max(r.hpt * 1.35, r.hpt + 12, 22);
            row.height = newHeight;
          }
        }
      }

      // Remove any extra empty rows beyond the last used row to prevent large exported files
      try {
        const lastRow = ws.__lastRow || 0;
        if (lastRow && sheet.rowCount > lastRow) {
          const removeCount = sheet.rowCount - lastRow;
          sheet.spliceRows(lastRow + 1, removeCount);
        }
      } catch (e) {
        // ignore
      }

      const finalBuf = await workbookExcel.xlsx.writeBuffer();
      const blob = new Blob([finalBuf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Quotation_Order_${orderId}.xlsx`);
    } catch (e) {
      console.error('ExcelJS post-processing failed, falling back to SheetJS write:', e);
      XLSX.writeFile(wb, `Quotation_Order_${orderId}.xlsx`, { bookType: 'xlsx', cellStyles: true });
    }
  } catch (e) {
    console.error('Failed to write XLSX file', e);
    alert('Failed to generate XLSX file.');
  }
}

async function exportSelectedOrders(deliveries, onProgress) {
  for (let i = 0; i < deliveries.length; i++) {
    onProgress && onProgress(i, deliveries.length);
    // use the new ExcelJS-driven exporter matching Reports.tsx style
    await exportOrderToExcelJS(deliveries[i]);
    await new Promise((r) => setTimeout(r, 600));
  }
  onProgress && onProgress(deliveries.length, deliveries.length);
}

// ── Export Progress Modal ─────────────────────────────────────────────────────
function ExportProgressModal({ current, total, onClose }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <Overlay onClose={() => {}}>
      <div style={{ padding: "32px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>📊</div>
        <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: T.slate900 }}>Exporting Orders</h3>
        <p style={{ margin: "0 0 20px", fontSize: 12, color: T.slate500 }}>
          Downloading {current} of {total} file{total > 1 ? "s" : ""}…
        </p>
        <div style={{ width: "100%", height: 8, background: T.slate100, borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
          <div style={{ height: "100%", background: T.green600, borderRadius: 8, transition: "width 0.3s", width: `${pct}%` }} />
        </div>
        <p style={{ fontSize: 11, color: T.slate400, margin: "0 0 16px" }}>{pct}%</p>
        {current === total && (
          <button onClick={onClose} style={{ ...btnBase, background: T.green600, color: "#fff", padding: "10px 24px" }}>
            Done ✓
          </button>
        )}
      </div>
    </Overlay>
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
    await exportSelectedOrders(selected, (i, total) => setProgress({ current: i, total }));
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
        <ExportProgressModal current={progress.current} total={progress.total} onClose={() => setProgress(null)} />
      )}
      <div style={{ position: "relative" }} ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          disabled={selectedIds.size === 0}
          style={{
            ...btnBase,
            background: selectedIds.size > 0 ? T.green600 : T.slate100,
            color: selectedIds.size > 0 ? "#fff" : T.slate400,
            cursor: selectedIds.size === 0 ? "not-allowed" : "pointer",
            boxShadow: selectedIds.size > 0 ? "0 2px 8px rgba(5,150,105,0.25)" : "none",
          }}
        >
          ⬇ Export {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
        </button>
        {open && (
          <div style={{
            position: "absolute", right: 0, top: "calc(100% + 6px)",
            background: "#fff", border: `1px solid ${T.slate200}`,
            borderRadius: T.radius.md, boxShadow: T.shadow.hover,
            zIndex: 50, minWidth: 160, padding: "4px 0",
          }}>
            <button onClick={handleExcelExport} style={{
              width: "100%", textAlign: "left", padding: "10px 14px",
              fontSize: 12, color: T.slate700, background: "transparent",
              border: "none", cursor: "pointer", fontFamily: T.font,
              display: "flex", alignItems: "center", gap: 8,
              transition: "background 0.1s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = T.slate50)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >📊 Export as Excel</button>
            <button onClick={handlePDFExport} style={{
              width: "100%", textAlign: "left", padding: "10px 14px",
              fontSize: 12, color: T.slate700, background: "transparent",
              border: "none", cursor: "pointer", fontFamily: T.font,
              display: "flex", alignItems: "center", gap: 8,
              transition: "background 0.1s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = T.slate50)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >📄 Export as PDF</button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminOrders() {
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [deliveries,   setDeliveries]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [searchTerm,   setSearchTerm]   = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy,       setSortBy]       = useState("id_desc");
  const [currentPage,  setCurrentPage]  = useState(1);
  const [modalTarget,  setModalTarget]  = useState(null);
  const [viewTarget,   setViewTarget]   = useState(null);
  const [selectedIds,  setSelectedIds]  = useState(new Set());
  const [exportedIds,  setExportedIds]  = useState(getExportedSet);

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
      prev.map((d) => d.delivery_id === updated.delivery_id ? { ...d, status: updated.status } : d)
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
    { label: "Total Orders",  value: deliveries.length,   icon: "🛒", accent: T.blue600,   bg: T.blue50,   border: T.blue100 },
    { label: "Processing",    value: count("processing"), icon: "⚙️", accent: T.violet600, bg: T.violet50, border: T.violet100 },
    { label: "Ready",         value: count("ready"),      icon: "📦", accent: T.blue700,   bg: T.blue100,  border: T.blue100 },
    { label: "On the way",    value: count("on_the_way"), icon: "⏳", accent: T.amber600,  bg: T.amber50,  border: T.amber100 },
    { label: "Delivered",     value: count("delivered"),  icon: "✅", accent: T.green600,  bg: T.green50,  border: T.green100 },
    { label: "Revenue",       value: `₱${fmt(totalRevenue)}`, icon: "💰", accent: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
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
      setSelectedIds((prev) => { const next = new Set(prev); paginated.forEach((d) => next.delete(d.delivery_id)); return next; });
    } else {
      setSelectedIds((prev) => { const next = new Set(prev); paginated.forEach((d) => next.add(d.delivery_id)); return next; });
    }
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  // Table header columns — no horizontal scroll: drop less-critical cols on narrower widths
  const TABLE_COLS = [
    { key: "checkbox", label: "", width: 40 },
    { key: "order_id", label: "Order ID", width: 110 },
    { key: "product",  label: "Product",  width: 220 },
    { key: "client",   label: "Client",   width: 160 },
    { key: "contact",  label: "Contact",  width: 160 },
    { key: "payment",  label: "Payment",  width: 100 },
    { key: "shipping", label: "Shipping", width: 100 },
    { key: "total",    label: "Total Paid", width: 110 },
    { key: "status",   label: "Status",   width: 110 },
    { key: "date",     label: "Date",     width: 110 },
    { key: "action",   label: "Actions",  width: 130 },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .ao-sidebar { display: none; }
        @media (min-width: 1024px) { .ao-sidebar { display: block; } }
        .ao-hamburger { display: flex !important; }
        @media (min-width: 1024px) { .ao-hamburger { display: none !important; } }
        .ao-tbl-row:hover td { background: ${T.slate50} !important; }
        .ao-stat-card:hover { transform: translateY(-2px); box-shadow: ${T.shadow.hover} !important; }
        .ao-btn-action:hover { opacity: 0.75; }
        .ao-select:focus { border-color: ${T.blue500}; }
        /* tracker labels — show on sm+ */
        @media (min-width: 520px) { .tracker-label { display: inline !important; } }
        /* Ensure table does NOT scroll horizontally — use word-break instead */
        .ao-table-wrap table { table-layout: fixed; width: 100%; }
        .ao-table-wrap td, .ao-table-wrap th { overflow: hidden; text-overflow: ellipsis; }
      `}</style>

      {modalTarget && (
        <StatusModal delivery={modalTarget} onClose={() => setModalTarget(null)} onUpdated={handleUpdated} />
      )}
      {viewTarget && (
        <ViewOrderModal delivery={viewTarget} onClose={() => setViewTarget(null)} />
      )}

      <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4F8", fontFamily: T.font }}>

        {/* Sidebar */}
        <div className="ao-sidebar">
          <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </div>

        <main style={{ flex: 1, minWidth: 0, padding: "20px", overflowX: "hidden" }}>

          {/* ── Top bar (matches AdminProducts) ── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 12, marginBottom: 20, background: "#fff",
            borderRadius: T.radius.lg, padding: "12px 16px",
            border: `1px solid ${T.slate200}`, boxShadow: T.shadow.sm,
            flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => setSidebarOpen(true)}
                className="ao-hamburger"
                aria-label="Open menu"
                style={{
                  background: "none", border: `1px solid ${T.slate200}`,
                  borderRadius: T.radius.sm, width: 36, height: 36,
                  alignItems: "center", justifyContent: "center",
                  cursor: "pointer", fontSize: 18, color: T.slate700,
                }}
              >☰</button>
              <div>
                <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.slate900, letterSpacing: "-0.3px" }}>Orders</h1>
                <p style={{ margin: "1px 0 0", fontSize: 11, color: T.slate400 }}>Manage deliveries and order statuses</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <ExportMenu selectedIds={selectedIds} deliveries={deliveries} onExportDone={handleExportDone} />
              <button
                onClick={fetchDeliveries}
                style={{
                  ...btnBase, background: "#fff", color: T.slate700,
                  border: `1px solid ${T.slate200}`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.slate50)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
              >↻ Refresh</button>
            </div>
          </div>

          {/* ── Stat Cards (matches AdminProducts — accent top bar style) ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10, marginBottom: 16,
          }}>
            {summaryStats.map((stat) => (
              <div
                key={stat.label}
                className="ao-stat-card"
                style={{
                  background: "#fff", borderRadius: T.radius.lg, padding: "16px",
                  border: `1px solid ${stat.border}`, boxShadow: T.shadow.sm,
                  position: "relative", overflow: "hidden", transition: "all 0.15s",
                }}
              >
                {/* Accent top bar */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 3,
                  background: stat.accent, borderRadius: `${T.radius.lg}px ${T.radius.lg}px 0 0`,
                }} />
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: T.slate400, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                      {stat.label}
                    </div>
                    <div style={{ fontSize: typeof stat.value === "string" && stat.value.length > 10 ? 16 : 28, fontWeight: 800, color: T.slate900, letterSpacing: "-0.5px", lineHeight: 1 }}>
                      {stat.value}
                    </div>
                  </div>
                  <div style={{
                    width: 36, height: 36, borderRadius: T.radius.sm,
                    background: stat.bg, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 16, flexShrink: 0,
                  }}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Selected bar ── */}
          {selectedIds.size > 0 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 12, padding: "10px 14px", marginBottom: 12,
              background: T.green50, border: `1px solid ${T.green100}`,
              borderRadius: T.radius.md,
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.green600 }}>
                {selectedIds.size} order{selectedIds.size > 1 ? "s" : ""} selected
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                style={{ ...btnBase, padding: "4px 10px", background: "transparent", color: T.green600, border: `1px solid ${T.green100}`, fontSize: 11 }}
              >Clear</button>
            </div>
          )}

          {/* ── Table Card (matches AdminProducts cardStyle) ── */}
          <div style={cardStyle}>

            {/* Filter bar */}
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.slate100}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {/* Search */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 180,
                  border: `1px solid ${T.slate200}`, borderRadius: T.radius.sm,
                  padding: "7px 12px", background: T.slate50,
                }}>
                  <span style={{ color: T.slate400, fontSize: 13 }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search by name, order ID, product…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ flex: 1, fontSize: 12, color: T.slate700, background: "transparent", border: "none", outline: "none", fontFamily: T.font }}
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm("")} style={{ background: "none", border: "none", color: T.slate400, cursor: "pointer", fontSize: 12 }}>✕</button>
                  )}
                </div>

                {/* Status filter */}
                <div style={{ position: "relative" }}>
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    className="ao-select"
                    style={{ ...inputStyle, appearance: "none", paddingRight: 28, cursor: "pointer", padding: "7px 28px 7px 12px", width: "auto", fontSize: 12 }}
                  >
                    <option value="All">All Status</option>
                    <option value="processing">Processing</option>
                    <option value="ready">Ready</option>
                    <option value="on_the_way">On the way</option>
                    <option value="delivered">Delivered</option>
                  </select>
                  <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: T.slate400, fontSize: 10 }}>▾</span>
                </div>

                {/* Sort */}
                <div style={{ position: "relative" }}>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="ao-select"
                    style={{ ...inputStyle, appearance: "none", paddingRight: 28, cursor: "pointer", padding: "7px 28px 7px 12px", width: "auto", fontSize: 12 }}
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: T.slate400, fontSize: 10 }}>▾</span>
                </div>

                {/* Clear */}
                <button
                  onClick={() => { setSearchTerm(""); setStatusFilter("All"); setSortBy("id_desc"); setCurrentPage(1); }}
                  style={{
                    ...btnBase, background: "#fff", color: T.slate600,
                    border: `1px solid ${T.slate200}`, padding: "7px 12px", fontSize: 11,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = T.slate50)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                >✕ Clear</button>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div style={{ padding: "60px 0", textAlign: "center", color: T.slate400 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>⟳</div>
                <div style={{ fontSize: 13 }}>Loading orders…</div>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                margin: 16, padding: "12px 14px", fontSize: 12, color: T.red600,
                border: `1px solid ${T.red100}`, borderRadius: T.radius.md,
                background: T.red50,
              }}>
                ⚠️ {error}
                <button
                  onClick={fetchDeliveries}
                  style={{ ...btnBase, padding: "4px 10px", background: "#fff", color: T.red600, border: `1px solid ${T.red100}`, fontSize: 11 }}
                >Retry</button>
              </div>
            )}

            {/* Table */}
            {!loading && !error && (
              <div className="ao-table-wrap">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: 40 }} />
                    <col style={{ width: 110 }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: 90 }} />
                    <col style={{ width: 90 }} />
                    <col style={{ width: 100 }} />
                    <col style={{ width: 100 }} />
                    <col style={{ width: 95 }} />
                    <col style={{ width: 115 }} />
                  </colgroup>
                  <thead>
                    <tr style={{ background: T.slate50, borderBottom: `1px solid ${T.slate200}` }}>
                      <th style={{ padding: "10px 12px", width: 40 }}>
                        <input
                          type="checkbox"
                          checked={isAllPageSelected}
                          ref={(el) => { if (el) el.indeterminate = !isAllPageSelected && isSomePageSelected; }}
                          onChange={toggleAll}
                          style={{ width: 15, height: 15, cursor: "pointer", accentColor: T.green600 }}
                        />
                      </th>
                      {["Order ID", "Product", "Client", "Contact", "Payment", "Shipping", "Total Paid", "Status", "Date", "Actions"].map((h) => (
                        <th key={h} style={{
                          padding: "10px 12px", textAlign: h === "Total Paid" || h === "Shipping" ? "right" : h === "Actions" ? "center" : "left",
                          fontWeight: 600, fontSize: 10, color: T.slate500,
                          textTransform: "uppercase", letterSpacing: "0.4px", whiteSpace: "nowrap",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((d, index) => {
                      const user     = d.checkout?.user;
                      const checkout = d.checkout;
                      const isSelected = selectedIds.has(d.delivery_id);
                      const isExported = exportedIds.has(String(d.delivery_id));
                      return (
                        <tr
                          key={d.delivery_id}
                          className="ao-tbl-row"
                          style={{
                            borderBottom: `1px solid ${T.slate100}`,
                            background: isSelected ? T.blue50 : index % 2 === 0 ? "#fff" : `${T.slate50}60`,
                            transition: "background 0.1s",
                          }}
                        >
                          {/* Checkbox */}
                          <td style={{ padding: "10px 12px" }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleOne(d.delivery_id)}
                              style={{ width: 15, height: 15, cursor: "pointer", accentColor: T.green600 }}
                            />
                          </td>

                          {/* Order ID */}
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                              <span style={{ fontWeight: 700, color: T.blue600, fontSize: 12 }}>
                                #{checkout?.checkout_id ?? "—"}
                              </span>
                              {isExported && (
                                <span style={{
                                  display: "inline-block", fontSize: 9, fontWeight: 700,
                                  padding: "1px 6px", borderRadius: 10,
                                  background: T.green50, color: T.green600,
                                  border: `1px solid ${T.green100}`, width: "fit-content",
                                }}>✓ Exported</span>
                              )}
                            </div>
                          </td>

                          {/* Product */}
                          <td style={{ padding: "10px 12px" }}>
                            <ProductCell checkout={checkout} />
                          </td>

                          {/* Client */}
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ fontWeight: 600, fontSize: 12, color: T.slate800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {user ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() : "—"}
                            </div>
                            {user?.company_name && (
                              <div style={{ fontSize: 10, color: T.blue600, fontWeight: 600, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                🏢 {user.company_name}
                              </div>
                            )}
                          </td>

                          {/* Contact */}
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ fontSize: 11, color: T.slate500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {user?.email ?? "—"}
                            </div>
                            <div style={{ fontSize: 10, color: T.slate400, marginTop: 1 }}>{user?.phone_number ?? ""}</div>
                            {user?.tin_number && (
                              <div style={{ fontSize: 10, color: T.slate400 }}>TIN: {user.tin_number}</div>
                            )}
                          </td>

                          {/* Payment */}
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{
                              display: "inline-block", fontSize: 10, fontWeight: 600,
                              padding: "2px 8px", borderRadius: 20,
                              background: T.slate100, color: T.slate600,
                              border: `1px solid ${T.slate200}`, whiteSpace: "nowrap",
                              textTransform: "capitalize",
                            }}>
                              {(checkout?.payment_method ?? "—").replace(/_/g, " ")}
                            </span>
                          </td>

                          {/* Shipping */}
                          <td style={{ padding: "10px 12px", textAlign: "right" }}>
                            <span style={{ fontSize: 12, fontWeight: 500, color: T.slate700 }}>
                              ₱{fmt(checkout?.shipping_fee)}
                            </span>
                          </td>

                          {/* Total */}
                          <td style={{ padding: "10px 12px", textAlign: "right" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: T.slate900 }}>
                              ₱{fmt(checkout?.paid_amount)}
                            </span>
                          </td>

                          {/* Status */}
                          <td style={{ padding: "10px 12px" }}>
                            <StatusBadge status={d.status} />
                          </td>

                          {/* Date */}
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{ fontSize: 11, color: T.slate500, whiteSpace: "nowrap" }}>
                              {fmtDate(checkout?.created_at)}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                              {[
                                { label: "👁 View",   onClick: () => setViewTarget(d),   bg: T.blue50,  color: T.blue600,  border: T.blue100 },
                                { label: "✏️ Edit",  onClick: () => setModalTarget(d),  bg: "#fff",    color: T.slate700, border: T.slate200 },
                              ].map((btn) => (
                                <button
                                  key={btn.label}
                                  onClick={btn.onClick}
                                  className="ao-btn-action"
                                  style={{
                                    padding: "4px 8px", borderRadius: T.radius.sm,
                                    fontSize: 10, fontWeight: 600,
                                    background: btn.bg, color: btn.color,
                                    border: `1px solid ${btn.border}`,
                                    cursor: "pointer", fontFamily: T.font,
                                    transition: "opacity 0.12s", whiteSpace: "nowrap",
                                  }}
                                >{btn.label}</button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {paginated.length === 0 && (
                      <tr>
                        <td colSpan={11} style={{ padding: "60px 0", textAlign: "center", color: T.slate400 }}>
                          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                          <div style={{ fontSize: 13 }}>No orders found.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination (matches AdminProducts) */}
            {!loading && !error && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px", borderTop: `1px solid ${T.slate100}`,
                flexWrap: "wrap", gap: 8,
              }}>
                <span style={{ fontSize: 11, color: T.slate400 }}>
                  Showing {paginated.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} orders
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      width: 28, height: 28, borderRadius: T.radius.sm,
                      border: `1px solid ${T.slate200}`, background: "#fff",
                      color: T.slate700, fontSize: 12, cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: currentPage === 1 ? 0.4 : 1,
                    }}
                  >‹</button>
                  {pageNumbers.map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      style={{
                        width: 28, height: 28, borderRadius: T.radius.sm,
                        fontSize: 11, fontWeight: p === currentPage ? 700 : 500,
                        background: p === currentPage ? T.blue600 : "#fff",
                        color: p === currentPage ? "#fff" : T.slate700,
                        border: p === currentPage ? "none" : `1px solid ${T.slate200}`,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.12s",
                      }}
                    >{p}</button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      width: 28, height: 28, borderRadius: T.radius.sm,
                      border: `1px solid ${T.slate200}`, background: "#fff",
                      color: T.slate700, fontSize: 12, cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: currentPage === totalPages ? 0.4 : 1,
                    }}
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