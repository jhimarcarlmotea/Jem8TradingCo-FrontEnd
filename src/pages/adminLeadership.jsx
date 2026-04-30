import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminNav from '../components/AdminNav';

const BASE = 'http://127.0.0.1:8000';

const axiosConfig = {
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
};

// ── Design tokens (matches AdminOrders) ──────────────────────────────────────
const T = {
  blue50: '#EFF6FF', blue100: '#DBEAFE', blue500: '#3B82F6', blue600: '#2563EB', blue700: '#1D4ED8',
  green50: '#ECFDF5', green100: '#D1FAE5', green500: '#10B981', green600: '#059669',
  amber50: '#FFFBEB', amber100: '#FEF3C7', amber500: '#F59E0B', amber600: '#D97706',
  purple50: '#F5F3FF', purple100: '#EDE9FE', purple600: '#7C3AED',
  red50: '#FEF2F2', red100: '#FEE2E2', red500: '#EF4444', red600: '#DC2626',
  slate50: '#F8FAFC', slate100: '#F1F5F9', slate200: '#E2E8F0', slate300: '#CBD5E1',
  slate400: '#94A3B8', slate500: '#64748B', slate600: '#475569',
  slate700: '#374151', slate800: '#1E293B', slate900: '#0F172A',
  radius: { sm: 8, md: 12, lg: 16, xl: 20 },
  shadow: { sm: '0 1px 2px rgba(15,23,42,0.05)', md: '0 4px 12px rgba(15,23,42,0.08)', hover: '0 8px 24px rgba(15,23,42,0.12)' },
  font: "'DM Sans','Nunito',system-ui,sans-serif",
};

const cardStyle = {
  background: '#fff',
  borderRadius: T.radius.lg,
  border: `1px solid ${T.slate200}`,
  boxShadow: T.shadow.sm,
  overflow: 'hidden',
};

const inputStyle = {
  width: '100%', padding: '8px 12px',
  border: `1px solid ${T.slate200}`, borderRadius: T.radius.sm,
  fontSize: 13, color: T.slate900, background: '#fff',
  outline: 'none', boxSizing: 'border-box', fontFamily: T.font,
  transition: 'border-color 0.15s',
};

const labelStyle = {
  display: 'block', fontSize: 10, fontWeight: 700,
  color: T.slate400, marginBottom: 6,
  textTransform: 'uppercase', letterSpacing: '0.5px',
};

const btnBase = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 14px', borderRadius: T.radius.sm,
  fontSize: 12, fontWeight: 600, cursor: 'pointer',
  transition: 'all 0.12s', border: 'none', fontFamily: T.font,
};

const AVATAR_COLORS = ['#c2c2c2', '#a8d5ba', '#aac4e8', '#f5c6a0', '#d4b3f0', '#f9c0c0'];

const TEAMS = [
  { key: 'leadership', label: '👥 Leadership' },
  { key: 'appdev',     label: '💻 App Dev Team' },
];

const getId = (member) => member?.leadership_id ?? member?.id;

const resolveImg = (member) => {
  if (!member?.leadership_img) return null;
  const p = member.leadership_img;
  return p.startsWith('http') ? p : `${BASE}/storage/${p}`;
};

const getInitials = (name) =>
  name.split(' ').filter(Boolean).slice(-2).map((n) => n[0]).join('').toUpperCase();

const parseError = (err) => {
  const data = err.response?.data;
  if (!data) return 'An unexpected error occurred.';
  if (typeof data.message === 'object') return Object.values(data.message).flat().join('\n');
  return data.message ?? 'An unexpected error occurred.';
};

// ── Silhouette Placeholder ────────────────────────────────────────────────────
const SilhouettePlaceholder = () => (
  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#edf4f0' }}>
    <svg viewBox="0 0 100 100" width="62%" height="62%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="36" r="22" fill="#4d7b65" fillOpacity="0.28" />
      <ellipse cx="50" cy="86" rx="36" ry="22" fill="#4d7b65" fillOpacity="0.18" />
    </svg>
  </div>
);

// ── Overlay ───────────────────────────────────────────────────────────────────
const Overlay = ({ children, onClose, narrow }) => (
  <div
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, padding: 16,
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: '#fff', width: '100%',
        maxWidth: narrow ? 420 : 500,
        borderRadius: T.radius.xl,
        boxShadow: '0 24px 60px rgba(15,23,42,0.18)',
        maxHeight: '94vh', overflowY: 'auto',
      }}
    >
      {children}
    </div>
  </div>
);

// ── Modal Header ──────────────────────────────────────────────────────────────
const ModalHeader = ({ title, subtitle, onClose }) => (
  <div style={{
    position: 'sticky', top: 0, zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px', background: '#fff',
    borderBottom: `1px solid ${T.slate100}`,
    borderRadius: `${T.radius.xl}px ${T.radius.xl}px 0 0`,
  }}>
    <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.slate900 }}>{title}</h2>
      {subtitle && <p style={{ margin: '2px 0 0', fontSize: 11, color: T.slate400 }}>{subtitle}</p>}
    </div>
    <button
      onClick={onClose}
      style={{
        width: 32, height: 32, borderRadius: T.radius.sm,
        border: `1px solid ${T.slate200}`, background: T.slate50,
        color: T.slate500, fontSize: 16, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.12s', fontFamily: T.font,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = T.slate100)}
      onMouseLeave={(e) => (e.currentTarget.style.background = T.slate50)}
    >×</button>
  </div>
);

// ── Avatar Cell ───────────────────────────────────────────────────────────────
function AvatarCell({ member, idx }) {
  const imgSrc = resolveImg(member);
  return (
    <div style={{
      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
      background: imgSrc ? 'transparent' : AVATAR_COLORS[idx % AVATAR_COLORS.length],
      border: `1px solid ${T.slate200}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, color: T.slate600,
      overflow: 'hidden', position: 'relative',
    }}>
      {imgSrc
        ? <img src={imgSrc} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
        : getInitials(member.name)
      }
    </div>
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────
function DesktopSkeletons() {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} style={{ borderBottom: `1px solid ${T.slate100}` }}>
      {[40, 60, 50, '18%', '18%', 100, 90, 100].map((w, j) => (
        <td key={j} style={{ padding: '12px 14px' }}>
          <div style={{ width: j === 2 ? 38 : '80%', height: j === 2 ? 38 : 12, borderRadius: j === 2 ? '50%' : 6, background: T.slate100, animation: 'pulse 1.5s infinite' }} />
        </td>
      ))}
    </tr>
  ));
}

function MobileSkeletons() {
  return Array.from({ length: 4 }).map((_, i) => (
    <div key={i} style={{ background: '#fff', borderRadius: T.radius.lg, border: `1px solid ${T.slate200}`, padding: 14, boxShadow: T.shadow.sm }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: T.slate100, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ width: '60%', height: 12, borderRadius: 6, background: T.slate100, marginBottom: 6 }} />
          <div style={{ width: '80%', height: 10, borderRadius: 6, background: T.slate100 }} />
        </div>
        <div style={{ width: 60, height: 22, borderRadius: 20, background: T.slate100 }} />
      </div>
      <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: `1px solid ${T.slate100}` }}>
        {[1, 2, 3].map((j) => <div key={j} style={{ flex: 1, height: 28, borderRadius: T.radius.sm, background: T.slate100 }} />)}
      </div>
    </div>
  ));
}

// ── Main ──────────────────────────────────────────────────────────────────────
const AdminLeadership = () => {
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [members, setMembers]             = useState([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [activeTeam, setActiveTeam]       = useState('leadership');

  const [showModal, setShowModal]         = useState(false);
  const [editTarget, setEditTarget]       = useState(null);
  const [viewTarget, setViewTarget]       = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);

  const [form, setForm]                   = useState({ name: '', position: '', status: true, team: 'leadership' });
  const [imgFile, setImgFile]             = useState(null);
  const [imgPreview, setImgPreview]       = useState(null);
  const [submitting, setSubmitting]       = useState(false);
  const [deleting, setDeleting]           = useState(false);

  const filteredMembers = members.filter((m) => (m.team ?? 'leadership') === activeTeam);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await axios.get(`${BASE}/api/admin-leadership`, axiosConfig);
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

  const openAdd = () => {
    setEditTarget(null);
    setForm({ name: '', position: '', status: true, team: activeTeam });
    setImgFile(null);
    setImgPreview(null);
    setShowModal(true);
  };

  const openEdit = (member) => {
    setEditTarget(member);
    setForm({ name: member.name, position: member.position, status: !!member.status, team: member.team ?? 'leadership' });
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

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('position', form.position);
    fd.append('status', form.status ? 1 : 0);
    fd.append('team', form.team);
    if (imgFile) fd.append('leadership_img', imgFile);
    return fd;
  };

  const handleAdd = async () => {
    if (!form.name.trim() || !form.position.trim()) { alert('Name and Position are required.'); return; }
    setSubmitting(true);
    try {
      const res = await axios.post(`${BASE}/api/admin-leadership`, buildFormData(), {
        ...axiosConfig,
        headers: { ...axiosConfig.headers, 'Content-Type': 'multipart/form-data' },
      });
      setMembers((prev) => [...prev, res.data.data]);
      setShowModal(false);
    } catch (err) { alert(parseError(err)); }
    finally { setSubmitting(false); }
  };

  const handleEdit = async () => {
    if (!form.name.trim() || !form.position.trim()) { alert('Name and Position are required.'); return; }
    setSubmitting(true);
    try {
      const res = await axios.post(`${BASE}/api/admin-leadership/${getId(editTarget)}`, buildFormData(), {
        ...axiosConfig,
        headers: { ...axiosConfig.headers, 'Content-Type': 'multipart/form-data' },
      });
      setMembers((prev) => prev.map((m) => getId(m) === getId(editTarget) ? res.data.data : m));
      setShowModal(false);
    } catch (err) { alert(parseError(err)); }
    finally { setSubmitting(false); }
  };

  const toggleVisible = async (member) => {
    const newStatus = member.status ? 0 : 1;
    setMembers((prev) => prev.map((m) => getId(m) === getId(member) ? { ...m, status: newStatus } : m));
    try {
      const fd = new FormData();
      fd.append('status', newStatus);
      await axios.post(`${BASE}/api/admin-leadership/${getId(member)}`, fd, {
        ...axiosConfig,
        headers: { ...axiosConfig.headers, 'Content-Type': 'multipart/form-data' },
      });
    } catch (err) {
      setMembers((prev) => prev.map((m) => getId(m) === getId(member) ? { ...m, status: member.status } : m));
      alert(parseError(err));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`${BASE}/api/admin-leadership/${getId(deleteTarget)}`, axiosConfig);
      setMembers((prev) => prev.filter((m) => getId(m) !== getId(deleteTarget)));
      setDeleteTarget(null);
    } catch (err) { alert(parseError(err)); }
    finally { setDeleting(false); }
  };

  const saveForm = () => editTarget === null ? handleAdd() : handleEdit();

  const summaryStats = [
    { label: 'Total Members', value: loading ? '—' : members.length,                         icon: '👥', accent: T.blue600,   bg: T.blue50,   border: T.blue100   },
    { label: 'Leadership',    value: loading ? '—' : members.filter((m) => (m.team ?? 'leadership') === 'leadership').length, icon: '🏆', accent: T.purple600, bg: T.purple50, border: T.purple100 },
    { label: 'App Dev Team',  value: loading ? '—' : members.filter((m) => m.team === 'appdev').length, icon: '💻', accent: T.amber600,  bg: T.amber50,  border: T.amber100  },
    { label: 'Visible',       value: loading ? '—' : members.filter((m) => m.status).length,  icon: '✅', accent: T.green600,  bg: T.green50,  border: T.green100  },
    { label: 'Hidden',        value: loading ? '—' : members.filter((m) => !m.status).length, icon: '🙈', accent: T.slate500,  bg: T.slate50,  border: T.slate200  },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .al-sidebar { display: none; }
        @media (min-width: 1024px) { .al-sidebar { display: block; } }
        .al-hamburger { display: flex !important; }
        @media (min-width: 1024px) { .al-hamburger { display: none !important; } }
        .al-tbl-row:hover td { background: ${T.slate50} !important; }
        .al-stat-card:hover { transform: translateY(-2px); box-shadow: ${T.shadow.hover} !important; }
        .al-btn-action:hover { opacity: 0.75; }
        .al-mobile-card { display: block; }
        .al-desktop-table { display: none; }
        @media (min-width: 768px) { .al-mobile-card { display: none; } .al-desktop-table { display: block; } }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#F0F4F8', fontFamily: T.font }}>

        {/* Sidebar */}
        <div className="al-sidebar">
          <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </div>

        <main style={{ flex: 1, minWidth: 0, padding: '20px', overflowX: 'hidden' }}>

          {/* ── Top Bar ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, marginBottom: 20, background: '#fff',
            borderRadius: T.radius.lg, padding: '12px 16px',
            border: `1px solid ${T.slate200}`, boxShadow: T.shadow.sm,
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => setSidebarOpen(true)}
                className="al-hamburger"
                style={{
                  background: 'none', border: `1px solid ${T.slate200}`,
                  borderRadius: T.radius.sm, width: 36, height: 36,
                  alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 18, color: T.slate700,
                }}
              >☰</button>
              <div>
                <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.slate900, letterSpacing: '-0.3px' }}>Leadership Management</h1>
                <p style={{ margin: '1px 0 0', fontSize: 11, color: T.slate400 }}>Manage team members and visibility</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={fetchMembers}
                style={{ ...btnBase, background: '#fff', color: T.slate700, border: `1px solid ${T.slate200}` }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.slate50)}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
              >↻ Refresh</button>
              <button
                onClick={openAdd}
                style={{ ...btnBase, background: T.blue600, color: '#fff', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.blue700)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.blue600)}
              >+ Add Member</button>
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 16 }}>
            {summaryStats.map((stat) => (
              <div key={stat.label} className="al-stat-card" style={{
                background: '#fff', borderRadius: T.radius.lg, padding: '16px',
                border: `1px solid ${stat.border}`, boxShadow: T.shadow.sm,
                position: 'relative', overflow: 'hidden', transition: 'all 0.15s',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: stat.accent, borderRadius: `${T.radius.lg}px ${T.radius.lg}px 0 0` }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: T.slate400, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{stat.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: T.slate900, letterSpacing: '-0.5px', lineHeight: 1 }}>{stat.value}</div>
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: T.radius.sm, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Table Card ── */}
          <div style={cardStyle}>

            {/* Filter bar */}
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.slate100}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {/* Team Tabs */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {TEAMS.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setActiveTeam(t.key)}
                      style={{
                        ...btnBase,
                        padding: '6px 14px', fontSize: 12,
                        background: activeTeam === t.key ? T.blue600 : '#fff',
                        color: activeTeam === t.key ? '#fff' : T.slate600,
                        border: `1px solid ${activeTeam === t.key ? T.blue600 : T.slate200}`,
                        transition: 'all 0.12s',
                      }}
                    >
                      {t.label}
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
                        background: activeTeam === t.key ? 'rgba(255,255,255,0.2)' : T.slate100,
                        color: activeTeam === t.key ? '#fff' : T.slate500,
                      }}>
                        {members.filter((m) => (m.team ?? 'leadership') === t.key).length}
                      </span>
                    </button>
                  ))}
                </div>

                <div style={{ flex: 1 }} />

                <span style={{ fontSize: 11, color: T.slate400 }}>
                  {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} in {activeTeam === 'appdev' ? 'App Dev Team' : 'Leadership'}
                </span>
              </div>
            </div>

            {/* Error */}
            {error && !loading && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                margin: 16, padding: '12px 14px', fontSize: 12, color: T.red600,
                border: `1px solid ${T.red100}`, borderRadius: T.radius.md,
                background: T.red50,
              }}>
                ⚠️ {error}
                <button onClick={fetchMembers} style={{ ...btnBase, padding: '4px 10px', background: '#fff', color: T.red600, border: `1px solid ${T.red100}`, fontSize: 11 }}>Retry</button>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <>
                {/* Mobile */}
                <div className="al-mobile-card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <MobileSkeletons />
                </div>
                {/* Desktop */}
                <div className="al-desktop-table">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: T.slate50, borderBottom: `1px solid ${T.slate200}` }}>
                        {['#', 'Photo', 'Full Name', 'Position', 'Team', 'Visible', 'Actions'].map((h) => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 10, color: T.slate500, textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody><DesktopSkeletons /></tbody>
                  </table>
                </div>
              </>
            )}

            {/* Empty state */}
            {!loading && filteredMembers.length === 0 && !error && (
              <div style={{ padding: '60px 0', textAlign: 'center', color: T.slate400 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
                <div style={{ fontSize: 13 }}>No {activeTeam === 'appdev' ? 'App Dev' : 'Leadership'} members found.</div>
              </div>
            )}

            {/* Mobile Cards */}
            {!loading && filteredMembers.length > 0 && (
              <div className="al-mobile-card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredMembers.map((member, idx) => {
                  const imgSrc = resolveImg(member);
                  return (
                    <div key={getId(member)} style={{ background: '#fff', borderRadius: T.radius.lg, border: `1px solid ${T.slate200}`, padding: 14, boxShadow: T.shadow.sm }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                          background: imgSrc ? 'transparent' : AVATAR_COLORS[idx % AVATAR_COLORS.length],
                          border: `1px solid ${T.slate200}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700, color: T.slate600, overflow: 'hidden',
                        }}>
                          {imgSrc
                            ? <img src={imgSrc} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                            : getInitials(member.name)
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: T.slate900, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</div>
                          <div style={{ fontSize: 11, color: T.slate400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.position}</div>
                        </div>
                        <button
                          onClick={() => toggleVisible(member)}
                          style={{
                            fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                            background: member.status ? T.green50 : T.slate100,
                            color: member.status ? T.green600 : T.slate500,
                            border: `1px solid ${member.status ? T.green100 : T.slate200}`,
                            cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                          }}
                        >
                          {member.status ? '● Visible' : '○ Hidden'}
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: 6, paddingTop: 10, borderTop: `1px solid ${T.slate100}` }}>
                        {[
                          { label: '👁 View',   onClick: () => setViewTarget(member),   bg: T.blue50,  color: T.blue600,  border: T.blue100 },
                          { label: '✏️ Edit',  onClick: () => openEdit(member),         bg: '#fff',    color: T.slate700, border: T.slate200 },
                          { label: '🗑️ Delete', onClick: () => setDeleteTarget(member), bg: T.red50,   color: T.red600,   border: T.red100 },
                        ].map((btn) => (
                          <button
                            key={btn.label}
                            onClick={btn.onClick}
                            className="al-btn-action"
                            style={{
                              flex: 1, padding: '6px 4px', borderRadius: T.radius.sm,
                              fontSize: 11, fontWeight: 600,
                              background: btn.bg, color: btn.color,
                              border: `1px solid ${btn.border}`,
                              cursor: 'pointer', fontFamily: T.font,
                              transition: 'opacity 0.12s', textAlign: 'center',
                            }}
                          >{btn.label}</button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Desktop Table */}
            {!loading && filteredMembers.length > 0 && (
              <div className="al-desktop-table">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.slate50, borderBottom: `1px solid ${T.slate200}` }}>
                      {['#', 'Photo', 'Full Name', 'Position', 'Team', 'Visible', 'Actions'].map((h) => (
                        <th key={h} style={{
                          padding: '10px 14px', textAlign: h === 'Actions' ? 'center' : 'left',
                          fontWeight: 600, fontSize: 10, color: T.slate500,
                          textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member, idx) => {
                      const imgSrc = resolveImg(member);
                      return (
                        <tr key={getId(member)} className="al-tbl-row" style={{ borderBottom: `1px solid ${T.slate100}`, background: idx % 2 === 0 ? '#fff' : `${T.slate50}60`, transition: 'background 0.1s' }}>

                          {/* # */}
                          <td style={{ padding: '12px 14px', color: T.slate400, fontSize: 11, fontFamily: 'monospace', width: 48 }}>{idx + 1}</td>

                          {/* Photo */}
                          <td style={{ padding: '12px 14px', width: 60 }}>
                            <div style={{
                              width: 38, height: 38, borderRadius: '50%',
                              background: imgSrc ? 'transparent' : AVATAR_COLORS[idx % AVATAR_COLORS.length],
                              border: `1px solid ${T.slate200}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 12, fontWeight: 700, color: T.slate600, overflow: 'hidden',
                            }}>
                              {imgSrc
                                ? <img src={imgSrc} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                                : getInitials(member.name)
                              }
                            </div>
                          </td>

                          {/* Full Name */}
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: T.slate900 }}>{member.name}</div>
                          </td>

                          {/* Position */}
                          <td style={{ padding: '12px 14px', color: T.slate500, fontSize: 12 }}>{member.position}</td>

                          {/* Team */}
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              display: 'inline-block', fontSize: 10, fontWeight: 700,
                              padding: '3px 10px', borderRadius: 20,
                              background: member.team === 'appdev' ? T.amber50 : T.blue50,
                              color: member.team === 'appdev' ? T.amber600 : T.blue600,
                              border: `1px solid ${member.team === 'appdev' ? T.amber100 : T.blue100}`,
                            }}>
                              {member.team === 'appdev' ? '💻 App Dev' : '👥 Leadership'}
                            </span>
                          </td>

                          {/* Visible */}
                          <td style={{ padding: '12px 14px' }}>
                            <button
                              onClick={() => toggleVisible(member)}
                              style={{
                                fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                                background: member.status ? T.green50 : T.slate100,
                                color: member.status ? T.green600 : T.slate500,
                                border: `1px solid ${member.status ? T.green100 : T.slate200}`,
                                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.12s',
                              }}
                            >
                              {member.status ? '● Visible' : '○ Hidden'}
                            </button>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              {[
                                { label: '👁 View',   onClick: () => setViewTarget(member),   bg: T.blue50,  color: T.blue600,  border: T.blue100 },
                                { label: '✏️ Edit',  onClick: () => openEdit(member),         bg: '#fff',    color: T.slate700, border: T.slate200 },
                                { label: '🗑️',       onClick: () => setDeleteTarget(member), bg: T.red50,   color: T.red600,   border: T.red100 },
                              ].map((btn) => (
                                <button
                                  key={btn.label}
                                  onClick={btn.onClick}
                                  className="al-btn-action"
                                  style={{
                                    padding: '4px 8px', borderRadius: T.radius.sm,
                                    fontSize: 10, fontWeight: 600,
                                    background: btn.bg, color: btn.color,
                                    border: `1px solid ${btn.border}`,
                                    cursor: 'pointer', fontFamily: T.font,
                                    transition: 'opacity 0.12s', whiteSpace: 'nowrap',
                                  }}
                                >{btn.label}</button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Footer count */}
                <div style={{ padding: '12px 16px', borderTop: `1px solid ${T.slate100}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: T.slate400 }}>
                    {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} in {activeTeam === 'appdev' ? 'App Dev Team' : 'Leadership'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <Overlay onClose={() => setShowModal(false)}>
          <ModalHeader
            title={editTarget === null ? 'Add Team Member' : 'Edit Team Member'}
            subtitle={editTarget ? editTarget.name : undefined}
            onClose={() => setShowModal(false)}
          />
          <div style={{ padding: '20px 20px 24px' }}>

            {/* Image upload */}
            <div style={{ marginBottom: 16 }}>
              <div style={labelStyle}>Photo <span style={{ color: T.slate400, textTransform: 'none', fontWeight: 400 }}>(optional)</span></div>
              <label htmlFor="lm-img-upload" style={{
                display: 'flex', alignItems: 'center', gap: 12,
                border: `2px dashed ${T.slate300}`, borderRadius: T.radius.md,
                padding: '12px 14px', cursor: 'pointer', background: T.slate50,
                transition: 'border-color 0.15s',
              }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.blue500)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.slate300)}
              >
                <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative', background: imgPreview ? 'transparent' : T.slate200, border: `2px solid ${T.slate200}` }}>
                  {imgPreview
                    ? <img src={imgPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <SilhouettePlaceholder />
                  }
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.slate700 }}>{imgPreview ? 'Click to change photo' : 'Click to upload photo'}</div>
                  <div style={{ fontSize: 11, color: T.slate400, marginTop: 2 }}>JPEG, PNG — max 40 MB · Optional</div>
                </div>
                <input id="lm-img-upload" type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleImgChange} style={{ display: 'none' }} />
              </label>
              {imgPreview && (
                <button type="button" onClick={() => { setImgPreview(null); setImgFile(null); }}
                  style={{ marginTop: 6, fontSize: 11, color: T.red600, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                  ✕ Remove photo
                </button>
              )}
            </div>

            {/* Team selector */}
            <div style={{ marginBottom: 16 }}>
              <div style={labelStyle}>Team</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {TEAMS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, team: t.key }))}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: T.radius.sm,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      background: form.team === t.key ? T.blue600 : '#fff',
                      color: form.team === t.key ? '#fff' : T.slate600,
                      border: `1px solid ${form.team === t.key ? T.blue600 : T.slate200}`,
                      transition: 'all 0.12s', fontFamily: T.font,
                    }}
                  >{t.label}</button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div style={{ marginBottom: 16 }}>
              <div style={labelStyle}>Full Name</div>
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Ms. Shella R. Acibar"
                onFocus={(e) => (e.target.style.borderColor = T.blue500)}
                onBlur={(e) => (e.target.style.borderColor = T.slate200)}
              />
            </div>

            {/* Position */}
            <div style={{ marginBottom: 16 }}>
              <div style={labelStyle}>Position</div>
              <input
                style={inputStyle}
                value={form.position}
                onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
                placeholder="e.g. Co-Owner of Jem 8 Circle"
                onFocus={(e) => (e.target.style.borderColor = T.blue500)}
                onBlur={(e) => (e.target.style.borderColor = T.slate200)}
              />
            </div>

            {/* Visible toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, padding: '10px 14px', background: T.slate50, borderRadius: T.radius.sm, border: `1px solid ${T.slate200}` }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.slate700 }}>Visible on site</div>
                <div style={{ fontSize: 11, color: T.slate400, marginTop: 1 }}>Member will appear on the public page</div>
              </div>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, status: !p.status }))}
                style={{
                  position: 'relative', width: 44, height: 24, borderRadius: 12,
                  border: 'none', cursor: 'pointer', flexShrink: 0,
                  background: form.status ? T.blue600 : T.slate300,
                  transition: 'background 0.2s',
                }}
              >
                <span style={{
                  position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%',
                  background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  transition: 'left 0.2s',
                  left: form.status ? 22 : 2,
                }} />
              </button>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowModal(false)} disabled={submitting} style={{ ...btnBase, flex: 1, justifyContent: 'center', padding: '10px 0', background: '#fff', color: T.slate700, border: `1px solid ${T.slate200}` }}>
                Cancel
              </button>
              <button onClick={saveForm} disabled={submitting} style={{
                ...btnBase, flex: 2, justifyContent: 'center', padding: '10px 0',
                background: submitting ? T.slate300 : T.blue600, color: '#fff',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}>
                {submitting ? (editTarget === null ? 'Adding…' : 'Saving…') : (editTarget === null ? 'Add Member' : '💾 Save Changes')}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ── View Modal ── */}
      {viewTarget && (() => {
        const imgSrc = resolveImg(viewTarget);
        return (
          <Overlay onClose={() => setViewTarget(null)} narrow>
            <ModalHeader title="Member Details" onClose={() => setViewTarget(null)} />
            <div style={{ padding: '20px 20px 24px', textAlign: 'center' }}>
              {/* Avatar */}
              <div style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 14px',
                background: imgSrc ? 'transparent' : '#a8d5ba',
                border: `2px solid ${T.slate200}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', position: 'relative',
              }}>
                {imgSrc
                  ? <img src={imgSrc} alt={viewTarget.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                  : <SilhouettePlaceholder />
                }
              </div>

              <div style={{ fontWeight: 700, fontSize: 16, color: T.slate900, marginBottom: 4 }}>{viewTarget.name}</div>
              <div style={{ fontSize: 13, color: T.slate400, marginBottom: 8 }}>{viewTarget.position}</div>

              {/* Team badge */}
              <div style={{ marginBottom: 12 }}>
                <span style={{
                  display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20,
                  background: viewTarget.team === 'appdev' ? T.amber50 : T.blue50,
                  color: viewTarget.team === 'appdev' ? T.amber600 : T.blue600,
                  border: `1px solid ${viewTarget.team === 'appdev' ? T.amber100 : T.blue100}`,
                }}>
                  {viewTarget.team === 'appdev' ? '💻 App Dev Team' : '👥 Leadership'}
                </span>
              </div>

              {/* Visibility */}
              <span style={{
                display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20,
                background: viewTarget.status ? T.green50 : T.slate100,
                color: viewTarget.status ? T.green600 : T.slate500,
                border: `1px solid ${viewTarget.status ? T.green100 : T.slate200}`,
              }}>
                {viewTarget.status ? '● Visible' : '○ Hidden'}
              </span>

              {/* Info rows */}
              <div style={{ margin: '16px 0', padding: '12px 14px', background: T.slate50, border: `1px solid ${T.slate200}`, borderRadius: T.radius.md, textAlign: 'left' }}>
                {[
                  { label: 'Full Name', value: viewTarget.name },
                  { label: 'Position', value: viewTarget.position },
                  { label: 'Team', value: viewTarget.team === 'appdev' ? 'App Dev Team' : 'Leadership' },
                  { label: 'Status', value: viewTarget.status ? 'Visible' : 'Hidden' },
                ].map((row) => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: `1px solid ${T.slate100}` }}>
                    <span style={{ color: T.slate400, fontWeight: 600 }}>{row.label}</span>
                    <span style={{ color: T.slate800, fontWeight: 500 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setViewTarget(null)} style={{ ...btnBase, flex: 1, justifyContent: 'center', padding: '10px 0', background: '#fff', color: T.slate700, border: `1px solid ${T.slate200}` }}>
                  Close
                </button>
                <button onClick={() => { openEdit(viewTarget); setViewTarget(null); }} style={{ ...btnBase, flex: 2, justifyContent: 'center', padding: '10px 0', background: T.blue600, color: '#fff' }}>
                  ✏️ Edit Member
                </button>
              </div>
            </div>
          </Overlay>
        );
      })()}

      {/* ── Delete Modal ── */}
      {deleteTarget && (
        <Overlay onClose={() => setDeleteTarget(null)} narrow>
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>🗑️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: T.slate900 }}>Delete Member?</h3>
            <p style={{ margin: '0 0 6px', fontSize: 13, color: T.slate500 }}>
              "<strong style={{ color: T.slate700 }}>{deleteTarget.name}</strong>"
            </p>
            <p style={{ margin: '0 0 24px', fontSize: 12, color: T.slate400 }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} style={{ ...btnBase, flex: 1, justifyContent: 'center', padding: '10px 0', background: '#fff', color: T.slate700, border: `1px solid ${T.slate200}` }}>
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleting} style={{
                ...btnBase, flex: 2, justifyContent: 'center', padding: '10px 0',
                background: deleting ? T.red100 : T.red600, color: '#fff',
                cursor: deleting ? 'not-allowed' : 'pointer',
              }}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </>
  );
};

export default AdminLeadership;