import { useEffect, useRef, useState } from "react";
import AdminNav from "../components/AdminNav";
import axios from "axios";

const BASE = "http://127.0.0.1:8000";

// Category names sent directly to the API as `category_name`
const CATEGORIES = ["All", "Announcement", "Travel Blog", "Business Trips", "Product Updates"];

const categoryMap = {
  All: "All Posts",
  Announcement: "Announcements",
  "Travel Blog": "Travel Blog",
  "Business Trips": "Business Trips",
  "Product Updates": "Product Updates",
};

// ─────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────
const labelStyle = {
  display: "block", fontSize: "11px", fontWeight: 600, color: "#374151",
  marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em",
};
const inputStyle = {
  width: "100%", padding: "9px 11px", border: "1px solid #E2E8F0", borderRadius: "8px",
  fontSize: "13px", color: "#0F172A", background: "#fff", outline: "none",
  boxSizing: "border-box", fontFamily: "inherit",
};


function Overlay({ children, onClose, wide }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 1000, padding: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", width: "100%", maxWidth: wide ? "820px" : "580px",
          borderRadius: "16px", boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
          maxHeight: "94vh", overflowY: "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, subtitle, onClose }) {
  return (
    <div style={{
      padding: "20px 24px 16px", borderBottom: "1px solid #F1F5F9",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, background: "#fff", zIndex: 10,
      borderRadius: "16px 16px 0 0",
    }}>
      <div>
        <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#0F172A" }}>{title}</h2>
        {subtitle && <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94A3B8" }}>{subtitle}</p>}
      </div>
      <button
        onClick={onClose}
        style={{
          width: "32px", height: "32px", borderRadius: "8px", border: "1px solid #E2E8F0",
          background: "#F8FAFC", color: "#64748B", fontSize: "18px", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
        }}
      >×</button>
    </div>
  );
}

function ImageUploadZone({ id, onChange, preview, onRemove, label }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <label style={{ ...labelStyle, marginBottom: "8px" }}>{label ?? "Cover Image"}</label>
      <label
        htmlFor={id}
        style={{
          display: "block", border: "2px dashed #CBD5E1", borderRadius: "10px",
          padding: "18px", textAlign: "center", cursor: "pointer",
          background: "#F8FAFC", transition: "border-color 0.2s",
          marginBottom: preview ? "10px" : "0",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#155DFC")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#CBD5E1")}
      >
        {preview ? (
          <img
            src={preview}
            alt="preview"
            style={{ maxHeight: "160px", maxWidth: "100%", borderRadius: "8px", objectFit: "cover" }}
          />
        ) : (
          <>
            <div style={{ fontSize: "26px", marginBottom: "4px" }} >🖼️</div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>Click to upload image</div>
            <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>PNG, JPG, WEBP</div>
          </>
        )}
        <input id={id} type="file" accept="image/*" multiple onChange={onChange} style={{ display: "none" }} />
      </label>
      {preview && (
        <button
          type="button"
          onClick={onRemove}
          style={{
            fontSize: "12px", color: "#DC2626", background: "none", border: "none",
            cursor: "pointer", padding: "0", fontWeight: 500,
          }}
        >
          ✕ Remove image
        </button>
      )}
    </div>
  );
}

function CategorySelect({ name, value, onChange }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required
        style={{
          ...inputStyle, appearance: "none", WebkitAppearance: "none",
          paddingRight: "32px", cursor: "pointer",
          color: value ? "#0F172A" : "#9CA3AF",
        }}
      >
        <option value="" disabled>Select a category</option>
        {CATEGORIES.filter((c) => c !== "All").map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <div style={{
        position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
        pointerEvents: "none", color: "#94A3B8", fontSize: "11px",
      }}>▾</div>
    </div>
  );
}

// Used in the Edit modal — update endpoint validates category_blog_id (integer)
const CATEGORY_ID_MAP = {
  "Announcement":    1,
  "Travel Blog":     2,
  "Business Trips":  3,
  "Product Updates": 4,
};

function CategorySelectById({ name, value, onChange }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        name={name}
        value={value}
        onChange={onChange}
        style={{
          ...inputStyle, appearance: "none", WebkitAppearance: "none",
          paddingRight: "32px", cursor: "pointer",
          color: value ? "#0F172A" : "#9CA3AF",
        }}
      >
        <option value="" disabled>Select a category</option>
        {Object.entries(CATEGORY_ID_MAP).map(([label, id]) => (
          <option key={id} value={id}>{label}</option>
        ))}
      </select>
      <div style={{
        position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
        pointerEvents: "none", color: "#94A3B8", fontSize: "11px",
      }}>▾</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function AdminBlogpost() {
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [posts, setPosts]               = useState([]);
  const [loading, setLoading]           = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch]             = useState("");

  // ── Modal states ──
  const [showAddModal, setShowAddModal]       = useState(false);
  const [showViewModal, setShowViewModal]     = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activePost, setActivePost]           = useState(null);

  // ── Submitting flags ──
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);

  // ── Error state ──
  const [error, setError] = useState(null);

  // ── Add form: store endpoint needs `category_name` string ──
  const emptyForm = { blog_title: "", blog_text: "", category_name: "", status: "published" };
  const [addForm, setAddForm]       = useState(emptyForm);
  const [addPreviews, setAddPreviews] = useState([]);   // array of { url, file }
  const [addFiles, setAddFiles]     = useState([]);

  // ── Edit form: update endpoint uses `category_blog_id` integer ──
  const emptyEditForm = { blog_title: "", blog_text: "", category_blog_id: "", status: "published" };
  const [editForm, setEditForm]         = useState(emptyEditForm);
  const [editPreviews, setEditPreviews] = useState([]);
  const [editFiles, setEditFiles]       = useState([]);
  const [removeImages, setRemoveImages] = useState(false);

  // ─────────────────────────────────
  // Helpers: resolve image URLs
  // ─────────────────────────────────
  const resolveImg = (post) => {
    if (!post) return null;
    // API returns images as an array of paths
    const imgs = post.images;
    if (Array.isArray(imgs) && imgs.length > 0) {
      const path = imgs[0];
      return path.startsWith("http") ? path : `${BASE}/storage/${path}`;
    }
    return null;
  };

  const resolveAllImgs = (post) => {
    if (!post) return [];
    const imgs = post.images;
    if (!Array.isArray(imgs)) return [];
    return imgs.map((path) => path.startsWith("http") ? path : `${BASE}/storage/${path}`);
  };

  // ─────────────────────────────────
  // API helpers
  // ─────────────────────────────────
  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await axios.get(`${BASE}/api/blogs`, {
        withCredentials: true,
        headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
      });
      // Support both { data: [...] } and { posts: [...] } and plain array
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

  // ─────────────────────────────────
  // Derived data
  // ─────────────────────────────────
  // API returns blog with eager-loaded category: { category: { category_name: "..." } }
  // Falls back to category_blog_id numeric lookup via the map if relation is missing
  const getCatName = (post) => {
    if (post.category?.category_name) return post.category.category_name;
    return "Uncategorized";
  };

  const filtered = posts.filter((p) => {
    const catName     = getCatName(p);
    const matchCat    = activeCategory === "All" || catName === activeCategory;
    const matchSearch = (p.blog_title ?? "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const counts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = cat === "All"
      ? posts.length
      : posts.filter((p) => getCatName(p) === cat).length;
    return acc;
  }, {});

  // ─────────────────────────────────
  // Open modal helpers
  // ─────────────────────────────────
  const openView = (post) => { setActivePost(post); setShowViewModal(true); };

  const openEdit = (post) => {
    setActivePost(post);
    setEditForm({
      blog_title:       post.blog_title       ?? "",
      blog_text:        post.blog_text        ?? "",
      category_blog_id: post.category_blog_id ?? "",
      status:           post.status           ?? "published",
    });
    const existingImgs = resolveAllImgs(post);
    setEditPreviews(existingImgs.map((url) => ({ url, file: null })));
    setEditFiles([]);
    setRemoveImages(false);
    setShowEditModal(true);
  };

  const openDelete = (post) => { setActivePost(post); setShowDeleteModal(true); };

  // ─────────────────────────────────
  // Form handlers
  // ─────────────────────────────────
  const handleAddChange  = (e) => setAddForm((f)  => ({ ...f, [e.target.name]: e.target.value }));
  const handleEditChange = (e) => setEditForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleAddImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setAddFiles((prev) => [...prev, ...files]);
    setAddPreviews((prev) => [...prev, ...files.map((f) => ({ url: URL.createObjectURL(f), file: f }))]);
  };

  const removeAddPreview = (idx) => {
    setAddPreviews((prev) => prev.filter((_, i) => i !== idx));
    setAddFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleEditImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setEditFiles((prev) => [...prev, ...files]);
    setEditPreviews((prev) => [...prev, ...files.map((f) => ({ url: URL.createObjectURL(f), file: f }))]);
    setRemoveImages(false);
  };

  const removeEditPreview = (idx) => {
    setEditPreviews((prev) => prev.filter((_, i) => i !== idx));
    setEditFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // ─────────────────────────────────
  // Submit: Add
  // ─────────────────────────────────
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("blog_title",    addForm.blog_title);
      fd.append("blog_text",     addForm.blog_text);
      fd.append("category_name", addForm.category_name);   // ← storeBlog validates this
      fd.append("status",        addForm.status);

      // Append each image under images[] — adjust key to what your API expects
      addFiles.forEach((file) => fd.append("images[]", file));

      await axios.post(`${BASE}/api/blogs`, fd, {
        withCredentials: true,
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "Content-Type": "multipart/form-data",
        },
      });

      setShowAddModal(false);
      setAddForm(emptyForm);   // { blog_title, blog_text, category_name, status }
      setAddPreviews([]);
      setAddFiles([]);
      fetchPosts();
    } catch (err) {
      console.error("Add failed:", err);
      const errData = err.response?.data;
      // Laravel validation errors come back as { message: { field: ["msg"] } }
      const msg = typeof errData?.message === "object"
        ? Object.values(errData.message).flat().join("\n")
        : (errData?.message ?? "Failed to create post.");
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────
  // Submit: Edit
  // ─────────────────────────────────
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
      fd.append("_method",          "PUT"); // Laravel method spoofing

      // Only append newly selected files
      editFiles.forEach((file) => fd.append("images[]", file));
      if (removeImages) fd.append("remove_images", "1");

      const postId = activePost.blog_id;
      await axios.post(`${BASE}/api/blogs/${postId}`, fd, {
        withCredentials: true,
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "Content-Type": "multipart/form-data",
        },
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

  // console.log(preview);

  // ─────────────────────────────────
  // Submit: Delete
  // ─────────────────────────────────
  const handleDelete = async () => {
    if (!activePost) return;
    setDeleting(true);
    try {
      const postId = activePost.blog_id;
      await axios.delete(`${BASE}/api/blogs/${postId}`, {  // ← fixed missing slash
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

  // ─────────────────────────────────
  // Multi-image preview strip
  // ─────────────────────────────────
  function ImagePreviewStrip({ previews, onRemove, id, onChange, label }) {
    return (
      <div style={{ marginBottom: "20px" }}>
        <label style={{ ...labelStyle, marginBottom: "8px" }}>{label ?? "Images"}</label>

        {/* Existing / new previews */}
        {previews.length > 0 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
            {previews.map((p, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img
                  src={p.url}
                  alt={`preview-${i}`}
                  style={{ width: "80px", height: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid #E2E8F0" }}
                />
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  style={{
                    position: "absolute", top: "-6px", right: "-6px",
                    width: "18px", height: "18px", borderRadius: "50%",
                    border: "none", background: "#DC2626", color: "#fff",
                    fontSize: "10px", cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center", lineHeight: 1,
                  }}
                >×</button>
              </div>
            ))}
          </div>
        )}

        {/* Upload zone */}
        <label
          htmlFor={id}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            border: "2px dashed #CBD5E1", borderRadius: "10px", padding: "14px",
            cursor: "pointer", background: "#F8FAFC",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#155DFC")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#CBD5E1")}
        >
          <span style={{ fontSize: "20px" }}>🖼️</span>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>Click to add images</div>
            <div style={{ fontSize: "11px", color: "#94A3B8" }}>PNG, JPG, WEBP — multiple allowed</div>
          </div>
          <input id={id} type="file" accept="image/*" multiple onChange={onChange} style={{ display: "none" }} />
        </label>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .abp-burger { display: inline !important; }
          .abp-stats  { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (min-width: 768px) {
          .abp-burger { display: none !important; }
          .abp-stats  { grid-template-columns: repeat(5,1fr) !important; }
        }
        .abp-row:hover td { background: #F8FAFF !important; }
        .abp-act-btn:hover { opacity: 0.75; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#F0F7F2", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* ═══════════════════════════════════
            ADD MODAL
        ═══════════════════════════════════ */}
        {showAddModal && (
          <Overlay onClose={() => setShowAddModal(false)}>
            <ModalHeader title="New Blog Post" subtitle="Fill in the details to publish a new post" onClose={() => setShowAddModal(false)} />
            <form onSubmit={handleAddSubmit} style={{ padding: "20px 24px 24px" }}>

              <ImagePreviewStrip
                id="addImg"
                label="Images"
                previews={addPreviews}
                onChange={handleAddImageChange}
                onRemove={removeAddPreview}
              />

              <Field label="Title">
                <input
                  name="blog_title"
                  value={addForm.blog_title}
                  onChange={handleAddChange}
                  required
                  placeholder="e.g. Jem 8 at MSME Expo 2025"
                  style={inputStyle}
                />
              </Field>

              <Field label="Content">
                <textarea
                  name="blog_text"
                  value={addForm.blog_text}
                  onChange={handleAddChange}
                  placeholder="Full post content…"
                  style={{ ...inputStyle, height: "120px", resize: "vertical" }}
                />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <Field label="Category">
                  <CategorySelect name="category_name" value={addForm.category_name} onChange={handleAddChange} />
                </Field>
                <Field label="Status">
                  <div style={{ position: "relative" }}>
                    <select
                      name="status"
                      value={addForm.status}
                      onChange={handleAddChange}
                      style={{ ...inputStyle, appearance: "none", WebkitAppearance: "none", paddingRight: "32px", cursor: "pointer" }}
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                    <div style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94A3B8", fontSize: "11px" }}>▾</div>
                  </div>
                </Field>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: "10px", border: "1px solid #E2E8F0", borderRadius: "8px", background: "#fff", color: "#374151", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: "10px", border: "none", borderRadius: "8px", background: submitting ? "#93C5FD" : "#155DFC", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer" }}>
                  {submitting ? "Publishing…" : "Publish Post"}
                </button>
              </div>
            </form>
          </Overlay>
        )}

        {/* ═══════════════════════════════════
            VIEW MODAL
        ═══════════════════════════════════ */}
        {showViewModal && activePost && (() => {
          const allImgs = resolveAllImgs(activePost);
          const catName = getCatName(activePost);
          return (
            <Overlay wide onClose={() => setShowViewModal(false)}>
              <ModalHeader
                title="Post Details"
                subtitle={activePost.blog_title}
                onClose={() => setShowViewModal(false)}
              />
              <div style={{ padding: "24px" }}>
                {/* Image gallery */}
                {allImgs.length > 0 && (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
                    {allImgs.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={`img-${i}`}
                        style={{
                          width: allImgs.length === 1 ? "100%" : "calc(50% - 4px)",
                          maxHeight: "240px", objectFit: "cover",
                          borderRadius: "10px", border: "1px solid #F1F5F9",
                        }}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ))}
                  </div>
                )}

                {/* Meta row */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
                  <span style={{ fontSize: "12px", padding: "4px 12px", background: "#EFF6FF", color: "#1D4ED8", borderRadius: "20px", fontWeight: 600, border: "1px solid #BFDBFE" }}>
                    {catName}
                  </span>
                  <span style={{ fontSize: "12px", padding: "4px 12px", background: "#F0FDF4", color: "#16A34A", borderRadius: "20px", fontWeight: 600, border: "1px solid #BBF7D0", textTransform: "capitalize" }}>
                    {activePost.status ?? "published"}
                  </span>
                  {activePost.created_at && (
                    <span style={{ fontSize: "12px", padding: "4px 12px", background: "#F8FAFC", color: "#64748B", borderRadius: "20px", border: "1px solid #E2E8F0" }}>
                      📅 {new Date(activePost.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 style={{ margin: "0 0 12px", fontSize: "20px", fontWeight: 700, color: "#0F172A", lineHeight: 1.3 }}>
                  {activePost.blog_title}
                </h2>

                {/* Content */}
                {activePost.blog_text && (
                  <>
                    <div style={{ height: "1px", background: "#F1F5F9", margin: "0 0 16px" }} />
                    <div style={{ fontSize: "13px", color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                      {activePost.blog_text}
                    </div>
                  </>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                  <button
                    onClick={() => { setShowViewModal(false); openEdit(activePost); }}
                    style={{ flex: 1, padding: "10px", border: "none", borderRadius: "8px", background: "#155DFC", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                  >
                    ✏️ Edit Post
                  </button>
                  <button
                    onClick={() => { setShowViewModal(false); openDelete(activePost); }}
                    style={{ flex: 1, padding: "10px", border: "1px solid #FECACA", borderRadius: "8px", background: "#FEF2F2", color: "#DC2626", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                  >
                    🗑️ Delete Post
                  </button>
                </div>
              </div>
            </Overlay>
          );
        })()}

        {/* ═══════════════════════════════════
            EDIT MODAL
        ═══════════════════════════════════ */}
        {showEditModal && activePost && (
          <Overlay onClose={() => setShowEditModal(false)}>
            <ModalHeader
              title="Edit Post"
              subtitle={`Editing: ${activePost.blog_title}`}
              onClose={() => setShowEditModal(false)}
            />
            <form onSubmit={handleEditSubmit} style={{ padding: "20px 24px 24px" }}>

              <ImagePreviewStrip
                id="editImg"
                label="Images"
                previews={editPreviews}
                onChange={handleEditImageChange}
                onRemove={removeEditPreview}
              />
              {editPreviews.length > 0 && (
                <div style={{ marginTop: "-10px", marginBottom: "16px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#DC2626", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={removeImages}
                      onChange={(e) => setRemoveImages(e.target.checked)}
                      style={{ accentColor: "#DC2626" }}
                    />
                    Remove all existing images on save
                  </label>
                </div>
              )}

              <Field label="Title">
                <input name="blog_title" value={editForm.blog_title} onChange={handleEditChange} required style={inputStyle} />
              </Field>

              <Field label="Content">
                <textarea name="blog_text" value={editForm.blog_text} onChange={handleEditChange} placeholder="Full post content…" style={{ ...inputStyle, height: "120px", resize: "vertical" }} />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <Field label="Category">
                  <CategorySelectById name="category_blog_id" value={editForm.category_blog_id} onChange={handleEditChange} />
                </Field>
                <Field label="Status">
                  <div style={{ position: "relative" }}>
                    <select
                      name="status"
                      value={editForm.status}
                      onChange={handleEditChange}
                      style={{ ...inputStyle, appearance: "none", WebkitAppearance: "none", paddingRight: "32px", cursor: "pointer" }}
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                    <div style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94A3B8", fontSize: "11px" }}>▾</div>
                  </div>
                </Field>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: "10px", border: "1px solid #E2E8F0", borderRadius: "8px", background: "#fff", color: "#374151", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: "10px", border: "none", borderRadius: "8px", background: saving ? "#93C5FD" : "#155DFC", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </Overlay>
        )}

        {/* ═══════════════════════════════════
            DELETE CONFIRM MODAL
        ═══════════════════════════════════ */}
        {showDeleteModal && activePost && (
          <Overlay onClose={() => setShowDeleteModal(false)}>
            <div style={{ padding: "32px 28px", textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>🗑️</div>
              <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>Delete Post?</h3>
              <p style={{ margin: "0 0 6px", fontSize: "14px", color: "#64748B" }}>
                "<strong>{activePost.blog_title}</strong>"
              </p>
              <p style={{ margin: "0 0 24px", fontSize: "13px", color: "#94A3B8" }}>This action cannot be undone.</p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setShowDeleteModal(false)} style={{ flex: 1, padding: "10px", border: "1px solid #E2E8F0", borderRadius: "8px", background: "#fff", color: "#374151", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: "10px", border: "none", borderRadius: "8px", background: deleting ? "#FCA5A5" : "#DC2626", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: deleting ? "not-allowed" : "pointer" }}>
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </Overlay>
        )}

        {/* ═══════════════════════════════════
            MAIN CONTENT
        ═══════════════════════════════════ */}
        <main style={{ flex: 1, padding: "0 0 40px", overflowX: "hidden" }}>

          {/* Top Bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px 0", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                className="abp-burger"
                onClick={() => setSidebarOpen(true)}
                style={{ display: "none", background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#374151" }}
              >☰</button>
              <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#0F172A" }}>Blog Post</h1>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", color: "#94A3B8" }}>🔍</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search posts…"
                  style={{ ...inputStyle, paddingLeft: "30px", width: "220px", background: "#fff" }}
                />
              </div>
              <button
                onClick={() => { setAddForm(emptyForm); setAddPreviews([]); setAddFiles([]); setShowAddModal(true); }}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", border: "none", borderRadius: "8px", background: "#155DFC", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
              >
                + New Post
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div
            className="abp-stats"
            style={{ display: "grid", gap: "14px", padding: "20px 28px", gridTemplateColumns: "repeat(5,1fr)" }}
          >
            {CATEGORIES.map((cat) => (
              <div key={cat} style={{ background: "#fff", borderRadius: "12px", padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #F1F5F9" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                  {categoryMap[cat]}
                </div>
                <div style={{ fontSize: "26px", fontWeight: 800, color: "#0F172A", lineHeight: 1 }}>
                  {loading ? "—" : counts[cat]}
                </div>
                {cat === "All" && <div style={{ fontSize: "10px", color: "#94A3B8", marginTop: "3px", fontWeight: 600, letterSpacing: "0.05em" }}>TOTAL</div>}
              </div>
            ))}
          </div>

          {/* Filter Tabs */}
          <div style={{ padding: "0 28px 16px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "6px 14px", borderRadius: "20px", border: "1px solid",
                  fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                  background:  activeCategory === cat ? "#155DFC" : "#fff",
                  color:       activeCategory === cat ? "#fff"    : "#64748B",
                  borderColor: activeCategory === cat ? "#155DFC" : "#E2E8F0",
                }}
              >
                {cat}
                <span style={{ marginLeft: "5px", fontSize: "11px", opacity: 0.75 }}>({counts[cat]})</span>
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{ margin: "0 28px 16px", padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", color: "#DC2626", fontSize: "13px" }}>
              ⚠️ {error}
              <button onClick={fetchPosts} style={{ marginLeft: "10px", fontSize: "12px", color: "#155DFC", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Retry</button>
            </div>
          )}

          {/* Table */}
          <div style={{ margin: "0 28px", background: "#fff", borderRadius: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #F1F5F9", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
                    {["IMAGE", "TITLE & CONTENT", "CATEGORY", "STATUS", "ACTION"].map((h) => (
                      <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
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
                          <td key={j} style={{ padding: "14px 16px" }}>
                            <div style={{
                              height: j === 1 ? "36px" : "16px", width: `${Math.min(w, 140)}px`,
                              background: "#F1F5F9", borderRadius: "6px",
                              backgroundImage: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)",
                              backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
                            }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "48px", textAlign: "center", color: "#94A3B8", fontSize: "14px" }}>
                        {search ? `No posts matching "${search}"` : "No posts found."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((post) => {
                      const imgSrc  = resolveImg(post);
                      const catName = getCatName(post);
                      const imgCount = (post.images ?? []).length;
                      return (
                        <tr key={post.blog_id} className="abp-row">
                          <td style={{ padding: "12px 16px" }}>
                            {imgSrc ? (
                              <div style={{ position: "relative" }}>
                                <img
                                  src={imgSrc}
                                  alt={post.blog_title}
                                  style={{ width: "64px", height: "48px", borderRadius: "8px", objectFit: "cover", display: "block", border: "1px solid #F1F5F9" }}
                                  onError={(e) => { e.target.style.display = "none"; }}
                                />
                                {imgCount > 1 && (
                                  <span style={{ position: "absolute", bottom: "2px", right: "2px", background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "1px 4px", borderRadius: "4px" }}>
                                    +{imgCount - 1}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div style={{ width: "64px", height: "48px", borderRadius: "8px", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "#CBD5E1" }}>🖼</div>
                            )}
                          </td>
                          <td style={{ padding: "12px 16px", maxWidth: "300px" }}>
                            <div style={{ fontWeight: 600, color: "#0F172A", marginBottom: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{post.blog_title}</div>
                            <div style={{ fontSize: "12px", color: "#94A3B8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {post.blog_text ?? ""}
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", whiteSpace: "nowrap" }}>
                              {catName}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{
                              fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", whiteSpace: "nowrap",
                              background: post.status === "published" ? "#F0FDF4" : "#FEF9C3",
                              color:      post.status === "published" ? "#16A34A" : "#B45309",
                              border:     `1px solid ${post.status === "published" ? "#BBF7D0" : "#FDE68A"}`,
                              textTransform: "capitalize",
                            }}>
                              {post.status ?? "published"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button className="abp-act-btn" onClick={() => openView(post)} style={{ padding: "5px 12px", borderRadius: "6px", border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#374151", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>View</button>
                              <button className="abp-act-btn" onClick={() => openEdit(post)} style={{ padding: "5px 12px", borderRadius: "6px", border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#1D4ED8", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Edit</button>
                              <button className="abp-act-btn" onClick={() => openDelete(post)} style={{ padding: "5px 12px", borderRadius: "6px", border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Delete</button>
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

          {/* Count footer */}
          {!loading && filtered.length > 0 && (
            <div style={{ padding: "10px 28px 0", fontSize: "12px", color: "#94A3B8" }}>
              Showing {filtered.length} of {posts.length} post{posts.length !== 1 ? "s" : ""}
            </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      `}</style>
    </>
  );
}