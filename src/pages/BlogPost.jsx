import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getBlogs } from '../api/blogs';

const BASE = 'http://127.0.0.1:8000';

/* ─── Category config ─────────────────────────────────────── */
const CAT_CONFIG = {
  announcement:      { name: 'Announcement',   emoji: '📣' },
  travelblog:        { name: 'Travel Blog',     emoji: '✈️' },
  business:          { name: 'Business Trips',  emoji: '💼' },
  'product-updates': { name: 'Product Updates', emoji: '📦' },
};

/* Slug → category_name string — no IDs needed */
const SLUG_TO_CAT_NAME = {
  announcement:      'Announcement',
  travelblog:        'Travel Blog',
  business:          'Business Trips',
  'product-updates': 'Product Updates',
};

/* ─── Helpers ─────────────────────────────────────────────── */
const resolveImgFromObj = (imgObj) => {
  if (!imgObj?.url) return null;
  return imgObj.url.startsWith('http') ? imgObj.url : `${BASE}/storage/${imgObj.url}`;
};

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

/* ─── Skeleton ────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="min-h-screen bg-[#f8faf9]" style={{ paddingTop: 'var(--header-h, 75px)' }}>
      <div className="h-72 bg-slate-200 animate-pulse" />
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="h-4 w-32 bg-slate-200 rounded-full mb-4 animate-pulse" />
        <div className="h-8 w-3/4 bg-slate-200 rounded mb-3 animate-pulse" />
        <div className="h-4 w-full bg-slate-200 rounded mb-2 animate-pulse" />
        <div className="h-4 w-5/6 bg-slate-200 rounded mb-2 animate-pulse" />
        <div className="h-4 w-4/5 bg-slate-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────── */
export default function BlogPost() {
  const { category, id } = useParams();
  const navigate          = useNavigate();
  const cfg               = CAT_CONFIG[category];

  const [post,         setPost]         = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [activeImg,    setActiveImg]    = useState(0);
  const [viewerOpen,   setViewerOpen]   = useState(false);
  const [viewerIndex,  setViewerIndex]  = useState(0);

  const images  = Array.isArray(post?.images) ? post.images : [];
  const mainImg = images[activeImg] ? resolveImgFromObj(images[activeImg]) : null;

  useEffect(() => {
    if (!cfg) navigate('/blog', { replace: true });
  }, [cfg, navigate]);

  useEffect(() => {
    if (!cfg || !id) return;
    let mounted = true;
    setLoading(true);
    setError(null);
    setActiveImg(0);

    api.get(`/blogs/${id}`)
      .then((res) => {
        if (!mounted) return;
        const data = res?.data ?? res;
        const p = data?.data ?? data?.blog ?? data;
        setPost(p);
        return getBlogs();
      })
      .then((rows) => {
        if (!mounted || !rows) return;
        const all = Array.isArray(rows) ? rows : [];

        // Match by category_name string — no hardcoded IDs
        const targetCatName = SLUG_TO_CAT_NAME[category] ?? '';
        const related = all
          .filter((p) => {
            const pCatName = p.category?.category_name ?? p.category_name ?? '';
            return pCatName.toLowerCase() === targetCatName.toLowerCase()
              && String(p.blog_id) !== String(id);
          })
          .slice(0, 3);

        setRelatedPosts(related);
      })
      .catch((err) => {
        if (mounted) setError(err?.message || err?.response?.data?.message || 'Failed to load post.');
      })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [id, category, cfg]);

  // Viewer keyboard navigation and helpers
  const closeViewer = () => setViewerOpen(false);
  const prevImage = () => {
    const len = images.length;
    if (len === 0) return;
    setViewerIndex((idx) => (idx - 1 + len) % len);
    setActiveImg((idx) => (idx - 1 + len) % len);
  };
  const nextImage = () => {
    const len = images.length;
    if (len === 0) return;
    setViewerIndex((idx) => (idx + 1) % len);
    setActiveImg((idx) => (idx + 1) % len);
  };

  useEffect(() => {
    if (!viewerOpen) return undefined;
    const handler = (e) => {
      if (e.key === 'Escape') closeViewer();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [viewerOpen, images.length]);

  if (loading) return <Skeleton />;

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#f8faf9]" style={{ paddingTop: 'var(--header-h, 75px)' }}>
        <div className="container mx-auto px-4 py-32 text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-[#1a2e22] mb-3">Post not found</h2>
          <p className="text-slate-500 mb-6 text-sm">{error}</p>
          <Link to={`/blog/${category}`} className="inline-block px-6 py-2.5 bg-[#4d7b65] text-white rounded-xl text-sm font-bold no-underline">
            ← Back to {cfg?.name ?? 'Blog'}
          </Link>
        </div>
      </div>
    );
  }

  const catName = post.category?.category_name ?? cfg?.name ?? '';

  return (
    <div className="min-h-screen bg-[#f8faf9]" style={{ paddingTop: 'var(--header-h, 75px)' }}>

      {/* ── Hero Image ── */}
      {mainImg ? (
            <div className="relative overflow-hidden bg-[#1a2e22]" style={{ height: 100 }}>
              <img
                src={mainImg}
                alt={post.blog_title}
                className="w-full h-full object-cover opacity-50 blur-sm cursor-pointer"
                onClick={() => { setViewerIndex(activeImg); setViewerOpen(true); }}
              />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a2e22]/80 via-transparent to-transparent" />
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold border border-white/30">
              <span>{cfg?.emoji}</span> {catName}
            </span>
          </div>
        </div>
      ) : (
        <div style={{ height: 24 }} />
      )}

      {/* ── Breadcrumb ── */}
      <div className="bg-[#f8faf9] border-b border-[#e8f0eb] py-3">
        <div className="container mx-auto px-4 flex items-center gap-2 py-3 text-xs text-[#6b7c70] flex-wrap">
          <Link to="/" className="text-[#4d7b65] no-underline hover:underline">Home</Link>
          <span className="text-gray-300">›</span>
          <Link to="/blog" className="text-[#4d7b65] no-underline hover:underline">Blog</Link>
          <span className="text-gray-300">›</span>
          <Link to={`/blog/${category}`} className="text-[#4d7b65] no-underline hover:underline">{cfg?.name}</Link>
          <span className="text-gray-300">›</span>
          <span className="truncate max-w-[200px]">{post.blog_title}</span>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="container mx-auto px-4 py-10 max-w-3xl">

        {/* Meta */}
        <div className="flex items-center gap-3 flex-wrap mb-4 py-5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#f0faf5] text-[#4d7b65] border border-[#c6e8d6]">
            {cfg?.emoji} {catName}
          </span>
          {post.status && (
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize border
              ${post.status === 'published'
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
              {post.status}
            </span>
          )}
          {post.created_at && (
            <span className="text-xs text-slate-400">📅 {fmtDate(post.created_at)}</span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-[#1a2e22] leading-snug mb-6" style={{ fontFamily: "'Georgia', serif" }}>
          {post.blog_title}
        </h1>

        {/* Thumbnail strip */}
            {images.length > 1 && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {images.map((img, i) => {
              const src = resolveImgFromObj(img);
              return src ? (
                <button
                  key={img.id ?? i}
                  onClick={() => { setActiveImg(i); setViewerIndex(i); setViewerOpen(true); }}
                  className={`w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer p-0
                    ${i === activeImg ? 'border-[#4d7b65]' : 'border-slate-200 hover:border-[#4d7b65]'}`}
                >
                  <img src={src} alt={`img-${i}`} className="w-full h-full object-cover" />
                </button>
              ) : null;
            })}
          </div>
        )}

        <hr className="border-[#e8f0eb] mb-7" />

        {/* Body text */}
        <div className="prose prose-slate max-w-none">
          {post.blog_text ? (
            <p className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-wrap">
              {post.blog_text}
            </p>
          ) : (
            <p className="text-slate-400 italic text-sm">No content available for this post.</p>
          )}
        </div>

        {/* Single image */}
        {images.length === 1 && mainImg && (
          <div className="mt-8">
            <img src={mainImg} alt={post.blog_title} className="w-full rounded-2xl border border-[#e8f0eb] object-cover max-h-[400px]" />
          </div>
        )}

        {/* Multi-image gallery */}
        {images.length > 1 && (
          <div className="mt-8">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-3">Gallery</div>
            <div className="grid grid-cols-2 gap-3">
              {images.map((img, i) => {
                const src = resolveImgFromObj(img);
                return src ? (
                  <img
                    key={img.id ?? i}
                    src={src}
                    alt={img.alt_text ?? `image-${i}`}
                    className="w-full h-48 object-cover rounded-xl border border-[#e8f0eb] cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => { setActiveImg(i); setViewerIndex(i); setViewerOpen(true); }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-10 pt-6 border-t border-[#e8f0eb] flex items-center gap-3 flex-wrap py-5">
          <Link to={`/blog/${category}`} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-[1.5px] border-[#c0ddd0] bg-white text-[#4d7b65] text-sm font-bold no-underline hover:bg-[#f0f7f3] transition-colors">
            ← All {cfg?.name}
          </Link>
          <Link to="/blog" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4d7b65] text-white text-sm font-bold no-underline hover:bg-[#3d6552] transition-colors">
            All Blogs
          </Link>
        </div>
      </div>

        {/* ── Image Viewer Modal ── */}
        {viewerOpen && images.length > 0 && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={closeViewer}
          >
            <div className="relative max-w-[90vw] max-h-[90vh] w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <button onClick={closeViewer} className="absolute top-3 right-3 text-white bg-black/40 rounded-full w-9 h-9 flex items-center justify-center text-xl">×</button>

              <button onClick={prevImage} className="absolute left-3 text-white text-3xl px-3 py-2 select-none">‹</button>

              <div className="max-w-full max-h-full flex items-center justify-center">
                <img
                  src={resolveImgFromObj(images[viewerIndex])}
                  alt={post?.blog_title}
                  className="max-h-[80vh] max-w-[90vw] object-contain rounded"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>

              <button onClick={nextImage} className="absolute right-3 text-white text-3xl px-3 py-2 select-none">›</button>
            </div>
          </div>
        )}

        {/* ── Related Posts ── */}
      {relatedPosts.length > 0 && (
        <section className="bg-white border-t border-[#e8f0eb] py-12">
          <div className="container mx-auto px-4 max-w-5xl">
            <p className="text-[11px] font-bold tracking-[2px] text-[#4d7b65] uppercase mb-2">More from {cfg?.name}</p>
            <h2 className="text-xl font-bold text-[#1a2e22] mb-7" style={{ fontFamily: "'Georgia', serif" }}>
              You May Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {relatedPosts.map((p) => {
                const thumb = Array.isArray(p.images) && p.images[0] ? resolveImgFromObj(p.images[0]) : null;
                return (
                  <Link key={p.blog_id} to={`/blog/${category}/${p.blog_id}`} className="bg-[#f8faf9] rounded-2xl border border-[#e8f0eb] overflow-hidden no-underline group hover:border-[#4d7b65] hover:shadow-sm transition-all">
                    <div className="h-36 bg-[#e8f0eb] overflow-hidden">
                      {thumb ? (
                        <img src={thumb} alt={p.blog_title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">📄</div>
                      )}
                    </div>
                    <div className="p-4">
                      {p.created_at && <div className="text-[10px] text-slate-400 mb-1">{fmtDate(p.created_at)}</div>}
                      <div className="text-sm font-bold text-[#1a2e22] leading-snug line-clamp-2 group-hover:text-[#4d7b65] transition-colors" style={{ fontFamily: "'Georgia', serif" }}>
                        {p.blog_title}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}