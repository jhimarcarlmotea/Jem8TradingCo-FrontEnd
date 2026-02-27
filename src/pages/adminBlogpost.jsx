import { useState, useRef } from "react";
import AdminNav from "../components/AdminNav";
import "../style/adminBlogpost.css";

const categories = ["All", "Announcement", "Travel Blog", "Business Trips", "Product Updates"];

const initialPosts = [
  {
    id: 1,
    title: "Jem 8 Circle at the MSME Expo 2025",
    description: "Our team joined the MSME Expo 2025 and showcased our latest products.",
    category: "Business Trips",
    date: "Feb. 20, 2026",
    image: "https://placehold.co/80x80/e2e8f0/94a3b8?text=IMG",
  },
  {
    id: 2,
    title: "Our Team's Trip to Laguna — Supplier Visit & More",
    description: "A productive supplier visit combined with a refreshing team outing.",
    category: "Travel Blog",
    date: "Feb. 20, 2026",
    image: "https://placehold.co/80x80/e2e8f0/94a3b8?text=IMG",
  },
  {
    id: 3,
    title: "Team Building in Tagaytay — A Day Well Spent",
    description: "The team enjoyed a fun and meaningful team building activity in Tagaytay.",
    category: "Travel Blog",
    date: "Feb. 20, 2026",
    image: "https://placehold.co/80x80/e2e8f0/94a3b8?text=IMG",
  },
  {
    id: 4,
    title: "Internship Slots Now Open at Jem 8 Circle",
    description: "We are accepting interns for our growing team. Apply now!",
    category: "Announcement",
    date: "Feb. 20, 2026",
    image: null,
  },
  {
    id: 5,
    title: "IAM Amazing Pure Organic Barley — New 500g Pack",
    description: "Our best-selling barley product now comes in a new 500g packaging.",
    category: "Product Updates",
    date: "Feb. 20, 2026",
    image: "https://placehold.co/80x80/e2e8f0/94a3b8?text=IMG",
  },
];

const categoryMap = {
  All: "All Post",
  Announcement: "Announcement",
  "Travel Blog": "Travel Blog",
  "Business Trips": "Business Trips",
  "Product Updates": "Product Update",
};

function PostModal({ post, onClose, onSave }) {
  const [form, setForm] = useState(
    post
      ? { ...post }
      : { title: "", description: "", category: "Announcement", date: "", image: null }
  );
  const fileInputRef = useRef();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, image: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h2>{post ? "Edit Post" : "New Post"}</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Image Upload */}
        <div className="modal-field">
          <label className="modal-label">Image</label>
          <div className="modal-image-upload-area" onClick={() => fileInputRef.current.click()}>
            {form.image ? (
              <img src={form.image} alt="Preview" className="modal-image-preview" />
            ) : (
              <div className="modal-image-placeholder">
                <span className="modal-image-icon">🖼</span>
                <span className="modal-image-text">Click to upload image</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
          {form.image && (
            <button className="modal-remove-img-btn" onClick={handleRemoveImage}>
              ✕ Remove Image
            </button>
          )}
        </div>

        {/* Text Fields */}
        {[
          { label: "Title", name: "title", placeholder: "Enter post title" },
          { label: "Description", name: "description", placeholder: "Enter post description" },
          { label: "Date", name: "date", placeholder: "e.g. Feb. 20, 2026" },
        ].map((field) => (
          <div key={field.name} className="modal-field">
            <label className="modal-label">{field.label}</label>
            <input
              className="modal-input"
              name={field.name}
              value={form[field.name]}
              onChange={handleChange}
              placeholder={field.placeholder}
            />
          </div>
        ))}

        {/* Category */}
        <div className="modal-field">
          <label className="modal-label">Category</label>
          <select
            className="modal-select"
            name="category"
            value={form.category}
            onChange={handleChange}
          >
            {categories.filter((c) => c !== "All").map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="modal-footer">
          <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="modal-save-btn" onClick={() => onSave(form)}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminBlogpost() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [posts, setPosts] = useState(initialPosts);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const filtered = posts.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const counts = categories.reduce((acc, cat) => {
    acc[cat] = cat === "All" ? posts.length : posts.filter((p) => p.category === cat).length;
    return acc;
  }, {});

  const handleSave = (form) => {
    if (modal === "new") {
      setPosts([...posts, { ...form, id: Date.now() }]);
    } else {
      setPosts(posts.map((p) => (p.id === modal.id ? { ...form, id: modal.id } : p)));
    }
    setModal(null);
  };

  const handleDelete = (id) => {
    setPosts(posts.filter((p) => p.id !== id));
    setDeleteId(null);
  };

  return (
    <div className="blogpost-wrapper">
      <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="blogpost-main">

        {/* Top Bar */}
        <div className="blogpost-topbar">
          <div className="blogpost-topbar-left">
            <button className="blogpost-burger" onClick={() => setSidebarOpen(true)}>☰</button>
            <h1 className="blogpost-title">Blog Post</h1>
          </div>
          <div className="blogpost-search-wrapper">
            <span className="blogpost-search-icon">🔍</span>
            <input
              className="blogpost-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Post..."
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="blogpost-stats-grid">
          {categories.map((cat) => (
            <div key={cat} className="blogpost-stat-card">
              <div className="blogpost-stat-label">{categoryMap[cat]}</div>
              <div className="blogpost-stat-value">{counts[cat]}</div>
              {cat === "All" && <div className="blogpost-stat-sub">TOTAL</div>}
            </div>
          ))}
        </div>

        {/* Filter Tabs + New Post */}
        <div className="blogpost-controls">
          <div className="blogpost-tabs">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`blog-tab-btn ${activeCategory === cat ? "active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <button className="blogpost-new-btn" onClick={() => setModal("new")}>
            + New Post
          </button>
        </div>

        {/* Table */}
        <div className="blogpost-table-wrapper">
          <div className="blogpost-table-scroll">
            <table className="blogpost-table">
              <thead>
                <tr>
                  {["IMAGE", "TITLE & DESCRIPTION", "CATEGORY", "DATE", "ACTION"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="blogpost-empty">No posts found.</td>
                  </tr>
                ) : (
                  filtered.map((post) => (
                    <tr key={post.id}>
                      <td>
                        {post.image ? (
                          <img className="blogpost-post-img" src={post.image} alt={post.title} />
                        ) : (
                          <div className="blogpost-img-placeholder">🖼</div>
                        )}
                      </td>
                      <td>
                        <div className="blogpost-post-title">{post.title}</div>
                        <div className="blogpost-post-desc">{post.description}</div>
                      </td>
                      <td>
                        <span className="blogpost-post-category">{post.category}</span>
                      </td>
                      <td>
                        <span className="blogpost-post-date">{post.date}</span>
                      </td>
                      <td>
                        <div className="blogpost-actions">
                          <button className="action-btn edit" onClick={() => setModal(post)}>Edit</button>
                          <button className="action-btn delete" onClick={() => setDeleteId(post.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* New / Edit Modal */}
      {modal && (
        <PostModal
          post={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="delete-modal-box">
            <div className="delete-modal-icon">🗑️</div>
            <h3 className="delete-modal-title">Delete Post?</h3>
            <p className="delete-modal-text">This action cannot be undone.</p>
            <div className="delete-modal-footer">
              <button className="delete-cancel-btn" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="delete-confirm-btn" onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}