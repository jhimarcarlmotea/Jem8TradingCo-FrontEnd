import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import AdminNav from "../components/AdminNav";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api",
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

const roles = ["user", "admin"];
const ITEMS_PER_PAGE = 20;

const fullName = (u) =>
  [u?.first_name, u?.last_name].filter(Boolean).join(" ") || "—";

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
};

const displayRole = (r) =>
  r ? r.charAt(0).toUpperCase() + r.slice(1) : "User";

const inputCls  = "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-[13px] text-slate-900 bg-white outline-none box-border font-[inherit] placeholder-slate-400 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const labelCls  = "block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide";
const btnCancel = "flex-1 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-700 text-[13px] font-semibold cursor-pointer hover:bg-slate-50 transition-colors font-[inherit] disabled:opacity-50 disabled:cursor-not-allowed";
const btnSave   = "flex-1 py-2.5 border-none rounded-lg bg-blue-600 text-[13px] font-semibold text-white cursor-pointer hover:bg-blue-700 transition-colors font-[inherit] disabled:opacity-50 disabled:cursor-not-allowed";

// ─── Modal Overlay ────────────────────────────────────────────────────────────
function Overlay({ children, onClose, narrow }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/55 backdrop-blur-[4px] flex items-center justify-center z-[1000] p-3 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        data-overlay
        className={`bg-white w-full rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.18)] max-h-[94vh] overflow-y-auto ${narrow ? "max-w-[420px]" : "max-w-[520px]"}`}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, subtitle, onClose, disabled }) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 bg-white border-b sm:px-6 sm:py-5 border-slate-100 rounded-t-2xl">
      <div className="flex-1 min-w-0 pr-3">
        <h2 className="m-0 text-[15px] sm:text-[17px] font-bold text-slate-900 truncate">{title}</h2>
        {subtitle && <p className="m-0 mt-0.5 text-xs text-slate-400 truncate">{subtitle}</p>}
      </div>
      <button
        onClick={onClose}
        disabled={disabled}
        className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-lg transition-colors border rounded-lg cursor-pointer border-slate-200 bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >×</button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className={labelCls}>{label}</label>
      {children}
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
    if (name === "phone_number") {
      val = String(val).replace(/\D/g, "").slice(0, 11);
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
    <Overlay onClose={!saving && !fetching ? onClose : undefined}>
      <ModalHeader
        title="Edit Account"
        subtitle={fullName(account)}
        onClose={onClose}
        disabled={saving || fetching}
      />
      <div className="px-4 py-5 sm:px-6">
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
            <div className="flex gap-2.5 mt-2">
              <div className="flex-1 h-10 rounded-lg bg-slate-100 animate-pulse" />
              <div className="flex-1 h-10 rounded-lg bg-slate-100 animate-pulse" />
            </div>
          </div>
        ) : (
          <>
            {fields.map((f) => (
              <Field key={f.name} label={f.label}>
                <input
                  className={inputCls}
                  type={f.type}
                  name={f.name}
                  maxLength={f.name === "phone_number" ? 11 : undefined}
                  inputMode={f.name === "phone_number" ? "numeric" : undefined}
                  value={form?.[f.name] ?? ""}
                  onChange={handleChange}
                  placeholder={f.placeholder}
                  disabled={saving}
                />
              </Field>
            ))}
            <div className="flex gap-2.5 mt-2">
              <button className={btnCancel} onClick={onClose} disabled={saving}>Cancel</button>
              <button
                className={`${btnSave} ${saving ? "bg-blue-300 cursor-not-allowed" : ""}`}
                onClick={() => onSave(form)}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </>
        )}
      </div>
    </Overlay>
  );
}

// ─── Role Modal ───────────────────────────────────────────────────────────────
function RoleModal({ account, onClose, onSave, saving }) {
  const [selectedRole, setSelectedRole] = useState(account.role ?? "user");

  return (
    <Overlay onClose={!saving ? onClose : undefined} narrow>
      <ModalHeader
        title="Change Role"
        subtitle={`Changing role for ${fullName(account)}`}
        onClose={onClose}
        disabled={saving}
      />
      <div className="px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-2.5 mb-5">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRole(r)}
              disabled={saving}
              className={`flex items-center gap-3.5 px-4 py-4 rounded-xl border-[1.5px] bg-white cursor-pointer text-left w-full font-[inherit] relative transition-all disabled:opacity-50 disabled:cursor-not-allowed
                ${selectedRole === r
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 hover:border-blue-400 hover:bg-blue-50"
                }`}
            >
              <span className="text-2xl shrink-0">{r === "admin" ? "🛡️" : "👤"}</span>
              <div>
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
        <div className="flex gap-2.5">
          <button className={btnCancel} onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className={`${btnSave} ${saving ? "bg-blue-300 cursor-not-allowed" : ""}`}
            onClick={() => onSave(selectedRole)}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Role"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ account, onClose, onConfirm, saving }) {
  return (
    <Overlay onClose={!saving ? onClose : undefined} narrow>
      <div className="px-6 py-8 text-center sm:px-7">
        <div className="mb-3 text-5xl">🗑️</div>
        <h3 className="m-0 mb-2 text-[18px] font-bold text-slate-900">Delete Account?</h3>
        <p className="m-0 mb-1.5 text-sm text-slate-500">
          "<strong className="text-slate-700">{fullName(account)}</strong>"
        </p>
        <p className="m-0 mb-6 text-[13px] text-slate-400">This action cannot be undone.</p>
        <div className="flex gap-2.5">
          <button className={btnCancel} onClick={onClose} disabled={saving}>Cancel</button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className={`flex-1 py-2.5 border-none rounded-lg text-white text-[13px] font-semibold transition-colors ${saving ? "bg-red-300 cursor-not-allowed" : "bg-red-600 cursor-pointer hover:bg-red-700"}`}
          >
            {saving ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className={`fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-semibold
      ${type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-700"}`}
    >
      <span>{type === "success" ? "✅" : "❌"}</span>
      {message}
      <button className="ml-1 transition-opacity opacity-50 hover:opacity-100" onClick={onDismiss}>✕</button>
    </div>
  );
}

// ─── Mobile Account Card ──────────────────────────────────────────────────────
function AccountCard({ account, onEdit, onRole, onDelete }) {
  return (
    <div className="overflow-hidden bg-white border shadow-sm rounded-xl border-slate-100">
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-900 text-[13px] leading-snug truncate">{fullName(account)}</div>
            <div className="text-xs truncate text-slate-400">{account.email}</div>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize border flex-shrink-0
            ${account.role === "admin"
              ? "bg-slate-800 text-slate-100 border-slate-700"
              : "bg-slate-100 text-slate-500 border-slate-300"
            }`}>
            {displayRole(account.role)}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-2.5">
          {account.phone_number && (
            <span className="font-mono text-[11px] text-slate-500">{account.phone_number}</span>
          )}
          {account.created_at && (
            <span className="text-[10px] text-slate-400">Joined {fmtDate(account.created_at)}</span>
          )}
        </div>

        <div className="flex gap-1.5 pt-2.5 border-t border-slate-100">
          <button onClick={onEdit}
            className="flex-1 py-1.5 text-[11px] font-semibold border border-blue-200 rounded-lg bg-blue-50 text-blue-700 cursor-pointer hover:bg-blue-100 transition-colors">
            ✏️ Edit
          </button>
          <button onClick={onRole}
            className="flex-1 py-1.5 text-[11px] font-semibold border border-green-200 rounded-lg bg-green-50 text-green-700 cursor-pointer hover:bg-green-100 transition-colors">
            🛡️ Role
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

// ─── Skeleton — Mobile ────────────────────────────────────────────────────────
function MobileSkeletons() {
  return Array.from({ length: 4 }).map((_, i) => (
    <div key={i} className="overflow-hidden bg-white border rounded-xl border-slate-100">
      <div className="p-3 space-y-2">
        <div className="flex justify-between gap-2">
          <div>
            <div className="w-32 h-3.5 mb-1.5 rounded-md animate-pulse bg-slate-100" />
            <div className="h-3 rounded-md w-44 animate-pulse bg-slate-100" />
          </div>
          <div className="w-16 h-5 rounded-full animate-pulse bg-slate-100" />
        </div>
        <div className="h-3 rounded-md w-28 animate-pulse bg-slate-100" />
        <div className="flex gap-1.5 pt-2 border-t border-slate-100">
          <div className="flex-1 rounded-lg h-7 animate-pulse bg-slate-100" />
          <div className="flex-1 rounded-lg h-7 animate-pulse bg-slate-100" />
          <div className="flex-1 rounded-lg h-7 animate-pulse bg-slate-100" />
        </div>
      </div>
    </div>
  ));
}

// ─── Skeleton — Desktop ───────────────────────────────────────────────────────
function DesktopSkeletons() {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} className="border-b border-slate-50">
      <td className="px-4 py-3.5">
        <div className="w-32 h-3.5 mb-1.5 rounded-md animate-pulse bg-slate-100" />
        <div className="h-3 rounded-md w-44 animate-pulse bg-slate-100" />
      </td>
      <td className="px-4 py-3.5"><div className="w-28 h-3.5 rounded-md animate-pulse bg-slate-100" /></td>
      <td className="px-4 py-3.5"><div className="w-16 h-5 rounded-full animate-pulse bg-slate-100" /></td>
      <td className="px-4 py-3.5"><div className="w-24 h-3.5 rounded-md animate-pulse bg-slate-100" /></td>
      <td className="px-4 py-3.5">
        <div className="flex gap-1.5">
          <div className="w-12 h-6 rounded-md animate-pulse bg-slate-100" />
          <div className="w-12 h-6 rounded-md animate-pulse bg-slate-100" />
          <div className="h-6 rounded-md w-14 animate-pulse bg-slate-100" />
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

  const totalAccounts = accounts.length;
  const totalAdmins   = accounts.filter((a) => a.role === "admin").length;
  const totalUsers    = accounts.filter((a) => a.role === "user").length;

  const statCards = [
    { label: "All Accounts", value: loading ? "—" : totalAccounts, sub: "Registered Users" },
    { label: "Admins",       value: loading ? "—" : totalAdmins,   sub: "With full access" },
    { label: "Users",        value: loading ? "—" : totalUsers,    sub: "Standard access"  },
  ];

  const filtered = useMemo(() => {
    const searched = accounts.filter((a) => {
      const q = search.toLowerCase();
      const matchesSearch =
        (a.first_name   ?? "").toLowerCase().includes(q) ||
        (a.last_name    ?? "").toLowerCase().includes(q) ||
        (a.email        ?? "").toLowerCase().includes(q) ||
        (a.phone_number ?? "").includes(search);
      const matchesRole = roleFilter === "All" || (a.role ?? "user") === roleFilter;
      return matchesSearch && matchesRole;
    });

    return [...searched].sort((a, b) => {
      if (sortBy === "newest")    return new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0);
      if (sortBy === "oldest")    return new Date(a.created_at ?? 0) - new Date(b.created_at ?? 0);
      if (sortBy === "name_asc")  return fullName(a).localeCompare(fullName(b));
      if (sortBy === "name_desc") return fullName(b).localeCompare(fullName(a));
      return 0;
    });
  }, [accounts, search, roleFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    return Array.from({ length: 5 }, (_, i) => start + i);
  }, [totalPages, currentPage]);

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
        setAccounts((prev) => prev.map((a) => (a.id === editModal.id ? { ...a, ...updated } : a)));
        setEditModal(null);
        showToast("Account updated successfully.");
      })
      .catch(() => showToast("Failed to update account.", "error"))
      .finally(() => setSaving(false));
  };

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
            <h1 className="m-0 text-[18px] sm:text-xl font-bold text-slate-900">Account Management</h1>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3.5 px-3 sm:px-7 py-4 sm:py-5">
          {statCards.map((s) => (
            <div key={s.label} className="px-3 py-3 bg-white border shadow-sm sm:px-4 sm:py-4 rounded-xl border-slate-100">
              <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1 sm:mb-1.5 leading-tight">{s.label}</div>
              <div className="text-[22px] sm:text-[26px] font-extrabold text-slate-900 leading-none">{s.value}</div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 mt-1 font-semibold tracking-wide">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="px-3 pb-3 sm:px-7 sm:pb-4">
          <div className="flex gap-2 pb-1 -mb-1 overflow-x-auto flex-nowrap" style={{ scrollbarWidth: "none" }}>
            {["All", "admin", "user"].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border text-[12px] sm:text-sm font-semibold cursor-pointer transition-all whitespace-nowrap shrink-0
                  ${roleFilter === r
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-500 border-slate-200 hover:border-blue-400 hover:text-blue-600"
                  }`}
              >
                {r === "All" ? "All Roles" : displayRole(r)}
                <span className="ml-1 opacity-75">
                  ({r === "All" ? accounts.length : accounts.filter((a) => (a.role ?? "user") === r).length})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search + Sort Row */}
        <div className="flex flex-wrap items-center gap-2 px-3 pb-3 sm:px-7 sm:pb-4">
          <div className="relative flex-1 min-w-[160px]">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-slate-400 pointer-events-none">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone…"
              className={`${inputCls} pl-8`}
            />
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2.5 bg-white text-[13px] text-slate-700 cursor-pointer outline-none focus:border-blue-500 transition-colors appearance-none pr-7"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name_asc">Name: A → Z</option>
              <option value="name_desc">Name: Z → A</option>
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[11px]">▾</div>
          </div>
          {(search || roleFilter !== "All" || sortBy !== "newest") && (
            <button
              onClick={() => { setSearch(""); setRoleFilter("All"); setSortBy("newest"); setCurrentPage(1); }}
              className="border border-slate-200 rounded-lg px-3 py-2.5 bg-white text-[13px] text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Error */}
        {fetchError && (
          <div className="mx-3 sm:mx-7 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[13px]">
            ⚠️ Failed to load accounts.
            <button onClick={fetchAccounts} className="ml-2.5 text-xs text-blue-600 bg-transparent border-none cursor-pointer underline">Retry</button>
          </div>
        )}

        {/* ── Mobile card grid ── */}
        {!loading && !fetchError && paginated.length > 0 && (
          <div className="block px-3 pb-4 sm:hidden">
            <div className="grid grid-cols-1 gap-3">
              {paginated.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onEdit={() => setEditModal(account)}
                  onRole={() => setRoleModal(account)}
                  onDelete={() => setDeleteModal(account)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Mobile loading skeleton */}
        {loading && (
          <div className="block px-3 pb-4 space-y-3 sm:hidden">
            <MobileSkeletons />
          </div>
        )}

        {/* Empty state */}
        {!loading && !fetchError && filtered.length === 0 && (
          <div className="mx-3 sm:mx-7 bg-white rounded-[14px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="py-12 text-sm text-center text-slate-400">
              {search ? `No accounts matching "${search}"` : "No accounts found."}
            </div>
          </div>
        )}

        {/* ── Desktop table ── */}
        {!loading && !fetchError && paginated.length > 0 && (
          <div className="hidden sm:block mx-7 bg-white rounded-[14px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead className="border-b bg-slate-50 border-slate-100">
                  <tr>
                    {["Account", "Phone", "Role", "Joined", "Action"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 tracking-[0.06em] uppercase whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((account) => (
                    <tr key={account.id} className="border-b border-slate-50 last:border-b-0 hover:[&_td]:bg-[#F8FAFF] transition-colors">
                      <td className="px-4 py-3 align-middle">
                        <div className="font-semibold text-slate-900 mb-0.5">{fullName(account)}</div>
                        <div className="text-xs text-slate-400">{account.email}</div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className="font-mono text-[13px] font-medium text-slate-500">
                          {account.phone_number ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap border
                          ${account.role === "admin"
                            ? "bg-slate-800 text-slate-100 border-slate-700"
                            : "bg-slate-100 text-slate-500 border-slate-300"
                          }`}>
                          {displayRole(account.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className="font-mono text-[13px] font-medium text-slate-500 whitespace-nowrap">
                          {fmtDate(account.created_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex gap-1.5">
                          <button onClick={() => setEditModal(account)} className="px-3 py-1 text-xs font-semibold text-blue-700 transition-colors border border-blue-200 rounded-md cursor-pointer bg-blue-50 hover:bg-blue-100">Edit</button>
                          <button onClick={() => setRoleModal(account)} className="px-3 py-1 text-xs font-semibold text-green-700 transition-colors border border-green-200 rounded-md cursor-pointer bg-green-50 hover:bg-green-100">Role</button>
                          <button onClick={() => setDeleteModal(account)} className="px-3 py-1 text-xs font-semibold text-red-600 transition-colors border border-red-200 rounded-md cursor-pointer bg-red-50 hover:bg-red-100">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filtered.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between px-4 py-3 text-xs border-t border-slate-100 text-slate-400">
                <span>
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} accounts
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="text-xs font-medium transition-colors bg-white border rounded-md cursor-pointer w-7 h-7 text-slate-700 border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >‹</button>
                  {pageNumbers.map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-7 h-7 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                        p === currentPage
                          ? "bg-blue-600 text-white border-none"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >{p}</button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="text-xs font-medium transition-colors bg-white border rounded-md cursor-pointer w-7 h-7 text-slate-700 border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >›</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Desktop loading skeleton */}
        {loading && (
          <div className="hidden sm:block mx-7 bg-white rounded-[14px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead className="border-b bg-slate-50 border-slate-100">
                  <tr>
                    {["Account", "Phone", "Role", "Joined", "Action"].map((h) => (
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
        {!loading && !fetchError && filtered.length > 0 && (
          <div className="px-3 sm:px-7 pt-2.5 text-xs text-slate-400">
            Showing {Math.min(paginated.length, filtered.length)} of {filtered.length} account{filtered.length !== 1 ? "s" : ""}
          </div>
        )}

      </main>

      {editModal   && <EditModal   account={editModal}   onClose={() => !saving && setEditModal(null)}   onSave={handleEditSave}  saving={saving} />}
      {roleModal   && <RoleModal   account={roleModal}   onClose={() => !saving && setRoleModal(null)}   onSave={handleRoleSave}  saving={saving} />}
      {deleteModal && <DeleteModal account={deleteModal} onClose={() => !saving && setDeleteModal(null)} onConfirm={handleDelete} saving={saving} />}

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={hideToast} />}
    </div>
  );
}