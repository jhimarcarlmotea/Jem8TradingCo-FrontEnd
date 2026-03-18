import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminNav from '../components/AdminNav';
import '../style/adminLeadership.css';

const BASE = 'http://127.0.0.1:8000';

const axiosConfig = {
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
};

const getInitials = (name) =>
  name.split(' ').filter(Boolean).slice(-2).map((n) => n[0]).join('').toUpperCase();

const AVATAR_COLORS = ['#c2c2c2', '#a8d5ba', '#aac4e8', '#f5c6a0', '#d4b3f0', '#f9c0c0'];

// ── Primary key helper — admin_leadership model uses `leadership_id` ──
// Falls back to `id` in case the API serialises it differently
const getId = (member) => member?.leadership_id ?? member?.id;

const resolveImg = (member) => {
  if (!member?.leadership_img) return null;
  const p = member.leadership_img;
  return p.startsWith('http') ? p : `${BASE}/storage/${p}`;
};

// ── Shared error parser for Laravel validation responses ──
const parseError = (err) => {
  const data = err.response?.data;
  if (!data) return 'An unexpected error occurred.';
  if (typeof data.message === 'object') {
    return Object.values(data.message).flat().join('\n');
  }
  return data.message ?? 'An unexpected error occurred.';
};

const AdminLeadership = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [members, setMembers]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  // ── Modal states ──
  const [showModal, setShowModal]       = useState(false);
  const [editTarget, setEditTarget]     = useState(null); // null = add, object = edit
  const [viewTarget, setViewTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Form state ──
  const emptyForm = { name: '', position: '', status: true };
  const [form, setForm]         = useState(emptyForm);
  const [imgFile, setImgFile]   = useState(null);
  const [imgPreview, setImgPreview] = useState(null);

  // ── Submit flags ──
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  // ─────────────────────────────────
  // Fetch all
  // ─────────────────────────────────
  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await axios.get(`${BASE}/api/leadership`, axiosConfig);
      const data = res.data?.data ?? res.data;
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch failed:', err);
      setError('Failed to load members. Check API connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  // ─────────────────────────────────
  // Modal helpers
  // ─────────────────────────────────
  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setImgFile(null);
    setImgPreview(null);
    setShowModal(true);
  };

  const openEdit = (member) => {
    setEditTarget(member);
    setForm({ name: member.name, position: member.position, status: !!member.status });
    setImgFile(null);
    setImgPreview(resolveImg(member));
    setShowModal(true);
  };

  const handleImgChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  };

  // ─────────────────────────────────
  // Create
  // ─────────────────────────────────
  const handleAdd = async () => {
    if (!form.name.trim() || !form.position.trim()) {
      alert('Name and Position are required.');
      return;
    }
    if (!imgFile) {
      alert('A photo is required when adding a member.');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name',           form.name);
      fd.append('position',       form.position);
      fd.append('status',         form.status ? 1 : 0);  // boolean → 0/1 for Laravel
      fd.append('leadership_img', imgFile);

      const res = await axios.post(`${BASE}/api/leadership`, fd, {
        ...axiosConfig,
        headers: { ...axiosConfig.headers, 'Content-Type': 'multipart/form-data' },
      });

      setMembers((prev) => [...prev, res.data.data]);
      setShowModal(false);
    } catch (err) {
      console.error('Add failed:', err);
      alert(parseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────
  // Update
  // ─────────────────────────────────
  const handleEdit = async () => {
    if (!form.name.trim() || !form.position.trim()) {
      alert('Name and Position are required.');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name',     form.name);
      fd.append('position', form.position);
      fd.append('status',   form.status ? 1 : 0);
      fd.append('_method',  'PUT');                       // Laravel method spoofing
      if (imgFile) fd.append('leadership_img', imgFile);

      const res = await axios.post(`${BASE}/api/leadership/${getId(editTarget)}`, fd, {
        ...axiosConfig,
        headers: { ...axiosConfig.headers, 'Content-Type': 'multipart/form-data' },
      });

      setMembers((prev) =>
        prev.map((m) => getId(m) === getId(editTarget) ? res.data.data : m)
      );
      setShowModal(false);
    } catch (err) {
      console.error('Edit failed:', err);
      alert(parseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────
  // Toggle visibility (inline PATCH)
  // ─────────────────────────────────
  const toggleVisible = async (member) => {
    const newStatus = member.status ? 0 : 1;

    // Optimistic update
    setMembers((prev) =>
      prev.map((m) => getId(m) === getId(member) ? { ...m, status: newStatus } : m)
    );

    try {
      const fd = new FormData();
      fd.append('status',  newStatus);
      fd.append('_method', 'PUT');

      await axios.post(`${BASE}/api/leadership/${getId(member)}`, fd, {
        ...axiosConfig,
        headers: { ...axiosConfig.headers, 'Content-Type': 'multipart/form-data' },
      });
    } catch (err) {
      console.error('Toggle failed:', err);
      // Revert on failure
      setMembers((prev) =>
        prev.map((m) => getId(m) === getId(member) ? { ...m, status: member.status } : m)
      );
      alert(parseError(err));
    }
  };

  // ─────────────────────────────────
  // Delete
  // ─────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`${BASE}/api/leadership/${getId(deleteTarget)}`, axiosConfig);
      setMembers((prev) => prev.filter((m) => getId(m) !== getId(deleteTarget)));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete failed:', err);
      alert(parseError(err));
    } finally {
      setDeleting(false);
    }
  };

  // ─────────────────────────────────
  // Unified save dispatcher
  // ─────────────────────────────────
  const saveForm = () => {
    if (editTarget === null) handleAdd();
    else handleEdit();
  };

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <div className="lm-layout">
      <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="lm-body">

        {/* Mobile top bar */}
        <div className="lm-topbar">
          <button className="lm-hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">☰</button>
          <div className="lm-topbar__heading">
            <span className="lm-topbar__icon">🏆</span>
            <span className="lm-topbar__label">Leadership Management</span>
          </div>
        </div>

        <div className="lm-page">

          {/* Desktop page header */}
          <div className="lm-page-header">
            <div>
              <h2 className="lm-page-header__title">Leadership Management</h2>
              <p className="lm-page-header__sub">Manage leadership, workers and their committee</p>
            </div>
            <button className="lm-btn lm-btn--add" onClick={openAdd}>
              <span className="lm-btn__plus">＋</span> Add Team Member
            </button>
          </div>

          {/* Mobile add button */}
          <div className="lm-mobile-add">
            <button className="lm-btn lm-btn--add" onClick={openAdd}>
              <span className="lm-btn__plus">＋</span> Add Team Member
            </button>
          </div>

          {/* Error banner */}
          {error && (
            <div style={{
              margin: '0 0 16px', padding: '12px 16px', background: '#FEF2F2',
              border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '13px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>⚠️ {error}</span>
              <button
                onClick={fetchMembers}
                style={{ fontSize: '12px', color: '#155DFC', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >Retry</button>
            </div>
          )}

          {/* ── Table ── */}
          <div className="lm-table-wrap">
            <table className="lm-table">
              <thead>
                <tr>
                  <th className="lm-th lm-th--num">#</th>
                  <th className="lm-th lm-th--img">Image</th>
                  <th className="lm-th lm-th--name">Full Name</th>
                  <th className="lm-th lm-th--pos">Position</th>
                  <th className="lm-th lm-th--vis">Visible</th>
                  <th className="lm-th lm-th--act">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="lm-row">
                      {[40, 56, 180, 220, 80, 120].map((w, j) => (
                        <td key={j} className="lm-td" style={{ padding: '14px 16px' }}>
                          <div style={{
                            height: j === 1 ? '44px' : '14px',
                            width: j === 1 ? '44px' : `${w}px`,
                            borderRadius: j === 1 ? '50%' : '6px',
                            background: '#F1F5F9',
                            backgroundImage: 'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'lm-shimmer 1.4s infinite',
                          }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
                      No members found.
                    </td>
                  </tr>
                ) : (
                  members.map((m, idx) => {
                    const imgSrc = resolveImg(m);
                    return (
                      <tr key={getId(m)} className="lm-row">
                        <td className="lm-td lm-td--num">{idx + 1}</td>
                        <td className="lm-td lm-td--img">
                          <div
                            className="lm-avatar"
                            style={{ backgroundColor: imgSrc ? 'transparent' : AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
                          >
                            {imgSrc
                              ? <img src={imgSrc} alt={m.name} onError={(e) => { e.target.style.display = 'none'; }} />
                              : <span>{getInitials(m.name)}</span>
                            }
                          </div>
                        </td>
                        <td className="lm-td lm-td--name">{m.name}</td>
                        <td className="lm-td lm-td--pos">{m.position}</td>
                        <td className="lm-td lm-td--vis">
                          <button
                            className={`lm-badge ${m.status ? 'lm-badge--visible' : 'lm-badge--hidden'}`}
                            onClick={() => toggleVisible(m)}
                            title="Click to toggle visibility"
                          >
                            {m.status ? '● Visible' : '○ Hidden'}
                          </button>
                        </td>
                        <td className="lm-td lm-td--act">
                          <div className="lm-actions">
                            <button
                              className="lm-action-btn lm-action-btn--view"
                              onClick={() => setViewTarget(m)}
                              aria-label="View details"
                              title="View"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                              </svg>
                            </button>
                            <button
                              className="lm-action-btn lm-action-btn--edit"
                              onClick={() => openEdit(m)}
                              aria-label="Edit member"
                              title="Edit"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button
                              className="lm-action-btn lm-action-btn--del"
                              onClick={() => setDeleteTarget(m)}
                              aria-label="Delete member"
                              title="Delete"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                              </svg>
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

          {/* Member count */}
          {!loading && members.length > 0 && (
            <div style={{ padding: '10px 0 0', fontSize: '12px', color: '#94A3B8' }}>
              {members.length} member{members.length !== 1 ? 's' : ''} total
            </div>
          )}

        </div>
      </div>

      {/* ══════════════════════════════════════
          ADD / EDIT MODAL
      ══════════════════════════════════════ */}
      {showModal && (
        <div className="lm-overlay" onClick={() => setShowModal(false)}>
          <div className="lm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="lm-modal__title">
              {editTarget === null ? 'Add Team Member' : 'Edit Team Member'}
            </h3>

            {/* Image upload */}
            <label className="lm-modal__label">
              Photo {editTarget === null && <span style={{ color: '#DC2626' }}>*</span>}
            </label>
            <label
              htmlFor="lm-img-upload"
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                border: '2px dashed #CBD5E1', borderRadius: '10px',
                padding: '12px 16px', cursor: 'pointer', background: '#F8FAFC',
                marginBottom: '16px', transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#155DFC')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
            >
              {imgPreview ? (
                <img
                  src={imgPreview}
                  alt="preview"
                  style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #E2E8F0', flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%', background: '#E2E8F0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', flexShrink: 0,
                }}>🧑</div>
              )}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  {imgPreview ? 'Click to change photo' : 'Click to upload photo'}
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>JPEG, PNG — max 2 MB</div>
              </div>
              <input
                id="lm-img-upload"
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleImgChange}
                style={{ display: 'none' }}
              />
            </label>
            {imgPreview && (
              <button
                type="button"
                onClick={() => { setImgPreview(null); setImgFile(null); }}
                style={{ fontSize: '12px', color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '12px', padding: 0 }}
              >
                ✕ Remove photo
              </button>
            )}

            <label className="lm-modal__label">Full Name</label>
            <input
              className="lm-modal__input"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Ms. Shella R. Acibar"
            />

            <label className="lm-modal__label">Position</label>
            <input
              className="lm-modal__input"
              value={form.position}
              onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
              placeholder="e.g. Co-Owner of Jem 8 Circle"
            />

            <div className="lm-modal__toggle-row">
              <span className="lm-modal__label" style={{ margin: 0 }}>Visible on site</span>
              <button
                type="button"
                className={`lm-toggle ${form.status ? 'lm-toggle--on' : ''}`}
                onClick={() => setForm((p) => ({ ...p, status: !p.status }))}
              >
                <span className="lm-toggle__knob" />
              </button>
            </div>

            <div className="lm-modal__actions">
              <button
                className="lm-btn lm-btn--outline"
                onClick={() => setShowModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="lm-btn lm-btn--add"
                onClick={saveForm}
                disabled={submitting}
              >
                {submitting
                  ? (editTarget === null ? 'Adding…' : 'Saving…')
                  : (editTarget === null ? 'Add Member' : 'Save Changes')
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          VIEW MODAL
      ══════════════════════════════════════ */}
      {viewTarget && (() => {
        const imgSrc = resolveImg(viewTarget);
        return (
          <div className="lm-overlay" onClick={() => setViewTarget(null)}>
            <div className="lm-modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="lm-modal__title">Member Details</h3>
              <div className="lm-modal__avatar-wrap">
                <div
                  className="lm-avatar lm-avatar--lg"
                  style={{ backgroundColor: imgSrc ? 'transparent' : '#a8d5ba' }}
                >
                  {imgSrc
                    ? <img src={imgSrc} alt={viewTarget.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} onError={(e) => { e.target.style.display = 'none'; }} />
                    : <span>{getInitials(viewTarget.name)}</span>
                  }
                </div>
              </div>
              <p className="lm-modal__detail-name">{viewTarget.name}</p>
              <p className="lm-modal__detail-pos">{viewTarget.position}</p>
              <p
                className={`lm-badge ${viewTarget.status ? 'lm-badge--visible' : 'lm-badge--hidden'}`}
                style={{ display: 'inline-block', margin: '8px auto 0' }}
              >
                {viewTarget.status ? '● Visible' : '○ Hidden'}
              </p>
              <div className="lm-modal__actions" style={{ marginTop: '20px' }}>
                <button className="lm-btn lm-btn--outline" onClick={() => setViewTarget(null)}>Close</button>
                <button className="lm-btn lm-btn--add" onClick={() => { openEdit(viewTarget); setViewTarget(null); }}>Edit</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════
          DELETE CONFIRM MODAL
      ══════════════════════════════════════ */}
      {deleteTarget && (
        <div className="lm-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="lm-modal lm-modal--sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="lm-modal__title">Delete Member?</h3>
            <p className="lm-modal__body-text">
              Are you sure you want to remove <strong>{deleteTarget.name}</strong>? This action cannot be undone.
            </p>
            <div className="lm-modal__actions">
              <button
                className="lm-btn lm-btn--outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="lm-btn lm-btn--danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes lm-shimmer {
          0%   { background-position: -200% 0 }
          100% { background-position:  200% 0 }
        }
      `}</style>
    </div>
  );
};

export default AdminLeadership;