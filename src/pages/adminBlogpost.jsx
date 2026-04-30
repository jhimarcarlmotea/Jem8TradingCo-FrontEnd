import { useEffect, useRef, useState } from "react";
import AdminNav from "../components/AdminNav";
import axios from "axios";

const BASE = "http://127.0.0.1:8000";

// ── Design tokens (matched from AdminReviews) ─────────────────────────────────
const T = {
  blue50: "#EFF6FF", blue100: "#DBEAFE", blue500: "#3B82F6", blue600: "#2563EB", blue700: "#1D4ED8",
  green50: "#ECFDF5", green100: "#D1FAE5", green500: "#10B981", green600: "#059669",
  amber50: "#FFFBEB", amber100: "#FEF3C7", amber500: "#F59E0B", amber600: "#D97706",
  red50: "#FEF2F2", red100: "#FEE2E2", red500: "#EF4444", red600: "#DC2626",
  slate50: "#F8FAFC", slate100: "#F1F5F9", slate200: "#E2E8F0", slate300: "#CBD5E1",
  slate400: "#94A3B8", slate500: "#64748B", slate600: "#475569",
  slate700: "#374151", slate800: "#1E293B", slate900: "#0F172A",
  radius: { sm: 8, md: 12, lg: 16, xl: 20 },
  shadow: { sm: "0 1px 2px rgba(15,23,42,0.05)", md: "0 4px 12px rgba(15,23,42,0.08)", hover: "0 8px 24px rgba(15,23,42,0.12)" },
  font: "'DM Sans','Nunito',system-ui,sans-serif",
};

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

// ── Overlay / Modal ───────────────────────────────────────────────────────────
function Overlay({ children, onClose, wide }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "12px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          width: "100%",
          maxWidth: wide ? "820px" : "580px",
          borderRadius: T.radius.xl,
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
          maxHeight: "94vh",
          overflowY: "auto",
          fontFamily: T.font,
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
      position: "sticky", top: 0, zIndex: 10,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 24px",
      background: "#fff",
      borderBottom: `1px solid ${T.slate100}`,
      borderRadius: `${T.radius.xl}px ${T.radius.xl}px 0 0`,
    }}>
      <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.slate900, fontFamily: T.font }}>{title}</h2>
        {subtitle && <p style={{ margin: "2px 0 0", fontSize: 12, color: T.slate400, fontFamily: T.font }}>{subtitle}</p>}
      </div>
      <button
        onClick={onClose}
        style={{
          width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, border: `1px solid ${T.slate200}`, borderRadius: T.radius.sm,
          background: T.slate50, color: T.slate500, fontSize: 18, cursor: "pointer",
          transition: "all 0.12s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = T.red50; e.currentTarget.style.color = T.red500; e.currentTarget.style.borderColor = "#fecaca"; }}
        onMouseLeave={e => { e.currentTarget.style.background = T.slate50; e.currentTarget.style.color = T.slate500; e.currentTarget.style.borderColor = T.slate200; }}
      >×</button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 600, color: T.slate600,
        marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em",
        fontFamily: T.font,
      }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 12px",
  border: `1px solid ${T.slate300}`, borderRadius: T.radius.md,
  fontSize: 13, color: T.slate900, background: "#fff",
  outline: "none", boxSizing: "border-box",
  fontFamily: "'DM Sans','Nunito',system-ui,sans-serif",
  transition: "border-color 0.12s",
};

function StyledInput({ ...props }) {
  return (
    <input
      {...props}
      style={inputStyle}
      onFocus={e => e.currentTarget.style.borderColor = T.blue500}
      onBlur={e => e.currentTarget.style.borderColor = T.slate300}
    />
  );
}

function StyledTextarea({ ...props }) {
  return (
    <textarea
      {...props}
      style={{ ...inputStyle, resize: "vertical" }}
      onFocus={e => e.currentTarget.style.borderColor = T.blue500}
      onBlur={e => e.currentTarget.style.borderColor = T.slate300}
    />
  );
}

function StyledSelect({ children, ...props }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        {...props}
        style={{
          ...inputStyle,
          appearance: "none",
          paddingRight: 32,
          cursor: "pointer",
        }}
        onFocus={e => e.currentTarget.style.borderColor = T.blue500}
        onBlur={e => e.currentTarget.style.borderColor = T.slate300}
      >
        {children}
      </select>
      <div style={{
        position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
        pointerEvents: "none", color: T.slate400, fontSize: 11,
      }}>▾</div>
    </div>
  );
}

function CategorySelect({ name, value, onChange }) {
  return (
    <StyledSelect name={name} value={value} onChange={onChange} required>
      <option value="" disabled>Select a category</option>
      {CATEGORIES.filter((c) => c !== "All").map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </StyledSelect>
  );
}

function CategorySelectById({ name, value, onChange }) {
  return (
    <StyledSelect name={name} value={value} onChange={onChange}>
      <option value="" disabled>Select a category</option>
      {Object.entries(CATEGORY_ID_MAP).map(([label, id]) => (
        <option key={id} value={id}>{label}</option>
      ))}
    </StyledSelect>
  );
}

function StatusSelect({ name, value, onChange }) {
  return (
    <StyledSelect name={name} value={value} onChange={onChange}>
      <option value="published">Published</option>
      <option value="draft">Draft</option>
    </StyledSelect>
  );
}

function ImagePreviewStrip({ previews, onRemove, id, onChange, label }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 600, color: T.slate600,
        marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em",
        fontFamily: T.font,
      }}>{label ?? "Images"}</label>
      {previews.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {previews.map((p, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img
                src={p.url}
                alt={`preview-${i}`}
                style={{ width: 80, height: 60, objectFit: "cover", border: `1px solid ${T.slate200}`, borderRadius: T.radius.sm }}
              />
              <button
                type="button"
                onClick={() => onRemove(i)}
                style={{
                  position: "absolute", top: -6, right: -6, width: 18, height: 18,
                  borderRadius: "50%", border: "none", background: T.red600,
                  color: "#fff", fontSize: 10, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >×</button>
            </div>
          ))}
        </div>
      )}
      <label
        htmlFor={id}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          border: `2px dashed ${T.slate300}`, borderRadius: T.radius.lg,
          padding: "14px", cursor: "pointer", background: T.slate50,
          transition: "border-color 0.12s",
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = T.blue500}
        onMouseLeave={e => e.currentTarget.style.borderColor = T.slate300}
      >
        <span style={{ fontSize: 20 }}>🖼️</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.slate700, fontFamily: T.font }}>Click to add images</div>
          <div style={{ fontSize: 11, color: T.slate400, fontFamily: T.font }}>PNG, JPG, WEBP — multiple allowed</div>
        </div>
        <input id={id} type="file" accept="image/*" multiple onChange={onChange} style={{ display: "none" }} />
      </label>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24,
      display: "flex", flexDirection: "column", gap: 8,
      zIndex: 9999,
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          padding: "10px 16px", borderRadius: T.radius.md,
          fontSize: 13, fontWeight: 500,
          boxShadow: T.shadow.md,
          border: `1px solid ${t.type === "error" ? T.red100 : T.green100}`,
          background: t.type === "error" ? T.red50 : T.green50,
          color: t.type === "error" ? T.red600 : T.green600,
          fontFamily: T.font,
        }}>
          {t.type === "error" ? "✗ " : "✓ "}{t.message}
        </div>
      ))}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      padding: 20, background: "#fff", boxShadow: T.shadow.sm,
      borderRadius: T.radius.lg, border: `1px solid ${T.slate200}`,
      height: 120, opacity: 0.6,
      animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
    }} />
  );
}

export default function AdminBlogpost() {
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [posts, setPosts]               = useState([]);
  const [loading, setLoading]           = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch]             = useState("");
  const [toasts, setToasts]             = useState([]);

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

  // ── toast helper ─────────────────────────────────────────────────────────────
  const toast = (message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  };

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
      toast("Post published successfully.");
    } catch (err) {
      console.error("Add failed:", err);
      const errData = err.response?.data;
      const msg = typeof errData?.message === "object"
        ? Object.values(errData.message).flat().join("\n")
        : (errData?.message ?? "Failed to create post.");
      toast(msg, "error");
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
      toast("Post updated successfully.");
    } catch (err) {
      console.error("Edit failed:", err);
      const errData = err.response?.data;
      const msg = typeof errData?.message === "object"
        ? Object.values(errData.message).flat().join("\n")
        : (errData?.message ?? "Failed to update post.");
      toast(msg, "error");
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
      toast("Post deleted.");
    } catch (err) {
      console.error("Delete failed:", err);
      toast(err.response?.data?.message ?? "Failed to delete post.", "error");
    } finally {
      setDeleting(false);
    }
  };

  // ── Stat cards config ─────────────────────────────────────────────────────────
  const published = posts.filter((p) => p.status === "published").length;
  const draft     = posts.filter((p) => p.status === "draft").length;

  const statCards = [
    { label: "All Posts",      value: posts.length, bg: T.blue50,  accent: T.blue600,  icon: "📝" },
    { label: "Published",      value: published,    bg: T.green50, accent: T.green600, icon: "✅" },
    { label: "Drafts",         value: draft,        bg: T.amber50, accent: T.amber600, icon: "📋" },
    { label: "Announcements",  value: counts["Announcement"]    ?? 0, bg: T.slate100, accent: T.slate600, icon: "📢" },
    { label: "Travel Blog",    value: counts["Travel Blog"]     ?? 0, bg: T.blue50,   accent: T.blue500,  icon: "✈️" },
  ];

  // ── Status badge helper ───────────────────────────────────────────────────────
  const statusStyle = (status) => {
    if (status === "published") return { bg: T.green50, color: T.green600, border: T.green100 };
    return { bg: T.amber50, color: T.amber600, border: T.amber100 };
  };

  const catBadgeStyle = {
    padding: "4px 10px", borderRadius: T.radius.sm,
    fontSize: 11, fontWeight: 600,
    background: T.blue50, color: T.blue600,
    border: `1px solid ${T.blue100}`,
    fontFamily: T.font, whiteSpace: "nowrap",
  };

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: "#F0F4F8", fontFamily: T.font,
    }}>

      <style>{`
        .ap-hamburger { display: flex; }
        @media (min-width: 1024px) { .ap-hamburger { display: none !important; } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <Toast toasts={toasts} />

      <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* ADD MODAL */}
      {showAddModal && (
        <Overlay onClose={() => setShowAddModal(false)}>
          <ModalHeader title="New Blog Post" subtitle="Fill in the details to publish a new post" onClose={() => setShowAddModal(false)} />
          <form onSubmit={handleAddSubmit} style={{ padding: "20px 24px" }}>
            <ImagePreviewStrip id="addImg" label="Images" previews={addPreviews} onChange={handleAddImageChange} onRemove={removeAddPreview} />
            <Field label="Title">
              <StyledInput name="blog_title" value={addForm.blog_title} onChange={handleAddChange} required placeholder="e.g. Jem 8 at MSME Expo 2025" />
            </Field>
            <Field label="Content">
              <StyledTextarea name="blog_text" value={addForm.blog_text} onChange={handleAddChange} placeholder="Full post content…" rows={5} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Category">
                <CategorySelect name="category_name" value={addForm.category_name} onChange={handleAddChange} />
              </Field>
              <Field label="Status">
                <StatusSelect name="status" value={addForm.status} onChange={handleAddChange} />
              </Field>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                type="button" onClick={() => setShowAddModal(false)}
                style={{
                  flex: 1, padding: "10px", border: `1px solid ${T.slate200}`,
                  borderRadius: T.radius.md, background: "#fff", color: T.slate700,
                  fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
                  transition: "background 0.12s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.slate50}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}
              >
                Cancel
              </button>
              <button
                type="submit" disabled={submitting}
                style={{
                  flex: 1, padding: "10px", border: "none",
                  borderRadius: T.radius.md,
                  background: submitting ? T.blue500 : T.blue600,
                  color: "#fff", fontSize: 13, fontWeight: 600,
                  cursor: submitting ? "not-allowed" : "pointer", fontFamily: T.font,
                  transition: "background 0.12s",
                }}
                onMouseEnter={e => !submitting && (e.currentTarget.style.background = T.blue700)}
                onMouseLeave={e => !submitting && (e.currentTarget.style.background = T.blue600)}
              >
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
        const ss = statusStyle(activePost.status);
        return (
          <Overlay wide onClose={() => setShowViewModal(false)}>
            <ModalHeader title="Post Details" subtitle={activePost.blog_title} onClose={() => setShowViewModal(false)} />
            <div style={{ padding: "20px 24px" }}>
              {allImgs.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                  {allImgs.map((src, i) => (
                    <img
                      key={i} src={src} alt={`img-${i}`}
                      style={{
                        borderRadius: T.radius.lg, border: `1px solid ${T.slate100}`,
                        objectFit: "cover", maxHeight: 240,
                        width: allImgs.length === 1 ? "100%" : "calc(50% - 4px)",
                      }}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  ))}
                </div>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                <span style={catBadgeStyle}>{catName}</span>
                <span style={{
                  padding: "4px 10px", borderRadius: T.radius.sm,
                  fontSize: 11, fontWeight: 700, textTransform: "capitalize",
                  background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`,
                }}>
                  {activePost.status ?? "published"}
                </span>
                {activePost.created_at && (
                  <span style={{
                    padding: "4px 10px", borderRadius: T.radius.sm,
                    fontSize: 11, background: T.slate50, color: T.slate500,
                    border: `1px solid ${T.slate200}`,
                  }}>
                    📅 {new Date(activePost.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 700, color: T.slate900, fontFamily: T.font }}>{activePost.blog_title}</h2>
              {activePost.blog_text && (
                <>
                  <div style={{ height: 1, background: T.slate100, margin: "16px 0" }} />
                  <p style={{ margin: 0, fontSize: 13, color: T.slate700, lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: T.font }}>
                    {activePost.blog_text}
                  </p>
                </>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <button
                  onClick={() => { setShowViewModal(false); openEdit(activePost); }}
                  style={{
                    flex: 1, padding: "10px", border: "none", borderRadius: T.radius.md,
                    background: T.blue600, color: "#fff", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: T.font, transition: "background 0.12s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = T.blue700}
                  onMouseLeave={e => e.currentTarget.style.background = T.blue600}
                >
                  ✏️ Edit Post
                </button>
                <button
                  onClick={() => { setShowViewModal(false); openDelete(activePost); }}
                  style={{
                    flex: 1, padding: "10px", border: `1px solid ${T.red100}`,
                    borderRadius: T.radius.md, background: T.red50, color: T.red600,
                    fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = T.red100}
                  onMouseLeave={e => e.currentTarget.style.background = T.red50}
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
          <form onSubmit={handleEditSubmit} style={{ padding: "20px 24px" }}>
            <ImagePreviewStrip id="editImg" label="Images" previews={editPreviews} onChange={handleEditImageChange} onRemove={removeEditPreview} />
            {editPreviews.length > 0 && (
              <div style={{ marginTop: -10, marginBottom: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.red600, cursor: "pointer", fontFamily: T.font }}>
                  <input type="checkbox" checked={removeImages} onChange={(e) => setRemoveImages(e.target.checked)} style={{ accentColor: T.red600 }} />
                  Remove all existing images on save
                </label>
              </div>
            )}
            <Field label="Title">
              <StyledInput name="blog_title" value={editForm.blog_title} onChange={handleEditChange} required />
            </Field>
            <Field label="Content">
              <StyledTextarea name="blog_text" value={editForm.blog_text} onChange={handleEditChange} placeholder="Full post content…" rows={5} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Category">
                <CategorySelectById name="category_blog_id" value={editForm.category_blog_id} onChange={handleEditChange} />
              </Field>
              <Field label="Status">
                <StatusSelect name="status" value={editForm.status} onChange={handleEditChange} />
              </Field>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                type="button" onClick={() => setShowEditModal(false)}
                style={{
                  flex: 1, padding: "10px", border: `1px solid ${T.slate200}`,
                  borderRadius: T.radius.md, background: "#fff", color: T.slate700,
                  fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
                  transition: "background 0.12s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.slate50}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}
              >
                Cancel
              </button>
              <button
                type="submit" disabled={saving}
                style={{
                  flex: 1, padding: "10px", border: "none",
                  borderRadius: T.radius.md,
                  background: saving ? T.blue500 : T.blue600,
                  color: "#fff", fontSize: 13, fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer", fontFamily: T.font,
                  transition: "background 0.12s",
                }}
                onMouseEnter={e => !saving && (e.currentTarget.style.background = T.blue700)}
                onMouseLeave={e => !saving && (e.currentTarget.style.background = T.blue600)}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </Overlay>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && activePost && (
        <Overlay onClose={() => setShowDeleteModal(false)}>
          <div style={{ padding: "32px 28px", textAlign: "center", fontFamily: T.font }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: T.slate900 }}>Delete Post?</h3>
            <p style={{ margin: "0 0 6px", fontSize: 14, color: T.slate500 }}>
              "<strong style={{ color: T.slate700 }}>{activePost.blog_title}</strong>"
            </p>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: T.slate400 }}>This action cannot be undone.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  flex: 1, padding: "10px", border: `1px solid ${T.slate200}`,
                  borderRadius: T.radius.md, background: "#fff", color: T.slate700,
                  fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
                  transition: "background 0.12s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.slate50}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete} disabled={deleting}
                style={{
                  flex: 1, padding: "10px", border: "none",
                  borderRadius: T.radius.md,
                  background: deleting ? "#ef9494" : T.red600,
                  color: "#fff", fontSize: 13, fontWeight: 600,
                  cursor: deleting ? "not-allowed" : "pointer", fontFamily: T.font,
                  transition: "background 0.12s",
                }}
                onMouseEnter={e => !deleting && (e.currentTarget.style.background = "#c41c1c")}
                onMouseLeave={e => !deleting && (e.currentTarget.style.background = T.red600)}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* MAIN CONTENT */}
      <main style={{
        flex: 1, minWidth: 0, padding: "20px",
        overflowX: "hidden",
      }}>

        {/* Top Bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, marginBottom: 20, background: "#fff", borderRadius: T.radius.lg,
          padding: "12px 16px", border: `1px solid ${T.slate200}`,
          boxShadow: T.shadow.sm, flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="ap-hamburger"
              style={{
                background: "none", border: `1px solid ${T.slate200}`,
                borderRadius: T.radius.sm, width: 36, height: 36,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: 18, color: T.slate700,
              }}
            >☰</button>
            <div>
              <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.slate900, letterSpacing: "-0.3px", fontFamily: T.font }}>Blog Posts</h1>
              <p style={{ margin: "1px 0 0", fontSize: 11, color: T.slate400, fontFamily: T.font }}>Manage your blog content</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                fontSize: 13, color: T.slate400, pointerEvents: "none",
              }}>🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts…"
                style={{
                  ...inputStyle,
                  paddingLeft: 32,
                  width: 200,
                }}
                onFocus={e => e.currentTarget.style.borderColor = T.blue500}
                onBlur={e => e.currentTarget.style.borderColor = T.slate300}
              />
            </div>
            {/* Refresh */}
            <button
              onClick={fetchPosts}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: T.radius.sm,
                border: `1px solid ${T.slate200}`, background: "#fff",
                color: T.slate700, fontSize: 12, fontWeight: 600,
                cursor: "pointer", transition: "background 0.12s", fontFamily: T.font,
              }}
              onMouseEnter={e => e.currentTarget.style.background = T.slate50}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}
            >
              {loading ? "⟳ Loading…" : "⟳ Refresh"}
            </button>
            {/* New Post */}
            <button
              onClick={() => { setAddForm(emptyForm); setAddPreviews([]); setAddFiles([]); setShowAddModal(true); }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", border: "none", borderRadius: T.radius.sm,
                background: T.blue600, color: "#fff", fontSize: 12, fontWeight: 600,
                cursor: "pointer", transition: "background 0.12s", fontFamily: T.font,
                boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
              }}
              onMouseEnter={e => e.currentTarget.style.background = T.blue700}
              onMouseLeave={e => e.currentTarget.style.background = T.blue600}
            >
              + New Post
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{
          display: "grid", gap: 10, marginBottom: 16,
          gridTemplateColumns: "repeat(5, 1fr)",
        }}>
          {statCards.map((s) => (
            <div
              key={s.label}
              style={{
                background: "#fff", borderRadius: T.radius.lg, padding: "16px",
                border: `1px solid ${T.slate200}`, boxShadow: T.shadow.sm,
                position: "relative", overflow: "hidden", transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = T.shadow.hover; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = T.shadow.sm; }}
            >
              {/* Accent top bar */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: s.accent, borderRadius: `${T.radius.lg}px ${T.radius.lg}px 0 0`,
              }} />
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <div style={{
                    fontSize: 10, fontWeight: 600, color: T.slate400,
                    textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6,
                    fontFamily: T.font,
                  }}>
                    {s.label}
                  </div>
                  <div style={{
                    fontSize: 28, fontWeight: 800, color: T.slate900,
                    letterSpacing: "-0.5px", lineHeight: 1, fontFamily: T.font,
                  }}>
                    {loading ? "—" : s.value}
                  </div>
                </div>
                <div style={{
                  width: 36, height: 36, borderRadius: T.radius.sm,
                  background: s.bg, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 16, flexShrink: 0,
                }}>
                  {s.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "nowrap", overflowX: "auto" }}>
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "7px 16px", borderRadius: T.radius.sm,
                  fontSize: 12, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.12s", whiteSpace: "nowrap",
                  flexShrink: 0, fontFamily: T.font,
                  background: isActive ? T.blue600 : "#fff",
                  color: isActive ? "#fff" : T.slate600,
                  border: isActive ? "none" : `1px solid ${T.slate200}`,
                  boxShadow: isActive ? "0 2px 8px rgba(37,99,235,0.25)" : T.shadow.sm,
                }}
                onMouseEnter={e => !isActive && (e.currentTarget.style.background = T.slate50)}
                onMouseLeave={e => !isActive && (e.currentTarget.style.background = "#fff")}
              >
                {cat}
                <span style={{ marginLeft: 4, opacity: 0.75 }}>({counts[cat]})</span>
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            margin: "0 0 16px", padding: "12px 16px",
            background: T.red50, border: `1px solid ${T.red100}`,
            borderRadius: T.radius.md, color: T.red600, fontSize: 13, fontFamily: T.font,
          }}>
            ⚠️ {error}
            <button
              onClick={fetchPosts}
              style={{ marginLeft: 10, fontSize: 12, color: T.blue600, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: T.font }}
            >Retry</button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div style={{
            padding: 40, fontSize: 14, textAlign: "center",
            color: T.slate400, background: "#fff",
            boxShadow: T.shadow.sm, borderRadius: T.radius.lg,
            fontFamily: T.font, border: `1px solid ${T.slate200}`,
          }}>
            {search ? `No posts matching "${search}"` : "No posts found."}
          </div>
        )}

        {/* Post Cards */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filtered.map((post) => {
              const imgSrc   = resolveImg(post);
              const imgCount = (post.images ?? []).length;
              const catName  = getCatName(post);
              const ss       = statusStyle(post.status);

              return (
                <div
                  key={post.blog_id}
                  style={{
                    padding: "20px", border: `1px solid ${T.slate200}`,
                    boxShadow: T.shadow.sm, background: "#fff",
                    borderRadius: T.radius.lg, fontFamily: T.font,
                  }}
                >
                  {/* Header row */}
                  <div style={{
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                    flexWrap: "wrap", gap: 10, marginBottom: 10,
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      {/* Thumbnail or fallback icon */}
                      {imgSrc ? (
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <img
                            src={imgSrc}
                            alt={post.blog_title}
                            style={{
                              width: 56, height: 56, objectFit: "cover",
                              borderRadius: T.radius.md, border: `1px solid ${T.slate100}`,
                            }}
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                          {imgCount > 1 && (
                            <span style={{
                              position: "absolute", bottom: 2, right: 2,
                              background: "rgba(0,0,0,0.6)", color: "#fff",
                              fontSize: 9, fontWeight: 700, padding: "1px 4px",
                              borderRadius: 4,
                            }}>+{imgCount - 1}</span>
                          )}
                        </div>
                      ) : (
                        <div style={{
                          width: 56, height: 56, borderRadius: T.radius.md,
                          background: T.slate100, display: "flex",
                          alignItems: "center", justifyContent: "center",
                          fontSize: 22, flexShrink: 0, color: T.slate300,
                        }}>🖼</div>
                      )}
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: T.slate900, marginBottom: 3 }}>
                          {post.blog_title}
                        </div>
                        <div style={{ fontSize: 11, color: T.slate400 }}>
                          {post.created_at
                            ? new Date(post.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                            : ""}
                        </div>
                      </div>
                    </div>
                    {/* Status badge */}
                    <span style={{
                      padding: "4px 10px", borderRadius: T.radius.sm,
                      fontSize: 11, fontWeight: 700, textTransform: "capitalize",
                      background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`,
                      flexShrink: 0,
                    }}>
                      {post.status ?? "published"}
                    </span>
                  </div>

                  {/* Category tag */}
                  <span style={{ ...catBadgeStyle, display: "inline-block", marginBottom: 12 }}>
                    📁 {catName}
                  </span>

                  {/* Excerpt */}
                  {post.blog_text && (
                    <p style={{
                      margin: "0 0 12px", fontSize: 12, fontWeight: 500,
                      lineHeight: 1.6, color: T.slate700,
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {post.blog_text}
                    </p>
                  )}

                  {/* Action row */}
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => openView(post)}
                      style={{
                        padding: "4px 14px", borderRadius: T.radius.sm,
                        border: `1px solid ${T.slate300}`, background: "#fff",
                        color: T.slate700, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", transition: "background 0.12s", fontFamily: T.font,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = T.slate50}
                      onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                    >
                      👁 View
                    </button>
                    <button
                      onClick={() => openEdit(post)}
                      style={{
                        padding: "4px 14px", borderRadius: T.radius.sm,
                        border: `1px solid ${T.blue500}`, background: "#fff",
                        color: T.blue600, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", transition: "background 0.12s", fontFamily: T.font,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = T.blue50}
                      onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => openDelete(post)}
                      style={{
                        padding: "4px 14px", borderRadius: T.radius.sm,
                        border: `1px solid ${T.red600}`, background: "#fff",
                        color: T.red600, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", transition: "background 0.12s", fontFamily: T.font,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = T.red50}
                      onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                    >
                      🗑️ Delete
                    </button>

                    <span style={{
                      marginLeft: "auto", fontSize: 12, fontWeight: 600,
                      color: T.slate400, fontFamily: T.font,
                    }}>
                      {imgCount > 0 && `📷 ${imgCount} photo${imgCount !== 1 ? "s" : ""}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Count footer */}
        {!loading && filtered.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginTop: 20, fontSize: 12, color: T.slate400, fontFamily: T.font,
          }}>
            <span>Showing {filtered.length} of {posts.length} post{posts.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </main>
    </div>
  );
}