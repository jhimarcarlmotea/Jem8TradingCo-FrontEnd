import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import AdminNav from "../components/AdminNav";

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
    month: "long", day: "numeric", year: "numeric",
  });
};

const displayRole = (r) =>
  r ? r.charAt(0).toUpperCase() + r.slice(1) : "User";

// ── Shared input style ────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%", padding: "10px 12px",
  border: `1px solid ${T.slate300}`, borderRadius: T.radius.md,
  fontSize: 13, color: T.slate900, background: "#fff",
  outline: "none", boxSizing: "border-box",
  fontFamily: T.font, transition: "border-color 0.12s",
};

function StyledInput({ ...props }) {
  return (
    <input
      {...props}
      style={{ ...inputStyle, ...(props.disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}) }}
      onFocus={e => !props.disabled && (e.currentTarget.style.borderColor = T.blue500)}
      onBlur={e => (e.currentTarget.style.borderColor = T.slate300)}
    />
  );
}

// ── Modal Overlay ─────────────────────────────────────────────────────────────
function Overlay({ children, onClose, narrow }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 12,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          width: "100%",
          maxWidth: narrow ? 420 : 520,
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

function ModalHeader({ title, subtitle, onClose, disabled }) {
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
        disabled={disabled}
        style={{
          width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, border: `1px solid ${T.slate200}`, borderRadius: T.radius.sm,
          background: T.slate50, color: T.slate500, fontSize: 18, cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.12s", opacity: disabled ? 0.5 : 1,
        }}
        onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = T.red50; e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.borderColor = "#fecaca"; }}}
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

// ── Buttons ───────────────────────────────────────────────────────────────────
function BtnCancel({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1, padding: "10px", border: `1px solid ${T.slate200}`,
        borderRadius: T.radius.md, background: "#fff", color: T.slate700,
        fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: T.font, transition: "background 0.12s",
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.background = T.slate50)}
      onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
    >{children ?? "Cancel"}</button>
  );
}

function BtnPrimary({ onClick, disabled, children, danger }) {
  const bg = danger ? T.red600 : T.blue600;
  const hoverBg = danger ? "#c41c1c" : T.blue700;
  const disabledBg = danger ? "#ef9494" : "#93c5fd";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1, padding: "10px", border: "none",
        borderRadius: T.radius.md,
        background: disabled ? disabledBg : bg,
        color: "#fff", fontSize: 13, fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: T.font, transition: "background 0.12s",
      }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.background = hoverBg)}
      onMouseLeave={e => !disabled && (e.currentTarget.style.background = bg)}
    >{children}</button>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
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
      .catch(() => { setForm({ ...account }); setFetchErr(true); })
      .finally(() => setFetching(false));
  }, [account.id]);

  const handleChange = (e) => {
    const name = e.target.name;
    let val = e.target.value;
    if (name === "phone_number") val = String(val).replace(/\D/g, "").slice(0, 11);
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
      <ModalHeader title="Edit Account" subtitle={fullName(account)} onClose={onClose} disabled={saving || fetching} />
      <div style={{ padding: "20px 24px" }}>
        {fetchErr && (
          <div style={{
            padding: "10px 14px", marginBottom: 16, borderRadius: T.radius.md,
            background: T.amber50, border: `1px solid ${T.amber100}`,
            color: T.amber600, fontSize: 12, fontFamily: T.font,
          }}>
            Could not refresh data — showing last known values.
          </div>
        )}
        {fetching ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {fields.map((f) => (
              <div key={f.name}>
                <div style={{ width: 96, height: 12, marginBottom: 8, borderRadius: 6, background: T.slate100, animation: "pulse 2s infinite" }} />
                <div style={{ width: "100%", height: 40, borderRadius: T.radius.md, background: T.slate100, animation: "pulse 2s infinite" }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1, height: 40, borderRadius: T.radius.md, background: T.slate100, animation: "pulse 2s infinite" }} />
              <div style={{ flex: 1, height: 40, borderRadius: T.radius.md, background: T.slate100, animation: "pulse 2s infinite" }} />
            </div>
          </div>
        ) : (
          <>
            {fields.map((f) => (
              <Field key={f.name} label={f.label}>
                <StyledInput
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
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <BtnCancel onClick={onClose} disabled={saving} />
              <BtnPrimary onClick={() => onSave(form)} disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </BtnPrimary>
            </div>
          </>
        )}
      </div>
    </Overlay>
  );
}

// ── Role Modal ────────────────────────────────────────────────────────────────
function RoleModal({ account, onClose, onSave, saving }) {
  const [selectedRole, setSelectedRole] = useState(account.role ?? "user");

  return (
    <Overlay onClose={!saving ? onClose : undefined} narrow>
      <ModalHeader title="Change Role" subtitle={`Changing role for ${fullName(account)}`} onClose={onClose} disabled={saving} />
      <div style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {roles.map((r) => {
            const isSelected = selectedRole === r;
            return (
              <button
                key={r}
                onClick={() => !saving && setSelectedRole(r)}
                disabled={saving}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 16px", borderRadius: T.radius.lg,
                  border: `1.5px solid ${isSelected ? T.blue600 : T.slate200}`,
                  background: isSelected ? T.blue50 : "#fff",
                  cursor: saving ? "not-allowed" : "pointer",
                  textAlign: "left", width: "100%", fontFamily: T.font,
                  transition: "all 0.12s", position: "relative",
                  opacity: saving ? 0.6 : 1,
                }}
                onMouseEnter={e => { if (!saving && !isSelected) { e.currentTarget.style.borderColor = T.blue500; e.currentTarget.style.background = T.blue50; }}}
                onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = T.slate200; e.currentTarget.style.background = "#fff"; }}}
              >
                <span style={{ fontSize: 22, flexShrink: 0 }}>{r === "admin" ? "🛡️" : "👤"}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.slate900, marginBottom: 2 }}>{displayRole(r)}</div>
                  <div style={{ fontSize: 12, color: T.slate400 }}>
                    {r === "admin" ? "Full access to admin panel" : "Standard registered access"}
                  </div>
                </div>
                {isSelected && (
                  <span style={{ position: "absolute", right: 16, fontSize: 14, fontWeight: 700, color: T.blue600 }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <BtnCancel onClick={onClose} disabled={saving} />
          <BtnPrimary onClick={() => onSave(selectedRole)} disabled={saving}>
            {saving ? "Saving…" : "Save Role"}
          </BtnPrimary>
        </div>
      </div>
    </Overlay>
  );
}

// ── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({ account, onClose, onConfirm, saving }) {
  return (
    <Overlay onClose={!saving ? onClose : undefined} narrow>
      <div style={{ padding: "32px 28px", textAlign: "center", fontFamily: T.font }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: T.slate900 }}>Delete Account?</h3>
        <p style={{ margin: "0 0 6px", fontSize: 14, color: T.slate500 }}>
          "<strong style={{ color: T.slate700 }}>{fullName(account)}</strong>"
        </p>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: T.slate400 }}>This action cannot be undone.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <BtnCancel onClick={onClose} disabled={saving} />
          <BtnPrimary onClick={onConfirm} disabled={saving} danger>
            {saving ? "Deleting…" : "Delete"}
          </BtnPrimary>
        </div>
      </div>
    </Overlay>
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

// ── Main Page ─────────────────────────────────────────────────────────────────
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
  const [toasts, setToasts]           = useState([]);

  const toast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

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
    { label: "All Accounts", value: loading ? "—" : totalAccounts, sub: "Registered users", bg: T.blue50,  accent: T.blue600,  icon: "👥" },
    { label: "Admins",       value: loading ? "—" : totalAdmins,   sub: "Full access",      bg: T.slate100, accent: T.slate600, icon: "🛡️" },
    { label: "Users",        value: loading ? "—" : totalUsers,    sub: "Standard access",  bg: T.green50,  accent: T.green600, icon: "👤" },
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
        first_name: form.first_name, last_name: form.last_name,
        email: form.email, phone_number: form.phone_number,
      })
      .then((res) => {
        const updated = res.data?.data ?? res.data;
        setAccounts((prev) => prev.map((a) => (a.id === editModal.id ? { ...a, ...updated } : a)));
        setEditModal(null);
        toast("Account updated successfully.");
      })
      .catch(() => toast("Failed to update account.", "error"))
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
        toast("Role updated successfully.");
      })
      .catch(() => toast("Failed to update role.", "error"))
      .finally(() => setSaving(false));
  };

  const handleDelete = () => {
    setSaving(true);
    api
      .delete(`/accounts/${deleteModal.id}`)
      .then(() => {
        setAccounts((prev) => prev.filter((a) => a.id !== deleteModal.id));
        setDeleteModal(null);
        toast("Account deleted successfully.");
      })
      .catch(() => toast("Failed to delete account.", "error"))
      .finally(() => setSaving(false));
  };

  // role badge style helper
  const roleBadgeStyle = (role) => {
    if (role === "admin") return { bg: T.slate800, color: "#f1f5f9", border: T.slate700 };
    return { bg: T.slate100, color: T.slate500, border: T.slate300 };
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

      <main style={{ flex: 1, minWidth: 0, padding: "20px", overflowX: "hidden" }}>

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
              <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.slate900, letterSpacing: "-0.3px", fontFamily: T.font }}>
                Account Management
              </h1>
              <p style={{ margin: "1px 0 0", fontSize: 11, color: T.slate400, fontFamily: T.font }}>
                Manage registered user accounts
              </p>
            </div>
          </div>
          <button
            onClick={fetchAccounts}
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
        </div>

        {/* Stat Cards */}
        <div style={{
          display: "grid", gap: 10, marginBottom: 16,
          gridTemplateColumns: "repeat(3, 1fr)",
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
                    {s.value}
                  </div>
                  <div style={{ fontSize: 10, color: T.slate400, marginTop: 4, fontFamily: T.font }}>{s.sub}</div>
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

        {/* Filter Tabs + Search + Sort Row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {/* Role tabs */}
          <div style={{ display: "flex", gap: 8, flexWrap: "nowrap", overflowX: "auto" }}>
            {["All", "admin", "user"].map((r) => {
              const isActive = roleFilter === r;
              return (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
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
                  {r === "All" ? "All Roles" : displayRole(r)}
                  <span style={{ marginLeft: 4, opacity: 0.75 }}>
                    ({r === "All" ? accounts.length : accounts.filter((a) => (a.role ?? "user") === r).length})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
            <span style={{
              position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
              fontSize: 13, color: T.slate400, pointerEvents: "none",
            }}>🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone…"
              style={{ ...inputStyle, paddingLeft: 32 }}
              onFocus={e => e.currentTarget.style.borderColor = T.blue500}
              onBlur={e => e.currentTarget.style.borderColor = T.slate300}
            />
          </div>

          {/* Sort */}
          <div style={{ position: "relative" }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                ...inputStyle, width: "auto", paddingRight: 28,
                appearance: "none", cursor: "pointer",
              }}
              onFocus={e => e.currentTarget.style.borderColor = T.blue500}
              onBlur={e => e.currentTarget.style.borderColor = T.slate300}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name_asc">Name: A → Z</option>
              <option value="name_desc">Name: Z → A</option>
            </select>
            <div style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              pointerEvents: "none", color: T.slate400, fontSize: 11,
            }}>▾</div>
          </div>

          {/* Clear */}
          {(search || roleFilter !== "All" || sortBy !== "newest") && (
            <button
              onClick={() => { setSearch(""); setRoleFilter("All"); setSortBy("newest"); setCurrentPage(1); }}
              style={{
                padding: "10px 14px", border: `1px solid ${T.slate200}`,
                borderRadius: T.radius.md, background: "#fff", color: T.slate700,
                fontSize: 13, cursor: "pointer", fontFamily: T.font,
                transition: "background 0.12s", whiteSpace: "nowrap",
              }}
              onMouseEnter={e => e.currentTarget.style.background = T.slate50}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}
            >✕ Clear</button>
          )}
        </div>

        {/* Error */}
        {fetchError && (
          <div style={{
            marginBottom: 16, padding: "12px 16px",
            background: T.red50, border: `1px solid ${T.red100}`,
            borderRadius: T.radius.md, color: T.red600, fontSize: 13, fontFamily: T.font,
          }}>
            ⚠️ Failed to load accounts.
            <button
              onClick={fetchAccounts}
              style={{ marginLeft: 10, fontSize: 12, color: T.blue600, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: T.font }}
            >Retry</button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[1, 2, 3].map((n) => (
              <div key={n} style={{
                padding: 20, background: "#fff", boxShadow: T.shadow.sm,
                borderRadius: T.radius.lg, height: 112, opacity: 0.6,
                border: `1px solid ${T.slate200}`,
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !fetchError && filtered.length === 0 && (
          <div style={{
            padding: 40, fontSize: 14, textAlign: "center",
            color: T.slate400, background: "#fff",
            boxShadow: T.shadow.sm, borderRadius: T.radius.lg,
            fontFamily: T.font, border: `1px solid ${T.slate200}`,
          }}>
            {search ? `No accounts matching "${search}"` : "No accounts found."}
          </div>
        )}

        {/* Account Cards */}
        {!loading && !fetchError && paginated.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {paginated.map((account) => {
              const rb = roleBadgeStyle(account.role);
              const initials = [account.first_name, account.last_name]
                .filter(Boolean)
                .map((n) => n[0].toUpperCase())
                .join("") || "?";

              return (
                <div
                  key={account.id}
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
                      {/* Avatar */}
                      <div style={{
                        width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, fontWeight: 700, color: "#fff",
                        background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                      }}>
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: T.slate900 }}>
                          {fullName(account)}
                        </div>
                        <div style={{ fontSize: 11, color: T.slate400, marginTop: 2 }}>
                          {account.email}{account.email && account.created_at ? " · " : ""}{fmtDate(account.created_at)}
                        </div>
                        {/* Phone tag */}
                        {account.phone_number && (
                          <span style={{
                            display: "inline-block", padding: "3px 8px", marginTop: 6,
                            borderRadius: T.radius.sm, fontSize: 11, fontWeight: 500,
                            background: T.slate50, border: `1px solid ${T.slate200}`,
                            color: T.slate600, fontFamily: "monospace",
                          }}>
                            📞 {account.phone_number}
                          </span>
                        )}
                        {/* Action buttons */}
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 8 }}>
                          <button
                            onClick={() => setEditModal(account)}
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
                            onClick={() => setRoleModal(account)}
                            style={{
                              padding: "4px 14px", borderRadius: T.radius.sm,
                              border: `1px solid ${T.green500}`, background: "#fff",
                              color: T.green600, fontSize: 12, fontWeight: 600,
                              cursor: "pointer", transition: "background 0.12s", fontFamily: T.font,
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = T.green50}
                            onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                          >
                            🛡️ Role
                          </button>
                          <button
                            onClick={() => setDeleteModal(account)}
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
                        </div>
                      </div>
                    </div>
                    {/* Role badge + ID — right side */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: T.radius.sm,
                        fontSize: 11, fontWeight: 700, textTransform: "capitalize",
                        background: rb.bg, color: rb.color, border: `1px solid ${rb.border}`,
                        flexShrink: 0,
                      }}>
                        {displayRole(account.role)}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.slate400, fontFamily: T.font }}>
                        ID: <span style={{ fontWeight: 700, color: T.slate600 }}>#{account.id}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && !fetchError && filtered.length > ITEMS_PER_PAGE && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginTop: 20, fontSize: 12, color: T.slate400, fontFamily: T.font,
          }}>
            <span>
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} accounts
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  width: 28, height: 28, borderRadius: T.radius.sm, fontSize: 12,
                  fontWeight: 500, cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  background: "#fff", color: T.slate700, border: `1px solid ${T.slate200}`,
                  opacity: currentPage === 1 ? 0.4 : 1, transition: "background 0.12s",
                }}
                onMouseEnter={e => currentPage !== 1 && (e.currentTarget.style.background = T.slate50)}
                onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
              >‹</button>
              {pageNumbers.map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  style={{
                    width: 28, height: 28, borderRadius: T.radius.sm, fontSize: 12,
                    fontWeight: 600, cursor: "pointer", transition: "all 0.12s",
                    background: p === currentPage ? T.blue600 : "#fff",
                    color: p === currentPage ? "#fff" : T.slate700,
                    border: p === currentPage ? "none" : `1px solid ${T.slate200}`,
                    boxShadow: p === currentPage ? "0 2px 8px rgba(37,99,235,0.25)" : "none",
                  }}
                >{p}</button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  width: 28, height: 28, borderRadius: T.radius.sm, fontSize: 12,
                  fontWeight: 500, cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  background: "#fff", color: T.slate700, border: `1px solid ${T.slate200}`,
                  opacity: currentPage === totalPages ? 0.4 : 1, transition: "background 0.12s",
                }}
                onMouseEnter={e => currentPage !== totalPages && (e.currentTarget.style.background = T.slate50)}
                onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
              >›</button>
            </div>
          </div>
        )}

        {/* Count footer */}
        {!loading && !fetchError && filtered.length > 0 && filtered.length <= ITEMS_PER_PAGE && (
          <div style={{ marginTop: 20, fontSize: 12, color: T.slate400, fontFamily: T.font }}>
            Showing {filtered.length} of {accounts.length} account{accounts.length !== 1 ? "s" : ""}
          </div>
        )}

      </main>

      {editModal   && <EditModal   account={editModal}   onClose={() => !saving && setEditModal(null)}   onSave={handleEditSave}  saving={saving} />}
      {roleModal   && <RoleModal   account={roleModal}   onClose={() => !saving && setRoleModal(null)}   onSave={handleRoleSave}  saving={saving} />}
      {deleteModal && <DeleteModal account={deleteModal} onClose={() => !saving && setDeleteModal(null)} onConfirm={handleDelete} saving={saving} />}
    </div>
  );
}