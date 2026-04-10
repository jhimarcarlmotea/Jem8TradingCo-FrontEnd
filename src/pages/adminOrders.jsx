import { useState, useEffect, useCallback, useMemo } from "react";
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
  { value: "id_desc",     label: "ID: Newest First" },
  { value: "id_asc",      label: "ID: Oldest First" },
  { value: "name_asc",    label: "Name: A → Z" },
  { value: "name_desc",   label: "Name: Z → A" },
  { value: "amount_desc", label: "Amount: Highest" },
  { value: "amount_asc",  label: "Amount: Lowest" },
];

function ProductCell({ checkout }) {
  const product  = checkout?.cart?.product ?? null;
  const cart     = checkout?.cart ?? null;
  const imageUrl = product?.primary_image_url
    ?? (product?.images?.find((img) => img.is_primary)?.image_path
        ? `http://127.0.0.1:8000/storage/${product.images.find((img) => img.is_primary).image_path}`
        : null);

  if (!product) return <span className="text-gray-400">—</span>;

  const isPreOrder = product.status === "pre_order";

  return (
    <div className="flex items-center gap-2.5 min-w-[180px] max-w-[260px]">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={product.product_name}
          className="w-9 h-9 rounded-lg object-cover bg-gray-100 border border-gray-200 flex-shrink-0"
          onError={(e) => { e.target.style.display = "none"; }}
        />
      ) : (
        <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">
          📦
        </div>
      )}
      <div className="min-w-0">
        <div
          className="text-gray-900 font-medium truncate text-xs leading-tight"
          title={product.product_name}
        >
          {product.product_name}
        </div>
        <div className="text-gray-400 text-[11px] mt-0.5">
          Qty: {cart?.quantity ?? 1} · ₱{fmt(product.price)}
        </div>
        <span className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border
          ${isPreOrder
            ? "text-amber-700 bg-amber-50 border-amber-200"
            : "text-emerald-700 bg-emerald-50 border-emerald-200"
          }`}
        >
          {isPreOrder ? "⏳ Pre-order" : "✅ In stock"}
        </span>
      </div>
    </div>
  );
}

// ── Status Update Modal ────────────────────────────────────────────────────────
function StatusModal({ delivery, onClose, onUpdated }) {
  const [status, setStatus] = useState(delivery.status ?? "processing");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

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
  const product  = checkout?.cart?.product ?? null;

  return (
    <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-[999]">
      <div className="bg-white rounded-2xl p-7 w-[min(420px,90vw)] shadow-2xl">
        <h2 className="mb-1 text-base font-bold text-gray-900">Update Delivery Status</h2>
        <p className="mb-1 text-xs text-gray-500">Order #{checkout?.checkout_id}</p>

        {/* Product preview inside modal */}
        {product && (
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
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-1.5 rounded-lg border-none text-white text-xs font-semibold transition-colors ${
              saving ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
            }`}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
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

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = statusFilter !== "All" ? { status: statusFilter } : {};
      const res = await api.get("/deliveries", { params });
      const rawDeliveries = res.data.deliveries ?? [];
      console.log(res)
      const missingUserIds = [
      ...new Set(
        rawDeliveries
          .filter((d) => !d.checkout?.account && !d.checkout?.user && d.checkout?.user_id)
          .map((d) => d.checkout.user_id)
      ),
    ];

      const userMap = {};
      await Promise.all(
        missingUserIds.map(async (id) => {
          try {
            const userRes = await api.get(`/showUser/${id}`);
            userMap[id] = userRes.data.data.account ?? userRes.data.data.user ?? userRes.data.data;
          } catch {
            userMap[id] = null;
          }
        })
      );

      const enriched = rawDeliveries.map((d) => {
        if (!d.checkout?.user && d.checkout?.user_id) {
          return {
            ...d,
            checkout: { ...d.checkout, user: userMap[d.checkout.user_id] ?? null },
          };
        }
        return d;
      });

      setDeliveries(enriched);
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

  const totalRevenue = deliveries.reduce(
    (sum, d) => sum + Number(d.checkout?.paid_amount ?? 0),
    0
  );
  const count = (s) => deliveries.filter((d) => d.status === s).length;

  const summaryStats = [
    { label: "Orders",     value: deliveries.length,       icon: "🛒", bg: "bg-blue-50",   accent: "text-blue-600"   },
    { label: "Processing", value: count("processing"),     icon: "⚙️", bg: "bg-violet-50", accent: "text-violet-700" },
    { label: "Ready",      value: count("ready"),          icon: "📦", bg: "bg-blue-100",  accent: "text-blue-700"   },
    { label: "On the way", value: count("on_the_way"),     icon: "⏳", bg: "bg-amber-50",  accent: "text-amber-600"  },
    { label: "Delivered",  value: count("delivered"),      icon: "✅", bg: "bg-emerald-50",accent: "text-emerald-600"},
    { label: "Revenue",    value: `₱${fmt(totalRevenue)}`, icon: "💰", bg: "bg-orange-50", accent: "text-orange-600" },
  ];

  const filtered = useMemo(() => {
    const searched = deliveries.filter((d) => {
      const user = d.checkout?.account ?? d.checkout?.user;
      const name = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.toLowerCase();
      const checkoutId = String(d.checkout?.checkout_id ?? d.checkout_id ?? "").toLowerCase();
      const productName = (d.checkout?.cart?.product?.product_name ?? "").toLowerCase();
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

  return (
    <>
      {modalTarget && (
        <StatusModal
          delivery={modalTarget}
          onClose={() => setModalTarget(null)}
          onUpdated={handleUpdated}
        />
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
              >
                ☰
              </button>
              <div>
                <h1 className="m-0 text-xl font-bold text-gray-900">Orders</h1>
                <p className="text-xs text-gray-500 mt-0.5 mb-0">Manage deliveries and order statuses</p>
              </div>
            </div>
            <button
              onClick={fetchDeliveries}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-xs font-medium cursor-pointer hover:bg-gray-50 transition-colors"
            >
              ↻ Refresh
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-3 lg:grid-cols-6">
            {summaryStats.map((s) => (
              <div key={s.label} className="bg-white rounded-xl px-4 py-3.5 flex items-center justify-between shadow-sm">
                <div>
                  <div className={`text-lg font-bold ${s.accent}`}>{s.value}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{s.label}</div>
                </div>
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center text-base`}>
                  {s.icon}
                </div>
              </div>
            ))}
          </div>

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
              >
                ✕ Clear
              </button>
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
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {["Order ID", "Product", "Client", "Contact", "Payment", "Shipping Fee", "Total Paid", "Status", "Date", "Action"].map((h) => (
                        <th
                          key={h}
                          className="px-3.5 py-3 text-left font-semibold text-gray-700 whitespace-nowrap text-[11px] uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((d, index) => {
                      const user     = d.checkout?.user;
                      const checkout = d.checkout;
                      const cfg      = getStatusCfg(d.status);
                      return (
                        <tr
                          key={d.delivery_id}
                          className={`border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                        >
                          <td className="px-3.5 py-3.5 text-blue-600 font-semibold whitespace-nowrap">
                            #{checkout?.checkout_id ?? "—"}
                          </td>

                          {/* ── Product column ── */}
                          <td className="px-3.5 py-3.5">
                            <ProductCell checkout={checkout} />
                          </td>

                          <td className="px-3.5 py-3.5 text-gray-900 whitespace-nowrap">
                            {user ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() : "—"}
                          </td>
                          <td className="px-3.5 py-3.5 text-gray-500 leading-relaxed">
                            <div>{user?.email ?? "—"}</div>
                            <div>{user?.phone_number ?? ""}</div>
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
                            <button
                              onClick={() => setModalTarget(d)}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 text-xs font-medium cursor-pointer whitespace-nowrap hover:bg-gray-50 transition-colors"
                            >
                              ✏️ Update
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {paginated.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-10 text-xs text-center text-gray-400">
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
                  >
                    ‹
                  </button>
                  {pageNumbers.map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-7 h-7 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                        p === currentPage
                          ? "bg-blue-600 text-white border-none"
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="text-xs font-medium text-gray-700 transition-colors bg-white border border-gray-200 rounded-md cursor-pointer w-7 h-7 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}