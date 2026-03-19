import { useEffect, useState } from "react";
import AdminNav from '../components/AdminNav';
import axios from "axios";

const BASE = "http://127.0.0.1:8000";

// ── Reusable components defined OUTSIDE AdminProducts ──
const Overlay = ({ children, onClose, wide }) => (
  <div
    onClick={onClose}
    className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
  >
    <div
      onClick={e => e.stopPropagation()}
      className={`bg-white w-full ${wide ? "max-w-3xl" : "max-w-[560px]"} rounded-2xl shadow-2xl max-h-[94vh] overflow-y-auto`}
    >
      {children}
    </div>
  </div>
);

const ModalHeader = ({ title, subtitle, onClose }) => (
  <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
    <div>
      <h2 className="m-0 text-[17px] font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-0.5 mb-0 text-xs text-slate-400">{subtitle}</p>}
    </div>
    <button
      onClick={onClose}
      className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-lg cursor-pointer flex items-center justify-center leading-none hover:bg-slate-100 transition-colors"
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
      className="block border-2 border-dashed border-slate-300 rounded-xl p-5 text-center cursor-pointer bg-slate-50 hover:border-blue-600 transition-colors mb-0"
    >
      <div className="text-[26px] mb-1">🖼️</div>
      <div className="text-sm font-semibold text-gray-700">Click to upload images</div>
      <div className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WEBP — multiple allowed</div>
      <input id={id} type="file" multiple accept="image/*" onChange={onchange} className="hidden" />
    </label>
    {previews.length > 0 && (
      <div className="grid gap-2 mt-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(88px,1fr))" }}>
        {previews.map((src, i) => (
          <div
            key={i}
            className={`relative rounded-lg overflow-hidden aspect-square bg-slate-100 ${i === 0 ? "border-2 border-blue-600" : "border border-slate-200"}`}
          >
            <img src={src} alt={`preview-${i}`} className="w-full h-full object-cover block" />
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
      className={`w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none appearance-none pr-8 transition-colors
        ${disabled ? "bg-slate-50 cursor-not-allowed" : "bg-white cursor-pointer"}
        ${value ? "text-slate-900" : "text-gray-400"}`}
    >
      <option value="" disabled>{disabled ? "Loading…" : "Select a category"}</option>
      {categories.map(cat => (
        <option key={cat.id ?? cat.category_id} value={cat.id ?? cat.category_id}>
          {cat.name ?? cat.category_name ?? cat.title}
        </option>
      ))}
      {!disabled && categories.length === 0 && <option value="" disabled>No categories found</option>}
    </select>
    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[11px]">
      {disabled ? "⟳" : "▾"}
    </div>
  </div>
);

const SaleToggle = ({ checked, onChange, name }) => (
  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-3 mb-5">
    <div>
      <div className="text-sm font-semibold text-gray-700">Mark as On Sale</div>
      <div className="text-[11px] text-slate-400">Show a sale badge on this product</div>
    </div>
    <label className="relative inline-block w-10 h-[22px] cursor-pointer">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="opacity-0 w-0 h-0 absolute"
      />
      <div className={`absolute inset-0 rounded-full transition-colors duration-200 ${checked ? "bg-blue-600" : "bg-slate-300"}`} />
      <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${checked ? "left-[21px]" : "left-[3px]"}`} />
    </label>
  </div>
);

// ── Helpers ──
const deriveStatus = (stock) => {
  const s = Number(stock ?? 0);
  if (s === 0) return "Out of Stock";
  if (s <= 10) return "On-Hold";
  return "In Stock";
};

const getStatusClasses = (status) => ({
  "On-Hold":      "bg-amber-100 text-amber-600 border border-amber-300",
  "In Stock":     "bg-emerald-100 text-emerald-600 border border-emerald-300",
  "Out of Stock": "bg-red-100 text-red-600 border border-red-300",
}[status] || "bg-amber-100 text-amber-600 border border-amber-300");

const resolveCat = (raw, fallback) =>
  typeof raw === "object" && raw !== null
    ? (raw.name ?? raw.category_name ?? fallback ?? "—")
    : (raw ?? fallback ?? "—");

// ── Shared input classes ──
const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white outline-none box-border font-[inherit]";
const labelCls = "block text-[11px] font-semibold text-gray-700 mb-1.5 uppercase tracking-wide";

// ────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────
const AdminProducts = () => {
  const [searchTerm, setSearchTerm]             = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOrder, setSortOrder]               = useState("A-Z");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [sidebarOpen, setSidebarOpen]           = useState(false);

  const [showAddModal, setShowAddModal]         = useState(false);
  const [showViewModal, setShowViewModal]       = useState(false);
  const [showEditModal, setShowEditModal]       = useState(false);
  const [showDeleteModal, setShowDeleteModal]   = useState(false);
  const [activeProduct, setActiveProduct]       = useState(null);
  const [activeImgIdx, setActiveImgIdx]         = useState(0);

  const [categories, setCategories]             = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [products, setProducts]                 = useState([]);
  const [productsLoading, setProductsLoading]   = useState(false);
  const [productStats, setProductStats]         = useState({ total:0, inStock:0, lowStock:0, outOfStock:0 });

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [saving, setSaving]         = useState(false);

  const [addForm, setAddForm] = useState({
    product_name:"", category_id:"", product_stocks:"", description:"", price:"", isSale:false
  });
  const [addImages, setAddImages]     = useState([]);
  const [addPreviews, setAddPreviews] = useState([]);

  const [editForm, setEditForm] = useState({
    product_name:"", category_id:"", product_stocks:"", description:"", price:"", isSale:false
  });
  const [newImages, setNewImages]             = useState([]);
  const [newPreviews, setNewPreviews]         = useState([]);
  const [removedImageIds, setRemovedImageIds] = useState([]);

  // ── API ──
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

  // ── Helpers ──
  const toggleSelect    = (id) => setSelectedProducts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  const toggleSelectAll = () => setSelectedProducts(selectedProducts.length === products.length ? [] : products.map(p => p.id));

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

  // ── Open modals ──
  const openView = (product) => { setActiveProduct(product); setActiveImgIdx(0); setShowViewModal(true); };
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
    setNewImages([]); setNewPreviews([]); setRemovedImageIds([]);
    setShowEditModal(true);
  };
  const openDelete = (product) => { setActiveProduct(product); setShowDeleteModal(true); };

  // ── Add product ──
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
      setAddImages([]); setAddPreviews([]);
      fetchProducts();
    } catch (err) {
      console.error(err.response?.data || err);
      alert("Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit product ──
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

  // ── Delete product ──
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

  const viewImages  = activeProduct?.images ?? [];
  const viewMainSrc = viewImages[activeImgIdx]?.image_path
    ? `${BASE}/storage/${viewImages[activeImgIdx].image_path}`
    : null;

  return (
    <div className="flex min-h-screen bg-[#F0F7F2] font-sans">
      <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* ══ ADD MODAL ══ */}
      {showAddModal && (
        <Overlay onClose={() => setShowAddModal(false)}>
          <ModalHeader title="Add New Product" subtitle="Fill in the details to list a new product" onClose={() => setShowAddModal(false)} />
          <form onSubmit={submitAdd} className="px-6 pt-5 pb-6">
            <ImageUploadZone id="addImgUpload" onchange={handleAddImages} previews={addPreviews} onRemove={removeAddImage} />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelCls}>Product Name</label>
                <input name="product_name" placeholder="e.g. Long Bondpaper" value={addForm.product_name} onChange={handleAddChange} required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>
                  Category
                  {categoriesLoading && <span className="ml-1.5 text-[10px] text-slate-400 font-normal normal-case">Loading…</span>}
                </label>
                <CategorySelect name="category_id" value={addForm.category_id} onChange={handleAddChange} disabled={categoriesLoading} categories={categories} />
              </div>
              <div>
                <label className={labelCls}>Stocks</label>
                <input type="number" name="product_stocks" placeholder="0" value={addForm.product_stocks} onChange={handleAddChange} required className={inputCls} min="0" />
              </div>
              <div>
                <label className={labelCls}>Price (₱)</label>
                <input type="number" step="0.01" name="price" placeholder="0.00" value={addForm.price} onChange={handleAddChange} required className={inputCls} min="0" />
              </div>
            </div>
            <div className="mb-3">
              <label className={labelCls}>Description</label>
              <textarea name="description" placeholder="Describe your product…" value={addForm.description} onChange={handleAddChange} className={`${inputCls} h-20 resize-y`} />
            </div>
            <SaleToggle checked={addForm.isSale} onChange={handleAddChange} name="isSale" />
            <div className="flex gap-2.5">
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-lg bg-white text-gray-700 text-sm font-semibold cursor-pointer hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className={`flex-[2] py-2.5 border-none rounded-lg text-white text-sm font-bold shadow-[0_2px_8px_rgba(21,93,252,0.3)] transition-colors ${submitting ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 cursor-pointer"}`}>
                {submitting ? "Creating…" : "+ Create Product"}
              </button>
            </div>
          </form>
        </Overlay>
      )}

      {/* ══ VIEW MODAL ══ */}
      {showViewModal && activeProduct && (
        <Overlay wide onClose={() => setShowViewModal(false)}>
          <ModalHeader
            title={activeProduct.product_name ?? activeProduct.name}
            subtitle={resolveCat(activeProduct.category, activeProduct.category_name)}
            onClose={() => setShowViewModal(false)}
          />
          <div className="px-6 pt-5 pb-6 grid grid-cols-2 gap-5">
            {/* Left — image gallery */}
            <div>
              <div className="rounded-xl overflow-hidden bg-slate-50 border border-slate-200 aspect-square flex items-center justify-center mb-2.5 relative">
                {viewMainSrc
                  ? <img src={viewMainSrc} alt="main" className="w-full h-full object-contain" />
                  : <span className="text-[64px] text-slate-300">📄</span>
                }
                {activeProduct.isSale == 1 && (
                  <div className="absolute top-2.5 left-2.5 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">SALE</div>
                )}
                {(() => {
                  const st = deriveStatus(activeProduct.product_stocks ?? activeProduct.stock);
                  return (
                    <span className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getStatusClasses(st)}`}>
                      {st}
                    </span>
                  );
                })()}
              </div>
              {viewImages.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {viewImages.map((img, i) => (
                    <button
                      key={img.id ?? i}
                      onClick={() => setActiveImgIdx(i)}
                      className={`w-[54px] h-[54px] rounded-lg overflow-hidden p-0 cursor-pointer bg-slate-50 flex-shrink-0 transition-all ${i === activeImgIdx ? "border-2 border-blue-600" : "border border-slate-200 hover:border-blue-400"}`}
                    >
                      <img src={`${BASE}/storage/${img.image_path}`} alt="" className="w-full h-full object-cover block" />
                    </button>
                  ))}
                </div>
              )}
              {viewImages.length === 0 && (
                <p className="text-xs text-slate-400 text-center m-0">No images uploaded</p>
              )}
            </div>

            {/* Right — details */}
            <div className="flex flex-col gap-3.5">
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-[28px] font-extrabold text-blue-600 mb-2">
                  ₱{parseFloat(activeProduct.price ?? 0).toFixed(2)}
                </div>
                <p className="m-0 text-sm text-gray-500 leading-relaxed">
                  {activeProduct.description || <em className="text-slate-300">No description.</em>}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label:"Stock",    value: activeProduct.product_stocks ?? activeProduct.stock ?? 0, icon:"📦" },
                  { label:"Category", value: resolveCat(activeProduct.category, activeProduct.category_name), icon:"🏷️" },
                  { label:"On Sale",  value: activeProduct.isSale == 1 ? "Yes" : "No", icon:"🏷" },
                  { label:"Images",   value: `${viewImages.length} image(s)`, icon:"🖼️" },
                ].map(item => (
                  <div key={item.label} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-2.5">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">{item.label}</div>
                      <div className="text-sm font-bold text-slate-900">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5">
                {[
                  ["Product ID",   `#${activeProduct.product_id}`],
                  ["Created",      activeProduct.created_at ? new Date(activeProduct.created_at).toLocaleDateString("en-PH", { year:"numeric", month:"long", day:"numeric" }) : "—"],
                  ["Last Updated", activeProduct.updated_at ? new Date(activeProduct.updated_at).toLocaleDateString("en-PH", { year:"numeric", month:"long", day:"numeric" }) : "—"],
                ].map(([lbl, val]) => (
                  <div key={lbl} className="flex justify-between py-1.5 border-b border-slate-50 last:border-0">
                    <span className="text-xs text-slate-400">{lbl}</span>
                    <span className="text-xs text-gray-700 font-medium">{val}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2.5 mt-auto">
                <button
                  onClick={() => { setShowViewModal(false); openEdit(activeProduct); }}
                  className="flex-1 py-2.5 border-none rounded-lg bg-blue-600 text-white text-sm font-bold cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  ✏️ Edit Product
                </button>
                <button
                  onClick={() => { setShowViewModal(false); openDelete(activeProduct); }}
                  className="px-3.5 py-2.5 border border-red-300 rounded-lg bg-red-50 text-red-600 text-sm font-semibold cursor-pointer hover:bg-red-100 transition-colors"
                >
                  🗑
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* ══ EDIT MODAL ══ */}
      {showEditModal && activeProduct && (
        <Overlay onClose={() => setShowEditModal(false)}>
          <ModalHeader title="Edit Product" subtitle={`Editing: ${activeProduct.product_name ?? activeProduct.name}`} onClose={() => setShowEditModal(false)} />
          <form onSubmit={submitEdit} className="px-6 pt-5 pb-6">

            {(activeProduct.images ?? []).length > 0 && (
              <div className="mb-4">
                <label className={labelCls}>Current Images</label>
                <p className="text-[11px] text-slate-400 mt-0 mb-2">Click an image to mark it for removal</p>
                <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(88px,1fr))" }}>
                  {(activeProduct.images ?? []).map((img, i) => {
                    const src     = `${BASE}/storage/${img.image_path}`;
                    const removed = removedImageIds.includes(img.id);
                    return (
                      <div
                        key={img.id ?? i}
                        onClick={() => toggleRemoveExisting(img.id)}
                        className={`relative rounded-lg overflow-hidden aspect-square cursor-pointer ${removed ? "border-2 border-red-600" : i === 0 ? "border-2 border-blue-600" : "border border-slate-200"}`}
                      >
                        <img src={src} alt="" className={`w-full h-full object-cover block transition-opacity ${removed ? "opacity-30" : "opacity-100"}`} />
                        {i === 0 && !removed && (
                          <div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-[9px] font-bold text-center py-0.5">MAIN</div>
                        )}
                        {removed && (
                          <div className="absolute inset-0 flex items-center justify-center text-xl">🗑</div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {removedImageIds.length > 0 && (
                  <p className="text-[11px] text-red-600 mt-1.5 mb-0">{removedImageIds.length} image(s) marked for removal.</p>
                )}
              </div>
            )}

            <ImageUploadZone id="editImgUpload" onchange={handleNewImages} previews={newPreviews} onRemove={removeNewImage} label="Add More Images" />

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelCls}>Product Name</label>
                <input name="product_name" value={editForm.product_name} onChange={handleEditChange} required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <CategorySelect name="category_id" value={editForm.category_id} onChange={handleEditChange} disabled={categoriesLoading} categories={categories} />
              </div>
              <div>
                <label className={labelCls}>Stocks</label>
                <input type="number" name="product_stocks" value={editForm.product_stocks} onChange={handleEditChange} required className={inputCls} min="0" />
              </div>
              <div>
                <label className={labelCls}>Price (₱)</label>
                <input type="number" step="0.01" name="price" value={editForm.price} onChange={handleEditChange} required className={inputCls} min="0" />
              </div>
            </div>
            <div className="mb-3">
              <label className={labelCls}>Description</label>
              <textarea name="description" value={editForm.description} onChange={handleEditChange} className={`${inputCls} h-20 resize-y`} />
            </div>
            <SaleToggle checked={editForm.isSale} onChange={handleEditChange} name="isSale" />
            <div className="flex gap-2.5">
              <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-lg bg-white text-gray-700 text-sm font-semibold cursor-pointer hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className={`flex-[2] py-2.5 border-none rounded-lg text-white text-sm font-bold shadow-[0_2px_8px_rgba(21,93,252,0.3)] transition-colors ${saving ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 cursor-pointer"}`}>
                {saving ? "Saving…" : "💾 Save Changes"}
              </button>
            </div>
          </form>
        </Overlay>
      )}

      {/* ══ DELETE MODAL ══ */}
      {showDeleteModal && activeProduct && (
        <Overlay onClose={() => setShowDeleteModal(false)}>
          <div className="px-6 py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-[26px] mx-auto mb-4">🗑️</div>
            <h3 className="m-0 mb-2 text-[17px] font-bold text-slate-900">Delete Product?</h3>
            <p className="m-0 mb-6 text-sm text-slate-500 leading-relaxed">
              Are you sure you want to delete <strong>{activeProduct.product_name ?? activeProduct.name}</strong>?<br />This action cannot be undone.
            </p>
            <div className="flex gap-2.5">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-lg bg-white text-gray-700 text-sm font-semibold cursor-pointer hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className={`flex-1 py-2.5 border-none rounded-lg text-white text-sm font-bold transition-colors ${deleting ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 cursor-pointer"}`}>
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ══ MAIN CONTENT ══ */}
      <main className="flex-1 px-5 py-6 overflow-x-hidden min-w-0">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden bg-transparent border-none text-[22px] cursor-pointer text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <h1 className="text-xl font-bold text-gray-900 m-0">List of Products</h1>
          </div>
          <div className="flex gap-2.5">
            <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors">
              ↑ Export
            </button>
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-4 py-2 border-none rounded-lg bg-blue-600 text-white text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors">
              + Add Product
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5">
          {[
            { label:"Total Product", value:productStats.total,      bg:"bg-blue-50",   accent:"text-blue-600",   icon:"📦" },
            { label:"In Stocks",     value:productStats.inStock,     bg:"bg-emerald-50",accent:"text-emerald-600",icon:"✅" },
            { label:"Low Stocks",    value:productStats.lowStock,    bg:"bg-amber-50",  accent:"text-amber-600",  icon:"⚠️" },
            { label:"Out of Stock",  value:productStats.outOfStock,  bg:"bg-red-50",    accent:"text-red-600",    icon:"❌" },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl px-4 py-4 flex items-center justify-between shadow-sm">
              <div>
                <div className={`text-2xl font-bold ${stat.accent}`}>{stat.value}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{stat.label}</div>
              </div>
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center text-lg`}>{stat.icon}</div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

          {/* Filters */}
          <div className="px-4 py-3 border-b border-gray-100 flex gap-2.5 flex-wrap items-center">
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 flex-1 min-w-[160px] max-w-[280px]">
              <span className="text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search for Product"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="border-none bg-transparent outline-none text-xs w-full text-gray-700 placeholder-gray-400"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 text-xs text-gray-700 cursor-pointer outline-none"
            >
              <option value="All">All Categories</option>
              {categories.map(cat => {
                const label = cat.name ?? cat.category_name ?? cat.title ?? "";
                return <option key={cat.id ?? cat.category_id} value={label}>{label}</option>;
              })}
            </select>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 text-xs text-gray-700 cursor-pointer outline-none"
            >
              <option value="A-Z">Sort By A-Z</option>
              <option value="Z-A">Sort By Z-A</option>
            </select>
            <button
              onClick={() => { setSearchTerm(""); setSelectedCategory("All"); setSortOrder("A-Z"); }}
              className="flex items-center gap-1 border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-xs text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              ✕ Clear
            </button>
          </div>

          <div className="overflow-x-auto">
            {productsLoading ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                <div className="text-4xl mb-3">⟳</div>Loading products…
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                <div className="text-4xl mb-3">📦</div>No products found
              </div>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === products.length && products.length > 0}
                        onChange={toggleSelectAll}
                        className="cursor-pointer w-[15px] h-[15px]"
                      />
                    </th>
                    {["Product","Category","Size/Color","Status"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">{h}</th>
                    ))}
                    {["Stocks","Price"].map(h => (
                      <th key={h} className="px-4 py-3 text-right font-semibold text-gray-700 whitespace-nowrap">{h}</th>
                    ))}
                    <th className="px-4 py-3 text-center font-semibold text-gray-700 whitespace-nowrap">Actions</th>
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
                    const isSelected = selectedProducts.includes(product.product_id);
                    return (
                      <tr
                        key={product.product_id ?? index}
                        className={`border-b border-gray-100 hover:bg-blue-50/30 transition-colors ${isSelected ? "bg-blue-50" : index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                      >
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(product.product_id)} className="cursor-pointer w-[15px] h-[15px]" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-[38px] h-[38px] rounded-lg bg-gray-100 flex items-center justify-center text-lg flex-shrink-0 overflow-hidden border border-gray-200">
                              {thumb ? <img src={thumb} alt={name} className="w-full h-full object-cover" /> : "📄"}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 whitespace-nowrap">{name}</div>
                              {product.isSale == 1 && (
                                <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-semibold">SALE</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{category}</td>
                        <td className="px-4 py-3 text-gray-500">{size}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-block whitespace-nowrap ${getStatusClasses(status)}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700 font-medium">{stock}</td>
                        <td className="px-4 py-3 text-right text-gray-700 font-medium">₱{price.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => openView(product)} className="px-2.5 py-1 rounded-md border border-blue-200 bg-blue-50 text-blue-600 text-[11px] font-semibold cursor-pointer whitespace-nowrap hover:opacity-75 transition-opacity">
                              👁 View
                            </button>
                            <button onClick={() => openEdit(product)} className="px-2.5 py-1 rounded-md border border-gray-300 bg-white text-gray-700 text-[11px] font-semibold cursor-pointer hover:opacity-75 transition-opacity">
                              ✏️ Edit
                            </button>
                            <button onClick={() => openDelete(product)} className="px-2.5 py-1 rounded-md border border-red-300 bg-red-50 text-red-600 text-sm cursor-pointer leading-none hover:opacity-75 transition-opacity">
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

          {/* Footer */}
          <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>Showing {filteredProducts.length} of {products.length} products</span>
            <div className="flex gap-1.5">
              {[1, 2, 3].map(p => (
                <button key={p} className={`w-7 h-7 rounded-md text-xs font-medium cursor-pointer transition-colors ${p === 1 ? "bg-blue-600 text-white border-none" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminProducts;