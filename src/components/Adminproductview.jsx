import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminNav from "../components/AdminNav";
import axios from "axios";

const BASE = "http://127.0.0.1:8000";

const AdminProductView = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen]         = useState(false);
  const [product, setProduct]                 = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [activeImg, setActiveImg]             = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting]               = useState(false);

  // ── Edit state ──
  const [editMode, setEditMode]               = useState(false);
  const [categories, setCategories]           = useState([]);
  const [saving, setSaving]                   = useState(false);
  const [editForm, setEditForm]               = useState({
    product_name: "", category_id: "", product_stocks: "",
    description: "", price: "", isSale: false,
  });
  const [newImages, setNewImages]             = useState([]);
  const [newPreviews, setNewPreviews]         = useState([]);
  const [removedImageIds, setRemovedImageIds] = useState([]);

  useEffect(() => {
    fetchProduct();
    fetchCategories();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res  = await axios.get(`${BASE}/api/admin/products/${id}`, { withCredentials: true });
      const data = res.data?.data ?? res.data?.product ?? res.data;
      setProduct(data);
      setEditForm({
        product_name:   data.product_name   ?? data.name         ?? "",
        category_id:    data.category_id    ?? data.category?.id ?? "",
        product_stocks: data.product_stocks ?? data.stock        ?? "",
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
      const res  = await axios.get(`${BASE}/api/categories`, { withCredentials: true });
      const data = res.data?.categories ?? res.data?.data ?? res.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const deriveStatus = (stock) => {
    const s = Number(stock ?? 0);
    if (s === 0)  return "Out of Stock";
    if (s <= 10)  return "On-Hold";
    return "In Stock";
  };

  const statusClass = {
    "In Stock":     "bg-emerald-100 text-emerald-600 border border-emerald-300",
    "On-Hold":      "bg-amber-100   text-amber-600   border border-amber-300",
    "Out of Stock": "bg-red-100     text-red-600     border border-red-300",
  };

  // ── Delete ──
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${BASE}/api/admin/products/${id}`, { withCredentials: true });
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

  const toggleRemoveExisting = (imgId) => {
    setRemovedImageIds(prev =>
      prev.includes(imgId) ? prev.filter(x => x !== imgId) : [...prev, imgId]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData();
    formData.append("_method",        "PUT");
    formData.append("product_name",   editForm.product_name);
    formData.append("category_id",    editForm.category_id);
    formData.append("product_stocks", editForm.product_stocks);
    formData.append("description",    editForm.description);
    formData.append("price",          editForm.price);
    formData.append("isSale",         editForm.isSale ? 1 : 0);
    removedImageIds.forEach(imgId => formData.append("remove_images[]", imgId));
    newImages.forEach(img => formData.append("images[]", img));
    try {
      await axios.post(`${BASE}/api/admin/products/${id}`, formData, { withCredentials: true });
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

  const cancelEdit = () => {
    setEditMode(false);
    setNewImages([]);
    setNewPreviews([]);
    setRemovedImageIds([]);
  };

  const images    = product?.images ?? [];
  const mainImage = images[activeImg]?.image_path
    ? `${BASE}/storage/${images[activeImg].image_path}`
    : null;

  return (
    <div className="flex min-h-screen bg-[#F0F7F2] font-[Segoe_UI,system-ui,sans-serif]">
      <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* ─── DELETE MODAL ─── */}
      {showDeleteModal && (
          <div className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm flex items-center justify-center z-[1100] p-4">
            <div data-overlay className="bg-white w-full max-w-[400px] rounded-2xl p-7 shadow-2xl text-center">
            <div className="flex items-center justify-center mx-auto mb-4 text-2xl bg-red-100 rounded-full w-13 h-13">🗑️</div>
            <h3 className="mb-2 text-base font-bold text-slate-900">Delete Product?</h3>
            <p className="text-[13px] text-slate-500 leading-relaxed mb-6">
              Are you sure you want to delete <strong>{product?.product_name ?? product?.name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg bg-white text-gray-700 text-[13px] font-semibold cursor-pointer hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={`flex-1 py-2.5 border-none rounded-lg text-white text-[13px] font-bold transition-colors ${deleting ? "bg-red-300 cursor-not-allowed" : "bg-red-600 cursor-pointer hover:bg-red-700"}`}
              >
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 px-5 py-6 overflow-x-hidden">

        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <button
              className="md:hidden bg-transparent border-none text-[22px] cursor-pointer text-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <button
              onClick={() => navigate("/admin/products")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 rounded-lg bg-white text-gray-700 text-[13px] font-medium cursor-pointer hover:bg-slate-100 transition-colors"
            >
              ← Back
            </button>
            <h1 className="m-0 text-xl font-bold text-gray-900">Product Detail</h1>
          </div>
          {!editMode && (
            <div className="flex gap-2">
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-[13px] font-semibold cursor-pointer hover:bg-blue-50 transition-colors"
              >
                ✏️ Edit Product
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 border border-red-300 rounded-lg bg-red-50 text-red-600 text-[13px] font-semibold cursor-pointer hover:bg-red-100 transition-colors"
              >
                🗑 Delete
              </button>
            </div>
          )}
        </div>

        {/* ─── LOADING ─── */}
        {loading ? (
          <div className="py-20 text-base text-center text-slate-400">
            <div className="mb-4 text-5xl">⟳</div>
            Loading product…
          </div>

        /* ─── NOT FOUND ─── */
        ) : !product ? (
          <div className="py-20 text-base text-center text-slate-400">
            <div className="mb-4 text-5xl">😕</div>
            Product not found.
          </div>

        /* ─── EDIT FORM ─── */
        ) : editMode ? (
          <div className="overflow-hidden bg-white shadow-sm rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h2 className="m-0 text-base font-bold text-slate-900">Edit Product</h2>
                <p className="mt-0.5 text-[12px] text-slate-400">Update the product details below</p>
              </div>
              <button
                onClick={cancelEdit}
                className="flex items-center justify-center w-8 h-8 text-base transition-colors border rounded-lg cursor-pointer border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6">

              {/* Existing Images */}
              {images.length > 0 && (
                <div className="mb-5">
                  <label className="block text-[11px] font-semibold text-gray-700 mb-2 uppercase tracking-wide">Current Images</label>
                  <p className="text-[11px] text-slate-400 mt-0 mb-2.5">Click an image to mark it for removal</p>
                  <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))" }}>
                    {images.map((img, i) => {
                      const src     = `${BASE}/storage/${img.image_path}`;
                      const removed = removedImageIds.includes(img.id);
                      return (
                        <div
                          key={img.id}
                          onClick={() => toggleRemoveExisting(img.id)}
                          className={`relative rounded-lg overflow-hidden aspect-square cursor-pointer transition-all ${removed ? "border-2 border-red-600" : i === 0 ? "border-2 border-[#155DFC]" : "border border-slate-200"}`}
                        >
                          <img
                            src={src}
                            alt={`img-${i}`}
                            className={`w-full h-full object-cover block transition-opacity ${removed ? "opacity-35" : "opacity-100"}`}
                          />
                          {i === 0 && !removed && (
                            <div className="absolute bottom-0 left-0 right-0 bg-[#155DFC] text-white text-[9px] font-bold text-center py-0.5">MAIN</div>
                          )}
                          {removed && (
                            <div className="absolute inset-0 flex items-center justify-center text-xl bg-red-600/15">🗑</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {removedImageIds.length > 0 && (
                    <p className="text-[11px] text-red-600 mt-1.5">{removedImageIds.length} image(s) will be removed on save.</p>
                  )}
                </div>
              )}

              {/* Add New Images */}
              <div className="mb-5">
                <label className="block text-[11px] font-semibold text-gray-700 mb-2 uppercase tracking-wide">Add More Images</label>
                <label
                  htmlFor="newImgUpload"
                  className={`block border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer bg-slate-50 hover:border-[#155DFC] transition-colors ${newPreviews.length > 0 ? "mb-2.5" : ""}`}
                >
                  <div className="mb-1 text-xl">➕</div>
                  <div className="text-xs font-semibold text-gray-700">Upload additional images</div>
                  <input id="newImgUpload" type="file" multiple accept="image/*" onChange={handleNewImages} className="hidden" />
                </label>
                {newPreviews.length > 0 && (
                  <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))" }}>
                    {newPreviews.map((src, i) => (
                      <div key={i} className="relative rounded-lg overflow-hidden aspect-square border border-dashed border-[#155DFC] bg-blue-50">
                        <img src={src} alt={`new-${i}`} className="block object-cover w-full h-full" />
                        <div className="absolute top-0 left-0 right-0 bg-[#155DFC]/70 text-white text-[9px] font-bold text-center py-0.5">NEW</div>
                        <button
                          type="button"
                          onClick={() => removeNewImage(i)}
                          className="absolute top-1 right-1 w-[18px] h-[18px] rounded-full bg-black/55 text-white border-none text-[11px] cursor-pointer flex items-center justify-center hover:bg-black/75 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fields */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Product Name</label>
                  <input
                    name="product_name"
                    value={editForm.product_name}
                    onChange={handleEditChange}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] text-slate-900 bg-white outline-none focus:border-[#155DFC] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Category</label>
                  <div className="relative">
                    <select
                      name="category_id"
                      value={editForm.category_id}
                      onChange={handleEditChange}
                      required
                      className="w-full px-3 py-2 pr-8 border border-slate-200 rounded-lg text-[13px] text-slate-900 bg-white outline-none appearance-none cursor-pointer focus:border-[#155DFC] transition-colors"
                    >
                      <option value="" disabled>Select a category</option>
                      {categories.map(cat => (
                        <option key={cat.id ?? cat.category_id} value={cat.id ?? cat.category_id}>
                          {cat.name ?? cat.category_name ?? cat.title}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[11px]">▾</div>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Stocks</label>
                  <input
                    type="number"
                    name="product_stocks"
                    value={editForm.product_stocks}
                    onChange={handleEditChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] text-slate-900 bg-white outline-none focus:border-[#155DFC] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Price (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={editForm.price}
                    onChange={handleEditChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] text-slate-900 bg-white outline-none focus:border-[#155DFC] transition-colors"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-[11px] font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Description</label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] text-slate-900 bg-white outline-none resize-y h-[90px] focus:border-[#155DFC] transition-colors"
                />
              </div>

              {/* Toggle */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-3 mb-6">
                <div>
                  <div className="text-[13px] font-semibold text-gray-700">On Sale</div>
                  <div className="text-[11px] text-slate-400">Show a sale badge on this product</div>
                </div>
                <label className="relative inline-block w-10 h-[22px] cursor-pointer">
                  <input
                    type="checkbox"
                    name="isSale"
                    checked={editForm.isSale}
                    onChange={handleEditChange}
                    className="absolute w-0 h-0 opacity-0"
                  />
                  <div className={`absolute inset-0 rounded-full transition-colors duration-200 ${editForm.isSale ? "bg-[#155DFC]" : "bg-slate-300"}`} />
                  <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${editForm.isSale ? "left-[21px]" : "left-[3px]"}`} />
                </label>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 py-3 border border-slate-200 rounded-lg bg-white text-gray-700 text-[13px] font-semibold cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`flex-[2] py-3 border-none rounded-lg text-white text-[13px] font-bold shadow-[0_2px_8px_rgba(21,93,252,0.3)] transition-colors ${saving ? "bg-blue-300 cursor-not-allowed" : "bg-[#155DFC] cursor-pointer hover:bg-blue-700"}`}
                >
                  {saving ? "Saving…" : "💾 Save Changes"}
                </button>
              </div>
            </form>
          </div>

        /* ─── VIEW MODE ─── */
        ) : (
          <div className="grid grid-cols-2 gap-5">

            {/* Left – Image Gallery */}
            <div className="overflow-hidden bg-white shadow-sm rounded-2xl">
              {/* Main image */}
              <div className="relative w-full overflow-hidden bg-slate-50 aspect-square">
                {mainImage ? (
                  <img src={mainImage} alt="Product" className="block object-contain w-full h-full" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-7xl text-slate-200">📄</div>
                )}
                {product.isSale == 1 && (
                  <div className="absolute top-3 left-3 bg-amber-400 text-white text-[11px] font-bold px-2.5 py-1 rounded-full tracking-wide">SALE</div>
                )}
                <div className="absolute top-3 right-3">
                  {(() => {
                    const st = deriveStatus(product.product_stocks ?? product.stock);
                    return (
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusClass[st] ?? statusClass["On-Hold"]}`}>
                        {st}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-slate-100">
                  {images.map((img, i) => {
                    const src = `${BASE}/storage/${img.image_path}`;
                    return (
                      <button
                        key={img.id}
                        onClick={() => setActiveImg(i)}
                        className={`w-14 h-14 rounded-lg overflow-hidden p-0 cursor-pointer bg-slate-50 flex-shrink-0 transition-all ${i === activeImg ? "border-2 border-[#155DFC]" : "border border-slate-200 hover:border-[#155DFC]"}`}
                      >
                        <img src={src} alt={`thumb-${i}`} className="block object-cover w-full h-full" />
                      </button>
                    );
                  })}
                </div>
              )}
              {images.length === 0 && (
                <div className="px-4 py-4 text-xs text-center border-t border-slate-100 text-slate-400">No images uploaded</div>
              )}
            </div>

            {/* Right – Details */}
            <div className="flex flex-col gap-4">

              {/* Main info card */}
              <div className="p-6 bg-white shadow-sm rounded-2xl">
                <div className="mb-1">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">
                    {product.category?.name ?? product.category_name ?? "Uncategorized"}
                  </span>
                </div>
                <h2 className="m-0 mb-3 text-[22px] font-bold text-slate-900 leading-snug">
                  {product.product_name ?? product.name}
                </h2>
                <div className="text-[28px] font-extrabold text-[#155DFC] mb-4">
                  ₱{parseFloat(product.price ?? 0).toFixed(2)}
                </div>
                <p className="m-0 text-[13px] text-gray-500 leading-relaxed">
                  {product.description || <em className="text-slate-300">No description provided.</em>}
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Stock",    value: product.product_stocks ?? product.stock ?? 0,            icon: "📦" },
                  { label: "Category", value: product.category?.name ?? product.category_name ?? "—",  icon: "🏷️" },
                  { label: "Status",   value: deriveStatus(product.product_stocks ?? product.stock),   icon: "🔄" },
                  { label: "On Sale",  value: product.isSale == 1 ? "Yes" : "No",                      icon: "🏷" },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 p-4 bg-white shadow-sm rounded-xl">
                    <div className="w-[38px] h-[38px] rounded-[10px] bg-[#F0F7F2] flex items-center justify-center text-lg flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{item.label}</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Metadata */}
              <div className="px-5 py-4 bg-white shadow-sm rounded-xl">
                <div className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-3">Product Info</div>
                {[
                  ["Product ID",   `#${product.id}`],
                  ["Created",      product.created_at ? new Date(product.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : "—"],
                  ["Last Updated", product.updated_at ? new Date(product.updated_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : "—"],
                  ["Images",       `${images.length} image${images.length !== 1 ? "s" : ""}`],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-b-0">
                    <span className="text-xs text-slate-400">{label}</span>
                    <span className="text-xs font-medium text-gray-700">{val}</span>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div className="flex gap-2.5">
                <button
                  onClick={() => setEditMode(true)}
                  className="flex-1 py-3 border-none rounded-xl bg-[#155DFC] text-white text-[13px] font-bold cursor-pointer shadow-[0_2px_8px_rgba(21,93,252,0.3)] hover:bg-blue-700 transition-colors"
                >
                  ✏️ Edit Product
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-3 border border-red-300 rounded-xl bg-red-50 text-red-600 text-[13px] font-semibold cursor-pointer hover:bg-red-100 transition-colors"
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminProductView;