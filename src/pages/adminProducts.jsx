import { useEffect, useState, useMemo, useRef } from "react";
import AdminNav from '../components/AdminNav';
import axios from "axios";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.mjs";

const BASE = "http://127.0.0.1:8000";
const ITEMS_PER_PAGE = 20;

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
  return raw
    .split(/\s+or\s+|\s*[,/]\s*/i)
    .map(c => normalizeColor(c.trim()))
    .filter(Boolean);
};

// ────────────────────────────────────────────────────────────
// Reusable UI components
// ────────────────────────────────────────────────────────────
const Overlay = ({ children, onClose, wide, extraWide }) => (
  <div
    onClick={onClose}
    className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm flex items-center justify-center z-[1000] p-3 sm:p-4"
  >
    <div
      onClick={e => e.stopPropagation()}
      className={`bg-white w-full ${extraWide ? "max-w-6xl" : wide ? "max-w-3xl" : "max-w-[560px]"} rounded-2xl shadow-2xl max-h-[94vh] overflow-y-auto`}
    >
      {children}
    </div>
  </div>
);

const ModalHeader = ({ title, subtitle, onClose }) => (
  <div className="sticky top-0 z-10 flex items-center justify-between px-4 pt-4 pb-3 bg-white border-b sm:px-6 sm:pt-5 sm:pb-4 border-slate-100 rounded-t-2xl">
    <div className="flex-1 min-w-0 pr-3">
      <h2 className="m-0 text-[15px] sm:text-[17px] font-bold text-slate-900 truncate">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-slate-400 truncate">{subtitle}</p>}
    </div>
    <button
      onClick={onClose}
      className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-lg leading-none transition-colors border rounded-lg cursor-pointer border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
    >
      ×
    </button>
  </div>
);

const ImageUploadZone = ({ id, onchange, previews, onRemove, label }) => (
  <div className="mb-5">
    <label className="block text-[11px] font-semibold text-gray-700 mb-2 uppercase tracking-wide">
      {label ?? "Product Images"}
    </label>
    <label
      htmlFor={id}
      className="block p-4 mb-0 text-center transition-colors border-2 border-dashed cursor-pointer border-slate-300 rounded-xl bg-slate-50 hover:border-blue-600"
    >
      <div className="mb-1 text-2xl">🖼️</div>
      <div className="text-[13px] font-semibold text-gray-700">Click to upload images</div>
      <div className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WEBP — multiple allowed</div>
      <input id={id} type="file" multiple accept="image/*" onChange={onchange} className="hidden" />
    </label>
    {previews.length > 0 && (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2 mt-2.5">
        {previews.map((src, i) => (
          <div
            key={i}
            className={`relative rounded-lg overflow-hidden aspect-square bg-slate-100 ${
              i === 0 ? "border-2 border-blue-600" : "border border-slate-200"
            }`}
          >
            <img src={src} alt={`preview-${i}`} className="block object-cover w-full h-full" />
            {i === 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-[9px] font-bold text-center py-0.5">
                MAIN
              </div>
            )}
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute top-1 right-1 w-[18px] h-[18px] rounded-full bg-black/55 text-white border-none text-[11px] cursor-pointer flex items-center justify-center"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);

const CategorySelect = ({ name, value, onChange, disabled, categories }) => (
  <div className="relative">
    <select
      name={name}
      value={value}
      onChange={onChange}
      required
      disabled={disabled}
      className={`w-full px-[11px] py-[9px] border border-slate-200 rounded-lg text-[13px] outline-none box-border font-[inherit] appearance-none pr-8
        ${disabled ? "bg-slate-50 cursor-not-allowed text-gray-400" : "bg-white cursor-pointer"}
        ${value ? "text-slate-900" : "text-gray-400"}
      `}
    >
      <option value="" disabled>{disabled ? "Loading…" : "Select a category"}</option>
      {categories.map(cat => (
        <option key={cat.id ?? cat.category_id} value={cat.id ?? cat.category_id}>
          {cat.name ?? cat.category_name ?? cat.title}
        </option>
      ))}
    </select>
    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[11px]">
      {disabled ? "⟳" : "▾"}
    </div>
  </div>
);

const StatusToggle = ({ value, onChange }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-3 mb-5">
    <div>
      <div className="text-[13px] font-semibold text-gray-700">Availability Status</div>
      <div className="text-[11px] text-slate-400">Set whether this product is In Stock or Pre-Order</div>
    </div>
    <div className="flex flex-shrink-0 gap-2">
      <button
        type="button"
        onClick={() => onChange("in_stock")}
        className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-colors cursor-pointer
          ${value === "in_stock"
            ? "bg-emerald-600 text-white border-emerald-600"
            : "bg-white text-slate-500 border-slate-200 hover:border-emerald-400"}`}
      >
        ✅ In Stock
      </button>
      <button
        type="button"
        onClick={() => onChange("pre_order")}
        className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-colors cursor-pointer
          ${value === "pre_order"
            ? "bg-amber-500 text-white border-amber-500"
            : "bg-white text-slate-500 border-slate-200 hover:border-amber-400"}`}
      >
        🕒 Pre-Order
      </button>
    </div>
  </div>
);

const SaleToggle = ({ checked, onChange, name }) => (
  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-3 mb-5">
    <div>
      <div className="text-[13px] font-semibold text-gray-700">Mark as On Sale</div>
      <div className="text-[11px] text-slate-400">Show a sale badge on this product</div>
    </div>
    <label className="relative inline-block w-10 h-[22px] cursor-pointer flex-shrink-0">
      <input type="checkbox" name={name} checked={checked} onChange={onChange} className="absolute w-0 h-0 opacity-0" />
      <div className={`absolute inset-0 rounded-[11px] transition-colors duration-200 ${checked ? "bg-blue-600" : "bg-slate-300"}`} />
      <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all duration-200 shadow ${checked ? "left-[21px]" : "left-[3px]"}`} />
    </label>
  </div>
);

const ColorDot = ({ color, size = "w-3 h-3" }) => {
  const dot = COLOR_DOT_MAP[color] || "#e2e8f0";
  const isGrad = dot.startsWith("linear");
  return (
    <span
      className={`inline-block ${size} rounded-full border border-slate-300 flex-shrink-0`}
      style={isGrad ? { background: dot } : { backgroundColor: dot }}
    />
  );
};

// ────────────────────────────────────────────────────────────
// Color Variants Editor
// ────────────────────────────────────────────────────────────
const ColorVariantsEditor = ({ variants, onChange }) => {
  const addVariant = () => onChange([...variants, { color: "", stocks: 0 }]);
  const removeVariant = (i) => onChange(variants.filter((_, idx) => idx !== i));
  const updateVariant = (i, field, value) => {
    const next = variants.map((v, idx) => idx === i ? { ...v, [field]: value } : v);
    onChange(next);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide">
          Color Variants & Stocks
        </label>
        <button
          type="button"
          onClick={addVariant}
          className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white text-[11px] font-semibold rounded-lg cursor-pointer hover:bg-blue-700 transition-colors border-none"
        >
          + Add Color
        </button>
      </div>
      {variants.length === 0 && (
        <div className="text-center py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-[12px]">
          No color variants — product will have no color assigned.
          <br />
          <button type="button" onClick={addVariant} className="mt-1.5 text-blue-500 underline cursor-pointer bg-transparent border-none text-[12px]">
            + Add first color variant
          </button>
        </div>
      )}
      <div className="flex flex-col gap-2">
        {variants.map((v, i) => (
          <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
            {v.color ? <ColorDot color={v.color} size="w-5 h-5" /> : <span className="flex-shrink-0 w-5 h-5 border-2 border-dashed rounded-full border-slate-300" />}
            <div className="relative flex-1">
              <select value={v.color} onChange={e => updateVariant(i, "color", e.target.value)}
                className="w-full px-2.5 py-[7px] border border-slate-200 rounded-lg text-[12px] bg-white outline-none appearance-none cursor-pointer pr-6">
                <option value="">— No Color —</option>
                {COLOR_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[9px]">▾</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap hidden sm:inline">Stocks:</span>
              <input type="number" min="0" value={v.stocks}
                onChange={e => updateVariant(i, "stocks", parseInt(e.target.value) || 0)}
                className="w-16 sm:w-20 px-2 py-[7px] border border-slate-200 rounded-lg text-[12px] text-slate-900 bg-white outline-none text-center focus:border-blue-400 transition-colors" />
            </div>
            <button type="button" onClick={() => removeVariant(i)}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 border border-red-200 text-red-500 cursor-pointer hover:bg-red-100 transition-colors text-[13px] shrink-0">
              ×
            </button>
          </div>
        ))}
      </div>
      {variants.length > 0 && (
        <p className="text-[11px] text-slate-400 mt-2 mb-0">
          {variants.length} color variant{variants.length > 1 ? "s" : ""} — each will be saved as a separate product entry.
        </p>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Export Modal
// ────────────────────────────────────────────────────────────
const ExportModal = ({ onClose, products, categories }) => {
  const [format, setFormat] = useState(null);
  const [exporting, setExporting] = useState(false);

  const resolveCat = (raw, fallback) =>
    typeof raw === "object" && raw !== null
      ? (raw.name ?? raw.category_name ?? fallback ?? "—")
      : (raw ?? fallback ?? "—");

  const getStatus = (status) =>
    status === "pre_order" || status === "Pre-Order" ? "Pre-Order" : "In Stock";

  const buildRows = () =>
    products.map((p, i) => ({
      "#": i + 1,
      "Product Name": p.product_name ?? p.name ?? "—",
      "Category":     resolveCat(p.category, p.category_name),
      "Color":        p.color || "—",
      "Size":         p.size || "—",
      "Unit":         p.unit || "—",
      "Status":       getStatus(p.status),
      "On Sale":      p.isSale == 1 ? "Yes" : "No",
      "Price (PHP)":  parseFloat(p.price ?? 0).toFixed(2),
      "Acq. Price (PHP)": parseFloat(p.acquired_price ?? 0).toFixed(2),
    }));

  const exportExcel = () => {
    setExporting(true);
    try {
      const rows = buildRows();
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [
        { wch: 6 }, { wch: 36 }, { wch: 20 }, { wch: 12 },
        { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 8 },
        { wch: 14 }, { wch: 16 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Products");
      XLSX.writeFile(wb, `products_export_${Date.now()}.xlsx`);
    } catch (err) {
      console.error(err);
      alert("Export failed: " + err.message);
    } finally {
      setExporting(false);
      onClose();
    }
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      if (!window.jspdf) {
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      if (!window.jspdf?.jsPDF?.prototype?.autoTable) {
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("List of Products", 14, 16);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`Exported: ${new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}`, 14, 22);
      doc.text(`Total: ${products.length} product(s)`, 14, 27);
      const rows = buildRows();
      const columns = Object.keys(rows[0] || {});
      doc.autoTable({
        startY: 32,
        head: [columns],
        body: rows.map(r => columns.map(c => r[c])),
        styles: { fontSize: 8, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 }, lineColor: [226, 232, 240], lineWidth: 0.3, font: "helvetica", textColor: [30, 41, 59] },
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 14, halign: "center" },
          1: { cellWidth: 70 },
          2: { cellWidth: 38 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 15 },
          6: { cellWidth: 22 },
          7: { cellWidth: 16, halign: "center" },
          8: { cellWidth: 30, halign: "right" },
          9: { cellWidth: 30, halign: "right" },
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 6) {
            if (data.cell.raw === "In Stock") { data.cell.styles.textColor = [5, 150, 105]; data.cell.styles.fontStyle = "bold"; }
            else if (data.cell.raw === "Pre-Order") { data.cell.styles.textColor = [217, 119, 6]; data.cell.styles.fontStyle = "bold"; }
          }
          if (data.section === "body" && data.column.index === 7 && data.cell.raw === "Yes") {
            data.cell.styles.textColor = [180, 83, 9]; data.cell.styles.fontStyle = "bold";
          }
        },
        margin: { left: 14, right: 14 },
        tableLineColor: [203, 213, 225],
        tableLineWidth: 0.3,
      });
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 8, { align: "right" });
      }
      doc.save(`products_export_${Date.now()}.pdf`);
    } catch (err) {
      console.error(err);
      alert("PDF export failed: " + err.message);
    } finally {
      setExporting(false);
      onClose();
    }
  };

  const handleExport = () => {
    if (format === "excel") exportExcel();
    else if (format === "pdf") exportPDF();
  };

  return (
    <Overlay onClose={onClose}>
      <ModalHeader title="Export Products" subtitle={`${products.length} product(s) will be exported`} onClose={onClose} />
      <div className="px-4 pt-5 pb-6 sm:px-6">
        <p className="text-[13px] text-slate-500 mb-4">Choose a format to export your current product list:</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button type="button" onClick={() => setFormat("excel")}
            className={`flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all text-left
              ${format === "excel" ? "border-emerald-500 bg-emerald-50 shadow-sm" : "border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/40"}`}>
            <div className="text-3xl sm:text-4xl">📊</div>
            <div>
              <div className={`text-[13px] sm:text-[14px] font-bold mb-0.5 ${format === "excel" ? "text-emerald-700" : "text-slate-800"}`}>Excel (.xlsx)</div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed hidden sm:block">Spreadsheet format. Best for editing, filtering, and further data work.</div>
            </div>
            {format === "excel" && <div className="self-start mt-auto px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">✓ Selected</div>}
          </button>
          <button type="button" onClick={() => setFormat("pdf")}
            className={`flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all text-left
              ${format === "pdf" ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40"}`}>
            <div className="text-3xl sm:text-4xl">📄</div>
            <div>
              <div className={`text-[13px] sm:text-[14px] font-bold mb-0.5 ${format === "pdf" ? "text-blue-700" : "text-slate-800"}`}>PDF (.pdf)</div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed hidden sm:block">Printable grid layout with all product details. Great for reports and sharing.</div>
            </div>
            {format === "pdf" && <div className="self-start mt-auto px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold">✓ Selected</div>}
          </button>
        </div>
        {format && (
          <div className="mb-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Columns included in export:</div>
            <div className="flex flex-wrap gap-1.5">
              {["#", "Product Name", "Category", "Color", "Size", "Unit", "Status", "On Sale", "Price (PHP)", "Acq. Price (PHP)"].map(col => (
                <span key={col} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[11px] text-slate-600 font-medium">{col}</span>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2.5">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-lg bg-white text-gray-700 text-[13px] font-semibold cursor-pointer hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleExport} disabled={!format || exporting}
            className={`flex-[2] py-2.5 border-none rounded-lg text-white text-[13px] font-bold transition-colors
              ${!format || exporting ? "bg-slate-300 cursor-not-allowed" : format === "pdf" ? "bg-blue-600 cursor-pointer hover:bg-blue-700" : "bg-emerald-600 cursor-pointer hover:bg-emerald-700"}`}>
            {exporting ? "Exporting…" : !format ? "Select a format first" : format === "pdf" ? "⬇ Download PDF" : "⬇ Download Excel"}
          </button>
        </div>
      </div>
    </Overlay>
  );
};

// ────────────────────────────────────────────────────────────
// Import Modal
// ────────────────────────────────────────────────────────────
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
      const row = json[i];
      if (row.some(cell => String(cell).toLowerCase().includes("item description"))) {
        headerIdx = i; break;
      }
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

    const nameCol          = colIdx("item description", "product name", "name", "item");
    const sizeColorCol     = colIdx("size_color", "size/color", "size color");
    const unitCol          = colIdx("unit");
    const acquiredPriceCol = colIdx("acquired", "cost", "buying", "acquired pri");
    const sellingPriceCol  = colIdx("selling", "price", "selling p");
    const sizeCol          = colIdx("size");
    const colorCol         = colIdx("color");

    const rows = [];
    let keyIdx = 0;
    const colorWords = ["black", "white", "red", "blue", "green", "yellow", "orange", "purple", "pink", "gray", "brown", "beige", "maroon", "navy", "teal", "cyan", "magenta", "gold", "silver"];

    for (let i = headerIdx + 1; i < json.length; i++) {
      const row = json[i];
      const name = nameCol !== -1 ? String(row[nameCol] ?? "").trim() : "";
      if (!name) continue;

      let size     = sizeCol   !== -1 ? String(row[sizeCol]   ?? "").trim() : "";
      let colorRaw = colorCol  !== -1 ? String(row[colorCol]  ?? "").trim() : "";
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
          const possiblePrice = parseFloat(parts[0]);
          if (!isNaN(possiblePrice)) { acquiredPrice = possiblePrice; if (!size && parts[1]) size = parts[1]; }
          else acquiredPrice = parseFloat(val) || "";
        } else acquiredPrice = parseFloat(val) || "";
      }

      let sellingPrice = "";
      if (sellingPriceCol !== -1) {
        const val = row[sellingPriceCol];
        if (typeof val === "string" && val.includes(" ")) {
          const parts = val.trim().split(/\s+/);
          const possiblePrice = parseFloat(parts[0]);
          if (!isNaN(possiblePrice)) { sellingPrice = possiblePrice; if (!size && parts[1]) size = parts[1]; }
          else sellingPrice = parseFloat(val) || "";
        } else sellingPrice = parseFloat(val) || "";
      }

      const unit = unitCol !== -1 ? String(row[unitCol] ?? "").trim() : "";
      const colorList = splitColors(colorRaw);

      if (colorList.length > 1) {
        for (const c of colorList) {
          rows.push({ _key: `row_${keyIdx++}`, product_name: name, size, color: c, unit, acquired_price: acquiredPrice, price: sellingPrice, category_id: "", description: "", isSale: false });
        }
      } else {
        rows.push({ _key: `row_${keyIdx++}`, product_name: name, size, color: colorList[0] || "", unit, acquired_price: acquiredPrice, price: sellingPrice, category_id: "", description: "", isSale: false });
      }
    }
    return rows;
  };

  const handleFile = async (file) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls") && !name.endsWith(".csv")) {
      alert("Please upload an Excel file (.xlsx, .xls, .csv)"); return;
    }
    try {
      const rows = await parseExcel(file);
      if (!rows.length) { alert("No product rows found in the file."); return; }
      setEditableRows(rows);
      setStep("preview");
    } catch (err) {
      console.error(err);
      alert("Failed to parse file: " + err.message);
    }
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };

  const updateRow = (idx, field, value) => {
    setEditableRows(prev => { const next = [...prev]; next[idx] = { ...next[idx], [field]: value }; return next; });
  };
  const duplicateRow = (idx) => {
    setEditableRows(prev => {
      const next = [...prev];
      next.splice(idx + 1, 0, { ...next[idx], _key: `row_dup_${Date.now()}_${idx}`, color: "", stocks: 0 });
      return next;
    });
  };
  const removeRow = (idx) => setEditableRows(prev => prev.filter((_, i) => i !== idx));

  const applyDefaultCategory = () => {
    if (!defaultCategoryId) return;
    setEditableRows(prev => prev.map(r => ({ ...r, category_id: r.category_id || defaultCategoryId })));
  };

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

    setImporting(true);
    setStep("importing");
    setProgress({ done: 0, total: toImport.length });
    const res = { created: 0, failed: 0, errors: [] };

    for (let i = 0; i < toImport.length; i++) {
      const row = toImport[i];
      try {
        const fd = new FormData();
        fd.append("product_name", row.product_name);
        fd.append("category_id", row.category_id);
        fd.append("product_stocks", 0);
        fd.append("price", row.price || 0);
        fd.append("acquired_price", row.acquired_price || 0);
        fd.append("unit", row.unit || "");
        fd.append("size", row.size || "");
        fd.append("description", row.description || "");
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

    setResults(res);
    setStep("done");
    setImporting(false);
    onImportSuccess();
  };

  const duplicateCount  = editableRows.filter(r => r.product_name && isDuplicate(r)).length;
  const importableCount = editableRows.filter(r => r.product_name && !isDuplicate(r)).length;

  return (
    <Overlay extraWide onClose={onClose}>
      <ModalHeader
        title="Import Products"
        subtitle={
          step === "upload"    ? "Upload an Excel file to bulk-import products" :
          step === "preview"   ? `${editableRows.length} row(s) found — review before importing` :
          step === "importing" ? "Importing products…" : "Import complete"
        }
        onClose={onClose}
      />
      <div className="px-4 pt-5 pb-6 sm:px-6">

        {step === "upload" && (
          <div>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-colors mb-5
                ${dragOver ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50 hover:border-blue-400"}`}
            >
              <div className="mb-3 text-4xl sm:text-5xl">📊</div>
              <div className="text-[14px] sm:text-[15px] font-bold text-slate-800 mb-1">Drop your Excel file here</div>
              <div className="text-[11px] sm:text-[12px] text-slate-400">or click to browse — supports .xlsx, .xls, .csv</div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-[12px] text-blue-700">
              <div className="font-bold mb-1.5">📋 Expected columns:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                {[
                  ["ITEM DESCRIPTION", "→ Product Name (required)"],
                  ["SIZE_COLOR / SIZE", "→ Size field"],
                  ["COLOR",            "→ Optional — auto-split 'Black Or White' → 2 rows"],
                  ["UNIT",             "→ Unit (btl, gal, pcs, etc.)"],
                  ["ACQUIRED PRICE",   "→ Cost price"],
                  ["SELLING PRICE",    "→ Selling price"],
                ].map(([col, desc]) => (
                  <div key={col} className="flex flex-wrap gap-1">
                    <span className="font-mono bg-white border border-blue-100 rounded px-1 text-[11px] shrink-0">{col}</span>
                    <span className="text-blue-500">{desc}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-blue-500">✅ Products without color are imported as-is</div>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div>
            <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-[8px] bg-slate-50 mb-3">
              <span className="text-slate-400">🔍</span>
              <input type="text" placeholder="Search products in this import…" value={importSearch}
                onChange={e => setImportSearch(e.target.value)}
                className="flex-1 text-[13px] text-gray-700 bg-transparent border-none outline-none" />
              {importSearch && (
                <button onClick={() => setImportSearch("")} className="text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent text-[13px] px-1">✕</button>
              )}
            </div>
            <div className="flex flex-col items-stretch gap-2 p-3 mb-4 border sm:flex-row sm:items-end bg-amber-50 border-amber-200 rounded-xl">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-amber-800 mb-1 uppercase tracking-wide">Apply default category to unassigned rows</label>
                <select value={defaultCategoryId} onChange={e => setDefaultCategoryId(e.target.value)}
                  className="w-full px-[10px] py-[8px] border border-amber-200 rounded-lg text-[13px] bg-white outline-none appearance-none cursor-pointer">
                  <option value="">Select category…</option>
                  {categories.map(cat => (
                    <option key={cat.id ?? cat.category_id} value={cat.id ?? cat.category_id}>
                      {cat.name ?? cat.category_name ?? cat.title}
                    </option>
                  ))}
                </select>
              </div>
              <button onClick={applyDefaultCategory} disabled={!defaultCategoryId}
                className="px-4 py-[9px] rounded-lg bg-amber-500 text-white text-[13px] font-semibold cursor-pointer hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
                Apply to All
              </button>
            </div>
            {duplicateCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2.5 mb-3 bg-orange-50 border border-orange-200 rounded-xl text-[12px] text-orange-700">
                <span className="text-base">⚠️</span>
                <span><strong>{duplicateCount}</strong> row(s) already exist and will be <strong>skipped</strong>.</span>
              </div>
            )}

            {/* Mobile card view for import preview */}
            <div className="block sm:hidden max-h-[45vh] overflow-y-auto mb-4 space-y-2">
              {displayedRows.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-[13px]">No products match your search</div>
              )}
              {displayedRows.map((row) => {
                const idx = row._origIdx;
                const dup = isDuplicate(row);
                return (
                  <div key={row._key} className={`rounded-xl border p-3 ${dup ? "bg-orange-50 border-orange-200 opacity-70" : "bg-white border-slate-200"}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <input value={row.product_name} onChange={e => updateRow(idx, "product_name", e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-slate-200 rounded-md text-[12px] bg-white outline-none focus:border-blue-400 font-medium" />
                      {dup && <span title="Already exists" className="text-orange-400 text-[14px] shrink-0">⚠</span>}
                      <div className="flex gap-1 shrink-0">
                        <button type="button" onClick={() => duplicateRow(idx)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 border border-blue-200 text-blue-600 text-[15px] font-bold cursor-pointer hover:bg-blue-100">+</button>
                        <button type="button" onClick={() => removeRow(idx)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 border border-red-200 text-red-500 text-[13px] cursor-pointer hover:bg-red-100">×</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <div className="text-[10px] text-slate-400 mb-1">Color</div>
                        <div className="flex items-center gap-1">
                          {row.color && <ColorDot color={row.color} size="w-3 h-3" />}
                          <select value={row.color || ""} onChange={e => updateRow(idx, "color", e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-[11px] bg-white outline-none appearance-none cursor-pointer">
                            <option value="">No Color</option>
                            {COLOR_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 mb-1">Category *</div>
                        <select value={row.category_id} onChange={e => updateRow(idx, "category_id", e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded-md text-[11px] outline-none appearance-none cursor-pointer ${!row.category_id ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}>
                          <option value="">-- select --</option>
                          {categories.map(cat => (
                            <option key={cat.id ?? cat.category_id} value={cat.id ?? cat.category_id}>
                              {cat.name ?? cat.category_name ?? cat.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 mb-1">Size</div>
                        <input value={row.size} onChange={e => updateRow(idx, "size", e.target.value)} placeholder="e.g. 500ml"
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-[11px] bg-white outline-none focus:border-blue-400" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 mb-1">Unit</div>
                        <input value={row.unit} onChange={e => updateRow(idx, "unit", e.target.value)} placeholder="btl/pc"
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-[11px] bg-white outline-none focus:border-blue-400" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 mb-1">Price ₱</div>
                        <input type="number" step="0.01" value={row.price} onChange={e => updateRow(idx, "price", e.target.value)} placeholder="0.00"
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-[11px] bg-white outline-none text-right focus:border-blue-400" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 mb-1">Acq. ₱</div>
                        <input type="number" step="0.01" value={row.acquired_price} onChange={e => updateRow(idx, "acquired_price", e.target.value)} placeholder="0.00"
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-[11px] bg-white outline-none text-right focus:border-blue-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table view */}
            <div className="hidden sm:block max-h-[48vh] overflow-y-auto pr-1 mb-4">
              <table className="w-full text-[12px] border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-100 text-slate-600">
                    <th className="p-2 font-semibold text-left">Product Name</th>
                    <th className="w-24 p-2 font-semibold text-left">Color</th>
                    <th className="w-24 p-2 font-semibold text-left">Size</th>
                    <th className="w-20 p-2 font-semibold text-left">Unit</th>
                    <th className="w-24 p-2 font-semibold text-right">Price ₱</th>
                    <th className="w-24 p-2 font-semibold text-right">Acq. ₱</th>
                    <th className="p-2 font-semibold text-left w-36">Category *</th>
                    <th className="w-16 p-2 font-semibold text-center rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.length === 0 && (
                    <tr><td colSpan={8} className="py-8 text-center text-slate-400">No products match your search</td></tr>
                  )}
                  {displayedRows.map((row) => {
                    const idx = row._origIdx;
                    const dup = isDuplicate(row);
                    return (
                      <tr key={row._key} className={`border-b border-slate-100 transition-opacity ${dup ? "bg-orange-50 opacity-70" : "bg-white hover:bg-blue-50/30"}`}>
                        <td className="p-1.5">
                          <div className="flex items-center gap-1.5">
                            <input value={row.product_name} onChange={e => updateRow(idx, "product_name", e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-[12px] bg-white outline-none focus:border-blue-400" />
                            {dup && <span title="Already exists" className="text-orange-400 text-[14px] shrink-0 cursor-default">⚠</span>}
                          </div>
                        </td>
                        <td className="p-1.5">
                          <div className="flex items-center gap-1.5">
                            {row.color && <ColorDot color={row.color} size="w-3 h-3" />}
                            <div className="relative flex-1">
                              <select value={row.color || ""} onChange={e => updateRow(idx, "color", e.target.value)}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-[12px] bg-white outline-none appearance-none cursor-pointer pr-6">
                                <option value="">No Color</option>
                                {COLOR_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[9px]">▾</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-1.5">
                          <input value={row.size} onChange={e => updateRow(idx, "size", e.target.value)} placeholder="e.g. 500ml"
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-[12px] bg-white outline-none focus:border-blue-400" />
                        </td>
                        <td className="p-1.5">
                          <input value={row.unit} onChange={e => updateRow(idx, "unit", e.target.value)} placeholder="btl/pc"
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-[12px] bg-white outline-none focus:border-blue-400" />
                        </td>
                        <td className="p-1.5">
                          <input type="number" step="0.01" value={row.price} onChange={e => updateRow(idx, "price", e.target.value)} placeholder="0.00"
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-[12px] bg-white outline-none text-right focus:border-blue-400" />
                        </td>
                        <td className="p-1.5">
                          <input type="number" step="0.01" value={row.acquired_price} onChange={e => updateRow(idx, "acquired_price", e.target.value)} placeholder="0.00"
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-[12px] bg-white outline-none text-right focus:border-blue-400" />
                        </td>
                        <td className="p-1.5">
                          <select value={row.category_id} onChange={e => updateRow(idx, "category_id", e.target.value)}
                            className={`w-full px-2 py-1.5 border rounded-md text-[12px] outline-none appearance-none cursor-pointer ${!row.category_id ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}>
                            <option value="">-- select --</option>
                            {categories.map(cat => (
                              <option key={cat.id ?? cat.category_id} value={cat.id ?? cat.category_id}>
                                {cat.name ?? cat.category_name ?? cat.title}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-1.5">
                          <div className="flex items-center justify-center gap-1">
                            <button type="button" onClick={() => duplicateRow(idx)} title="Add color variant"
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 border border-blue-200 text-blue-600 text-[15px] font-bold cursor-pointer hover:bg-blue-100 transition-colors shrink-0 leading-none">+</button>
                            <button type="button" onClick={() => removeRow(idx)} title="Remove row"
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 border border-red-200 text-red-500 text-[13px] cursor-pointer hover:bg-red-100 transition-colors shrink-0">×</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[12px] text-slate-400 mb-4 gap-1">
              <span>{importSearch ? `Showing ${displayedRows.length} of ${editableRows.length} rows` : `${importableCount} of ${editableRows.length} rows will be imported`}</span>
              <div className="flex flex-wrap items-center gap-3">
                {duplicateCount > 0 && <span className="text-orange-400">{duplicateCount} duplicate(s) will be skipped</span>}
                <span className="text-red-400">{editableRows.filter(r => !r.category_id && !isDuplicate(r)).length} row(s) missing category</span>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => setStep("upload")}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg bg-white text-gray-700 text-[13px] font-semibold cursor-pointer hover:bg-slate-50 transition-colors">
                ← Back
              </button>
              <button onClick={handleImport} disabled={importing || importableCount === 0}
                className="flex-[2] py-2.5 border-none rounded-lg bg-emerald-600 text-white text-[13px] font-bold cursor-pointer hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                ⬆ Import {importableCount} Row(s)
              </button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="py-8 text-center">
            <div className="mb-4 text-4xl">⟳</div>
            <div className="text-[15px] font-semibold text-slate-800 mb-3">Importing {progress.done} of {progress.total}…</div>
            <div className="w-full h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full transition-all duration-300 bg-blue-600 rounded-full"
                style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
            </div>
            <div className="text-[12px] text-slate-400 mt-2">{Math.round(progress.total ? (progress.done / progress.total) * 100 : 0)}%</div>
          </div>
        )}

        {step === "done" && (
          <div className="py-4 text-center">
            <div className="mb-4 text-5xl">{results.failed === 0 ? "🎉" : "⚠️"}</div>
            <div className="text-[17px] font-bold text-slate-900 mb-5">Import Complete!</div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="p-3 border bg-emerald-50 border-emerald-200 rounded-xl">
                <div className="text-2xl font-bold text-emerald-600">{results.created}</div>
                <div className="text-[11px] text-emerald-500 mt-0.5">Created</div>
              </div>
              <div className="p-3 border border-red-200 bg-red-50 rounded-xl">
                <div className="text-2xl font-bold text-red-600">{results.failed}</div>
                <div className="text-[11px] text-red-500 mt-0.5">Failed</div>
              </div>
            </div>
            {results.errors.length > 0 && (
              <div className="p-3 mb-4 overflow-y-auto text-left border border-red-100 bg-red-50 rounded-xl max-h-40">
                <div className="text-[11px] font-semibold text-red-600 mb-1">Errors:</div>
                {results.errors.map((e, i) => <div key={i} className="text-[11px] text-red-500">{e}</div>)}
              </div>
            )}
            <button onClick={onClose}
              className="w-full py-2.5 border-none rounded-lg bg-blue-600 text-white text-[13px] font-bold cursor-pointer hover:bg-blue-700 transition-colors">
              Done
            </button>
          </div>
        )}
      </div>
    </Overlay>
  );
};

// ────────────────────────────────────────────────────────────
// Mobile Product Card (replaces table row on mobile)
// ────────────────────────────────────────────────────────────
const ProductCard = ({ product, isSelected, onSelect, onView, onEdit, onDelete, BASE, resolveCat, getStatus, getStatusClass }) => {
  const name     = product.product_name ?? product.name ?? "—";
  const category = resolveCat(product.category, product.category_name);
  const color    = product.color ?? "";
  const size     = product.size ?? "—";
  const unit     = product.unit ?? "—";
  const price    = parseFloat(product.price ?? 0);
  const status   = getStatus(product.status);
  const thumb    = product.images?.[0]?.image_path ? `${BASE}/storage/${product.images[0].image_path}` : null;

  return (
    <div className={`bg-white rounded-xl border p-3 transition-colors ${isSelected ? "border-blue-400 bg-blue-50/40" : "border-gray-200"}`}>
      <div className="flex items-start gap-3">
        <input type="checkbox" checked={isSelected} onChange={() => onSelect(product.product_id)}
          className="cursor-pointer w-4 h-4 mt-0.5 shrink-0" />
        <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 overflow-hidden text-xl bg-gray-100 border border-gray-200 rounded-lg">
          {thumb ? <img src={thumb} alt={name} className="object-cover w-full h-full" /> : "📄"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="font-semibold text-gray-900 text-[13px] leading-tight truncate flex-1">{name}</div>
            <span className={`${getStatusClass(status)} px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap flex-shrink-0`}>{status}</span>
          </div>
          <div className="text-[11px] text-gray-500 mb-1">{category}</div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-500 mb-2">
            {color && (
              <div className="flex items-center gap-1">
                <ColorDot color={color} size="w-3 h-3" />
                <span>{color}</span>
              </div>
            )}
            {size !== "—" && <span>📐 {size}</span>}
            {unit !== "—" && <span>⚖️ {unit}</span>}
            {product.isSale == 1 && <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full font-semibold">SALE</span>}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-600 text-[14px]">₱{price.toFixed(2)}</span>
            <div className="flex gap-1.5">
              <button onClick={onView}
                className="px-2 py-1 rounded-md border border-blue-200 bg-blue-50 text-blue-600 text-[10px] font-semibold cursor-pointer hover:opacity-80">
                👁 View
              </button>
              <button onClick={onEdit}
                className="px-2 py-1 rounded-md border border-gray-300 bg-white text-gray-700 text-[10px] font-semibold cursor-pointer hover:opacity-80">
                ✏️ Edit
              </button>
              <button onClick={onDelete}
                className="px-2 py-1 rounded-md border border-red-200 bg-red-50 text-red-600 text-[11px] cursor-pointer hover:opacity-80">
                🗑
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Main AdminProducts Component
// ────────────────────────────────────────────────────────────
const AdminProducts = () => {
  const [searchTerm, setSearchTerm]             = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOrder, setSortOrder]               = useState("A-Z");
  const [selectedProducts, setSelectedProducts] = useState([]);
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

  const BLANK_ADD = {
    product_name: "", category_id: "", description: "",
    price: "", acquired_price: "", unit: "", size: "", isSale: false, status: "in_stock",
  };
  const [addForm, setAddForm]         = useState(BLANK_ADD);
  const [addImages, setAddImages]     = useState([]);
  const [addPreviews, setAddPreviews] = useState([]);

  const [editForm, setEditForm]           = useState({ ...BLANK_ADD });
  const [newImages, setNewImages]         = useState([]);
  const [newPreviews, setNewPreviews]     = useState([]);
  const [removedImageIds, setRemovedImageIds] = useState([]);
  const [editColor, setEditColor]         = useState("");

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res  = await axios.get(`${BASE}/api/admin/products`, { withCredentials: true });
      const data = res.data?.data ?? res.data?.products ?? res.data;
      const list = Array.isArray(data) ? data : [];
      setProducts(list);
      setProductStats({
        total:    list.length,
        inStock:  list.filter(p => (p.status ?? "in_stock") !== "pre_order").length,
        preOrder: list.filter(p => (p.status ?? "") === "pre_order").length,
      });
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const res  = await axios.get(`${BASE}/api/categories`, { withCredentials: true });
        const data = res.data?.categories ?? res.data?.data ?? res.data;
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedCategory, sortOrder]);

  const toggleSelect    = (id) =>
    setSelectedProducts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  const toggleSelectAll = () =>
    setSelectedProducts(selectedProducts.length === products.length ? [] : products.map(p => p.product_id ?? p.id));

  const getStatus = (status) => {
    if (status === "pre_order" || status === "Pre-Order") return "Pre-Order";
    return "In Stock";
  };
  const getStatusClass = (status) => ({
    "Pre-Order": "bg-amber-50 text-amber-600 border border-yellow-300",
    "In Stock":  "bg-emerald-50 text-emerald-600 border border-emerald-200",
  }[status] || "bg-emerald-50 text-emerald-600 border border-emerald-200");

  const resolveCat = (raw, fallback) =>
    typeof raw === "object" && raw !== null
      ? (raw.name ?? raw.category_name ?? fallback ?? "—")
      : (raw ?? fallback ?? "—");

  const filteredProducts = useMemo(() => products
    .filter(p => {
      const name = (p.product_name ?? p.name ?? "").toLowerCase();
      const cat  = resolveCat(p.category, p.category_name);
      return (
        name.includes(searchTerm.toLowerCase()) &&
        (selectedCategory === "All" || cat === selectedCategory)
      );
    })
    .sort((a, b) => {
      const na = (a.product_name ?? a.name ?? "").toLowerCase();
      const nb = (b.product_name ?? b.name ?? "").toLowerCase();
      return sortOrder === "A-Z" ? na.localeCompare(nb) : nb.localeCompare(na);
    }), [products, searchTerm, selectedCategory, sortOrder]);

  const totalPages  = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginated   = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    return Array.from({ length: 5 }, (_, i) => start + i);
  }, [totalPages, currentPage]);

  const openView = (product) => { setActiveProduct(product); setActiveImgIdx(0); setShowViewModal(true); };
  const openEdit = (product) => {
    setActiveProduct(product);
    setEditForm({
      product_name:   product.product_name ?? product.name ?? "",
      category_id:    product.category_id  ?? product.category?.id ?? "",
      description:    product.description  ?? "",
      price:          product.price        ?? "",
      acquired_price: product.acquired_price ?? "",
      unit:           product.unit  ?? "",
      size:           product.size  ?? "",
      isSale:         product.isSale == 1,
      status:         product.status ?? "in_stock",
    });
    setEditColor(product.color ?? "");
    setNewImages([]);
    setNewPreviews([]);
    setRemovedImageIds([]);
    setShowEditModal(true);
  };
  const openDelete = (product) => { setActiveProduct(product); setShowDeleteModal(true); };

  const handleAddChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };
  const handleAddImages = (e) => {
    const files = Array.from(e.target.files);
    setAddImages(prev => [...prev, ...files]);
    setAddPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };
  const removeAddImage = (i) => {
    setAddImages(prev => prev.filter((_, idx) => idx !== i));
    setAddPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const submitAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("product_name",   addForm.product_name);
      fd.append("category_id",    addForm.category_id);
      fd.append("status",         addForm.status ?? "in_stock");
      fd.append("description",    addForm.description);
      fd.append("price",          addForm.price);
      fd.append("acquired_price", addForm.acquired_price || 0);
      fd.append("unit",           addForm.unit);
      fd.append("size",           addForm.size);
      fd.append("isSale",         addForm.isSale ? 1 : 0);
      addImages.forEach(img => fd.append("images[]", img));
      await axios.post(`${BASE}/api/admin/products`, fd, { withCredentials: true });
      setShowAddModal(false);
      setAddForm(BLANK_ADD);
      setAddImages([]);
      setAddPreviews([]);
      fetchProducts();
    } catch (err) {
      console.error(err.response?.data || err);
      alert("Failed to create product");
    } finally {
      setSubmitting(false);
    }
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
  const removeNewImage = (i) => {
    setNewImages(prev => prev.filter((_, idx) => idx !== i));
    setNewPreviews(prev => prev.filter((_, idx) => idx !== i));
  };
  const toggleRemoveExisting = (imgId) =>
    setRemovedImageIds(prev => prev.includes(imgId) ? prev.filter(x => x !== imgId) : [...prev, imgId]);

  const submitEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append("_method",        "PUT");
    fd.append("product_name",   editForm.product_name);
    fd.append("category_id",    editForm.category_id);
    fd.append("description",    editForm.description);
    fd.append("price",          editForm.price);
    fd.append("acquired_price", editForm.acquired_price || 0);
    fd.append("unit",           editForm.unit);
    fd.append("size",           editForm.size);
    fd.append("status",         editForm.status ?? "in_stock");
    fd.append("isSale",         editForm.isSale ? 1 : 0);
    if (editColor) fd.append("color", editColor);
    removedImageIds.forEach(id => fd.append("remove_images[]", id));
    newImages.forEach(img => fd.append("images[]", img));
    try {
      const productId = activeProduct.product_id ?? activeProduct.id;
      await axios.post(`${BASE}/api/admin/products/${productId}`, fd, { withCredentials: true });
      setShowEditModal(false);
      fetchProducts();
    } catch (err) {
      console.error(err.response?.data || err);
      alert("Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeProduct) return;
    setDeleting(true);
    try {
      await axios.delete(`${BASE}/api/admin/products/${activeProduct.product_id}`, { withCredentials: true });
      setShowDeleteModal(false);
      setActiveProduct(null);
      fetchProducts();
    } catch (err) {
      console.error(err.response?.data || err);
      alert("Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  const viewImages  = activeProduct?.images ?? [];
  const viewMainSrc = viewImages[activeImgIdx]?.image_path
    ? `${BASE}/storage/${viewImages[activeImgIdx].image_path}`
    : null;

  const inputCls = "w-full px-[11px] py-[9px] border border-slate-200 rounded-lg text-[13px] text-slate-900 bg-white outline-none box-border font-[inherit] focus:border-blue-400 transition-colors";
  const labelCls = "block text-[11px] font-semibold text-gray-700 mb-1.5 uppercase tracking-wide";

  return (
    <div className="flex min-h-screen bg-[#F0F7F2] font-[system-ui,sans-serif]">
      <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} products={filteredProducts} categories={categories} />
      )}

      {showImportModal && (
        <ImportModal onClose={() => setShowImportModal(false)} categories={categories} onImportSuccess={fetchProducts} existingProducts={products} />
      )}

      {/* ADD PRODUCT MODAL */}
      {showAddModal && (
        <Overlay onClose={() => setShowAddModal(false)}>
          <ModalHeader title="Add New Product" subtitle="Fill in the details to list a new product" onClose={() => setShowAddModal(false)} />
          <form onSubmit={submitAdd} className="px-4 pt-5 pb-6 sm:px-6">
            <ImageUploadZone id="addImgUpload" onchange={handleAddImages} previews={addPreviews} onRemove={removeAddImage} />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="col-span-2">
                <label className={labelCls}>Product Name</label>
                <input name="product_name" placeholder="e.g. Scotch Brite Heavy-Duty Scrub Sponge"
                  value={addForm.product_name} onChange={handleAddChange} required
                  className="w-full px-[14px] py-[13px] border-2 border-blue-400 rounded-lg text-[15px] font-medium text-slate-900 bg-white outline-none box-border font-[inherit] focus:border-blue-600 transition-colors" />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Category{categoriesLoading && <span className="ml-1.5 text-[10px] text-slate-400 font-normal normal-case">Loading…</span>}</label>
                <CategorySelect name="category_id" value={addForm.category_id} onChange={handleAddChange} disabled={categoriesLoading} categories={categories} />
              </div>
              <div>
                <label className={labelCls}>Price (₱)</label>
                <input type="number" step="0.01" name="price" placeholder="0.00" value={addForm.price} onChange={handleAddChange} required className={inputCls} min="0" />
              </div>
              <div>
                <label className={labelCls}>Acquired Price (₱)</label>
                <input type="number" step="0.01" name="acquired_price" placeholder="0.00" value={addForm.acquired_price} onChange={handleAddChange} className={inputCls} min="0" />
              </div>
              <div>
                <label className={labelCls}>Unit</label>
                <input name="unit" placeholder="e.g. btl, gal, pcs" value={addForm.unit} onChange={handleAddChange} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Size</label>
                <input name="size" placeholder="e.g. 500ml, 1L, 100 x 70mm" value={addForm.size} onChange={handleAddChange} className={inputCls} />
              </div>
            </div>
            <div className="mb-4">
              <label className={labelCls}>Description</label>
              <textarea name="description" placeholder="Describe your product…" value={addForm.description} onChange={handleAddChange} className={`${inputCls} h-20 resize-y`} />
            </div>
            <StatusToggle value={addForm.status} onChange={(val) => setAddForm(prev => ({ ...prev, status: val }))} />
            <SaleToggle checked={addForm.isSale} onChange={handleAddChange} name="isSale" />
            <div className="flex gap-2.5">
              <button type="button" onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg bg-white text-gray-700 text-[13px] font-semibold cursor-pointer hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className={`flex-[2] py-2.5 border-none rounded-lg text-white text-[13px] font-bold shadow-[0_2px_8px_rgba(21,93,252,0.3)] transition-colors
                  ${submitting ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 cursor-pointer hover:bg-blue-700"}`}>
                {submitting ? "Creating…" : "+ Create Product"}
              </button>
            </div>
          </form>
        </Overlay>
      )}

      {/* VIEW PRODUCT MODAL */}
      {showViewModal && activeProduct && (
        <Overlay wide onClose={() => setShowViewModal(false)}>
          <ModalHeader title={activeProduct.product_name ?? activeProduct.name} subtitle={resolveCat(activeProduct.category, activeProduct.category_name)} onClose={() => setShowViewModal(false)} />
          <div className="grid grid-cols-1 gap-5 px-4 pt-5 pb-6 sm:grid-cols-2 sm:px-6">
            <div>
              <div className="rounded-xl overflow-hidden bg-slate-50 border border-slate-200 aspect-square flex items-center justify-center mb-2.5 relative">
                {viewMainSrc ? <img src={viewMainSrc} alt="main" className="object-contain w-full h-full" /> : <span className="text-6xl text-slate-300">📄</span>}
                {activeProduct.isSale == 1 && (
                  <div className="absolute top-2.5 left-2.5 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">SALE</div>
                )}
                {(() => {
                  const st = getStatus(activeProduct.status);
                  return <span className={`${getStatusClass(st)} absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold`}>{st}</span>;
                })()}
              </div>
              {viewImages.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {viewImages.map((img, i) => (
                    <button key={img.id ?? i} onClick={() => setActiveImgIdx(i)}
                      className={`w-[54px] h-[54px] rounded-lg overflow-hidden p-0 cursor-pointer bg-slate-50 flex-shrink-0
                        ${i === activeImgIdx ? "border-2 border-blue-600" : "border border-slate-200 hover:border-blue-400"}`}>
                      <img src={`${BASE}/storage/${img.image_path}`} alt="" className="block object-cover w-full h-full" />
                    </button>
                  ))}
                </div>
              )}
              {viewImages.length === 0 && <p className="m-0 text-xs text-center text-slate-400">No images uploaded</p>}
            </div>
            <div className="flex flex-col gap-3.5">
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="text-[28px] font-extrabold text-blue-600 mb-2">₱{parseFloat(activeProduct.price ?? 0).toFixed(2)}</div>
                <p className="m-0 text-[13px] text-gray-500 leading-[1.7]">
                  {activeProduct.description || <em className="text-slate-300">No description.</em>}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "Color",    value: activeProduct.color || "—", icon: "🎨", extra: activeProduct.color ? <ColorDot color={activeProduct.color} size="w-4 h-4" /> : null },
                  { label: "Category", value: resolveCat(activeProduct.category, activeProduct.category_name), icon: "🏷️" },
                  { label: "Size",     value: activeProduct.size || "—", icon: "📐" },
                  { label: "Unit",     value: activeProduct.unit || "—", icon: "⚖️" },
                  { label: "On Sale",  value: activeProduct.isSale == 1 ? "Yes" : "No", icon: "🏷" },
                ].map(item => (
                  <div key={item.label} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-2.5">
                    <span className="text-lg">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">{item.label}</div>
                      <div className="flex items-center gap-1.5 text-[13px] font-bold text-slate-900 truncate">{item.extra}{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5">
                {[
                  ["Product ID",     `#${activeProduct.product_id}`],
                  ["Acquired Price", `₱${parseFloat(activeProduct.acquired_price ?? 0).toFixed(2)}`],
                  ["Created",        activeProduct.created_at ? new Date(activeProduct.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : "—"],
                  ["Last Updated",   activeProduct.updated_at ? new Date(activeProduct.updated_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : "—"],
                ].map(([lbl, val]) => (
                  <div key={lbl} className="flex justify-between py-[7px] border-b border-slate-50 last:border-0">
                    <span className="text-xs text-slate-400">{lbl}</span>
                    <span className="text-xs font-medium text-gray-700">{val}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2.5 mt-auto">
                <button onClick={() => { setShowViewModal(false); openEdit(activeProduct); }}
                  className="flex-1 py-2.5 border-none rounded-lg bg-blue-600 text-white text-[13px] font-bold cursor-pointer hover:bg-blue-700 transition-colors">
                  ✏️ Edit Product
                </button>
                <button onClick={() => { setShowViewModal(false); openDelete(activeProduct); }}
                  className="px-3.5 py-2.5 border border-red-200 rounded-lg bg-red-50 text-red-600 text-[13px] font-semibold cursor-pointer hover:bg-red-100 transition-colors">
                  🗑
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* EDIT PRODUCT MODAL */}
      {showEditModal && activeProduct && (
        <Overlay onClose={() => setShowEditModal(false)}>
          <ModalHeader title="Edit Product" subtitle={`Editing: ${activeProduct.product_name ?? activeProduct.name}`} onClose={() => setShowEditModal(false)} />
          <form onSubmit={submitEdit} className="px-4 pt-5 pb-6 sm:px-6">
            {(activeProduct.images ?? []).length > 0 && (
              <div className="mb-4">
                <label className={labelCls}>Current Images</label>
                <p className="text-[11px] text-slate-400 mt-0 mb-2">Click to mark for removal</p>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
                  {(activeProduct.images ?? []).map((img, i) => {
                    const src = `${BASE}/storage/${img.image_path}`;
                    const removed = removedImageIds.includes(img.image_id);
                    return (
                      <div key={img.id ?? i} onClick={() => toggleRemoveExisting(img.image_id)}
                        className={`relative rounded-lg overflow-hidden aspect-square cursor-pointer
                          ${removed ? "border-2 border-red-500" : i === 0 ? "border-2 border-blue-600" : "border border-slate-200"}`}>
                        <img src={src} alt="" className={`w-full h-full object-cover block transition-opacity duration-200 ${removed ? "opacity-30" : "opacity-100"}`} />
                        {i === 0 && !removed && <div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-[9px] font-bold text-center py-0.5">MAIN</div>}
                        {removed && <div className="absolute inset-0 flex items-center justify-center text-xl">🗑</div>}
                      </div>
                    );
                  })}
                </div>
                {removedImageIds.length > 0 && <p className="text-[11px] text-red-500 mt-1.5 mb-0">{removedImageIds.length} image(s) marked for removal.</p>}
              </div>
            )}
            <ImageUploadZone id="editImgUpload" onchange={handleNewImages} previews={newPreviews} onRemove={removeNewImage} label="Add More Images" />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="col-span-2">
                <label className={labelCls}>Product Name</label>
                <input name="product_name" value={editForm.product_name} onChange={handleEditChange} required className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Category</label>
                <CategorySelect name="category_id" value={editForm.category_id} onChange={handleEditChange} disabled={categoriesLoading} categories={categories} />
              </div>
              <div>
                <label className={labelCls}>Color <span className="font-normal normal-case text-slate-400">(optional)</span></label>
                <div className="flex items-center gap-2">
                  {editColor && <ColorDot color={editColor} size="w-5 h-5" />}
                  <div className="relative flex-1">
                    <select value={editColor} onChange={e => setEditColor(e.target.value)}
                      className="w-full px-[11px] py-[9px] border border-slate-200 rounded-lg text-[13px] outline-none appearance-none pr-8 bg-white cursor-pointer text-slate-900">
                      <option value="">— No Color —</option>
                      {COLOR_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[11px]">▾</div>
                  </div>
                </div>
              </div>
              <div>
                <label className={labelCls}>Price (₱)</label>
                <input type="number" step="0.01" name="price" value={editForm.price} onChange={handleEditChange} required className={inputCls} min="0" />
              </div>
              <div>
                <label className={labelCls}>Acquired Price (₱)</label>
                <input type="number" step="0.01" name="acquired_price" value={editForm.acquired_price} onChange={handleEditChange} className={inputCls} min="0" />
              </div>
              <div>
                <label className={labelCls}>Unit</label>
                <input name="unit" placeholder="e.g. btl, gal, pcs" value={editForm.unit} onChange={handleEditChange} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Size</label>
                <input name="size" placeholder="e.g. 500ml, 1L" value={editForm.size} onChange={handleEditChange} className={inputCls} />
              </div>
            </div>
            <div className="mb-4">
              <label className={labelCls}>Description</label>
              <textarea name="description" value={editForm.description} onChange={handleEditChange} className={`${inputCls} h-20 resize-y`} />
            </div>
            <SaleToggle checked={editForm.isSale} onChange={handleEditChange} name="isSale" />
            <StatusToggle value={editForm.status} onChange={(val) => setEditForm(prev => ({ ...prev, status: val }))} />
            <div className="flex gap-2.5">
              <button type="button" onClick={() => setShowEditModal(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg bg-white text-gray-700 text-[13px] font-semibold cursor-pointer hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className={`flex-[2] py-2.5 border-none rounded-lg text-white text-[13px] font-bold shadow-[0_2px_8px_rgba(21,93,252,0.3)] transition-colors
                  ${saving ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 cursor-pointer hover:bg-blue-700"}`}>
                {saving ? "Saving…" : "💾 Save Changes"}
              </button>
            </div>
          </form>
        </Overlay>
      )}

      {/* DELETE CONFIRM MODAL */}
      {showDeleteModal && activeProduct && (
        <Overlay onClose={() => setShowDeleteModal(false)}>
          <div className="px-6 py-8 text-center">
            <div className="flex items-center justify-center mx-auto mb-4 text-2xl bg-red-100 rounded-full w-14 h-14">🗑️</div>
            <h3 className="m-0 mb-2 text-[17px] font-bold text-slate-900">Delete Product?</h3>
            <p className="m-0 mb-6 text-[13px] text-slate-500 leading-relaxed">
              Are you sure you want to delete <strong>{activeProduct.product_name ?? activeProduct.name}</strong>?<br />This action cannot be undone.
            </p>
            <div className="flex gap-2.5">
              <button onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg bg-white text-gray-700 text-[13px] font-semibold cursor-pointer hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className={`flex-1 py-2.5 border-none rounded-lg text-white text-[13px] font-bold cursor-pointer transition-colors ${deleting ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}>
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 w-0 min-w-0 px-3 py-4 overflow-x-hidden sm:px-5 sm:py-6">

        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:gap-3 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="md:hidden bg-transparent border-none text-[22px] cursor-pointer text-gray-700 px-1.5 py-1 rounded-md hover:bg-gray-100 transition-colors">
              ☰
            </button>
            <h1 className="text-[18px] sm:text-[22px] font-bold text-gray-900 m-0">List of Products</h1>
          </div>
          {/* Action buttons — stack on mobile */}
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1.5 px-3 sm:px-[18px] py-2 sm:py-[9px] border border-gray-300 rounded-lg bg-white text-gray-700 text-[12px] sm:text-[13px] font-medium cursor-pointer hover:bg-gray-50 transition-colors">
              ↑ Export
            </button>
            <button onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3 sm:px-[18px] py-2 sm:py-[9px] border border-emerald-300 rounded-lg bg-emerald-50 text-emerald-700 text-[12px] sm:text-[13px] font-semibold cursor-pointer hover:bg-emerald-100 transition-colors">
              ↓ Import
            </button>
            <button onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 sm:px-[18px] py-2 sm:py-[9px] border-none rounded-lg bg-blue-600 text-white text-[12px] sm:text-[13px] font-semibold cursor-pointer hover:bg-blue-700 transition-colors">
              + Add
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4 sm:gap-4 sm:mb-6">
          {[
            { label: "Total",     value: productStats.total,    bg: "bg-blue-50",    accent: "text-blue-600",    border: "border-blue-100",    icon: "📦", iconBg: "bg-blue-100" },
            { label: "In Stock",  value: productStats.inStock,  bg: "bg-emerald-50", accent: "text-emerald-600", border: "border-emerald-100", icon: "✅", iconBg: "bg-emerald-100" },
            { label: "Pre-Order", value: productStats.preOrder, bg: "bg-amber-50",   accent: "text-amber-600",   border: "border-amber-100",   icon: "🕒", iconBg: "bg-amber-100" },
          ].map(stat => (
            <div key={stat.label} className={`bg-white rounded-xl sm:rounded-2xl px-3 sm:px-6 py-3 sm:py-5 flex items-center justify-between shadow-sm border ${stat.border} hover:shadow-md transition-shadow`}>
              <div>
                <div className={`text-2xl sm:text-4xl font-extrabold ${stat.accent} leading-none mb-0.5 sm:mb-1`}>{stat.value}</div>
                <div className="text-[10px] sm:text-[13px] font-medium text-gray-500">{stat.label}</div>
              </div>
              <div className={`w-9 h-9 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${stat.iconBg} flex items-center justify-center text-lg sm:text-2xl flex-shrink-0`}>{stat.icon}</div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="overflow-hidden bg-white shadow-sm rounded-2xl">

          {/* Filters — mobile collapsible, desktop inline */}
          <div className="px-3 sm:px-[18px] py-3 sm:py-3.5 border-b border-gray-100">
            {/* Search always visible */}
            <div className="flex items-center gap-2 mb-2 sm:mb-0">
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-[7px] bg-gray-50 flex-1 min-w-0">
                <span className="text-gray-400 text-[13px]">🔍</span>
                <input type="text" placeholder="Search products…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full text-xs text-gray-700 bg-transparent border-none outline-none" />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="text-slate-400 border-none bg-transparent cursor-pointer text-xs px-0.5">✕</button>
                )}
              </div>
              {/* Filter toggle for mobile */}
              <button onClick={() => setShowFilters(v => !v)}
                className="sm:hidden flex items-center gap-1 border border-gray-200 rounded-lg px-3 py-[7px] bg-gray-50 text-xs text-gray-700 cursor-pointer whitespace-nowrap hover:bg-gray-100 transition-colors">
                ⚙ Filter
                {(selectedCategory !== "All" || sortOrder !== "A-Z") && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block ml-0.5"></span>
                )}
              </button>
              {/* Desktop filters inline */}
              <div className="flex-shrink-0 hidden gap-2 sm:flex">
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3.5 py-2 bg-gray-50 text-sm text-gray-700 cursor-pointer outline-none">
                  <option value="All">All Categories</option>
                  {categories.map(cat => {
                    const label = cat.name ?? cat.category_name ?? cat.title ?? "";
                    return <option key={cat.id ?? cat.category_id} value={label}>{label}</option>;
                  })}
                </select>
                <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3.5 py-2 bg-gray-50 text-sm text-gray-700 cursor-pointer outline-none">
                  <option value="A-Z">A–Z</option>
                  <option value="Z-A">Z–A</option>
                </select>
                <button onClick={() => { setSearchTerm(""); setSelectedCategory("All"); setSortOrder("A-Z"); }}
                  className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3.5 py-2 bg-white text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors shrink-0">
                  ✕ Clear
                </button>
              </div>
            </div>
            {/* Mobile filter dropdown */}
            {showFilters && (
              <div className="flex flex-col gap-2 pt-2 mt-2 border-t border-gray-100 sm:hidden">
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg outline-none cursor-pointer bg-gray-50">
                  <option value="All">All Categories</option>
                  {categories.map(cat => {
                    const label = cat.name ?? cat.category_name ?? cat.title ?? "";
                    return <option key={cat.id ?? cat.category_id} value={label}>{label}</option>;
                  })}
                </select>
                <div className="flex gap-2">
                  <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg outline-none cursor-pointer bg-gray-50">
                    <option value="A-Z">Sort A–Z</option>
                    <option value="Z-A">Sort Z–A</option>
                  </select>
                  <button onClick={() => { setSearchTerm(""); setSelectedCategory("All"); setSortOrder("A-Z"); setShowFilters(false); }}
                    className="px-4 py-2 text-sm text-gray-700 transition-colors bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    ✕ Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          {productsLoading ? (
            <div className="py-16 text-sm text-center text-slate-400">
              <div className="mb-3 text-4xl">⟳</div>Loading products…
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-sm text-center text-slate-400">
              <div className="mb-3 text-4xl">📦</div>No products found
            </div>
          ) : (
            <>
              {/* Mobile card list — NO horizontal scroll */}
              <div className="block px-3 py-3 space-y-2 sm:hidden">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <input type="checkbox" checked={selectedProducts.length === products.length && products.length > 0}
                    onChange={toggleSelectAll} className="w-4 h-4 cursor-pointer" />
                  <span className="text-[11px] text-gray-500">Select all ({filteredProducts.length})</span>
                </div>
                {paginated.map((product) => (
                  <ProductCard
                    key={product.product_id}
                    product={product}
                    isSelected={selectedProducts.includes(product.product_id)}
                    onSelect={toggleSelect}
                    onView={() => openView(product)}
                    onEdit={() => openEdit(product)}
                    onDelete={() => openDelete(product)}
                    BASE={BASE}
                    resolveCat={resolveCat}
                    getStatus={getStatus}
                    getStatusClass={getStatusClass}
                  />
                ))}
              </div>

              {/* Desktop table — hidden on mobile */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="w-10 p-3 pl-4">
                        <input type="checkbox" checked={selectedProducts.length === products.length && products.length > 0}
                          onChange={toggleSelectAll} className="cursor-pointer w-[15px] h-[15px]" />
                      </th>
                      {["Product", "Category", "Color", "Size", "Unit", "Status"].map(h => (
                        <th key={h} className="p-3 font-semibold text-left text-gray-700 whitespace-nowrap">{h}</th>
                      ))}
                      <th className="p-3 font-semibold text-right text-gray-700 whitespace-nowrap">Price</th>
                      <th className="p-3 font-semibold text-center text-gray-700 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((product, index) => {
                      const name     = product.product_name ?? product.name ?? "—";
                      const category = resolveCat(product.category, product.category_name);
                      const color    = product.color ?? "";
                      const size     = product.size ?? "—";
                      const unit     = product.unit ?? "—";
                      const price    = parseFloat(product.price ?? 0);
                      const status   = getStatus(product.status);
                      const thumb    = product.images?.[0]?.image_path ? `${BASE}/storage/${product.images[0].image_path}` : null;
                      const isSelected = selectedProducts.includes(product.product_id);
                      return (
                        <tr key={product.product_id ?? index}
                          className={`border-b border-gray-100 transition-colors hover:bg-blue-50/40 ${isSelected ? "bg-blue-50" : index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                          <td className="p-3 pl-4">
                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(product.product_id)}
                              className="cursor-pointer w-[15px] h-[15px]" />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-[38px] h-[38px] rounded-lg bg-gray-100 flex items-center justify-center text-lg flex-shrink-0 overflow-hidden border border-gray-200">
                                {thumb ? <img src={thumb} alt={name} className="object-cover w-full h-full" /> : "📄"}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 whitespace-nowrap">{name}</div>
                                {product.isSale == 1 && (
                                  <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full font-semibold">SALE</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-gray-500">{category}</td>
                          <td className="p-3">
                            {color ? (
                              <div className="flex items-center gap-1.5">
                                <ColorDot color={color} size="w-3.5 h-3.5" />
                                <span className="text-[12px] text-gray-600">{color}</span>
                              </div>
                            ) : <span className="text-slate-300 text-[12px]">—</span>}
                          </td>
                          <td className="p-3 text-gray-500">{size}</td>
                          <td className="p-3 text-gray-500">{unit}</td>
                          <td className="p-3">
                            <span className={`${getStatusClass(status)} px-2.5 py-1 rounded-full text-[11px] font-semibold inline-block whitespace-nowrap`}>{status}</span>
                          </td>
                          <td className="p-3 font-medium text-right text-gray-700">₱{price.toFixed(2)}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button onClick={() => openView(product)}
                                className="px-2.5 py-[5px] rounded-md border border-blue-200 bg-blue-50 text-blue-600 text-[11px] font-semibold cursor-pointer whitespace-nowrap hover:opacity-80 transition-opacity">
                                👁 View
                              </button>
                              <button onClick={() => openEdit(product)}
                                className="px-2.5 py-[5px] rounded-md border border-gray-300 bg-white text-gray-700 text-[11px] font-semibold cursor-pointer hover:opacity-80 transition-opacity">
                                ✏️ Edit
                              </button>
                              <button onClick={() => openDelete(product)}
                                className="px-2.5 py-[5px] rounded-md border border-red-200 bg-red-50 text-red-600 text-[13px] cursor-pointer leading-none hover:opacity-80 transition-opacity">
                                🗑
                              </button>
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
            <div className="px-3 sm:px-5 py-3 sm:py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
              <span>
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="text-xs font-medium text-gray-700 transition-colors bg-white border border-gray-200 rounded-md cursor-pointer w-7 h-7 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  ‹
                </button>
                {pageNumbers.map(p => (
                  <button key={p} onClick={() => setCurrentPage(p)}
                    className={`w-7 h-7 rounded-md text-xs font-medium cursor-pointer transition-colors ${p === currentPage ? "border-none bg-blue-600 text-white" : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="text-xs font-medium text-gray-700 transition-colors bg-white border border-gray-200 rounded-md cursor-pointer w-7 h-7 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminProducts;