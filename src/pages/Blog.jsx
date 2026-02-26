import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../style/blog.css';

/* ─────────────────────────────────────────────
   Reusable empty-state primitives
───────────────────────────────────────────── */

const NoPostBadge = ({ text = 'No post yet' }) => (
  <div className="blog__no-post-badge">{text}</div>
);

const Shimmer = ({ w = '100%', h = 14, r = 6, style = {} }) => (
  <div className="shimmer" style={{ width: w, height: h, borderRadius: r, ...style }} />
);

/* Featured main (large gradient card) */
const FeaturedMainEmpty = () => (
  <div className="blog__featured-main">
    <div className="blog__featured-main-inner">
      <Shimmer w={80} h={10} style={{ marginBottom: 12, opacity: 0.4 }} />
      <Shimmer w="70%" h={22} style={{ marginBottom: 10, opacity: 0.4 }} />
      <Shimmer w="45%" h={10} style={{ opacity: 0.3 }} />
    </div>
    <NoPostBadge text="No featured post yet" />
  </div>
);

/* Sidebar 3 items */
const SidebarEmpty = () => (
  <div className="blog__featured-sidebar">
    {[1, 2, 3].map((i) => (
      <div key={i} className="blog__sidebar-item">
        <div className="blog__sidebar-thumb shimmer" />
        <div className="blog__sidebar-info">
          <Shimmer w="45%" h={9} style={{ marginBottom: 8 }} />
          <Shimmer w="85%" h={12} style={{ marginBottom: 6 }} />
          <Shimmer w="40%" h={8} />
        </div>
      </div>
    ))}
  </div>
);

/* Latest announcement dark card */
const LatestEmpty = () => (
  <div className="blog__latest">
    <span className="blog__latest-badge">LATEST</span>
    <Shimmer w="68%" h={24} style={{ marginBottom: 14, opacity: 0.18 }} />
    <Shimmer w="92%" h={11} style={{ marginBottom: 6, opacity: 0.12 }} />
    <Shimmer w="70%" h={11} style={{ marginBottom: 28, opacity: 0.12 }} />
    <div className="blog__latest-btn-ghost shimmer" />
  </div>
);

/* 2×2 announcement grid */
const AnnouncementsEmpty = () => (
  <div className="blog__ann-grid">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="blog__ann-card">
        <Shimmer w={70} h={9} style={{ marginBottom: 14 }} />
        <Shimmer w="85%" h={15} style={{ marginBottom: 8 }} />
        <Shimmer w="100%" h={10} style={{ marginBottom: 5 }} />
        <Shimmer w="75%" h={10} style={{ marginBottom: 22 }} />
        <Shimmer w={90} h={9} />
      </div>
    ))}
  </div>
);

/* Two tall hero cards side by side */
const HeroCardsEmpty = () => (
  <div className="blog__two-col">
    {[1, 2].map((i) => (
      <div key={i} className="blog__hero-card">
        <div className="blog__hero-card-inner">
          <Shimmer w={60} h={9} style={{ marginBottom: 10, opacity: 0.35 }} />
          <Shimmer w="75%" h={18} style={{ marginBottom: 8, opacity: 0.35 }} />
          <Shimmer w="50%" h={9} style={{ opacity: 0.25 }} />
        </div>
        <NoPostBadge />
      </div>
    ))}
  </div>
);

/* 3-column post card grid */
const PostCardsEmpty = () => (
  <div className="blog__card-grid">
    {[1, 2, 3].map((i) => (
      <div key={i} className="blog__post-card">
        <div className="blog__post-card-img shimmer" />
        <div className="blog__post-card-body">
          <Shimmer w="65%" h={13} style={{ marginBottom: 10 }} />
          <Shimmer w="100%" h={10} style={{ marginBottom: 5 }} />
          <Shimmer w="80%" h={10} style={{ marginBottom: 16 }} />
          <Shimmer w={80} h={9} />
        </div>
      </div>
    ))}
  </div>
);

/* Product rows with overlay */
const ProductRowsEmpty = () => (
  <div className="blog__product-list">
    {[1, 2, 3, 4].map((item, i, arr) => (
      <React.Fragment key={item}>
        <div className="blog__product-row">
          <div className="blog__product-thumb shimmer" />
          <div className="blog__product-info">
            <Shimmer w={100} h={9} style={{ marginBottom: 8 }} />
            <Shimmer w="70%" h={13} style={{ marginBottom: 8 }} />
            <Shimmer w="90%" h={10} />
          </div>
          <div className="blog__product-meta">
            <Shimmer w={48} h={22} r={20} />
            <Shimmer w={80} h={9} />
          </div>
        </div>
        {i < arr.length - 1 && <div className="blog__product-divider" />}
      </React.Fragment>
    ))}
    <div className="blog__product-overlay">
      <span className="blog__empty-icon">📦</span>
      <p className="blog__empty-title">No product updates yet</p>
      <p className="blog__empty-sub">Content will appear here once the admin adds posts.</p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Blog Page
───────────────────────────────────────────── */

const Blog = () => {
  const [activeFilter, setActiveFilter] = useState('home');

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

  return (
    <div className="blog-page">

      {/* ── PAGE HEADER ── */}
      <div className="blog-page__top container">
        <h1 className="blog-page__heading">Blogs</h1>
        <div className="blog-page__filters">
          {filters.map((f) => (
            <button
              key={f.key}
              className={`blog-page__filter ${activeFilter === f.key ? 'blog-page__filter--active' : ''}`}
              onClick={() => handleFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── BANNER ── */}
      <div className="container">
        <div className="blog-banner">
          <p className="blog-banner__text">
            Your all-in-one supply partner in Metro Manila. Office supplies, pantry essentials,
            janitorial products, wellness, and more — all from one trusted source.
          </p>
          <Link to="/about" className="blog-banner__btn">Learn More</Link>
        </div>
      </div>

      {/* ── FEATURED ── */}
      <section className="blog-section container">
        <p className="blog-section__label">Featured</p>
        <div className="blog__featured-grid">
          <FeaturedMainEmpty />
          <SidebarEmpty />
        </div>
      </section>

      {/* ── ANNOUNCEMENTS ── */}
      <section className="blog-section container" ref={refs.announcement}>
        <p className="blog-section__label">Announcements</p>
        <hr className="blog-section__rule" />
        <LatestEmpty />
        <AnnouncementsEmpty />
      </section>

      {/* ── TRAVEL BLOG ── */}
      <section className="blog-section container" ref={refs.travel}>
        <p className="blog-section__label">Travel Blog</p>
        <hr className="blog-section__rule" />
        <HeroCardsEmpty />
        <PostCardsEmpty />
      </section>

      {/* ── BUSINESS TRIPS ── */}
      <section className="blog-section container" ref={refs.business}>
        <p className="blog-section__label">Business Trips</p>
        <hr className="blog-section__rule" />
        <HeroCardsEmpty />
        <PostCardsEmpty />
      </section>

      {/* ── PRODUCT UPDATES ── */}
      <section className="blog-section container" ref={refs.product}>
        <p className="blog-section__label">Product Updates</p>
        <hr className="blog-section__rule" />
        <ProductRowsEmpty />
        <div className="blog-section__load-wrap">
          <button className="blog-section__load-btn" disabled>Load More Posts</button>
        </div>
      </section>

    </div>
  );
};

export default Blog;