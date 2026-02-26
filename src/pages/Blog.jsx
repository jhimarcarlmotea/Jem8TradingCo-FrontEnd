import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../style/blog.css';

const Blog = () => {
  const [activeFilter, setActiveFilter] = useState('home');

  const announcements = [
    {
      id: 1,
      title: 'Holiday Schedule & Office Closure Dates for 2025',
      content: 'Plan your orders ahead of time. Here are our official office closure and delivery suspension dates for all 2025 holidays.',
      date: 'February 19, 2026',
      category: 'ANNOUNCEMENTS',
      image: '/img/line-30-3.svg',
    },
    {
      id: 2,
      title: 'Holiday Schedule & Office Closure Dates for 2025',
      content: 'Plan your orders ahead of time. Here are our official office closure and delivery suspension dates for all 2025 holidays.',
      date: 'February 19, 2026',
      category: 'ANNOUNCEMENTS',
      image: '/img/line-30.svg',
    },
    {
      id: 3,
      title: 'Holiday Schedule & Office Closure Dates for 2025',
      content: 'Plan your orders ahead of time. Here are our official office closure and delivery suspension dates for all 2025 holidays.',
      date: 'February 19, 2026',
      category: 'ANNOUNCEMENTS',
      image: '/img/line-30-4.svg',
    },
    {
      id: 4,
      title: 'Holiday Schedule & Office Closure Dates for 2025',
      content: 'Plan your orders ahead of time. Here are our official office closure and delivery suspension dates for all 2025 holidays.',
      date: 'February 19, 2026',
      category: 'ANNOUNCEMENTS',
      image: '/img/image.svg',
    },
  ];

  const productUpdates = [
    { id: 1, image: '/img/img-product-2.png', isFirst: true },
    { id: 2, image: '/img/img-product.png', isFirst: false },
    { id: 3, image: '/img/img-product-4.png', isFirst: false },
    { id: 4, image: '/img/img-product-3.png', isFirst: true },
  ];

  const businessTrips = [
    { id: 1, image: '/img/image.png', line: '/img/line-31.svg' },
    { id: 2, image: '/img/image-50-2.png', line: null },
    { id: 3, image: '/img/image-50.png', line: '/img/line-31-2.svg' },
  ];

  const travelBlogs = [
    { id: 1, image: '/img/image-44.png' },
    { id: 2, image: '/img/image-45.png' },
    { id: 3, image: '/img/image-46.png' },
  ];

  const filters = [
    { key: 'home', label: 'Home' },
    { key: 'announcement', label: 'Announcement' },
    { key: 'travel', label: 'Travel Blog' },
    { key: 'business', label: 'Business Trips' },
    { key: 'product', label: 'Product Updates' },
  ];

  return (
    <div className="blog">

      {/* ===== PAGE TITLE ===== */}
      <div className="blog__title">BLOGS</div>

      {/* ===== FILTER BUTTONS ===== */}
      <div className="blog__filters">
        {filters.map((f) => (
          <button
            key={f.key}
            className={`blog__filter-btn ${activeFilter === f.key ? 'blog__filter-btn--active' : ''}`}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ===== BANNER ===== */}
      <div className="blog__banner">
        <p className="blog__banner-desc">
          Your all-in-one supply partner in Metro Manila. Office supplies, pantry essentials, janitorial products,
          wellness, and more — all from one trusted source.
        </p>
        <Link to="/about" className="blog__banner-btn">Learn More</Link>
      </div>

      {/* ===== FEATURED ===== */}
      <section className="blog__featured">
        <div className="blog__section-label">FEATURED</div>
        <div className="blog__featured-grid">

          {/* Main featured card */}
          <div className="blog__featured-main">
            <div className="blog__featured-main-inner">
              <div className="blog__featured-tag">ANNOUNCEMENT</div>
              <p className="blog__featured-title">We're Now Open in Salcedo Village, Makati</p>
              <p className="blog__featured-meta">Jem 8 Circle Trading Co. · February 10, 2025</p>
              <div className="blog__featured-badge"></div>
            </div>
          </div>

          {/* Sidebar list */}
          <div className="blog__featured-sidebar">
            <div className="blog__sidebar-item">
              <img src="/img/image-36.png" alt="Our Team's Travel" className="blog__sidebar-img" />
              <div className="blog__sidebar-info">
                <div className="blog__sidebar-category">Travel</div>
                <div className="blog__sidebar-title">Our Team's Travel</div>
                <div className="blog__sidebar-date">January 16, 2026</div>
              </div>
            </div>
            <div className="blog__sidebar-item">
              <img src="/img/image-38.png" alt="IAM Organic Barley Back in Stock" className="blog__sidebar-img" />
              <div className="blog__sidebar-info">
                <div className="blog__sidebar-category">Product Update</div>
                <div className="blog__sidebar-title">IAM Organic Barley Back in Stock</div>
                <div className="blog__sidebar-date">January 16, 2026</div>
              </div>
            </div>
            <div className="blog__sidebar-item">
              <img src="/img/image-37.png" alt="Manila 2025" className="blog__sidebar-img" />
              <div className="blog__sidebar-info">
                <div className="blog__sidebar-category">Business Trip</div>
                <div className="blog__sidebar-title">Manila 2025</div>
                <div className="blog__sidebar-date">January 16, 2026</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ANNOUNCEMENTS ===== */}
      <section className="blog__announcements">
        <div className="blog__section-label">ANNOUNCEMENTS</div>
        <img src="/img/line-29.svg" alt="" className="blog__divider" />

        {/* Latest/Featured announcement */}
        <div className="blog__latest">
          <div className="blog__latest-badge">LATEST</div>
          <p className="blog__latest-title">Jem 8 Circle is Now Accepting Internship Application</p>
          <p className="blog__latest-content">
            We're looking for motivated students eager to learn the ropes of trading, supply chain, and business
            operations. Apply now and grow with us.
          </p>
          <button className="blog__latest-btn">Learn More</button>
        </div>

        {/* Announcement cards grid */}
        <div className="blog__announcements-grid">
          {announcements.map((item) => (
            <div key={item.id} className="blog__announcement-card">
              <div className="blog__announcement-bg">
                <img src={item.image} alt="" className="blog__announcement-line" />
              </div>
              <div className="blog__announcement-category">{item.category}</div>
              <p className="blog__announcement-title">{item.title}</p>
              <p className="blog__announcement-content">{item.content}</p>
              <div className="blog__announcement-date">{item.date}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TRAVEL BLOGS ===== */}
      <section className="blog__travel">
        <div className="blog__section-label">TRAVEL BLOG</div>
        <img src="/img/line-30-2.svg" alt="" className="blog__divider" />

        {/* Top featured travel posts */}
        <div className="blog__travel-top">
          <div className="blog__travel-featured-card">
            <div className="blog__travel-featured-inner">
              <div className="blog__travel-tag">Travel</div>
              <p className="blog__travel-featured-title">Our Team's Trip to Laguna - Supplier visit and more</p>
              <p className="blog__travel-featured-meta">Jem 8 Circle Trading Co. · February 10, 2025</p>
              <div className="blog__travel-badge"></div>
            </div>
          </div>
          <div className="blog__travel-featured-card">
            <div className="blog__travel-featured-inner">
              <div className="blog__travel-tag">Travel</div>
              <p className="blog__travel-featured-title">Team Building in Tagaytay - A day well Spent</p>
              <p className="blog__travel-featured-meta">Jem 8 Circle Trading Co. · February 10, 2025</p>
              <div className="blog__travel-badge"></div>
            </div>
          </div>
        </div>

        {/* Bottom travel cards */}
        <div className="blog__travel-grid">
          {travelBlogs.map((item) => (
            <div key={item.id} className="blog__travel-card">
              <div className="blog__travel-card-bg">
                <img src={item.image} alt="Travel Blog" className="blog__travel-card-img" />
                <div className="blog__travel-card-footer"></div>
              </div>
              <div className="blog__travel-card-title">Laguna Product Sourcing</div>
              <p className="blog__travel-card-desc">
                What we found when we visited Laguna on a sourcing mission — organic products, local crafts, and new
                supplier leads.
              </p>
              <div className="blog__travel-card-date">February 6, 2026</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== BUSINESS TRIPS ===== */}
      <section className="blog__business">
        <div className="blog__section-label">Business Trips</div>
        <img src="/img/line-31-3.svg" alt="" className="blog__divider" />

        {/* Top featured business posts */}
        <div className="blog__business-top">
          <div className="blog__business-featured-card">
            <div className="blog__business-featured-inner">
              <div className="blog__business-tag">Business</div>
              <p className="blog__business-featured-title">Our Team's Trip to Laguna - Supplier visit and more</p>
              <p className="blog__business-featured-meta">Jem 8 Circle Trading Co. · February 10, 2025</p>
              <div className="blog__business-badge"></div>
            </div>
          </div>
          <div className="blog__business-featured-card">
            <div className="blog__business-featured-inner">
              <div className="blog__business-tag">Business</div>
              <p className="blog__business-featured-title">Team Building in Tagaytay - A day well Spent</p>
              <p className="blog__business-featured-meta">Jem 8 Circle Trading Co. · February 10, 2025</p>
              <div className="blog__business-badge"></div>
            </div>
          </div>
        </div>

        {/* Bottom business trip cards */}
        <div className="blog__business-grid">
          {businessTrips.map((item) => (
            <div key={item.id} className="blog__business-card">
              <div className="blog__business-card-bg">
                <img src={item.image} alt="Business Trip" className="blog__business-card-img" />
                <div className="blog__business-card-footer">
                  {item.line && <img src={item.line} alt="" className="blog__business-card-line" />}
                </div>
              </div>
              <div className="blog__business-card-title">Msme EXPO 2025</div>
              <p className="blog__business-card-desc">
                Our Team Attended last Year in MSME EXPO event and it was more than just an event; it was a
                room full of ambition, innovation, and opportunity.
              </p>
              <div className="blog__business-card-date">February 6, 2026</div>
            </div>
          ))}
        </div>
        <img src="/img/line-38.svg" alt="" className="blog__business-bottom-line" />
      </section>

      {/* ===== PRODUCT UPDATES ===== */}
      <section className="blog__products">
        <div className="blog__section-label">PRODUCT UPDATES</div>
        <img src="/img/line-32.svg" alt="" className="blog__divider" />

        <div className="blog__products-list">
          {productUpdates.map((item, index) => (
            <React.Fragment key={item.id}>
              <div className="blog__product-row">
                <img src={item.image} alt="Product" className="blog__product-img" />
                <div className="blog__product-info">
                  <div className="blog__product-category">PRODUCT UPDATES</div>
                  <p className="blog__product-title">IAM Amazing Pure Organic Barley — New 500g Pack</p>
                  <p className="blog__product-desc">
                    Now available in a larger format. Same premium quality, better value for health-conscious families and
                    businesses.
                  </p>
                </div>
                <div className="blog__product-meta">
                  <span className="blog__product-badge">NEW</span>
                  <div className="blog__product-date">February 7, 2026</div>
                </div>
              </div>
              {index < productUpdates.length - 1 && (
                <img src={`/img/line-3${3 + index}.svg`} alt="" className="blog__product-divider" />
              )}
            </React.Fragment>
          ))}
        </div>

        <button className="blog__load-more">LOAD MORE POST</button>
      </section>

    </div>
  );
};

export default Blog;