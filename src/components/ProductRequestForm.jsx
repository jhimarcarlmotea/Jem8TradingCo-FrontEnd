import { useEffect, useRef, useState } from "react";
import axios from "axios";

const API_BASE = (
  typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_API_BASE || import.meta.env.REACT_APP_API_BASE)
    : undefined
) || window.REACT_APP_API_BASE || "http://127.0.0.1:8000";

function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function ProductRequestForm({ products: clientProducts = [] }) {
  const [productAvailable, setProductAvailable] = useState(false); // default No
  const [productQuery, setProductQuery] = useState("");
  const debouncedQuery = useDebounced(productQuery, 300);
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState(null);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const fileInputRef = useRef(null);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try { console.log('ProductRequestForm: mounted'); } catch (e) {}
  }, []);

  // click outside to close suggestions
  useEffect(() => {
    const onDocClick = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) && inputRef.current && !inputRef.current.contains(e.target)) {
        setProducts([]);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // focus input when switching to "Yes"
  useEffect(() => {
    if (productAvailable && inputRef.current) {
      try { inputRef.current.focus(); } catch (e) {}
    }
  }, [productAvailable]);

  // Fetch products when searchable and query changes
  useEffect(() => {
    let cancelled = false;
    if (!productAvailable || !debouncedQuery) {
      setProducts([]);
      return;
    }

    // If the parent passed a client-side products list, use it instead of hitting the API.
    if (Array.isArray(clientProducts) && clientProducts.length > 0) {
      const q = debouncedQuery.toLowerCase();
      const matched = clientProducts.filter(p => {
        const name = (p.product_name ?? p.name ?? "").toLowerCase();
        return name.includes(q);
      });
      if (!cancelled) setProducts(matched);
      return () => { cancelled = true; };
    }

    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/products/search`, { params: { query: debouncedQuery } });
        const fetched = res.data?.data || res.data || [];
        console.debug('ProductRequestForm: fetched products', fetched);
        if (!cancelled) setProducts(fetched);
      } catch (err) {
        if (!cancelled) setProducts([]);
        console.debug('ProductRequestForm: product fetch error', err?.response || err.message || err);
      }
    })();

    return () => { cancelled = true; };
  }, [debouncedQuery, productAvailable, clientProducts]);

  // cleanup preview object URL
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const allowedTypes = ['image/jpeg','image/jpg','image/png','application/pdf'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  const handleFile = (e) => {
    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setFieldErrors((s) => ({ ...s, image: undefined }));
    setErrorMessage(null);
    if (!f) {
      setFile(null); setPreview(null); return;
    }
    if (!allowedTypes.includes(f.type)) {
      setFieldErrors((s) => ({ ...s, image: ['Invalid file type. Allowed: jpg,jpeg,png,pdf'] }));
      setFile(null); setPreview(null); return;
    }
    if (f.size > maxSize) {
      setFieldErrors((s) => ({ ...s, image: ['File too large (max 5MB)'] }));
      setFile(null); setPreview(null); return;
    }
    setFile(f);
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const validate = () => {
    const errs = {};
    if (!productAvailable) {
      if (!productName || !productName.trim()) errs.productName = ['Product name is required when product is not available.'];
    } else {
      if (!productId) errs.productId = ['Please select a product.'];
    }
    if (!productAvailable && file && !allowedTypes.includes(file.type)) errs.image = ['Invalid file type.'];
    if (file && file.size > maxSize) errs.image = ['File too large (max 5MB)'];
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.debug('ProductRequestForm: submit');
    console.debug('ProductRequestForm: state before submit', {
      productAvailable,
      productQuery,
      productId,
      productName,
      description,
      file: file ? { name: file.name, type: file.type, size: file.size } : null,
    });
    setErrorMessage(null); setSuccessMessage(null); setFieldErrors({});

    // Try to auto-resolve productId when user selected "Yes" but didn't pick a suggestion.
    // Use a local `resolvedId` so we can validate synchronously without waiting for state updates.
    let resolvedId = null;
    if (productAvailable && !productId && productQuery && productQuery.trim()) {
      try {
        if (Array.isArray(clientProducts) && clientProducts.length > 0) {
          const q = productQuery.trim().toLowerCase();
          const matches = clientProducts.filter(p => {
            const name = (p.product_name ?? p.name ?? p.title ?? '').toString().toLowerCase();
            return name === q || name.includes(q);
          });
          if (matches.length === 1) {
            resolvedId = matches[0].id ?? matches[0].product_id ?? matches[0].productId ?? null;
            console.debug('ProductRequestForm: auto-resolved productId from clientProducts', resolvedId);
          }
        }
        if (!resolvedId) {
          try {
            const q = (productQuery || '').toString().trim();
            if (q) {
              // Try primary expected param name `query` first
              try {
                const res = await axios.get(`${API_BASE}/api/products/search`, { params: { query: q } });
                const fetched = res.data?.data || res.data || [];
                if (Array.isArray(fetched) && fetched.length > 0) {
                  resolvedId = fetched[0]?.id ?? fetched[0]?.product_id ?? fetched[0]?.productId ?? null;
                  console.debug('ProductRequestForm: auto-resolved productId from API (query)', resolvedId);
                }
              } catch (firstErr) {
                const resp = firstErr?.response;
                console.debug('ProductRequestForm: auto-resolve API first attempt error', resp || firstErr?.message || firstErr);
                // If backend complains about missing query param, retry with alternate param key `q`.
                if (resp && resp.status === 400 && typeof resp.data?.message === 'string' && resp.data.message.toLowerCase().includes('query')) {
                  try {
                    const res2 = await axios.get(`${API_BASE}/api/products/search`, { params: { q } });
                    const fetched2 = res2.data?.data || res2.data || [];
                    if (Array.isArray(fetched2) && fetched2.length > 0) {
                      resolvedId = fetched2[0]?.id ?? fetched2[0]?.product_id ?? fetched2[0]?.productId ?? null;
                      console.debug('ProductRequestForm: auto-resolved productId from API (q)', resolvedId);
                    }
                  } catch (secondErr) {
                    console.debug('ProductRequestForm: auto-resolve API second attempt error', secondErr?.response || secondErr?.message || secondErr);
                  }
                }
              }
            } else {
              console.debug('ProductRequestForm: empty query — skipping API auto-resolve');
            }
          } catch (apiErr) {
            console.debug('ProductRequestForm: auto-resolve unexpected error', apiErr?.response || apiErr.message || apiErr);
          }
        }
      } catch (autoErr) {
        console.debug('ProductRequestForm: auto-resolve error', autoErr?.response || autoErr.message || autoErr);
      }
    }

    // If we resolved an id, set state (best-effort) and use it for validation immediately.
    if (resolvedId) setProductId(resolvedId);

    // Validate using resolvedId as fallback to productId state.
    const finalProductId = productId ?? resolvedId ?? null;
    const errs = {};
    if (!productAvailable) {
      if (!productName || !productName.trim()) errs.productName = ['Product name is required when product is not available.'];
    } else {
      if (!finalProductId) errs.productId = ['Please select a product.'];
    }
    if (!productAvailable && file && !allowedTypes.includes(file.type)) errs.image = ['Invalid file type.'];
    if (file && file.size > maxSize) errs.image = ['File too large (max 5MB)'];
    if (Object.keys(errs).length) {
      console.debug('ProductRequestForm: validation errors', errs);
      setFieldErrors(errs);
      return;
    }

    const fd = new FormData();
    fd.append('product_available', productAvailable ? '1' : '0');
    // include initial status for backend/admin review
    fd.append('status', 'pending');
    if (productAvailable && productId) fd.append('product_id', productId);
    if (!productAvailable) fd.append('product_name', productName);
    if (description) fd.append('description', description);
    if (file) fd.append('image', file);
    // Log FormData entries (for debugging only)
    try {
      const entries = {};
      for (const pair of fd.entries()) {
        const [k, v] = pair;
        entries[k] = v instanceof File ? { name: v.name, type: v.type, size: v.size } : v;
      }
      console.debug('ProductRequestForm: FormData', entries);
    } catch (logErr) {
      console.debug('ProductRequestForm: FormData logging failed', logErr);
    }

    try {
      setSending(true); setUploadProgress(0);
      const res = await axios.post(`${API_BASE}/api/product-requests`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (p) => {
          if (p.total) {
            const pct = Math.round((p.loaded * 100) / p.total);
            setUploadProgress(pct);
            console.debug('ProductRequestForm: upload progress', { loaded: p.loaded, total: p.total, pct });
          }
        }
      });
      console.debug('ProductRequestForm: submit response', res?.data ?? res);
      setSuccessMessage('Request submitted successfully.');
      setProductAvailable(false);
      setProductQuery(''); setProducts([]); setProductId(null);
      setProductName(''); setDescription(''); setFile(null); setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
    } catch (err) {
      console.error('ProductRequestForm: submit error', err);
      const resp = err.response?.data;
      if (resp) {
        console.debug('ProductRequestForm: error response data', resp);
        if (resp.errors) setFieldErrors(resp.errors);
        if (resp.message) setErrorMessage(resp.message);
        else setErrorMessage('Server returned an error.');
      } else {
        setErrorMessage('Server error. Please try again.');
      }
    } finally {
      setSending(false);
      setTimeout(() => setUploadProgress(0), 800);
    }
  };

  return (
    <div className="bg-white border border-[#e8f0eb] rounded-2xl p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <div className="text-xs font-semibold text-[#374151]">Is the product available?</div>
          <div role="radiogroup" aria-label="Product available" className="flex gap-2 mt-2">
            <label className={`inline-flex items-center gap-2 px-3 py-2 border rounded-xl cursor-pointer ${!productAvailable ? 'bg-[#4d7b65] text-white' : 'bg-[#fafcfb]'}`}>
              <input type="radio" name="product_available" value="0" checked={!productAvailable} onChange={() => setProductAvailable(false)} className="sr-only" aria-checked={!productAvailable} />
              <span className="text-sm">No</span>
            </label>
            <label className={`inline-flex items-center gap-2 px-3 py-2 border rounded-xl cursor-pointer ${productAvailable ? 'bg-[#4d7b65] text-white' : 'bg-[#fafcfb]'}`}>
              <input type="radio" name="product_available" value="1" checked={productAvailable} onChange={() => setProductAvailable(true)} className="sr-only" aria-checked={productAvailable} />
              <span className="text-sm">Yes</span>
            </label>
          </div>
        </div>

        {productAvailable ? (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[#374151]">Search product</label>
            <div className="relative">
              <input
              type="search"
              placeholder="Search products..."
              value={productQuery}
              onChange={(e) => { setProductQuery(e.target.value); setProductId(null); setHighlightIndex(-1); }}
              onKeyDown={(e) => {
                if (!products || products.length === 0) return;
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlightIndex((i) => Math.min((i < 0 ? -1 : i) + 1, products.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlightIndex((i) => Math.max(i - 1, 0));
                } else if (e.key === 'Enter') {
                  if (highlightIndex >= 0 && products[highlightIndex]) {
                    const p = products[highlightIndex];
                    setProductId(p.id);
                    setProductQuery(p.name);
                    setProducts([]);
                    setHighlightIndex(-1);
                  }
                } else if (e.key === 'Escape') {
                  setProducts([]);
                  setHighlightIndex(-1);
                }
              }}
              ref={inputRef}
              className="w-full px-3.5 py-2.5 border rounded-xl bg-[#fafcfb]"
              aria-label="Search products"
              aria-autocomplete="list"
              aria-expanded={products.length > 0}
              aria-controls="product-suggestions"
            />
            {products.length > 0 && (
              <ul
                id="product-suggestions"
                role="listbox"
                ref={suggestionsRef}
                className="absolute left-0 right-0 mt-2 w-full z-50 bg-white border rounded-md shadow-lg max-h-44 overflow-auto"
              >
                {products.map((p, idx) => {
                  const displayName = (p.product_name || p.name || p.title || p.product_title || p.sku || `Product ${p.id || ''}`).toString();
                  return (
                    <li
                      id={`prod-sugg-${p.id}`}
                      key={p.id ?? idx}
                      role="option"
                      aria-selected={highlightIndex === idx}
                      className={`px-3 py-2 cursor-pointer ${highlightIndex === idx ? 'bg-[#e6f6ee]' : 'hover:bg-[#f3f8f5]'}`}
                      onMouseEnter={() => setHighlightIndex(idx)}
                      onMouseLeave={() => setHighlightIndex(-1)}
                      onClick={() => { setProductId(p.id); setProductQuery(displayName); setProducts([]); setHighlightIndex(-1); }}
                    >
                      <div className="text-sm font-medium text-[#1e293b]">{displayName}</div>
                      <div className="text-xs text-[#64748b]">{p.sku || ''}</div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
            {fieldErrors?.product_id && <div className="text-sm text-red-600">{fieldErrors.product_id[0]}</div>}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[#374151]">Product Name *</label>
            <input value={productName} onChange={(e) => setProductName(e.target.value)} className="px-3.5 py-2.5 border rounded-xl bg-[#fafcfb]" aria-invalid={!!fieldErrors.productName} />
            {fieldErrors?.productName && <div className="text-sm text-red-600">{fieldErrors.productName[0]}</div>}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#374151]">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="px-3.5 py-2.5 border rounded-xl bg-[#fafcfb]" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#374151]">Image / Attachment</label>
          <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFile} className="px-3.5 py-2.5" />
          {fieldErrors?.image && <div className="text-sm text-red-600">{fieldErrors.image[0]}</div>}
          {preview ? (
            <div className="mt-2 flex items-center gap-3">
              <img src={preview} alt="preview" className="w-24 h-24 object-cover rounded-md border" />
              <div className="text-sm text-[#374151]">{file?.name}<div className="text-xs text-[#6b7c70]">{(file?.size/1024/1024).toFixed(2)} MB</div></div>
            </div>
          ) : file ? (
            <div className="mt-2 text-sm text-[#374151]">{file.name} <div className="text-xs text-[#6b7c70]">{(file.size/1024/1024).toFixed(2)} MB</div></div>
          ) : null}
        </div>

        {uploadProgress > 0 && (
          <div className="w-full bg-[#f0f4f1] rounded-full h-2">
            <div className="h-2 rounded-full bg-[#4d7b65]" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}

        {errorMessage && <div className="px-3 py-2 text-sm text-red-700 bg-red-50 rounded">{errorMessage}</div>}
        {successMessage && <div className="px-3 py-2 text-sm text-green-700 bg-green-50 rounded">{successMessage}</div>}

        <div>
          <button
            type="submit"
            disabled={sending}
            onClick={() => { try { console.log('ProductRequestForm: submit button clicked'); } catch (e) {} }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white ${sending ? 'bg-gray-400' : 'bg-[#2d5a3d]'}`}
          >
            {sending ? 'Uploading…' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
