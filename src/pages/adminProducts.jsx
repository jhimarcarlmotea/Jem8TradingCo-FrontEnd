import { useEffect, useState } from "react";
import AdminNav from '../components/AdminNav';
import axios from "axios";

const BASE = "http://127.0.0.1:8000";

// ── Shared styles (outside component to avoid recreation) ──
const labelStyle = {
  display:"block", fontSize:"11px", fontWeight:600, color:"#374151",
  marginBottom:"5px", textTransform:"uppercase", letterSpacing:"0.05em"
};
const inputStyle = {
  width:"100%", padding:"9px 11px", border:"1px solid #E2E8F0", borderRadius:"8px",
  fontSize:"13px", color:"#0F172A", background:"#fff", outline:"none",
  boxSizing:"border-box", fontFamily:"inherit"
};

// ── Reusable components defined OUTSIDE AdminProducts ──
// KEY FIX: Components defined inside a parent component are recreated on every
// render. React sees them as a new component type each time, so it unmounts and
// remounts them — which drops focus from any active input.

const Overlay = ({ children, onClose, wide }) => (
  <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:"16px" }}>
    <div onClick={e => e.stopPropagation()} style={{ background:"#fff", width:"100%", maxWidth: wide ? "780px" : "560px", borderRadius:"16px", boxShadow:"0 24px 64px rgba(0,0,0,0.18)", maxHeight:"94vh", overflowY:"auto" }}>
      {children}
    </div>
  </div>
);

const ModalHeader = ({ title, subtitle, onClose }) => (
  <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid #F1F5F9", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, background:"#fff", zIndex:10, borderRadius:"16px 16px 0 0" }}>
    <div>
      <h2 style={{ margin:0, fontSize:"17px", fontWeight:700, color:"#0F172A" }}>{title}</h2>
      {subtitle && <p style={{ margin:"2px 0 0", fontSize:"12px", color:"#94A3B8" }}>{subtitle}</p>}
    </div>
    <button onClick={onClose} style={{ width:"32px", height:"32px", borderRadius:"8px", border:"1px solid #E2E8F0", background:"#F8FAFC", color:"#64748B", fontSize:"18px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 }}>×</button>
  </div>
);

const ImageUploadZone = ({ id, onchange, previews, onRemove, label }) => (
  <div style={{ marginBottom:"20px" }}>
    <label style={{ ...labelStyle, marginBottom:"8px" }}>{label ?? "Product Images"}</label>
    <label htmlFor={id} style={{ display:"block", border:"2px dashed #CBD5E1", borderRadius:"10px", padding:"18px", textAlign:"center", cursor:"pointer", background:"#F8FAFC", transition:"border-color 0.2s", marginBottom: previews.length > 0 ? "10px" : "0" }}
      onMouseEnter={e => e.currentTarget.style.borderColor="#155DFC"}
      onMouseLeave={e => e.currentTarget.style.borderColor="#CBD5E1"}>
      <div style={{ fontSize:"26px", marginBottom:"4px" }}>🖼️</div>
      <div style={{ fontSize:"13px", fontWeight:600, color:"#374151" }}>Click to upload images</div>
      <div style={{ fontSize:"11px", color:"#94A3B8", marginTop:"2px" }}>PNG, JPG, WEBP — multiple allowed</div>
      <input id={id} type="file" multiple accept="image/*" onChange={onchange} style={{ display:"none" }} />
    </label>
    {previews.length > 0 && (
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(88px,1fr))", gap:"8px" }}>
        {previews.map((src, i) => (
          <div key={i} style={{ position:"relative", borderRadius:"8px", overflow:"hidden", aspectRatio:"1", border: i===0 ? "2px solid #155DFC" : "1px solid #E2E8F0", background:"#F1F5F9" }}>
            <img src={src} alt={`preview-${i}`} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
            {i===0 && <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"#155DFC", color:"#fff", fontSize:"9px", fontWeight:700, textAlign:"center", padding:"3px" }}>MAIN</div>}
            <button type="button" onClick={() => onRemove(i)} style={{ position:"absolute", top:"4px", right:"4px", width:"18px", height:"18px", borderRadius:"50%", background:"rgba(0,0,0,0.55)", color:"#fff", border:"none", fontSize:"11px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Note: categories is now passed as a prop instead of being closed over
const CategorySelect = ({ name, value, onChange, disabled, categories }) => (
  <div style={{ position:"relative" }}>
    <select name={name} value={value} onChange={onChange} required disabled={disabled}
      style={{ ...inputStyle, appearance:"none", WebkitAppearance:"none", paddingRight:"32px", cursor: disabled ? "not-allowed" : "pointer", color: value ? "#0F172A" : "#9CA3AF", background: disabled ? "#F8FAFC" : "#fff" }}>
      <option value="" disabled>{disabled ? "Loading…" : "Select a category"}</option>
      {categories.map(cat => (
        <option key={cat.id ?? cat.category_id} value={cat.id ?? cat.category_id}>
          {cat.name ?? cat.category_name ?? cat.title}
        </option>
      ))}
      {!disabled && categories.length===0 && <option value="" disabled>No categories found</option>}
    </select>
    <div style={{ position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"#94A3B8", fontSize:"11px" }}>{disabled ? "⟳" : "▾"}</div>
  </div>
);

const SaleToggle = ({ checked, onChange, name }) => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:"8px", padding:"12px 14px", marginBottom:"20px" }}>
    <div>
      <div style={{ fontSize:"13px", fontWeight:600, color:"#374151" }}>Mark as On Sale</div>
      <div style={{ fontSize:"11px", color:"#94A3B8" }}>Show a sale badge on this product</div>
    </div>
    <label style={{ position:"relative", display:"inline-block", width:"40px", height:"22px", cursor:"pointer" }}>
      <input type="checkbox" name={name} checked={checked} onChange={onChange} style={{ opacity:0, width:0, height:0, position:"absolute" }} />
      <div style={{ position:"absolute", inset:0, borderRadius:"11px", background: checked ? "#155DFC" : "#CBD5E1", transition:"background 0.2s" }} />
      <div style={{ position:"absolute", top:"3px", left: checked ? "21px" : "3px", width:"16px", height:"16px", borderRadius:"50%", background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }} />
    </label>
  </div>
);

// ────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────
const AdminProducts = () => {
  const [searchTerm, setSearchTerm]               = useState("");
  const [selectedCategory, setSelectedCategory]   = useState("All");
  const [sortOrder, setSortOrder]                 = useState("A-Z");
  const [selectedProducts, setSelectedProducts]   = useState([]);
  const [sidebarOpen, setSidebarOpen]             = useState(false);

  // ── Modal states ──
  const [showAddModal, setShowAddModal]           = useState(false);
  const [showViewModal, setShowViewModal]         = useState(false);
  const [showEditModal, setShowEditModal]         = useState(false);
  const [showDeleteModal, setShowDeleteModal]     = useState(false);
  const [activeProduct, setActiveProduct]         = useState(null);
  const [activeImgIdx, setActiveImgIdx]           = useState(0);

  // ── Data ──
  const [categories, setCategories]               = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [products, setProducts]                   = useState([]);
  const [productsLoading, setProductsLoading]     = useState(false);
  const [productStats, setProductStats]           = useState({ total:0, inStock:0, lowStock:0, outOfStock:0 });

  // ── Loading flags ──
  const [submitting, setSubmitting]   = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [saving, setSaving]           = useState(false);

  // ── Add form ──
  const [addForm, setAddForm] = useState({
    product_name:"", category_id:"", product_stocks:"", description:"", price:"", isSale:false
  });
  const [addImages, setAddImages]     = useState([]);
  const [addPreviews, setAddPreviews] = useState([]);

  // ── Edit form ──
  const [editForm, setEditForm] = useState({
    product_name:"", category_id:"", product_stocks:"", description:"", price:"", isSale:false
  });
  const [newImages, setNewImages]               = useState([]);
  const [newPreviews, setNewPreviews]           = useState([]);
  const [removedImageIds, setRemovedImageIds]   = useState([]);

  // ────────────────────────────────────────────
  // API calls
  // ────────────────────────────────────────────
  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res  = await axios.get(`${BASE}/api/admin/products`, { withCredentials:true });
      const data = res.data?.data ?? res.data?.products ?? res.data;
      const list = Array.isArray(data) ? data : [];
      setProducts(list);
      const inStock    = list.filter(p => (p.product_stocks ?? p.stock ?? 0) > 10).length;
      const lowStock   = list.filter(p => { const s = p.product_stocks ?? p.stock ?? 0; return s > 0 && s <= 10; }).length;
      const outOfStock = list.filter(p => (p.product_stocks ?? p.stock ?? 0) === 0).length;
      setProductStats({ total:list.length, inStock, lowStock, outOfStock });
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
        const res  = await axios.get(`${BASE}/api/categories`, { withCredentials:true });
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

  // ────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────
  const toggleSelect    = (id) => setSelectedProducts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  const toggleSelectAll = () => setSelectedProducts(selectedProducts.length === products.length ? [] : products.map(p => p.id));

  const deriveStatus = (stock) => {
    const s = Number(stock ?? 0);
    if (s === 0) return "Out of Stock";
    if (s <= 10) return "On-Hold";
    return "In Stock";
  };

  const getStatusStyle = (status) => ({
    "On-Hold":      { background:"#FEF3C7", color:"#D97706", border:"1px solid #FCD34D" },
    "In Stock":     { background:"#D1FAE5", color:"#059669", border:"1px solid #6EE7B7" },
    "Out of Stock": { background:"#FEE2E2", color:"#DC2626", border:"1px solid #FCA5A5" },
  }[status] || { background:"#FEF3C7", color:"#D97706", border:"1px solid #FCD34D" });

  const resolveCat = (raw, fallback) =>
    typeof raw === "object" && raw !== null
      ? (raw.name ?? raw.category_name ?? fallback ?? "—")
      : (raw ?? fallback ?? "—");

  const filteredProducts = products
    .filter(p => {
      const name = p.product_name ?? p.name ?? "";
      const cat  = resolveCat(p.category, p.category_name);
      return (
        name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedCategory === "All" || cat === selectedCategory)
      );
    })
    .sort((a, b) => {
      const na = (a.product_name ?? a.name ?? "").toLowerCase();
      const nb = (b.product_name ?? b.name ?? "").toLowerCase();
      return sortOrder === "A-Z" ? na.localeCompare(nb) : nb.localeCompare(na);
    });

  // ────────────────────────────────────────────
  // Open modals
  // ────────────────────────────────────────────
  const openView = (product) => {
    setActiveProduct(product);
    setActiveImgIdx(0);
    setShowViewModal(true);
  };

  const openEdit = (product) => {
    setActiveProduct(product);
    setEditForm({
      product_name:   product.product_name   ?? product.name  ?? "",
      category_id:    product.category_id    ?? product.category?.id ?? "",
      product_stocks: product.product_stocks ?? product.stock ?? "",
      description:    product.description    ?? "",
      price:          product.price          ?? "",
      isSale:         product.isSale == 1,
    });
    setNewImages([]);
    setNewPreviews([]);
    setRemovedImageIds([]);
    setShowEditModal(true);
  };

  const openDelete = (product) => {
    setActiveProduct(product);
    setShowDeleteModal(true);
  };

  // ────────────────────────────────────────────
  // Add product
  // ────────────────────────────────────────────
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
    const fd = new FormData();
    fd.append("product_name",   addForm.product_name);
    fd.append("category_id",    addForm.category_id);
    fd.append("product_stocks", addForm.product_stocks);
    fd.append("description",    addForm.description);
    fd.append("price",          addForm.price);
    fd.append("isSale",         addForm.isSale ? 1 : 0);
    addImages.forEach(img => fd.append("images[]", img));
    try {
      await axios.post(`${BASE}/api/admin/products`, fd, { withCredentials:true });
      setShowAddModal(false);
      setAddForm({ product_name:"", category_id:"", product_stocks:"", description:"", price:"", isSale:false });
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

  // ────────────────────────────────────────────
  // Edit product
  // ────────────────────────────────────────────
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
    fd.append("product_stocks", editForm.product_stocks);
    fd.append("description",    editForm.description);
    fd.append("price",          editForm.price);
    fd.append("isSale",         editForm.isSale ? 1 : 0);
    removedImageIds.forEach(id => fd.append("remove_images[]", id));
    newImages.forEach(img => fd.append("images[]", img));
    try {
      const productId = activeProduct.product_id ?? activeProduct.id;
      await axios.post(`${BASE}/api/admin/products/${productId}`, fd, { withCredentials:true });
      setShowEditModal(false);
      fetchProducts();
    } catch (err) {
      console.error(err.response?.data || err);
      alert("Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  // ────────────────────────────────────────────
  // Delete product
  // ────────────────────────────────────────────
  const handleDelete = async () => {
    if (!activeProduct) return;
    setDeleting(true);
    try {
      await axios.delete(`${BASE}/api/admin/products/${activeProduct.product_id}`, { withCredentials:true });
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

  // ────────────────────────────────────────────
  // View modal images
  // ────────────────────────────────────────────
  const viewImages  = activeProduct?.images ?? [];
  const viewMainSrc = viewImages[activeImgIdx]?.image_path
    ? `${BASE}/storage/${viewImages[activeImgIdx].image_path}`
    : null;

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .ap-burger { display: inline !important; }
          .ap-stats  { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 768px) {
          .ap-burger { display: none !important; }
          .ap-stats  { grid-template-columns: repeat(4, 1fr) !important; }
        }
        .prod-row:hover td { background: #F8FAFF !important; }
        .act-btn:hover     { opacity: 0.78; }
        .thumb-btn:hover   { border-color: #155DFC !important; }
      `}</style>

      <div style={{ display:"flex", minHeight:"100vh", background:"#F0F7F2", fontFamily:"'Segoe UI', system-ui, sans-serif" }}>
        <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* ══════════════════════════════
            ADD PRODUCT MODAL
        ══════════════════════════════ */}
        {showAddModal && (
          <Overlay onClose={() => setShowAddModal(false)}>
            <ModalHeader title="Add New Product" subtitle="Fill in the details to list a new product" onClose={() => setShowAddModal(false)} />
            <form onSubmit={submitAdd} style={{ padding:"20px 24px 24px" }}>
              <ImageUploadZone id="addImgUpload" onchange={handleAddImages} previews={addPreviews} onRemove={removeAddImage} />
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"12px" }}>
                <div>
                  <label style={labelStyle}>Product Name</label>
                  <input name="product_name" placeholder="e.g. Long Bondpaper" value={addForm.product_name} onChange={handleAddChange} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>
                    Category{categoriesLoading && <span style={{ marginLeft:"6px", fontSize:"10px", color:"#94A3B8", fontWeight:400, textTransform:"none" }}>Loading…</span>}
                  </label>
                  <CategorySelect name="category_id" value={addForm.category_id} onChange={handleAddChange} disabled={categoriesLoading} categories={categories} />
                </div>
                <div>
                  <label style={labelStyle}>Stocks</label>
                  <input type="number" name="product_stocks" placeholder="0" value={addForm.product_stocks} onChange={handleAddChange} required style={inputStyle} min="0" />
                </div>
                <div>
                  <label style={labelStyle}>Price (₱)</label>
                  <input type="number" step="0.01" name="price" placeholder="0.00" value={addForm.price} onChange={handleAddChange} required style={inputStyle} min="0" />
                </div>
              </div>
              <div style={{ marginBottom:"12px" }}>
                <label style={labelStyle}>Description</label>
                <textarea name="description" placeholder="Describe your product…" value={addForm.description} onChange={handleAddChange} style={{ ...inputStyle, height:"80px", resize:"vertical" }} />
              </div>
              <SaleToggle checked={addForm.isSale} onChange={handleAddChange} name="isSale" />
              <div style={{ display:"flex", gap:"10px" }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex:1, padding:"10px", border:"1px solid #E2E8F0", borderRadius:"8px", background:"#fff", color:"#374151", fontSize:"13px", fontWeight:600, cursor:"pointer" }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ flex:2, padding:"10px", border:"none", borderRadius:"8px", background: submitting ? "#93C5FD" : "#155DFC", color:"#fff", fontSize:"13px", fontWeight:700, cursor: submitting ? "not-allowed" : "pointer", boxShadow:"0 2px 8px rgba(21,93,252,0.3)" }}>
                  {submitting ? "Creating…" : "+ Create Product"}
                </button>
              </div>
            </form>
          </Overlay>
        )}

        {/* ══════════════════════════════
            VIEW PRODUCT MODAL
        ══════════════════════════════ */}
        {showViewModal && activeProduct && (
          <Overlay wide onClose={() => setShowViewModal(false)}>
            <ModalHeader
              title={activeProduct.product_name ?? activeProduct.name}
              subtitle={resolveCat(activeProduct.category, activeProduct.category_name)}
              onClose={() => setShowViewModal(false)}
            />
            <div style={{ padding:"20px 24px 24px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" }}>
              {/* Left — image gallery */}
              <div>
                <div style={{ borderRadius:"12px", overflow:"hidden", background:"#F8FAFC", border:"1px solid #E2E8F0", aspectRatio:"1", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"10px", position:"relative" }}>
                  {viewMainSrc
                    ? <img src={viewMainSrc} alt="main" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
                    : <span style={{ fontSize:"64px", color:"#CBD5E1" }}>📄</span>
                  }
                  {activeProduct.isSale == 1 && (
                    <div style={{ position:"absolute", top:"10px", left:"10px", background:"#F59E0B", color:"#fff", fontSize:"10px", fontWeight:700, padding:"3px 8px", borderRadius:"20px" }}>SALE</div>
                  )}
                  {(() => {
                    const st = deriveStatus(activeProduct.product_stocks ?? activeProduct.stock);
                    const s  = getStatusStyle(st);
                    return <span style={{ ...s, position:"absolute", top:"10px", right:"10px", padding:"3px 10px", borderRadius:"20px", fontSize:"11px", fontWeight:600 }}>{st}</span>;
                  })()}
                </div>
                {viewImages.length > 1 && (
                  <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                    {viewImages.map((img, i) => (
                      <button key={img.id ?? i} className="thumb-btn" onClick={() => setActiveImgIdx(i)}
                        style={{ width:"54px", height:"54px", borderRadius:"8px", overflow:"hidden", border: i===activeImgIdx ? "2px solid #155DFC" : "1px solid #E2E8F0", padding:0, cursor:"pointer", background:"#F8FAFC", transition:"border-color 0.15s", flexShrink:0 }}>
                        <img src={`${BASE}/storage/${img.image_path}`} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                      </button>
                    ))}
                  </div>
                )}
                {viewImages.length === 0 && (
                  <p style={{ fontSize:"12px", color:"#94A3B8", textAlign:"center", margin:0 }}>No images uploaded</p>
                )}
              </div>

              {/* Right — details */}
              <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                <div style={{ background:"#F8FAFC", borderRadius:"12px", padding:"16px" }}>
                  <div style={{ fontSize:"28px", fontWeight:800, color:"#155DFC", marginBottom:"8px" }}>
                    ₱{parseFloat(activeProduct.price ?? 0).toFixed(2)}
                  </div>
                  <p style={{ margin:0, fontSize:"13px", color:"#6B7280", lineHeight:"1.7" }}>
                    {activeProduct.description || <em style={{ color:"#CBD5E1" }}>No description.</em>}
                  </p>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                  {[
                    { label:"Stock",    value: activeProduct.product_stocks ?? activeProduct.stock ?? 0, icon:"📦" },
                    { label:"Category", value: resolveCat(activeProduct.category, activeProduct.category_name), icon:"🏷️" },
                    { label:"On Sale",  value: activeProduct.isSale == 1 ? "Yes" : "No", icon:"🏷" },
                    { label:"Images",   value: `${viewImages.length} image(s)`, icon:"🖼️" },
                  ].map(item => (
                    <div key={item.label} style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:"10px", padding:"12px", display:"flex", alignItems:"center", gap:"10px" }}>
                      <span style={{ fontSize:"18px" }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize:"10px", color:"#94A3B8", fontWeight:600, textTransform:"uppercase" }}>{item.label}</div>
                        <div style={{ fontSize:"13px", fontWeight:700, color:"#0F172A" }}>{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:"10px", padding:"14px 16px" }}>
                  {[
                    ["Product ID",   `#${activeProduct.product_id}`],
                    ["Created",      activeProduct.created_at ? new Date(activeProduct.created_at).toLocaleDateString("en-PH", { year:"numeric", month:"long", day:"numeric" }) : "—"],
                    ["Last Updated", activeProduct.updated_at ? new Date(activeProduct.updated_at).toLocaleDateString("en-PH", { year:"numeric", month:"long", day:"numeric" }) : "—"],
                  ].map(([lbl, val]) => (
                    <div key={lbl} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #F8FAFC" }}>
                      <span style={{ fontSize:"12px", color:"#94A3B8" }}>{lbl}</span>
                      <span style={{ fontSize:"12px", color:"#374151", fontWeight:500 }}>{val}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display:"flex", gap:"10px", marginTop:"auto" }}>
                  <button onClick={() => { setShowViewModal(false); openEdit(activeProduct); }}
                    style={{ flex:1, padding:"10px", border:"none", borderRadius:"8px", background:"#155DFC", color:"#fff", fontSize:"13px", fontWeight:700, cursor:"pointer" }}>
                    ✏️ Edit Product
                  </button>
                  <button onClick={() => { setShowViewModal(false); openDelete(activeProduct); }}
                    style={{ padding:"10px 14px", border:"1px solid #FCA5A5", borderRadius:"8px", background:"#FEF2F2", color:"#DC2626", fontSize:"13px", fontWeight:600, cursor:"pointer" }}>
                    🗑
                  </button>
                </div>
              </div>
            </div>
          </Overlay>
        )}

        {/* ══════════════════════════════
            EDIT PRODUCT MODAL
        ══════════════════════════════ */}
        {showEditModal && activeProduct && (
          <Overlay onClose={() => setShowEditModal(false)}>
            <ModalHeader title="Edit Product" subtitle={`Editing: ${activeProduct.product_name ?? activeProduct.name}`} onClose={() => setShowEditModal(false)} />
            <form onSubmit={submitEdit} style={{ padding:"20px 24px 24px" }}>

              {(activeProduct.images ?? []).length > 0 && (
                <div style={{ marginBottom:"16px" }}>
                  <label style={{ ...labelStyle, marginBottom:"6px" }}>Current Images</label>
                  <p style={{ fontSize:"11px", color:"#94A3B8", margin:"0 0 8px" }}>Click an image to mark it for removal</p>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(88px,1fr))", gap:"8px" }}>
                    {(activeProduct.images ?? []).map((img, i) => {
                      const src     = `${BASE}/storage/${img.image_path}`;
                      const removed = removedImageIds.includes(img.id);
                      return (
                        <div key={img.id ?? i} onClick={() => toggleRemoveExisting(img.id)}
                          style={{ position:"relative", borderRadius:"8px", overflow:"hidden", aspectRatio:"1", border: removed ? "2px solid #DC2626" : i===0 ? "2px solid #155DFC" : "1px solid #E2E8F0", cursor:"pointer" }}>
                          <img src={src} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", opacity: removed ? 0.3 : 1, transition:"opacity 0.2s" }} />
                          {i===0 && !removed && <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"#155DFC", color:"#fff", fontSize:"9px", fontWeight:700, textAlign:"center", padding:"2px" }}>MAIN</div>}
                          {removed && <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px" }}>🗑</div>}
                        </div>
                      );
                    })}
                  </div>
                  {removedImageIds.length > 0 && <p style={{ fontSize:"11px", color:"#DC2626", margin:"6px 0 0" }}>{removedImageIds.length} image(s) marked for removal.</p>}
                </div>
              )}

              <ImageUploadZone id="editImgUpload" onchange={handleNewImages} previews={newPreviews} onRemove={removeNewImage} label="Add More Images" />

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"12px" }}>
                <div>
                  <label style={labelStyle}>Product Name</label>
                  <input name="product_name" value={editForm.product_name} onChange={handleEditChange} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Category</label>
                  <CategorySelect name="category_id" value={editForm.category_id} onChange={handleEditChange} disabled={categoriesLoading} categories={categories} />
                </div>
                <div>
                  <label style={labelStyle}>Stocks</label>
                  <input type="number" name="product_stocks" value={editForm.product_stocks} onChange={handleEditChange} required style={inputStyle} min="0" />
                </div>
                <div>
                  <label style={labelStyle}>Price (₱)</label>
                  <input type="number" step="0.01" name="price" value={editForm.price} onChange={handleEditChange} required style={inputStyle} min="0" />
                </div>
              </div>
              <div style={{ marginBottom:"12px" }}>
                <label style={labelStyle}>Description</label>
                <textarea name="description" value={editForm.description} onChange={handleEditChange} style={{ ...inputStyle, height:"80px", resize:"vertical" }} />
              </div>
              <SaleToggle checked={editForm.isSale} onChange={handleEditChange} name="isSale" />
              <div style={{ display:"flex", gap:"10px" }}>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ flex:1, padding:"10px", border:"1px solid #E2E8F0", borderRadius:"8px", background:"#fff", color:"#374151", fontSize:"13px", fontWeight:600, cursor:"pointer" }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ flex:2, padding:"10px", border:"none", borderRadius:"8px", background: saving ? "#93C5FD" : "#155DFC", color:"#fff", fontSize:"13px", fontWeight:700, cursor: saving ? "not-allowed" : "pointer", boxShadow:"0 2px 8px rgba(21,93,252,0.3)" }}>
                  {saving ? "Saving…" : "💾 Save Changes"}
                </button>
              </div>
            </form>
          </Overlay>
        )}

        {/* ══════════════════════════════
            DELETE CONFIRM MODAL
        ══════════════════════════════ */}
        {showDeleteModal && activeProduct && (
          <Overlay onClose={() => setShowDeleteModal(false)}>
            <div style={{ padding:"32px 24px", textAlign:"center" }}>
              <div style={{ width:"56px", height:"56px", borderRadius:"50%", background:"#FEE2E2", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"26px", margin:"0 auto 16px" }}>🗑️</div>
              <h3 style={{ margin:"0 0 8px", fontSize:"17px", fontWeight:700, color:"#0F172A" }}>Delete Product?</h3>
              <p style={{ margin:"0 0 24px", fontSize:"13px", color:"#64748B", lineHeight:"1.6" }}>
                Are you sure you want to delete <strong>{activeProduct.product_name ?? activeProduct.name}</strong>?<br />This action cannot be undone.
              </p>
              <div style={{ display:"flex", gap:"10px" }}>
                <button onClick={() => setShowDeleteModal(false)} style={{ flex:1, padding:"10px", border:"1px solid #E2E8F0", borderRadius:"8px", background:"#fff", color:"#374151", fontSize:"13px", fontWeight:600, cursor:"pointer" }}>Cancel</button>
                <button onClick={handleDelete} disabled={deleting} style={{ flex:1, padding:"10px", border:"none", borderRadius:"8px", background: deleting ? "#FCA5A5" : "#DC2626", color:"#fff", fontSize:"13px", fontWeight:700, cursor: deleting ? "not-allowed" : "pointer" }}>
                  {deleting ? "Deleting…" : "Yes, Delete"}
                </button>
              </div>
            </div>
          </Overlay>
        )}

        {/* ══════════════════════════════
            MAIN CONTENT
        ══════════════════════════════ */}
        <main style={{ flex:1, padding:"24px 20px", overflowX:"hidden", minWidth:0 }}>

          {/* Top bar */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px", flexWrap:"wrap", gap:"12px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
              <button className="ap-burger" onClick={() => setSidebarOpen(true)} style={{ display:"none", background:"none", border:"none", fontSize:"22px", cursor:"pointer", color:"#374151", padding:"4px 8px", borderRadius:"6px" }}>☰</button>
              <h1 style={{ fontSize:"22px", fontWeight:700, color:"#111827", margin:0 }}>List of Products</h1>
            </div>
            <div style={{ display:"flex", gap:"10px" }}>
              <button style={{ display:"flex", alignItems:"center", gap:"6px", padding:"9px 18px", border:"1px solid #D1D5DB", borderRadius:"8px", background:"#fff", color:"#374151", fontSize:"13px", fontWeight:500, cursor:"pointer" }}>↑ Export</button>
              <button onClick={() => setShowAddModal(true)} style={{ display:"flex", alignItems:"center", gap:"6px", padding:"9px 18px", border:"none", borderRadius:"8px", background:"#155DFC", color:"#fff", fontSize:"13px", fontWeight:600, cursor:"pointer" }}>+ Add Product</button>
            </div>
          </div>

          {/* Stats */}
          <div className="ap-stats" style={{ display:"grid", gap:"14px", marginBottom:"20px" }}>
            {[
              { label:"Total Product", value:productStats.total,      color:"#EFF6FF", accent:"#2563EB", icon:"📦" },
              { label:"In Stocks",     value:productStats.inStock,     color:"#ECFDF5", accent:"#059669", icon:"✅" },
              { label:"Low Stocks",    value:productStats.lowStock,    color:"#FFFBEB", accent:"#D97706", icon:"⚠️" },
              { label:"Out of Stock",  value:productStats.outOfStock,  color:"#FEF2F2", accent:"#DC2626", icon:"❌" },
            ].map(stat => (
              <div key={stat.label} style={{ background:"#fff", borderRadius:"12px", padding:"16px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                <div>
                  <div style={{ fontSize:"24px", fontWeight:700, color:stat.accent }}>{stat.value}</div>
                  <div style={{ fontSize:"11px", color:"#6B7280", marginTop:"2px" }}>{stat.label}</div>
                </div>
                <div style={{ width:"40px", height:"40px", borderRadius:"10px", background:stat.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>{stat.icon}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ background:"#fff", borderRadius:"14px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)", overflow:"hidden" }}>

            {/* Filters */}
            <div style={{ padding:"14px 18px", borderBottom:"1px solid #F3F4F6", display:"flex", gap:"10px", flexWrap:"wrap", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px", border:"1px solid #E5E7EB", borderRadius:"7px", padding:"7px 12px", background:"#F9FAFB", flex:"1", minWidth:"160px", maxWidth:"280px" }}>
                <span style={{ color:"#9CA3AF" }}>🔍</span>
                <input type="text" placeholder="Search for Product" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ border:"none", background:"transparent", outline:"none", fontSize:"12px", width:"100%", color:"#374151" }} />
              </div>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ border:"1px solid #E5E7EB", borderRadius:"7px", padding:"7px 12px", background:"#F9FAFB", fontSize:"12px", color:"#374151", cursor:"pointer", outline:"none" }}>
                <option value="All">All Categories</option>
                {categories.map(cat => {
                  const label = cat.name ?? cat.category_name ?? cat.title ?? "";
                  return <option key={cat.id ?? cat.category_id} value={label}>{label}</option>;
                })}
              </select>
              <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={{ border:"1px solid #E5E7EB", borderRadius:"7px", padding:"7px 12px", background:"#F9FAFB", fontSize:"12px", color:"#374151", cursor:"pointer", outline:"none" }}>
                <option value="A-Z">Sort By A-Z</option>
                <option value="Z-A">Sort By Z-A</option>
              </select>
              <button onClick={() => { setSearchTerm(""); setSelectedCategory("All"); setSortOrder("A-Z"); }} style={{ display:"flex", alignItems:"center", gap:"5px", border:"1px solid #E5E7EB", borderRadius:"7px", padding:"7px 12px", background:"#fff", fontSize:"12px", color:"#374151", cursor:"pointer" }}>✕ Clear</button>
            </div>

            <div style={{ overflowX:"auto" }}>
              {productsLoading ? (
                <div style={{ padding:"60px", textAlign:"center", color:"#94A3B8", fontSize:"14px" }}>
                  <div style={{ fontSize:"36px", marginBottom:"12px" }}>⟳</div>Loading products…
                </div>
              ) : filteredProducts.length === 0 ? (
                <div style={{ padding:"60px", textAlign:"center", color:"#94A3B8", fontSize:"14px" }}>
                  <div style={{ fontSize:"40px", marginBottom:"12px" }}>📦</div>No products found
                </div>
              ) : (
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"13px" }}>
                  <thead>
                    <tr style={{ background:"#F9FAFB", borderBottom:"1px solid #E5E7EB" }}>
                      <th style={{ padding:"12px 16px", width:"40px" }}>
                        <input type="checkbox" checked={selectedProducts.length === products.length && products.length > 0} onChange={toggleSelectAll} style={{ cursor:"pointer", width:"15px", height:"15px" }} />
                      </th>
                      {["Product","Category","Size/Color","Status"].map(h => (
                        <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontWeight:600, color:"#374151", whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                      {["Stocks","Price"].map(h => (
                        <th key={h} style={{ padding:"12px 16px", textAlign:"right", fontWeight:600, color:"#374151", whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                      <th style={{ padding:"12px 16px", textAlign:"center", fontWeight:600, color:"#374151", whiteSpace:"nowrap" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product, index) => {
                      const name     = product.product_name ?? product.name ?? "—";
                      const category = resolveCat(product.category, product.category_name);
                      const size     = product.size ?? product.variant ?? "—";
                      const stock    = product.product_stocks ?? product.stock ?? 0;
                      const price    = parseFloat(product.price ?? 0);
                      const status   = deriveStatus(stock);
                      const thumb    = product.images?.[0]?.image_path
                        ? `${BASE}/storage/${product.images[0].image_path}`
                        : null;
                      return (
                        <tr key={product.product_id ?? index} className="prod-row" style={{ borderBottom:"1px solid #F3F4F6", background: selectedProducts.includes(product.product_id) ? "#EFF6FF" : index%2===0 ? "#fff" : "#FAFAFA", transition:"background 0.15s" }}>
                          <td style={{ padding:"12px 16px" }}>
                            <input type="checkbox" checked={selectedProducts.includes(product.product_id)} onChange={() => toggleSelect(product.product_id)} style={{ cursor:"pointer", width:"15px", height:"15px" }} />
                          </td>
                          <td style={{ padding:"12px 16px" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                              <div style={{ width:"38px", height:"38px", borderRadius:"8px", background:"#F3F4F6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0, overflow:"hidden", border:"1px solid #E5E7EB" }}>
                                {thumb ? <img src={thumb} alt={name} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : "📄"}
                              </div>
                              <div>
                                <div style={{ fontWeight:600, color:"#111827", whiteSpace:"nowrap" }}>{name}</div>
                                {product.isSale == 1 && <span style={{ fontSize:"10px", background:"#FEF3C7", color:"#D97706", padding:"1px 6px", borderRadius:"10px", fontWeight:600 }}>SALE</span>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding:"12px 16px", color:"#6B7280" }}>{category}</td>
                          <td style={{ padding:"12px 16px", color:"#6B7280" }}>{size}</td>
                          <td style={{ padding:"12px 16px" }}>
                            <span style={{ ...getStatusStyle(status), padding:"4px 10px", borderRadius:"20px", fontSize:"11px", fontWeight:600, display:"inline-block", whiteSpace:"nowrap" }}>{status}</span>
                          </td>
                          <td style={{ padding:"12px 16px", textAlign:"right", color:"#374151", fontWeight:500 }}>{stock}</td>
                          <td style={{ padding:"12px 16px", textAlign:"right", color:"#374151", fontWeight:500 }}>₱{price.toFixed(2)}</td>
                          <td style={{ padding:"12px 16px" }}>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"5px" }}>
                              <button className="act-btn" onClick={() => openView(product)}
                                style={{ padding:"5px 10px", borderRadius:"6px", border:"1px solid #BFDBFE", background:"#EFF6FF", color:"#2563EB", fontSize:"11px", fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", transition:"opacity 0.15s" }}>
                                👁 View
                              </button>
                              <button className="act-btn" onClick={() => openEdit(product)}
                                style={{ padding:"5px 10px", borderRadius:"6px", border:"1px solid #D1D5DB", background:"#fff", color:"#374151", fontSize:"11px", fontWeight:600, cursor:"pointer", transition:"opacity 0.15s" }}>
                                ✏️ Edit
                              </button>
                              <button className="act-btn" onClick={() => openDelete(product)}
                                style={{ padding:"5px 9px", borderRadius:"6px", border:"1px solid #FCA5A5", background:"#FEF2F2", color:"#DC2626", fontSize:"13px", cursor:"pointer", lineHeight:1, transition:"opacity 0.15s" }}>
                                🗑
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ padding:"14px 20px", borderTop:"1px solid #F3F4F6", display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:"12px", color:"#9CA3AF" }}>
              <span>Showing {filteredProducts.length} of {products.length} products</span>
              <div style={{ display:"flex", gap:"6px" }}>
                {[1,2,3].map(p => (
                  <button key={p} style={{ width:"28px", height:"28px", borderRadius:"6px", border: p===1?"none":"1px solid #E5E7EB", background: p===1?"#155DFC":"#fff", color: p===1?"#fff":"#374151", fontSize:"12px", cursor:"pointer", fontWeight:500 }}>{p}</button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminProducts;