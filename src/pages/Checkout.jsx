import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Header, Footer } from "../components/Layout";
import { getUserAddresses } from "../api/address";
import "../style/global.css";
import "../style/checkout.css";
const ph = (w, h, label = "") =>
  `https://placehold.co/${w}x${h}/edf4f0/4d7b65?text=${encodeURIComponent(label)}`;

const BASE = "http://127.0.0.1:8000/api";
const SHIPPING_FEE = 150;
const FREE_SHIPPING_MIN = 2000;

// ── Payment method id matches exactly what the backend switch expects ──
const PAYMENT_METHODS = [
  {
    id: "gcash",                     // ← backend: case 'gcash'
    label: "GCash",
    icon: "💙",
    tag: "E-Wallet",
    tagColor: "#0078FF",
    desc: "Pay via GCash e-wallet",
    fields: [
      { name: "mobile_number", label: "GCash Mobile Number", placeholder: "09XXXXXXXXX", type: "tel" },
      { name: "account_name", label: "GCash Account Name",   placeholder: "Full Name on GCash" },
    ],
    note: "You will receive a GCash payment request after placing your order. Please complete payment within 1 hour.",
  },
  {
    id: "maya",                      // ← backend: case 'maya'
    label: "Maya (PayMaya)",
    icon: "💚",
    tag: "E-Wallet",
    tagColor: "#00C562",
    desc: "Pay via Maya e-wallet",
    fields: [
      { name: "mobile_number", label: "Maya Mobile Number", placeholder: "09XXXXXXXXX", type: "tel" },
      { name: "account_name", label: "Maya Account Name",   placeholder: "Full Name on Maya" },
    ],
    note: "A Maya payment link will be sent to your mobile number. Complete payment within 1 hour.",
  },
  {
    id: "bank_transfer",             // ← backend: case 'bank_transfer'
    label: "Bank Transfer",
    icon: "🏦",
    tag: "Bank",
    tagColor: "#6366f1",
    desc: "BPI, BDO, Metrobank, UnionBank, Landbank, PNB",
    fields: [
      { name: "bank_name",        label: "Bank Name",        placeholder: "e.g. BPI, BDO, Metrobank" },
      { name: "account_name",     label: "Account Name",     placeholder: "Your account name" },
      { name: "account_number",   label: "Account Number",   placeholder: "Your account number" },
      { name: "reference_number", label: "Reference Number", placeholder: "Transaction reference (after transfer)" },
    ],
    note: "Transfer to: BPI Savings — JEM 8 Circle Trading Co. — Account No. 1234-5678-90. Send proof of payment to our email.",
  },
  {
    id: "cod",                       // ← backend: case 'cod'
    label: "Cash on Delivery",
    icon: "💵",
    tag: "COD",
    tagColor: "#f59e0b",
    desc: "Pay cash when your order arrives",
    fields: [],
    note: "Prepare the exact amount upon delivery. Our courier will contact you before arriving. COD available within Metro Manila and Laguna only.",
  },
  {
    id: "check",                     // ← backend: case 'check'
    label: "Check Payment",
    icon: "📄",
    tag: "Check",
    tagColor: "#64748b",
    desc: "Pay by post-dated or manager's check",
    fields: [
      { name: "bank_name",     label: "Issuing Bank",     placeholder: "e.g. BDO, BPI" },
      { name: "check_number",  label: "Check Number",     placeholder: "Check number" },
      { name: "check_date",    label: "Check Date",       type: "date" },
      { name: "check_amount",  label: "Check Amount (₱)", placeholder: "Amount in pesos", type: "number" },
    ],
    note: "Make check payable to: JEM 8 Circle Trading Co. Deliver check to our Makati office or hand to our sales representative.",
  },
];

const STEPS = ["Delivery", "Payment", "Review"];

const ADDR_PICKER_STYLES = `
  .co-user-card {
    display: flex;
    align-items: center;
    gap: 14px;
    background: #f4f8f6;
    border: 1.5px solid #d0e8db;
    border-radius: 12px;
    padding: 14px 16px;
    margin-bottom: 20px;
  }
  .co-user-card__avatar {
    width: 42px; height: 42px;
    background: #4d7b65;
    color: #fff;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700;
    flex-shrink: 0;
  }
  .co-user-card__info { flex: 1; min-width: 0; }
  .co-user-card__name {
    font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 2px;
  }
  .co-user-card__meta {
    font-size: 12px; color: #666; line-height: 1.5;
  }
  .co-user-card__edit {
    font-size: 12px; color: #4d7b65; font-weight: 500;
    text-decoration: none; white-space: nowrap;
    padding: 5px 10px; border-radius: 7px;
    border: 1.5px solid #c0ddd0;
    background: #fff;
    transition: background 0.15s;
  }
  .co-user-card__edit:hover { background: #e8f5ef; }
  .co-addr-mode-toggle {
    display: flex;
    gap: 8px;
    margin-bottom: 18px;
  }
  .co-addr-mode-btn {
    flex: 1;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1.5px solid #e0e9e4;
    background: #fafafa;
    font-size: 13px;
    font-weight: 500;
    color: #666;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
  }
  .co-addr-mode-btn:hover { border-color: #4d7b65; color: #4d7b65; }
  .co-addr-mode-btn.active {
    border-color: #4d7b65;
    background: #4d7b65;
    color: #fff;
    font-weight: 600;
  }
  .co-saved-addresses {
    margin-bottom: 4px;
  }
  .co-saved-addresses__label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #5a7a68;
    margin-bottom: 12px;
  }
  .co-saved-addresses__list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .co-addr-card {
    flex: 1 1 200px;
    min-width: 180px;
    text-align: left;
    background: #fff;
    border: 1.5px solid #e0e9e4;
    border-radius: 12px;
    padding: 14px 16px;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
    font-family: inherit;
  }
  .co-addr-card:hover {
    border-color: #4d7b65;
    box-shadow: 0 2px 10px rgba(77,123,101,0.10);
  }
  .co-addr-card--active {
    border-color: #4d7b65;
    background: #f0f7f3;
    box-shadow: 0 0 0 3px rgba(77,123,101,0.13);
  }
  .co-addr-card__badge {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #5a7a68;
    margin-bottom: 6px;
  }
  .co-addr-card__company {
    font-size: 13px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 3px;
  }
  .co-addr-card__line {
    font-size: 13px;
    color: #444;
    line-height: 1.65;
  }
  .co-addr-card__contacts {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid #eee;
    font-size: 11px;
    color: #888;
  }
  .co-addr-card__check-wrap {
    margin-top: 10px;
  }
  .co-addr-card__check {
    font-size: 12px;
    font-weight: 700;
    color: #4d7b65;
  }
  .co-addr-card__select {
    font-size: 11px;
    color: #bbb;
  }
  .co-addr-autosave-note {
    font-size: 12px;
    color: #5a7a68;
    background: #f0f7f3;
    border: 1px solid #c8e4d4;
    border-radius: 8px;
    padding: 9px 13px;
    margin-top: 4px;
  }
`;

export default function Checkout() {
  const navigate = useNavigate();

  // ── Cart state ─────────────────────────────────────────────────────────────
  const [items, setItems]             = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [cartError, setCartError]     = useState(null);
  // console.log(items)

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoadingCart(true);
        setCartError(null);
        const res       = await axios.get(`${BASE}/cart`, { withCredentials: true });
        const cartItems = res.data.cartItems ?? [];
        const formatted = cartItems.map((c) => ({
          id:        c.cart_id,
          productId: c.product?.product_id,
          name:      c.product?.product_name || "Unknown product",
          image:
            c.product?.primary_image_url ||
            (c.product?.images?.find((img) => img.is_primary)?.image_path
              ? `http://127.0.0.1:8000/storage/${c.product.images.find((img) => img.is_primary).image_path}`
              : "https://placehold.co/80x80"),
          rawPrice: Number(c.product?.price || 0),
          price:    `₱${Number(c.product?.price || 0).toLocaleString()}`,
          qty:      c.quantity,
          cat:      c.product?.category_id || "Product",
        }));
        setItems(formatted);
      } catch (err) {
        setCartError(err.response?.data?.message || "Failed to load cart.");
      } finally {
        setLoadingCart(false);
      }
    };
    fetchCart();
  }, []);

  // ── Current user ───────────────────────────────────────────────────────────
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await axios.get(`${BASE}/me`, { withCredentials: true });
        setUser(res.data?.data ?? res.data);
      } catch {
        // unauthenticated
      }
    };
    fetchMe();
  }, []);

  // ── Step / form state ──────────────────────────────────────────────────────
  const [step, setStep]               = useState(0);
  const [payMethod, setPayMethod]     = useState("gcash");
  const [payFields, setPayFields]     = useState({});
  const [specialNote, setSpecialNote] = useState("");
  const [placing, setPlacing]         = useState(false);
  const [placeError, setPlaceError]   = useState(null);

  const [delivery, setDelivery] = useState({
    address: "", barangay: "", city: "", province: "", zip: "",
  });

  // ── Saved addresses ────────────────────────────────────────────────────────
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddrId, setSelectedAddrId] = useState(null);
  const [addrMode, setAddrMode]             = useState("detect");

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res  = await getUserAddresses();
        const data = res.data?.data ?? res.data ?? [];
        const list = Array.isArray(data) ? data : [];
        setSavedAddresses(list);
        setAddrMode(list.length > 0 ? "saved" : "new");
      } catch {
        setAddrMode("new");
      }
    };
    fetchAddresses();
  }, []);

  const selectSavedAddress = (addr) => setSelectedAddrId(addr.id);
  const deselectAddress    = ()     => setSelectedAddrId(null);
  const selectedAddr = savedAddresses.find((a) => a.id === selectedAddrId) || null;

  const contactValid  = !!(user?.first_name && user?.email);
  const deliveryValid = addrMode === "saved"
    ? contactValid && !!selectedAddrId
    : contactValid && delivery.address && delivery.city && delivery.province;

  // ── Derived totals ─────────────────────────────────────────────────────────
  const subtotal    = items.reduce((sum, i) => sum + i.rawPrice * i.qty, 0);
  const shippingFee = subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE;
  const total       = subtotal + shippingFee;

  const handleDeliveryChange = (e) =>
    setDelivery((d) => ({ ...d, [e.target.name]: e.target.value }));

  const handlePayFieldChange = (e) =>
    setPayFields((f) => ({ ...f, [e.target.name]: e.target.value }));

  const activePayment = PAYMENT_METHODS.find((m) => m.id === payMethod);

  // ── Place order ────────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    setPlacing(true);
    setPlaceError(null);

    // Resolve shipping address
    let resolvedAddress;
    if (addrMode === "saved" && selectedAddr) {
      resolvedAddress = {
        address:  selectedAddr.street      || "",
        barangay: selectedAddr.barangay    || "",
        city:     selectedAddr.city        || "",
        province: selectedAddr.province    || "",
        zip:      selectedAddr.postal_code || "",
      };
    } else {
      resolvedAddress = { ...delivery };

      // Auto-save address if first time
      if (savedAddresses.length === 0) {
        try {
          const { addAddress } = await import("../api/address");
          const newAddr = await addAddress({
            type:        "personal",
            street:      delivery.address,
            barangay:    delivery.barangay,
            city:        delivery.city,
            province:    delivery.province,
            postal_code: delivery.zip, 
            country:     "Philippines",
            status:      "active",
          });
          if (newAddr?.data) {
            setSavedAddresses([newAddr.data?.data ?? newAddr.data]);
          }
        } catch {
          // non-blocking
        }
      }
    }

    const billingAddress = [
      resolvedAddress.address,
      resolvedAddress.barangay,
      resolvedAddress.city,
      resolvedAddress.province,
      resolvedAddress.zip,
    ].filter(Boolean).join(", ");

    // ── Build payment_details to match backend expectations ──
    // Backend reads: payment_details.mobile_number, payment_details.account_name, etc.
    // We pass payFields directly — field names already match (mobile_number, account_name, etc.)
    const paymentDetails = {
      ...payFields,
      // Attach contact info for all methods
      first_name:      user?.first_name   || "",
      last_name:       user?.last_name    || "",
      email:           user?.email        || "",
      phone:           user?.phone_number || "",
      billing_address: billingAddress,
    };

    // ── Payload: payment_method is the raw id (gcash, cod, bank_transfer, etc.) ──
    const payload = {
      cart_id: items[0].id,
      payment_method:       payMethod,          // ← "gcash" | "maya" | "bank_transfer" | "cod" | "check"
      payment_details:      paymentDetails,
      shipping_fee:         shippingFee,
      special_instructions: specialNote || null,
    };
    console.log(payload)
    try {
      const res = await axios.post(`${BASE}/checkout`, payload, { withCredentials: true });
      const { checkout_id } = res.data;
      navigate(`/orders?new=${checkout_id}`);
    } catch (err) {
      setPlaceError(
        err.response?.data?.message || "Failed to place order. Please try again."
      );
      setPlacing(false);
    }
  };

  // ── Loading / error / empty states ────────────────────────────────────────
  if (loadingCart) {
    return (
      <div className="checkout-page">
        <Header />
        <div className="cart-empty">
          <div className="container cart-empty__inner">
            <div className="cart-empty__icon">⏳</div>
            <h2 className="cart-empty__title">Loading your cart…</h2>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (cartError) {
    return (
      <div className="checkout-page">
        <Header />
        <div className="cart-empty">
          <div className="container cart-empty__inner">
            <div className="cart-empty__icon">⚠️</div>
            <h2 className="cart-empty__title">Something went wrong</h2>
            <p className="cart-empty__desc">{cartError}</p>
            <button className="btn-primary" onClick={() => window.location.reload()}>Try Again</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

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

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="checkout-page">
      <style>{ADDR_PICKER_STYLES}</style>
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
            <div
              key={s}
              className={`co-progress__step${i <= step ? " active" : ""}${i < step ? " done" : ""}`}
            >
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

                <div className="co-user-card">
                  <div className="co-user-card__avatar">
                    {user ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() : "…"}
                  </div>
                  <div className="co-user-card__info">
                    <div className="co-user-card__name">
                      {user ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() : "Loading…"}
                    </div>
                    <div className="co-user-card__meta">{user?.email || "—"}</div>
                    {user?.phone_number && (
                      <div className="co-user-card__meta">{user.phone_number}</div>
                    )}
                  </div>
                  <Link to="/Profilepersonal" className="co-user-card__edit" title="Edit profile">
                    ✏️ Edit
                  </Link>
                </div>

                {savedAddresses.length > 0 && (
                  <div className="co-addr-mode-toggle">
                    <button
                      type="button"
                      className={`co-addr-mode-btn${addrMode === "saved" ? " active" : ""}`}
                      onClick={() => setAddrMode("saved")}
                    >
                      📍 My Saved Addresses
                    </button>
                    <button
                      type="button"
                      className={`co-addr-mode-btn${addrMode === "new" ? " active" : ""}`}
                      onClick={() => { setAddrMode("new"); setSelectedAddrId(null); }}
                    >
                      ✏️ Use a Different Address
                    </button>
                  </div>
                )}

                {addrMode === "saved" && savedAddresses.length > 0 && (
                  <div className="co-saved-addresses">
                    <div className="co-saved-addresses__label">Select a delivery address</div>
                    <div className="co-saved-addresses__list">
                      {savedAddresses.map((addr) => {
                        const isCompany = addr.type === "company";
                        const isActive  = selectedAddrId === addr.id;
                        const lines = [
                          addr.street,
                          [addr.barangay, addr.city].filter(Boolean).join(", "),
                          [addr.province, addr.postal_code].filter(Boolean).join(" "),
                          addr.country,
                        ].filter(Boolean);
                        return (
                          <button
                            key={addr.id}
                            type="button"
                            className={`co-addr-card${isActive ? " co-addr-card--active" : ""}`}
                            onClick={() => isActive ? deselectAddress() : selectSavedAddress(addr)}
                          >
                            <div className="co-addr-card__badge">
                              {isCompany ? "🏢 Company" : "👤 Personal"}
                            </div>
                            {isCompany && addr.company_name && (
                              <div className="co-addr-card__company">{addr.company_name}</div>
                            )}
                            {lines.map((line, i) => (
                              <div key={i} className="co-addr-card__line">{line}</div>
                            ))}
                            {isCompany && (addr.company_number || addr.company_email) && (
                              <div className="co-addr-card__contacts">
                                {addr.company_number && <span>📞 {addr.company_number}</span>}
                                {addr.company_email  && <span>✉ {addr.company_email}</span>}
                              </div>
                            )}
                            <div className="co-addr-card__check-wrap">
                              {isActive
                                ? <span className="co-addr-card__check">✓ Delivering here</span>
                                : <span className="co-addr-card__select">Tap to select</span>
                              }
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {addrMode === "new" && (
                  <div className="co-form-grid">
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
                    {savedAddresses.length === 0 && (
                      <div className="co-addr-autosave-note co-field--full">
                        💾 This address will be saved to your profile automatically.
                      </div>
                    )}
                  </div>
                )}

                <button
                  className="co-next-btn"
                  onClick={() => setStep(1)}
                  disabled={!deliveryValid}
                  style={{ marginTop: 24 }}
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
                      onClick={() => { setPayMethod(m.id); setPayFields({}); }}
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
                  <div className="co-pay-note">ℹ️ {activePayment.note}</div>
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
                    <strong>{user?.first_name} {user?.last_name}</strong><br />
                    {user?.phone_number && <>{user.phone_number} · </>}{user?.email}<br />
                    {addrMode === "saved" && selectedAddr ? (
                      <>
                        {selectedAddr.street}{selectedAddr.barangay ? `, ${selectedAddr.barangay}` : ""},{" "}
                        {selectedAddr.city}, {selectedAddr.province} {selectedAddr.postal_code}
                      </>
                    ) : (
                      <>
                        {delivery.address},{delivery.barangay && ` ${delivery.barangay},`} {delivery.city}, {delivery.province} {delivery.zip}
                      </>
                    )}
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
                      v ? <div key={k} className="co-review-field">{k.replace(/_/g, " ")}: {v}</div> : null
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
                        <div className="co-review-item__price">
                          ₱{(item.rawPrice * item.qty).toLocaleString()}
                        </div>
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

                {placeError && (
                  <div className="co-pay-note" style={{ borderColor: "#ef4444", color: "#ef4444", background: "#fef2f2" }}>
                    ⚠️ {placeError}
                  </div>
                )}

                <div className="co-step-nav">
                  <button className="co-back-btn" onClick={() => setStep(1)} disabled={placing}>
                    ← Back
                  </button>
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
                    <div className="co-summary__item-price">
                      ₱{(item.rawPrice * item.qty).toLocaleString()}
                    </div>
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