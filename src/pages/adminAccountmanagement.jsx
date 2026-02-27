import { useState } from "react";
import AdminNav from "../components/AdminNav";
import "../style/adminAccountManagement.css";

const initialAccounts = [
  { id: 1, name: "Juan Dela Cruz", email: "juan@gmail.com", phone: "+63 9145783671", role: "User", joined: "Feb. 20, 2026" },
  { id: 2, name: "Juan Dela Cruz", email: "juan@gmail.com", phone: "+63 9145783671", role: "Admin", joined: "Feb. 20, 2026" },
  { id: 3, name: "Juan Dela Cruz", email: "juan@gmail.com", phone: "+63 9145783671", role: "User", joined: "Feb. 20, 2026" },
  { id: 4, name: "Juan Dela Cruz", email: "juan@gmail.com", phone: "+63 9145783671", role: "User", joined: "Feb. 20, 2026" },
  { id: 5, name: "Juan Dela Cruz", email: "juan@gmail.com", phone: "+63 9145783671", role: "User", joined: "Feb. 20, 2026" },
];

const roles = ["User", "Admin"];

// Edit Modal
function EditModal({ account, onClose, onSave }) {
  const [form, setForm] = useState({ ...account });
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="acm-modal-overlay">
      <div className="acm-modal-box">
        <div className="acm-modal-header">
          <h2>Edit Account</h2>
          <button className="acm-modal-close" onClick={onClose}>✕</button>
        </div>

        {[
          { label: "Full Name", name: "name", placeholder: "Enter full name" },
          { label: "Email", name: "email", placeholder: "Enter email" },
          { label: "Phone", name: "phone", placeholder: "Enter phone number" },
          { label: "Joined Date", name: "joined", placeholder: "e.g. Feb. 20, 2026" },
        ].map((f) => (
          <div className="acm-modal-field" key={f.name}>
            <label className="acm-modal-label">{f.label}</label>
            <input
              className="acm-modal-input"
              name={f.name}
              value={form[f.name]}
              onChange={handleChange}
              placeholder={f.placeholder}
            />
          </div>
        ))}

        <div className="acm-modal-footer">
          <button className="acm-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="acm-save-btn" onClick={() => onSave(form)}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// Role Modal
function RoleModal({ account, onClose, onSave }) {
  const [selectedRole, setSelectedRole] = useState(account.role);

  return (
    <div className="acm-modal-overlay">
      <div className="acm-modal-box acm-role-modal-box">
        <div className="acm-modal-header">
          <h2>Change Role</h2>
          <button className="acm-modal-close" onClick={onClose}>✕</button>
        </div>

        <p className="acm-role-subtitle">
          Changing role for <strong>{account.name}</strong>
        </p>

        <div className="acm-role-options">
          {roles.map((r) => (
            <button
              key={r}
              className={`acm-role-option ${selectedRole === r ? "active" : ""}`}
              onClick={() => setSelectedRole(r)}
            >
              <span className="acm-role-option-icon">
                {r === "Admin" ? "🛡️" : "👤"}
              </span>
              <div>
                <div className="acm-role-option-name">{r}</div>
                <div className="acm-role-option-desc">
                  {r === "Admin" ? "Full access to admin panel" : "Standard registered access"}
                </div>
              </div>
              {selectedRole === r && <span className="acm-role-check">✓</span>}
            </button>
          ))}
        </div>

        <div className="acm-modal-footer">
          <button className="acm-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="acm-save-btn" onClick={() => onSave(selectedRole)}>Save Role</button>
        </div>
      </div>
    </div>
  );
}

// Delete Modal
function DeleteModal({ account, onClose, onConfirm }) {
  return (
    <div className="acm-modal-overlay">
      <div className="acm-delete-modal-box">
        <span className="acm-delete-icon">🗑️</span>
        <h3 className="acm-delete-title">Delete Account?</h3>
        <p className="acm-delete-text">
          Are you sure you want to delete <strong>{account.name}</strong>? This action cannot be undone.
        </p>
        <div className="acm-delete-footer">
          <button className="acm-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="acm-confirm-delete-btn" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminAccountManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accounts, setAccounts] = useState(initialAccounts);
  const [search, setSearch] = useState("");
  const [editModal, setEditModal] = useState(null);
  const [roleModal, setRoleModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  const filtered = accounts.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    a.phone.includes(search)
  );

  const totalAccounts = accounts.length;
  const totalAdmins = accounts.filter((a) => a.role === "Admin").length;
  const totalUsers = accounts.filter((a) => a.role === "User").length;

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

  return (
    <div className="acm-wrapper">
      <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="acm-main">

        {/* Top Bar */}
        <div className="acm-topbar">
          <div className="acm-topbar-left">
            <button className="acm-burger" onClick={() => setSidebarOpen(true)}>☰</button>
          </div>
          <div className="acm-search-wrapper">
            <span className="acm-search-icon">🔍</span>
            <input
              className="acm-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Account..."
            />
          </div>
        </div>

        {/* Page Title */}
        <h1 className="acm-page-title">ACCOUNT MANAGEMENT</h1>

        {/* Stats Cards */}
        <div className="acm-stats-grid">
          <div className="acm-stat-card">
            <div className="acm-stat-label">All Accounts</div>
            <div className="acm-stat-value">{totalAccounts}</div>
            <div className="acm-stat-sub">Registered Users</div>
          </div>
          <div className="acm-stat-card">
            <div className="acm-stat-label">Admins</div>
            <div className="acm-stat-value">{totalAdmins}</div>
            <div className="acm-stat-sub">With full access</div>
          </div>
          <div className="acm-stat-card">
            <div className="acm-stat-label">Users</div>
            <div className="acm-stat-value">{totalUsers}</div>
            <div className="acm-stat-sub">Standard access</div>
          </div>
        </div>

        {/* Table Section */}
        <div className="acm-section-title">All Accounts</div>

        <div className="acm-table-wrapper">
          <div className="acm-table-scroll">
            <table className="acm-table">
              <thead>
                <tr>
                  {["Account", "Phone", "Role", "Joined", "Action"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="acm-empty">No accounts found.</td>
                  </tr>
                ) : (
                  filtered.map((account) => (
                    <tr key={account.id}>
                      <td>
                        <div className="acm-account-name">{account.name}</div>
                        <div className="acm-account-email">{account.email}</div>
                      </td>
                      <td>
                        <span className="acm-phone">{account.phone}</span>
                      </td>
                      <td>
                        <span className={`acm-role-badge role-${account.role.toLowerCase()}`}>
                          {account.role}
                        </span>
                      </td>
                      <td>
                        <span className="acm-joined">{account.joined}</span>
                      </td>
                      <td>
                        <div className="acm-actions">
                          <button className="acm-action-btn edit" onClick={() => setEditModal(account)}>Edit</button>
                          <button className="acm-action-btn role" onClick={() => setRoleModal(account)}>Role</button>
                          <button className="acm-action-btn delete" onClick={() => setDeleteModal(account)}>Delete</button>
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

      {editModal && <EditModal account={editModal} onClose={() => setEditModal(null)} onSave={handleEditSave} />}
      {roleModal && <RoleModal account={roleModal} onClose={() => setRoleModal(null)} onSave={handleRoleSave} />}
      {deleteModal && <DeleteModal account={deleteModal} onClose={() => setDeleteModal(null)} onConfirm={handleDelete} />}
    </div>
  );
}