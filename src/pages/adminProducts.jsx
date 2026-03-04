import { useState, useEffect, useRef } from "react";
import AdminNav from "../components/AdminNav";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE      = "http://127.0.0.1:8000/api/admin"; 
const CATEGORY_URL  = "http://127.0.0.1:8000/api/admin/categories"; 

// ─── AUTH HEADER ─────────────────────────────────────────────────────────────
const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ─── API HELPERS ──────────────────────────────────────────────────────────────
const api = {
  getAll: async () => {
    const res = await fetch(`${API_BASE}/products`, {
      headers: authHeader(),
    });
    return res.json();
  },


  getCategories: async () => {
    const res = await fetch(CATEGORY_URL);
    return res.json();
  },

  create: async (formData) => {
    const res = await fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: authHeader(),
      body: formData,
    });
    return res.json();
  },

  update: async (id, formData) => {
    formData.append("_method", "PUT");
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: "POST",
      headers: authHeader(),
      body: formData,
    });
    return res.json();
  },

  delete: async (id) => {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    });
    return res.json();
  },
};

// ─── INITIAL FORM STATE ───────────────────────────────────────────────────────
const emptyForm = {
  product_name: "",
  category_id: "",
  product_stocks: "",
  description: "",
  price: "",
  isSale: false,
};

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
const getStatusStyle = (stock) => {
  const s = Number(stock);
  if (s === 0)  return { background: "#FEE2E2", color: "#DC2626", border: "1px solid #FCA5A5", label: "Out of Stock" };
  if (s <= 10)  return { background: "#FEF3C7", color: "#D97706", border: "1px solid #FCD34D", label: "Low Stock" };
  return              { background: "#D1FAE5", color: "#059669", border: "1px solid #6EE7B7", label: "In Stock" };
};

// ─── TOAST ────────────────────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
      padding: "12px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
      background: toast.type === "error" ? "#FEE2E2" : "#D1FAE5",
      color: toast.type === "error" ? "#DC2626" : "#059669",
      border: `1px solid ${toast.type === "error" ? "#FCA5A5" : "#6EE7B7"}`,
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      animation: "slideUp 0.3s ease",
    }}>
      {toast.type === "error" ? "❌ " : "✅ "}{toast.msg}
    </div>
  );
};

// ─── MODAL ────────────────────────────────────────────────────────────────────
const Modal = ({ show, title, onClose, onSubmit, loading, children }) => {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.45)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: "16px",
    }}>
      <div style={{
        background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "520px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden",
        animation: "fadeIn 0.2s ease",
      }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "22px", color: "#9CA3AF", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "20px 24px", maxHeight: "65vh", overflowY: "auto" }}>{children}</div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid #F3F4F6", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: "8px", border: "1px solid #D1D5DB", background: "#fff", color: "#374151", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>Cancel</button>
          <button onClick={onSubmit} disabled={loading} style={{
            padding: "9px 20px", borderRadius: "8px", border: "none",
            background: loading ? "#93C5FD" : "#155DFC", color: "#fff",
            fontSize: "13px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", minWidth: "110px",
          }}>{loading ? "Saving..." : "Save Product"}</button>
        </div>
      </div>
    </div>
  );
};

// ─── FIELD ────────────────────────────────────────────────────────────────────
const Field = ({ label, required, children }) => (
  <div style={{ marginBottom: "14px" }}>
    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>
      {label}{required && <span style={{ color: "#DC2626" }}> *</span>}
    </label>
    {children}
  </div>
);

const inputStyle = {
  width: "100%", padding: "9px 12px", border: "1px solid #D1D5DB", borderRadius: "8px",
  fontSize: "13px", color: "#111827", background: "#F9FAFB", outline: "none", boxSizing: "border-box",
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const AdminProducts = () => {
  const [products, setProducts]             = useState([]);
  const [categories, setCategories]         = useState([]);
  const [fetchLoading, setFetchLoading]     = useState(true);
  const [loading, setLoading]               = useState(false);
  const [toast, setToast]                   = useState(null);
  const [sidebarOpen, setSidebarOpen]       = useState(false);

  // Filters
  const [searchTerm, setSearchTerm]             = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOrder, setSortOrder]               = useState("A-Z");
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Modal
  const [showModal, setShowModal]         = useState(false);
  const [showDelete, setShowDelete]       = useState(null);
  const [editingId, setEditingId]         = useState(null);
  const [form, setForm]                   = useState(emptyForm);
  const [imageFiles, setImageFiles]       = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const fileRef = useRef();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Load products
  const loadProducts = async () => {
    setFetchLoading(true);
    try {
      const data = await api.getAll();
      const list = data.products ?? data.data ?? data ?? [];
      setProducts(Array.isArray(list) ? list : []);
    } catch {
      showToast("Cannot connect to Laravel API. Is your server running?", "error");
    } finally {
      setFetchLoading(false);
    }
  };

  // ── Load categories — separate fetch, no auth needed
 const loadCategories = async () => {
  try {
    const res = await fetch(CATEGORY_URL);
    
    if (!res.ok) {
      console.error("Categories HTTP error:", res.status, res.statusText);
      return;
    }
    
    const data = await res.json();
    console.log("Categories response:", data);
    
    const list = data.categories ?? data.data ?? data ?? [];
    setCategories(Array.isArray(list) ? list : []);
  } catch (err) {
    console.error("Categories fetch error:", err);
  }
};

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  // ── Open Add modal
  const openAdd = () => {
    setForm(emptyForm);
    setImageFiles([]);
    setImagePreviews([]);
    setEditingId(null);
    setShowModal(true);
  };

  // ── Open Edit modal
  const openEdit = (product) => {
    setForm({
      product_name:   product.product_name   ?? "",
      category_id:    product.category_id    ?? "",
      product_stocks: product.product_stocks ?? "",
      description:    product.description    ?? "",
      price:          product.price          ?? "",
      isSale:         !!product.isSale,
    });
    setImageFiles([]);
    setImagePreviews([]);
    setEditingId(product.product_id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(emptyForm);
    setEditingId(null);
    setImageFiles([]);
    setImagePreviews([]);
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    setImagePreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async () => {
    if (!form.product_name.trim() || !form.price || !form.category_id) {
      showToast("Product name, category, and price are required.", "error");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("product_name",   form.product_name);
      fd.append("category_id",    form.category_id);
      fd.append("product_stocks", form.product_stocks || 0);
      fd.append("description",    form.description);
      fd.append("price",          form.price);
      fd.append("isSale",         form.isSale ? 1 : 0);
      imageFiles.forEach((img) => fd.append("images[]", img));

      if (editingId) {
        const res = await api.update(editingId, fd);
        if (res.success === false) throw new Error(res.message ?? "Update failed");
        showToast("Product updated successfully!");
      } else {
        const res = await api.create(fd);
        if (res.success === false) throw new Error(res.message ?? "Create failed");
        showToast("Product added successfully!");
      }

      closeModal();
      loadProducts();
    } catch (err) {
      showToast(err.message || "Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    setLoading(true);
    try {
      const res = await api.delete(showDelete.product_id);
      if (res.success === false) throw new Error(res.message ?? "Delete failed");
      showToast("Product deleted.");
      setProducts((prev) => prev.filter((p) => p.product_id !== showDelete.product_id));
    } catch (err) {
      showToast(err.message || "Delete failed.", "error");
    } finally {
      setLoading(false);
      setShowDelete(null);
    }
  };

  const toggleSelect = (id) =>
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  const toggleSelectAll = () =>
    setSelectedProducts(
      selectedProducts.length === paginated.length && paginated.length > 0
        ? [] : paginated.map((p) => p.product_id)
    );

  const filtered = products
    .filter((p) => {
      const matchSearch =
        p.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat =
        selectedCategory === "All" || p.category?.category_name === selectedCategory;
      return matchSearch && matchCat;
    })
    .sort((a, b) =>
      sortOrder === "A-Z"
        ? (a.product_name ?? "").localeCompare(b.product_name ?? "")
        : (b.product_name ?? "").localeCompare(a.product_name ?? "")
    );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const stats = {
    total:      products.length,
    inStock:    products.filter((p) => Number(p.product_stocks) > 10).length,
    lowStock:   products.filter((p) => Number(p.product_stocks) > 0 && Number(p.product_stocks) <= 10).length,
    outOfStock: products.filter((p) => Number(p.product_stocks) === 0).length,
  };

  const getPrimaryImage = (product) => {
    const img = product.images?.find((i) => i.is_primary) || product.images?.[0];
    return img ? `http://127.0.0.1:8000/storage/${img.image_path}` : null;
  };

  const categoryNames = [...new Set(products.map((p) => p.category?.category_name).filter(Boolean))];

  return (
    <>
      <style>{`
        @keyframes fadeIn  { from { opacity:0; transform:scale(0.97) } to { opacity:1; transform:scale(1) } }
        @keyframes slideUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @media (max-width: 767px) {
          .ap-burger { display: inline !important; }
          .ap-stats  { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (min-width: 768px) {
          .ap-burger { display: none !important; }
          .ap-stats  { grid-template-columns: repeat(4,1fr) !important; }
        }
        tbody tr:hover td { background: #F0F7FF !important; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#F0F7F2", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main style={{ flex: 1, padding: "24px 20px", overflowX: "hidden", minWidth: 0 }}>

          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button className="ap-burger" onClick={() => setSidebarOpen(true)}
                style={{ display: "none", background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#374151", padding: "4px 8px" }}>☰
              </button>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", margin: 0 }}>List of Products</h1>
            </div>
            <button onClick={openAdd} style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "9px 18px", border: "none", borderRadius: "8px",
              background: "#155DFC", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer",
            }}>+ Add Product</button>
          </div>

          {/* Stats */}
          <div className="ap-stats" style={{ display: "grid", gap: "14px", marginBottom: "20px" }}>
            {[
              { label: "Total Products", value: stats.total,      color: "#EFF6FF", accent: "#2563EB", icon: "📦" },
              { label: "In Stock",        value: stats.inStock,    color: "#ECFDF5", accent: "#059669", icon: "✅" },
              { label: "Low Stock",       value: stats.lowStock,   color: "#FFFBEB", accent: "#D97706", icon: "⚠️" },
              { label: "Out of Stock",    value: stats.outOfStock, color: "#FEF2F2", accent: "#DC2626", icon: "❌" },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: "#fff", borderRadius: "12px", padding: "16px 18px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}>
                <div>
                  <div style={{ fontSize: "24px", fontWeight: 700, color: stat.accent }}>{stat.value}</div>
                  <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>{stat.label}</div>
                </div>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: stat.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                  {stat.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Table card */}
          <div style={{ background: "#fff", borderRadius: "14px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>

            {/* Filters */}
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #F3F4F6", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", border: "1px solid #E5E7EB", borderRadius: "7px", padding: "7px 12px", background: "#F9FAFB", flex: "1", minWidth: "160px", maxWidth: "280px" }}>
                <span style={{ color: "#9CA3AF" }}>🔍</span>
                <input type="text" placeholder="Search product..." value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  style={{ border: "none", background: "transparent", outline: "none", fontSize: "12px", width: "100%", color: "#374151" }} />
              </div>
              <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                style={{ border: "1px solid #E5E7EB", borderRadius: "7px", padding: "7px 12px", background: "#F9FAFB", fontSize: "12px", color: "#374151", cursor: "pointer", outline: "none" }}>
                <option value="All">All Categories</option>
                {categoryNames.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}
                style={{ border: "1px solid #E5E7EB", borderRadius: "7px", padding: "7px 12px", background: "#F9FAFB", fontSize: "12px", color: "#374151", cursor: "pointer", outline: "none" }}>
                <option value="A-Z">Sort A-Z</option>
                <option value="Z-A">Sort Z-A</option>
              </select>
              <button onClick={() => { setSearchTerm(""); setSelectedCategory("All"); setSortOrder("A-Z"); setCurrentPage(1); }}
                style={{ border: "1px solid #E5E7EB", borderRadius: "7px", padding: "7px 12px", background: "#fff", fontSize: "12px", color: "#374151", cursor: "pointer" }}>
                ✕ Clear
              </button>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              {fetchLoading ? (
                <div style={{ padding: "60px", textAlign: "center", color: "#9CA3AF", fontSize: "14px" }}>⏳ Loading products...</div>
              ) : paginated.length === 0 ? (
                <div style={{ padding: "60px", textAlign: "center", color: "#9CA3AF", fontSize: "14px" }}>
                  No products found.{" "}
                  <span onClick={openAdd} style={{ color: "#155DFC", cursor: "pointer", textDecoration: "underline" }}>Add one now</span>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                      <th style={{ padding: "12px 16px", width: "40px" }}>
                        <input type="checkbox"
                          checked={selectedProducts.length === paginated.length && paginated.length > 0}
                          onChange={toggleSelectAll}
                          style={{ cursor: "pointer", width: "15px", height: "15px" }} />
                      </th>
                      {["Product", "Category", "Status", "Stocks", "Price"].map((h) => (
                        <th key={h} style={{
                          padding: "12px 16px",
                          textAlign: h === "Stocks" || h === "Price" ? "right" : "left",
                          fontWeight: 600, color: "#374151", whiteSpace: "nowrap",
                        }}>{h}</th>
                      ))}
                      <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600, color: "#374151" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((product, index) => {
                      const { label, ...statusStyle } = getStatusStyle(product.product_stocks);
                      const imgSrc = getPrimaryImage(product);
                      return (
                        <tr key={product.product_id} style={{
                          borderBottom: "1px solid #F3F4F6",
                          background: selectedProducts.includes(product.product_id)
                            ? "#EFF6FF" : index % 2 === 0 ? "#fff" : "#FAFAFA",
                        }}>
                          <td style={{ padding: "12px 16px" }}>
                            <input type="checkbox"
                              checked={selectedProducts.includes(product.product_id)}
                              onChange={() => toggleSelect(product.product_id)}
                              style={{ cursor: "pointer", width: "15px", height: "15px" }} />
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{ width: "38px", height: "38px", borderRadius: "8px", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                                {imgSrc
                                  ? <img src={imgSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.style.display = "none"; }} />
                                  : <span style={{ fontSize: "18px" }}>📄</span>}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: "#111827" }}>{product.product_name}</div>
                                {product.description && (
                                  <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {product.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", color: "#6B7280" }}>{product.category?.category_name ?? "—"}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ ...statusStyle, padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, display: "inline-block", whiteSpace: "nowrap" }}>
                              {label}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right", color: "#374151", fontWeight: 500 }}>{product.product_stocks}</td>
                          <td style={{ padding: "12px 16px", textAlign: "right", color: "#374151", fontWeight: 600 }}>₱{Number(product.price).toFixed(2)}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                              <button onClick={() => openEdit(product)} style={{
                                padding: "5px 14px", borderRadius: "6px", border: "1px solid #D1D5DB",
                                background: "#fff", color: "#374151", fontSize: "12px", fontWeight: 500, cursor: "pointer",
                              }}>Edit</button>
                              <button onClick={() => setShowDelete(product)} style={{
                                padding: "5px 8px", borderRadius: "6px", border: "1px solid #FCA5A5",
                                background: "#FEF2F2", color: "#DC2626", fontSize: "13px", cursor: "pointer", lineHeight: 1,
                              }}>🗑</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {!fetchLoading && filtered.length > 0 && (
              <div style={{ padding: "14px 20px", borderTop: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: "#9CA3AF", flexWrap: "wrap", gap: "8px" }}>
                <span>Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} products</span>
                <div style={{ display: "flex", gap: "6px" }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setCurrentPage(p)} style={{
                      width: "28px", height: "28px", borderRadius: "6px",
                      border: p === currentPage ? "none" : "1px solid #E5E7EB",
                      background: p === currentPage ? "#155DFC" : "#fff",
                      color: p === currentPage ? "#fff" : "#374151",
                      fontSize: "12px", cursor: "pointer", fontWeight: 500,
                    }}>{p}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal show={showModal} title={editingId ? "Edit Product" : "Add New Product"} onClose={closeModal} onSubmit={handleSubmit} loading={loading}>
        <Field label="Product Name" required>
          <input style={inputStyle} value={form.product_name}
            onChange={(e) => setForm({ ...form, product_name: e.target.value })}
            placeholder="e.g. Long Bondpaper" />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {/* ✅ CATEGORY DROPDOWN — galing sa database */}
          <Field label="Category" required>
            <select style={inputStyle} value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">-- Select Category --</option>
              {categories.length === 0 ? (
                <option disabled>Loading categories...</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.category_name}
                  </option>
                ))
              )}
            </select>
          </Field>

          <Field label="Price (₱)" required>
            <input style={inputStyle} type="number" step="0.01" min="0" value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="e.g. 250.00" />
          </Field>
        </div>

        <Field label="Stocks">
          <input style={inputStyle} type="number" min="0" value={form.product_stocks}
            onChange={(e) => setForm({ ...form, product_stocks: e.target.value })}
            placeholder="e.g. 50" />
        </Field>

        <Field label="Description">
          <textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional product description..." />
        </Field>

        <Field label="Images">
          <div onClick={() => fileRef.current.click()} style={{
            border: "2px dashed #D1D5DB", borderRadius: "8px", padding: "16px",
            textAlign: "center", cursor: "pointer", background: "#F9FAFB", fontSize: "12px", color: "#9CA3AF",
          }}>
            {imagePreviews.length > 0
              ? <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                  {imagePreviews.map((src, i) => (
                    <img key={i} src={src} alt="" style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "6px", border: "1px solid #E5E7EB" }} />
                  ))}
                </div>
              : <span>📁 Click to upload images (JPEG, PNG, GIF — max 5MB each)</span>
            }
          </div>
          <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/gif" onChange={handleImages} style={{ display: "none" }} />
        </Field>

        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#374151", cursor: "pointer", marginTop: "4px" }}>
          <input type="checkbox" checked={form.isSale}
            onChange={(e) => setForm({ ...form, isSale: e.target.checked })}
            style={{ width: "15px", height: "15px", cursor: "pointer" }} />
          Mark as On Sale
        </label>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      {showDelete && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "380px", padding: "28px 24px", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", animation: "fadeIn 0.2s ease" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🗑️</div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>Delete Product?</h3>
            <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "20px" }}>
              Are you sure you want to delete <strong>"{showDelete.product_name}"</strong>?<br />This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button onClick={() => setShowDelete(null)} style={{ padding: "9px 24px", borderRadius: "8px", border: "1px solid #D1D5DB", background: "#fff", color: "#374151", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleDelete} disabled={loading} style={{
                padding: "9px 24px", borderRadius: "8px", border: "none",
                background: loading ? "#FCA5A5" : "#DC2626", color: "#fff",
                fontSize: "13px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              }}>{loading ? "Deleting..." : "Yes, Delete"}</button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </>
  );
};

export default AdminProducts;