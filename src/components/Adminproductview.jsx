import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminNav from "../components/AdminNav";
import axios from "axios";

const BASE = "http://127.0.0.1:8000";

const AdminProductView = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [product, setProduct]             = useState(null);
  const [loading, setLoading]             = useState(true);
  const [activeImg, setActiveImg]         = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting]           = useState(false);

  // ── Edit state ──
  const [editMode, setEditMode]           = useState(false);
  const [categories, setCategories]       = useState([]);
  const [saving, setSaving]               = useState(false);
  const [editForm, setEditForm]           = useState({
    product_name:"", category_id:"", product_stocks:"",
    description:"", price:"", isSale:false
  });
  const [newImages, setNewImages]         = useState([]);
  const [newPreviews, setNewPreviews]     = useState([]);
  const [removedImageIds, setRemovedImageIds] = useState([]);

  useEffect(() => {
    fetchProduct();
    fetchCategories();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res  = await axios.get(`${BASE}/api/admin/products/${id}`, { withCredentials:true });
      const data = res.data?.data ?? res.data?.product ?? res.data;
      setProduct(data);
      setEditForm({
        product_name:   data.product_name   ?? data.name       ?? "",
        category_id:    data.category_id    ?? data.category?.id ?? "",
        product_stocks: data.product_stocks ?? data.stock       ?? "",
        description:    data.description    ?? "",
        price:          data.price          ?? "",
        isSale:         data.isSale == 1    ?? false,
      });
    } catch (err) {
      console.error("Failed to fetch product:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res  = await axios.get(`${BASE}/api/categories`, { withCredentials:true });
      const data = res.data?.categories ?? res.data?.data ?? res.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const deriveStatus = (stock) => {
    const s = Number(stock ?? 0);
    if (s === 0) return "Out of Stock";
    if (s <= 10) return "On-Hold";
    return "In Stock";
  };

  const statusStyle = {
    "In Stock":     { bg:"#D1FAE5", color:"#059669", border:"1px solid #6EE7B7" },
    "On-Hold":      { bg:"#FEF3C7", color:"#D97706", border:"1px solid #FCD34D" },
    "Out of Stock": { bg:"#FEE2E2", color:"#DC2626", border:"1px solid #FCA5A5" },
  };

  // ── Delete ──
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${BASE}/api/admin/products/${id}`, { withCredentials:true });
      navigate("/admin/products");
    } catch (err) {
      console.error(err.response?.data || err);
      alert("Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  // ── Edit helpers ──
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({ ...prev, [name]: type==="checkbox" ? checked : value }));
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

  const toggleRemoveExisting = (imgId) => {
    setRemovedImageIds(prev =>
      prev.includes(imgId) ? prev.filter(x => x !== imgId) : [...prev, imgId]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData();
    formData.append("_method",         "PUT");
    formData.append("product_name",    editForm.product_name);
    formData.append("category_id",     editForm.category_id);
    formData.append("product_stocks",  editForm.product_stocks);
    formData.append("description",     editForm.description);
    formData.append("price",           editForm.price);
    formData.append("isSale",          editForm.isSale ? 1 : 0);
    removedImageIds.forEach(imgId => formData.append("remove_images[]", imgId));
    newImages.forEach(img => formData.append("images[]", img));
    try {
      await axios.post(`${BASE}/api/admin/products/${id}`, formData, { withCredentials:true });
      setEditMode(false);
      setNewImages([]);
      setNewPreviews([]);
      setRemovedImageIds([]);
      fetchProduct();
    } catch (err) {
      console.error(err.response?.data || err);
      alert("Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  // ── Styles ──
  const labelStyle = {
    display:"block", fontSize:"11px", fontWeight:600, color:"#374151",
    marginBottom:"5px", textTransform:"uppercase", letterSpacing:"0.05em"
  };
  const inputStyle = {
    width:"100%", padding:"9px 11px", border:"1px solid #E2E8F0",
    borderRadius:"8px", fontSize:"13px", color:"#0F172A", background:"#fff",
    outline:"none", boxSizing:"border-box", fontFamily:"inherit"
  };

  const images = product?.images ?? [];
  const mainImage = images[activeImg]?.image_path
    ? `${BASE}/storage/${images[activeImg].image_path}`
    : null;

  return (
    <>
      <style>{`
        @media (max-width: 767px) { .ap-burger { display: inline !important; } }
        @media (min-width: 768px) { .ap-burger { display: none !important; } }
        .thumb-btn:hover { border-color: #155DFC !important; }
        .back-btn:hover  { background: #F1F5F9 !important; }
        .edit-btn:hover  { background: #F0F7FF !important; }
      `}</style>

      <div style={{ display:"flex", minHeight:"100vh", background:"#F0F7F2", fontFamily:"'Segoe UI', system-ui, sans-serif" }}>
        <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* ─── DELETE MODAL ─── */}
        {showDeleteModal && (
          <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1100, padding:"16px" }}>
            <div style={{ background:"#fff", width:"100%", maxWidth:"400px", borderRadius:"16px", padding:"28px 24px", boxShadow:"0 24px 64px rgba(0,0,0,0.18)", textAlign:"center" }}>
              <div style={{ width:"52px", height:"52px", borderRadius:"50%", background:"#FEE2E2", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px", margin:"0 auto 16px" }}>🗑️</div>
              <h3 style={{ margin:"0 0 8px", fontSize:"16px", fontWeight:700, color:"#0F172A" }}>Delete Product?</h3>
              <p style={{ margin:"0 0 24px", fontSize:"13px", color:"#64748B", lineHeight:"1.5" }}>
                Are you sure you want to delete <strong>{product?.product_name ?? product?.name}</strong>? This cannot be undone.
              </p>
              <div style={{ display:"flex", gap:"10px" }}>
                <button onClick={() => setShowDeleteModal(false)} style={{ flex:1, padding:"10px", border:"1px solid #E2E8F0", borderRadius:"8px", background:"#fff", color:"#374151", fontSize:"13px", fontWeight:600, cursor:"pointer" }}>Cancel</button>
                <button onClick={handleDelete} disabled={deleting} style={{ flex:1, padding:"10px", border:"none", borderRadius:"8px", background: deleting ? "#FCA5A5" : "#DC2626", color:"#fff", fontSize:"13px", fontWeight:700, cursor: deleting ? "not-allowed" : "pointer" }}>
                  {deleting ? "Deleting…" : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        <main style={{ flex:1, padding:"24px 20px", overflowX:"hidden", minWidth:0 }}>

          {/* Top bar */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px", flexWrap:"wrap", gap:"12px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <button className="ap-burger" onClick={() => setSidebarOpen(true)} style={{ display:"none", background:"none", border:"none", fontSize:"22px", cursor:"pointer", color:"#374151" }}>☰</button>
              <button className="back-btn" onClick={() => navigate("/admin/products")}
                style={{ display:"flex", alignItems:"center", gap:"6px", padding:"7px 14px", border:"1px solid #E2E8F0", borderRadius:"8px", background:"#fff", color:"#374151", fontSize:"13px", fontWeight:500, cursor:"pointer", transition:"background 0.15s" }}>
                ← Back
              </button>
              <h1 style={{ fontSize:"20px", fontWeight:700, color:"#111827", margin:0 }}>Product Detail</h1>
            </div>
            {!editMode && (
              <div style={{ display:"flex", gap:"8px" }}>
                <button className="edit-btn" onClick={() => setEditMode(true)}
                  style={{ display:"flex", alignItems:"center", gap:"6px", padding:"9px 16px", border:"1px solid #D1D5DB", borderRadius:"8px", background:"#fff", color:"#374151", fontSize:"13px", fontWeight:600, cursor:"pointer", transition:"background 0.15s" }}>
                  ✏️ Edit Product
                </button>
                <button onClick={() => setShowDeleteModal(true)}
                  style={{ display:"flex", alignItems:"center", gap:"6px", padding:"9px 16px", border:"1px solid #FCA5A5", borderRadius:"8px", background:"#FEF2F2", color:"#DC2626", fontSize:"13px", fontWeight:600, cursor:"pointer" }}>
                  🗑 Delete
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign:"center", padding:"80px", color:"#94A3B8", fontSize:"16px" }}>
              <div style={{ fontSize:"40px", marginBottom:"16px" }}>⟳</div>
              Loading product…
            </div>
          ) : !product ? (
            <div style={{ textAlign:"center", padding:"80px", color:"#94A3B8", fontSize:"16px" }}>
              <div style={{ fontSize:"40px", marginBottom:"16px" }}>😕</div>
              Product not found.
            </div>
          ) : editMode ? (
            /* ─── EDIT FORM ─── */
            <div style={{ background:"#fff", borderRadius:"16px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)", overflow:"hidden" }}>
              <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid #F1F5F9", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <h2 style={{ margin:0, fontSize:"16px", fontWeight:700, color:"#0F172A" }}>Edit Product</h2>
                  <p style={{ margin:"2px 0 0", fontSize:"12px", color:"#94A3B8" }}>Update the product details below</p>
                </div>
                <button onClick={() => { setEditMode(false); setNewImages([]); setNewPreviews([]); setRemovedImageIds([]); }}
                  style={{ width:"32px", height:"32px", borderRadius:"8px", border:"1px solid #E2E8F0", background:"#F8FAFC", color:"#64748B", fontSize:"16px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
              </div>

              <form onSubmit={handleSave} style={{ padding:"24px" }}>

                {/* Existing Images */}
                {images.length > 0 && (
                  <div style={{ marginBottom:"20px" }}>
                    <label style={{ ...labelStyle, marginBottom:"8px" }}>Current Images</label>
                    <p style={{ fontSize:"11px", color:"#94A3B8", margin:"0 0 10px" }}>Click an image to mark it for removal (shown with red overlay)</p>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(90px,1fr))", gap:"8px" }}>
                      {images.map((img, i) => {
                        const src     = `${BASE}/storage/${img.image_path}`;
                        const removed = removedImageIds.includes(img.id);
                        return (
                          <div key={img.id} onClick={() => toggleRemoveExisting(img.id)}
                            style={{ position:"relative", borderRadius:"8px", overflow:"hidden", aspectRatio:"1", border: removed ? "2px solid #DC2626" : i===0 ? "2px solid #155DFC" : "1px solid #E2E8F0", cursor:"pointer", transition:"border-color 0.2s" }}>
                            <img src={src} alt={`img-${i}`} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", opacity: removed ? 0.35 : 1, transition:"opacity 0.2s" }} />
                            {i===0 && !removed && <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"#155DFC", color:"#fff", fontSize:"9px", fontWeight:700, textAlign:"center", padding:"3px" }}>MAIN</div>}
                            {removed && <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(220,38,38,0.15)", fontSize:"20px" }}>🗑</div>}
                          </div>
                        );
                      })}
                    </div>
                    {removedImageIds.length > 0 && <p style={{ fontSize:"11px", color:"#DC2626", marginTop:"6px" }}>{removedImageIds.length} image(s) will be removed on save.</p>}
                  </div>
                )}

                {/* Add New Images */}
                <div style={{ marginBottom:"20px" }}>
                  <label style={{ ...labelStyle, marginBottom:"8px" }}>Add More Images</label>
                  <label htmlFor="newImgUpload" style={{ display:"block", border:"2px dashed #CBD5E1", borderRadius:"10px", padding:"16px", textAlign:"center", cursor:"pointer", background:"#F8FAFC", transition:"border-color 0.2s", marginBottom: newPreviews.length > 0 ? "10px" : "0" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor="#155DFC"}
                    onMouseLeave={e => e.currentTarget.style.borderColor="#CBD5E1"}>
                    <div style={{ fontSize:"22px", marginBottom:"4px" }}>➕</div>
                    <div style={{ fontSize:"12px", fontWeight:600, color:"#374151" }}>Upload additional images</div>
                    <input id="newImgUpload" type="file" multiple accept="image/*" onChange={handleNewImages} style={{ display:"none" }} />
                  </label>
                  {newPreviews.length > 0 && (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(90px,1fr))", gap:"8px" }}>
                      {newPreviews.map((src, i) => (
                        <div key={i} style={{ position:"relative", borderRadius:"8px", overflow:"hidden", aspectRatio:"1", border:"1px dashed #155DFC", background:"#EFF6FF" }}>
                          <img src={src} alt={`new-${i}`} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                          <div style={{ position:"absolute", top:0, left:0, right:0, background:"rgba(21,93,252,0.7)", color:"#fff", fontSize:"9px", fontWeight:700, textAlign:"center", padding:"2px" }}>NEW</div>
                          <button type="button" onClick={() => removeNewImage(i)} style={{ position:"absolute", top:"4px", right:"4px", width:"18px", height:"18px", borderRadius:"50%", background:"rgba(0,0,0,0.55)", color:"#fff", border:"none", fontSize:"11px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fields */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"12px" }}>
                  <div>
                    <label style={labelStyle}>Product Name</label>
                    <input name="product_name" value={editForm.product_name} onChange={handleEditChange} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Category</label>
                    <div style={{ position:"relative" }}>
                      <select name="category_id" value={editForm.category_id} onChange={handleEditChange} required
                        style={{ ...inputStyle, appearance:"none", WebkitAppearance:"none", paddingRight:"32px", cursor:"pointer" }}>
                        <option value="" disabled>Select a category</option>
                        {categories.map(cat => (
                          <option key={cat.id ?? cat.category_id} value={cat.id ?? cat.category_id}>
                            {cat.name ?? cat.category_name ?? cat.title}
                          </option>
                        ))}
                      </select>
                      <div style={{ position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"#94A3B8", fontSize:"11px" }}>▾</div>
                    </div>
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
                  <textarea name="description" value={editForm.description} onChange={handleEditChange} style={{ ...inputStyle, height:"90px", resize:"vertical" }} />
                </div>

                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:"8px", padding:"12px 14px", marginBottom:"24px" }}>
                  <div>
                    <div style={{ fontSize:"13px", fontWeight:600, color:"#374151" }}>On Sale</div>
                    <div style={{ fontSize:"11px", color:"#94A3B8" }}>Show a sale badge on this product</div>
                  </div>
                  <label style={{ position:"relative", display:"inline-block", width:"40px", height:"22px", cursor:"pointer" }}>
                    <input type="checkbox" name="isSale" checked={editForm.isSale} onChange={handleEditChange} style={{ opacity:0, width:0, height:0, position:"absolute" }} />
                    <div style={{ position:"absolute", inset:0, borderRadius:"11px", background: editForm.isSale ? "#155DFC" : "#CBD5E1", transition:"background 0.2s" }} />
                    <div style={{ position:"absolute", top:"3px", left: editForm.isSale ? "21px" : "3px", width:"16px", height:"16px", borderRadius:"50%", background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }} />
                  </label>
                </div>

                <div style={{ display:"flex", gap:"10px" }}>
                  <button type="button" onClick={() => { setEditMode(false); setNewImages([]); setNewPreviews([]); setRemovedImageIds([]); }}
                    style={{ flex:1, padding:"11px", border:"1px solid #E2E8F0", borderRadius:"8px", background:"#fff", color:"#374151", fontSize:"13px", fontWeight:600, cursor:"pointer" }}>Cancel</button>
                  <button type="submit" disabled={saving}
                    style={{ flex:2, padding:"11px", border:"none", borderRadius:"8px", background: saving ? "#93C5FD" : "#155DFC", color:"#fff", fontSize:"13px", fontWeight:700, cursor: saving ? "not-allowed" : "pointer", boxShadow:"0 2px 8px rgba(21,93,252,0.3)" }}>
                    {saving ? "Saving…" : "💾 Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* ─── VIEW MODE ─── */
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" }}>

              {/* Left – Image Gallery */}
              <div style={{ background:"#fff", borderRadius:"16px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)", overflow:"hidden" }}>
                {/* Main image */}
                <div style={{ position:"relative", background:"#F8FAFC", width:"100%", aspectRatio:"1", overflow:"hidden" }}>
                  {mainImage ? (
                    <img src={mainImage} alt="Product" style={{ width:"100%", height:"100%", objectFit:"contain", display:"block" }} />
                  ) : (
                    <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"72px", color:"#E2E8F0" }}>📄</div>
                  )}
                  {product.isSale == 1 && (
                    <div style={{ position:"absolute", top:"12px", left:"12px", background:"#F59E0B", color:"#fff", fontSize:"11px", fontWeight:700, padding:"4px 10px", borderRadius:"20px", letterSpacing:"0.05em" }}>SALE</div>
                  )}
                  <div style={{ position:"absolute", top:"12px", right:"12px" }}>
                    {(() => {
                      const st  = deriveStatus(product.product_stocks ?? product.stock);
                      const cfg = statusStyle[st] ?? statusStyle["On-Hold"];
                      return <span style={{ background:cfg.bg, color:cfg.color, border:cfg.border, padding:"4px 10px", borderRadius:"20px", fontSize:"11px", fontWeight:600 }}>{st}</span>;
                    })()}
                  </div>
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div style={{ padding:"12px 16px", display:"flex", gap:"8px", flexWrap:"wrap", borderTop:"1px solid #F1F5F9" }}>
                    {images.map((img, i) => {
                      const src = `${BASE}/storage/${img.image_path}`;
                      return (
                        <button key={img.id} className="thumb-btn" onClick={() => setActiveImg(i)}
                          style={{ width:"56px", height:"56px", borderRadius:"8px", overflow:"hidden", border: i===activeImg ? "2px solid #155DFC" : "1px solid #E2E8F0", padding:0, cursor:"pointer", background:"#F8FAFC", transition:"border-color 0.2s", flexShrink:0 }}>
                          <img src={src} alt={`thumb-${i}`} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                        </button>
                      );
                    })}
                  </div>
                )}

                {images.length === 0 && (
                  <div style={{ padding:"16px", borderTop:"1px solid #F1F5F9", textAlign:"center", color:"#94A3B8", fontSize:"12px" }}>No images uploaded</div>
                )}
              </div>

              {/* Right – Details */}
              <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

                {/* Main info card */}
                <div style={{ background:"#fff", borderRadius:"16px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)", padding:"24px" }}>
                  <div style={{ marginBottom:"4px" }}>
                    <span style={{ fontSize:"11px", color:"#94A3B8", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                      {product.category?.name ?? product.category_name ?? "Uncategorized"}
                    </span>
                  </div>
                  <h2 style={{ margin:"0 0 12px", fontSize:"22px", fontWeight:700, color:"#0F172A", lineHeight:"1.3" }}>
                    {product.product_name ?? product.name}
                  </h2>
                  <div style={{ fontSize:"28px", fontWeight:800, color:"#155DFC", marginBottom:"16px" }}>
                    ₱{parseFloat(product.price ?? 0).toFixed(2)}
                  </div>
                  <p style={{ margin:0, fontSize:"13px", color:"#6B7280", lineHeight:"1.7" }}>
                    {product.description || <em style={{ color:"#CBD5E1" }}>No description provided.</em>}
                  </p>
                </div>

                {/* Stats grid */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                  {[
                    { label:"Stock",    value: product.product_stocks ?? product.stock ?? 0,       icon:"📦" },
                    { label:"Category", value: product.category?.name ?? product.category_name ?? "—", icon:"🏷️" },
                    { label:"Status",   value: deriveStatus(product.product_stocks ?? product.stock), icon:"🔄" },
                    { label:"On Sale",  value: product.isSale == 1 ? "Yes" : "No",                icon:"🏷" },
                  ].map(item => (
                    <div key={item.label} style={{ background:"#fff", borderRadius:"12px", padding:"16px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:"12px" }}>
                      <div style={{ width:"38px", height:"38px", borderRadius:"10px", background:"#F0F7F2", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>{item.icon}</div>
                      <div>
                        <div style={{ fontSize:"10px", color:"#94A3B8", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>{item.label}</div>
                        <div style={{ fontSize:"14px", fontWeight:700, color:"#0F172A", marginTop:"2px" }}>{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Metadata */}
                <div style={{ background:"#fff", borderRadius:"12px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)", padding:"16px 20px" }}>
                  <div style={{ fontSize:"11px", fontWeight:600, color:"#374151", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"12px" }}>Product Info</div>
                  {[
                    ["Product ID",   `#${product.id}`],
                    ["Created",      product.created_at ? new Date(product.created_at).toLocaleDateString("en-PH", { year:"numeric", month:"long", day:"numeric" }) : "—"],
                    ["Last Updated", product.updated_at ? new Date(product.updated_at).toLocaleDateString("en-PH", { year:"numeric", month:"long", day:"numeric" }) : "—"],
                    ["Images",       `${images.length} image${images.length !== 1 ? "s" : ""}`],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #F8FAFC" }}>
                      <span style={{ fontSize:"12px", color:"#94A3B8" }}>{label}</span>
                      <span style={{ fontSize:"12px", color:"#374151", fontWeight:500 }}>{val}</span>
                    </div>
                  ))}
                </div>

                {/* Quick actions */}
                <div style={{ display:"flex", gap:"10px" }}>
                  <button onClick={() => setEditMode(true)} style={{ flex:1, padding:"11px", border:"none", borderRadius:"10px", background:"#155DFC", color:"#fff", fontSize:"13px", fontWeight:700, cursor:"pointer", boxShadow:"0 2px 8px rgba(21,93,252,0.3)" }}>✏️ Edit Product</button>
                  <button onClick={() => setShowDeleteModal(true)} style={{ padding:"11px 16px", border:"1px solid #FCA5A5", borderRadius:"10px", background:"#FEF2F2", color:"#DC2626", fontSize:"13px", fontWeight:600, cursor:"pointer" }}>🗑 Delete</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default AdminProductView;