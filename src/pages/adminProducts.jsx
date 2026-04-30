import { useEffect, useState, useMemo, useRef } from "react";
import AdminNav from '../components/AdminNav';
import axios from "axios";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.mjs";

const BASE = "http://127.0.0.1:8000";
const ITEMS_PER_PAGE = 20;

// ── Design tokens (matches AdminDashboard) ────────────────────────────────────
const T = {
  blue50: "#EFF6FF", blue100: "#DBEAFE", blue500: "#3B82F6", blue600: "#2563EB", blue700: "#1D4ED8",
  green50: "#ECFDF5", green100: "#D1FAE5", green500: "#10B981", green600: "#059669",
  amber50: "#FFFBEB", amber100: "#FEF3C7", amber500: "#F59E0B", amber600: "#D97706",
  purple50: "#F5F3FF", purple100: "#EDE9FE", purple500: "#8B5CF6", purple600: "#7C3AED",
  red50: "#FEF2F2", red100: "#FEE2E2", red500: "#EF4444", red600: "#DC2626",
  slate50: "#F8FAFC", slate100: "#F1F5F9", slate200: "#E2E8F0", slate300: "#CBD5E1",
  slate400: "#94A3B8", slate500: "#64748B", slate600: "#475569",
  slate700: "#374151", slate800: "#1E293B", slate900: "#0F172A",
  radius: { sm: 8, md: 12, lg: 16, xl: 20 },
  shadow: { sm: "0 1px 2px rgba(15,23,42,0.05)", md: "0 4px 12px rgba(15,23,42,0.08)", hover: "0 8px 24px rgba(15,23,42,0.12)" },
  font: "'DM Sans','Nunito',system-ui,sans-serif",
};

const COLOR_OPTIONS = [
  "Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Pink",
  "Black", "White", "Gray", "Brown", "Beige", "Maroon", "Navy",
  "Teal", "Cyan", "Magenta", "Gold", "Silver", "Multicolor", "Other"
];

const COLOR_DOT_MAP = {
  Red: "#ef4444", Blue: "#3b82f6", Green: "#22c55e", Yellow: "#eab308",
  Orange: "#f97316", Purple: "#a855f7", Pink: "#ec4899", Black: "#1e293b",
  White: "#f8fafc", Gray: "#94a3b8", Brown: "#92400e", Beige: "#d4b896",
  Maroon: "#9f1239", Navy: "#1e3a8a", Teal: "#0d9488", Cyan: "#06b6d4",
  Magenta: "#d946ef", Gold: "#ca8a04", Silver: "#cbd5e1",
  Multicolor: "linear-gradient(135deg,#ef4444,#3b82f6,#22c55e)",
  Other: "#e2e8f0",
};

const normalizeColor = (raw) => {
  if (!raw) return null;
  const trimmed = raw.trim();
  const found = COLOR_OPTIONS.find(c => c.toLowerCase() === trimmed.toLowerCase());
  return found || null;
};

const splitColors = (raw) => {
  if (!raw) return [];
  return raw.split(/\s+or\s+|\s*[,/]\s*/i)
    .map(c => normalizeColor(c.trim()))
    .filter(Boolean);
};

// ── Shared inline styles ──────────────────────────────────────────────────────
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

// ── Color Dot ─────────────────────────────────────────────────────────────────
const ColorDot = ({ color, size = 12 }) => {
  const dot = COLOR_DOT_MAP[color] || "#e2e8f0";
  const isGrad = dot.startsWith("linear");
  return (
    <span style={{
      display: "inline-block", width: size, height: size,
      borderRadius: "50%", border: `1px solid ${T.slate300}`, flexShrink: 0,
      ...(isGrad ? { background: dot } : { backgroundColor: dot }),
    }} />
  );
};

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    "In Stock":  { bg: T.green50,  color: T.green600,  border: T.green100 },
    "Pre-Order": { bg: T.amber50,  color: T.amber600,  border: T.amber100 },
  };
  const s = map[status] || { bg: T.slate100, color: T.slate500, border: T.slate200 };
  return (
    <span style={{
      display: "inline-block", fontSize: 9, fontWeight: 700,
      padding: "2px 9px", borderRadius: 20, whiteSpace: "nowrap",
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {status}
    </span>
  );
};

// ── Sale Badge ────────────────────────────────────────────────────────────────
const SaleBadge = () => (
  <span style={{
    display: "inline-block", fontSize: 9, fontWeight: 700,
    padding: "2px 7px", borderRadius: 20,
    background: T.red100, color: T.red600,
  }}>
    SALE
  </span>
);

// ── Modal Overlay ─────────────────────────────────────────────────────────────
const Overlay = ({ children, onClose, wide, extraWide }) => (
  <div
    onClick={onClose}
    style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
      backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 1000, padding: 16,
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background: "#fff",
        width: "100%",
        maxWidth: extraWide ? 1100 : wide ? 760 : 560,
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

// ── Modal Header ──────────────────────────────────────────────────────────────
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
      onMouseEnter={e => e.currentTarget.style.background = T.slate100}
      onMouseLeave={e => e.currentTarget.style.background = T.slate50}
    >
      ×
    </button>
  </div>
);

// ── Image Upload Zone ─────────────────────────────────────────────────────────
const ImageUploadZone = ({ id, onchange, previews, onRemove, label }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={labelStyle}>{label ?? "Product Images"}</div>
    <label htmlFor={id} style={{
      display: "block", padding: 16, textAlign: "center",
      border: `2px dashed ${T.slate300}`, borderRadius: T.radius.md,
      background: T.slate50, cursor: "pointer", transition: "border-color 0.15s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = T.blue500}
      onMouseLeave={e => e.currentTarget.style.borderColor = T.slate300}
    >
      <div style={{ fontSize: 22, marginBottom: 4 }}>🖼️</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.slate700 }}>Click to upload images</div>
      <div style={{ fontSize: 10, color: T.slate400, marginTop: 2 }}>PNG, JPG, WEBP — multiple allowed</div>
      <input id={id} type="file" multiple accept="image/*" onChange={onchange} style={{ display: "none" }} />
    </label>
    {previews.length > 0 && (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(72px,1fr))", gap: 8, marginTop: 10 }}>
        {previews.map((src, i) => (
          <div key={i} style={{
            position: "relative", borderRadius: T.radius.sm, overflow: "hidden",
            aspectRatio: "1/1", background: T.slate100,
            border: i === 0 ? `2px solid ${T.blue500}` : `1px solid ${T.slate200}`,
          }}>
            <img src={src} alt={`preview-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            {i === 0 && (
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: T.blue600, color: "#fff", fontSize: 8, fontWeight: 700,
                textAlign: "center", padding: "2px 0",
              }}>MAIN</div>
            )}
            <button type="button" onClick={() => onRemove(i)} style={{
              position: "absolute", top: 3, right: 3, width: 16, height: 16,
              borderRadius: "50%", background: "rgba(0,0,0,0.5)", color: "#fff",
              border: "none", fontSize: 10, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>×</button>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ── Category Select ───────────────────────────────────────────────────────────
const CategorySelect = ({ name, value, onChange, disabled, categories }) => (
  <div style={{ position: "relative" }}>
    <select
      name={name} value={value} onChange={onChange}
      required disabled={disabled}
      style={{
        ...inputStyle,
        appearance: "none", paddingRight: 32,
        background: disabled ? T.slate50 : "#fff",
        color: value ? T.slate900 : T.slate400,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <option value="" disabled>{disabled ? "Loading…" : "Select a category"}</option>
      {categories.map(cat => (
        <option key={cat.id ?? cat.category_id} value={cat.id ?? cat.category_id}>
          {cat.name ?? cat.category_name ?? cat.title}
        </option>
      ))}
    </select>
    <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: T.slate400, fontSize: 10 }}>
      {disabled ? "⟳" : "▾"}
    </span>
  </div>
);

// ── Status Toggle ─────────────────────────────────────────────────────────────
const StatusToggle = ({ value, onChange }) => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
    background: T.slate50, border: `1px solid ${T.slate200}`,
    borderRadius: T.radius.md, padding: "12px 14px", marginBottom: 14,
  }}>
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.slate700 }}>Availability Status</div>
      <div style={{ fontSize: 10, color: T.slate400, marginTop: 1 }}>Set whether this product is In Stock or Pre-Order</div>
    </div>
    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
      {[
        { val: "in_stock", label: "✅ In Stock", activeColor: T.green600, activeBorder: T.green600 },
        { val: "pre_order", label: "🕒 Pre-Order", activeColor: T.amber600, activeBorder: T.amber600 },
      ].map(opt => (
        <button key={opt.val} type="button" onClick={() => onChange(opt.val)} style={{
          padding: "6px 12px", borderRadius: T.radius.sm, fontSize: 11, fontWeight: 600,
          cursor: "pointer", transition: "all 0.12s", fontFamily: T.font,
          background: value === opt.val ? opt.activeColor : "#fff",
          color: value === opt.val ? "#fff" : T.slate500,
          border: `1px solid ${value === opt.val ? opt.activeBorder : T.slate200}`,
        }}>
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

// ── Sale Toggle ───────────────────────────────────────────────────────────────
const SaleToggle = ({ checked, onChange, name }) => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: T.slate50, border: `1px solid ${T.slate200}`,
    borderRadius: T.radius.md, padding: "12px 14px", marginBottom: 14,
  }}>
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.slate700 }}>Mark as On Sale</div>
      <div style={{ fontSize: 10, color: T.slate400, marginTop: 1 }}>Show a sale badge on this product</div>
    </div>
    <label style={{ position: "relative", display: "inline-block", width: 40, height: 22, cursor: "pointer", flexShrink: 0 }}>
      <input type="checkbox" name={name} checked={checked} onChange={onChange} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
      <div style={{
        position: "absolute", inset: 0, borderRadius: 11,
        background: checked ? T.blue600 : T.slate300, transition: "background 0.2s",
      }} />
      <div style={{
        position: "absolute", top: 3, left: checked ? 21 : 3,
        width: 16, height: 16, borderRadius: "50%",
        background: "#fff", transition: "left 0.2s", boxShadow: T.shadow.sm,
      }} />
    </label>
  </div>
);

// ── Color Variants Editor ─────────────────────────────────────────────────────
const ColorVariantsEditor = ({ variants, onChange }) => {
  const addVariant = () => onChange([...variants, { color: "", stocks: 0 }]);
  const removeVariant = (i) => onChange(variants.filter((_, idx) => idx !== i));
  const updateVariant = (i, field, value) => {
    onChange(variants.map((v, idx) => idx === i ? { ...v, [field]: value } : v));
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={labelStyle}>Color Variants & Stocks</div>
        <button type="button" onClick={addVariant} style={{
          ...btnBase, padding: "5px 10px", fontSize: 11,
          background: T.blue600, color: "#fff",
        }}>+ Add Color</button>
      </div>
      {variants.length === 0 && (
        <div style={{
          textAlign: "center", padding: "16px 0",
          border: `2px dashed ${T.slate200}`, borderRadius: T.radius.md,
          color: T.slate400, fontSize: 11,
        }}>
          No color variants — product will have no color assigned.
          <br />
          <button type="button" onClick={addVariant} style={{ marginTop: 6, color: T.blue500, background: "none", border: "none", cursor: "pointer", fontSize: 11, fontFamily: T.font }}>
            + Add first color variant
          </button>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {variants.map((v, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 8,
            background: T.slate50, border: `1px solid ${T.slate200}`,
            borderRadius: T.radius.md, padding: "10px 12px",
          }}>
            {v.color ? <ColorDot color={v.color} size={18} /> : (
              <span style={{ width: 18, height: 18, border: `2px dashed ${T.slate300}`, borderRadius: "50%", flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, position: "relative" }}>
              <select value={v.color} onChange={e => updateVariant(i, "color", e.target.value)}
                style={{ ...inputStyle, appearance: "none", paddingRight: 24, cursor: "pointer" }}>
                <option value="">— No Color —</option>
                {COLOR_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: T.slate400, fontSize: 9 }}>▾</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: T.slate500, fontWeight: 500 }}>Stocks:</span>
              <input type="number" min="0" value={v.stocks}
                onChange={e => updateVariant(i, "stocks", parseInt(e.target.value) || 0)}
                style={{ ...inputStyle, width: 70, textAlign: "center" }} />
            </div>
            <button type="button" onClick={() => removeVariant(i)} style={{
              width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: T.radius.sm, background: T.red50, border: `1px solid ${T.red100}`,
              color: T.red600, cursor: "pointer", fontSize: 13, flexShrink: 0,
            }}>×</button>
          </div>
        ))}
      </div>
      {variants.length > 0 && (
        <p style={{ fontSize: 10, color: T.slate400, marginTop: 6, marginBottom: 0 }}>
          {variants.length} color variant{variants.length > 1 ? "s" : ""} — each will be saved as a separate product entry.
        </p>
      )}
    </div>
  );
};

// ── Export Modal ──────────────────────────────────────────────────────────────
const ExportModal = ({ onClose, products, categories }) => {
  const [format, setFormat] = useState(null);
  const [exporting, setExporting] = useState(false);

  const resolveCat = (raw, fallback) =>
    typeof raw === "object" && raw !== null ? (raw.name ?? raw.category_name ?? fallback ?? "—") : (raw ?? fallback ?? "—");
  const getStatus = (status) => status === "pre_order" || status === "Pre-Order" ? "Pre-Order" : "In Stock";

  const buildRows = () => products.map((p, i) => ({
    "#": i + 1,
    "Product Name": p.product_name ?? p.name ?? "—",
    "Category": resolveCat(p.category, p.category_name),
    "Color": p.color || "—",
    "Size": p.size || "—",
    "Unit": p.unit || "—",
    "Status": getStatus(p.status),
    "On Sale": p.isSale == 1 ? "Yes" : "No",
    "Price (PHP)": parseFloat(p.price ?? 0).toFixed(2),
    "Acq. Price (PHP)": parseFloat(p.acquired_price ?? 0).toFixed(2),
  }));

  const exportExcel = () => {
    setExporting(true);
    try {
      const rows = buildRows();
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [{ wch: 6 },{ wch: 36 },{ wch: 20 },{ wch: 12 },{ wch: 12 },{ wch: 8 },{ wch: 12 },{ wch: 8 },{ wch: 14 },{ wch: 16 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Products");
      XLSX.writeFile(wb, `products_export_${Date.now()}.xlsx`);
    } catch (err) { alert("Export failed: " + err.message); }
    finally { setExporting(false); onClose(); }
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      if (!window.jspdf) {
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
          s.onload = res; s.onerror = rej; document.head.appendChild(s);
        });
      }
      if (!window.jspdf?.jsPDF?.prototype?.autoTable) {
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";
          s.onload = res; s.onerror = rej; document.head.appendChild(s);
        });
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 41, 59);
      doc.text("List of Products", 14, 16);
      doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139);
      doc.text(`Exported: ${new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}`, 14, 22);
      doc.text(`Total: ${products.length} product(s)`, 14, 27);
      const rows = buildRows();
      const columns = Object.keys(rows[0] || {});
      doc.autoTable({
        startY: 32, head: [columns], body: rows.map(r => columns.map(c => r[c])),
        styles: { fontSize: 8, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 }, lineColor: [226, 232, 240], lineWidth: 0.3, font: "helvetica", textColor: [30, 41, 59] },
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 0: { cellWidth: 14, halign: "center" }, 1: { cellWidth: 70 }, 2: { cellWidth: 38 }, 3: { cellWidth: 20 }, 4: { cellWidth: 20 }, 5: { cellWidth: 15 }, 6: { cellWidth: 22 }, 7: { cellWidth: 16, halign: "center" }, 8: { cellWidth: 30, halign: "right" }, 9: { cellWidth: 30, halign: "right" } },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 6) {
            if (data.cell.raw === "In Stock") { data.cell.styles.textColor = [5, 150, 105]; data.cell.styles.fontStyle = "bold"; }
            else if (data.cell.raw === "Pre-Order") { data.cell.styles.textColor = [217, 119, 6]; data.cell.styles.fontStyle = "bold"; }
          }
          if (data.section === "body" && data.column.index === 7 && data.cell.raw === "Yes") {
            data.cell.styles.textColor = [180, 83, 9]; data.cell.styles.fontStyle = "bold";
          }
        },
        margin: { left: 14, right: 14 }, tableLineColor: [203, 213, 225], tableLineWidth: 0.3,
      });
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i); doc.setFontSize(8); doc.setTextColor(148, 163, 184);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 8, { align: "right" });
      }
      doc.save(`products_export_${Date.now()}.pdf`);
    } catch (err) { alert("PDF export failed: " + err.message); }
    finally { setExporting(false); onClose(); }
  };

  const COLUMNS = ["#", "Product Name", "Category", "Color", "Size", "Unit", "Status", "On Sale", "Price (PHP)", "Acq. Price (PHP)"];

  return (
    <Overlay onClose={onClose}>
      <ModalHeader title="Export Products" subtitle={`${products.length} product(s) will be exported`} onClose={onClose} />
      <div style={{ padding: "20px 20px 24px" }}>
        <p style={{ fontSize: 12, color: T.slate500, marginBottom: 16, marginTop: 0 }}>Choose a format to export your current product list:</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {[
            { key: "excel", icon: "📊", title: "Excel (.xlsx)", desc: "Best for editing, filtering, and further data work.", accentColor: T.green600, border: "#10B981" },
            { key: "pdf",   icon: "📄", title: "PDF (.pdf)",   desc: "Printable grid layout. Great for reports and sharing.", accentColor: T.blue600, border: T.blue500 },
          ].map(opt => (
            <button key={opt.key} type="button" onClick={() => setFormat(opt.key)} style={{
              display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10,
              padding: 16, borderRadius: T.radius.lg, cursor: "pointer", textAlign: "left",
              border: `2px solid ${format === opt.key ? opt.border : T.slate200}`,
              background: format === opt.key ? (opt.key === "excel" ? T.green50 : T.blue50) : T.slate50,
              transition: "all 0.15s", fontFamily: T.font,
            }}>
              <div style={{ fontSize: 32 }}>{opt.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: format === opt.key ? opt.accentColor : T.slate800, marginBottom: 3 }}>{opt.title}</div>
                <div style={{ fontSize: 10, color: T.slate400, lineHeight: 1.5 }}>{opt.desc}</div>
              </div>
              {format === opt.key && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: opt.accentColor, color: "#fff" }}>✓ Selected</span>
              )}
            </button>
          ))}
        </div>

        {format && (
          <div style={{ padding: 14, borderRadius: T.radius.md, background: T.slate50, border: `1px solid ${T.slate200}`, marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.slate400, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
              Columns included:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {COLUMNS.map(col => (
                <span key={col} style={{ padding: "2px 8px", background: "#fff", border: `1px solid ${T.slate200}`, borderRadius: T.radius.sm, fontSize: 10, color: T.slate600, fontWeight: 500 }}>
                  {col}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={onClose} style={{ ...btnBase, flex: 1, justifyContent: "center", background: "#fff", color: T.slate700, border: `1px solid ${T.slate200}`, padding: "10px 0" }}>
            Cancel
          </button>
          <button type="button" onClick={() => format === "pdf" ? exportPDF() : exportExcel()}
            disabled={!format || exporting}
            style={{
              ...btnBase, flex: 2, justifyContent: "center", padding: "10px 0",
              background: !format || exporting ? T.slate300 : format === "pdf" ? T.blue600 : T.green600,
              color: "#fff",
              cursor: !format || exporting ? "not-allowed" : "pointer",
            }}>
            {exporting ? "Exporting…" : !format ? "Select a format first" : format === "pdf" ? "⬇ Download PDF" : "⬇ Download Excel"}
          </button>
        </div>
      </div>
    </Overlay>
  );
};

// ── Import Modal ──────────────────────────────────────────────────────────────
const ImportModal = ({ onClose, categories, onImportSuccess, existingProducts }) => {
  const [step, setStep] = useState("upload");
  const [editableRows, setEditableRows] = useState([]);
  const [defaultCategoryId, setDefaultCategoryId] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState({ created: 0, failed: 0, errors: [] });
  const [dragOver, setDragOver] = useState(false);
  const [importSearch, setImportSearch] = useState("");
  const fileRef = useRef();

  const existingSet = useMemo(() => {
    const s = new Set();
    (existingProducts ?? []).forEach(p => {
      const name = (p.product_name ?? p.name ?? "").trim().toLowerCase();
      const color = (p.color ?? "").trim().toLowerCase();
      s.add(`${name}|||${color}`);
    });
    return s;
  }, [existingProducts]);

  const isDuplicate = (row) => {
    const name = (row.product_name ?? "").trim().toLowerCase();
    const color = (row.color ?? "").trim().toLowerCase();
    return existingSet.has(`${name}|||${color}`);
  };

  const parseExcel = async (file) => {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    let headerIdx = -1;
    for (let i = 0; i < json.length; i++) {
      if (json[i].some(cell => String(cell).toLowerCase().includes("item description"))) { headerIdx = i; break; }
    }
    if (headerIdx === -1) headerIdx = 0;
    const headers = json[headerIdx].map(h => String(h).toLowerCase().trim());
    const colIdx = (...names) => {
      for (const n of names) {
        const idx = headers.findIndex(h => {
          if (n === "size") return h === "size" || (h.includes("size") && !h.includes("size_color") && !h.includes("size/color") && !h.includes("size color"));
          return h.includes(n);
        });
        if (idx !== -1) return idx;
      }
      return -1;
    };
    const nameCol = colIdx("item description", "product name", "name", "item");
    const sizeColorCol = colIdx("size_color", "size/color", "size color");
    const unitCol = colIdx("unit");
    const acquiredPriceCol = colIdx("acquired", "cost", "buying", "acquired pri");
    const sellingPriceCol = colIdx("selling", "price", "selling p");
    const sizeCol = colIdx("size");
    const colorCol = colIdx("color");
    const rows = [];
    let keyIdx = 0;
    const colorWords = ["black","white","red","blue","green","yellow","orange","purple","pink","gray","brown","beige","maroon","navy","teal","cyan","magenta","gold","silver"];
    for (let i = headerIdx + 1; i < json.length; i++) {
      const row = json[i];
      const name = nameCol !== -1 ? String(row[nameCol] ?? "").trim() : "";
      if (!name) continue;
      let size = sizeCol !== -1 ? String(row[sizeCol] ?? "").trim() : "";
      let colorRaw = colorCol !== -1 ? String(row[colorCol] ?? "").trim() : "";
      const sizeColor = sizeColorCol !== -1 ? String(row[sizeColorCol] ?? "").trim() : "";
      if (sizeColor && !size && !colorRaw) {
        const lowerSizeColor = sizeColor.toLowerCase();
        const hasColorWord = colorWords.some(cw => lowerSizeColor.includes(cw));
        const hasColorSeparator = lowerSizeColor.includes("or") || lowerSizeColor.includes("/") || lowerSizeColor.includes(",");
        if (hasColorWord && hasColorSeparator) colorRaw = sizeColor;
        else if (!hasColorWord) size = sizeColor;
        else colorRaw = sizeColor;
      }
      let acquiredPrice = "";
      if (acquiredPriceCol !== -1) {
        const val = row[acquiredPriceCol];
        if (typeof val === "string" && val.includes(" ")) {
          const parts = val.trim().split(/\s+/);
          const p = parseFloat(parts[0]);
          if (!isNaN(p)) { acquiredPrice = p; if (!size && parts[1]) size = parts[1]; } else acquiredPrice = parseFloat(val) || "";
        } else acquiredPrice = parseFloat(val) || "";
      }
      let sellingPrice = "";
      if (sellingPriceCol !== -1) {
        const val = row[sellingPriceCol];
        if (typeof val === "string" && val.includes(" ")) {
          const parts = val.trim().split(/\s+/);
          const p = parseFloat(parts[0]);
          if (!isNaN(p)) { sellingPrice = p; if (!size && parts[1]) size = parts[1]; } else sellingPrice = parseFloat(val) || "";
        } else sellingPrice = parseFloat(val) || "";
      }
      const unit = unitCol !== -1 ? String(row[unitCol] ?? "").trim() : "";
      const colorList = splitColors(colorRaw);
      if (colorList.length > 1) {
        for (const c of colorList) rows.push({ _key: `row_${keyIdx++}`, product_name: name, size, color: c, unit, acquired_price: acquiredPrice, price: sellingPrice, category_id: "", description: "", isSale: false });
      } else {
        rows.push({ _key: `row_${keyIdx++}`, product_name: name, size, color: colorList[0] || "", unit, acquired_price: acquiredPrice, price: sellingPrice, category_id: "", description: "", isSale: false });
      }
    }
    return rows;
  };

  const handleFile = async (file) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls") && !name.endsWith(".csv")) { alert("Please upload an Excel file (.xlsx, .xls, .csv)"); return; }
    try {
      const rows = await parseExcel(file);
      if (!rows.length) { alert("No product rows found in the file."); return; }
      setEditableRows(rows); setStep("preview");
    } catch (err) { alert("Failed to parse file: " + err.message); }
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };
  const updateRow = (idx, field, value) => setEditableRows(prev => { const next = [...prev]; next[idx] = { ...next[idx], [field]: value }; return next; });
  const duplicateRow = (idx) => setEditableRows(prev => { const next = [...prev]; next.splice(idx + 1, 0, { ...next[idx], _key: `row_dup_${Date.now()}_${idx}`, color: "", stocks: 0 }); return next; });
  const removeRow = (idx) => setEditableRows(prev => prev.filter((_, i) => i !== idx));
  const applyDefaultCategory = () => { if (!defaultCategoryId) return; setEditableRows(prev => prev.map(r => ({ ...r, category_id: r.category_id || defaultCategoryId }))); };

  const displayedRows = useMemo(() => {
    if (!importSearch.trim()) return editableRows.map((r, i) => ({ ...r, _origIdx: i }));
    const q = importSearch.toLowerCase();
    return editableRows.map((r, i) => ({ ...r, _origIdx: i })).filter(r => r.product_name.toLowerCase().includes(q));
  }, [editableRows, importSearch]);

  const handleImport = async () => {
    const toImport = editableRows.filter(r => r.product_name && !isDuplicate(r));
    if (!toImport.length) { alert("No rows to import."); return; }
    const missing = toImport.filter(r => !r.category_id);
    if (missing.length) { alert(`${missing.length} product(s) have no category.`); return; }
    setImporting(true); setStep("importing"); setProgress({ done: 0, total: toImport.length });
    const res = { created: 0, failed: 0, errors: [] };
    for (let i = 0; i < toImport.length; i++) {
      const row = toImport[i];
      try {
        const fd = new FormData();
        fd.append("product_name", row.product_name); fd.append("category_id", row.category_id);
        fd.append("product_stocks", 0); fd.append("price", row.price || 0);
        fd.append("acquired_price", row.acquired_price || 0); fd.append("unit", row.unit || "");
        fd.append("size", row.size || ""); fd.append("description", row.description || "");
        fd.append("isSale", row.isSale ? 1 : 0);
        if (row.color) fd.append("color", row.color);
        await axios.post(`${BASE}/api/admin/products`, fd, { withCredentials: true });
        res.created++;
      } catch (err) {
        res.failed++;
        res.errors.push(`${row.product_name}${row.color ? ` (${row.color})` : ""}: ${err.response?.data?.message ?? err.message}`);
      }
      setProgress({ done: i + 1, total: toImport.length });
    }
    setResults(res); setStep("done"); setImporting(false); onImportSuccess();
  };

  const duplicateCount = editableRows.filter(r => r.product_name && isDuplicate(r)).length;
  const importableCount = editableRows.filter(r => r.product_name && !isDuplicate(r)).length;

  const tblInputSm = { ...inputStyle, fontSize: 11, padding: "6px 8px" };
  const tblSelectSm = { ...tblInputSm, appearance: "none", paddingRight: 20, cursor: "pointer" };

  return (
    <Overlay extraWide onClose={onClose}>
      <ModalHeader
        title="Import Products"
        subtitle={
          step === "upload" ? "Upload an Excel file to bulk-import products" :
          step === "preview" ? `${editableRows.length} row(s) found — review before importing` :
          step === "importing" ? "Importing products…" : "Import complete"
        }
        onClose={onClose}
      />
      <div style={{ padding: "20px 20px 24px" }}>

        {step === "upload" && (
          <div>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? T.blue500 : T.slate300}`,
                borderRadius: T.radius.lg, padding: "40px 20px", textAlign: "center",
                cursor: "pointer", transition: "all 0.15s",
                background: dragOver ? T.blue50 : T.slate50, marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 10 }}>📊</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.slate800, marginBottom: 4 }}>Drop your Excel file here</div>
              <div style={{ fontSize: 11, color: T.slate400 }}>or click to browse — supports .xlsx, .xls, .csv</div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
            </div>
            <div style={{ background: T.blue50, border: `1px solid ${T.blue100}`, borderRadius: T.radius.md, padding: 14, fontSize: 11, color: T.blue600 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>📋 Expected columns:</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[
                  ["ITEM DESCRIPTION", "→ Product Name (required)"],
                  ["SIZE_COLOR / SIZE", "→ Size field"],
                  ["COLOR", "→ Optional — auto-split 'Black Or White' → 2 rows"],
                  ["UNIT", "→ Unit (btl, gal, pcs, etc.)"],
                  ["ACQUIRED PRICE", "→ Cost price"],
                  ["SELLING PRICE", "→ Selling price"],
                ].map(([col, desc]) => (
                  <div key={col} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <code style={{ background: "#fff", border: `1px solid ${T.blue100}`, borderRadius: 4, padding: "1px 6px", fontSize: 10 }}>{col}</code>
                    <span style={{ color: T.blue500 }}>{desc}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8, color: T.blue500 }}>✅ Products without color are imported as-is</div>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div>
            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${T.slate200}`, borderRadius: T.radius.sm, padding: "7px 12px", background: T.slate50, marginBottom: 10 }}>
              <span style={{ color: T.slate400 }}>🔍</span>
              <input type="text" placeholder="Search products in this import…" value={importSearch} onChange={e => setImportSearch(e.target.value)}
                style={{ flex: 1, fontSize: 12, color: T.slate700, background: "transparent", border: "none", outline: "none", fontFamily: T.font }} />
              {importSearch && <button onClick={() => setImportSearch("")} style={{ background: "none", border: "none", color: T.slate400, cursor: "pointer", fontSize: 12 }}>✕</button>}
            </div>

            {/* Default category */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, padding: 12, marginBottom: 12, background: T.amber50, border: `1px solid ${T.amber100}`, borderRadius: T.radius.md }}>
              <div style={{ flex: 1 }}>
                <div style={{ ...labelStyle, color: "#92400e", marginBottom: 6 }}>Apply default category to unassigned rows</div>
                <div style={{ position: "relative" }}>
                  <select value={defaultCategoryId} onChange={e => setDefaultCategoryId(e.target.value)}
                    style={{ ...inputStyle, appearance: "none", paddingRight: 28, cursor: "pointer", border: `1px solid ${T.amber100}` }}>
                    <option value="">Select category…</option>
                    {categories.map(cat => <option key={cat.id ?? cat.category_id} value={cat.id ?? cat.category_id}>{cat.name ?? cat.category_name ?? cat.title}</option>)}
                  </select>
                  <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: T.slate400, fontSize: 10 }}>▾</span>
                </div>
              </div>
              <button onClick={applyDefaultCategory} disabled={!defaultCategoryId} style={{
                ...btnBase, padding: "9px 16px", background: T.amber500, color: "#fff",
                opacity: !defaultCategoryId ? 0.4 : 1, cursor: !defaultCategoryId ? "not-allowed" : "pointer",
                flexShrink: 0,
              }}>Apply to All</button>
            </div>

            {duplicateCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", marginBottom: 10, background: "#FFF7ED", border: `1px solid #FED7AA`, borderRadius: T.radius.md, fontSize: 12, color: "#C2410C" }}>
                ⚠️ <span><strong>{duplicateCount}</strong> row(s) already exist and will be <strong>skipped</strong>.</span>
              </div>
            )}

            {/* Table */}
            <div style={{ maxHeight: "48vh", overflowY: "auto", marginBottom: 12, borderRadius: T.radius.md, border: `1px solid ${T.slate200}` }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.slate100, position: "sticky", top: 0, zIndex: 1 }}>
                    {["Product Name", "Color", "Size", "Unit", "Price ₱", "Acq. ₱", "Category *", "Actions"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: T.slate600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.3px", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.length === 0 && (
                    <tr><td colSpan={8} style={{ padding: "24px", textAlign: "center", color: T.slate400, fontSize: 12 }}>No products match your search</td></tr>
                  )}
                  {displayedRows.map((row) => {
                    const idx = row._origIdx;
                    const dup = isDuplicate(row);
                    return (
                      <tr key={row._key} style={{ borderBottom: `1px solid ${T.slate100}`, background: dup ? "#FFF7ED" : "#fff", opacity: dup ? 0.8 : 1 }}
                        onMouseEnter={e => { if (!dup) e.currentTarget.style.background = T.blue50 + "40"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = dup ? "#FFF7ED" : "#fff"; }}>
                        <td style={{ padding: "6px 8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <input value={row.product_name} onChange={e => updateRow(idx, "product_name", e.target.value)} style={tblInputSm} />
                            {dup && <span title="Already exists" style={{ color: "#F97316", fontSize: 13, flexShrink: 0 }}>⚠</span>}
                          </div>
                        </td>
                        <td style={{ padding: "6px 8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {row.color && <ColorDot color={row.color} size={12} />}
                            <div style={{ position: "relative", flex: 1 }}>
                              <select value={row.color || ""} onChange={e => updateRow(idx, "color", e.target.value)} style={{ ...tblSelectSm }}>
                                <option value="">No Color</option>
                                {COLOR_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                              <span style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: T.slate400, fontSize: 8 }}>▾</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "6px 8px" }}><input value={row.size} onChange={e => updateRow(idx, "size", e.target.value)} placeholder="e.g. 500ml" style={tblInputSm} /></td>
                        <td style={{ padding: "6px 8px" }}><input value={row.unit} onChange={e => updateRow(idx, "unit", e.target.value)} placeholder="btl/pc" style={tblInputSm} /></td>
                        <td style={{ padding: "6px 8px" }}><input type="number" step="0.01" value={row.price} onChange={e => updateRow(idx, "price", e.target.value)} placeholder="0.00" style={{ ...tblInputSm, textAlign: "right" }} /></td>
                        <td style={{ padding: "6px 8px" }}><input type="number" step="0.01" value={row.acquired_price} onChange={e => updateRow(idx, "acquired_price", e.target.value)} placeholder="0.00" style={{ ...tblInputSm, textAlign: "right" }} /></td>
                        <td style={{ padding: "6px 8px" }}>
                          <div style={{ position: "relative" }}>
                            <select value={row.category_id} onChange={e => updateRow(idx, "category_id", e.target.value)}
                              style={{ ...tblSelectSm, border: `1px solid ${!row.category_id ? T.red300 : T.slate200}`, background: !row.category_id ? T.red50 : "#fff" }}>
                              <option value="">-- select --</option>
                              {categories.map(cat => <option key={cat.id ?? cat.category_id} value={cat.id ?? cat.category_id}>{cat.name ?? cat.category_name ?? cat.title}</option>)}
                            </select>
                            <span style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: T.slate400, fontSize: 8 }}>▾</span>
                          </div>
                        </td>
                        <td style={{ padding: "6px 8px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                            <button type="button" onClick={() => duplicateRow(idx)} title="Add color variant" style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: T.radius.sm, background: T.blue50, border: `1px solid ${T.blue100}`, color: T.blue600, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>+</button>
                            <button type="button" onClick={() => removeRow(idx)} title="Remove row" style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: T.radius.sm, background: T.red50, border: `1px solid ${T.red100}`, color: T.red600, fontSize: 12, cursor: "pointer" }}>×</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: T.slate400, marginBottom: 14, flexWrap: "wrap", gap: 4 }}>
              <span>{importSearch ? `Showing ${displayedRows.length} of ${editableRows.length} rows` : `${importableCount} of ${editableRows.length} rows will be imported`}</span>
              <div style={{ display: "flex", gap: 12 }}>
                {duplicateCount > 0 && <span style={{ color: "#F97316" }}>{duplicateCount} duplicate(s) will be skipped</span>}
                <span style={{ color: T.red500 }}>{editableRows.filter(r => !r.category_id && !isDuplicate(r)).length} row(s) missing category</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep("upload")} style={{ ...btnBase, flex: 1, justifyContent: "center", background: "#fff", color: T.slate700, border: `1px solid ${T.slate200}`, padding: "10px 0" }}>← Back</button>
              <button onClick={handleImport} disabled={importing || importableCount === 0} style={{ ...btnBase, flex: 2, justifyContent: "center", padding: "10px 0", background: T.green600, color: "#fff", opacity: importing || importableCount === 0 ? 0.4 : 1, cursor: importing || importableCount === 0 ? "not-allowed" : "pointer" }}>
                ⬆ Import {importableCount} Row(s)
              </button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>⟳</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.slate800, marginBottom: 12 }}>Importing {progress.done} of {progress.total}…</div>
            <div style={{ width: "100%", height: 10, background: T.slate100, borderRadius: 20, overflow: "hidden" }}>
              <div style={{ height: "100%", background: T.blue600, borderRadius: 20, transition: "width 0.3s", width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
            </div>
            <div style={{ fontSize: 11, color: T.slate400, marginTop: 8 }}>{Math.round(progress.total ? (progress.done / progress.total) * 100 : 0)}%</div>
          </div>
        )}

        {step === "done" && (
          <div style={{ padding: "24px 0", textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>{results.failed === 0 ? "🎉" : "⚠️"}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.slate900, marginBottom: 16 }}>Import Complete!</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={{ padding: 14, background: T.green50, border: `1px solid ${T.green100}`, borderRadius: T.radius.md }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.green600 }}>{results.created}</div>
                <div style={{ fontSize: 10, color: T.green500, marginTop: 2 }}>Created</div>
              </div>
              <div style={{ padding: 14, background: T.red50, border: `1px solid ${T.red100}`, borderRadius: T.radius.md }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.red600 }}>{results.failed}</div>
                <div style={{ fontSize: 10, color: T.red500, marginTop: 2 }}>Failed</div>
              </div>
            </div>
            {results.errors.length > 0 && (
              <div style={{ padding: 12, marginBottom: 14, overflowY: "auto", maxHeight: 140, textAlign: "left", background: T.red50, border: `1px solid ${T.red100}`, borderRadius: T.radius.md }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.red600, marginBottom: 6 }}>Errors:</div>
                {results.errors.map((e, i) => <div key={i} style={{ fontSize: 10, color: T.red500 }}>{e}</div>)}
              </div>
            )}
            <button onClick={onClose} style={{ ...btnBase, width: "100%", justifyContent: "center", background: T.blue600, color: "#fff", padding: "10px 0" }}>Done</button>
          </div>
        )}
      </div>
    </Overlay>
  );
};

// ── Mobile Product Card ───────────────────────────────────────────────────────
const ProductCard = ({ product, deleteMode, isSelected, onSelect, onView, onEdit, onDelete, BASE, resolveCat, getStatus }) => {
  const name = product.product_name ?? product.name ?? "—";
  const category = resolveCat(product.category, product.category_name);
  const color = product.color ?? "";
  const size = product.size ?? "—";
  const unit = product.unit ?? "—";
  const price = parseFloat(product.price ?? 0);
  const status = getStatus(product.status);
  const thumb = product.images?.[0]?.image_path ? `${BASE}/storage/${product.images[0].image_path}` : null;

  return (
    <div style={{
      background: "#fff", borderRadius: T.radius.md, padding: 12,
      border: `1px solid ${isSelected ? T.blue500 : T.slate200}`,
      background: isSelected ? T.blue50 : "#fff",
      transition: "all 0.12s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        {deleteMode && (
          <input type="checkbox" checked={isSelected} onChange={() => onSelect(product.product_id)}
            style={{ width: 15, height: 15, marginTop: 2, flexShrink: 0, cursor: "pointer" }} />
        )}
        <div style={{ width: 46, height: 46, borderRadius: T.radius.sm, background: T.slate100, border: `1px solid ${T.slate200}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, overflow: "hidden" }}>
          {thumb ? <img src={thumb} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "📄"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: T.slate900, lineHeight: 1.3, flex: 1, minWidth: 0 }}>{name}</div>
            <StatusBadge status={status} />
          </div>
          <div style={{ fontSize: 10, color: T.slate400, marginBottom: 4 }}>{category}</div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 10, color: T.slate500 }}>
            {color && <div style={{ display: "flex", alignItems: "center", gap: 4 }}><ColorDot color={color} size={10} /><span>{color}</span></div>}
            {size !== "—" && <span>📐 {size}</span>}
            {unit !== "—" && <span>⚖️ {unit}</span>}
            {product.isSale == 1 && <SaleBadge />}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: T.blue600 }}>₱{price.toFixed(2)}</span>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { label: "👁 View", onClick: onView, bg: T.blue50, color: T.blue600, border: T.blue100 },
                { label: "✏️ Edit", onClick: onEdit, bg: "#fff", color: T.slate700, border: T.slate200 },
                { label: "🗑", onClick: onDelete, bg: T.red50, color: T.red600, border: T.red100 },
              ].map(btn => (
                <button key={btn.label} onClick={btn.onClick} style={{
                  padding: "4px 8px", borderRadius: T.radius.sm, fontSize: 10, fontWeight: 600,
                  background: btn.bg, color: btn.color, border: `1px solid ${btn.border}`,
                  cursor: "pointer", fontFamily: T.font,
                }}>{btn.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main AdminProducts Component ──────────────────────────────────────────────
const AdminProducts = () => {
  const [searchTerm, setSearchTerm]             = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOrder, setSortOrder]               = useState("A-Z");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [deleteMode, setDeleteMode]             = useState(false);
  const [sidebarOpen, setSidebarOpen]           = useState(false);
  const [currentPage, setCurrentPage]           = useState(1);
  const [showFilters, setShowFilters]           = useState(false);

  const [showAddModal, setShowAddModal]         = useState(false);
  const [showViewModal, setShowViewModal]       = useState(false);
  const [showEditModal, setShowEditModal]       = useState(false);
  const [showDeleteModal, setShowDeleteModal]   = useState(false);
  const [showImportModal, setShowImportModal]   = useState(false);
  const [showExportModal, setShowExportModal]   = useState(false);
  const [activeProduct, setActiveProduct]       = useState(null);
  const [activeImgIdx, setActiveImgIdx]         = useState(0);

  const [categories, setCategories]             = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [products, setProducts]                 = useState([]);
  const [productsLoading, setProductsLoading]   = useState(false);
  const [productStats, setProductStats]         = useState({ total: 0, inStock: 0, preOrder: 0 });

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [saving, setSaving]         = useState(false);

  const BLANK_ADD = { product_name: "", category_id: "", description: "", price: "", acquired_price: "", unit: "", size: "", isSale: false, status: "in_stock" };
  const [addForm, setAddForm]         = useState(BLANK_ADD);
  const [addImages, setAddImages]     = useState([]);
  const [addPreviews, setAddPreviews] = useState([]);
  const [editForm, setEditForm]       = useState({ ...BLANK_ADD });
  const [newImages, setNewImages]     = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [removedImageIds, setRemovedImageIds] = useState([]);
  const [editColor, setEditColor]     = useState("");

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await axios.get(`${BASE}/api/admin/products`, { withCredentials: true });
      const data = res.data?.data ?? res.data?.products ?? res.data;
      const list = Array.isArray(data) ? data : [];
      setProducts(list);
      setProductStats({ total: list.length, inStock: list.filter(p => (p.status ?? "in_stock") !== "pre_order").length, preOrder: list.filter(p => (p.status ?? "") === "pre_order").length });
    } catch (err) { console.error("Failed to fetch products:", err); }
    finally { setProductsLoading(false); }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const res = await axios.get(`${BASE}/api/categories`, { withCredentials: true });
        const data = res.data?.categories ?? res.data?.data ?? res.data;
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) { console.error("Failed to fetch categories:", err); }
      finally { setCategoriesLoading(false); }
    };
    fetchCategories(); fetchProducts();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedCategory, sortOrder]);

  const toggleSelect = (id) => setSelectedProducts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

  const getStatus = (status) => (status === "pre_order" || status === "Pre-Order") ? "Pre-Order" : "In Stock";
  const resolveCat = (raw, fallback) => typeof raw === "object" && raw !== null ? (raw.name ?? raw.category_name ?? fallback ?? "—") : (raw ?? fallback ?? "—");

  const filteredProducts = useMemo(() => products
    .filter(p => {
      const name = (p.product_name ?? p.name ?? "").toLowerCase();
      const cat = resolveCat(p.category, p.category_name);
      return name.includes(searchTerm.toLowerCase()) && (selectedCategory === "All" || cat === selectedCategory);
    })
    .sort((a, b) => {
      const na = (a.product_name ?? a.name ?? "").toLowerCase();
      const nb = (b.product_name ?? b.name ?? "").toLowerCase();
      return sortOrder === "A-Z" ? na.localeCompare(nb) : nb.localeCompare(na);
    }), [products, searchTerm, selectedCategory, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginated = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    return Array.from({ length: 5 }, (_, i) => start + i);
  }, [totalPages, currentPage]);

  const openView = (p) => { setActiveProduct(p); setActiveImgIdx(0); setShowViewModal(true); };
  const openEdit = (p) => {
    setActiveProduct(p);
    setEditForm({ product_name: p.product_name ?? p.name ?? "", category_id: p.category_id ?? p.category?.id ?? "", description: p.description ?? "", price: p.price ?? "", acquired_price: p.acquired_price ?? "", unit: p.unit ?? "", size: p.size ?? "", isSale: p.isSale == 1, status: p.status ?? "in_stock" });
    setEditColor(p.color ?? ""); setNewImages([]); setNewPreviews([]); setRemovedImageIds([]); setShowEditModal(true);
  };
  const openDelete = (p) => { setActiveProduct(p); setShowDeleteModal(true); };

  const handleAddChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };
  const handleAddImages = (e) => {
    const files = Array.from(e.target.files);
    setAddImages(prev => [...prev, ...files]);
    setAddPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };
  const removeAddImage = (i) => { setAddImages(prev => prev.filter((_, idx) => idx !== i)); setAddPreviews(prev => prev.filter((_, idx) => idx !== i)); };

  const submitAdd = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const fd = new FormData();
      ["product_name","category_id","status","description","price","unit","size"].forEach(k => fd.append(k, addForm[k]));
      fd.append("acquired_price", addForm.acquired_price || 0);
      fd.append("isSale", addForm.isSale ? 1 : 0);
      addImages.forEach(img => fd.append("images[]", img));
      await axios.post(`${BASE}/api/admin/products`, fd, { withCredentials: true });
      setShowAddModal(false); setAddForm(BLANK_ADD); setAddImages([]); setAddPreviews([]); fetchProducts();
    } catch (err) { alert("Failed to create product"); }
    finally { setSubmitting(false); }
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };
  const handleNewImages = (e) => {
    const files = Array.from(e.target.files);
    setNewImages(prev => [...prev, ...files]);
    setNewPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };
  const removeNewImage = (i) => { setNewImages(prev => prev.filter((_, idx) => idx !== i)); setNewPreviews(prev => prev.filter((_, idx) => idx !== i)); };
  const toggleRemoveExisting = (imgId) => setRemovedImageIds(prev => prev.includes(imgId) ? prev.filter(x => x !== imgId) : [...prev, imgId]);

  const submitEdit = async (e) => {
    e.preventDefault(); setSaving(true);
    const fd = new FormData();
    fd.append("_method", "PUT");
    ["product_name","category_id","description","price","unit","size","status"].forEach(k => fd.append(k, editForm[k]));
    fd.append("acquired_price", editForm.acquired_price || 0);
    fd.append("isSale", editForm.isSale ? 1 : 0);
    if (editColor) fd.append("color", editColor);
    removedImageIds.forEach(id => fd.append("remove_images[]", id));
    newImages.forEach(img => fd.append("images[]", img));
    try {
      await axios.post(`${BASE}/api/admin/products/${activeProduct.product_id ?? activeProduct.id}`, fd, { withCredentials: true });
      setShowEditModal(false); fetchProducts();
    } catch (err) { alert("Failed to update product"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!activeProduct) return; setDeleting(true);
    try {
      await axios.delete(`${BASE}/api/admin/products/${activeProduct.product_id}`, { withCredentials: true });
      setShowDeleteModal(false); setActiveProduct(null); fetchProducts();
    } catch (err) { alert("Failed to delete product"); }
    finally { setDeleting(false); }
  };

  const handleBulkDelete = async () => {
    if (!selectedProducts.length) return;
    if (!window.confirm(`Delete ${selectedProducts.length} product(s)? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await Promise.all(selectedProducts.map(id => axios.delete(`${BASE}/api/admin/products/${id}`, { withCredentials: true })));
      setSelectedProducts([]); setDeleteMode(false); fetchProducts();
    } catch (err) { alert("Failed to delete some products: " + err.message); }
    finally { setDeleting(false); }
  };

  const viewImages = activeProduct?.images ?? [];
  const viewMainSrc = viewImages[activeImgIdx]?.image_path ? `${BASE}/storage/${viewImages[activeImgIdx].image_path}` : null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4F8", fontFamily: T.font }}>
      <style>{`
        @keyframes skeletonPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .ap-sidebar { display: none; }
        @media (min-width: 1024px) { .ap-sidebar { display: block; } }
        .ap-hamburger { display: flex; }
        @media (min-width: 1024px) { .ap-hamburger { display: none !important; } }
        .ap-mobile-cards { display: flex; flex-direction: column; gap: 8px; padding: 12px; }
        @media (min-width: 640px) { .ap-mobile-cards { display: none; } }
        .ap-desktop-table { display: none; overflow-x: auto; }
        @media (min-width: 640px) { .ap-desktop-table { display: block; } }
        .ap-filters-desktop { display: none; gap: 8px; }
        @media (min-width: 640px) { .ap-filters-desktop { display: flex; } }
        .ap-filter-toggle { display: flex; }
        @media (min-width: 640px) { .ap-filter-toggle { display: none !important; } }
        .ap-mobile-filters { display: flex; flex-direction: column; gap: 8px; padding-top: 10px; margin-top: 10px; border-top: 1px solid #F1F5F9; }
        .ap-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
        .tbl-row:hover td { background: #F8FAFC; }
        input[type=number]::-webkit-inner-spin-button { opacity: 1; }
      `}</style>

      {/* Sidebar */}
      <div className="ap-sidebar">
        <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      </div>

      {/* Modals */}
      {showExportModal && <ExportModal onClose={() => setShowExportModal(false)} products={filteredProducts} categories={categories} />}
      {showImportModal && <ImportModal onClose={() => setShowImportModal(false)} categories={categories} onImportSuccess={fetchProducts} existingProducts={products} />}

      {/* ── Add Product Modal ── */}
      {showAddModal && (
        <Overlay onClose={() => setShowAddModal(false)}>
          <ModalHeader title="Add New Product" subtitle="Fill in the details to list a new product" onClose={() => setShowAddModal(false)} />
          <form onSubmit={submitAdd} style={{ padding: "20px 20px 24px" }}>
            <ImageUploadZone id="addImgUpload" onchange={handleAddImages} previews={addPreviews} onRemove={removeAddImage} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <div style={labelStyle}>Product Name</div>
                <input name="product_name" placeholder="e.g. Scotch Brite Heavy-Duty Scrub Sponge"
                  value={addForm.product_name} onChange={handleAddChange} required
                  style={{ ...inputStyle, padding: "10px 14px", fontSize: 14, fontWeight: 500, border: `2px solid ${T.blue400 ?? T.blue500}` }} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <div style={labelStyle}>Category {categoriesLoading && <span style={{ fontSize: 9, color: T.slate400, fontWeight: 400, textTransform: "none" }}>Loading…</span>}</div>
                <CategorySelect name="category_id" value={addForm.category_id} onChange={handleAddChange} disabled={categoriesLoading} categories={categories} />
              </div>
              <div>
                <div style={labelStyle}>Price (₱)</div>
                <input type="number" step="0.01" name="price" placeholder="0.00" value={addForm.price} onChange={handleAddChange} required style={inputStyle} min="0" />
              </div>
              <div>
                <div style={labelStyle}>Acquired Price (₱)</div>
                <input type="number" step="0.01" name="acquired_price" placeholder="0.00" value={addForm.acquired_price} onChange={handleAddChange} style={inputStyle} min="0" />
              </div>
              <div>
                <div style={labelStyle}>Unit</div>
                <input name="unit" placeholder="e.g. btl, gal, pcs" value={addForm.unit} onChange={handleAddChange} style={inputStyle} />
              </div>
              <div>
                <div style={labelStyle}>Size</div>
                <input name="size" placeholder="e.g. 500ml, 1L" value={addForm.size} onChange={handleAddChange} style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={labelStyle}>Description</div>
              <textarea name="description" placeholder="Describe your product…" value={addForm.description} onChange={handleAddChange}
                style={{ ...inputStyle, height: 80, resize: "vertical" }} />
            </div>
            <StatusToggle value={addForm.status} onChange={(val) => setAddForm(prev => ({ ...prev, status: val }))} />
            <SaleToggle checked={addForm.isSale} onChange={handleAddChange} name="isSale" />
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ ...btnBase, flex: 1, justifyContent: "center", background: "#fff", color: T.slate700, border: `1px solid ${T.slate200}`, padding: "10px 0" }}>Cancel</button>
              <button type="submit" disabled={submitting} style={{ ...btnBase, flex: 2, justifyContent: "center", padding: "10px 0", background: submitting ? T.slate300 : T.blue600, color: "#fff", cursor: submitting ? "not-allowed" : "pointer" }}>
                {submitting ? "Creating…" : "+ Create Product"}
              </button>
            </div>
          </form>
        </Overlay>
      )}

      {/* ── View Product Modal ── */}
      {showViewModal && activeProduct && (
        <Overlay wide onClose={() => setShowViewModal(false)}>
          <ModalHeader title={activeProduct.product_name ?? activeProduct.name} subtitle={resolveCat(activeProduct.category, activeProduct.category_name)} onClose={() => setShowViewModal(false)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, padding: "20px 20px 24px" }}>
            <div>
              <div style={{ borderRadius: T.radius.md, overflow: "hidden", background: T.slate50, border: `1px solid ${T.slate200}`, aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10, position: "relative" }}>
                {viewMainSrc ? <img src={viewMainSrc} alt="main" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <span style={{ fontSize: 56, color: T.slate300 }}>📄</span>}
                {activeProduct.isSale == 1 && (
                  <div style={{ position: "absolute", top: 10, left: 10, background: T.amber500, color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>SALE</div>
                )}
                <div style={{ position: "absolute", top: 10, right: 10 }}><StatusBadge status={getStatus(activeProduct.status)} /></div>
              </div>
              {viewImages.length > 1 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {viewImages.map((img, i) => (
                    <button key={img.id ?? i} onClick={() => setActiveImgIdx(i)} style={{
                      width: 52, height: 52, borderRadius: T.radius.sm, overflow: "hidden", padding: 0, cursor: "pointer", background: T.slate50, flexShrink: 0,
                      border: i === activeImgIdx ? `2px solid ${T.blue600}` : `1px solid ${T.slate200}`,
                    }}>
                      <img src={`${BASE}/storage/${img.image_path}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </button>
                  ))}
                </div>
              )}
              {viewImages.length === 0 && <p style={{ margin: 0, fontSize: 11, textAlign: "center", color: T.slate400 }}>No images uploaded</p>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ padding: 16, background: T.slate50, borderRadius: T.radius.md }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: T.blue600, marginBottom: 8 }}>₱{parseFloat(activeProduct.price ?? 0).toFixed(2)}</div>
                <p style={{ margin: 0, fontSize: 12, color: T.slate500, lineHeight: 1.7 }}>
                  {activeProduct.description || <em style={{ color: T.slate300 }}>No description.</em>}
                </p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "Color", value: activeProduct.color || "—", icon: "🎨", extra: activeProduct.color ? <ColorDot color={activeProduct.color} size={14} /> : null },
                  { label: "Category", value: resolveCat(activeProduct.category, activeProduct.category_name), icon: "🏷️" },
                  { label: "Size", value: activeProduct.size || "—", icon: "📐" },
                  { label: "Unit", value: activeProduct.unit || "—", icon: "⚖️" },
                  { label: "On Sale", value: activeProduct.isSale == 1 ? "Yes" : "No", icon: "🏷" },
                ].map(item => (
                  <div key={item.label} style={{ background: "#fff", border: `1px solid ${T.slate200}`, borderRadius: T.radius.md, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 9, color: T.slate400, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>{item.label}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: T.slate900 }}>{item.extra}{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#fff", border: `1px solid ${T.slate200}`, borderRadius: T.radius.md, padding: "12px 16px" }}>
                {[
                  ["Product ID", `#${activeProduct.product_id}`],
                  ["Acquired Price", `₱${parseFloat(activeProduct.acquired_price ?? 0).toFixed(2)}`],
                  ["Created", activeProduct.created_at ? new Date(activeProduct.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : "—"],
                  ["Last Updated", activeProduct.updated_at ? new Date(activeProduct.updated_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : "—"],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${T.slate50}` }}>
                    <span style={{ fontSize: 11, color: T.slate400 }}>{lbl}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.slate700 }}>{val}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
                <button onClick={() => { setShowViewModal(false); openEdit(activeProduct); }} style={{ ...btnBase, flex: 1, justifyContent: "center", background: T.blue600, color: "#fff", padding: "10px 0" }}>
                  ✏️ Edit Product
                </button>
                <button onClick={() => { setShowViewModal(false); openDelete(activeProduct); }} style={{ ...btnBase, padding: "10px 14px", background: T.red50, color: T.red600, border: `1px solid ${T.red100}` }}>
                  🗑
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* ── Edit Product Modal ── */}
      {showEditModal && activeProduct && (
        <Overlay onClose={() => setShowEditModal(false)}>
          <ModalHeader title="Edit Product" subtitle={`Editing: ${activeProduct.product_name ?? activeProduct.name}`} onClose={() => setShowEditModal(false)} />
          <form onSubmit={submitEdit} style={{ padding: "20px 20px 24px" }}>
            {(activeProduct.images ?? []).length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={labelStyle}>Current Images</div>
                <p style={{ fontSize: 10, color: T.slate400, margin: "0 0 8px" }}>Click to mark for removal</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(72px,1fr))", gap: 8 }}>
                  {(activeProduct.images ?? []).map((img, i) => {
                    const src = `${BASE}/storage/${img.image_path}`;
                    const removed = removedImageIds.includes(img.image_id);
                    return (
                      <div key={img.id ?? i} onClick={() => toggleRemoveExisting(img.image_id)} style={{
                        position: "relative", borderRadius: T.radius.sm, overflow: "hidden",
                        aspectRatio: "1/1", cursor: "pointer",
                        border: removed ? `2px solid ${T.red500}` : i === 0 ? `2px solid ${T.blue600}` : `1px solid ${T.slate200}`,
                      }}>
                        <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: removed ? 0.3 : 1, transition: "opacity 0.2s" }} />
                        {i === 0 && !removed && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: T.blue600, color: "#fff", fontSize: 8, fontWeight: 700, textAlign: "center", padding: "1px 0" }}>MAIN</div>}
                        {removed && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🗑</div>}
                      </div>
                    );
                  })}
                </div>
                {removedImageIds.length > 0 && <p style={{ fontSize: 10, color: T.red500, marginTop: 6, marginBottom: 0 }}>{removedImageIds.length} image(s) marked for removal.</p>}
              </div>
            )}
            <ImageUploadZone id="editImgUpload" onchange={handleNewImages} previews={newPreviews} onRemove={removeNewImage} label="Add More Images" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <div style={labelStyle}>Product Name</div>
                <input name="product_name" value={editForm.product_name} onChange={handleEditChange} required style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <div style={labelStyle}>Category</div>
                <CategorySelect name="category_id" value={editForm.category_id} onChange={handleEditChange} disabled={categoriesLoading} categories={categories} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <div style={labelStyle}>Color <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: T.slate400 }}>(optional)</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {editColor && <ColorDot color={editColor} size={18} />}
                  <div style={{ flex: 1, position: "relative" }}>
                    <select value={editColor} onChange={e => setEditColor(e.target.value)} style={{ ...inputStyle, appearance: "none", paddingRight: 32, cursor: "pointer" }}>
                      <option value="">— No Color —</option>
                      {COLOR_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: T.slate400, fontSize: 10 }}>▾</span>
                  </div>
                </div>
              </div>
              <div>
                <div style={labelStyle}>Price (₱)</div>
                <input type="number" step="0.01" name="price" value={editForm.price} onChange={handleEditChange} required style={inputStyle} min="0" />
              </div>
              <div>
                <div style={labelStyle}>Acquired Price (₱)</div>
                <input type="number" step="0.01" name="acquired_price" value={editForm.acquired_price} onChange={handleEditChange} style={inputStyle} min="0" />
              </div>
              <div>
                <div style={labelStyle}>Unit</div>
                <input name="unit" placeholder="e.g. btl, gal, pcs" value={editForm.unit} onChange={handleEditChange} style={inputStyle} />
              </div>
              <div>
                <div style={labelStyle}>Size</div>
                <input name="size" placeholder="e.g. 500ml, 1L" value={editForm.size} onChange={handleEditChange} style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={labelStyle}>Description</div>
              <textarea name="description" value={editForm.description} onChange={handleEditChange} style={{ ...inputStyle, height: 80, resize: "vertical" }} />
            </div>
            <SaleToggle checked={editForm.isSale} onChange={handleEditChange} name="isSale" />
            <StatusToggle value={editForm.status} onChange={(val) => setEditForm(prev => ({ ...prev, status: val }))} />
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setShowEditModal(false)} style={{ ...btnBase, flex: 1, justifyContent: "center", background: "#fff", color: T.slate700, border: `1px solid ${T.slate200}`, padding: "10px 0" }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ ...btnBase, flex: 2, justifyContent: "center", padding: "10px 0", background: saving ? T.slate300 : T.blue600, color: "#fff", cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Saving…" : "💾 Save Changes"}
              </button>
            </div>
          </form>
        </Overlay>
      )}

      {/* ── Delete Confirm Modal ── */}
      {showDeleteModal && activeProduct && (
        <Overlay onClose={() => setShowDeleteModal(false)}>
          <div style={{ padding: "32px 24px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.red100, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 16px" }}>🗑️</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: T.slate900 }}>Delete Product?</h3>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: T.slate500, lineHeight: 1.6 }}>
              Are you sure you want to delete <strong>{activeProduct.product_name ?? activeProduct.name}</strong>?<br />This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowDeleteModal(false)} style={{ ...btnBase, flex: 1, justifyContent: "center", background: "#fff", color: T.slate700, border: `1px solid ${T.slate200}`, padding: "10px 0" }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{ ...btnBase, flex: 1, justifyContent: "center", padding: "10px 0", background: deleting ? "#FCA5A5" : T.red600, color: "#fff", cursor: deleting ? "not-allowed" : "pointer" }}>
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ── Main Content ── */}
      <main style={{ flex: 1, minWidth: 0, padding: "20px 20px", overflowX: "hidden" }}>

        {/* Top bar — matches Dashboard floating card style */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20, background: "#fff", borderRadius: T.radius.lg, padding: "12px 16px", border: `1px solid ${T.slate200}`, boxShadow: T.shadow.sm, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setSidebarOpen(true)} className="ap-hamburger" aria-label="Open menu" style={{
              background: "none", border: `1px solid ${T.slate200}`, borderRadius: T.radius.sm,
              width: 36, height: 36, alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, color: T.slate700,
            }}>☰</button>
            <div>
              <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.slate900, letterSpacing: "-0.3px" }}>List of Products</h1>
              <p style={{ margin: "1px 0 0", fontSize: 11, color: T.slate400 }}>Manage your product catalog</p>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {!deleteMode && (
              <>
                <button onClick={() => setShowExportModal(true)} style={{ ...btnBase, background: "#fff", color: T.slate700, border: `1px solid ${T.slate200}` }}>↑ Export</button>
                <button onClick={() => setShowImportModal(true)} style={{ ...btnBase, background: T.green50, color: T.green600, border: `1px solid ${T.green100}` }}>↓ Import</button>
                <button onClick={() => setShowAddModal(true)} style={{ ...btnBase, background: T.blue600, color: "#fff", boxShadow: "0 2px 8px rgba(37,99,235,0.25)" }}>+ Add Product</button>
              </>
            )}
            {!deleteMode ? (
              <button onClick={() => setDeleteMode(true)} style={{ ...btnBase, background: T.red50, color: T.red600, border: `1px solid ${T.red100}` }}>🗑 Bulk Delete</button>
            ) : (
              <button onClick={() => { setDeleteMode(false); setSelectedProducts([]); }} style={{ ...btnBase, background: "#fff", color: T.slate700, border: `1px solid ${T.slate200}` }}>✕ Cancel</button>
            )}
          </div>
        </div>

        {/* Stat Cards — matches Dashboard KPI card style with accent top bar */}
        <div className="ap-stats-grid">
          {[
            { label: "Total Products", value: productStats.total,    icon: "📦", accent: T.blue600,   bg: T.blue50,   border: T.blue100 },
            { label: "In Stock",       value: productStats.inStock,  icon: "✅", accent: T.green600,  bg: T.green50,  border: T.green100 },
            { label: "Pre-Order",      value: productStats.preOrder, icon: "🕒", accent: T.amber600,  bg: T.amber50,  border: T.amber100 },
          ].map((stat, i) => (
            <div key={stat.label} style={{
              background: "#fff", borderRadius: T.radius.lg, padding: "16px",
              border: `1px solid ${stat.border}`, boxShadow: T.shadow.sm,
              position: "relative", overflow: "hidden", transition: "all 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = T.shadow.hover; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = T.shadow.sm; }}
            >
              {/* Accent top bar */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: stat.accent, borderRadius: `${T.radius.lg}px ${T.radius.lg}px 0 0` }} />
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: T.slate400, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{stat.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: T.slate900, letterSpacing: "-0.5px", lineHeight: 1 }}>{stat.value}</div>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: T.radius.sm, background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bulk delete banner */}
        {deleteMode && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 16px", marginBottom: 14, background: T.red50, border: `1px solid ${T.red100}`, borderRadius: T.radius.md }}>
            <span style={{ fontSize: 13, color: T.red700, fontWeight: 600 }}>{selectedProducts.length} product(s) selected</span>
            <button onClick={handleBulkDelete} disabled={selectedProducts.length === 0 || deleting} style={{
              ...btnBase, background: T.red600, color: "#fff", padding: "8px 16px",
              opacity: selectedProducts.length === 0 || deleting ? 0.4 : 1,
              cursor: selectedProducts.length === 0 || deleting ? "not-allowed" : "pointer",
            }}>
              {deleting ? "Deleting…" : `Delete ${selectedProducts.length} Selected`}
            </button>
          </div>
        )}

        {/* Table card */}
        <div style={{ ...cardStyle }}>

          {/* Filter bar */}
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.slate100}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Search */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, border: `1px solid ${T.slate200}`, borderRadius: T.radius.sm, padding: "7px 12px", background: T.slate50 }}>
                <span style={{ color: T.slate400, fontSize: 13 }}>🔍</span>
                <input type="text" placeholder="Search products…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  style={{ flex: 1, fontSize: 12, color: T.slate700, background: "transparent", border: "none", outline: "none", fontFamily: T.font }} />
                {searchTerm && <button onClick={() => setSearchTerm("")} style={{ background: "none", border: "none", color: T.slate400, cursor: "pointer", fontSize: 12 }}>✕</button>}
              </div>

              {/* Desktop filters */}
              <div className="ap-filters-desktop">
                <div style={{ position: "relative" }}>
                  <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ ...inputStyle, appearance: "none", paddingRight: 28, cursor: "pointer", padding: "7px 28px 7px 12px", width: "auto" }}>
                    <option value="All">All Categories</option>
                    {categories.map(cat => { const label = cat.name ?? cat.category_name ?? cat.title ?? ""; return <option key={cat.id ?? cat.category_id} value={label}>{label}</option>; })}
                  </select>
                  <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: T.slate400, fontSize: 10 }}>▾</span>
                </div>
                <div style={{ position: "relative" }}>
                  <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={{ ...inputStyle, appearance: "none", paddingRight: 28, cursor: "pointer", padding: "7px 28px 7px 12px", width: "auto" }}>
                    <option value="A-Z">A–Z</option>
                    <option value="Z-A">Z–A</option>
                  </select>
                  <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: T.slate400, fontSize: 10 }}>▾</span>
                </div>
                <button onClick={() => { setSearchTerm(""); setSelectedCategory("All"); setSortOrder("A-Z"); }} style={{ ...btnBase, background: "#fff", color: T.slate600, border: `1px solid ${T.slate200}`, padding: "7px 12px", fontSize: 11 }}>✕ Clear</button>
              </div>

              {/* Mobile filter toggle */}
              <button className="ap-filter-toggle" onClick={() => setShowFilters(v => !v)} style={{ ...btnBase, background: T.slate50, color: T.slate700, border: `1px solid ${T.slate200}`, padding: "7px 12px", fontSize: 11 }}>
                ⚙ Filter
                {(selectedCategory !== "All" || sortOrder !== "A-Z") && <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.blue500, display: "inline-block", marginLeft: 4 }} />}
              </button>
            </div>

            {/* Mobile filter dropdown */}
            {showFilters && (
              <div className="ap-mobile-filters">
                <div style={{ position: "relative" }}>
                  <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ ...inputStyle, appearance: "none", paddingRight: 28, cursor: "pointer" }}>
                    <option value="All">All Categories</option>
                    {categories.map(cat => { const label = cat.name ?? cat.category_name ?? cat.title ?? ""; return <option key={cat.id ?? cat.category_id} value={label}>{label}</option>; })}
                  </select>
                  <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: T.slate400, fontSize: 10 }}>▾</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={{ ...inputStyle, appearance: "none", paddingRight: 28, cursor: "pointer" }}>
                      <option value="A-Z">Sort A–Z</option>
                      <option value="Z-A">Sort Z–A</option>
                    </select>
                    <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: T.slate400, fontSize: 10 }}>▾</span>
                  </div>
                  <button onClick={() => { setSearchTerm(""); setSelectedCategory("All"); setSortOrder("A-Z"); setShowFilters(false); }} style={{ ...btnBase, background: "#fff", color: T.slate700, border: `1px solid ${T.slate200}` }}>✕ Clear</button>
                </div>
              </div>
            )}
          </div>

          {/* Loading / empty */}
          {productsLoading ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: T.slate400 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⟳</div>
              <div style={{ fontSize: 13 }}>Loading products…</div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: T.slate400 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
              <div style={{ fontSize: 13 }}>No products found</div>
            </div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="ap-mobile-cards">
                {deleteMode && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 8, borderBottom: `1px solid ${T.slate100}` }}>
                    <input type="checkbox"
                      checked={paginated.length > 0 && paginated.every(p => selectedProducts.includes(p.product_id))}
                      onChange={() => {
                        const pageIds = paginated.map(p => p.product_id);
                        const allSelected = pageIds.every(id => selectedProducts.includes(id));
                        setSelectedProducts(prev => allSelected ? prev.filter(id => !pageIds.includes(id)) : [...new Set([...prev, ...pageIds])]);
                      }}
                      style={{ width: 15, height: 15, cursor: "pointer" }}
                    />
                    <span style={{ fontSize: 11, color: T.slate500 }}>Select all on this page</span>
                  </div>
                )}
                {paginated.map((product) => (
                  <ProductCard
                    key={product.product_id}
                    product={product}
                    deleteMode={deleteMode}
                    isSelected={selectedProducts.includes(product.product_id)}
                    onSelect={toggleSelect}
                    onView={() => openView(product)}
                    onEdit={() => openEdit(product)}
                    onDelete={() => openDelete(product)}
                    BASE={BASE} resolveCat={resolveCat} getStatus={getStatus}
                  />
                ))}
              </div>

              {/* Desktop table */}
              <div className="ap-desktop-table">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.slate50, borderBottom: `1px solid ${T.slate200}` }}>
                      {deleteMode && (
                        <th style={{ width: 40, padding: "10px 12px" }}>
                          <input type="checkbox"
                            checked={paginated.length > 0 && paginated.every(p => selectedProducts.includes(p.product_id))}
                            onChange={() => {
                              const pageIds = paginated.map(p => p.product_id);
                              const allSelected = pageIds.every(id => selectedProducts.includes(id));
                              setSelectedProducts(prev => allSelected ? prev.filter(id => !pageIds.includes(id)) : [...new Set([...prev, ...pageIds])]);
                            }}
                            style={{ width: 15, height: 15, cursor: "pointer" }}
                          />
                        </th>
                      )}
                      {["Product", "Category", "Color", "Size", "Unit", "Status", "Price", "Actions"].map(h => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: h === "Price" ? "right" : h === "Actions" ? "center" : "left", fontWeight: 600, fontSize: 10, color: T.slate500, textTransform: "uppercase", letterSpacing: "0.4px", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((product, index) => {
                      const name = product.product_name ?? product.name ?? "—";
                      const category = resolveCat(product.category, product.category_name);
                      const color = product.color ?? "";
                      const size = product.size ?? "—";
                      const unit = product.unit ?? "—";
                      const price = parseFloat(product.price ?? 0);
                      const status = getStatus(product.status);
                      const thumb = product.images?.[0]?.image_path ? `${BASE}/storage/${product.images[0].image_path}` : null;
                      const isSelected = selectedProducts.includes(product.product_id);

                      return (
                        <tr key={product.product_id ?? index} className="tbl-row" style={{
                          borderBottom: `1px solid ${T.slate50}`,
                          background: isSelected ? T.blue50 : index % 2 === 0 ? "#fff" : T.slate50 + "60",
                          transition: "background 0.1s",
                        }}>
                          {deleteMode && (
                            <td style={{ padding: "10px 12px" }}>
                              <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(product.product_id)} style={{ width: 15, height: 15, cursor: "pointer" }} />
                            </td>
                          )}
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: T.radius.sm, background: T.slate100, border: `1px solid ${T.slate200}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, overflow: "hidden" }}>
                                {thumb ? <img src={thumb} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "📄"}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: T.slate800, whiteSpace: "nowrap", fontSize: 12 }}>{name}</div>
                                {product.isSale == 1 && <SaleBadge />}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "10px 12px", color: T.slate500, fontSize: 11 }}>{category}</td>
                          <td style={{ padding: "10px 12px" }}>
                            {color ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <ColorDot color={color} size={12} />
                                <span style={{ fontSize: 11, color: T.slate600 }}>{color}</span>
                              </div>
                            ) : <span style={{ color: T.slate300, fontSize: 11 }}>—</span>}
                          </td>
                          <td style={{ padding: "10px 12px", color: T.slate500, fontSize: 11 }}>{size}</td>
                          <td style={{ padding: "10px 12px", color: T.slate500, fontSize: 11 }}>{unit}</td>
                          <td style={{ padding: "10px 12px" }}><StatusBadge status={status} /></td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: T.slate800, fontSize: 12 }}>₱{price.toFixed(2)}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                              {[
                                { label: "👁 View", onClick: () => openView(product), bg: T.blue50, color: T.blue600, border: T.blue100 },
                                { label: "✏️ Edit", onClick: () => openEdit(product), bg: "#fff", color: T.slate700, border: T.slate200 },
                                { label: "🗑", onClick: () => openDelete(product), bg: T.red50, color: T.red600, border: T.red100 },
                              ].map(btn => (
                                <button key={btn.label} onClick={btn.onClick} style={{
                                  padding: "4px 8px", borderRadius: T.radius.sm, fontSize: 10, fontWeight: 600,
                                  background: btn.bg, color: btn.color, border: `1px solid ${btn.border}`,
                                  cursor: "pointer", fontFamily: T.font, transition: "opacity 0.12s",
                                }}
                                  onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
                                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                                >
                                  {btn.label}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pagination */}
          {!productsLoading && filteredProducts.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: `1px solid ${T.slate100}`, flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 11, color: T.slate400 }}>
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{
                  width: 28, height: 28, borderRadius: T.radius.sm, border: `1px solid ${T.slate200}`,
                  background: "#fff", color: T.slate700, fontSize: 12, cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", opacity: currentPage === 1 ? 0.4 : 1,
                }}>‹</button>
                {pageNumbers.map(p => (
                  <button key={p} onClick={() => setCurrentPage(p)} style={{
                    width: 28, height: 28, borderRadius: T.radius.sm, fontSize: 11, fontWeight: p === currentPage ? 700 : 500,
                    background: p === currentPage ? T.blue600 : "#fff",
                    color: p === currentPage ? "#fff" : T.slate700,
                    border: p === currentPage ? "none" : `1px solid ${T.slate200}`,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.12s",
                  }}>{p}</button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{
                  width: 28, height: 28, borderRadius: T.radius.sm, border: `1px solid ${T.slate200}`,
                  background: "#fff", color: T.slate700, fontSize: 12, cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", opacity: currentPage === totalPages ? 0.4 : 1,
                }}>›</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminProducts;