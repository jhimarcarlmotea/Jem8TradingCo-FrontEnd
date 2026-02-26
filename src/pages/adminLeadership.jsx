import { useState } from 'react';
import AdminNav from '../components/AdminNav';
import '../style/adminLeadership.css';

const initialMembers = [
  { id: 1, name: 'Ms. Shella R. Acibar',  position: 'Co-Owner of Jem 8 Circle',          visible: true,  img: null },
  { id: 2, name: 'Ms. Jinkie Malinag',     position: 'Co-Owner of Jem 8 Circle',          visible: true,  img: null },
  { id: 3, name: 'Ms. Akiko Serrano',      position: 'Sales Executive of Jem 8 Circle',   visible: true,  img: null },
  { id: 4, name: 'Ms. Shella R. Acibar',  position: 'Co-Owner of Jem 8 Circle',          visible: true,  img: null },
  { id: 5, name: 'Ms. Jinkie Malinag',     position: 'Co-Owner of Jem 8 Circle',          visible: true,  img: null },
  { id: 6, name: 'Ms. Akiko Serrano',      position: 'Sales Executive of Jem 8 Circle',   visible: true,  img: null },
  { id: 7, name: 'Ms. Jinkie Malinag',     position: 'Co-Owner of Jem 8 Circle',          visible: true,  img: null },
  { id: 8, name: 'Ms. Shella R. Acibar',  position: 'Co-Owner of Jem 8 Circle',          visible: false, img: null },
];

const getInitials = (name) =>
  name.split(' ').filter(Boolean).slice(-2).map(n => n[0]).join('').toUpperCase();

const AVATAR_COLORS = ['#c2c2c2', '#a8d5ba', '#aac4e8', '#f5c6a0', '#d4b3f0', '#f9c0c0'];

const AdminLeadership = () => {
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [members, setMembers]           = useState(initialMembers);
  const [showModal, setShowModal]       = useState(false);
  const [editTarget, setEditTarget]     = useState(null);   // null = add, id = edit
  const [form, setForm]                 = useState({ name: '', position: '', visible: true });
  const [viewTarget, setViewTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ── helpers ── */
  const openAdd = () => {
    setEditTarget(null);
    setForm({ name: '', position: '', visible: true });
    setShowModal(true);
  };

  const openEdit = (member) => {
    setEditTarget(member.id);
    setForm({ name: member.name, position: member.position, visible: member.visible });
    setShowModal(true);
  };

  const saveForm = () => {
    if (!form.name.trim() || !form.position.trim()) return;
    if (editTarget === null) {
      setMembers(prev => [...prev, { id: Date.now(), ...form, img: null }]);
    } else {
      setMembers(prev => prev.map(m => m.id === editTarget ? { ...m, ...form } : m));
    }
    setShowModal(false);
  };

  const confirmDelete = () => {
    setMembers(prev => prev.filter(m => m.id !== deleteTarget));
    setDeleteTarget(null);
  };

  const toggleVisible = (id) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, visible: !m.visible } : m));
  };

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
                {members.map((m, idx) => (
                  <tr key={m.id} className="lm-row">
                    <td className="lm-td lm-td--num">{idx + 1}</td>
                    <td className="lm-td lm-td--img">
                      <div
                        className="lm-avatar"
                        style={{ backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
                      >
                        {m.img
                          ? <img src={m.img} alt={m.name} />
                          : <span>{getInitials(m.name)}</span>
                        }
                      </div>
                    </td>
                    <td className="lm-td lm-td--name">{m.name}</td>
                    <td className="lm-td lm-td--pos">{m.position}</td>
                    <td className="lm-td lm-td--vis">
                      <button
                        className={`lm-badge ${m.visible ? 'lm-badge--visible' : 'lm-badge--hidden'}`}
                        onClick={() => toggleVisible(m.id)}
                        title="Click to toggle visibility"
                      >
                        {m.visible ? '● Visible' : '○ Hidden'}
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
                          onClick={() => setDeleteTarget(m.id)}
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
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="lm-overlay" onClick={() => setShowModal(false)}>
          <div className="lm-modal" onClick={e => e.stopPropagation()}>
            <h3 className="lm-modal__title">{editTarget === null ? 'Add Team Member' : 'Edit Team Member'}</h3>

            <label className="lm-modal__label">Full Name</label>
            <input
              className="lm-modal__input"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Ms. Shella R. Acibar"
            />

            <label className="lm-modal__label">Position</label>
            <input
              className="lm-modal__input"
              value={form.position}
              onChange={e => setForm(p => ({ ...p, position: e.target.value }))}
              placeholder="e.g. Co-Owner of Jem 8 Circle"
            />

            <div className="lm-modal__toggle-row">
              <span className="lm-modal__label" style={{ margin: 0 }}>Visible on site</span>
              <button
                type="button"
                className={`lm-toggle ${form.visible ? 'lm-toggle--on' : ''}`}
                onClick={() => setForm(p => ({ ...p, visible: !p.visible }))}
              >
                <span className="lm-toggle__knob" />
              </button>
            </div>

            <div className="lm-modal__actions">
              <button className="lm-btn lm-btn--outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="lm-btn lm-btn--add" onClick={saveForm}>
                {editTarget === null ? 'Add Member' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Modal ── */}
      {viewTarget && (
        <div className="lm-overlay" onClick={() => setViewTarget(null)}>
          <div className="lm-modal" onClick={e => e.stopPropagation()}>
            <h3 className="lm-modal__title">Member Details</h3>
            <div className="lm-modal__avatar-wrap">
              <div className="lm-avatar lm-avatar--lg" style={{ backgroundColor: '#a8d5ba' }}>
                <span>{getInitials(viewTarget.name)}</span>
              </div>
            </div>
            <p className="lm-modal__detail-name">{viewTarget.name}</p>
            <p className="lm-modal__detail-pos">{viewTarget.position}</p>
            <p className={`lm-badge ${viewTarget.visible ? 'lm-badge--visible' : 'lm-badge--hidden'}`} style={{ display: 'inline-block', margin: '8px auto 0' }}>
              {viewTarget.visible ? '● Visible' : '○ Hidden'}
            </p>
            <div className="lm-modal__actions" style={{ marginTop: '20px' }}>
              <button className="lm-btn lm-btn--outline" onClick={() => setViewTarget(null)}>Close</button>
              <button className="lm-btn lm-btn--add" onClick={() => { openEdit(viewTarget); setViewTarget(null); }}>Edit</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget !== null && (
        <div className="lm-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="lm-modal lm-modal--sm" onClick={e => e.stopPropagation()}>
            <h3 className="lm-modal__title">Delete Member?</h3>
            <p className="lm-modal__body-text">This action cannot be undone. Are you sure you want to remove this team member?</p>
            <div className="lm-modal__actions">
              <button className="lm-btn lm-btn--outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="lm-btn lm-btn--danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeadership;