import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminNav from '../components/AdminNav';

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
  Database: { bg: '#daf5ff', border: '#b9cff8', text: '#2563eb' },
  Files:    { bg: '#fef3c7', border: '#fde68a', text: '#d97706' },
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
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#155dfc" strokeWidth="1.8">
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
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#155dfc" strokeWidth="1.8">
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
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#155dfc" strokeWidth="1.8">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
      </svg>
    ),
  },
  {
    key: 'restore',
    title: 'Upload & Restore',
    desc: 'Restore from .sql or .zip backup',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#155dfc" strokeWidth="1.8">
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
      <div className="bg-white rounded-2xl px-8 pt-8 pb-7 w-full max-w-[400px] shadow-2xl flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4 text-3xl">
          {stage === 'done' ? '✅' : '⏳'}
        </div>
        <h3
          className="font-semibold text-[17px] text-[#111111] m-0 mb-1"
          style={{ fontFamily: 'Poppins, Helvetica, sans-serif' }}
        >
          {stage === 'done' ? 'Restore Complete' : 'Restoring Backup…'}
        </h3>
        <p
          className="text-[12px] text-[#888] m-0 mb-5 truncate max-w-full px-2"
          style={{ fontFamily: 'Inter, Helvetica, sans-serif' }}
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
                style={{ fontFamily: 'Inter, Helvetica, sans-serif' }}
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
          <p className="text-[11px] text-[#aaa] mt-4 m-0" style={{ fontFamily: 'Inter, Helvetica, sans-serif' }}>
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
      <div
        className="bg-white rounded-2xl px-7 pt-8 pb-6 w-full max-w-[420px] shadow-2xl flex flex-col items-center text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4 text-2xl">
          ⚠️
        </div>
        <h3
          className="font-semibold text-[17px] text-[#111111] m-0 mb-2"
          style={{ fontFamily: 'Poppins, Helvetica, sans-serif' }}
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
          style={{ fontFamily: 'Inter, Helvetica, sans-serif' }}
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
          style={{ fontFamily: 'Inter, Helvetica, sans-serif' }}
        >
          ⚠️ This action cannot be undone. Make sure you have a current backup before proceeding.
        </p>

        <div className="flex gap-2.5 w-full">
          <button
            className="flex-1 h-[38px] rounded-lg bg-transparent border border-[#cccccc] text-[#333333] text-[13px] font-medium cursor-pointer hover:bg-[#f5f5f5]"
            style={{ fontFamily: 'Poppins, Helvetica, sans-serif' }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="flex-1 h-[38px] rounded-lg bg-blue-600 text-white text-[13px] font-semibold cursor-pointer border-none hover:bg-blue-700 transition-colors"
            style={{ fontFamily: 'Poppins, Helvetica, sans-serif' }}
            onClick={onConfirm}
          >
            Restore Now
          </button>
        </div>
      </div>
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
  const [toastMsg,       setToastMsg]       = useState('');
  const [toastType,      setToastType]      = useState('success');

  // ── Restore state ──────────────────────────────────────────────────────────
  const [pendingRestoreFile, setPendingRestoreFile] = useState(null); // waiting for confirm
  const [restoreStage,       setRestoreStage]       = useState(null); // null | 'uploading' | 'extracting' | 'db' | 'files' | 'done'

  const fileInputRef = useRef(null);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 4000);
  }, []);

  // ── Fetch history ──────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/admin/backups');
      if (res.data.status === 'success') {
        setBackups((res.data.data ?? []).map(normaliseBackup));
      } else {
        showToast(res.data.message ?? 'Failed to load backups', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Network error – could not load backup history', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

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
        showToast(`✓ ${newBackup.type} backup completed successfully`);
      } else {
        const msg = typeof res.data.message === 'object'
          ? Object.values(res.data.message).flat().join(' ')
          : (res.data.message ?? 'Backup failed');
        showToast(msg, 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Network error – backup could not be started';
      showToast(typeof msg === 'object' ? Object.values(msg).flat().join(' ') : msg, 'error');
    } finally {
      setRunningKey(null);
    }
  };

  // ── File picker → validate → show confirm ─────────────────────────────────
  const handleFilePicked = (e) => {
    const file = e.target.files[0];
    // Reset input so the same file can be picked again later
    e.target.value = '';
    if (!file) return;

    const validationError = validateRestoreFile(file);
    if (validationError) {
      showToast(validationError, 'error');
      return;
    }

    // Show confirmation modal with file details
    setPendingRestoreFile(file);
  };

  // ── Execute restore after user confirms ───────────────────────────────────
  const executeRestore = async () => {
    const file = pendingRestoreFile;
    setPendingRestoreFile(null);

    if (!file) return;

    const ext   = file.name.split('.').pop()?.toLowerCase();
    const isZip = ext === 'zip';

    // Start progress UI
    setRestoreStage('uploading');

    try {
      const formData = new FormData();
      formData.append('backup_file', file);

      // Simulate multi-stage progress (server does it all in one request,
      // but we step the UI to keep user informed)
      const stageTimer = (stage, delayMs) =>
        new Promise((res) => setTimeout(() => { setRestoreStage(stage); res(); }, delayMs));

      const uploadPromise = api.post('/admin/backups/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600_000, // 10 min for large backups
      });

      // Visual stage progression (optimistic, actual work happens server-side)
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

        // Auto-dismiss after 2.5s
        setTimeout(() => {
          setRestoreStage(null);
          showToast(`✓ Restore from "${file.name}" completed successfully`);
          fetchHistory(true);
        }, 2500);
      } else {
        setRestoreStage(null);
        const msg = typeof res.data.message === 'object'
          ? Object.values(res.data.message).flat().join(' ')
          : (res.data.message ?? 'Restore failed');
        showToast(msg, 'error');
      }
    } catch (err) {
      setRestoreStage(null);

      // Extract error from validation (422) or server (500)
      const errData = err.response?.data;
      if (errData?.type === 'validation' && errData?.message) {
        const msgs = typeof errData.message === 'object'
          ? Object.values(errData.message).flat().join(' ')
          : errData.message;
        showToast(`Validation: ${msgs}`, 'error');
      } else {
        showToast(errData?.message ?? 'Network error – restore could not be completed', 'error');
      }
    }
  };

  // ── Download ───────────────────────────────────────────────────────────────
  const handleDownload = async (b) => {
    if (!b.id) {
      showToast('Cannot download — backup ID is missing', 'error');
      return;
    }
    showToast(`↓ Preparing download for ${b.filename}…`);
    try {
      const res = await api.get(`/admin/backups/${b.id}/download`, { responseType: 'blob' });

      const contentType = res.headers['content-type'] ?? '';
      if (contentType.includes('application/json')) {
        const text = await res.data.text();
        const json = JSON.parse(text);
        showToast(json.message ?? 'Download failed', 'error');
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
          showToast(json.message ?? 'Download failed', 'error');
        } catch {
          showToast('Download failed', 'error');
        }
      } else {
        showToast(err.response?.data?.message ?? 'Network error – download failed', 'error');
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
        showToast('Backup deleted successfully');
      } else {
        showToast(res.data.message ?? 'Delete failed', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Network error – delete failed', 'error');
    }
  };

  const handleRefresh = () => {
    fetchHistory();
    showToast('✓ Backup list refreshed');
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen w-full bg-[#eaf2ed]">
      <AdminNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex flex-1 min-w-0 flex-col bg-[#eaf2ed] overflow-y-auto">

        {/* ── Mobile top bar ── */}
        <div className="flex md:hidden items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30">
          <button
            className="bg-transparent border-none text-xl cursor-pointer text-gray-700 flex items-center justify-center p-1 flex-shrink-0"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">💾</span>
            <span className="font-bold text-[15px] text-gray-900" style={{ fontFamily: 'Poppins, Helvetica, sans-serif' }}>
              Backup &amp; Recovery
            </span>
          </div>
        </div>

        <div className="flex-1 px-10 pt-8 pb-16 w-full box-border text-[#1e1e1e] max-lg:px-6 max-md:px-3 max-md:pt-4">

          {/* ── Desktop page header ── */}
          <div className="hidden md:flex items-start justify-between gap-4 mb-7 flex-wrap">
            <div>
              <h2 className="font-semibold text-2xl text-black m-0 mb-1 leading-tight" style={{ fontFamily: 'Poppins, Helvetica, sans-serif' }}>
                Backup &amp; Recovery
              </h2>
              <p className="text-sm text-[#6b6a6a] m-0" style={{ fontFamily: 'Poppins, Helvetica, sans-serif' }}>
                Manage database and file backups · Accepts .sql and .zip restore files
              </p>
            </div>
            <button
              className="inline-flex items-center gap-2 h-[38px] px-[18px] rounded-full border border-[#cac4d0] bg-transparent text-[13px] font-medium text-[#49454f] cursor-pointer transition-colors whitespace-nowrap hover:bg-[#f3f0f6]"
              style={{ fontFamily: 'Poppins, Helvetica, sans-serif' }}
              onClick={handleRefresh}
              aria-label="Refresh backup data"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
              </svg>
              Refresh
            </button>
          </div>

          {/* ── Restore info banner ── */}
          <div
            className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl border border-blue-200 bg-blue-50 text-[13px] text-blue-700"
            style={{ fontFamily: 'Inter, Helvetica, sans-serif' }}
          >
            <span className="text-base mt-0.5">ℹ️</span>
            <div>
              <span className="font-semibold">Restore supports:</span>
              {' '}<span className="font-mono bg-blue-100 px-1 rounded">.sql</span> plain SQL dumps and
              {' '}<span className="font-mono bg-blue-100 px-1 rounded">.zip</span> full backups.
              ZIP archives are automatically extracted — the database is imported and media folders
              (<span className="font-mono text-[12px]">blog_images, featured_images, products, profile_images</span>)
              are restored to their correct storage paths.
            </div>
          </div>

          {/* ── Backup action cards ── */}
          <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-4">
            {backupCards.map((card) => (
              <div
                key={card.key}
                className="bg-white border border-[#c2c2c2] rounded-[15px] p-7 flex flex-col gap-1.5 transition-shadow hover:shadow-md"
              >
                <div className="w-9 h-9 flex items-center justify-center bg-[#eff6ff] rounded-lg mb-1 flex-shrink-0">
                  {card.icon}
                </div>
                <h3 className="font-semibold text-sm text-[#111111] m-0" style={{ fontFamily: 'Poppins, Helvetica, sans-serif' }}>
                  {card.title}
                </h3>
                <p className="text-xs text-[#6b6a6a] m-0 mb-2.5 leading-snug" style={{ fontFamily: 'Poppins, Helvetica, sans-serif' }}>
                  {card.desc}
                </p>
                <button
                  className="inline-flex items-center gap-1.5 h-8 px-3.5 border-none rounded-md bg-transparent text-[13px] font-medium text-[#1458b8] cursor-pointer transition-colors self-start mt-auto hover:bg-[#eff6ff] disabled:opacity-65 disabled:cursor-not-allowed"
                  onClick={() => handleRunNow(card.key)}
                  disabled={runningKey === card.key || restoreStage !== null}
                  aria-label={`Run ${card.title}`}
                >
                  {runningKey === card.key ? (
                    <Spinner />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      {card.key === 'restore'
                        ? <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>
                        : <polygon points="5 3 19 12 5 21 5 3"/>
                      }
                    </svg>
                  )}
                  {runningKey === card.key
                    ? 'Running…'
                    : card.key === 'restore'
                      ? 'Upload File'
                      : 'Run Now'}
                </button>
              </div>
            ))}
          </div>

          {/* Hidden file input — accepts .sql and .zip */}
          <input
            ref={fileInputRef}
            type="file"
            accept={RESTORE_ACCEPT}
            className="hidden"
            onChange={handleFilePicked}
          />

          {/* ── Backup history ── */}
          <div className="bg-white border border-[#c2c2c2] rounded-[15px] overflow-hidden">
            <h3
              className="font-normal text-[13px] text-black m-0 px-4 py-2.5 border-b border-[#c2c2c2] bg-white"
              style={{ fontFamily: 'Poppins, Helvetica, sans-serif' }}
            >
              Backup History
            </h3>
            <div className="w-full overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center gap-3 py-10 text-[13px] text-gray-500">
                  <Spinner lg />
                  <span>Loading backups…</span>
                </div>
              ) : (
                <table className="w-full border-collapse text-sm min-w-[600px]" style={{ fontFamily: 'Poppins, Helvetica, sans-serif' }}>
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

        </div>
      </div>

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
          <div
            className="bg-white rounded-2xl px-7 pt-8 pb-6 w-full max-w-[380px] shadow-2xl flex flex-col items-center text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4 text-2xl">
              🗑️
            </div>
            <h3 className="font-semibold text-[17px] text-[#111111] m-0 mb-2.5" style={{ fontFamily: 'Poppins, Helvetica, sans-serif' }}>
              Delete Backup?
            </h3>
            <p className="text-[13px] text-[#666666] leading-relaxed m-0 mb-6" style={{ fontFamily: 'Inter, Helvetica, sans-serif' }}>
              This backup file will be permanently removed and cannot be recovered. Are you sure?
            </p>
            <div className="flex gap-2.5 w-full">
              <button
                className="flex-1 h-[38px] rounded-lg bg-transparent border border-[#cccccc] text-[#333333] text-[13px] font-medium cursor-pointer hover:bg-[#f5f5f5]"
                style={{ fontFamily: 'Poppins, Helvetica, sans-serif' }}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                className="flex-1 h-[38px] rounded-lg bg-red-500 text-white text-[13px] font-medium cursor-pointer border-none hover:opacity-85"
                style={{ fontFamily: 'Poppins, Helvetica, sans-serif' }}
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toastMsg && (
        <div
          className={`fixed bottom-7 left-1/2 -translate-x-1/2 text-white text-[13px] px-[22px] py-2.5 rounded-full shadow-lg z-[300] whitespace-nowrap ${
            toastType === 'error' ? 'bg-red-600' : 'bg-[#111827]'
          }`}
          style={{ fontFamily: 'Inter, Helvetica, sans-serif' }}
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}