import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import AdminNav from '../components/AdminNav';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

const T = {
  blue50: '#EFF6FF', blue100: '#DBEAFE', blue500: '#3B82F6', blue600: '#2563EB',
  slate50: '#F8FAFC', slate100: '#F1F5F9', slate200: '#E2E8F0', slate300: '#CBD5E1',
  slate400: '#94A3B8', slate500: '#64748B', slate600: '#475569',
  radius: { sm: 8, md: 12, lg: 16, xl: 20 },
  font: "'DM Sans','Nunito',system-ui,sans-serif",
  red50: '#FEF2F2', red100: '#FEE2E2', red600: '#DC2626',
  green50: '#ECFDF5', green100: '#D1FAE5', green600: '#059669',
};

const btnBase = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' };

function Overlay({ children, onClose, wide }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', width: '100%', maxWidth: wide ? 720 : 480, borderRadius: 12, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', maxHeight: '92vh', overflowY: 'auto' }}>{children}</div>
    </div>
  );
}

function ModalHeader({ title, onClose }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottom: '1px solid ' + T.slate100 }}>
      <div style={{ fontWeight: 700 }}>{title}</div>
      <button onClick={onClose} style={{ border: '1px solid ' + T.slate100, background: T.slate50, padding: '6px 10px', borderRadius: 8 }}>×</button>
    </div>
  );
}

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [uploadTarget, setUploadTarget] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true); setError('');
    try {
      let res;
      try { res = await api.get('/payments'); }
      catch (e) { if (e.response?.status === 404) res = await api.get('/admin/payments'); else throw e; }
      const data = res.data?.data ?? res.data ?? [];
      setPayments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || 'Failed to load payments');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const updatePaymentStatus = async (id, status) => {
    try {
      let res;
      try { res = await api.patch(`/payments/${id}/status`, { status }); }
      catch (e) { if (e.response?.status === 404) res = await api.patch(`/admin/payments/${id}/status`, { status }); else throw e; }
      toast.success('Payment status updated');
      fetchPayments();
      return res.data;
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to update payment'); throw e; }
  };

  const upload2307 = async (id, file) => {
    try {
      const fd = new FormData();
      fd.append('form_2307', file);
      let res;
      try { res = await api.post(`/payments/${id}/upload-2307`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); }
      catch (e) { if (e.response?.status === 404) res = await api.post(`/admin/payments/${id}/upload-2307`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); else throw e; }
      toast.success('Form 2307 uploaded');
      fetchPayments();
      return res.data;
    } catch (e) { console.error(e); toast.error(e.response?.data?.message || 'Upload failed'); throw e; }
  };

  function StatusModal({ payment, onClose }) {
    const [status, setStatus] = useState(payment?.status ?? 'pending');
    const [saving, setSaving] = useState(false);
    return (
      <Overlay onClose={onClose}>
        <ModalHeader title={`Update Payment #${payment?.id ?? payment?.payment_id ?? ''}`} onClose={onClose} />
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {['pending','paid','failed','refunded'].map((s) => (
              <label key={s} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type='radio' name='pay-status' value={s} checked={status===s} onChange={() => setStatus(s)} />
                <span style={{ textTransform: 'capitalize' }}>{s}</span>
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ ...btnBase, background: '#fff', border: '1px solid '+T.slate100 }}>Cancel</button>
            <button onClick={async () => { setSaving(true); try { await updatePaymentStatus(payment.id ?? payment.payment_id, status); onClose(); } catch {} finally { setSaving(false); } }} disabled={saving} style={{ ...btnBase, background: '#2563EB', color: '#fff' }}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      </Overlay>
    );
  }

  function Upload2307Modal({ payment, onClose }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const accept = '.pdf,image/*';
    const maxMB = 10;
    const handle = async () => {
      if (!file) return toast.error('Please choose a file');
      if (file.size > maxMB * 1024 * 1024) return toast.error(`File too large (max ${maxMB} MB)`);
      setUploading(true);
      try { await upload2307(payment.id ?? payment.payment_id, file); onClose(); }
      catch (e) {} finally { setUploading(false); }
    };
    return (
      <Overlay onClose={onClose}>
        <ModalHeader title={`Upload Form 2307 — Payment #${payment?.id ?? payment?.payment_id ?? ''}`} onClose={onClose} />
        <div style={{ padding: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <input type='file' accept={accept} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <div style={{ fontSize: 12, color: T.slate500, marginTop: 8 }}>Accepted: PDF or image. Max {maxMB} MB.</div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ ...btnBase, background: '#fff', border: '1px solid '+T.slate100 }}>Cancel</button>
            <button onClick={handle} disabled={uploading} style={{ ...btnBase, background: '#059669', color: '#fff' }}>{uploading ? 'Uploading…' : 'Upload'}</button>
          </div>
        </div>
      </Overlay>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: T.font }}>
      <div style={{ width: 260 }}>
        <AdminNav sidebarOpen={true} setSidebarOpen={() => {}} />
      </div>
      <main style={{ flex: 1, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 18 }}>Payments</h1>
            <div style={{ color: T.slate500 }}>View and manage payments</div>
          </div>
          <div>
            <button onClick={fetchPayments} style={{ ...btnBase, background: '#fff', border: '1px solid '+T.slate100 }}>↻ Refresh</button>
          </div>
        </div>

        {loading ? <div>Loading…</div> : error ? <div style={{ color: T.red600 }}>{error}</div> : (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid '+T.slate100, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: T.slate50 }}>
                <tr>
                  <th style={{ padding: 10, textAlign: 'left' }}>ID</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Order</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Payer</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Method</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Status</th>
                  <th style={{ padding: 10, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id ?? p.payment_id} style={{ borderTop: '1px solid '+T.slate100 }}>
                    <td style={{ padding: 10 }}>{p.id ?? p.payment_id}</td>
                    <td style={{ padding: 10 }}>#{p.checkout?.checkout_id ?? p.order_id ?? '—'}</td>
                    <td style={{ padding: 10 }}>{p.payer_name ?? p.account_name ?? p.checkout?.user?.email ?? '—'}</td>
                    <td style={{ padding: 10 }}>{(p.method || p.payment_method || '—').replace(/_/g,' ')}</td>
                    <td style={{ padding: 10, textAlign: 'right' }}>₱{Number(p.amount ?? p.paid_amount ?? 0).toLocaleString()}</td>
                    <td style={{ padding: 10 }}>{(p.status || 'pending').toString()}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>
                      <button onClick={() => setEditTarget(p)} style={{ ...btnBase, background: '#fff', border: '1px solid '+T.slate100 }}>Edit</button>
                      <button onClick={() => setUploadTarget(p)} style={{ ...btnBase, background: '#fff', border: '1px solid '+T.slate100, marginLeft: 8 }}>Upload 2307</button>
                      {p.form_2307_url && (
                        <a href={p.form_2307_url} target="_blank" rel="noreferrer" style={{ marginLeft: 8, color: T.blue500 }}>View 2307</a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {editTarget && <StatusModal payment={editTarget} onClose={() => setEditTarget(null)} />}
        {uploadTarget && <Upload2307Modal payment={uploadTarget} onClose={() => setUploadTarget(null)} />}
      </main>
    </div>
  );
}
