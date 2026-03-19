import { useState } from "react";
import AdminNav from "../components/AdminNav";

const initialAccounts = [
  { id: 1, name: "Juan Dela Cruz", email: "juan@gmail.com", phone: "+63 9145783671", role: "User",  joined: "Feb. 20, 2026" },
  { id: 2, name: "Juan Dela Cruz", email: "juan@gmail.com", phone: "+63 9145783671", role: "Admin", joined: "Feb. 20, 2026" },
  { id: 3, name: "Juan Dela Cruz", email: "juan@gmail.com", phone: "+63 9145783671", role: "User",  joined: "Feb. 20, 2026" },
  { id: 4, name: "Juan Dela Cruz", email: "juan@gmail.com", phone: "+63 9145783671", role: "User",  joined: "Feb. 20, 2026" },
  { id: 5, name: "Juan Dela Cruz", email: "juan@gmail.com", phone: "+63 9145783671", role: "User",  joined: "Feb. 20, 2026" },
];

const roles = ["User", "Admin"];

// ── Shared classes ────────────────────────────────────────────────────────────
const inputCls  = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-slate-900 bg-white outline-none box-border font-[inherit] placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/8 transition-all";
const labelCls  = "block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide";
const btnCancel = "px-5 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-slate-500 cursor-pointer hover:bg-gray-50 hover:text-slate-900 transition-colors font-[inherit]";
const btnSave   = "px-5 py-2 rounded-lg border-none bg-blue-600 text-sm font-semibold text-white cursor-pointer shadow-[0_2px_8px_rgba(37,99,235,0.3)] hover:bg-blue-700 hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(37,99,235,0.4)] transition-all font-[inherit]";

// ── Modal shell ───────────────────────────────────────────────────────────────
function ModalOverlay({ children, onClose, narrow }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-5 animate-[overlayIn_0.2s_ease]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-[18px] p-7 w-full ${narrow ? "max-w-[400px]" : "max-w-[480px]"} max-h-[90vh] overflow-y-auto shadow-[0_16px_48px_rgba(15,23,42,0.14),0_4px_16px_rgba(15,23,42,0.06)] border border-slate-100 animate-[modalIn_0.2s_ease]`}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }) {
  return (
    <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
      <h2 className="text-base font-bold text-slate-900 m-0 tracking-tight">{title}</h2>
      <button
        onClick={onClose}
        className="w-[30px] h-[30px] rounded-md border border-gray-200 bg-gray-50 text-sm cursor-pointer text-slate-500 flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
      >✕</button>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ account, onClose, onSave }) {
  const [form, setForm] = useState({ ...account });
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title="Edit Account" onClose={onClose} />
      {[
        { label: "Full Name",    name: "name",   placeholder: "Enter full name"      },
        { label: "Email",        name: "email",  placeholder: "Enter email"          },
        { label: "Phone",        name: "phone",  placeholder: "Enter phone number"   },
        { label: "Joined Date",  name: "joined", placeholder: "e.g. Feb. 20, 2026"  },
      ].map((f) => (
        <div className="mb-4" key={f.name}>
          <label className={labelCls}>{f.label}</label>
          <input className={inputCls} name={f.name} value={form[f.name]} onChange={handleChange} placeholder={f.placeholder} />
        </div>
      ))}
      <div className="flex gap-2.5 justify-end mt-6 pt-4 border-t border-slate-100">
        <button className={btnCancel} onClick={onClose}>Cancel</button>
        <button className={btnSave} onClick={() => onSave(form)}>Save Changes</button>
      </div>
    </ModalOverlay>
  );
}

// ── Role Modal ────────────────────────────────────────────────────────────────
function RoleModal({ account, onClose, onSave }) {
  const [selectedRole, setSelectedRole] = useState(account.role);

  return (
    <ModalOverlay onClose={onClose} narrow>
      <ModalHeader title="Change Role" onClose={onClose} />
      <p className="text-sm text-slate-500 m-0 mb-4 leading-relaxed">
        Changing role for <strong className="text-slate-900">{account.name}</strong>
      </p>
      <div className="flex flex-col gap-2.5 mb-1">
        {roles.map((r) => (
          <button
            key={r}
            onClick={() => setSelectedRole(r)}
            className={`flex items-center gap-3.5 px-4 py-4 rounded-lg border-[1.5px] bg-white cursor-pointer text-left w-full font-[inherit] relative transition-all
              ${selectedRole === r
                ? "border-blue-600 bg-blue-50 shadow-[0_0_0_3px_rgba(37,99,235,0.08)]"
                : "border-gray-200 hover:border-blue-600 hover:bg-blue-50"
              }`}
          >
            <span className="text-2xl shrink-0">{r === "Admin" ? "🛡️" : "👤"}</span>
            <div>
              <div className="text-sm font-bold text-slate-900 mb-0.5">{r}</div>
              <div className="text-xs text-slate-400">
                {r === "Admin" ? "Full access to admin panel" : "Standard registered access"}
              </div>
            </div>
            {selectedRole === r && (
              <span className="absolute right-4 text-sm font-bold text-blue-600">✓</span>
            )}
          </button>
        ))}
      </div>
      <div className="flex gap-2.5 justify-end mt-6 pt-4 border-t border-slate-100">
        <button className={btnCancel} onClick={onClose}>Cancel</button>
        <button className={btnSave} onClick={() => onSave(selectedRole)}>Save Role</button>
      </div>
    </ModalOverlay>
  );
}

// ── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({ account, onClose, onConfirm }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[18px] p-8 w-full max-w-[380px] text-center shadow-[0_16px_48px_rgba(15,23,42,0.14),0_4px_16px_rgba(15,23,42,0.06)] border border-slate-100"
      >
        <span className="text-[40px] block mb-3.5">🗑️</span>
        <h3 className="text-base font-bold text-slate-900 m-0 mb-2.5 tracking-tight">Delete Account?</h3>
        <p className="text-sm text-slate-400 m-0 mb-6 leading-relaxed">
          Are you sure you want to delete <strong className="text-slate-700">{account.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-2.5 justify-center">
          <button className={btnCancel} onClick={onClose}>Cancel</button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-lg border-none bg-red-500 text-sm font-semibold text-white cursor-pointer shadow-[0_2px_8px_rgba(239,68,68,0.3)] hover:bg-red-600 hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(239,68,68,0.4)] transition-all font-[inherit]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminAccountManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accounts, setAccounts]       = useState(initialAccounts);
  const [search, setSearch]           = useState("");
  const [editModal, setEditModal]     = useState(null);
  const [roleModal, setRoleModal]     = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  const filtered = accounts.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    a.phone.includes(search)
  );

  const totalAccounts = accounts.length;
  const totalAdmins   = accounts.filter((a) => a.role === "Admin").length;
  const totalUsers    = accounts.filter((a) => a.role === "User").length;

  const handleEditSave = (form) => {
    setAccounts(accounts.map((a) => (a.id === editModal.id ? { ...form, id: editModal.id } : a)));
    setEditModal(null);
  };

  const handleRoleSave = (role) => {
    setAccounts(accounts.map((a) => (a.id === roleModal.id ? { ...a, role } : a)));
    setRoleModal(null);
  };

  const handleDelete = () => {
    setAccounts(accounts.filter((a) => a.id !== deleteModal.id));
    setDeleteModal(null);
  };

  const statCards = [
    { label: "All Accounts", value: totalAccounts, sub: "Registered Users" },
    { label: "Admins",       value: totalAdmins,   sub: "With full access" },
    { label: "Users",        value: totalUsers,    sub: "Standard access"  },
  ];

  return (
    <>
      <style>{`
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn   { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>

      <div className="flex min-h-screen bg-[#F0F7F2] font-['DM_Sans',system-ui,sans-serif] text-slate-900">
        <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 min-w-0 px-7 py-7 pb-12 overflow-x-hidden max-md:px-4 max-md:py-5">

          {/* Top Bar */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3.5">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden bg-white border border-gray-200 text-base cursor-pointer text-slate-500 px-2.5 py-1.5 rounded-md shadow-sm hover:bg-gray-50 hover:text-slate-900 transition-all"
              >☰</button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Account..."
                className="py-2 pl-8 pr-4 rounded-lg border border-gray-200 text-sm font-[inherit] text-slate-900 outline-none bg-white w-60 shadow-sm placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/8 transition-all max-md:w-44"
              />
            </div>
          </div>

          {/* Page Title */}
          <h1 className="text-[13px] font-bold text-slate-900 tracking-[0.06em] m-0 mb-5 uppercase">
            Account Management
          </h1>

          {/* Stats Cards */}
          <div className="grid gap-3.5 mb-8 max-w-[680px]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {statCards.map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-2xl px-6 py-5 shadow-sm border border-slate-100 relative overflow-hidden transition-all hover:-translate-y-px hover:shadow-md group"
              >
                {/* top accent bar */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2.5">{s.label}</div>
                <div className="text-[36px] font-extrabold text-slate-900 leading-none tracking-[-1.5px] mb-2">{s.value}</div>
                <div className="text-xs text-slate-400">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Section Title */}
          <div className="text-[15px] font-bold text-slate-900 mb-3.5 tracking-tight">All Accounts</div>

          {/* Table */}
          <div className="bg-white rounded-[18px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {["Account", "Phone", "Role", "Joined", "Action"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10.5px] font-bold text-slate-400 tracking-[0.08em] uppercase whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-slate-400 text-sm">
                        No accounts found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((account) => (
                      <tr key={account.id} className="border-b border-slate-50 last:border-b-0 hover:[&_td]:bg-[#F8FBFF] transition-colors">
                        <td className="px-5 py-4 align-middle">
                          <div className="text-sm font-bold text-slate-900 mb-0.5">{account.name}</div>
                          <div className="text-xs text-slate-400">{account.email}</div>
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <span className="text-sm text-slate-500 font-mono font-medium">{account.phone}</span>
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <span className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap
                            ${account.role === "Admin"
                              ? "bg-slate-800 text-slate-100 border border-slate-700"
                              : "bg-slate-100 text-slate-500 border border-slate-300"
                            }`}>
                            {account.role}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <span className="text-sm text-slate-500 font-mono font-medium whitespace-nowrap">{account.joined}</span>
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <div className="flex gap-2 items-center flex-wrap">
                            <button
                              onClick={() => setEditModal(account)}
                              className="px-3.5 py-1 rounded-md border border-gray-200 bg-white text-xs font-semibold text-slate-500 cursor-pointer hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all whitespace-nowrap"
                            >Edit</button>
                            <button
                              onClick={() => setRoleModal(account)}
                              className="px-3.5 py-1 rounded-md border border-gray-200 bg-white text-xs font-semibold text-slate-500 cursor-pointer hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all whitespace-nowrap"
                            >Role</button>
                            <button
                              onClick={() => setDeleteModal(account)}
                              className="px-3.5 py-1 rounded-md border border-red-200 bg-red-50 text-xs font-semibold text-red-500 cursor-pointer hover:bg-red-500 hover:text-white hover:border-red-500 transition-all whitespace-nowrap"
                            >Delete</button>
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
      </div>

      {editModal  && <EditModal  account={editModal}  onClose={() => setEditModal(null)}  onSave={handleEditSave} />}
      {roleModal  && <RoleModal  account={roleModal}  onClose={() => setRoleModal(null)}  onSave={handleRoleSave} />}
      {deleteModal && <DeleteModal account={deleteModal} onClose={() => setDeleteModal(null)} onConfirm={handleDelete} />}
    </>
  );
}