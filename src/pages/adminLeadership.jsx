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

const getInitials = (name) =>
  name.split(' ').filter(Boolean).slice(-2).map((n) => n[0]).join('').toUpperCase();

const AVATAR_COLORS = ['#c2c2c2', '#a8d5ba', '#aac4e8', '#f5c6a0', '#d4b3f0', '#f9c0c0'];

const getId = (member) => member?.leadership_id ?? member?.id;

const resolveImg = (member) => {
  if (!member?.leadership_img) return null;
  const p = member.leadership_img;
  return p.startsWith('http') ? p : `${BASE}/storage/${p}`;
};

const parseError = (err) => {
  const data = err.response?.data;
  if (!data) return 'An unexpected error occurred.';
  if (typeof data.message === 'object') {
    return Object.values(data.message).flat().join('\n');
  }
  return data.message ?? 'An unexpected error occurred.';
};

const inputCls = "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-[13px] text-slate-900 bg-white outline-none box-border font-[inherit] placeholder-slate-400 focus:border-blue-500 transition-colors disabled:opacity-50";
const labelCls = "block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide";

// ─── Overlay ──────────────────────────────────────────────────────────────────
function Overlay({ children, onClose, narrow }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/55 backdrop-blur-[4px] flex items-center justify-center z-[1000] p-3 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        data-overlay
        className={`bg-white w-full rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.18)] max-h-[94vh] overflow-y-auto ${narrow ? "max-w-[400px]" : "max-w-[500px]"}`}
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

// ─── Mobile Member Card ───────────────────────────────────────────────────────
function MemberCard({ member, idx, onView, onEdit, onDelete, onToggle }) {
  const imgSrc = resolveImg(member);
  return (
    <div className="overflow-hidden bg-white border shadow-sm rounded-xl border-slate-100">
      <div className="p-3">
        <div className="flex items-center gap-3 mb-2.5">
          <div
            className="flex items-center justify-center flex-shrink-0 w-12 h-12 overflow-hidden border rounded-full border-slate-100"
            style={{ backgroundColor: imgSrc ? 'transparent' : AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
          >
            {imgSrc
              ? <img src={imgSrc} alt={member.name} className="object-cover w-full h-full" onError={(e) => { e.target.style.display = 'none'; }} />
              : <span className="text-sm font-bold text-slate-600">{getInitials(member.name)}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-900 text-[13px] leading-snug truncate">{member.name}</div>
            <div className="text-xs truncate text-slate-400">{member.position}</div>
          </div>
          <button
            onClick={onToggle}
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 cursor-pointer transition-colors
              ${member.status
                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                : "bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200"
              }`}
          >
            {member.status ? '● Visible' : '○ Hidden'}
          </button>
        </div>

        <div className="flex gap-1.5 pt-2.5 border-t border-slate-100">
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

// ─── Skeletons ────────────────────────────────────────────────────────────────
function MobileSkeletons() {
  return Array.from({ length: 4 }).map((_, i) => (
    <div key={i} className="overflow-hidden bg-white border rounded-xl border-slate-100">
      <div className="p-3">
        <div className="flex items-center gap-3 mb-2.5">
          <div className="flex-shrink-0 w-12 h-12 rounded-full animate-pulse bg-slate-100" />
          <div className="flex-1 space-y-1.5">
            <div className="w-32 h-3.5 rounded-md animate-pulse bg-slate-100" />
            <div className="h-3 rounded-md w-44 animate-pulse bg-slate-100" />
          </div>
          <div className="w-16 h-6 rounded-full animate-pulse bg-slate-100" />
        </div>
        <div className="flex gap-1.5 pt-2.5 border-t border-slate-100">
          <div className="flex-1 rounded-lg h-7 animate-pulse bg-slate-100" />
          <div className="flex-1 rounded-lg h-7 animate-pulse bg-slate-100" />
          <div className="flex-1 rounded-lg h-7 animate-pulse bg-slate-100" />
        </div>
      </div>
    </div>
  ));
}

function DesktopSkeletons() {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} className="border-b border-slate-50">
      <td className="px-4 py-3.5"><div className="w-6 h-3.5 rounded-md animate-pulse bg-slate-100" /></td>
      <td className="px-4 py-3.5"><div className="rounded-full w-11 h-11 animate-pulse bg-slate-100" /></td>
      <td className="px-4 py-3.5"><div className="w-36 h-3.5 rounded-md animate-pulse bg-slate-100" /></td>
      <td className="px-4 py-3.5"><div className="w-48 h-3.5 rounded-md animate-pulse bg-slate-100" /></td>
      <td className="px-4 py-3.5"><div className="w-16 h-6 rounded-full animate-pulse bg-slate-100" /></td>
      <td className="px-4 py-3.5">
        <div className="flex gap-1.5">
          <div className="w-8 rounded-md h-7 animate-pulse bg-slate-100" />
          <div className="w-8 rounded-md h-7 animate-pulse bg-slate-100" />
          <div className="w-8 rounded-md h-7 animate-pulse bg-slate-100" />
        </div>
      </td>
    </tr>
  ));
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const AdminLeadership = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [members, setMembers]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  const [showModal, setShowModal]       = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [viewTarget, setViewTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const emptyForm = { name: '', position: '', status: true };
  const [form, setForm]             = useState(emptyForm);
  const [imgFile, setImgFile]       = useState(null);
  const [imgPreview, setImgPreview] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting]     = useState(false);

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

  const handleAdd = async () => {
    if (!form.name.trim() || !form.position.trim()) { alert('Name and Position are required.'); return; }
    if (!imgFile) { alert('A photo is required when adding a member.'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('position', form.position);
      fd.append('status', form.status ? 1 : 0);
      fd.append('leadership_img', imgFile);
      const res = await axios.post(`${BASE}/api/admin-leadership`, fd, {
        ...axiosConfig,
        headers: { ...axiosConfig.headers, 'Content-Type': 'multipart/form-data' },
      });
      setMembers((prev) => [...prev, res.data.data]);
      setShowModal(false);
    } catch (err) {
      alert(parseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!form.name.trim() || !form.position.trim()) { alert('Name and Position are required.'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('position', form.position);
      fd.append('status', form.status ? 1 : 0);
      fd.append('_method', 'POST');
      if (imgFile) fd.append('leadership_img', imgFile);
      const res = await axios.post(`${BASE}/api/admin-leadership/${getId(editTarget)}`, fd, {
        ...axiosConfig,
        headers: { ...axiosConfig.headers, 'Content-Type': 'multipart/form-data' },
      });
      setMembers((prev) => prev.map((m) => getId(m) === getId(editTarget) ? res.data.data : m));
      setShowModal(false);
    } catch (err) {
      alert(parseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleVisible = async (member) => {
    const newStatus = member.status ? 0 : 1;
    setMembers((prev) => prev.map((m) => getId(m) === getId(member) ? { ...m, status: newStatus } : m));
    try {
      const fd = new FormData();
      fd.append('status', newStatus);
      fd.append('_method', 'PUT');
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
    } catch (err) {
      alert(parseError(err));
    } finally {
      setDeleting(false);
    }
  };

  const saveForm = () => editTarget === null ? handleAdd() : handleEdit();

  return (
    <div className="flex min-h-screen bg-[#F0F7F2] font-sans">
      <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 w-0 min-w-0 pb-10 overflow-x-hidden">

        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 pt-4 pb-0 sm:pt-5 sm:px-7">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-xl bg-transparent border-none cursor-pointer lg:hidden text-slate-700"
            >☰</button>
            <h1 className="m-0 text-[18px] sm:text-xl font-bold text-slate-900">Leadership Management</h1>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 border-none rounded-lg bg-blue-600 text-white text-[13px] font-semibold cursor-pointer hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            + Add Member
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3.5 px-3 sm:px-7 py-4 sm:py-5">
          {[
            { label: "Total Members", value: loading ? "—" : members.length,                                      sub: "All team members" },
            { label: "Visible",       value: loading ? "—" : members.filter((m) => m.status).length,              sub: "Shown on site"    },
            { label: "Hidden",        value: loading ? "—" : members.filter((m) => !m.status).length,             sub: "Not displayed"    },
          ].map((s) => (
            <div key={s.label} className="px-3 py-3 bg-white border shadow-sm sm:px-4 sm:py-4 rounded-xl border-slate-100">
              <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1 sm:mb-1.5 leading-tight">{s.label}</div>
              <div className="text-[22px] sm:text-[26px] font-extrabold text-slate-900 leading-none">{s.value}</div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 mt-1 font-semibold tracking-wide">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-3 sm:mx-7 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[13px] flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={fetchMembers} className="text-xs text-blue-600 underline bg-transparent border-none cursor-pointer">Retry</button>
          </div>
        )}

        {/* ── Mobile card grid ── */}
        {!loading && members.length > 0 && (
          <div className="block px-3 pb-4 sm:hidden">
            <div className="grid grid-cols-1 gap-3">
              {members.map((member, idx) => (
                <MemberCard
                  key={getId(member)}
                  member={member}
                  idx={idx}
                  onView={() => setViewTarget(member)}
                  onEdit={() => openEdit(member)}
                  onDelete={() => setDeleteTarget(member)}
                  onToggle={() => toggleVisible(member)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Mobile skeleton */}
        {loading && (
          <div className="block px-3 pb-4 space-y-3 sm:hidden">
            <MobileSkeletons />
          </div>
        )}

        {/* Empty state */}
        {!loading && members.length === 0 && !error && (
          <div className="mx-3 sm:mx-7 bg-white rounded-[14px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="py-12 text-sm text-center text-slate-400">No members found.</div>
          </div>
        )}

        {/* ── Desktop table ── */}
        {!loading && members.length > 0 && (
          <div className="hidden sm:block mx-7 bg-white rounded-[14px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead className="border-b bg-slate-50 border-slate-100">
                  <tr>
                    {["#", "Image", "Full Name", "Position", "Visible", "Action"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 tracking-[0.06em] uppercase whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member, idx) => {
                    const imgSrc = resolveImg(member);
                    return (
                      <tr key={getId(member)} className="border-b border-slate-50 last:border-b-0 hover:[&_td]:bg-[#F8FAFF] transition-colors">
                        <td className="px-4 py-3 font-mono text-xs align-middle text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3 align-middle">
                          <div
                            className="flex items-center justify-center flex-shrink-0 overflow-hidden border rounded-full w-11 h-11 border-slate-100"
                            style={{ backgroundColor: imgSrc ? 'transparent' : AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
                          >
                            {imgSrc
                              ? <img src={imgSrc} alt={member.name} className="object-cover w-full h-full" onError={(e) => { e.target.style.display = 'none'; }} />
                              : <span className="text-xs font-bold text-slate-600">{getInitials(member.name)}</span>
                            }
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold align-middle text-slate-900">{member.name}</td>
                        <td className="px-4 py-3 align-middle text-slate-500">{member.position}</td>
                        <td className="px-4 py-3 align-middle">
                          <button
                            onClick={() => toggleVisible(member)}
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer transition-colors whitespace-nowrap
                              ${member.status
                                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                : "bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200"
                              }`}
                          >
                            {member.status ? '● Visible' : '○ Hidden'}
                          </button>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex gap-1.5">
                            <button onClick={() => setViewTarget(member)} className="px-3 py-1 text-xs font-semibold transition-colors border rounded-md cursor-pointer border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100">View</button>
                            <button onClick={() => openEdit(member)} className="px-3 py-1 text-xs font-semibold text-blue-700 transition-colors border border-blue-200 rounded-md cursor-pointer bg-blue-50 hover:bg-blue-100">Edit</button>
                            <button onClick={() => setDeleteTarget(member)} className="px-3 py-1 text-xs font-semibold text-red-600 transition-colors border border-red-200 rounded-md cursor-pointer bg-red-50 hover:bg-red-100">Delete</button>
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

        {/* Desktop skeleton */}
        {loading && (
          <div className="hidden sm:block mx-7 bg-white rounded-[14px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead className="border-b bg-slate-50 border-slate-100">
                  <tr>
                    {["#", "Image", "Full Name", "Position", "Visible", "Action"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 tracking-[0.06em] uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody><DesktopSkeletons /></tbody>
              </table>
            </div>
          </div>
        )}

        {/* Count footer */}
        {!loading && members.length > 0 && (
          <div className="px-3 sm:px-7 pt-2.5 text-xs text-slate-400">
            {members.length} member{members.length !== 1 ? 's' : ''} total
          </div>
        )}

      </main>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <Overlay onClose={() => setShowModal(false)}>
          <ModalHeader
            title={editTarget === null ? 'Add Team Member' : 'Edit Team Member'}
            subtitle={editTarget ? editTarget.name : undefined}
            onClose={() => setShowModal(false)}
          />
          <div className="px-4 py-5 sm:px-6">

            {/* Image upload */}
            <label className={labelCls}>
              Photo {editTarget === null && <span className="text-red-500">*</span>}
            </label>
            <label
              htmlFor="lm-img-upload"
              className="flex items-center gap-3 border-2 border-dashed border-slate-300 rounded-xl p-3.5 cursor-pointer bg-slate-50 hover:border-blue-500 transition-colors mb-3"
            >
              {imgPreview ? (
                <img src={imgPreview} alt="preview" className="flex-shrink-0 object-cover border-2 rounded-full w-14 h-14 border-slate-200" />
              ) : (
                <div className="flex items-center justify-center flex-shrink-0 text-2xl rounded-full w-14 h-14 bg-slate-200">🧑</div>
              )}
              <div>
                <div className="text-[13px] font-semibold text-slate-700">
                  {imgPreview ? 'Click to change photo' : 'Click to upload photo'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">JPEG, PNG — max 2 MB</div>
              </div>
              <input
                id="lm-img-upload"
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleImgChange}
                className="hidden"
              />
            </label>
            {imgPreview && (
              <button
                type="button"
                onClick={() => { setImgPreview(null); setImgFile(null); }}
                className="text-[12px] text-red-600 bg-transparent border-none cursor-pointer mb-4 p-0 hover:text-red-700"
              >
                ✕ Remove photo
              </button>
            )}

            <div className="mb-4">
              <label className={labelCls}>Full Name</label>
              <input
                className={inputCls}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Ms. Shella R. Acibar"
              />
            </div>

            <div className="mb-4">
              <label className={labelCls}>Position</label>
              <input
                className={inputCls}
                value={form.position}
                onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
                placeholder="e.g. Co-Owner of Jem 8 Circle"
              />
            </div>

            <div className="flex items-center justify-between px-1 mb-6">
              <span className={labelCls} style={{ margin: 0 }}>Visible on site</span>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, status: !p.status }))}
                className={`relative w-11 h-6 rounded-full border-none cursor-pointer transition-colors flex-shrink-0 ${form.status ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.status ? 'left-5' : 'left-0.5'}`}
                />
              </button>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-700 text-[13px] font-semibold cursor-pointer hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={saveForm}
                disabled={submitting}
                className={`flex-1 py-2.5 border-none rounded-lg text-white text-[13px] font-semibold transition-colors ${submitting ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 cursor-pointer hover:bg-blue-700'}`}
              >
                {submitting
                  ? (editTarget === null ? 'Adding…' : 'Saving…')
                  : (editTarget === null ? 'Add Member' : 'Save Changes')
                }
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
            <div className="px-4 py-6 text-center sm:px-6">
              <div
                className="flex items-center justify-center w-20 h-20 mx-auto mb-4 overflow-hidden border-2 rounded-full border-slate-100"
                style={{ backgroundColor: imgSrc ? 'transparent' : '#a8d5ba' }}
              >
                {imgSrc
                  ? <img src={imgSrc} alt={viewTarget.name} className="object-cover w-full h-full" onError={(e) => { e.target.style.display = 'none'; }} />
                  : <span className="text-xl font-bold text-slate-600">{getInitials(viewTarget.name)}</span>
                }
              </div>
              <div className="font-bold text-slate-900 text-[16px] mb-1">{viewTarget.name}</div>
              <div className="text-slate-400 text-[13px] mb-4">{viewTarget.position}</div>
              <span className={`inline-flex text-[11px] font-semibold px-3 py-1 rounded-full border
                ${viewTarget.status
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-slate-100 text-slate-500 border-slate-300"
                }`}>
                {viewTarget.status ? '● Visible' : '○ Hidden'}
              </span>
              <div className="flex gap-2.5 mt-6">
                <button
                  onClick={() => setViewTarget(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-700 text-[13px] font-semibold cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => { openEdit(viewTarget); setViewTarget(null); }}
                  className="flex-1 py-2.5 border-none rounded-lg bg-blue-600 text-white text-[13px] font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  ✏️ Edit
                </button>
              </div>
            </div>
          </Overlay>
        );
      })()}

      {/* ── Delete Modal ── */}
      {deleteTarget && (
        <Overlay onClose={() => setDeleteTarget(null)} narrow>
          <div className="px-6 py-8 text-center sm:px-7">
            <div className="mb-3 text-5xl">🗑️</div>
            <h3 className="m-0 mb-2 text-[18px] font-bold text-slate-900">Delete Member?</h3>
            <p className="m-0 mb-1.5 text-sm text-slate-500">
              "<strong className="text-slate-700">{deleteTarget.name}</strong>"
            </p>
            <p className="m-0 mb-6 text-[13px] text-slate-400">This action cannot be undone.</p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-700 text-[13px] font-semibold cursor-pointer hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className={`flex-1 py-2.5 border-none rounded-lg text-white text-[13px] font-semibold transition-colors ${deleting ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 cursor-pointer hover:bg-red-700'}`}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
};

export default AdminLeadership;