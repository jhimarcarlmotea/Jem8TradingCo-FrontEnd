import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Header, Footer } from "../components/Layout";
import { useCart } from "../context/CartContext";
import "../style/global.css";
import "../style/orders.css";

const ph = (w, h, label = "") =>
  `https://placehold.co/${w}x${h}/edf4f0/4d7b65?text=${encodeURIComponent(label)}`;

const STATUS_COLORS = {
  Processing:  { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  Confirmed:   { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  Shipped:     { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  Delivered:   { bg: "#f0fdf4", color: "#166534", border: "#86efac" },
  Cancelled:   { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
};

const STATUS_STEPS = ["Processing", "Confirmed", "Shipped", "Delivered"];

export default function MyOrders() {
  const [searchParams]   = useSearchParams();
  const newOrderId       = searchParams.get("new");
  const { orders }       = useCart();
  const [selected, setSelected] = useState(newOrderId || null);
  const [activeTab, setActiveTab] = useState("all");

  const filtered = activeTab === "all"
    ? orders
    : orders.filter((o) => o.status.toLowerCase() === activeTab);

  const selectedOrder = orders.find((o) => o.id === selected);

  if (orders.length === 0) {
    return (
      <div className="orders-page">
        <Header />
        <div className="cart-empty">
          <div className="container cart-empty__inner">
            {newOrderId ? (
              <>
                <div className="orders-success-icon">🎉</div>
                <h2 className="cart-empty__title">Order Placed Successfully!</h2>
                <p className="cart-empty__desc">
                  Your order <strong>{newOrderId}</strong> has been received and is being processed.
                  We'll contact you shortly to confirm your payment.
                </p>
                <Link to="/products" className="btn-primary">Continue Shopping →</Link>
              </>
            ) : (
              <>
                <div className="cart-empty__icon">📦</div>
                <h2 className="cart-empty__title">No orders yet</h2>
                <p className="cart-empty__desc">Your order history will appear here once you place your first order.</p>
                <Link to="/products" className="btn-primary">Start Shopping →</Link>
              </>
            )}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="orders-page">
      <Header />

      {/* Breadcrumb */}
      <div className="pv-breadcrumb">
        <div className="container pv-breadcrumb__inner">
          <Link to="/">Home</Link>
          <span className="pv-breadcrumb__sep">›</span>
          <span>My Orders</span>
        </div>
      </div>

      {/* Success banner */}
      {newOrderId && (
        <div className="orders-success-banner">
          <div className="container orders-success-banner__inner">
            🎉 <strong>Order {newOrderId}</strong> placed successfully! We'll contact you to confirm your payment.
            <Link to="/products">Continue Shopping →</Link>
          </div>
        </div>
      )}

      <section className="orders-main">
        <div className="container orders-layout">

          {/* ── ORDER LIST ── */}
          <div className="orders-list-col">
            <div className="orders-list-header">
              <h1 className="orders-list-title">My Orders</h1>
              <span className="orders-list-count">{orders.length} total</span>
            </div>

            {/* Tabs */}
            <div className="orders-tabs">
              {["all", "processing", "confirmed", "shipped", "delivered"].map((tab) => (
                <button
                  key={tab}
                  className={`orders-tab${activeTab === tab ? " active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="orders-empty-tab">No orders in this category.</div>
            ) : (
              filtered.map((order) => (
                <div
                  key={order.id}
                  className={`order-card${selected === order.id ? " active" : ""}`}
                  onClick={() => setSelected(order.id)}
                >
                  <div className="order-card__top">
                    <div>
                      <div className="order-card__id">{order.id}</div>
                      <div className="order-card__date">{order.date}</div>
                    </div>
                    <span
                      className="order-card__status"
                      style={{
                        background:   (STATUS_COLORS[order.status] || STATUS_COLORS.Processing).bg,
                        color:        (STATUS_COLORS[order.status] || STATUS_COLORS.Processing).color,
                        borderColor:  (STATUS_COLORS[order.status] || STATUS_COLORS.Processing).border,
                      }}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="order-card__items-preview">
                    {order.items.slice(0, 3).map((item) => (
                      <img
                        key={item.id}
                        src={item.image}
                        alt={item.name}
                        className="order-card__thumb"
                        onError={(e) => { e.target.src = ph(40, 40, item.name); }}
                      />
                    ))}
                    {order.items.length > 3 && (
                      <span className="order-card__more">+{order.items.length - 3}</span>
                    )}
                  </div>
                  <div className="order-card__footer">
                    <span className="order-card__pay">{order.paymentMethod}</span>
                    <span className="order-card__total">₱{order.total.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── ORDER DETAIL ── */}
          <div className="orders-detail-col">
            {!selectedOrder ? (
              <div className="orders-detail-empty">
                <div className="orders-detail-empty__icon">📋</div>
                <p>Select an order to view details</p>
              </div>
            ) : (
              <div className="orders-detail">
                {/* Header */}
                <div className="orders-detail__header">
                  <div>
                    <h2 className="orders-detail__id">{selectedOrder.id}</h2>
                    <div className="orders-detail__date">Placed on {selectedOrder.date}</div>
                  </div>
                  <span
                    className="orders-detail__status"
                    style={{
                      background:  (STATUS_COLORS[selectedOrder.status] || STATUS_COLORS.Processing).bg,
                      color:       (STATUS_COLORS[selectedOrder.status] || STATUS_COLORS.Processing).color,
                      borderColor: (STATUS_COLORS[selectedOrder.status] || STATUS_COLORS.Processing).border,
                    }}
                  >
                    {selectedOrder.status}
                  </span>
                </div>

                {/* Tracker */}
                <div className="orders-tracker">
                  {STATUS_STEPS.map((s, i) => {
                    const currentIdx = STATUS_STEPS.indexOf(selectedOrder.status);
                    const done    = i < currentIdx;
                    const current = i === currentIdx;
                    return (
                      <div key={s} className={`orders-tracker__step${done ? " done" : ""}${current ? " current" : ""}`}>
                        <div className="orders-tracker__dot">{done ? "✓" : i + 1}</div>
                        <span className="orders-tracker__label">{s}</span>
                        {i < STATUS_STEPS.length - 1 && <div className="orders-tracker__line" />}
                      </div>
                    );
                  })}
                </div>

                {/* Delivery */}
                <div className="orders-detail__section">
                  <div className="orders-detail__section-title">📦 Delivery Address</div>
                  <div className="orders-detail__box">
                    <strong>{selectedOrder.delivery.firstName} {selectedOrder.delivery.lastName}</strong><br />
                    {selectedOrder.delivery.phone} · {selectedOrder.delivery.email}<br />
                    {selectedOrder.delivery.address}, {selectedOrder.delivery.barangay && `${selectedOrder.delivery.barangay}, `}
                    {selectedOrder.delivery.city}, {selectedOrder.delivery.province} {selectedOrder.delivery.zip}
                  </div>
                </div>

                {/* Payment */}
                <div className="orders-detail__section">
                  <div className="orders-detail__section-title">💳 Payment Method</div>
                  <div className="orders-detail__box">
                    <strong>{selectedOrder.paymentMethod}</strong>
                  </div>
                </div>

                {/* Items */}
                <div className="orders-detail__section">
                  <div className="orders-detail__section-title">🛒 Items Ordered</div>
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="orders-detail__item">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="orders-detail__item-img"
                        onError={(e) => { e.target.src = ph(56, 56, item.name); }}
                      />
                      <div className="orders-detail__item-info">
                        <Link to={`/products/${item.id}`} className="orders-detail__item-name">{item.name}</Link>
                        <div className="orders-detail__item-qty">Qty: {item.qty} × {item.price}</div>
                      </div>
                      <div className="orders-detail__item-total">
                        ₱{(item.rawPrice * item.qty).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="orders-detail__totals">
                  <div className="orders-detail__total-row">
                    <span>Subtotal</span>
                    <span>₱{selectedOrder.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="orders-detail__total-row">
                    <span>Shipping</span>
                    <span className={selectedOrder.shippingFee === 0 ? "co-summary__free" : ""}>
                      {selectedOrder.shippingFee === 0 ? "FREE" : `₱${selectedOrder.shippingFee.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="orders-detail__total-row orders-detail__total-row--grand">
                    <span>Total Paid</span>
                    <span>₱{selectedOrder.total.toLocaleString()}</span>
                  </div>
                </div>

                {selectedOrder.specialNote && (
                  <div className="orders-detail__section">
                    <div className="orders-detail__section-title">📝 Special Instructions</div>
                    <div className="orders-detail__box">{selectedOrder.specialNote}</div>
                  </div>
                )}

                <div className="orders-detail__actions">
                  <Link to="/products" className="btn-primary">Order Again →</Link>
                  <Link to="/contact"  className="btn-outline">Need Help?</Link>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}