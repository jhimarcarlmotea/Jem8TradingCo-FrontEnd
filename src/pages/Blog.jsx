import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBlogs } from '../api/blogs';

const BASE = 'http://127.0.0.1:8000';

/* ─────────────────────────────────────────────
   Inject shimmer keyframes (matches blog.css exactly)
───────────────────────────────────────────── */
if (typeof document !== 'undefined' && !document.getElementById('blog-shimmer-kf')) {
  const s = document.createElement('style');
  s.id = 'blog-shimmer-kf';
  s.textContent = `
    @keyframes blog-shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position:  600px 0; }
    }
    .blog-shimmer {
      background-image: linear-gradient(90deg, #e8e8e8 25%, #f4f4f4 50%, #e8e8e8 75%);
      background-size: 600px 100%;
      animation: blog-shimmer 1.5s infinite linear;
      display: block;
      border-radius: 6px;
    }
  `;
  document.head.appendChild(s);
}

/* Shimmer block — pass w/h as style, optional className for border-radius overrides */
const Sh = ({ w, h, r, className = '', style = {} }) => (
  <span
    className={`blog-shimmer ${className}`}
    style={{ width: w, height: h, borderRadius: r, ...style }}
  />
);

/* ─────────────────────────────────────────────
   .blog__no-post-badge
───────────────────────────────────────────── */
const NoPostBadge = ({ text = 'No post yet' }) => (
  <div
    style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontWeight: 600,
      fontSize: 13,
      color: 'rgba(255,255,255,0.6)',
      background: 'rgba(0,0,0,0.22)',
      border: '1px solid rgba(255,255,255,0.22)',
      borderRadius: 999,
      padding: '7px 22px',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      letterSpacing: '0.3px',
    }}
  >
    {text}
  </div>
);

/* ─────────────────────────────────────────────
   .blog__featured-main  (empty / loading)
───────────────────────────────────────────── */
const FeaturedMainEmpty = () => (
  <div
    style={{
      borderRadius: 20,
      overflow: 'hidden',
      height: 380,
      background: 'linear-gradient(160deg, #d5d5d5 20%, #6f6f6f 100%)',
      position: 'relative',
      display: 'flex',
      alignItems: 'flex-end',
    }}
  >
    <div style={{ padding: '28px 32px', width: '100%' }}>
      <Sh w={80} h={10} style={{ marginBottom: 12, opacity: 0.4 }} />
      <Sh w="70%" h={22} style={{ marginBottom: 10, opacity: 0.4 }} />
      <Sh w="45%" h={10} style={{ opacity: 0.3 }} />
    </div>
    <NoPostBadge text="No featured post yet" />
  </div>
);

/* ─────────────────────────────────────────────
   .blog__featured-sidebar  (empty / loading)
───────────────────────────────────────────── */
const SidebarEmpty = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          background: 'var(--light-gray, #f5f5f5)',
          border: '1px solid var(--border, #e5e5e5)',
          borderRadius: 14,
          padding: '12px 14px',
          minHeight: 110,
        }}
      >
        {/* .blog__sidebar-thumb */}
        <Sh w={90} h={80} r={10} style={{ flexShrink: 0 }} />
        {/* .blog__sidebar-info */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Sh w="45%" h={9} />
          <Sh w="85%" h={12} />
          <Sh w="40%" h={8} />
        </div>
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────────
   .blog__latest  (dark card — inner skeleton only)
───────────────────────────────────────────── */
const LatestInnerEmpty = () => (
  <>
    <Sh w="68%" h={24} style={{ marginBottom: 14, opacity: 0.18 }} />
    <Sh w="92%" h={11} style={{ marginBottom: 6, opacity: 0.12 }} />
    <Sh w="70%" h={11} style={{ marginBottom: 28, opacity: 0.12 }} />
    {/* .blog__latest-btn-ghost */}
    <Sh w={110} h={34} r={10} style={{ opacity: 0.15 }} />
  </>
);

/* ─────────────────────────────────────────────
   .blog__ann-grid  (2×2 empty)
───────────────────────────────────────────── */
const AnnouncementsEmpty = () => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 20,
    }}
  >
    {[1, 2, 3, 4].map((i) => (
      <div
        key={i}
        style={{
          borderRadius: 14,
          padding: '32px 24px',
          background: 'var(--light-gray, #f5f5f5)',
          border: '1px solid var(--border, #e5e5e5)',
          minHeight: 200,
        }}
      >
        <Sh w={70} h={9} style={{ marginBottom: 14 }} />
        <Sh w="85%" h={15} style={{ marginBottom: 8 }} />
        <Sh w="100%" h={10} style={{ marginBottom: 5 }} />
        <Sh w="75%" h={10} style={{ marginBottom: 22 }} />
        <Sh w={90} h={9} />
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────────
   .blog__two-col  (two tall hero cards)
───────────────────────────────────────────── */
const HeroCardsEmpty = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 24, marginBottom: 28 }}>
    {[1, 2].map((i) => (
      <div
        key={i}
        style={{
          height: 340,
          borderRadius: 20,
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #d5d5d5 20%, #6f6f6f 100%)',
          display: 'flex',
          alignItems: 'flex-end',
          position: 'relative',
        }}
      >
        <div style={{ padding: '24px 28px', width: '100%' }}>
          <Sh w={60} h={9} style={{ marginBottom: 10, opacity: 0.35 }} />
          <Sh w="75%" h={18} style={{ marginBottom: 8, opacity: 0.35 }} />
          <Sh w="50%" h={9} style={{ opacity: 0.25 }} />
        </div>
        <NoPostBadge />
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────────
   .blog__card-grid  (3-col post cards)
───────────────────────────────────────────── */
const PostCardsEmpty = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        style={{
          background: '#fff',
          borderRadius: 14,
          overflow: 'hidden',
          border: '1px solid var(--border, #e5e5e5)',
          boxShadow: 'var(--shadow-sm, 0 1px 4px rgba(0,0,0,0.06))',
        }}
      >
        {/* .blog__post-card-img */}
        <Sh w="100%" h={180} r={0} />
        {/* .blog__post-card-body */}
        <div style={{ padding: '18px 20px 22px' }}>
          <Sh w="65%" h={13} style={{ marginBottom: 10 }} />
          <Sh w="100%" h={10} style={{ marginBottom: 5 }} />
          <Sh w="80%" h={10} style={{ marginBottom: 16 }} />
          <Sh w={80} h={9} />
        </div>
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────────
   .blog__product-list  (rows + overlay)
───────────────────────────────────────────── */
const ProductRowsEmpty = () => (
  <div
    style={{
      background: '#fff',
      border: '1px solid var(--border, #e5e5e5)',
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 28,
      position: 'relative',
    }}
  >
    {[1, 2, 3, 4].map((item, i, arr) => (
      <React.Fragment key={item}>
        {/* .blog__product-row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            padding: '20px 24px',
            opacity: 0.3,
          }}
        >
          <Sh w={88} h={88} r={10} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Sh w={100} h={9} style={{ marginBottom: 8 }} />
            <Sh w="70%" h={13} style={{ marginBottom: 8 }} />
            <Sh w="90%" h={10} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0, minWidth: 90 }}>
            <Sh w={48} h={22} r={20} />
            <Sh w={80} h={9} />
          </div>
        </div>
        {/* .blog__product-divider */}
        {i < arr.length - 1 && (
          <div style={{ height: 1, background: 'var(--border, #e5e5e5)', margin: '0 24px' }} />
        )}
      </React.Fragment>
    ))}
    {/* .blog__product-overlay */}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        pointerEvents: 'none',
      }}
    >
      <span style={{ fontSize: 36, opacity: 0.55, marginBottom: 4 }}>📦</span>
      <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--dark, #111)', margin: 0 }}>
        No product updates yet
      </p>
      <p style={{ fontSize: 13, color: 'var(--gray, #888)', margin: 0 }}>
        Content will appear here once the admin adds posts.
      </p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const resolveImg = (post) => {
  if (!post) return null;
  const imgs = post.images;
  if (Array.isArray(imgs) && imgs.length > 0) {
    const path = imgs[0];
    return path.startsWith('http') ? path : `${BASE}/storage/${path}`;
  }
  return null;
};

const getCategoryName = (post) => {
  if (!post) return 'Uncategorized';
  if (post.category?.category_name) return post.category.category_name;
  const idMap = { 1: 'Announcement', 2: 'Travel Blog', 3: 'Business Trips', 4: 'Product Updates' };
  return idMap[post.category_blog_id] ?? 'Uncategorized';
};

const excerpt = (text, n = 140) =>
  text ? (text.length > n ? text.slice(0, n).trim() + '…' : text) : '';

/* ─────────────────────────────────────────────
   Shared dark card wrapper (.blog__latest style)
───────────────────────────────────────────── */
const DarkCard = ({ children }) => (
  <div
    style={{
      background: 'var(--dark, #111)',
      borderRadius: 20,
      padding: 'clamp(24px, 3vw, 36px)',
      marginBottom: 28,
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {/* radial glow — .blog__latest::before */}
    <div
      style={{
        content: '',
        position: 'absolute',
        top: -80,
        right: -80,
        width: 280,
        height: 280,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(77,123,101,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}
    />
    {children}
  </div>
);

/* ─────────────────────────────────────────────
   Blog Page
───────────────────────────────────────────── */
const Blog = () => {
  const [activeFilter, setActiveFilter] = useState('home');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refs = {
    announcement: useRef(null),
    travel:       useRef(null),
    business:     useRef(null),
    product:      useRef(null),
  };

  const handleFilter = (key) => {
    setActiveFilter(key);
    if (key === 'home') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const ref = refs[key];
    if (ref?.current) {
      const top = ref.current.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const filters = [
    { key: 'home',         label: 'Home' },
    { key: 'announcement', label: 'Announcement' },
    { key: 'travel',       label: 'Travel Blog' },
    { key: 'business',     label: 'Business Trips' },
    { key: 'product',      label: 'Product Updates' },
  ];

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const data = await getBlogs();
        if (!mounted) return;
        const rows = Array.isArray(data) ? data : (data?.data ?? data?.posts ?? []);
        setPosts(rows.filter((p) => p.status === 'published' || true));
      } catch (err) {
        if (mounted) setError(err?.message || 'Failed to load posts');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const published      = posts.filter((p) => (p.status ?? 'published') === 'published');
  const featuredPost   = published[0] ?? null;
  const sidebarPosts   = published.slice(1, 4);
  const announcements  = posts.filter((p) => getCategoryName(p) === 'Announcement');
  const travel         = posts.filter((p) => getCategoryName(p) === 'Travel Blog');
  const business       = posts.filter((p) => getCategoryName(p) === 'Business Trips');
  const productUpdates = posts.filter((p) => getCategoryName(p) === 'Product Updates');

  /* ── shared inline styles that match CSS vars ── */
  const sectionLabel = {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--green)',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    marginBottom: 10,
  };

  const sectionRule = {
    border: 'none',
    borderTop: '1px solid var(--border, #e5e5e5)',
    margin: '0 0 28px',
  };

  const annCard = {
    borderRadius: 14,
    padding: 'clamp(20px, 2.5vw, 32px) clamp(16px, 2vw, 24px)',
    background: 'var(--light-gray, #f5f5f5)',
    border: '1px solid var(--border, #e5e5e5)',
    minHeight: 200,
    transition: 'border-color .18s, box-shadow .18s',
  };

  const postCard = {
    background: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    border: '1px solid var(--border, #e5e5e5)',
    boxShadow: 'var(--shadow-sm, 0 1px 4px rgba(0,0,0,0.06))',
    transition: 'box-shadow .2s, transform .2s, border-color .2s',
  };

  const heroCard = {
    height: 340,
    borderRadius: 20,
    overflow: 'hidden',
    background: 'linear-gradient(160deg, #d5d5d5 20%, #6f6f6f 100%)',
    display: 'flex',
    alignItems: 'flex-end',
    position: 'relative',
  };

  return (
    /* .blog-page */
    <div style={{ background: '#fff', paddingTop: 'var(--header-h)', minHeight: '100vh' }}>

      {/* ── PAGE HEADER (.blog-page__top) ── */}
      <div className="container" style={{ paddingTop: 'clamp(28px,4vw,48px)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px,3vw,40px)', fontWeight: 700, color: 'var(--dark)', lineHeight: 1.15, opacity: 0.5, margin: 0 }}>
          Blogs
        </h1>
        {/* .blog-page__filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingBottom: 24 }}>
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => handleFilter(f.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '7px 18px',
                height: 34,
                borderRadius: 999,
                border: activeFilter === f.key ? '1px solid var(--dark, #111)' : '1px solid var(--border, #e5e5e5)',
                background: activeFilter === f.key ? 'var(--dark, #111)' : '#fff',
                fontFamily: 'var(--font-sub)',
                fontSize: 13,
                fontWeight: 500,
                color: activeFilter === f.key ? '#fff' : 'var(--dark, #111)',
                cursor: 'pointer',
                transition: 'background .15s, color .15s, border-color .15s',
                whiteSpace: 'nowrap',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── BANNER (.blog-banner) ── */}
      <div className="container">
        <div
          style={{
            background: 'var(--dark, #111)',
            borderRadius: 20,
            padding: 'clamp(20px,3vw,32px) clamp(24px,4vw,52px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
            marginBottom: 'clamp(40px,6vw,64px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* ::before radial glow */}
          <div style={{ position: 'absolute', top: -60, left: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(77,123,101,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <p style={{ fontFamily: 'var(--font-sub)', fontSize: 'clamp(13px,1.3vw,15px)', fontWeight: 500, color: 'rgba(255,255,255,0.78)', lineHeight: 1.7, flex: 1, position: 'relative', margin: 0 }}>
            Your all-in-one supply partner in Metro Manila. Office supplies, pantry essentials,
            janitorial products, wellness, and more — all from one trusted source.
          </p>
          <Link
            to="/about"
            style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', padding: '8px 22px', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 10, color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, background: 'transparent', textDecoration: 'none', whiteSpace: 'nowrap', position: 'relative' }}
          >
            Learn More
          </Link>
        </div>
      </div>

      {/* ── FEATURED ── */}
      <section className="container" style={{ marginBottom: 'clamp(48px,7vw,88px)' }}>
        <p style={sectionLabel}>Featured</p>
        {/* .blog__featured-grid  →  1fr 360px */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>

          {/* Main featured */}
          {loading ? <FeaturedMainEmpty /> : featuredPost ? (
            <div style={{ borderRadius: 20, overflow: 'hidden', height: 380, background: 'linear-gradient(160deg, #d5d5d5 20%, #6f6f6f 100%)', position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
              {resolveImg(featuredPost) && (
                <img src={resolveImg(featuredPost)} alt={featuredPost.blog_title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              <div style={{ position: 'relative', zIndex: 1, padding: '28px 32px', width: '100%' }}>
                <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>{getCategoryName(featuredPost)}</p>
                <h2 style={{ margin: '8px 0 10px', color: '#fff' }}>{featuredPost.blog_title}</h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>{excerpt(featuredPost.blog_text, 200)}</p>
                <Link to={`/blog/${featuredPost.blog_id}`} style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 20px', background: '#fff', color: 'var(--dark,#111)', fontSize: 13, fontWeight: 600, borderRadius: 10, textDecoration: 'none' }}>
                  Read Post
                </Link>
              </div>
            </div>
          ) : <FeaturedMainEmpty />}

          {/* Sidebar */}
          {loading ? <SidebarEmpty /> : (
            /* .blog__featured-sidebar */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sidebarPosts.length === 0 ? <SidebarEmpty /> : sidebarPosts.map((p) => (
                /* .blog__sidebar-item */
                <div key={p.blog_id} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--light-gray,#f5f5f5)', border: '1px solid var(--border,#e5e5e5)', borderRadius: 14, padding: '12px 14px', minHeight: 110, transition: 'border-color .2s, box-shadow .2s' }}>
                  {/* .blog__sidebar-thumb */}
                  <div style={{ width: 90, height: 80, borderRadius: 10, flexShrink: 0, overflow: 'hidden', background: '#ddd' }}>
                    {resolveImg(p) && <img src={resolveImg(p)} alt={p.blog_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  {/* .blog__sidebar-info */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{getCategoryName(p)}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, margin: '4px 0' }}>{p.blog_title}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{excerpt(p.blog_text, 80)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── ANNOUNCEMENTS ── */}
      <section className="container" style={{ marginBottom: 'clamp(48px,7vw,88px)' }} ref={refs.announcement}>
        <p style={sectionLabel}>Announcements</p>
        <hr style={sectionRule} />

        {loading ? (
          <>
            <DarkCard>
              <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 999, padding: '3px 14px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: 1, marginBottom: 16 }}>LATEST</span>
              <LatestInnerEmpty />
            </DarkCard>
            <AnnouncementsEmpty />
          </>
        ) : (
          <>
            {/* .blog__latest */}
            <DarkCard>
              <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 999, padding: '3px 14px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: 1, marginBottom: 16 }}>LATEST</span>
              {announcements[0] ? (
                <>
                  <h3 style={{ margin: '8px 0', color: '#fff' }}>{announcements[0].blog_title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>{excerpt(announcements[0].blog_text, 220)}</p>
                  <Link to={`/blog/${announcements[0].blog_id}`} style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 22px', background: '#fff', color: 'var(--dark,#111)', fontSize: 13, fontWeight: 600, borderRadius: 10, textDecoration: 'none' }}>Read</Link>
                </>
              ) : <LatestInnerEmpty />}
            </DarkCard>

            {/* .blog__ann-grid */}
            {announcements.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20 }}>
                {announcements.slice(0, 4).map((p) => (
                  <div key={p.blog_id} style={annCard}>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>{getCategoryName(p)}</div>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>{p.blog_title}</div>
                    <div style={{ color: '#6B7280', marginBottom: 12 }}>{excerpt(p.blog_text, 120)}</div>
                    <Link to={`/blog/${p.blog_id}`} style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)', textDecoration: 'none' }}>Read</Link>
                  </div>
                ))}
              </div>
            ) : <AnnouncementsEmpty />}
          </>
        )}
      </section>

      {/* ── TRAVEL BLOG ── */}
      <section className="container" style={{ marginBottom: 'clamp(48px,7vw,88px)' }} ref={refs.travel}>
        <p style={sectionLabel}>Travel Blog</p>
        <hr style={sectionRule} />

        {loading || travel.length === 0 ? (
          <><HeroCardsEmpty /><PostCardsEmpty /></>
        ) : (
          <>
            {/* .blog__two-col */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 24, marginBottom: 28 }}>
              {travel.slice(0, 2).map((p) => (
                <div key={p.blog_id} style={heroCard}>
                  {resolveImg(p) && <img src={resolveImg(p)} alt={p.blog_title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                  <div style={{ position: 'relative', zIndex: 1, padding: '24px 28px', width: '100%' }}>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{getCategoryName(p)}</div>
                    <h3 style={{ margin: '8px 0', color: '#fff' }}>{p.blog_title}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{excerpt(p.blog_text, 160)}</p>
                  </div>
                  <Link to={`/blog/${p.blog_id}`} style={{ position: 'absolute', inset: 0, zIndex: 2 }} aria-label={p.blog_title} />
                </div>
              ))}
            </div>
            {/* .blog__card-grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
              {travel.slice(0, 3).map((p) => (
                <div key={p.blog_id} style={postCard}>
                  <div style={{ width: '100%', height: 180, background: '#eee', overflow: 'hidden' }}>
                    {resolveImg(p) && <img src={resolveImg(p)} alt={p.blog_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ padding: '18px 20px 22px' }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{p.blog_title}</div>
                    <div style={{ color: '#6B7280', fontSize: 13, marginBottom: 12 }}>{excerpt(p.blog_text, 100)}</div>
                    <Link to={`/blog/${p.blog_id}`} style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)', textDecoration: 'none' }}>Read</Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── BUSINESS TRIPS ── */}
      <section className="container" style={{ marginBottom: 'clamp(48px,7vw,88px)' }} ref={refs.business}>
        <p style={sectionLabel}>Business Trips</p>
        <hr style={sectionRule} />

        {loading || business.length === 0 ? (
          <><HeroCardsEmpty /><PostCardsEmpty /></>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 24, marginBottom: 28 }}>
              {business.slice(0, 2).map((p) => (
                <div key={p.blog_id} style={heroCard}>
                  {resolveImg(p) && <img src={resolveImg(p)} alt={p.blog_title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                  <div style={{ position: 'relative', zIndex: 1, padding: '24px 28px', width: '100%' }}>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{getCategoryName(p)}</div>
                    <h3 style={{ margin: '8px 0', color: '#fff' }}>{p.blog_title}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{excerpt(p.blog_text, 160)}</p>
                  </div>
                  <Link to={`/blog/${p.blog_id}`} style={{ position: 'absolute', inset: 0, zIndex: 2 }} aria-label={p.blog_title} />
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
              {business.slice(0, 3).map((p) => (
                <div key={p.blog_id} style={postCard}>
                  <div style={{ width: '100%', height: 180, background: '#eee', overflow: 'hidden' }}>
                    {resolveImg(p) && <img src={resolveImg(p)} alt={p.blog_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ padding: '18px 20px 22px' }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{p.blog_title}</div>
                    <div style={{ color: '#6B7280', fontSize: 13, marginBottom: 12 }}>{excerpt(p.blog_text, 100)}</div>
                    <Link to={`/blog/${p.blog_id}`} style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)', textDecoration: 'none' }}>Read</Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── PRODUCT UPDATES ── */}
      <section className="container" ref={refs.product}>
        <p style={sectionLabel}>Product Updates</p>
        <hr style={sectionRule} />

        {loading ? <ProductRowsEmpty /> : (
          /* .blog__product-list */
          <div style={{ background: '#fff', border: '1px solid var(--border,#e5e5e5)', borderRadius: 14, overflow: 'hidden', marginBottom: 28, position: 'relative' }}>
            {productUpdates.length === 0 ? <ProductRowsEmpty /> : (
              productUpdates.map((p, i) => (
                <React.Fragment key={p.blog_id}>
                  {/* .blog__product-row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px' }}>
                    {/* .blog__product-thumb */}
                    <div style={{ width: 88, height: 88, borderRadius: 10, flexShrink: 0, overflow: 'hidden', background: '#eee' }}>
                      {resolveImg(p) && <img src={resolveImg(p)} alt={p.blog_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    {/* .blog__product-info */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>{getCategoryName(p)}</div>
                      <div style={{ fontWeight: 700, margin: '4px 0' }}>{p.blog_title}</div>
                      <div style={{ color: '#6B7280', fontSize: 13 }}>{excerpt(p.blog_text, 100)}</div>
                    </div>
                    {/* .blog__product-meta */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0, minWidth: 90 }}>
                      <Link to={`/blog/${p.blog_id}`} style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 16px', borderRadius: 999, background: 'var(--dark,#111)', color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Read</Link>
                    </div>
                  </div>
                  {/* .blog__product-divider */}
                  {i < productUpdates.length - 1 && (
                    <div style={{ height: 1, background: 'var(--border,#e5e5e5)', margin: '0 24px' }} />
                  )}
                </React.Fragment>
              ))
            )}
          </div>
        )}

        {/* .blog-section__load-wrap */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
          <button
            disabled
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 36px', height: 48, background: '#fff', border: '1.5px solid var(--border,#e5e5e5)', borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--gray,#888)', letterSpacing: '0.5px', cursor: 'not-allowed', opacity: 0.45, boxShadow: 'var(--shadow-sm)' }}
          >
            Load More Posts
          </button>
        </div>
      </section>

    </div>
  );
};

export default Blog;