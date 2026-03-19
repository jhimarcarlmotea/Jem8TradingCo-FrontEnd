import { useState } from 'react';
import AdminNav from '../components/AdminNav';

const initialMembers = [
  { id: 1, name: 'Ms. Shella R. Acibar', position: 'Co-Owner of Jem 8 Circle',        visible: true,  img: null },
  { id: 2, name: 'Ms. Jinkie Malinag',   position: 'Co-Owner of Jem 8 Circle',        visible: true,  img: null },
  { id: 3, name: 'Ms. Akiko Serrano',    position: 'Sales Executive of Jem 8 Circle', visible: true,  img: null },
  { id: 4, name: 'Ms. Shella R. Acibar', position: 'Co-Owner of Jem 8 Circle',        visible: true,  img: null },
  { id: 5, name: 'Ms. Jinkie Malinag',   position: 'Co-Owner of Jem 8 Circle',        visible: true,  img: null },
  { id: 6, name: 'Ms. Akiko Serrano',    position: 'Sales Executive of Jem 8 Circle', visible: true,  img: null },
  { id: 7, name: 'Ms. Jinkie Malinag',   position: 'Co-Owner of Jem 8 Circle',        visible: true,  img: null },
  { id: 8, name: 'Ms. Shella R. Acibar', position: 'Co-Owner of Jem 8 Circle',        visible: false, img: null },
];

const getInitials = (name) =>
  name.split(' ').filter(Boolean).slice(-2).map(n => n[0]).join('').toUpperCase();

const AVATAR_COLORS = ['#c2c2c2', '#a8d5ba', '#aac4e8', '#f5c6a0', '#d4b3f0', '#f9c0c0'];

// ── Shared classes ────────────────────────────────────────────────────────────
const inputCls = "h-[38px] px-3 border border-[#d0d0d0] rounded-lg text-sm text-[#1e1e1e] bg-[#fafafa] w-full box-border outline-none mb-3.5 transition-all focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(21,93,252,0.1)] focus:bg-white font-[inherit]";
const labelCls = "text-[11px] font-medium text-[#555555] mb-1 block";
const btnAdd   = "h-9 px-5 rounded-full text-sm font-medium cursor-pointer border-none inline-flex items-center gap-1.5 whitespace-nowrap bg-[#14ae5c] text-white hover:opacity-88 active:scale-97 transition-all";
const btnOutline = "h-9 px-5 rounded-full text-sm font-medium cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap bg-transparent border border-[#cccccc] text-[#333333] hover:bg-gray-50 transition-colors";
const btnDanger  = "h-9 px-5 rounded-full text-sm font-medium cursor-pointer border-none inline-flex items-center gap-1.5 whitespace-nowrap bg-red-500 text-white hover:opacity-88 transition-opacity";

// ── Overlay shell ─────────────────────────────────────────────────────────────
function Overlay({ onClose, children }) {
  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/45 z-[200] flex items-center justify-center p-4">
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl px-7 pt-7 pb-6 w-full max-w-[440px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] flex flex-col max-sm:px-4 max-sm:py-5 max-sm:max-w-full">
        {children}
      </div>
    </div>
  );
}

const AdminLeadership = () => {
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [members, setMembers]           = useState(initialMembers);
  const [showModal, setShowModal]       = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [form, setForm]                 = useState({ name: '', position: '', visible: true });
  const [viewTarget, setViewTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

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
    <div className="flex min-h-screen w-full bg-[#eaf2ed]">
      <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 min-w-0 flex flex-col bg-[#eaf2ed] overflow-y-auto">

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="bg-transparent border-none text-xl cursor-pointer text-gray-700 p-1 flex items-center justify-center shrink-0"
            aria-label="Open menu"
          >☰</button>
          <div className="flex items-center gap-2">
            <span className="text-lg">🏆</span>
            <span className="font-bold text-sm text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Leadership Management
            </span>
          </div>
        </div>

        {/* Page inner */}
        <div
          className="flex-1 px-10 py-8 pb-16 w-full box-border text-[#1e1e1e] max-lg:px-6 max-md:px-3 max-md:py-4"
          style={{ fontFamily: "'Inter', Helvetica, sans-serif" }}
        >

          {/* Desktop header */}
          <div className="hidden md:flex items-start justify-between gap-4 mb-7 flex-wrap">
            <div>
              <h2 className="font-semibold text-2xl text-black m-0 mb-1 leading-tight"
                style={{ fontFamily: "'Poppins', sans-serif" }}>
                Leadership Management
              </h2>
              <p className="text-sm text-[#6b6a6a] m-0" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Manage leadership, workers and their committee
              </p>
            </div>
            <button className={btnAdd} onClick={openAdd}>
              <span className="text-base font-bold leading-none">＋</span> Add Team Member
            </button>
          </div>

          {/* Mobile add button */}
          <div className="md:hidden flex justify-end mb-4">
            <button className={btnAdd} onClick={openAdd}>
              <span className="text-base font-bold leading-none">＋</span> Add Team Member
            </button>
          </div>

          {/* Table */}
          <div className="w-full overflow-x-auto rounded-xl bg-white border border-[#b0b0b0]">
            <table
              className="w-full border-collapse text-sm min-w-[640px]"
              style={{ fontFamily: "'Poppins', Helvetica, sans-serif" }}
            >
              <thead>
                <tr className="bg-white border-b border-[#b0b0b0]">
                  {[
                    { label: "#",         cls: "w-12"  },
                    { label: "Image",     cls: "w-20"  },
                    { label: "Full Name", cls: ""      },
                    { label: "Position",  cls: ""      },
                    { label: "Visible",   cls: "w-28"  },
                    { label: "Action",    cls: "w-28"  },
                  ].map(({ label, cls }) => (
                    <th key={label} className={`px-3.5 py-3 font-medium text-black text-left text-xs whitespace-nowrap ${cls}`}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m, idx) => (
                  <tr key={m.id} className="border-b border-[#b0b0b0] last:border-b-0 hover:bg-[#f7faf8] transition-colors">
                    <td className="px-3.5 py-2.5 align-middle text-xs text-[#555555]">{idx + 1}</td>
                    <td className="px-3.5 py-2.5 align-middle">
                      <div
                        className="w-[52px] h-[52px] rounded-full flex items-center justify-center font-semibold text-base text-[#555555] overflow-hidden shrink-0"
                        style={{ backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
                      >
                        {m.img
                          ? <img src={m.img} alt={m.name} className="w-full h-full object-cover" />
                          : <span>{getInitials(m.name)}</span>
                        }
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 align-middle text-[#111111]">{m.name}</td>
                    <td className="px-3.5 py-2.5 align-middle text-[#111111]">{m.position}</td>
                    <td className="px-3.5 py-2.5 align-middle">
                      <button
                        onClick={() => toggleVisible(m.id)}
                        title="Click to toggle visibility"
                        className={`inline-flex items-center justify-center px-3.5 py-0.5 rounded-full text-xs font-medium cursor-pointer border whitespace-nowrap hover:opacity-80 transition-opacity
                          ${m.visible
                            ? "bg-[#e4f6f0] border-[#baeada] text-emerald-600"
                            : "bg-[#f5f5f5] border-[#e0e0e0] text-[#888888]"
                          }`}
                      >
                        {m.visible ? '● Visible' : '○ Hidden'}
                      </button>
                    </td>
                    <td className="px-3.5 py-2.5 align-middle">
                      <div className="flex items-center gap-1.5">
                        {/* View */}
                        <button
                          onClick={() => setViewTarget(m)}
                          aria-label="View details" title="View"
                          className="w-[30px] h-[30px] rounded-md flex items-center justify-center border-none cursor-pointer bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        {/* Edit */}
                        <button
                          onClick={() => openEdit(m)}
                          aria-label="Edit member" title="Edit"
                          className="w-[30px] h-[30px] rounded-md flex items-center justify-center border-none cursor-pointer bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => setDeleteTarget(m.id)}
                          aria-label="Delete member" title="Delete"
                          className="w-[30px] h-[30px] rounded-md flex items-center justify-center border-none cursor-pointer bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
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
        <Overlay onClose={() => setShowModal(false)}>
          <h3 className="font-semibold text-[17px] text-[#111111] m-0 mb-5"
            style={{ fontFamily: "'Poppins', sans-serif" }}>
            {editTarget === null ? 'Add Team Member' : 'Edit Team Member'}
          </h3>

          <label className={labelCls}>Full Name</label>
          <input
            className={inputCls}
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Ms. Shella R. Acibar"
          />

          <label className={labelCls}>Position</label>
          <input
            className={inputCls}
            value={form.position}
            onChange={e => setForm(p => ({ ...p, position: e.target.value }))}
            placeholder="e.g. Co-Owner of Jem 8 Circle"
          />

          {/* Toggle row */}
          <div className="flex items-center justify-between mb-5 py-2 border-t border-b border-[#f0f0f0]">
            <span className="text-[11px] font-medium text-[#555555]">Visible on site</span>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, visible: !p.visible }))}
              className={`w-[46px] h-[26px] rounded-full border-none cursor-pointer flex items-center px-[3px] transition-colors shrink-0 ${form.visible ? "bg-[#14ae5c] justify-end" : "bg-[#d0d0d0] justify-start"}`}
            >
              <span className="w-5 h-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] block" />
            </button>
          </div>

          <div className="flex justify-end gap-2.5 flex-wrap max-sm:flex-col max-sm:[&>button]:w-full max-sm:[&>button]:justify-center">
            <button className={btnOutline} onClick={() => setShowModal(false)}>Cancel</button>
            <button className={btnAdd} onClick={saveForm}>
              {editTarget === null ? 'Add Member' : 'Save Changes'}
            </button>
          </div>
        </Overlay>
      )}

      {/* ── View Modal ── */}
      {viewTarget && (
        <Overlay onClose={() => setViewTarget(null)}>
          <h3 className="font-semibold text-[17px] text-[#111111] m-0 mb-5"
            style={{ fontFamily: "'Poppins', sans-serif" }}>
            Member Details
          </h3>
          <div className="flex justify-center mb-3">
            <div className="w-20 h-20 rounded-full flex items-center justify-center font-semibold text-2xl text-[#555555]"
              style={{ backgroundColor: '#a8d5ba' }}>
              <span>{getInitials(viewTarget.name)}</span>
            </div>
          </div>
          <p className="font-semibold text-base text-center m-0 mb-1 text-[#111111]"
            style={{ fontFamily: "'Poppins', sans-serif" }}>
            {viewTarget.name}
          </p>
          <p className="text-sm text-center m-0 text-[#6b6a6a]"
            style={{ fontFamily: "'Poppins', sans-serif" }}>
            {viewTarget.position}
          </p>
          <div className="flex justify-center mt-2 mb-5">
            <span className={`inline-flex items-center justify-center px-3.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap
              ${viewTarget.visible
                ? "bg-[#e4f6f0] border-[#baeada] text-emerald-600"
                : "bg-[#f5f5f5] border-[#e0e0e0] text-[#888888]"
              }`}>
              {viewTarget.visible ? '● Visible' : '○ Hidden'}
            </span>
          </div>
          <div className="flex justify-end gap-2.5 flex-wrap max-sm:flex-col max-sm:[&>button]:w-full max-sm:[&>button]:justify-center">
            <button className={btnOutline} onClick={() => setViewTarget(null)}>Close</button>
            <button className={btnAdd} onClick={() => { openEdit(viewTarget); setViewTarget(null); }}>Edit</button>
          </div>
        </Overlay>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget !== null && (
        <Overlay onClose={() => setDeleteTarget(null)}>
          <h3 className="font-semibold text-[17px] text-[#111111] m-0 mb-3"
            style={{ fontFamily: "'Poppins', sans-serif" }}>
            Delete Member?
          </h3>
          <p className="text-sm text-[#555555] leading-relaxed m-0 mb-5"
            style={{ fontFamily: "'Inter', sans-serif" }}>
            This action cannot be undone. Are you sure you want to remove this team member?
          </p>
          <div className="flex justify-end gap-2.5 flex-wrap max-sm:flex-col max-sm:[&>button]:w-full max-sm:[&>button]:justify-center">
            <button className={btnOutline} onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className={btnDanger} onClick={confirmDelete}>Delete</button>
          </div>
        </Overlay>
      )}
    </div>
  );
};

export default AdminLeadership;