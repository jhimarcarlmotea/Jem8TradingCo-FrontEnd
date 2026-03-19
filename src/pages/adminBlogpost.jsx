import { useEffect, useState } from "react";
import AdminNav from "../components/AdminNav";
import axios from "axios";

const BASE = "http://127.0.0.1:8000";

const CATEGORIES = ["All", "Announcement", "Travel Blog", "Business Trips", "Product Updates"];

const categoryMap = {
  All:              "All Posts",
  Announcement:     "Announcements",
  "Travel Blog":    "Travel Blog",
  "Business Trips": "Business Trips",
  "Product Updates":"Product Updates",
};

// ── Shared input class ────────────────────────────────────────────────────────
const inputCls = "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white outline-none box-border font-[inherit]";
const labelCls = "block text-[11px] font-semibold text-gray-700 mb-1.5 uppercase tracking-wide";

// ── Sub-components ────────────────────────────────────────────────────────────
function Overlay({ children, onClose, wide }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white w-full ${wide ? "max-w-[820px]" : "max-w-[580px]"} rounded-2xl shadow-2xl max-h-[94vh] overflow-y-auto`}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, subtitle, onClose }) {
  return (
    <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
      <div>
        <h2 className="m-0 text-[17px] font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 mb-0 text-xs text-slate-400">{subtitle}</p>}
      </div>
      <button
        onClick={onClose}
        className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-lg cursor-pointer flex items-center justify-center leading-none hover:bg-slate-100 transition-colors"
      >×</button>
    </div>
  );
}

function ImageUploadZone({ id, onChange, preview, onRemove, label }) {
  return (
    <div className="mb-5">
      <label className={`${labelCls} mb-2`}>{label ?? "Cover Image"}</label>
      <label
        htmlFor={id}
        className={`block border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer bg-slate-50 transition-colors hover:border-blue-600 ${preview ? "mb-2.5" : ""}`}
      >
        {preview ? (
          <div className="relative inline-block">
            <img src={preview} alt="preview" className="max-h-40 max-w-full rounded-lg object-cover" />
          </div>
        ) : (
          <>
            <div className="text-[26px] mb-1">🖼️</div>
            <div className="text-sm font-semibold text-gray-700">Click to upload image</div>
            <div className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WEBP</div>
          </>
        )}
        <input id={id} type="file" accept="image/*" onChange={onChange} className="hidden" />
      </label>
      {preview && (
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-red-600 bg-transparent border-none cursor-pointer p-0 font-medium hover:underline"
        >
          ✕ Remove image
        </button>
      )}
    </div>
  );
}

function CategorySelect({ name, value, onChange }) {
  return (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        required
        className={`${inputCls} appearance-none pr-8 cursor-pointer ${value ? "text-slate-900" : "text-gray-400"}`}
      >
        <option value="" disabled>Select a category</option>
        {CATEGORIES.filter((c) => c !== "All").map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[11px]">▾</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminBlogpost() {
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [posts, setPosts]                   = useState([]);
  const [loading, setLoading]               = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch]                 = useState("");

  const [showAddModal, setShowAddModal]         = useState(false);
  const [showViewModal, setShowViewModal]       = useState(false);
  const [showEditModal, setShowEditModal]       = useState(false);
  const [showDeleteModal, setShowDeleteModal]   = useState(false);
  const [activePost, setActivePost]             = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [error, setError]           = useState(null);

  const emptyForm = { title: "", description: "", category: "", date: "", content: "" };
  const [addForm, setAddForm]       = useState(emptyForm);
  const [addPreview, setAddPreview] = useState(null);
  const [addFile, setAddFile]       = useState(null);

  const [editForm, setEditForm]       = useState(emptyForm);
  const [editPreview, setEditPreview] = useState(null);
  const [editFile, setEditFile]       = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  // ── API ───────────────────────────────────────────────────────────────────
  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await axios.get(`${BASE}/api/blogs`, { withCredentials: true, headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" } });
      const data = res.data?.data ?? res.data?.posts ?? res.data;
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      setError("Failed to load posts. Check API connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = posts.filter((p) => {
    const matchCat    = activeCategory === "All" || (p.category ?? p.category_name) === activeCategory;
    const matchSearch = (p.title ?? "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const counts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = cat === "All" ? posts.length : posts.filter((p) => (p.category ?? p.category_name) === cat).length;
    return acc;
  }, {});

  const resolveImg = (post) => {
    if (!post) return null;
    if (post.image_path) return `${BASE}/storage/${post.image_path}`;
    if (post.image)      return post.image.startsWith("http") ? post.image : `${BASE}/storage/${post.image}`;
    return null;
  };

  // ── Modal openers ─────────────────────────────────────────────────────────
  const openView = (post) => { setActivePost(post); setShowViewModal(true); };

  const toInputDate = (val) => {
    if (!val) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const d = new Date(val);
    return isNaN(d) ? "" : d.toISOString().slice(0, 10);
  };

  const openEdit = (post) => {
    setActivePost(post);
    setEditForm({
      title:       post.title       ?? "",
      description: post.description ?? post.excerpt ?? "",
      category:    post.category    ?? post.category_name ?? "",
      date:        toInputDate(post.date ?? post.published_at ?? ""),
      content:     post.content     ?? post.body          ?? "",
    });
    setEditPreview(resolveImg(post));
    setEditFile(null);
    setRemoveImage(false);
    setShowEditModal(true);
  };

  const openDelete = (post) => { setActivePost(post); setShowDeleteModal(true); };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAddChange  = (e) => setAddForm((f)  => ({ ...f, [e.target.name]: e.target.value }));
  const handleEditChange = (e) => setEditForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleAddImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAddFile(file);
    setAddPreview(URL.createObjectURL(file));
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditFile(file);
    setEditPreview(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(addForm).forEach(([k, v]) => fd.append(k, v));
      if (addFile) fd.append("image", addFile);
      await axios.post(`${BASE}/api/blogs`, fd, { withCredentials: true, headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest", "Content-Type": "multipart/form-data" } });
      setShowAddModal(false);
      setAddForm(emptyForm);
      setAddPreview(null);
      setAddFile(null);
      fetchPosts();
    } catch (err) {
      alert(err.response?.data?.message ?? "Failed to create post.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!activePost) return;
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(editForm).forEach(([k, v]) => fd.append(k, v));
      if (editFile)    fd.append("image", editFile);
      if (removeImage) fd.append("remove_image", "1");
      fd.append("_method", "PUT");
      const postId = activePost.id ?? activePost.post_id;
      await axios.post(`${BASE}/api/blogs/${postId}`, fd, { withCredentials: true, headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest", "Content-Type": "multipart/form-data" } });
      setShowEditModal(false);
      fetchPosts();
    } catch (err) {
      alert(err.response?.data?.message ?? "Failed to update post.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activePost) return;
    setDeleting(true);
    try {
      const postId = activePost.id ?? activePost.post_id;
      await axios.delete(`${BASE}/api/blogs${postId}`, { withCredentials: true, headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" } });
      setShowDeleteModal(false);
      setActivePost(null);
      fetchPosts();
    } catch (err) {
      alert(err.response?.data?.message ?? "Failed to delete post.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Shared modal button classes ───────────────────────────────────────────
  const btnCancel  = "flex-1 py-2.5 border border-slate-200 rounded-lg bg-white text-gray-700 text-sm font-semibold cursor-pointer hover:bg-gray-50 transition-colors";
  const btnPrimary = (disabled) => `flex-1 py-2.5 border-none rounded-lg text-white text-sm font-semibold transition-colors ${disabled ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 cursor-pointer"}`;

  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>

      <div className="flex min-h-screen bg-[#F0F7F2] font-sans">
        <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* ── ADD MODAL ── */}
        {showAddModal && (
          <Overlay onClose={() => setShowAddModal(false)}>
            <ModalHeader title="New Blog Post" subtitle="Fill in the details to publish a new post" onClose={() => setShowAddModal(false)} />
            <form onSubmit={handleAddSubmit} className="px-6 pt-5 pb-6">
              <ImageUploadZone id="addImg" onChange={handleAddImageChange} preview={addPreview} onRemove={() => { setAddPreview(null); setAddFile(null); }} />
              <Field label="Title">
                <input name="title" value={addForm.title} onChange={handleAddChange} required placeholder="e.g. Jem 8 at MSME Expo 2025" className={inputCls} />
              </Field>
              <Field label="Description / Excerpt">
                <textarea name="description" value={addForm.description} onChange={handleAddChange} placeholder="Short summary shown on cards…" className={`${inputCls} h-[72px] resize-y`} />
              </Field>
              <div className="grid grid-cols-2 gap-3.5">
                <Field label="Category">
                  <CategorySelect name="category" value={addForm.category} onChange={handleAddChange} />
                </Field>
                <Field label="Date">
                  <input type="date" name="date" value={addForm.date} onChange={handleAddChange} className={inputCls} />
                </Field>
              </div>
              <Field label="Content (optional)">
                <textarea name="content" value={addForm.content} onChange={handleAddChange} placeholder="Full post content…" className={`${inputCls} h-[120px] resize-y`} />
              </Field>
              <div className="flex gap-2.5 mt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className={btnCancel}>Cancel</button>
                <button type="submit" disabled={submitting} className={btnPrimary(submitting)}>
                  {submitting ? "Publishing…" : "Publish Post"}
                </button>
              </div>
            </form>
          </Overlay>
        )}

        {/* ── VIEW MODAL ── */}
        {showViewModal && activePost && (() => {
          const imgSrc = resolveImg(activePost);
          return (
            <Overlay wide onClose={() => setShowViewModal(false)}>
              <ModalHeader title="Post Details" subtitle={activePost.title} onClose={() => setShowViewModal(false)} />
              <div className="p-6">
                {imgSrc && (
                  <div className="mb-5 rounded-xl overflow-hidden max-h-[280px]">
                    <img src={imgSrc} alt={activePost.title} className="w-full object-cover block max-h-[280px]" />
                  </div>
                )}
                <div className="flex gap-2.5 flex-wrap mb-4">
                  <span className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-semibold border border-blue-200">
                    {activePost.category ?? activePost.category_name ?? "Uncategorized"}
                  </span>
                  {(activePost.date ?? activePost.published_at) && (
                    <span className="text-xs px-3 py-1 bg-slate-50 text-slate-500 rounded-full border border-slate-200">
                      📅 {activePost.date ?? activePost.published_at}
                    </span>
                  )}
                </div>
                <h2 className="m-0 mb-2.5 text-xl font-bold text-slate-900 leading-snug">{activePost.title}</h2>
                {(activePost.description ?? activePost.excerpt) && (
                  <p className="m-0 mb-4 text-sm text-slate-500 leading-relaxed">
                    {activePost.description ?? activePost.excerpt}
                  </p>
                )}
                {(activePost.content ?? activePost.body) && (
                  <>
                    <div className="h-px bg-slate-100 my-4" />
                    <div className="text-xs text-gray-700 leading-7 whitespace-pre-wrap">
                      {activePost.content ?? activePost.body}
                    </div>
                  </>
                )}
                <div className="flex gap-2.5 mt-6">
                  <button onClick={() => { setShowViewModal(false); openEdit(activePost); }} className={btnPrimary(false)}>
                    ✏️ Edit Post
                  </button>
                  <button
                    onClick={() => { setShowViewModal(false); openDelete(activePost); }}
                    className="flex-1 py-2.5 border border-red-200 rounded-lg bg-red-50 text-red-600 text-sm font-semibold cursor-pointer hover:bg-red-100 transition-colors"
                  >
                    🗑️ Delete Post
                  </button>
                </div>
              </div>
            </Overlay>
          );
        })()}

        {/* ── EDIT MODAL ── */}
        {showEditModal && activePost && (
          <Overlay onClose={() => setShowEditModal(false)}>
            <ModalHeader title="Edit Post" subtitle={`Editing: ${activePost.title}`} onClose={() => setShowEditModal(false)} />
            <form onSubmit={handleEditSubmit} className="px-6 pt-5 pb-6">
              <ImageUploadZone id="editImg" onChange={handleEditImageChange} preview={editPreview} onRemove={() => { setEditPreview(null); setEditFile(null); setRemoveImage(true); }} />
              <Field label="Title">
                <input name="title" value={editForm.title} onChange={handleEditChange} required className={inputCls} />
              </Field>
              <Field label="Description / Excerpt">
                <textarea name="description" value={editForm.description} onChange={handleEditChange} className={`${inputCls} h-[72px] resize-y`} />
              </Field>
              <div className="grid grid-cols-2 gap-3.5">
                <Field label="Category">
                  <CategorySelect name="category" value={editForm.category} onChange={handleEditChange} />
                </Field>
                <Field label="Date">
                  <input type="date" name="date" value={editForm.date} onChange={handleEditChange} className={inputCls} />
                </Field>
              </div>
              <Field label="Content">
                <textarea name="content" value={editForm.content} onChange={handleEditChange} placeholder="Full post content…" className={`${inputCls} h-[120px] resize-y`} />
              </Field>
              <div className="flex gap-2.5 mt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className={btnCancel}>Cancel</button>
                <button type="submit" disabled={saving} className={btnPrimary(saving)}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </Overlay>
        )}

        {/* ── DELETE MODAL ── */}
        {showDeleteModal && activePost && (
          <Overlay onClose={() => setShowDeleteModal(false)}>
            <div className="px-7 py-8 text-center">
              <div className="text-5xl mb-3">🗑️</div>
              <h3 className="m-0 mb-2 text-lg font-bold text-slate-900">Delete Post?</h3>
              <p className="m-0 mb-1.5 text-sm text-slate-500">
                "<strong>{activePost.title}</strong>"
              </p>
              <p className="m-0 mb-6 text-xs text-slate-400">This action cannot be undone.</p>
              <div className="flex gap-2.5">
                <button onClick={() => setShowDeleteModal(false)} className={btnCancel}>Cancel</button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className={`flex-1 py-2.5 border-none rounded-lg text-white text-sm font-semibold transition-colors ${deleting ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 cursor-pointer"}`}
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </Overlay>
        )}

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 pb-10 overflow-x-hidden">

          {/* Top Bar */}
          <div className="flex items-center justify-between px-7 pt-5 gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden bg-transparent border-none text-xl cursor-pointer text-gray-700 hover:bg-gray-100 px-2 py-1 rounded-md"
                onClick={() => setSidebarOpen(true)}
              >☰</button>
              <h1 className="m-0 text-xl font-bold text-slate-900">Blog Post</h1>
            </div>
            <div className="flex gap-2.5 items-center flex-wrap">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">🔍</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search posts…"
                  className={`${inputCls} pl-8 w-[220px]`}
                />
              </div>
              <button
                onClick={() => { setAddForm(emptyForm); setAddPreview(null); setAddFile(null); setShowAddModal(true); }}
                className="flex items-center gap-1.5 px-4 py-2 border-none rounded-lg bg-blue-600 text-white text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
              >
                + New Post
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-3.5 px-7 py-5 grid-cols-2 md:grid-cols-5">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="bg-white rounded-xl px-4 py-4 shadow-sm border border-slate-100">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  {categoryMap[cat]}
                </div>
                <div className="text-[26px] font-extrabold text-slate-900 leading-none">
                  {loading ? "—" : counts[cat]}
                </div>
                {cat === "All" && (
                  <div className="text-[10px] text-slate-400 mt-0.5 font-semibold tracking-wide">TOTAL</div>
                )}
              </div>
            ))}
          </div>

          {/* Filter Tabs */}
          <div className="px-7 pb-4 flex gap-1.5 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all
                  ${activeCategory === cat
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600"
                  }`}
              >
                {cat}
                <span className="ml-1 text-[11px] opacity-75">({counts[cat]})</span>
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mx-7 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs flex items-center gap-2">
              ⚠️ {error}
              <button onClick={fetchPosts} className="ml-2 text-blue-600 bg-transparent border-none cursor-pointer underline text-xs">
                Retry
              </button>
            </div>
          )}

          {/* Table */}
          <div className="mx-7 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["IMAGE", "TITLE & DESCRIPTION", "CATEGORY", "DATE", "ACTION"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        {[80, 260, 120, 100, 140].map((w, j) => (
                          <td key={j} className="px-4 py-3.5">
                            <div
                              className="rounded-md"
                              style={{
                                height: j === 1 ? "36px" : "16px",
                                width: `${Math.min(w, 140)}px`,
                                background: "#F1F5F9",
                                backgroundImage: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)",
                                backgroundSize: "200% 100%",
                                animation: "shimmer 1.4s infinite",
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                        {search ? `No posts matching "${search}"` : "No posts found."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((post) => {
                      const imgSrc = resolveImg(post);
                      const cat    = post.category ?? post.category_name ?? "—";
                      const date   = post.date ?? post.published_at ?? "—";
                      return (
                        <tr key={post.id ?? post.post_id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                          <td className="px-4 py-3">
                            {imgSrc ? (
                              <img src={imgSrc} alt={post.title} className="w-16 h-12 rounded-lg object-cover block border border-slate-100" onError={(e) => { e.target.style.display = "none"; }} />
                            ) : (
                              <div className="w-16 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-xl text-slate-300">🖼</div>
                            )}
                          </td>
                          <td className="px-4 py-3 max-w-[300px]">
                            <div className="font-semibold text-slate-900 mb-0.5 truncate">{post.title}</div>
                            <div className="text-xs text-slate-400 truncate">{post.description ?? post.excerpt ?? ""}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                              {cat}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{date}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              <button onClick={() => openView(post)} className="px-3 py-1 rounded-md border border-slate-200 bg-slate-50 text-gray-700 text-xs font-semibold cursor-pointer hover:opacity-75 transition-opacity">
                                View
                              </button>
                              <button onClick={() => openEdit(post)} className="px-3 py-1 rounded-md border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold cursor-pointer hover:opacity-75 transition-opacity">
                                Edit
                              </button>
                              <button onClick={() => openDelete(post)} className="px-3 py-1 rounded-md border border-red-200 bg-red-50 text-red-600 text-xs font-semibold cursor-pointer hover:opacity-75 transition-opacity">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer count */}
          {!loading && filtered.length > 0 && (
            <div className="px-7 pt-2.5 text-xs text-slate-400">
              Showing {filtered.length} of {posts.length} post{posts.length !== 1 ? "s" : ""}
            </div>
          )}
        </main>
      </div>
    </>
  );
}