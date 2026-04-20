import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import AdminNav from "../components/AdminNav";

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api",
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

// ── lowercase to match DB enum: 'admin' | 'user' ──────────────────────────────
const roles = ["user", "admin"];
const ITEMS_PER_PAGE = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fullName = (u) =>
  [u?.first_name, u?.last_name].filter(Boolean).join(" ") || "—";

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
};

// ── Capitalize for display only (DB stores lowercase) ─────────────────────────
const displayRole = (r) =>
  r ? r.charAt(0).toUpperCase() + r.slice(1) : "User";

// ─── Shared classes ───────────────────────────────────────────────────────────
const inputCls  = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-slate-900 bg-white outline-none box-border font-[inherit] placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/8 transition-all disabled:opacity-50 disabled:cursor-not-allowed";
const labelCls  = "block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide";
const btnCancel = "px-5 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-slate-500 cursor-pointer hover:bg-gray-50 hover:text-slate-900 transition-colors font-[inherit] disabled:opacity-50 disabled:cursor-not-allowed";
const btnSave   = "px-5 py-2 rounded-lg border-none bg-blue-600 text-sm font-semibold text-white cursor-pointer shadow-[0_2px_8px_rgba(37,99,235,0.3)] hover:bg-blue-700 hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(37,99,235,0.4)] transition-all font-[inherit] disabled:opacity-50 disabled:cursor-not-allowed";

// ─── Modal shell ──────────────────────────────────────────────────────────────
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

function ModalHeader({ title, onClose, disabled }) {
  return (
    <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
      <h2 className="m-0 text-base font-bold tracking-tight text-slate-900">{title}</h2>
      <button
        onClick={onClose}
        disabled={disabled}
        className="w-[30px] h-[30px] rounded-md border border-gray-200 bg-gray-50 text-sm cursor-pointer text-slate-500 flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >✕</button>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ account, onClose, onSave, saving }) {
  const [form, setForm]         = useState(null);
  const [fetching, setFetching] = useState(true);
  const [fetchErr, setFetchErr] = useState(false);

  useEffect(() => {
    setFetching(true);
    setFetchErr(false);
    api
      .get(`/showUser/${account.id}`)
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setForm({ ...data });
      })
      .catch(() => {
        setForm({ ...account });
        setFetchErr(true);
      })
      .finally(() => setFetching(false));
  }, [account.id]);

  const handleChange = (e) => {
    const name = e.target.name;
    let val = e.target.value;
    if (name === 'phone_number') {
      val = String(val).replace(/\D/g, '').slice(0, 11);
    }
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const fields = [
    { label: "First Name",   name: "first_name",   placeholder: "Enter first name",   type: "text"  },
    { label: "Last Name",    name: "last_name",    placeholder: "Enter last name",    type: "text"  },
    { label: "Email",        name: "email",        placeholder: "Enter email",        type: "email" },
    { label: "Phone Number", name: "phone_number", placeholder: "Enter phone number", type: "tel"   },
  ];

  return (
    <ModalOverlay onClose={!saving && !fetching ? onClose : undefined}>
      <ModalHeader title="Edit Account" onClose={onClose} disabled={saving || fetching} />

      {fetchErr && (
        <div className="px-3 py-2 mb-4 text-xs font-medium border rounded-lg bg-amber-50 border-amber-200 text-amber-700">
          Could not refresh data — showing last known values.
        </div>
      )}

      {fetching ? (
        <div className="flex flex-col gap-4">
          {fields.map((f) => (
            <div key={f.name}>
              <div className="w-24 h-3 mb-2 rounded bg-slate-100 animate-pulse" />
              <div className="w-full h-10 rounded-lg bg-slate-100 animate-pulse" />
            </div>
          ))}
          <div className="flex gap-2.5 justify-end pt-4 border-t border-slate-100 mt-2">
            <div className="w-20 rounded-lg h-9 bg-slate-100 animate-pulse" />
            <div className="rounded-lg h-9 w-28 bg-slate-100 animate-pulse" />
          </div>
        </div>
      ) : (
        <>
          {fields.map((f) => (
            <div className="mb-4" key={f.name}>
              <label className={labelCls}>{f.label}</label>
              <input
                className={inputCls}
                type={f.type}
                name={f.name}
                maxLength={f.name === 'phone_number' ? 11 : undefined}
                inputMode={f.name === 'phone_number' ? 'numeric' : undefined}
                value={form?.[f.name] ?? ""}
                onChange={handleChange}
                placeholder={f.placeholder}
                disabled={saving}
              />
            </div>
          ))}
          <div className="flex gap-2.5 justify-end mt-6 pt-4 border-t border-slate-100">
            <button className={btnCancel} onClick={onClose} disabled={saving}>Cancel</button>
            <button className={btnSave} onClick={() => onSave(form)} disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </>
      )}
    </ModalOverlay>
  );
}

// ─── Role Modal ───────────────────────────────────────────────────────────────
function RoleModal({ account, onClose, onSave, saving }) {
  // ── use lowercase default to match DB ────────────────────────────────────────
  const [selectedRole, setSelectedRole] = useState(account.role ?? "user");

  return (
    <ModalOverlay onClose={!saving ? onClose : undefined} narrow>
      <ModalHeader title="Change Role" onClose={onClose} disabled={saving} />
      <p className="m-0 mb-4 text-sm leading-relaxed text-slate-500">
        Changing role for <strong className="text-slate-900">{fullName(account)}</strong>
      </p>
      <div className="flex flex-col gap-2.5 mb-1">
        {roles.map((r) => (
          <button
            key={r}
            onClick={() => setSelectedRole(r)}
            disabled={saving}
            className={`flex items-center gap-3.5 px-4 py-4 rounded-lg border-[1.5px] bg-white cursor-pointer text-left w-full font-[inherit] relative transition-all disabled:opacity-50 disabled:cursor-not-allowed
              ${selectedRole === r
                ? "border-blue-600 bg-blue-50 shadow-[0_0_0_3px_rgba(37,99,235,0.08)]"
                : "border-gray-200 hover:border-blue-600 hover:bg-blue-50"
              }`}
          >
            <span className="text-2xl shrink-0">{r === "admin" ? "🛡️" : "👤"}</span>
            <div>
              {/* displayRole() capitalizes for UI only */}
              <div className="text-sm font-bold text-slate-900 mb-0.5">{displayRole(r)}</div>
              <div className="text-xs text-slate-400">
                {r === "admin" ? "Full access to admin panel" : "Standard registered access"}
              </div>
            </div>
            {selectedRole === r && (
              <span className="absolute text-sm font-bold text-blue-600 right-4">✓</span>
            )}
          </button>
        ))}
      </div>
      <div className="flex gap-2.5 justify-end mt-6 pt-4 border-t border-slate-100">
        <button className={btnCancel} onClick={onClose} disabled={saving}>Cancel</button>
        {/* selectedRole is already lowercase — sent as-is to API */}
        <button className={btnSave} onClick={() => onSave(selectedRole)} disabled={saving}>
          {saving ? "Saving…" : "Save Role"}
        </button>
      </div>
    </ModalOverlay>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ account, onClose, onConfirm, saving }) {
  return (
    <div
      onClick={!saving ? onClose : undefined}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[18px] p-8 w-full max-w-[380px] text-center shadow-[0_16px_48px_rgba(15,23,42,0.14),0_4px_16px_rgba(15,23,42,0.06)] border border-slate-100"
      >
        <span className="text-[40px] block mb-3.5">🗑️</span>
        <h3 className="text-base font-bold text-slate-900 m-0 mb-2.5 tracking-tight">Delete Account?</h3>
        <p className="m-0 mb-6 text-sm leading-relaxed text-slate-400">
          Are you sure you want to delete{" "}
          <strong className="text-slate-700">{fullName(account)}</strong>?{" "}
          This action cannot be undone.
        </p>
        <div className="flex gap-2.5 justify-center">
          <button className={btnCancel} onClick={onClose} disabled={saving}>Cancel</button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="px-5 py-2 rounded-lg border-none bg-red-500 text-sm font-semibold text-white cursor-pointer shadow-[0_2px_8px_rgba(239,68,68,0.3)] hover:bg-red-600 hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(239,68,68,0.4)] transition-all font-[inherit] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className={`fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-semibold animate-[modalIn_0.2s_ease]
      ${type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-700"}`}
    >
      <span>{type === "success" ? "✅" : "❌"}</span>
      {message}
      <button className="ml-1 transition-opacity opacity-50 hover:opacity-100" onClick={onDismiss}>✕</button>
    </div>
  );
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────
function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} className="border-b border-slate-50">
      <td className="px-5 py-4">
        <div className="h-3.5 w-32 bg-slate-100 rounded animate-pulse mb-1.5" />
        <div className="h-3 rounded w-44 bg-slate-100 animate-pulse" />
      </td>
      <td className="px-5 py-4"><div className="h-3.5 w-36 bg-slate-100 rounded animate-pulse" /></td>
      <td className="px-5 py-4"><div className="w-16 h-6 rounded-full bg-slate-100 animate-pulse" /></td>
      <td className="px-5 py-4"><div className="h-3.5 w-28 bg-slate-100 rounded animate-pulse" /></td>
      <td className="px-5 py-4">
        <div className="flex gap-2">
          <div className="w-10 h-6 rounded bg-slate-100 animate-pulse" />
          <div className="w-10 h-6 rounded bg-slate-100 animate-pulse" />
          <div className="h-6 rounded w-14 bg-slate-100 animate-pulse" />
        </div>
      </td>
    </tr>
  ));
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminAccountManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accounts, setAccounts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState(false);
  const [search, setSearch]           = useState("");
  const [roleFilter, setRoleFilter]   = useState("All");
  const [sortBy, setSortBy]           = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [editModal,   setEditModal]   = useState(null);
  const [roleModal,   setRoleModal]   = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });
  const hideToast = useCallback(() => setToast(null), []);

  // Reset page on filter/sort/search change
  useEffect(() => { setCurrentPage(1); }, [search, roleFilter, sortBy]);

  const fetchAccounts = useCallback(() => {
    setLoading(true);
    setFetchError(false);
    api
      .get("/showAllUser")
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setAccounts(Array.isArray(data) ? data : []);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  // ── Derived stats — compare lowercase to match DB ─────────────────────────
  const totalAccounts = accounts.length;
  const totalAdmins   = accounts.filter((a) => a.role === "admin").length;
  const totalUsers    = accounts.filter((a) => a.role === "user").length;

  const statCards = [
    { label: "All Accounts", value: loading ? "—" : totalAccounts, sub: "Registered Users" },
    { label: "Admins",       value: loading ? "—" : totalAdmins,   sub: "With full access" },
    { label: "Users",        value: loading ? "—" : totalUsers,    sub: "Standard access"  },
  ];

  // ── Filter + Sort + Paginate ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const searched = accounts.filter((a) => {
      const q = search.toLowerCase();
      const matchesSearch =
        (a.first_name   ?? "").toLowerCase().includes(q) ||
        (a.last_name    ?? "").toLowerCase().includes(q) ||
        (a.email        ?? "").toLowerCase().includes(q) ||
        (a.phone_number ?? "").includes(search);
      // ── compare lowercase to match DB ─────────────────────────────────────
      const matchesRole = roleFilter === "All" || (a.role ?? "user") === roleFilter;
      return matchesSearch && matchesRole;
    });

    return [...searched].sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0);
      if (sortBy === "oldest") return new Date(a.created_at ?? 0) - new Date(b.created_at ?? 0);
      if (sortBy === "name_asc")  return fullName(a).localeCompare(fullName(b));
      if (sortBy === "name_desc") return fullName(b).localeCompare(fullName(a));
      return 0;
    });
  }, [accounts, search, roleFilter, sortBy]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated   = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    return Array.from({ length: 5 }, (_, i) => start + i);
  }, [totalPages, currentPage]);

  // ── PUT — full edit ───────────────────────────────────────────────────────────
  const handleEditSave = (form) => {
    setSaving(true);
    api
      .put(`/accounts/${editModal.id}`, {
        first_name:   form.first_name,
        last_name:    form.last_name,
        email:        form.email,
        phone_number: form.phone_number,
      })
      .then((res) => {
        const updated = res.data?.data ?? res.data;
        setAccounts((prev) =>
          prev.map((a) => (a.id === editModal.id ? { ...a, ...updated } : a))
        );
        setEditModal(null);
        showToast("Account updated successfully.");
      })
      .catch(() => showToast("Failed to update account.", "error"))
      .finally(() => setSaving(false));
  };

  // ── PUT — role only (sends lowercase value matching DB enum) ──────────────────
  const handleRoleSave = (role) => {
    setSaving(true);
    api
      .put(`/accounts/${roleModal.id}`, { role })
      .then((res) => {
        const updated = res.data?.data ?? res.data;
        setAccounts((prev) =>
          prev.map((a) => (a.id === roleModal.id ? { ...a, role: updated?.role ?? role } : a))
        );
        setRoleModal(null);
        showToast("Role updated successfully.");
      })
      .catch(() => showToast("Failed to update role.", "error"))
      .finally(() => setSaving(false));
  };

  // ── DELETE ────────────────────────────────────────────────────────────────────
  const handleDelete = () => {
    setSaving(true);
    api
      .delete(`/accounts/${deleteModal.id}`)
      .then(() => {
        setAccounts((prev) => prev.filter((a) => a.id !== deleteModal.id));
        setDeleteModal(null);
        showToast("Account deleted successfully.");
      })
      .catch(() => showToast("Failed to delete account.", "error"))
      .finally(() => setSaving(false));
  };

  return (
    <>
      <style>{`
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn   { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>

      <div className="flex min-h-screen bg-[#F0F7F2] font-['DM_Sans',system-ui,sans-serif] text-slate-900">
        <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 min-w-0 pb-12 overflow-x-hidden px-7 py-7 max-md:px-4 max-md:py-5">

          {/* Top Bar */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3.5">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden bg-white border border-gray-200 text-base cursor-pointer text-slate-500 px-2.5 py-1.5 rounded-md shadow-sm hover:bg-gray-50 hover:text-slate-900 transition-all"
              >☰</button>
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
                className="relative px-6 py-5 overflow-hidden transition-all bg-white border shadow-sm rounded-2xl border-slate-100 hover:-translate-y-px hover:shadow-md group"
              >
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2.5">{s.label}</div>
                <div className="text-[36px] font-extrabold text-slate-900 leading-none tracking-[-1.5px] mb-2">{s.value}</div>
                <div className="text-xs text-slate-400">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Section Title */}
          <div className="text-[15px] font-bold text-slate-900 mb-3.5 tracking-tight">All Accounts</div>

          {/* Table Card */}
          <div className="bg-white rounded-[18px] shadow-sm border border-slate-100 overflow-hidden">

            {/* Filter / Search bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-nowrap">
              {/* Search */}
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 flex-1 min-w-0">
                <span className="text-sm text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search by name, email, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-xs text-gray-700 placeholder-gray-400 bg-transparent border-none outline-none"
                />
              </div>
              {/* Role filter — values are lowercase to match DB */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3.5 py-2 bg-gray-50 text-sm text-gray-700 cursor-pointer outline-none shrink-0"
              >
                <option value="All">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-200 rounded-lg px-3.5 py-2 bg-gray-50 text-sm text-gray-700 cursor-pointer outline-none shrink-0"
              >
                <option value="newest">Joined: Newest</option>
                <option value="oldest">Joined: Oldest</option>
                <option value="name_asc">Name: A → Z</option>
                <option value="name_desc">Name: Z → A</option>
              </select>
              {/* Clear */}
              <button
                onClick={() => { setSearch(""); setRoleFilter("All"); setSortBy("newest"); setCurrentPage(1); }}
                className="border border-gray-200 rounded-lg px-3.5 py-2 bg-white text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors shrink-0"
              >
                ✕ Clear
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    {["Account", "Phone", "Role", "Joined", "Action"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10.5px] font-bold text-slate-400 tracking-[0.08em] uppercase whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>

                  {loading && <SkeletonRows />}

                  {!loading && fetchError && (
                    <tr>
                      <td colSpan={5} className="py-16 text-sm text-center text-slate-400">
                        Failed to load accounts.{" "}
                        <button onClick={fetchAccounts} className="text-blue-500 underline transition-colors hover:text-blue-700">
                          Retry
                        </button>
                      </td>
                    </tr>
                  )}

                  {!loading && !fetchError && filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-16 text-sm text-center text-slate-400">No accounts found.</td>
                    </tr>
                  )}

                  {!loading && !fetchError && paginated.map((account) => (
                    <tr key={account.id} className="border-b border-slate-50 last:border-b-0 hover:[&_td]:bg-[#F8FBFF] transition-colors">
                      <td className="px-5 py-4 align-middle">
                        <div className="text-sm font-bold text-slate-900 mb-0.5">{fullName(account)}</div>
                        <div className="text-xs text-slate-400">{account.email}</div>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <span className="font-mono text-sm font-medium text-slate-500">
                          {account.phone_number ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        {/* compare lowercase, display capitalized via displayRole() */}
                        <span className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap
                          ${account.role === "admin"
                            ? "bg-slate-800 text-slate-100 border border-slate-700"
                            : "bg-slate-100 text-slate-500 border border-slate-300"
                          }`}>
                          {displayRole(account.role)}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <span className="font-mono text-sm font-medium text-slate-500 whitespace-nowrap">
                          {fmtDate(account.created_at)}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <div className="flex flex-wrap items-center gap-2">
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
                  ))}

                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {!loading && !fetchError && filtered.length > 0 && (
              <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} accounts
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="text-xs font-medium text-gray-700 transition-colors bg-white border border-gray-200 rounded-md cursor-pointer w-7 h-7 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >‹</button>
                  {pageNumbers.map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-7 h-7 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                        p === currentPage
                          ? "bg-blue-600 text-white border-none"
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                      }`}
                    >{p}</button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="text-xs font-medium text-gray-700 transition-colors bg-white border border-gray-200 rounded-md cursor-pointer w-7 h-7 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >›</button>
                </div>
              </div>
            )}
          </div>

        </main>
      </div>

      {editModal   && <EditModal   account={editModal}   onClose={() => !saving && setEditModal(null)}   onSave={handleEditSave}  saving={saving} />}
      {roleModal   && <RoleModal   account={roleModal}   onClose={() => !saving && setRoleModal(null)}   onSave={handleRoleSave}  saving={saving} />}
      {deleteModal && <DeleteModal account={deleteModal} onClose={() => !saving && setDeleteModal(null)} onConfirm={handleDelete} saving={saving} />}

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={hideToast} />}
    </>
  );
}