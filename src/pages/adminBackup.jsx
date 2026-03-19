import { useState, useRef } from 'react';
import AdminNav from '../components/AdminNav';

const TYPE_COLORS = {
  Database: "bg-[#daf5ff] border-[#b9cff8] text-[#2563eb]",
  Files:    "bg-[#fef3c7] border-[#fde68a] text-[#d97706]",
  Full:     "bg-[#ede9fe] border-[#ddd6fe] text-[#7c3aed]",
};

const initialBackups = [
  { id: 1, filename: 'Backup_file_01', type: 'Database', size: '15 MB', date: '2025/10/08 - 12:25 PM', status: 'Complete' },
  { id: 2, filename: 'Backup_file_02', type: 'Files',    size: '5 MB',  date: '2025/10/08 - 12:25 PM', status: 'Complete' },
  { id: 3, filename: 'Backup_file_03', type: 'Database', size: '13 MB', date: '2025/10/08 - 12:25 PM', status: 'Complete' },
  { id: 4, filename: 'Backup_file_04', type: 'Full',     size: '67 MB', date: '2025/10/08 - 12:25 PM', status: 'Complete' },
  { id: 5, filename: 'Backup_file_05', type: 'Files',    size: '25 MB', date: '2025/10/08 - 12:25 PM', status: 'Complete' },
  { id: 6, filename: 'Backup_file_06', type: 'Database', size: '18 MB', date: '2025/10/08 - 12:25 PM', status: 'Complete' },
  { id: 7, filename: 'Backup_file_07', type: 'Database', size: '12 MB', date: '2025/10/08 - 12:25 PM', status: 'Complete' },
];

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
    desc: 'Restore from a backup file',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#155dfc" strokeWidth="1.8">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
  },
];

export default function AdminBackup() {
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [backups, setBackups]           = useState(initialBackups);
  const [runningKey, setRunningKey]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toastMsg, setToastMsg]         = useState('');
  const fileInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleRunNow = (key) => {
    if (key === 'restore') { fileInputRef.current?.click(); return; }
    setRunningKey(key);
    setTimeout(() => {
      const typeMap = { full: 'Full', database: 'Database', files: 'Files' };
      const sizeMap = { full: '72 MB', database: '16 MB', files: '8 MB' };
      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      const dateStr = `${now.getFullYear()}/${pad(now.getMonth()+1)}/${pad(now.getDate())} - ${pad(now.getHours())}:${pad(now.getMinutes())} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
      const newBackup = {
        id: Date.now(),
        filename: `Backup_file_${String(backups.length + 1).padStart(2, '0')}`,
        type: typeMap[key],
        size: sizeMap[key],
        date: dateStr,
        status: 'Complete',
      };
      setBackups(prev => [newBackup, ...prev]);
      setRunningKey(null);
      showToast(`✓ ${typeMap[key]} backup completed successfully`);
    }, 2000);
  };

  const handleFileRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    showToast(`✓ Restore from "${file.name}" started`);
    e.target.value = '';
  };

  const handleDownload = (b) => showToast(`↓ Downloading ${b.filename}…`);

  const confirmDelete = () => {
    setBackups(prev => prev.filter(b => b.id !== deleteTarget));
    setDeleteTarget(null);
    showToast('Backup deleted');
  };

  return (
    <>
      <style>{`
        @keyframes br-spin    { to { transform: rotate(360deg); } }
        @keyframes br-fadein  { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      `}</style>

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
              <span className="text-lg">💾</span>
              <span className="font-bold text-sm text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Backup &amp; Recovery
              </span>
            </div>
          </div>

          {/* Page inner */}
          <div className="flex-1 px-10 py-8 pb-16 w-full box-border text-[#1e1e1e] max-lg:px-6 max-md:px-3 max-md:py-4"
            style={{ fontFamily: "'Inter', Helvetica, sans-serif" }}>

            {/* Desktop header */}
            <div className="hidden md:flex items-start justify-between gap-4 mb-7 flex-wrap">
              <div>
                <h2 className="font-semibold text-2xl text-black m-0 mb-1 leading-tight"
                  style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Backup &amp; Recovery
                </h2>
                <p className="text-sm text-[#6b6a6a] m-0" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Manage database and file backups
                </p>
              </div>
              <button
                onClick={() => showToast('✓ Backup list refreshed')}
                className="inline-flex items-center gap-1.5 h-[38px] px-4 rounded-full border border-[#cac4d0] bg-transparent text-sm font-medium text-[#49454f] cursor-pointer whitespace-nowrap hover:bg-[#f3f0f6] transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
                style={{ fontFamily: "'Poppins', sans-serif" }}
                aria-label="Refresh backup data"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
                </svg>
                Refresh
              </button>
            </div>

            {/* Backup Action Cards */}
            <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {backupCards.map((card) => (
                <div
                  key={card.key}
                  className="bg-white border border-[#c2c2c2] rounded-[15px] px-6 pt-7 pb-6 flex flex-col gap-1.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow"
                >
                  <div className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-lg mb-1 shrink-0">
                    {card.icon}
                  </div>
                  <h3 className="font-semibold text-sm text-[#111111] m-0"
                    style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {card.title}
                  </h3>
                  <p className="text-xs text-[#6b6a6a] m-0 mb-2.5 leading-snug"
                    style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {card.desc}
                  </p>
                  <button
                    onClick={() => handleRunNow(card.key)}
                    disabled={runningKey === card.key}
                    className="inline-flex items-center gap-1.5 h-8 px-3.5 border-none rounded-md bg-transparent text-sm font-medium text-[#1458b8] cursor-pointer self-start mt-auto hover:bg-blue-50 disabled:opacity-65 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
                    aria-label={`Run ${card.title}`}
                  >
                    {runningKey === card.key ? (
                      <span
                        className="inline-block w-[13px] h-[13px] rounded-full border-2 border-[#b9cff8] border-t-[#1458b8]"
                        style={{ animation: "br-spin 0.7s linear infinite" }}
                      />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    )}
                    {runningKey === card.key ? 'Running…' : 'Run Now'}
                  </button>
                </div>
              ))}
            </div>

            {/* Hidden file input */}
            <input ref={fileInputRef} type="file" accept=".sql,.zip,.tar,.gz" className="hidden" onChange={handleFileRestore} />

            {/* Backup History */}
            <div className="bg-white border border-[#c2c2c2] rounded-[15px] overflow-hidden">
              <h3
                className="text-sm font-normal text-black m-0 px-4 py-2.5 border-b border-[#c2c2c2] bg-white"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Backup History
              </h3>
              <div className="w-full overflow-x-auto">
                <table
                  className="w-full border-collapse text-sm min-w-[600px]"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  <thead>
                    <tr className="bg-[#e6e6e6] border-b border-[#c2c2c2]">
                      {["Filename", "Type", "Size", "Date", "Status"].map((h) => (
                        <th key={h} className="px-4 py-2.5 font-normal text-xs text-black text-left whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                      <th className="px-4 py-2.5 font-normal text-xs text-black text-center whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((b) => (
                      <tr key={b.id} className="border-b border-[#c2c2c2] last:border-b-0 hover:bg-[#f5faf7] transition-colors">
                        <td className="px-4 py-2.5 align-middle text-xs text-[#696868]">{b.filename}</td>
                        <td className="px-4 py-2.5 align-middle">
                          <span className={`inline-flex items-center justify-center px-3 py-0.5 rounded-full border text-xs font-medium whitespace-nowrap ${TYPE_COLORS[b.type] ?? TYPE_COLORS.Database}`}>
                            {b.type}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 align-middle text-xs text-[#696868]">{b.size}</td>
                        <td className="px-4 py-2.5 align-middle text-xs text-[#696868] whitespace-nowrap">{b.date}</td>
                        <td className="px-4 py-2.5 align-middle">
                          <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full border border-[#baeada] bg-[#e4f6f0] text-xs font-medium text-[#059669] whitespace-nowrap">
                            ● {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleDownload(b)}
                              aria-label={`Download ${b.filename}`}
                              title="Download"
                              className="w-7 h-7 rounded-md flex items-center justify-center border-none cursor-pointer bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteTarget(b.id)}
                              aria-label={`Delete ${b.filename}`}
                              title="Delete"
                              className="w-7 h-7 rounded-md flex items-center justify-center border-none cursor-pointer bg-red-50 text-red-500 hover:bg-red-100 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
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
                    ))}
                    {backups.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#aaaaaa] text-sm">
                          No backup records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deleteTarget !== null && (
        <div
          onClick={() => setDeleteTarget(null)}
          className="fixed inset-0 bg-black/45 z-[200] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl px-7 pt-8 pb-6 w-full max-w-[380px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] flex flex-col items-center text-center max-sm:flex-col"
          >
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4 text-2xl">
              🗑️
            </div>
            <h3 className="font-semibold text-[17px] text-[#111111] m-0 mb-2.5"
              style={{ fontFamily: "'Poppins', sans-serif" }}>
              Delete Backup?
            </h3>
            <p className="text-sm text-[#666666] leading-relaxed m-0 mb-6"
              style={{ fontFamily: "'Inter', sans-serif" }}>
              This backup file will be permanently removed and cannot be recovered. Are you sure?
            </p>
            <div className="flex gap-2.5 w-full max-sm:flex-col">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 h-[38px] rounded-lg border border-[#cccccc] bg-transparent text-sm font-medium text-[#333333] cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 h-[38px] rounded-lg border-none bg-red-500 text-sm font-medium text-white cursor-pointer hover:opacity-85 transition-opacity"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div
          className="fixed bottom-7 left-1/2 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.25)] z-[300] whitespace-nowrap max-sm:w-[calc(100%-2rem)] max-sm:text-center max-sm:whitespace-normal"
          style={{
            transform: "translateX(-50%)",
            animation: "br-fadein 0.2s ease",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {toastMsg}
        </div>
      )}
    </>
  );
}