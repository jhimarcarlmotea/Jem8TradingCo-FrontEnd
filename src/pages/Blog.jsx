import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBlogs } from '../api/blogs';

const BASE = 'http://127.0.0.1:8000';

/* ─────────────────────────────────────────────
   Reusable primitives
───────────────────────────────────────────── */

const NoPostBadge = ({ text = 'No post yet' }) => (
  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold border border-white/30 whitespace-nowrap">
    {text}
  </div>
);

const Shimmer = ({ w = '100%', h = 14, r = 6, style = {} }) => (
  <div
    className="animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%]"
    style={{ width: w, height: h, borderRadius: r, ...style }}
  />
);

/* Featured main skeleton */
const FeaturedMainEmpty = () => (
  <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 min-h-[320px] flex flex-col justify-end p-8">
    <Shimmer w={80} h={10} style={{ marginBottom: 16, opacity: 0.4 }} />
    <Shimmer w="70%" h={22} style={{ marginBottom: 14, opacity: 0.4 }} />
    <Shimmer w="45%" h={10} style={{ marginBottom: 32, opacity: 0.3 }} />
    <NoPostBadge text="No featured post yet" />
  </div>
);

/* Sidebar 3 items skeleton */
const SidebarEmpty = () => (
  <div className="flex flex-col gap-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-3 border border-slate-100">
        <div className="flex-shrink-0 w-20 h-16 rounded-lg animate-pulse bg-slate-200" />
        <div className="flex flex-col flex-1 gap-2 pt-1">
          <Shimmer w="45%" h={9} />
          <Shimmer w="85%" h={12} />
          <Shimmer w="40%" h={8} />
        </div>
      </div>
    ))}
  </div>
);

/* Latest announcement skeleton */
const LatestEmpty = () => (
  <div className="p-8 mb-6 text-white rounded-2xl bg-slate-900">
    <span className="inline-block px-3 py-1 rounded-full bg-[#4d7b65] text-white text-[11px] font-bold tracking-widest mb-5">LATEST</span>
    <Shimmer w="68%" h={24} style={{ marginBottom: 16, opacity: 0.18 }} />
    <Shimmer w="92%" h={11} style={{ marginBottom: 8, opacity: 0.12 }} />
    <Shimmer w="70%" h={11} style={{ marginBottom: 32, opacity: 0.12 }} />
    <div className="w-24 rounded-lg h-9 animate-pulse bg-white/10" />
  </div>
);

/* 2×2 announcement grid skeleton */
const AnnouncementsEmpty = () => (
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="rounded-xl border border-slate-100 bg-white p-5 flex flex-col gap-3">
        <Shimmer w={70} h={9} />
        <Shimmer w="85%" h={15} />
        <Shimmer w="100%" h={10} />
        <Shimmer w="75%" h={10} />
        <Shimmer w={90} h={9} style={{ marginTop: 6 }} />
      </div>
    ))}
  </div>
);

/* Two tall hero cards skeleton */
const HeroCardsEmpty = () => (
  <div className="grid grid-cols-1 gap-5 mb-6 md:grid-cols-2">
    {[1, 2].map((i) => (
      <div key={i} className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 min-h-[260px] flex flex-col justify-end p-7">
        <Shimmer w={60} h={9} style={{ marginBottom: 12, opacity: 0.35 }} />
        <Shimmer w="75%" h={18} style={{ marginBottom: 10, opacity: 0.35 }} />
        <Shimmer w="50%" h={9} style={{ marginBottom: 32, opacity: 0.25 }} />
        <NoPostBadge />
      </div>
    ))}
  </div>
);

/* 3-column post card grid skeleton */
const PostCardsEmpty = () => (
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="overflow-hidden bg-white border rounded-xl border-slate-100">
        <div className="h-[140px] animate-pulse bg-slate-200" />
        <div className="flex flex-col gap-2.5 p-4">
          <Shimmer w="65%" h={13} />
          <Shimmer w="100%" h={10} />
          <Shimmer w="80%" h={10} />
          <Shimmer w={80} h={9} style={{ marginTop: 8 }} />
        </div>
      </div>
    ))}
  </div>
);

/* Product rows skeleton */
const ProductRowsEmpty = () => (
  <div className="relative overflow-hidden bg-white border rounded-xl border-slate-100">
    {[1, 2, 3, 4].map((item, i, arr) => (
      <React.Fragment key={item}>
        <div className="flex items-center gap-4 px-5 py-5">
          <div className="flex-shrink-0 w-16 h-16 rounded-lg animate-pulse bg-slate-200" />
          <div className="flex flex-col flex-1 gap-2.5">
            <Shimmer w={100} h={9} />
            <Shimmer w="70%" h={13} />
            <Shimmer w="90%" h={10} />
          </div>
          <div className="flex flex-col items-end gap-2">
            <Shimmer w={48} h={22} r={20} />
            <Shimmer w={80} h={9} />
          </div>
        </div>
        {i < arr.length - 1 && <div className="h-px mx-5 bg-slate-100" />}
      </React.Fragment>
    ))}
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
      <span className="mb-3 text-4xl">📦</span>
      <p className="mb-1 text-sm font-bold text-slate-700">No product updates yet</p>
      <p className="px-6 text-xs text-center text-slate-400">Content will appear here once the admin adds posts.</p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Data helpers
───────────────────────────────────────────── */

const resolveImg = (post) => {
  if (!post) return null;
  const imgs = post.images;
  if (Array.isArray(imgs) && imgs.length > 0) {
    const path = imgs[0].url;
    if (!path) return null;
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
   Shared Section Header
───────────────────────────────────────────── */
const SectionHeader = ({ label }) => (
  <div style={{ marginBottom: 10 }}>
    <p
      style={{
        fontSize: 13,
        fontWeight: 700,
        color: '#4d7b65',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        marginBottom: 8,
        marginTop: 0,
      }}
    >
      {label}
    </p>
    <div style={{ width: 32, height: 2, background: '#4d7b65', borderRadius: 2 }} />
  </div>
);

/* ─────────────────────────────────────────────
   Blog Page
───────────────────────────────────────────── */

const Blog = () => {
  const [activeFilter, setActiveFilter] = useState('home');
  const [posts, setPosts]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

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
      setLoading(true);
      setError(null);
      try {
        const data = await getBlogs();
        if (!mounted) return;
        const rows = Array.isArray(data) ? data : (data?.data ?? data?.posts ?? []);
        setPosts(rows.filter((p) => p.status === 'published' || true));
      } catch (err) {
        console.error('Failed to load blogs', err);
        setError(err?.message || 'Failed to load posts');
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

  return (
    <div className="min-h-screen bg-[#f8faf9] font-sans" style={{ paddingTop: 'calc(var(--header-h) + 30px)' }}>

      {/* ── PAGE HEADER ── */}
      <div className="container px-4 mx-auto" style={{ paddingTop: 40, paddingBottom: 20 }}>
        <h1 className="text-3xl font-extrabold text-[#1a2e22] tracking-tight" style={{ marginBottom: 20 }}>Blogs</h1>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => handleFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all cursor-pointer
                ${activeFilter === f.key
                  ? 'bg-[#4d7b65] text-white border-[#4d7b65] shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#4d7b65] hover:text-[#4d7b65]'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── BANNER ── */}
      <div className="container px-4 mx-auto" style={{ marginTop: 24, marginBottom: 64 }}>
        <div className="rounded-2xl bg-gradient-to-r from-[#1a2e22] to-[#2d5a42] text-white px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="max-w-2xl text-sm leading-relaxed text-white/80">
            Your all-in-one supply partner in Metro Manila. Office supplies, pantry essentials,
            janitorial products, wellness, and more — all from one trusted source.
          </p>
          <Link
            to="/about"
            className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-white text-[#1a2e22] text-sm font-bold no-underline hover:bg-[#f0faf5] transition-colors"
          >
            Learn More
          </Link>
        </div>
      </div>

      {/* ── FEATURED ── */}
      <section className="container px-4 mx-auto" style={{ marginBottom: 88 }}>
        <SectionHeader label="Featured" />
        <hr className="border-slate-200" style={{ margin: '0 0 28px' }} />
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-5">

          {/* Main featured */}
          {loading ? (
            <FeaturedMainEmpty />
          ) : featuredPost ? (
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a2e22] to-[#4d7b65] min-h-[320px] flex flex-col justify-end">
              {resolveImg(featuredPost) && (
                <img
                  src={resolveImg(featuredPost)}
                  alt={featuredPost.blog_title}
                  className="absolute inset-0 object-cover w-full h-full opacity-40"
                />
              )}
              <div className="relative z-10 p-8">
                <p className="text-[11px] text-white/60 mb-3 uppercase tracking-widest">{getCategoryName(featuredPost)}</p>
                <h2 className="mb-3 text-xl font-bold leading-snug text-white">{featuredPost.blog_title}</h2>
                <p className="mb-6 text-sm leading-relaxed text-white/70">{excerpt(featuredPost.blog_text, 200)}</p>
                <Link
                  to={`/blog/${featuredPost.blog_id}`}
                  className="inline-block px-5 py-2 rounded-lg bg-white text-[#1a2e22] text-sm font-bold no-underline hover:bg-[#f0faf5] transition-colors"
                >
                  Read Post
                </Link>
              </div>
            </div>
          ) : (
            <FeaturedMainEmpty />
          )}

          {/* Sidebar */}
          {loading ? (
            <SidebarEmpty />
          ) : sidebarPosts.length === 0 ? (
            <SidebarEmpty />
          ) : (
            <div className="flex flex-col gap-4">
              {sidebarPosts.map((p) => (
                <Link
                  key={p.blog_id}
                  to={`/blog/${p.blog_id}`}
                  className="flex gap-3 items-start bg-white rounded-xl p-3 border border-slate-100 no-underline hover:border-[#4d7b65] hover:shadow-sm transition-all group"
                >
                  <div className="flex-shrink-0 w-20 h-16 overflow-hidden rounded-lg bg-slate-100">
                    {resolveImg(p) && (
                      <img src={resolveImg(p)} alt={p.blog_title} className="object-cover w-full h-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="text-[11px] text-slate-400 mb-1.5">{getCategoryName(p)}</div>
                    <div className="text-sm font-bold text-[#1a2e22] leading-snug line-clamp-2 group-hover:text-[#4d7b65] transition-colors mb-1">{p.blog_title}</div>
                    <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{excerpt(p.blog_text, 80)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── ANNOUNCEMENTS ── */}
      <section className="container px-4 mx-auto" style={{ marginBottom: 88 }} ref={refs.announcement}>
        <SectionHeader label="Announcements" />
        <hr className="border-slate-200" style={{ margin: '0 0 28px' }} />

        {loading ? (
          <>
            <LatestEmpty />
            <AnnouncementsEmpty />
          </>
        ) : (
          <>
            {/* Latest dark card */}
            <div className="p-8 text-white rounded-2xl bg-slate-900" style={{ marginBottom: 24 }}>
              <span className="inline-block px-3 py-1 rounded-full bg-[#4d7b65] text-white text-[11px] font-bold tracking-widest mb-5">LATEST</span>
              {announcements[0] ? (
                <>
                  <h3 className="mb-3 text-xl font-bold leading-snug text-white">{announcements[0].blog_title}</h3>
                  <p className="mb-7 text-sm leading-relaxed text-white/60">{excerpt(announcements[0].blog_text, 220)}</p>
                  <Link
                    to={`/blog/${announcements[0].blog_id}`}
                    className="inline-block px-5 py-2 rounded-lg bg-[#4d7b65] text-white text-sm font-bold no-underline hover:bg-[#3a6050] transition-colors"
                  >
                    Read
                  </Link>
                </>
              ) : (
                <p className="text-sm italic text-white/40">No announcements yet.</p>
              )}
            </div>

            {/* 2×2 grid */}
            {announcements.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 20 }}>
                {announcements.slice(0, 4).map((p) => (
                  <div
                    key={p.blog_id}
                    className="rounded-xl border border-slate-100 bg-white hover:border-[#4d7b65] hover:shadow-sm transition-all flex flex-col"
                    style={{ padding: '28px 24px', minHeight: 200 }}
                  >
                    <div className="text-[11px] text-slate-400" style={{ marginBottom: 8 }}>{getCategoryName(p)}</div>
                    <div className="text-sm font-bold text-[#1a2e22] leading-snug" style={{ marginBottom: 12 }}>{p.blog_title}</div>
                    <div className="text-xs leading-relaxed text-slate-500 flex-1" style={{ marginBottom: 20 }}>{excerpt(p.blog_text, 120)}</div>
                    <div>
                      <Link
                        to={`/blog/${p.blog_id}`}
                        className="inline-block px-4 py-1.5 rounded-lg bg-[#f0faf5] text-[#4d7b65] text-xs font-bold no-underline border border-[#c6e8d6] hover:bg-[#4d7b65] hover:text-white transition-colors"
                      >
                        Read
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AnnouncementsEmpty />
            )}
          </>
        )}
      </section>

      {/* ── TRAVEL BLOG ── */}
      <section className="container px-4 mx-auto" style={{ marginBottom: 88 }} ref={refs.travel}>
        <SectionHeader label="Travel Blog" />
        <hr className="border-slate-200" style={{ margin: '0 0 28px' }} />

        {loading ? (
          <>
            <HeroCardsEmpty />
            <PostCardsEmpty />
          </>
        ) : (
          <>
            {/* Two tall hero cards */}
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 24, marginBottom: 24 }}>
              {travel.slice(0, 2).length > 0 ? travel.slice(0, 2).map((p) => (
                <div key={p.blog_id} className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a2e22] to-[#4d7b65] min-h-[260px] flex flex-col justify-end">
                  {resolveImg(p) && (
                    <img src={resolveImg(p)} alt={p.blog_title} className="absolute inset-0 object-cover w-full h-full opacity-40" />
                  )}
                  <div className="relative z-10 p-7 pb-14">
                    <div className="text-[11px] text-white/60 mb-2 uppercase tracking-widest">{getCategoryName(p)}</div>
                    <h3 className="mb-2 text-lg font-bold leading-snug text-white">{p.blog_title}</h3>
                    <p className="text-xs leading-relaxed text-white/60">{excerpt(p.blog_text, 160)}</p>
                  </div>
                  <Link
                    to={`/blog/${p.blog_id}`}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold border border-white/30 no-underline hover:bg-white/30 transition-colors whitespace-nowrap"
                  >
                    Read Post
                  </Link>
                </div>
              )) : <HeroCardsEmpty />}
            </div>

            {/* 3-col cards */}
            {travel.slice(0, 3).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3" style={{ gap: 24 }}>
                {travel.slice(0, 3).map((p) => (
                  <div key={p.blog_id} className="rounded-xl border border-slate-100 bg-white overflow-hidden hover:border-[#4d7b65] hover:shadow-sm transition-all flex flex-col">
                    <div className="h-[140px] bg-slate-100 overflow-hidden flex-shrink-0">
                      {resolveImg(p) && <img src={resolveImg(p)} alt={p.blog_title} className="object-cover w-full h-full" />}
                    </div>
                    <div className="flex flex-col flex-1" style={{ padding: '18px 20px 22px' }}>
                      <div className="text-sm font-bold text-[#1a2e22] leading-snug" style={{ marginBottom: 8 }}>{p.blog_title}</div>
                      <div className="text-xs leading-relaxed text-slate-500 flex-1" style={{ marginBottom: 16 }}>{excerpt(p.blog_text, 100)}</div>
                      <div>
                        <Link
                          to={`/blog/${p.blog_id}`}
                          className="inline-block px-4 py-1.5 rounded-lg bg-[#f0faf5] text-[#4d7b65] text-xs font-bold no-underline border border-[#c6e8d6] hover:bg-[#4d7b65] hover:text-white transition-colors"
                        >
                          Read
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <PostCardsEmpty />
            )}
          </>
        )}
      </section>

      {/* ── BUSINESS TRIPS ── */}
      <section className="container px-4 mx-auto" style={{ marginBottom: 88 }} ref={refs.business}>
        <SectionHeader label="Business Trips" />
        <hr className="border-slate-200" style={{ margin: '0 0 28px' }} />

        {loading ? (
          <>
            <HeroCardsEmpty />
            <PostCardsEmpty />
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 24, marginBottom: 24 }}>
              {business.slice(0, 2).length > 0 ? business.slice(0, 2).map((p) => (
                <div key={p.blog_id} className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a2e22] to-[#4d7b65] min-h-[260px] flex flex-col justify-end">
                  {resolveImg(p) && (
                    <img src={resolveImg(p)} alt={p.blog_title} className="absolute inset-0 object-cover w-full h-full opacity-40" />
                  )}
                  <div className="relative z-10 p-7 pb-14">
                    <div className="text-[11px] text-white/60 mb-2 uppercase tracking-widest">{getCategoryName(p)}</div>
                    <h3 className="mb-2 text-lg font-bold leading-snug text-white">{p.blog_title}</h3>
                    <p className="text-xs leading-relaxed text-white/60">{excerpt(p.blog_text, 160)}</p>
                  </div>
                  <Link
                    to={`/blog/${p.blog_id}`}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold border border-white/30 no-underline hover:bg-white/30 transition-colors whitespace-nowrap"
                  >
                    Read Post
                  </Link>
                </div>
              )) : <HeroCardsEmpty />}
            </div>

            {business.slice(0, 3).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3" style={{ gap: 24 }}>
                {business.slice(0, 3).map((p) => (
                  <div key={p.blog_id} className="rounded-xl border border-slate-100 bg-white overflow-hidden hover:border-[#4d7b65] hover:shadow-sm transition-all flex flex-col">
                    <div className="h-[140px] bg-slate-100 overflow-hidden flex-shrink-0">
                      {resolveImg(p) && <img src={resolveImg(p)} alt={p.blog_title} className="object-cover w-full h-full" />}
                    </div>
                    <div className="flex flex-col flex-1" style={{ padding: '18px 20px 22px' }}>
                      <div className="text-sm font-bold text-[#1a2e22] leading-snug" style={{ marginBottom: 8 }}>{p.blog_title}</div>
                      <div className="text-xs leading-relaxed text-slate-500 flex-1" style={{ marginBottom: 16 }}>{excerpt(p.blog_text, 100)}</div>
                      <div>
                        <Link
                          to={`/blog/${p.blog_id}`}
                          className="inline-block px-4 py-1.5 rounded-lg bg-[#f0faf5] text-[#4d7b65] text-xs font-bold no-underline border border-[#c6e8d6] hover:bg-[#4d7b65] hover:text-white transition-colors"
                        >
                          Read
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <PostCardsEmpty />
            )}
          </>
        )}
      </section>

      {/* ── PRODUCT UPDATES ── */}
      <section className="container px-4 mx-auto" style={{ marginBottom: 96 }} ref={refs.product}>
        <SectionHeader label="Product Updates" />
        <hr className="border-slate-200" style={{ margin: '0 0 28px' }} />

        {loading ? (
          <ProductRowsEmpty />
        ) : productUpdates.length === 0 ? (
          <ProductRowsEmpty />
        ) : (
          <div className="overflow-hidden bg-white border rounded-xl border-slate-100">
            {productUpdates.map((p, i) => (
              <React.Fragment key={p.blog_id}>
                <div className="flex items-center hover:bg-[#f8faf9] transition-colors" style={{ gap: 20, padding: '20px 24px' }}>
                  <div className="flex-shrink-0 w-16 h-16 overflow-hidden rounded-lg bg-slate-100">
                    {resolveImg(p) && (
                      <img src={resolveImg(p)} alt={p.blog_title} className="object-cover w-full h-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-slate-400 mb-1.5">{getCategoryName(p)}</div>
                    <div className="text-sm font-bold text-[#1a2e22] leading-snug mb-1">{p.blog_title}</div>
                    <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{excerpt(p.blog_text, 100)}</div>
                  </div>
                  <div className="flex-shrink-0 pl-2">
                    <Link
                      to={`/blog/${p.blog_id}`}
                      className="inline-block px-4 py-1.5 rounded-full bg-[#f0faf5] text-[#4d7b65] text-xs font-bold no-underline border border-[#c6e8d6] hover:bg-[#4d7b65] hover:text-white transition-colors whitespace-nowrap"
                    >
                      Read
                    </Link>
                  </div>
                </div>
                {i < productUpdates.length - 1 && <div className="h-px bg-slate-100" style={{ margin: '0 24px' }} />}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="flex justify-center" style={{ marginTop: 24 }}>
          <button
            disabled
            className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 text-sm font-semibold cursor-not-allowed opacity-60"
          >
            Load More Posts
          </button>
        </div>
      </section>

    </div>
  );
};

export default Blog;