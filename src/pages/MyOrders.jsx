import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Header } from "../components/Layout";
import "../style/global.css";
import "../style/orders.css";

/* ─── Axios instance ─────────────────────────────────────── */
const api = axios.create({
  baseURL:         "http://127.0.0.1:8000/api",
  withCredentials: true,
  headers:         { "Content-Type": "application/json" },
});

/* ─── Helpers ─────────────────────────────────────────────── */
const ph = (w, h, label = "") =>
  `https://placehold.co/${w}x${h}/edf4f0/4d7b65?text=${encodeURIComponent(label)}`;

const STATUS_COLORS = {
  processing: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  confirmed:  { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  shipped:    { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  delivered:  { bg: "#f0fdf4", color: "#166534", border: "#86efac" },
  cancelled:  { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
};

const STATUS_STEPS = ["processing", "confirmed", "shipped", "delivered"];

/**
 * Normalise one order entry from:
 * { checkout: {...}, delivery: {...}, items: [...] }
 * + top-level account fields passed in separately.
 */
function normaliseOrder(o, account) {
  const { checkout, delivery, items = [] } = o;
  const status = (delivery?.status ?? "processing").toLowerCase();

  return {
    id:            delivery?.delivery_id ?? checkout?.checkout_id,
    date:          checkout?.created_at
                     ? new Date(checkout.created_at).toLocaleDateString("en-PH", {
                         year: "numeric", month: "long", day: "numeric",
                       })
                     : "—",
    status,
    paymentMethod: checkout?.payment_method ?? "—",
    paymentDetails: checkout?.payment_details ?? null,
    subtotal:      Number(checkout?.paid_amount ?? 0) - Number(checkout?.shipping_fee ?? 0),
    shippingFee:   Number(checkout?.shipping_fee ?? 0),
    total:         Number(checkout?.paid_amount ?? 0),
    specialNote:   checkout?.special_instructions ?? delivery?.notes ?? "",
    delivery: {
      firstName: account?.first_name ?? "",
      lastName:  account?.last_name  ?? "",
      phone:     account?.phone_number ?? "",
      email:     account?.email ?? "",
      address:   delivery?.address ?? "",
      barangay:  delivery?.barangay ?? "",
      city:      delivery?.city ?? "",
      province:  delivery?.province ?? "",
      zip:       delivery?.zip ?? "",
    },
    items: items.map((item) => ({
      id:       item.id ?? item.product_id,
      name:     item.name ?? item.product_name ?? "Item",
      image:    item.image ?? item.product_image ?? "",
      qty:      Number(item.qty ?? item.quantity ?? 1),
      price:    `₱${Number(item.unit_price ?? item.price ?? 0).toLocaleString()}`,
      rawPrice: Number(item.unit_price ?? item.price ?? 0),
    })),
  };
}

/* ─── Component ───────────────────────────────────────────── */
export default function MyOrders() {
  const [searchParams] = useSearchParams();
  const newOrderId = searchParams.get("new");

  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [selected,  setSelected]  = useState(newOrderId || null);
  const [activeTab, setActiveTab] = useState("all");

  /* ── Fetch deliveries ── */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.get("/my-deliveries")
      .then(({ data }) => {
        if (cancelled) return;

        // Shape: { account: {...}, orders: [...] }
        const account  = data.account ?? {};
        const rawOrders = Array.isArray(data.orders) ? data.orders : (data.data ?? []);
        const normalised = rawOrders.map((o) => normaliseOrder(o, account));

        setOrders(normalised);

        // Auto-select: prefer ?new= param, otherwise pick the latest (first) order
        if (newOrderId && normalised.some((o) => String(o.id) === String(newOrderId))) {
          setSelected(String(newOrderId));
        } else if (normalised.length > 0) {
          setSelected(String(normalised[0].id));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err.response?.data?.message ?? err.message ?? "Unknown error";
          setError(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [newOrderId]);

  /* ── Update status ── */
  async function updateStatus(deliveryId, newStatus) {
    const { data } = await api.patch(`/deliveries/${deliveryId}/status`, { status: newStatus });
    setOrders((prev) =>
      prev.map((o) =>
        String(o.id) === String(deliveryId)
          ? { ...o, status: (data.status ?? newStatus).toLowerCase() }
          : o
      )
    );
  }

  /* ── Derived ── */
  const filtered =
    activeTab === "all"
      ? orders
      : orders.filter((o) => o.status === activeTab);

  const selectedOrder = orders.find((o) => String(o.id) === String(selected));

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="orders-page">
        <Header />
        <div className="cart-empty">
          <div className="container cart-empty__inner">
            <div className="cart-empty__icon" style={{ fontSize: 48 }}>⏳</div>
            <h2 className="cart-empty__title">Loading your orders…</h2>
          </div>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="orders-page">
        <Header />
        <div className="cart-empty">
          <div className="container cart-empty__inner">
            <div className="cart-empty__icon" style={{ fontSize: 48 }}>⚠️</div>
            <h2 className="cart-empty__title">Could not load orders</h2>
            <p className="cart-empty__desc">{error}</p>
            <button className="btn-primary" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Empty state ── */
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
                <p className="cart-empty__desc">
                  Your order history will appear here once you place your first order.
                </p>
                <Link to="/products" className="btn-primary">Start Shopping →</Link>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Main ── */
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
            🎉 <strong>Order {newOrderId}</strong> placed successfully! We'll contact you to confirm
            your payment.{" "}
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
              filtered.map((order) => {
                const colors = STATUS_COLORS[order.status] || STATUS_COLORS.processing;
                return (
                  <div
                    key={order.id}
                    className={`order-card${String(selected) === String(order.id) ? " active" : ""}`}
                    onClick={() => setSelected(String(order.id))}
                  >
                    <div className="order-card__top">
                      <div>
                        <div className="order-card__id">#{order.id}</div>
                        <div className="order-card__date">{order.date}</div>
                      </div>
                      <span
                        className="order-card__status"
                        style={{ background: colors.bg, color: colors.color, borderColor: colors.border }}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
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
                  </div>
                );
              })
            )}
          </div>

          {/* ── ORDER DETAIL ── */}
          <div className="orders-detail-col">
            {!selectedOrder ? (
              <div className="orders-detail-empty">
                <div className="orders-detail-empty__icon">📋</div>
                <p>Select an order to view details</p>
              </div>
            ) : (() => {
              const colors = STATUS_COLORS[selectedOrder.status] || STATUS_COLORS.processing;
              return (
                <div className="orders-detail">
                  {/* Header */}
                  <div className="orders-detail__header">
                    <div>
                      <h2 className="orders-detail__id">#{selectedOrder.id}</h2>
                      <div className="orders-detail__date">Placed on {selectedOrder.date}</div>
                    </div>
                    <span
                      className="orders-detail__status"
                      style={{ background: colors.bg, color: colors.color, borderColor: colors.border }}
                    >
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </div>

                  {/* Tracker */}
                  {selectedOrder.status !== "cancelled" && (
                    <div className="orders-tracker">
                      {STATUS_STEPS.map((s, i) => {
                        const currentIdx = STATUS_STEPS.indexOf(selectedOrder.status);
                        const done    = i < currentIdx;
                        const current = i === currentIdx;
                        return (
                          <div
                            key={s}
                            className={`orders-tracker__step${done ? " done" : ""}${current ? " current" : ""}`}
                          >
                            <div className="orders-tracker__dot">{done ? "✓" : i + 1}</div>
                            <span className="orders-tracker__label">
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </span>
                            {i < STATUS_STEPS.length - 1 && <div className="orders-tracker__line" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Delivery Address */}
                  <div className="orders-detail__section">
                    <div className="orders-detail__section-title">📦 Delivery Address</div>
                    <div className="orders-detail__box">
                      <strong>
                        {selectedOrder.delivery.firstName} {selectedOrder.delivery.lastName}
                      </strong>
                      <br />
                      {selectedOrder.delivery.phone} · {selectedOrder.delivery.email}
                      {(selectedOrder.delivery.address || selectedOrder.delivery.city) && (
                        <>
                          <br />
                          {selectedOrder.delivery.address}
                          {selectedOrder.delivery.barangay && `, ${selectedOrder.delivery.barangay}`}
                          {selectedOrder.delivery.city && `, ${selectedOrder.delivery.city}`}
                          {selectedOrder.delivery.province && `, ${selectedOrder.delivery.province}`}
                          {selectedOrder.delivery.zip && ` ${selectedOrder.delivery.zip}`}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Payment */}
                  <div className="orders-detail__section">
                    <div className="orders-detail__section-title">💳 Payment Method</div>
                    <div className="orders-detail__box">
                      <strong style={{ textTransform: "capitalize" }}>
                        {selectedOrder.paymentMethod}
                      </strong>
                      {selectedOrder.paymentDetails && (
                        <div style={{ marginTop: 4, fontSize: "0.85rem", color: "#6b7280" }}>
                          {selectedOrder.paymentDetails.account_name && (
                            <div>Name: {selectedOrder.paymentDetails.account_name}</div>
                          )}
                          {selectedOrder.paymentDetails.mobile_number && (
                            <div>Number: {selectedOrder.paymentDetails.mobile_number}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="orders-detail__section">
                    <div className="orders-detail__section-title">🛒 Items Ordered</div>
                    {selectedOrder.items.length === 0 ? (
                      <div className="orders-detail__box" style={{ color: "#6b7280" }}>
                        No item details available.
                      </div>
                    ) : (
                      selectedOrder.items.map((item) => (
                        <div key={item.id} className="orders-detail__item">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="orders-detail__item-img"
                            onError={(e) => { e.target.src = ph(56, 56, item.name); }}
                          />
                          <div className="orders-detail__item-info">
                            <Link to={`/products/${item.id}`} className="orders-detail__item-name">
                              {item.name}
                            </Link>
                            <div className="orders-detail__item-qty">
                              Qty: {item.qty} × {item.price}
                            </div>
                          </div>
                          <div className="orders-detail__item-total">
                            ₱{(item.rawPrice * item.qty).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
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
                        {selectedOrder.shippingFee === 0
                          ? "FREE"
                          : `₱${selectedOrder.shippingFee.toLocaleString()}`}
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
              );
            })()}
          </div>

        </div>
      </section>
    </div>
  );
}