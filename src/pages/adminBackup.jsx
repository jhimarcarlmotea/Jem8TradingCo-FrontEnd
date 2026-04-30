import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminNav from '../components/AdminNav';

// ── Design tokens (matched to adminReviews) ─────────────────────────────────
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

// ── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// ── Constants ────────────────────────────────────────────────────────────────
const TYPE_COLORS = {
  Database: { bg: T.blue50, border: T.blue100, text: T.blue600 },
  Files:    { bg: T.amber50, border: T.amber100, text: T.amber600 },
  Full:     { bg: '#ede9fe', border: '#ddd6fe', text: '#7c3aed' },
};

const BACKUP_TYPE_MAP = {
  full:     3,
  database: 1,
  files:    2,
};

const TYPE_LABEL_MAP = {
  1: 'Database',
  2: 'Files',
  3: 'Full',
};

// ── Accepted MIME types for restore ─────────────────────────────────────────
const RESTORE_ACCEPT = '.sql,.zip';
const MAX_RESTORE_MB = 200;

const backupCards = [
  {
    key: 'full',
    title: 'Full Backup',
    desc: 'Database + Uploaded files',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.blue600} strokeWidth="1.8">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
  },
  {
    key: 'database',
    title: 'Database Only',
    desc: 'SQL dump of all tables',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.blue600} strokeWidth="1.8">
        <ellipse cx="12" cy="5" rx="9" ry="3"/>
        <path d="M21 12c0 1.657-4.03 3-9 3S3 13.657 3 12"/>
        <path d="M3 5v14c0 1.657 4.03 3 9 3s9-1.343 9-3V5"/>
      </svg>
    ),
  },
  {
    key: 'files',
    title: 'Files Only',
    desc: 'Uploaded images & documents',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.blue600} strokeWidth="1.8">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
      </svg>
    ),
  },
  {
    key: 'restore',
    title: 'Upload & Restore',
    desc: 'Restore from .sql or .zip backup',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.blue600} strokeWidth="1.8">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const formatDate = (isoString) => {
  if (!isoString) return '—';
  const d   = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  const h   = d.getHours();
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} - ${pad(h % 12 || 12)}:${pad(d.getMinutes())} ${h >= 12 ? 'PM' : 'AM'}`;
};

const normaliseBackup = (raw) => {
  const id = raw.backup_id ?? raw.id;
  return {
    id,
    filename: raw.file_name ?? `backup_${id}`,
    type:     TYPE_LABEL_MAP[raw.backup_type] ?? 'Database',
    size:     formatBytes(raw.backup_size),
    date:     formatDate(raw.created_at),
    status:   raw.status === 'completed' ? 'Complete' : (raw.status ?? 'Unknown'),
  };
};

/**
 * Client-side validation before uploading a restore file.
 * Returns an error string or null if valid.
 */
const validateRestoreFile = (file) => {
  if (!file) return 'No file selected.';

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['sql', 'zip'].includes(ext)) {
    return `Invalid file type ".${ext}". Only .sql or .zip backup files are accepted.`;
  }

  const maxBytes = MAX_RESTORE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    return `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed is ${MAX_RESTORE_MB} MB.`;
  }

  if (file.size === 0) {
    return 'The selected file is empty.';
  }

  return null;
};

// ── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ lg = false }) {
  return (
    <span
      className={`inline-block rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin ${lg ? 'w-6 h-6' : 'w-3.5 h-3.5'}`}
    />
  );
}

// ── Restore progress modal ────────────────────────────────────────────────────
function RestoreProgressModal({ fileName, stage }) {
  const stages = [
    { key: 'uploading',   label: 'Uploading backup file…'         },
    { key: 'extracting',  label: 'Extracting archive…'            },
    { key: 'db',          label: 'Importing database…'            },
    { key: 'files',       label: 'Restoring media files…'         },
    { key: 'done',        label: 'Restore complete!'              },
  ];

  const currentIndex = stages.findIndex((s) => s.key === stage);

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
      <div data-overlay className="bg-white rounded-2xl px-8 pt-8 pb-7 w-full max-w-[400px] shadow-2xl flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4 text-3xl">
          {stage === 'done' ? '✅' : '⏳'}
        </div>
        <h3
          className="font-semibold text-[17px] text-[#111111] m-0 mb-1"
          style={{ fontFamily: T.font }}
        >
          {stage === 'done' ? 'Restore Complete' : 'Restoring Backup…'}
        </h3>
        <p
          className="text-[12px] text-[#888] m-0 mb-5 truncate max-w-full px-2"
          style={{ fontFamily: T.font }}
        >
          {fileName}
        </p>

        {/* Stage progress */}
        <div className="w-full flex flex-col gap-2 text-left">
          {stages.map((s, idx) => {
            const done    = idx < currentIndex || stage === 'done';
            const active  = idx === currentIndex && stage !== 'done';
            return (
              <div
                key={s.key}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all ${
                  done   ? 'bg-green-50 text-green-700' :
                  active ? 'bg-blue-50 text-blue-700 font-semibold' :
                           'text-gray-300'
                }`}
                style={{ fontFamily: T.font }}
              >
                <span className="text-base leading-none">
                  {done ? '✓' : active ? <Spinner /> : '○'}
                </span>
                {s.label}
              </div>
            );
          })}
        </div>

        {stage !== 'done' && (
          <p className="text-[11px] text-[#aaa] mt-4 m-0" style={{ fontFamily: T.font }}>
            This may take a few minutes. Do not close this tab.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Restore confirm modal ─────────────────────────────────────────────────────
function RestoreConfirmModal({ file, onCancel, onConfirm }) {
  const ext    = file?.name.split('.').pop()?.toLowerCase();
  const isZip  = ext === 'zip';
  const sizeMB = file ? (file.size / 1024 / 1024).toFixed(2) : '—';

  return (
    <div
      className="fixed inset-0 bg-black/45 z-[200] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div data-overlay
        className="bg-white rounded-2xl px-7 pt-8 pb-6 w-full max-w-[420px] shadow-2xl flex flex-col items-center text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4 text-2xl">
          ⚠️
        </div>
        <h3
          className="font-semibold text-[17px] text-[#111111] m-0 mb-2"
          style={{ fontFamily: T.font }}
        >
          Restore from Backup?
        </h3>

        {/* File details */}
        <div
          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 text-left text-[12px] text-[#555]"
          style={{ fontFamily: 'Inter, monospace' }}
        >
          <div className="flex justify-between gap-2 mb-1">
            <span className="text-gray-400">File</span>
            <span className="font-medium text-[#222] truncate max-w-[230px]" title={file?.name}>{file?.name}</span>
          </div>
          <div className="flex justify-between gap-2 mb-1">
            <span className="text-gray-400">Type</span>
            <span className="font-medium text-[#222] uppercase">{ext}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-400">Size</span>
            <span className="font-medium text-[#222]">{sizeMB} MB</span>
          </div>
        </div>

        {/* What will be restored */}
        <div
          className="w-full mb-4 text-left text-[12px]"
          style={{ fontFamily: T.font }}
        >
          <p className="text-[#666] m-0 mb-2 font-semibold">This restore will:</p>
          <ul className="m-0 pl-4 text-[#555] space-y-1 list-disc">
            {(isZip || ext === 'sql') && (
              <li>Import the SQL database dump (overwriting existing data)</li>
            )}
            {isZip && (
              <>
                <li>Extract and restore media folders:<br />
                  <span className="font-mono text-[11px] text-blue-600">
                    blog_images, featured_images, products, profile_images
                  </span>
                  <span className="text-[#999]"> (and others if present)</span>
                </li>
                <li>Overwrite files in <span className="font-mono text-[11px]">storage/app/public/</span></li>
              </>
            )}
          </ul>
        </div>

        <p
          className="text-[12px] text-red-500 font-semibold m-0 mb-5"
          style={{ fontFamily: T.font }}
        >
          ⚠️ This action cannot be undone. Make sure you have a current backup before proceeding.
        </p>

        <div className="flex gap-2.5 w-full">
          <button
            className="flex-1 h-[38px] rounded-lg bg-transparent border border-[#cccccc] text-[#333333] text-[13px] font-medium cursor-pointer hover:bg-[#f5f5f5]"
            style={{ fontFamily: T.font }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="flex-1 h-[38px] rounded-lg bg-blue-600 text-white text-[13px] font-semibold cursor-pointer border-none hover:bg-blue-700 transition-colors"
            style={{ fontFamily: T.font }}
            onClick={onConfirm}
          >
            Restore Now
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24,
      display: "flex", flexDirection: "column", gap: 8,
      zIndex: 9999,
    }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            padding: "10px 16px",
            borderRadius: T.radius.md,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: T.shadow.md,
            border: `1px solid ${t.type === "error" ? T.red100 : T.green100}`,
            background: t.type === "error" ? T.red50 : T.green50,
            color: t.type === "error" ? T.red600 : T.green600,
            fontFamily: T.font,
          }}
        >
          {t.type === "error" ? "✗ " : "✓ "}{t.message}
        </div>
      ))}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
export default function AdminBackup() {
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [backups,        setBackups]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [runningKey,     setRunningKey]     = useState(null);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [toasts,         setToasts]         = useState([]);

  // ── Restore state ──────────────────────────────────────────────────────────
  const [pendingRestoreFile, setPendingRestoreFile] = useState(null);
  const [restoreStage,       setRestoreStage]       = useState(null);

  const fileInputRef = useRef(null);

  // ── Toast helper ───────────────────────────────────────────────────────────
  const toast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);

  // ── Fetch history ──────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/admin/backups');
      if (res.data.status === 'success') {
        setBackups((res.data.data ?? []).map(normaliseBackup));
      } else {
        toast(res.data.message ?? 'Failed to load backups', 'error');
      }
    } catch (err) {
      toast(err.response?.data?.message ?? 'Network error – could not load backup history', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // ── Run backup ─────────────────────────────────────────────────────────────
  const handleRunNow = async (key) => {
    if (key === 'restore') {
      fileInputRef.current?.click();
      return;
    }
    setRunningKey(key);
    try {
      const res = await api.post('/admin/backups/run', { backup_type: BACKUP_TYPE_MAP[key] });
      if (res.data.status === 'success') {
        const newBackup = normaliseBackup(res.data.data);
        setBackups((prev) => [newBackup, ...prev]);
        toast(`✓ ${newBackup.type} backup completed successfully`);
      } else {
        const msg = typeof res.data.message === 'object'
          ? Object.values(res.data.message).flat().join(' ')
          : (res.data.message ?? 'Backup failed');
        toast(msg, 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Network error – backup could not be started';
      toast(typeof msg === 'object' ? Object.values(msg).flat().join(' ') : msg, 'error');
    } finally {
      setRunningKey(null);
    }
  };

  // ── File picker → validate → show confirm ─────────────────────────────────
  const handleFilePicked = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    const validationError = validateRestoreFile(file);
    if (validationError) {
      toast(validationError, 'error');
      return;
    }

    setPendingRestoreFile(file);
  };

  // ── Execute restore after user confirms ───────────────────────────────────
  const executeRestore = async () => {
    const file = pendingRestoreFile;
    setPendingRestoreFile(null);

    if (!file) return;

    const ext   = file.name.split('.').pop()?.toLowerCase();
    const isZip = ext === 'zip';

    setRestoreStage('uploading');

    try {
      const formData = new FormData();
      formData.append('backup_file', file);

      const stageTimer = (stage, delayMs) =>
        new Promise((res) => setTimeout(() => { setRestoreStage(stage); res(); }, delayMs));

      const uploadPromise = api.post('/admin/backups/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600_000,
      });

      if (isZip) {
        await stageTimer('extracting', 1200);
        await stageTimer('db', 2500);
        await stageTimer('files', 4500);
      } else {
        await stageTimer('db', 1000);
      }

      const res = await uploadPromise;

      if (res.data.status === 'success') {
        setRestoreStage('done');
        setTimeout(() => {
          setRestoreStage(null);
          toast(`✓ Restore from "${file.name}" completed successfully`);
          fetchHistory(true);
        }, 2500);
      } else {
        setRestoreStage(null);
        const msg = typeof res.data.message === 'object'
          ? Object.values(res.data.message).flat().join(' ')
          : (res.data.message ?? 'Restore failed');
        toast(msg, 'error');
      }
    } catch (err) {
      setRestoreStage(null);
      const errData = err.response?.data;
      if (errData?.type === 'validation' && errData?.message) {
        const msgs = typeof errData.message === 'object'
          ? Object.values(errData.message).flat().join(' ')
          : errData.message;
        toast(`Validation: ${msgs}`, 'error');
      } else {
        toast(errData?.message ?? 'Network error – restore could not be completed', 'error');
      }
    }
  };

  // ── Download ───────────────────────────────────────────────────────────────
  const handleDownload = async (b) => {
    if (!b.id) {
      toast('Cannot download — backup ID is missing', 'error');
      return;
    }
    toast(`↓ Preparing download for ${b.filename}…`);
    try {
      const res = await api.get(`/admin/backups/${b.id}/download`, { responseType: 'blob' });

      const contentType = res.headers['content-type'] ?? '';
      if (contentType.includes('application/json')) {
        const text = await res.data.text();
        const json = JSON.parse(text);
        toast(json.message ?? 'Download failed', 'error');
        return;
      }

      const url  = URL.createObjectURL(res.data);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = b.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const json = JSON.parse(text);
          toast(json.message ?? 'Download failed', 'error');
        } catch {
          toast('Download failed', 'error');
        }
      } else {
        toast(err.response?.data?.message ?? 'Network error – download failed', 'error');
      }
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    const targetId = deleteTarget;
    setDeleteTarget(null);
    try {
      const res = await api.delete(`/admin/backups/${targetId}`);
      if (res.data.status === 'success') {
        setBackups((prev) => prev.filter((b) => b.id !== targetId));
        toast('Backup deleted successfully');
      } else {
        toast(res.data.message ?? 'Delete failed', 'error');
      }
    } catch (err) {
      toast(err.response?.data?.message ?? 'Network error – delete failed', 'error');
    }
  };

  const handleRefresh = () => {
    fetchHistory();
    toast('✓ Backup list refreshed');
  };

  // ── Stats for stat cards ───────────────────────────────────────────────────
  const totalBackups = backups.length;
  const totalSize = backups.reduce((acc, b) => {
    const sizeInBytes = b.rawSize || 0;
    return acc + sizeInBytes;
  }, 0);
  const formattedTotalSize = formatBytes(totalSize);
  const latestBackup = backups[0]?.date || '—';

  const statCards = [
    { label: "Total Backups",  value: totalBackups, sub: "backups", bg: T.blue50, accent: T.blue600, icon: "💾" },
    { label: "Total Size",     value: formattedTotalSize, sub: "stored", bg: T.amber50, accent: T.amber600, icon: "📦" },
    { label: "Latest Backup",  value: latestBackup, sub: "created", bg: T.green50, accent: T.green600, icon: "🕐" },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: "#F0F4F8", fontFamily: T.font,
    }}>
      <style>{`
        .ap-hamburger { display: flex; }
        @media (min-width: 1024px) { .ap-hamburger { display: none !important; } }
      `}</style>

      <Toast toasts={toasts} />

      <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main style={{
        flex: 1, minWidth: 0, padding: "20px 20px",
        overflowX: "hidden",
      }}>
        {/* Top bar */}
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
            >
              ☰
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.slate900, letterSpacing: "-0.3px" }}>Backup &amp; Recovery</h1>
              <p style={{ margin: "1px 0 0", fontSize: 11, color: T.slate400 }}>Manage database and file backups</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
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
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: s.accent, borderRadius: `${T.radius.lg}px ${T.radius.lg}px 0 0`,
              }} />
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <div style={{
                    fontSize: 10, fontWeight: 600, color: T.slate400,
                    textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6,
                  }}>
                    {s.label}
                  </div>
                  <div style={{
                    fontSize: 28, fontWeight: 800, color: T.slate900,
                    letterSpacing: "-0.5px", lineHeight: 1,
                  }}>
                    {s.value}
                  </div>
                  {s.sub && (
                    <div style={{ fontSize: 10, color: T.slate400, marginTop: 4 }}>{s.sub}</div>
                  )}
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

        {/* Restore info banner */}
        <div style={{
          marginBottom: 16, padding: "12px 16px", borderRadius: T.radius.lg,
          background: T.blue50, border: `1px solid ${T.blue100}`,
          fontSize: 12, color: T.blue700, fontFamily: T.font,
        }}>
          <span style={{ fontWeight: 700 }}>ℹ️ Restore supports:</span>{" "}
          <span className="font-mono" style={{ background: T.blue100, padding: "2px 6px", borderRadius: 4 }}>.sql</span> plain SQL dumps and{" "}
          <span className="font-mono" style={{ background: T.blue100, padding: "2px 6px", borderRadius: 4 }}>.zip</span> full backups.
          ZIP archives are automatically extracted — the database is imported and media folders restored.
        </div>

        {/* Backup action cards */}
        <div style={{
          display: "grid", gap: 12, marginBottom: 24,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}>
          {backupCards.map((card) => (
            <div
              key={card.key}
              style={{
                background: "#fff", borderRadius: T.radius.lg, padding: "16px",
                border: `1px solid ${T.slate200}`, boxShadow: T.shadow.sm,
                transition: "all 0.15s", display: "flex", flexDirection: "column",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = T.shadow.hover; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = T.shadow.sm; }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: T.radius.md,
                background: T.blue50, display: "flex", alignItems: "center",
                justifyContent: "center", marginBottom: 12,
              }}>
                {card.icon}
              </div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.slate800 }}>{card.title}</h3>
              <p style={{ margin: "4px 0 12px 0", fontSize: 11, color: T.slate500 }}>{card.desc}</p>
              <button
                onClick={() => handleRunNow(card.key)}
                disabled={runningKey === card.key || restoreStage !== null}
                style={{
                  marginTop: "auto", padding: "6px 12px", borderRadius: T.radius.sm,
                  border: "none", background: T.blue600, color: "#fff",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  transition: "background 0.12s", fontFamily: T.font,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  opacity: (runningKey === card.key || restoreStage !== null) ? 0.6 : 1,
                }}
                onMouseEnter={e => !(runningKey === card.key || restoreStage !== null) && (e.currentTarget.style.background = T.blue700)}
                onMouseLeave={e => !(runningKey === card.key || restoreStage !== null) && (e.currentTarget.style.background = T.blue600)}
              >
                {runningKey === card.key ? (
                  <Spinner />
                ) : (
                  <>
                    {card.key === 'restore' ? '📂 Upload File' : '▶ Run Now'}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={RESTORE_ACCEPT}
          className="hidden"
          onChange={handleFilePicked}
        />

        {/* Backup history table */}
<div style={{
  background: "#fff", borderRadius: T.radius.lg,
  border: `1px solid ${T.slate200}`, overflow: "hidden", boxShadow: T.shadow.sm,
}}>
  <div style={{
    padding: "12px 16px", borderBottom: `1px solid ${T.slate200}`,
    background: "#fff",
  }}>
    <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.slate700 }}>Backup History</h3>
  </div>
  <div className="w-full overflow-x-auto">
    {loading ? (
      <div className="flex items-center justify-center gap-3 py-10 text-[13px] text-gray-500">
        <Spinner lg />
        <span>Loading backups…</span>
      </div>
    ) : (
      <table className="w-full border-collapse text-sm min-w-[600px]" style={{ fontFamily: T.font }}>
        <thead>
          <tr className="bg-[#e6e6e6] border-b border-[#c2c2c2]">
            {['Filename', 'Type', 'Size', 'Date', 'Status', 'Actions'].map((h) => (
              <th
                key={h}
                className={`px-4 py-2.5 font-normal text-[13px] text-black text-left whitespace-nowrap ${h === 'Actions' ? 'text-center' : ''}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {backups.map((b) => {
            const tc = TYPE_COLORS[b.type] ?? TYPE_COLORS.Database;
            return (
              <tr key={b.id} className="border-b border-[#c2c2c2] last:border-b-0 transition-colors hover:bg-[#f5faf7]">
                <td className="px-4 py-[9px] align-middle text-[#696868] text-[13px] font-normal">{b.filename}</td>
                <td className="px-4 py-[9px] align-middle">
                  <span
                    className="inline-flex items-center justify-center px-3 py-0.5 rounded-full border text-xs font-medium whitespace-nowrap"
                    style={{ background: tc.bg, borderColor: tc.border, color: tc.text }}
                  >
                    {b.type}
                  </span>
                </td>
                <td className="px-4 py-[9px] align-middle text-[#696868] text-[13px]">{b.size}</td>
                <td className="px-4 py-[9px] align-middle text-[#696868] text-[13px] whitespace-nowrap">{b.date}</td>
                <td className="px-4 py-[9px] align-middle">
                  <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full border border-[#baeada] bg-[#e4f6f0] text-xs font-medium text-emerald-600 whitespace-nowrap">
                    ● {b.status}
                  </span>
                </td>
                <td className="px-4 py-[9px] align-middle text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      className="w-7 h-7 rounded-md flex items-center justify-center border-none cursor-pointer transition-colors bg-[#eff6ff] text-blue-600 hover:bg-[#dbeafe]"
                      onClick={() => handleDownload(b)}
                      title="Download"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </button>
                    <button
                      className="w-7 h-7 rounded-md flex items-center justify-center border-none cursor-pointer transition-colors bg-[#fef2f2] text-red-500 hover:bg-[#fee2e2]"
                      onClick={() => setDeleteTarget(b.id)}
                      title="Delete"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {backups.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center py-8 text-[#aaaaaa] text-[13px]">
                No backup records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    )}
  </div>
</div>

        {/* Pagination count */}
        <div className="flex items-center justify-between mt-5 text-xs text-gray-400">
          <span>Showing {backups.length} backup{backups.length !== 1 ? "s" : ""}</span>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                className={`w-7 h-7 rounded-md text-xs font-medium cursor-pointer transition-colors
                  ${p === 1
                    ? "bg-blue-600 text-white border-none"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* ── Restore confirm modal ── */}
      {pendingRestoreFile && (
        <RestoreConfirmModal
          file={pendingRestoreFile}
          onCancel={() => setPendingRestoreFile(null)}
          onConfirm={executeRestore}
        />
      )}

      {/* ── Restore progress modal ── */}
      {restoreStage !== null && (
        <RestoreProgressModal
          fileName={pendingRestoreFile?.name ?? ''}
          stage={restoreStage}
        />
      )}

      {/* ── Delete confirm modal ── */}
      {deleteTarget !== null && (
        <div
          className="fixed inset-0 bg-black/45 z-[200] flex items-center justify-center p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div data-overlay
            className="bg-white rounded-2xl px-7 pt-8 pb-6 w-full max-w-[380px] shadow-2xl flex flex-col items-center text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4 text-2xl">
              🗑️
            </div>
            <h3 className="font-semibold text-[17px] text-[#111111] m-0 mb-2.5" style={{ fontFamily: T.font }}>
              Delete Backup?
            </h3>
            <p className="text-[13px] text-[#666666] leading-relaxed m-0 mb-6" style={{ fontFamily: T.font }}>
              This backup file will be permanently removed and cannot be recovered. Are you sure?
            </p>
            <div className="flex gap-2.5 w-full">
              <button
                className="flex-1 h-[38px] rounded-lg bg-transparent border border-[#cccccc] text-[#333333] text-[13px] font-medium cursor-pointer hover:bg-[#f5f5f5]"
                style={{ fontFamily: T.font }}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                className="flex-1 h-[38px] rounded-lg bg-red-500 text-white text-[13px] font-medium cursor-pointer border-none hover:opacity-85"
                style={{ fontFamily: T.font }}
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}