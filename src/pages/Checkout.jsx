import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header, Footer } from "../components/Layout";
import { useCart } from "../context/CartContext";
import "../style/global.css";
import "../style/checkout.css";

const ph = (w, h, label = "") =>
  `https://placehold.co/${w}x${h}/edf4f0/4d7b65?text=${encodeURIComponent(label)}`;

const SHIPPING_FEE = 150;
const FREE_SHIPPING_MIN = 2000;

const PAYMENT_METHODS = [
  {
    id: "gcash",
    label: "GCash",
    icon: "💙",
    tag: "E-Wallet",
    tagColor: "#0078FF",
    desc: "Pay via GCash e-wallet",
    fields: [
      { name: "gcashNumber", label: "GCash Mobile Number", placeholder: "09XXXXXXXXX", type: "tel" },
      { name: "gcashName",   label: "GCash Account Name",  placeholder: "Full Name on GCash" },
    ],
    note: "You will receive a GCash payment request after placing your order. Please complete payment within 1 hour.",
  },
  {
    id: "maya",
    label: "Maya (PayMaya)",
    icon: "💚",
    tag: "E-Wallet",
    tagColor: "#00C562",
    desc: "Pay via Maya e-wallet",
    fields: [
      { name: "mayaNumber", label: "Maya Mobile Number", placeholder: "09XXXXXXXXX", type: "tel" },
      { name: "mayaName",   label: "Maya Account Name",  placeholder: "Full Name on Maya" },
    ],
    note: "A Maya payment link will be sent to your mobile number. Complete payment within 1 hour.",
  },
  {
    id: "bank",
    label: "Bank Transfer",
    icon: "🏦",
    tag: "Bank",
    tagColor: "#6366f1",
    desc: "BPI, BDO, Metrobank, UnionBank, Landbank, PNB",
    fields: [
      { name: "bankName",    label: "Bank Name",          placeholder: "e.g. BPI, BDO, Metrobank" },
      { name: "accountName", label: "Account Name",       placeholder: "Your account name" },
      { name: "accountNum",  label: "Account Number",     placeholder: "Your account number" },
      { name: "refNumber",   label: "Reference Number",   placeholder: "Transaction reference (after transfer)" },
    ],
    note: "Transfer to: BPI Savings — JEM 8 Circle Trading Co. — Account No. 1234-5678-90. Send proof of payment to our email.",
  },
  {
    id: "cod",
    label: "Cash on Delivery",
    icon: "💵",
    tag: "COD",
    tagColor: "#f59e0b",
    desc: "Pay cash when your order arrives",
    fields: [],
    note: "Prepare the exact amount upon delivery. Our courier will contact you before arriving. COD available within Metro Manila and Laguna only.",
  },
  {
    id: "check",
    label: "Check Payment",
    icon: "📄",
    tag: "Check",
    tagColor: "#64748b",
    desc: "Pay by post-dated or manager's check",
    fields: [
      { name: "checkBank",   label: "Issuing Bank",       placeholder: "e.g. BDO, BPI" },
      { name: "checkNum",    label: "Check Number",       placeholder: "Check number" },
      { name: "checkDate",   label: "Check Date",         type: "date" },
      { name: "checkAmount", label: "Check Amount (₱)",   placeholder: "Amount in pesos", type: "number" },
    ],
    note: "Make check payable to: JEM 8 Circle Trading Co. Deliver check to our Makati office or hand to our sales representative.",
  },
];

const STEPS = ["Delivery", "Payment", "Review"];

export default function Checkout() {
  const navigate     = useNavigate();
  const { items, subtotal, placeOrder } = useCart();

  const shippingFee = subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE;
  const total       = subtotal + shippingFee;

  const [step, setStep]         = useState(0); // 0=delivery, 1=payment, 2=review
  const [payMethod, setPayMethod] = useState("gcash");
  const [payFields, setPayFields] = useState({});
  const [specialNote, setSpecialNote] = useState("");
  const [placing, setPlacing]   = useState(false);

  const [delivery, setDelivery] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", barangay: "", city: "", province: "", zip: "",
  });

  const handleDeliveryChange = (e) =>
    setDelivery((d) => ({ ...d, [e.target.name]: e.target.value }));

  const handlePayFieldChange = (e) =>
    setPayFields((f) => ({ ...f, [e.target.name]: e.target.value }));

  const deliveryValid = delivery.firstName && delivery.lastName &&
    delivery.email && delivery.phone && delivery.address &&
    delivery.city && delivery.province;

  const activePayment = PAYMENT_METHODS.find((m) => m.id === payMethod);

  const handlePlaceOrder = () => {
    setPlacing(true);
    setTimeout(() => {
      const orderId = placeOrder({
        delivery,
        paymentMethod: activePayment.label,
        paymentDetails: payFields,
        specialNote,
        subtotal,
        shippingFee,
        total,
      });
      navigate(`/orders?new=${orderId}`);
    }, 1200);
  };

  if (items.length === 0) {
    return (
      <div className="checkout-page">
        <Header />
        <div className="cart-empty">
          <div className="container cart-empty__inner">
            <div className="cart-empty__icon">🛒</div>
            <h2 className="cart-empty__title">No items to checkout</h2>
            <Link to="/products" className="btn-primary">Browse Products →</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <Header />

      {/* Breadcrumb */}
      <div className="pv-breadcrumb">
        <div className="container pv-breadcrumb__inner">
          <Link to="/">Home</Link>
          <span className="pv-breadcrumb__sep">›</span>
          <Link to="/cart">Cart</Link>
          <span className="pv-breadcrumb__sep">›</span>
          <span>Checkout</span>
        </div>
      </div>

      {/* Progress */}
      <div className="co-progress">
        <div className="container co-progress__inner">
          {STEPS.map((s, i) => (
            <div key={s} className={`co-progress__step${i <= step ? " active" : ""}${i < step ? " done" : ""}`}>
              <div className="co-progress__dot">{i < step ? "✓" : i + 1}</div>
              <span className="co-progress__label">{s}</span>
              {i < STEPS.length - 1 && <div className="co-progress__line" />}
            </div>
          ))}
        </div>
      </div>

      <section className="co-main">
        <div className="container co-main__grid">

          {/* ── LEFT PANEL ── */}
          <div className="co-form-col">

            {/* STEP 0 — DELIVERY */}
            {step === 0 && (
              <div className="co-section">
                <h2 className="co-section__title">📦 Delivery Information</h2>
                <div className="co-form-grid">
                  <div className="co-field">
                    <label>First Name *</label>
                    <input name="firstName" value={delivery.firstName} onChange={handleDeliveryChange} placeholder="Juan" />
                  </div>
                  <div className="co-field">
                    <label>Last Name *</label>
                    <input name="lastName" value={delivery.lastName} onChange={handleDeliveryChange} placeholder="dela Cruz" />
                  </div>
                  <div className="co-field co-field--full">
                    <label>Email Address *</label>
                    <input name="email" type="email" value={delivery.email} onChange={handleDeliveryChange} placeholder="juan@company.com" />
                  </div>
                  <div className="co-field co-field--full">
                    <label>Mobile Number *</label>
                    <input name="phone" type="tel" value={delivery.phone} onChange={handleDeliveryChange} placeholder="09XXXXXXXXX" />
                  </div>
                  <div className="co-field co-field--full">
                    <label>Street Address / Building / Unit *</label>
                    <input name="address" value={delivery.address} onChange={handleDeliveryChange} placeholder="e.g. Unit 202, Cityland Tower, HV Dela Costa St." />
                  </div>
                  <div className="co-field">
                    <label>Barangay</label>
                    <input name="barangay" value={delivery.barangay} onChange={handleDeliveryChange} placeholder="Barangay name" />
                  </div>
                  <div className="co-field">
                    <label>City / Municipality *</label>
                    <input name="city" value={delivery.city} onChange={handleDeliveryChange} placeholder="Makati City" />
                  </div>
                  <div className="co-field">
                    <label>Province *</label>
                    <input name="province" value={delivery.province} onChange={handleDeliveryChange} placeholder="Metro Manila" />
                  </div>
                  <div className="co-field">
                    <label>ZIP Code</label>
                    <input name="zip" value={delivery.zip} onChange={handleDeliveryChange} placeholder="1227" />
                  </div>
                </div>
                <button
                  className="co-next-btn"
                  onClick={() => setStep(1)}
                  disabled={!deliveryValid}
                >
                  Continue to Payment →
                </button>
              </div>
            )}

            {/* STEP 1 — PAYMENT */}
            {step === 1 && (
              <div className="co-section">
                <h2 className="co-section__title">💳 Select Method of Payment</h2>

                <div className="co-pay-methods">
                  {PAYMENT_METHODS.map((m) => (
                    <div
                      key={m.id}
                      className={`co-pay-method${payMethod === m.id ? " active" : ""}`}
                      onClick={() => setPayMethod(m.id)}
                    >
                      <div className="co-pay-method__radio">
                        <div className={`co-radio${payMethod === m.id ? " co-radio--active" : ""}`} />
                      </div>
                      <div className="co-pay-method__icon">{m.icon}</div>
                      <div className="co-pay-method__info">
                        <span className="co-pay-method__label">{m.label}</span>
                        <span className="co-pay-method__desc">{m.desc}</span>
                      </div>
                      <span
                        className="co-pay-method__tag"
                        style={{ background: m.tagColor + "22", color: m.tagColor, borderColor: m.tagColor + "44" }}
                      >
                        {m.tag}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Dynamic fields for selected method */}
                {activePayment.fields.length > 0 && (
                  <div className="co-pay-fields">
                    <h3 className="co-pay-fields__title">{activePayment.label} Details</h3>
                    <div className="co-form-grid">
                      {activePayment.fields.map((f) => (
                        <div key={f.name} className="co-field co-field--full">
                          <label>{f.label}</label>
                          <input
                            name={f.name}
                            type={f.type || "text"}
                            placeholder={f.placeholder || ""}
                            value={payFields[f.name] || ""}
                            onChange={handlePayFieldChange}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activePayment.note && (
                  <div className="co-pay-note">
                    ℹ️ {activePayment.note}
                  </div>
                )}

                <div className="co-field co-field--full" style={{ marginTop: 24 }}>
                  <label>Special Instructions (optional)</label>
                  <textarea
                    className="co-textarea"
                    placeholder="Any special delivery instructions or notes for your order..."
                    value={specialNote}
                    onChange={(e) => setSpecialNote(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="co-step-nav">
                  <button className="co-back-btn" onClick={() => setStep(0)}>← Back</button>
                  <button className="co-next-btn" onClick={() => setStep(2)}>Review Order →</button>
                </div>
              </div>
            )}

            {/* STEP 2 — REVIEW */}
            {step === 2 && (
              <div className="co-section">
                <h2 className="co-section__title">✅ Review Your Order</h2>

                <div className="co-review-block">
                  <div className="co-review-block__header">
                    <span>📦 Delivery Address</span>
                    <button className="co-review-edit" onClick={() => setStep(0)}>Edit</button>
                  </div>
                  <div className="co-review-block__content">
                    <strong>{delivery.firstName} {delivery.lastName}</strong><br />
                    {delivery.phone} · {delivery.email}<br />
                    {delivery.address}, {delivery.barangay && `${delivery.barangay}, `}{delivery.city}, {delivery.province} {delivery.zip}
                  </div>
                </div>

                <div className="co-review-block">
                  <div className="co-review-block__header">
                    <span>💳 Payment Method</span>
                    <button className="co-review-edit" onClick={() => setStep(1)}>Edit</button>
                  </div>
                  <div className="co-review-block__content">
                    <strong>{activePayment.icon} {activePayment.label}</strong>
                    {Object.entries(payFields).map(([k, v]) =>
                      v ? <div key={k} className="co-review-field">{k}: {v}</div> : null
                    )}
                  </div>
                </div>

                <div className="co-review-block">
                  <div className="co-review-block__header"><span>🛒 Items ({items.length})</span></div>
                  <div className="co-review-items">
                    {items.map((item) => (
                      <div key={item.id} className="co-review-item">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="co-review-item__img"
                          onError={(e) => { e.target.src = ph(60, 60, item.name); }}
                        />
                        <div className="co-review-item__info">
                          <div className="co-review-item__name">{item.name}</div>
                          <div className="co-review-item__qty">Qty: {item.qty}</div>
                        </div>
                        <div className="co-review-item__price">₱{(item.rawPrice * item.qty).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {specialNote && (
                  <div className="co-review-block">
                    <div className="co-review-block__header"><span>📝 Special Instructions</span></div>
                    <div className="co-review-block__content">{specialNote}</div>
                  </div>
                )}

                <div className="co-step-nav">
                  <button className="co-back-btn" onClick={() => setStep(1)}>← Back</button>
                  <button
                    className={`co-place-btn${placing ? " co-place-btn--loading" : ""}`}
                    onClick={handlePlaceOrder}
                    disabled={placing}
                  >
                    {placing ? "Placing Order..." : "Place Order & Confirm Payment →"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT — ORDER SUMMARY ── */}
          <div className="co-summary-col">
            <div className="co-summary">
              <h2 className="co-summary__title">Order Summary</h2>
              <div className="co-summary__items">
                {items.map((item) => (
                  <div key={item.id} className="co-summary__item">
                    <div className="co-summary__item-img">
                      <img
                        src={item.image}
                        alt={item.name}
                        onError={(e) => { e.target.src = ph(50, 50, item.name); }}
                      />
                      <span className="co-summary__item-qty">{item.qty}</span>
                    </div>
                    <div className="co-summary__item-name">{item.name}</div>
                    <div className="co-summary__item-price">₱{(item.rawPrice * item.qty).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <div className="co-summary__rows">
                <div className="co-summary__row">
                  <span>Subtotal</span>
                  <span>₱{subtotal.toLocaleString()}</span>
                </div>
                <div className="co-summary__row">
                  <span>Shipping</span>
                  <span className={shippingFee === 0 ? "co-summary__free" : ""}>
                    {shippingFee === 0 ? "FREE" : `₱${shippingFee.toLocaleString()}`}
                  </span>
                </div>
                <div className="co-summary__divider" />
                <div className="co-summary__row co-summary__row--total">
                  <span>Total</span>
                  <span>₱{total.toLocaleString()}</span>
                </div>
              </div>
              <div className="co-summary__secure">🔒 Secure & Encrypted Checkout</div>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}