import { useEffect, useRef, useState } from "react";
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

const CATEGORY_ID_MAP = {
  "Announcement":    1,
  "Travel Blog":     2,
  "Business Trips":  3,
  "Product Updates": 4,
};

const inputCls = "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-[13px] text-slate-900 bg-white outline-none box-border font-[inherit] focus:border-blue-500 transition-colors";
const labelCls = "block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide";

function Overlay({ children, onClose, wide }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/55 backdrop-blur-[4px] flex items-center justify-center z-[1000] p-3 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white w-full rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.18)] max-h-[94vh] overflow-y-auto ${wide ? "max-w-[820px]" : "max-w-[580px]"}`}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, subtitle, onClose }) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 bg-white border-b sm:px-6 sm:py-5 border-slate-100 rounded-t-2xl">
      <div className="flex-1 min-w-0 pr-3">
        <h2 className="m-0 text-[15px] sm:text-[17px] font-bold text-slate-900 truncate">{title}</h2>
        {subtitle && <p className="m-0 mt-0.5 text-xs text-slate-400 truncate">{subtitle}</p>}
      </div>
      <button
        onClick={onClose}
        className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-lg transition-colors border rounded-lg cursor-pointer border-slate-200 bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
      >×</button>
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

function CategorySelect({ name, value, onChange }) {
  return (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        required
        className={`${inputCls} appearance-none pr-8 cursor-pointer`}
        style={{ color: value ? "#0F172A" : "#9CA3AF" }}
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

function CategorySelectById({ name, value, onChange }) {
  return (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`${inputCls} appearance-none pr-8 cursor-pointer`}
        style={{ color: value ? "#0F172A" : "#9CA3AF" }}
      >
        <option value="" disabled>Select a category</option>
        {Object.entries(CATEGORY_ID_MAP).map(([label, id]) => (
          <option key={id} value={id}>{label}</option>
        ))}
      </select>
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[11px]">▾</div>
    </div>
  );
}

function StatusSelect({ name, value, onChange }) {
  return (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`${inputCls} appearance-none pr-8 cursor-pointer`}
      >
        <option value="published">Published</option>
        <option value="draft">Draft</option>
      </select>
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[11px]">▾</div>
    </div>
  );
}

function ImagePreviewStrip({ previews, onRemove, id, onChange, label }) {
  return (
    <div className="mb-5">
      <label className={`${labelCls} mb-2`}>{label ?? "Images"}</label>
      {previews.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-2.5">
          {previews.map((p, i) => (
            <div key={i} className="relative">
              <img
                src={p.url}
                alt={`preview-${i}`}
                className="object-cover border rounded-lg border-slate-200"
                style={{ width: "80px", height: "60px" }}
              />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full border-none bg-red-600 text-white text-[10px] cursor-pointer flex items-center justify-center leading-none"
              >×</button>
            </div>
          ))}
        </div>
      )}
      <label
        htmlFor={id}
        className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl p-3.5 cursor-pointer bg-slate-50 hover:border-blue-500 transition-colors"
      >
        <span className="text-xl">🖼️</span>
        <div>
          <div className="text-[13px] font-semibold text-slate-700">Click to add images</div>
          <div className="text-[11px] text-slate-400">PNG, JPG, WEBP — multiple allowed</div>
        </div>
        <input id={id} type="file" accept="image/*" multiple onChange={onChange} className="hidden" />
      </label>
    </div>
  );
}

function SkeletonRows() {
  return Array.from({ length: 4 }).map((_, i) => (
    <tr key={i}>
      {[80, 260, 120, 100, 140].map((w, j) => (
        <td key={j} className="px-4 py-3.5">
          <div
            className="rounded-md animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%]"
            style={{ height: j === 1 ? "36px" : "16px", width: `${Math.min(w, 140)}px` }}
          />
        </td>
      ))}
    </tr>
  ));
}

// ── Mobile Blog Card ──────────────────────────────────────────
function BlogCard({ post, imgSrc, imgCount, catName, onView, onEdit, onDelete }) {
  return (
    <div className="overflow-hidden bg-white border shadow-sm rounded-xl border-slate-100">
      {imgSrc && (
        <div className="relative w-full h-36">
          <img
            src={imgSrc}
            alt={post.blog_title}
            className="object-cover w-full h-full"
            onError={(e) => { e.target.style.display = "none"; }}
          />
          {imgCount > 1 && (
            <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
              +{imgCount - 1} photos
            </span>
          )}
        </div>
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="font-semibold text-slate-900 text-[13px] leading-snug flex-1">{post.blog_title}</div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize border flex-shrink-0
            ${post.status === "published"
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-yellow-50 text-yellow-700 border-yellow-200"
            }`}>
            {post.status ?? "published"}
          </span>
        </div>
        {post.blog_text && (
          <p className="mb-2 text-xs leading-relaxed text-slate-400 line-clamp-2">{post.blog_text}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {catName}
          </span>
          {post.created_at && (
            <span className="text-[10px] text-slate-400">
              {new Date(post.created_at).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="flex gap-1.5 mt-2.5 pt-2.5 border-t border-slate-100">
          <button onClick={onView}
            className="flex-1 py-1.5 text-[11px] font-semibold border border-slate-200 rounded-lg bg-slate-50 text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors">
            👁 View
          </button>
          <button onClick={onEdit}
            className="flex-1 py-1.5 text-[11px] font-semibold border border-blue-200 rounded-lg bg-blue-50 text-blue-700 cursor-pointer hover:bg-blue-100 transition-colors">
            ✏️ Edit
          </button>
          <button onClick={onDelete}
            className="flex-1 py-1.5 text-[11px] font-semibold border border-red-200 rounded-lg bg-red-50 text-red-600 cursor-pointer hover:bg-red-100 transition-colors">
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminBlogpost() {
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [posts, setPosts]               = useState([]);
  const [loading, setLoading]           = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch]             = useState("");

  const [showAddModal, setShowAddModal]       = useState(false);
  const [showViewModal, setShowViewModal]     = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activePost, setActivePost]           = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [error, setError]           = useState(null);

  const emptyForm     = { blog_title: "", blog_text: "", category_name: "", status: "published" };
  const emptyEditForm = { blog_title: "", blog_text: "", category_blog_id: "", status: "published" };

  const [addForm, setAddForm]           = useState(emptyForm);
  const [addPreviews, setAddPreviews]   = useState([]);
  const [addFiles, setAddFiles]         = useState([]);
  const [editForm, setEditForm]         = useState(emptyEditForm);
  const [editPreviews, setEditPreviews] = useState([]);
  const [editFiles, setEditFiles]       = useState([]);
  const [removeImages, setRemoveImages] = useState(false);

  const resolveImg = (post) => {
    if (!post) return null;
    const imgs = post.images;
    if (Array.isArray(imgs) && imgs.length > 0) {
      const path = imgs[0].url;
      if (!path) return null;
      return path.startsWith("http") ? path : `${BASE}/storage/${path}`;
    }
    return null;
  };

  const resolveAllImgs = (post) => {
    if (!post) return [];
    const imgs = post.images;
    if (!Array.isArray(imgs)) return [];
    return imgs.map((img) => {
      const path = img.url ?? img;
      return typeof path === "string" && path.startsWith("http") ? path : `${BASE}/storage/${path}`;
    });
  };

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await axios.get(`${BASE}/api/blogs`, {
        withCredentials: true,
        headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
      });
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

  const getCatName = (post) => post.category?.category_name ?? "Uncategorized";

  const filtered = posts.filter((p) => {
    const matchCat    = activeCategory === "All" || getCatName(p) === activeCategory;
    const matchSearch = (p.blog_title ?? "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const counts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = cat === "All"
      ? posts.length
      : posts.filter((p) => getCatName(p) === cat).length;
    return acc;
  }, {});

  const openView   = (post) => { setActivePost(post); setShowViewModal(true); };
  const openDelete = (post) => { setActivePost(post); setShowDeleteModal(true); };
  const openEdit   = (post) => {
    setActivePost(post);
    setEditForm({
      blog_title:       post.blog_title       ?? "",
      blog_text:        post.blog_text        ?? "",
      category_blog_id: post.category_blog_id ?? "",
      status:           post.status           ?? "published",
    });
    setEditPreviews(resolveAllImgs(post).map((url) => ({ url, file: null })));
    setEditFiles([]);
    setRemoveImages(false);
    setShowEditModal(true);
  };

  const handleAddChange  = (e) => setAddForm((f)  => ({ ...f, [e.target.name]: e.target.value }));
  const handleEditChange = (e) => setEditForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleAddImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setAddFiles((p)    => [...p, ...files]);
    setAddPreviews((p) => [...p, ...files.map((f) => ({ url: URL.createObjectURL(f), file: f }))]);
  };

  const handleEditImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setEditFiles((p)    => [...p, ...files]);
    setEditPreviews((p) => [...p, ...files.map((f) => ({ url: URL.createObjectURL(f), file: f }))]);
    setRemoveImages(false);
  };

  const removeAddPreview  = (idx) => { setAddPreviews((p)  => p.filter((_, i) => i !== idx)); setAddFiles((p)  => p.filter((_, i) => i !== idx)); };
  const removeEditPreview = (idx) => { setEditPreviews((p) => p.filter((_, i) => i !== idx)); setEditFiles((p) => p.filter((_, i) => i !== idx)); };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("blog_title",    addForm.blog_title);
      fd.append("blog_text",     addForm.blog_text);
      fd.append("category_name", addForm.category_name);
      fd.append("status",        addForm.status);
      addFiles.forEach((file) => fd.append("images[]", file));
      await axios.post(`${BASE}/api/blogs`, fd, {
        withCredentials: true,
        headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest", "Content-Type": "multipart/form-data" },
      });
      setShowAddModal(false);
      setAddForm(emptyForm);
      setAddPreviews([]);
      setAddFiles([]);
      fetchPosts();
    } catch (err) {
      console.error("Add failed:", err);
      const errData = err.response?.data;
      const msg = typeof errData?.message === "object"
        ? Object.values(errData.message).flat().join("\n")
        : (errData?.message ?? "Failed to create post.");
      alert(msg);
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
      fd.append("blog_title",       editForm.blog_title);
      fd.append("blog_text",        editForm.blog_text);
      fd.append("category_blog_id", editForm.category_blog_id);
      fd.append("status",           editForm.status);
      fd.append("_method",          "PUT");
      editFiles.forEach((file) => fd.append("images[]", file));
      if (removeImages) fd.append("remove_images", "1");
      await axios.post(`${BASE}/api/blogs/${activePost.blog_id}`, fd, {
        withCredentials: true,
        headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest", "Content-Type": "multipart/form-data" },
      });
      setShowEditModal(false);
      fetchPosts();
    } catch (err) {
      console.error("Edit failed:", err);
      const errData = err.response?.data;
      const msg = typeof errData?.message === "object"
        ? Object.values(errData.message).flat().join("\n")
        : (errData?.message ?? "Failed to update post.");
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activePost) return;
    setDeleting(true);
    try {
      await axios.delete(`${BASE}/api/blogs/${activePost.blog_id}`, {
        withCredentials: true,
        headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
      });
      setShowDeleteModal(false);
      setActivePost(null);
      fetchPosts();
    } catch (err) {
      console.error("Delete failed:", err);
      alert(err.response?.data?.message ?? "Failed to delete post.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F0F7F2] font-sans">
      <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* ADD MODAL */}
      {showAddModal && (
        <Overlay onClose={() => setShowAddModal(false)}>
          <ModalHeader title="New Blog Post" subtitle="Fill in the details to publish a new post" onClose={() => setShowAddModal(false)} />
          <form onSubmit={handleAddSubmit} className="px-4 py-5 sm:px-6">
            <ImagePreviewStrip id="addImg" label="Images" previews={addPreviews} onChange={handleAddImageChange} onRemove={removeAddPreview} />
            <Field label="Title">
              <input name="blog_title" value={addForm.blog_title} onChange={handleAddChange} required placeholder="e.g. Jem 8 at MSME Expo 2025" className={inputCls} />
            </Field>
            <Field label="Content">
              <textarea name="blog_text" value={addForm.blog_text} onChange={handleAddChange} placeholder="Full post content…" rows={5} className={`${inputCls} resize-y`} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Field label="Category">
                <CategorySelect name="category_name" value={addForm.category_name} onChange={handleAddChange} />
              </Field>
              <Field label="Status">
                <StatusSelect name="status" value={addForm.status} onChange={handleAddChange} />
              </Field>
            </div>
            <div className="flex gap-2.5 mt-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-700 text-[13px] font-semibold cursor-pointer hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className={`flex-1 py-2.5 border-none rounded-lg text-white text-[13px] font-semibold transition-colors ${submitting ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 cursor-pointer hover:bg-blue-700"}`}>
                {submitting ? "Publishing…" : "Publish Post"}
              </button>
            </div>
          </form>
        </Overlay>
      )}

      {/* VIEW MODAL */}
      {showViewModal && activePost && (() => {
        const allImgs = resolveAllImgs(activePost);
        const catName = getCatName(activePost);
        return (
          <Overlay wide onClose={() => setShowViewModal(false)}>
            <ModalHeader title="Post Details" subtitle={activePost.blog_title} onClose={() => setShowViewModal(false)} />
            <div className="p-4 sm:p-6">
              {allImgs.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {allImgs.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`img-${i}`}
                      className="rounded-xl border border-slate-100 object-cover max-h-[200px] sm:max-h-[240px] w-full"
                      style={{ width: allImgs.length === 1 ? "100%" : "calc(50% - 4px)" }}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200 rounded-full bg-blue-50">{catName}</span>
                <span className="px-3 py-1 text-xs font-semibold text-green-700 capitalize border border-green-200 rounded-full bg-green-50">{activePost.status ?? "published"}</span>
                {activePost.created_at && (
                  <span className="px-3 py-1 text-xs border rounded-full bg-slate-50 text-slate-500 border-slate-200">
                    📅 {new Date(activePost.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              <h2 className="m-0 mb-3 text-lg font-bold leading-snug sm:text-xl text-slate-900">{activePost.blog_title}</h2>
              {activePost.blog_text && (
                <>
                  <div className="h-px my-4 bg-slate-100" />
                  <div className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">{activePost.blog_text}</div>
                </>
              )}
              <div className="flex gap-2.5 mt-6">
                <button
                  onClick={() => { setShowViewModal(false); openEdit(activePost); }}
                  className="flex-1 py-2.5 border-none rounded-lg bg-blue-600 text-white text-[13px] font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  ✏️ Edit Post
                </button>
                <button
                  onClick={() => { setShowViewModal(false); openDelete(activePost); }}
                  className="flex-1 py-2.5 border border-red-200 rounded-lg bg-red-50 text-red-600 text-[13px] font-semibold cursor-pointer hover:bg-red-100 transition-colors"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </Overlay>
        );
      })()}

      {/* EDIT MODAL */}
      {showEditModal && activePost && (
        <Overlay onClose={() => setShowEditModal(false)}>
          <ModalHeader title="Edit Post" subtitle={`Editing: ${activePost.blog_title}`} onClose={() => setShowEditModal(false)} />
          <form onSubmit={handleEditSubmit} className="px-4 py-5 sm:px-6">
            <ImagePreviewStrip id="editImg" label="Images" previews={editPreviews} onChange={handleEditImageChange} onRemove={removeEditPreview} />
            {editPreviews.length > 0 && (
              <div className="-mt-2.5 mb-4">
                <label className="flex items-center gap-1.5 text-xs text-red-600 cursor-pointer">
                  <input type="checkbox" checked={removeImages} onChange={(e) => setRemoveImages(e.target.checked)} className="accent-red-600" />
                  Remove all existing images on save
                </label>
              </div>
            )}
            <Field label="Title">
              <input name="blog_title" value={editForm.blog_title} onChange={handleEditChange} required className={inputCls} />
            </Field>
            <Field label="Content">
              <textarea name="blog_text" value={editForm.blog_text} onChange={handleEditChange} placeholder="Full post content…" rows={5} className={`${inputCls} resize-y`} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Field label="Category">
                <CategorySelectById name="category_blog_id" value={editForm.category_blog_id} onChange={handleEditChange} />
              </Field>
              <Field label="Status">
                <StatusSelect name="status" value={editForm.status} onChange={handleEditChange} />
              </Field>
            </div>
            <div className="flex gap-2.5 mt-2">
              <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-700 text-[13px] font-semibold cursor-pointer hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className={`flex-1 py-2.5 border-none rounded-lg text-white text-[13px] font-semibold transition-colors ${saving ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 cursor-pointer hover:bg-blue-700"}`}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </Overlay>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && activePost && (
        <Overlay onClose={() => setShowDeleteModal(false)}>
          <div className="px-6 py-8 text-center sm:px-7">
            <div className="mb-3 text-5xl">🗑️</div>
            <h3 className="m-0 mb-2 text-[18px] font-bold text-slate-900">Delete Post?</h3>
            <p className="m-0 mb-1.5 text-sm text-slate-500">
              "<strong className="text-slate-700">{activePost.blog_title}</strong>"
            </p>
            <p className="m-0 mb-6 text-[13px] text-slate-400">This action cannot be undone.</p>
            <div className="flex gap-2.5">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-700 text-[13px] font-semibold cursor-pointer hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className={`flex-1 py-2.5 border-none rounded-lg text-white text-[13px] font-semibold transition-colors ${deleting ? "bg-red-300 cursor-not-allowed" : "bg-red-600 cursor-pointer hover:bg-red-700"}`}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 w-0 min-w-0 pb-10 overflow-x-hidden">

        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 pt-4 pb-0 sm:pt-5 sm:px-7">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-xl bg-transparent border-none cursor-pointer lg:hidden text-slate-700"
            >☰</button>
            <h1 className="m-0 text-[18px] sm:text-xl font-bold text-slate-900">Blog Posts</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-slate-400 pointer-events-none">🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts…"
                className={`${inputCls} pl-8 w-[160px] sm:w-[220px]`}
              />
            </div>
            <button
              onClick={() => { setAddForm(emptyForm); setAddPreviews([]); setAddFiles([]); setShowAddModal(true); }}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 border-none rounded-lg bg-blue-600 text-white text-[13px] font-semibold cursor-pointer hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              + New Post
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3.5 px-3 sm:px-7 py-4 sm:py-5">
          {CATEGORIES.map((cat) => (
            <div key={cat} className="px-3 py-3 bg-white border shadow-sm sm:px-4 sm:py-4 rounded-xl border-slate-100">
              <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1 sm:mb-1.5 leading-tight">{categoryMap[cat]}</div>
              <div className="text-[22px] sm:text-[26px] font-extrabold text-slate-900 leading-none">{loading ? "—" : counts[cat]}</div>
              {cat === "All" && <div className="text-[9px] sm:text-[10px] text-slate-400 mt-1 font-semibold tracking-wide">TOTAL</div>}
            </div>
          ))}
        </div>

        {/* Filter Tabs — horizontal scroll on mobile, no page overflow */}
        <div className="px-3 pb-3 sm:px-7 sm:pb-4">
          <div className="flex gap-2 pb-1 -mb-1 overflow-x-auto flex-nowrap" style={{ scrollbarWidth: "none" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border text-[12px] sm:text-sm font-semibold cursor-pointer transition-all whitespace-nowrap shrink-0
                  ${activeCategory === cat
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-500 border-slate-200 hover:border-blue-400 hover:text-blue-600"
                  }`}
              >
                {cat}
                <span className="ml-1 opacity-75">({counts[cat]})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-3 sm:mx-7 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[13px]">
            ⚠️ {error}
            <button onClick={fetchPosts} className="ml-2.5 text-xs text-blue-600 bg-transparent border-none cursor-pointer underline">Retry</button>
          </div>
        )}

        {/* Mobile card grid */}
        {!loading && filtered.length > 0 && (
          <div className="block px-3 pb-4 sm:hidden">
            <div className="grid grid-cols-1 gap-3">
              {filtered.map((post) => {
                const imgSrc   = resolveImg(post);
                const imgCount = (post.images ?? []).length;
                const catName  = getCatName(post);
                return (
                  <BlogCard
                    key={post.blog_id}
                    post={post}
                    imgSrc={imgSrc}
                    imgCount={imgCount}
                    catName={catName}
                    onView={() => openView(post)}
                    onEdit={() => openEdit(post)}
                    onDelete={() => openDelete(post)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Loading skeleton on mobile */}
        {loading && (
          <div className="block px-3 pb-4 space-y-3 sm:hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="overflow-hidden bg-white border rounded-xl border-slate-100">
                <div className="w-full h-36 animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%]" />
                <div className="p-3 space-y-2">
                  <div className="w-3/4 h-4 rounded-md animate-pulse bg-slate-100" />
                  <div className="w-full h-3 rounded-md animate-pulse bg-slate-100" />
                  <div className="w-1/2 h-3 rounded-md animate-pulse bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state (all screen sizes) */}
        {!loading && filtered.length === 0 && (
          <div className="mx-3 sm:mx-7 bg-white rounded-[14px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="py-12 text-sm text-center text-slate-400">
              {search ? `No posts matching "${search}"` : "No posts found."}
            </div>
          </div>
        )}

        {/* Desktop Table — hidden on mobile */}
        {!loading && filtered.length > 0 && (
          <div className="hidden sm:block mx-7 bg-white rounded-[14px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead className="border-b bg-slate-50 border-slate-100">
                  <tr>
                    {["IMAGE", "TITLE & CONTENT", "CATEGORY", "STATUS", "ACTION"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 tracking-[0.06em] whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((post) => {
                    const imgSrc   = resolveImg(post);
                    const catName  = getCatName(post);
                    const imgCount = (post.images ?? []).length;
                    return (
                      <tr key={post.blog_id} className="border-b border-slate-50 last:border-b-0 hover:[&_td]:bg-[#F8FAFF] transition-colors">
                        <td className="px-4 py-3">
                          {imgSrc ? (
                            <div className="relative w-16 h-12">
                              <img
                                src={imgSrc}
                                alt={post.blog_title}
                                className="block object-cover w-16 h-12 border rounded-lg border-slate-100"
                                onError={(e) => { e.target.style.display = "none"; }}
                              />
                              {imgCount > 1 && (
                                <span className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[9px] font-bold px-1 py-0.5 rounded">
                                  +{imgCount - 1}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-16 h-12 text-xl rounded-lg bg-slate-100 text-slate-300">🖼</div>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[300px]">
                          <div className="font-semibold text-slate-900 mb-0.5 truncate">{post.blog_title}</div>
                          <div className="text-xs truncate text-slate-400">{post.blog_text ?? ""}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                            {catName}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap capitalize border
                            ${post.status === "published"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-yellow-50 text-yellow-700 border-yellow-200"
                            }`}>
                            {post.status ?? "published"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <button onClick={() => openView(post)} className="px-3 py-1 text-xs font-semibold transition-colors border rounded-md cursor-pointer border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100">View</button>
                            <button onClick={() => openEdit(post)} className="px-3 py-1 text-xs font-semibold text-blue-700 transition-colors border border-blue-200 rounded-md cursor-pointer bg-blue-50 hover:bg-blue-100">Edit</button>
                            <button onClick={() => openDelete(post)} className="px-3 py-1 text-xs font-semibold text-red-600 transition-colors border border-red-200 rounded-md cursor-pointer bg-red-50 hover:bg-red-100">Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Desktop loading skeleton */}
        {loading && (
          <div className="hidden sm:block mx-7 bg-white rounded-[14px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead className="border-b bg-slate-50 border-slate-100">
                  <tr>
                    {["IMAGE", "TITLE & CONTENT", "CATEGORY", "STATUS", "ACTION"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 tracking-[0.06em] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody><SkeletonRows /></tbody>
              </table>
            </div>
          </div>
        )}

        {/* Count footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-3 sm:px-7 pt-2.5 text-xs text-slate-400">
            Showing {filtered.length} of {posts.length} post{posts.length !== 1 ? "s" : ""}
          </div>
        )}
      </main>
    </div>
  );
}