import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Header, Footer } from "../components/Layout";
import { getUserAddresses } from "../api/address";

const ph = (w, h, label = "") =>
  `https://placehold.co/${w}x${h}/edf4f0/4d7b65?text=${encodeURIComponent(label)}`;

const BASE = "http://127.0.0.1:8000/api";
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
      { name: "mobile_number", label: "GCash Mobile Number", placeholder: "09XXXXXXXXX", type: "tel" },
      { name: "account_name", label: "GCash Account Name",   placeholder: "Full Name on GCash" },
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
      { name: "mobile_number", label: "Maya Mobile Number", placeholder: "09XXXXXXXXX", type: "tel" },
      { name: "account_name", label: "Maya Account Name",   placeholder: "Full Name on Maya" },
    ],
    note: "A Maya payment link will be sent to your mobile number. Complete payment within 1 hour.",
  },
  {
    id: "bank_transfer",
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
      { name: "bank_name",    label: "Issuing Bank",     placeholder: "e.g. BDO, BPI" },
      { name: "check_number", label: "Check Number",     placeholder: "Check number" },
      { name: "check_date",   label: "Check Date",       type: "date" },
      { name: "check_amount", label: "Check Amount (₱)", placeholder: "Amount in pesos", type: "number" },
    ],
    note: "Make check payable to: JEM 8 Circle Trading Co. Deliver check to our Makati office or hand to our sales representative.",
  },
];

const STEPS = ["Delivery", "Payment", "Review"];

// ── Shared input class ────────────────────────────────────────
const inputCls = "w-full px-3.5 py-2.5 border-[1.5px] border-[#d1e8da] rounded-xl text-sm text-[#1a2e22] bg-[#fafcfb] outline-none transition-colors focus:border-[#4d7b65] focus:bg-white placeholder-[#9ca3af] font-[inherit]";
const labelCls = "text-[13px] font-semibold text-slate-700";

export default function Checkout() {
  const navigate = useNavigate();

  const [items, setItems]             = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [cartError, setCartError]     = useState(null);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoadingCart(true);
        setCartError(null);
        const res       = await axios.get(`${BASE}/cart?isCheckout=false`, { withCredentials: true });
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

  const [user, setUser] = useState(null);
  useEffect(() => {
    axios.get(`${BASE}/me`, { withCredentials: true })
      .then((res) => setUser(res.data?.data ?? res.data))
      .catch(() => {});
  }, []);

  const [step, setStep]               = useState(0);
  const [payMethod, setPayMethod]     = useState("gcash");
  const [payFields, setPayFields]     = useState({});
  const [specialNote, setSpecialNote] = useState("");
  const [placing, setPlacing]         = useState(false);
  const [placeError, setPlaceError]   = useState(null);
  const [delivery, setDelivery]       = useState({ address: "", barangay: "", city: "", province: "", zip: "" });
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddrId, setSelectedAddrId] = useState(null);
  const [addrMode, setAddrMode]             = useState("detect");

  useEffect(() => {
    getUserAddresses()
      .then((res) => {
        const data = res.data?.data ?? res.data ?? [];
        const list = Array.isArray(data) ? data : [];
        setSavedAddresses(list);
        setAddrMode(list.length > 0 ? "saved" : "new");
      })
      .catch(() => setAddrMode("new"));
  }, []);

  const selectSavedAddress = (addr) => setSelectedAddrId(addr.id);
  const deselectAddress    = ()     => setSelectedAddrId(null);
  const selectedAddr = savedAddresses.find((a) => a.id === selectedAddrId) || null;

  const contactValid  = !!(user?.first_name && user?.email);
  const deliveryValid = addrMode === "saved"
    ? contactValid && !!selectedAddrId
    : contactValid && delivery.address && delivery.city && delivery.province;

  const subtotal    = items.reduce((sum, i) => sum + i.rawPrice * i.qty, 0);
  const shippingFee = subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE;
  const total       = subtotal + shippingFee;

  const handleDeliveryChange = (e) => setDelivery((d) => ({ ...d, [e.target.name]: e.target.value }));
  const handlePayFieldChange = (e) => setPayFields((f) => ({ ...f, [e.target.name]: e.target.value }));
  const activePayment = PAYMENT_METHODS.find((m) => m.id === payMethod);

  const handlePlaceOrder = async () => {
    setPlacing(true);
    setPlaceError(null);
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
      if (savedAddresses.length === 0) {
        try {
          const { addAddress } = await import("../api/address");
          const newAddr = await addAddress({
            type: "personal", street: delivery.address, barangay: delivery.barangay,
            city: delivery.city, province: delivery.province,
            postal_code: delivery.zip, country: "Philippines", status: "active",
          });
          if (newAddr?.data) setSavedAddresses([newAddr.data?.data ?? newAddr.data]);
        } catch {}
      }
    }
    const billingAddress = [
      resolvedAddress.address, resolvedAddress.barangay,
      resolvedAddress.city, resolvedAddress.province, resolvedAddress.zip,
    ].filter(Boolean).join(", ");

    const paymentDetails = {
      ...payFields,
      first_name: user?.first_name || "", last_name: user?.last_name || "",
      email: user?.email || "", phone: user?.phone_number || "",
      billing_address: billingAddress,
    };

    const payload = {
      cart_id: items[0].id,
      payment_method:       payMethod,
      payment_details:      paymentDetails,
      shipping_fee:         shippingFee,
      special_instructions: specialNote || null,
    };

    try {
      const res = await axios.post(`${BASE}/checkout`, payload, { withCredentials: true });
      navigate(`/orders?new=${res.data.checkout_id}`);
    } catch (err) {
      setPlaceError(err.response?.data?.message || "Failed to place order. Please try again.");
      setPlacing(false);
    }
  };

  // ── Empty / loading states ────────────────────────────────────
  const EmptyShell = ({ icon, title, desc, action }) => (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">{icon}</div>
          <h2 className="text-xl font-bold text-[#1a2e22] mb-2">{title}</h2>
          {desc && <p className="text-sm text-slate-500 mb-5">{desc}</p>}
          {action}
        </div>
      </div>
      <Footer />
    </div>
  );

  if (loadingCart) return <EmptyShell icon="⏳" title="Loading your cart…" />;
  if (cartError)   return (
    <EmptyShell icon="⚠️" title="Something went wrong" desc={cartError}
      action={<button className="px-6 py-2.5 bg-[#4d7b65] text-white rounded-xl text-sm font-bold cursor-pointer border-none" onClick={() => window.location.reload()}>Try Again</button>}
    />
  );
  if (items.length === 0) return (
    <EmptyShell icon="🛒" title="No items to checkout"
      action={<Link to="/products" className="inline-block px-6 py-2.5 bg-[#4d7b65] text-white rounded-xl text-sm font-bold no-underline">Browse Products →</Link>}
    />
  );

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <Header />

      {/* ── Breadcrumb ── */}
      <div className="bg-[#f8faf9] border-b border-[#e8f0eb] mt-[75px]">
        <div className="container mx-auto px-4 flex items-center gap-2 py-3 text-xs text-[#6b7c70] flex-wrap">
          <Link to="/" className="text-[#4d7b65] no-underline hover:underline">Home</Link>
          <span className="text-gray-300">›</span>
          <Link to="/cart" className="text-[#4d7b65] no-underline hover:underline">Cart</Link>
          <span className="text-gray-300">›</span>
          <span>Checkout</span>
        </div>
      </div>

      {/* ── Progress ── */}
      <div className="bg-white border-b border-[#e8f0eb] py-5">
        <div className="container mx-auto px-4 flex items-center justify-center gap-0">
          {STEPS.map((s, i) => {
            const isDone   = i < step;
            const isActive = i <= step;
            return (
              <div key={s} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 transition-all
                    ${isDone   ? "bg-green-600 text-white"
                    : isActive ? "bg-[#4d7b65] text-white"
                    :            "bg-[#e8f0eb] text-[#9ca3af]"}`}>
                    {isDone ? "✓" : i + 1}
                  </div>
                  <span className={`text-[13px] font-semibold transition-colors hidden sm:block
                    ${isDone   ? "text-green-600"
                    : isActive ? "text-[#4d7b65]"
                    :            "text-[#9ca3af]"}`}>
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-10 sm:w-16 h-0.5 mx-2 transition-colors ${isDone ? "bg-green-600" : isActive ? "bg-[#4d7b65]" : "bg-[#e8f0eb]"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main Grid ── */}
      <section className="py-10 pb-20">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">

          {/* ── LEFT PANEL ── */}
          <div>

            {/* STEP 0 — DELIVERY */}
            {step === 0 && (
              <div className="bg-white border-[1.5px] border-[#e8f0eb] rounded-2xl p-8">
                <h2 className="text-xl font-bold text-[#1a2e22] mb-6">📦 Delivery Information</h2>

                {/* User card */}
                <div className="flex items-center gap-3.5 bg-[#f4f8f6] border-[1.5px] border-[#d0e8db] rounded-xl px-4 py-3.5 mb-5">
                  <div className="w-11 h-11 rounded-full bg-[#4d7b65] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {user ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() : "…"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#1a1a1a] mb-0.5">
                      {user ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() : "Loading…"}
                    </div>
                    <div className="text-xs text-[#666]">{user?.email || "—"}</div>
                    {user?.phone_number && <div className="text-xs text-[#666]">{user.phone_number}</div>}
                  </div>
                  <Link to="/Profilepersonal" className="text-xs text-[#4d7b65] font-medium no-underline px-2.5 py-1.5 rounded-lg border-[1.5px] border-[#c0ddd0] bg-white hover:bg-[#e8f5ef] transition-colors whitespace-nowrap">
                    ✏️ Edit
                  </Link>
                </div>

                {/* Mode toggle */}
                {savedAddresses.length > 0 && (
                  <div className="flex gap-2 mb-4.5">
                    <button
                      type="button"
                      onClick={() => setAddrMode("saved")}
                      className={`flex-1 px-3.5 py-2.5 rounded-xl border-[1.5px] text-[13px] font-medium cursor-pointer transition-all font-[inherit]
                        ${addrMode === "saved"
                          ? "border-[#4d7b65] bg-[#4d7b65] text-white font-semibold"
                          : "border-[#e0e9e4] bg-[#fafafa] text-[#666] hover:border-[#4d7b65] hover:text-[#4d7b65]"
                        }`}
                    >
                      📍 My Saved Addresses
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAddrMode("new"); setSelectedAddrId(null); }}
                      className={`flex-1 px-3.5 py-2.5 rounded-xl border-[1.5px] text-[13px] font-medium cursor-pointer transition-all font-[inherit]
                        ${addrMode === "new"
                          ? "border-[#4d7b65] bg-[#4d7b65] text-white font-semibold"
                          : "border-[#e0e9e4] bg-[#fafafa] text-[#666] hover:border-[#4d7b65] hover:text-[#4d7b65]"
                        }`}
                    >
                      ✏️ Use a Different Address
                    </button>
                  </div>
                )}

                {/* Saved addresses list */}
                {addrMode === "saved" && savedAddresses.length > 0 && (
                  <div className="mb-1">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-[#5a7a68] mb-3">Select a delivery address</div>
                    <div className="flex flex-wrap gap-2.5">
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
                            onClick={() => isActive ? deselectAddress() : selectSavedAddress(addr)}
                            className={`flex-1 min-w-[180px] text-left bg-white border-[1.5px] rounded-xl px-4 py-3.5 cursor-pointer transition-all font-[inherit]
                              ${isActive
                                ? "border-[#4d7b65] bg-[#f0f7f3] shadow-[0_0_0_3px_rgba(77,123,101,0.13)]"
                                : "border-[#e0e9e4] hover:border-[#4d7b65] hover:shadow-[0_2px_10px_rgba(77,123,101,0.10)]"
                              }`}
                          >
                            <div className="text-[10px] font-bold uppercase tracking-wide text-[#5a7a68] mb-1.5">
                              {isCompany ? "🏢 Company" : "👤 Personal"}
                            </div>
                            {isCompany && addr.company_name && (
                              <div className="text-[13px] font-semibold text-[#1a1a1a] mb-0.5">{addr.company_name}</div>
                            )}
                            {lines.map((line, i) => (
                              <div key={i} className="text-[13px] text-[#444] leading-relaxed">{line}</div>
                            ))}
                            {isCompany && (addr.company_number || addr.company_email) && (
                              <div className="flex flex-col gap-0.5 mt-1.5 pt-1.5 border-t border-[#eee] text-[11px] text-[#888]">
                                {addr.company_number && <span>📞 {addr.company_number}</span>}
                                {addr.company_email  && <span>✉ {addr.company_email}</span>}
                              </div>
                            )}
                            <div className="mt-2.5">
                              {isActive
                                ? <span className="text-xs font-bold text-[#4d7b65]">✓ Delivering here</span>
                                : <span className="text-[11px] text-[#bbb]">Tap to select</span>
                              }
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* New address form */}
                {addrMode === "new" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                      <label className={labelCls}>Street Address / Building / Unit *</label>
                      <input name="address" value={delivery.address} onChange={handleDeliveryChange} placeholder="e.g. Unit 202, Cityland Tower, HV Dela Costa St." className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelCls}>Barangay</label>
                      <input name="barangay" value={delivery.barangay} onChange={handleDeliveryChange} placeholder="Barangay name" className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelCls}>City / Municipality *</label>
                      <input name="city" value={delivery.city} onChange={handleDeliveryChange} placeholder="Makati City" className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelCls}>Province *</label>
                      <input name="province" value={delivery.province} onChange={handleDeliveryChange} placeholder="Metro Manila" className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelCls}>ZIP Code</label>
                      <input name="zip" value={delivery.zip} onChange={handleDeliveryChange} placeholder="1227" className={inputCls} />
                    </div>
                    {savedAddresses.length === 0 && (
                      <div className="sm:col-span-2 text-xs text-[#5a7a68] bg-[#f0f7f3] border border-[#c8e4d4] rounded-lg px-3.5 py-2.5">
                        💾 This address will be saved to your profile automatically.
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setStep(1)}
                  disabled={!deliveryValid}
                  className="mt-6 w-full sm:w-auto px-7 py-3.5 bg-[#3d6552] text-white border-none rounded-xl text-[15px] font-bold cursor-pointer transition-all hover:not-disabled:-translate-y-px hover:not-disabled:shadow-[0_4px_14px_rgba(77,123,101,0.25)] disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  Continue to Payment →
                </button>
              </div>
            )}

            {/* STEP 1 — PAYMENT */}
            {step === 1 && (
              <div className="bg-white border-[1.5px] border-[#e8f0eb] rounded-2xl p-8">
                <h2 className="text-xl font-bold text-[#1a2e22] mb-6">💳 Select Method of Payment</h2>

                {/* Payment method list */}
                <div className="flex flex-col gap-2.5 mb-6">
                  {PAYMENT_METHODS.map((m) => {
                    const isActive = payMethod === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => { setPayMethod(m.id); setPayFields({}); }}
                        className={`flex items-center gap-3.5 px-4 py-4 border-[1.5px] rounded-2xl cursor-pointer transition-all
                          ${isActive
                            ? "border-[#4d7b65] bg-[#f0f7f3] shadow-[0_0_0_3px_rgba(77,123,101,0.08)]"
                            : "border-[#e8f0eb] bg-[#fafcfb] hover:border-[#4d7b65] hover:bg-[#f3f8f5]"
                          }`}
                      >
                        {/* Radio dot */}
                        <div className={`w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 transition-all
                          ${isActive ? "border-[#4d7b65]" : "border-[#d1e8da]"}`}
                          style={isActive ? { background: "radial-gradient(circle at center, #4d7b65 6px, transparent 6px)" } : {}}
                        />
                        <span className="text-2xl flex-shrink-0">{m.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="block text-[15px] font-bold text-[#1a2e22]">{m.label}</span>
                          <span className="block text-xs text-[#6b7c70] mt-0.5">{m.desc}</span>
                        </div>
                        <span
                          className="text-[11px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0 whitespace-nowrap"
                          style={{ background: m.tagColor + "22", color: m.tagColor, borderColor: m.tagColor + "44" }}
                        >
                          {m.tag}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Payment fields */}
                {activePayment.fields.length > 0 && (
                  <div className="bg-[#f8faf9] border-[1.5px] border-[#e8f0eb] rounded-xl p-5 mb-4">
                    <h3 className="text-sm font-bold text-[#1a2e22] mb-4">{activePayment.label} Details</h3>
                    <div className="flex flex-col gap-3">
                      {activePayment.fields.map((f) => (
                        <div key={f.name} className="flex flex-col gap-1.5">
                          <label className={labelCls}>{f.label}</label>
                          <input
                            name={f.name}
                            type={f.type || "text"}
                            placeholder={f.placeholder || ""}
                            value={payFields[f.name] || ""}
                            onChange={handlePayFieldChange}
                            className={inputCls}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pay note */}
                {activePayment.note && (
                  <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-xl px-4 py-3 text-[13px] text-[#1e40af] leading-relaxed mb-4">
                    ℹ️ {activePayment.note}
                  </div>
                )}

                {/* Special instructions */}
                <div className="flex flex-col gap-1.5 mt-6">
                  <label className={labelCls}>Special Instructions (optional)</label>
                  <textarea
                    placeholder="Any special delivery instructions or notes for your order..."
                    value={specialNote}
                    onChange={(e) => setSpecialNote(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-3 border-[1.5px] border-[#d1e8da] rounded-xl text-sm text-[#1a2e22] bg-[#fafcfb] outline-none resize-y transition-colors focus:border-[#4d7b65] focus:bg-white box-border font-[inherit]"
                  />
                </div>

                {/* Nav buttons */}
                <div className="flex justify-between items-center mt-6 gap-3">
                  <button
                    onClick={() => setStep(0)}
                    className="px-6 py-3 bg-transparent border-[1.5px] border-[#e8f0eb] rounded-xl text-sm font-semibold text-slate-600 cursor-pointer hover:border-[#4d7b65] hover:text-[#4d7b65] transition-all"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="px-7 py-3.5 bg-[#3d6552] text-white border-none rounded-xl text-[15px] font-bold cursor-pointer hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(77,123,101,0.25)] transition-all"
                  >
                    Review Order →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 — REVIEW */}
            {step === 2 && (
              <div className="bg-white border-[1.5px] border-[#e8f0eb] rounded-2xl p-8">
                <h2 className="text-xl font-bold text-[#1a2e22] mb-6">✅ Review Your Order</h2>

                {/* Delivery block */}
                <div className="border-[1.5px] border-[#e8f0eb] rounded-xl overflow-hidden mb-4">
                  <div className="flex justify-between items-center px-4 py-3 bg-[#f8faf9] border-b border-[#e8f0eb] text-[13px] font-bold text-slate-700">
                    <span>📦 Delivery Address</span>
                    <button onClick={() => setStep(0)} className="bg-transparent border-none text-[13px] text-[#4d7b65] font-bold cursor-pointer p-0 hover:underline">Edit</button>
                  </div>
                  <div className="px-4 py-4 text-sm text-slate-600 leading-relaxed">
                    <strong>{user?.first_name} {user?.last_name}</strong><br />
                    {user?.phone_number && <>{user.phone_number} · </>}{user?.email}<br />
                    {addrMode === "saved" && selectedAddr ? (
                      <>{selectedAddr.street}{selectedAddr.barangay ? `, ${selectedAddr.barangay}` : ""}, {selectedAddr.city}, {selectedAddr.province} {selectedAddr.postal_code}</>
                    ) : (
                      <>{delivery.address},{delivery.barangay && ` ${delivery.barangay},`} {delivery.city}, {delivery.province} {delivery.zip}</>
                    )}
                  </div>
                </div>

                {/* Payment block */}
                <div className="border-[1.5px] border-[#e8f0eb] rounded-xl overflow-hidden mb-4">
                  <div className="flex justify-between items-center px-4 py-3 bg-[#f8faf9] border-b border-[#e8f0eb] text-[13px] font-bold text-slate-700">
                    <span>💳 Payment Method</span>
                    <button onClick={() => setStep(1)} className="bg-transparent border-none text-[13px] text-[#4d7b65] font-bold cursor-pointer p-0 hover:underline">Edit</button>
                  </div>
                  <div className="px-4 py-4 text-sm text-slate-600">
                    <strong>{activePayment.icon} {activePayment.label}</strong>
                    {Object.entries(payFields).map(([k, v]) =>
                      v ? <div key={k} className="text-[13px] text-[#6b7c70] mt-1">{k.replace(/_/g, " ")}: {v}</div> : null
                    )}
                  </div>
                </div>

                {/* Items block */}
                <div className="border-[1.5px] border-[#e8f0eb] rounded-xl overflow-hidden mb-4">
                  <div className="px-4 py-3 bg-[#f8faf9] border-b border-[#e8f0eb] text-[13px] font-bold text-slate-700">
                    🛒 Items ({items.length})
                  </div>
                  <div className="px-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3.5 py-3 border-b border-[#f0f4f1] last:border-b-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 rounded-xl object-cover bg-[#f3f8f5] flex-shrink-0"
                          onError={(e) => { e.target.src = ph(60, 60, item.name); }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-[#1a2e22] truncate">{item.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">Qty: {item.qty}</div>
                        </div>
                        <div className="text-[15px] font-bold text-[#4d7b65] flex-shrink-0">
                          ₱{(item.rawPrice * item.qty).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special note */}
                {specialNote && (
                  <div className="border-[1.5px] border-[#e8f0eb] rounded-xl overflow-hidden mb-4">
                    <div className="px-4 py-3 bg-[#f8faf9] border-b border-[#e8f0eb] text-[13px] font-bold text-slate-700">📝 Special Instructions</div>
                    <div className="px-4 py-4 text-sm text-slate-600">{specialNote}</div>
                  </div>
                )}

                {/* Error */}
                {placeError && (
                  <div className="bg-[#fef2f2] border border-red-200 rounded-xl px-4 py-3 text-[13px] text-red-600 mb-4">
                    ⚠️ {placeError}
                  </div>
                )}

                {/* Nav buttons */}
                <div className="flex justify-between items-center mt-6 gap-3">
                  <button
                    onClick={() => setStep(1)}
                    disabled={placing}
                    className="px-6 py-3 bg-transparent border-[1.5px] border-[#e8f0eb] rounded-xl text-sm font-semibold text-slate-600 cursor-pointer hover:border-[#4d7b65] hover:text-[#4d7b65] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placing}
                    className={`flex-1 px-6 py-4 bg-[#4d7b65] text-white border-none rounded-xl text-[15px] font-bold text-center transition-all
                      ${placing
                        ? "opacity-70 cursor-not-allowed"
                        : "cursor-pointer hover:bg-[#3d6552] hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(77,123,101,0.25)]"
                      }`}
                  >
                    {placing ? "Placing Order..." : "Place Order & Confirm Payment →"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT — ORDER SUMMARY ── */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-white border-[1.5px] border-[#e8f0eb] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-[#1a2e22] mb-4">Order Summary</h2>

              {/* Items */}
              <div className="mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-2 border-b border-[#f3f8f5] last:border-b-0">
                    <div className="relative flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover bg-[#f3f8f5]"
                        onError={(e) => { e.target.src = ph(50, 50, item.name); }}
                      />
                      <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-[#4d7b65] text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                        {item.qty}
                      </span>
                    </div>
                    <div className="flex-1 text-[13px] text-slate-700 leading-snug line-clamp-2 min-w-0">{item.name}</div>
                    <div className="text-[13px] font-bold text-[#1a2e22] flex-shrink-0">
                      ₱{(item.rawPrice * item.qty).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="flex flex-col gap-2.5 mb-4">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>₱{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Shipping</span>
                  <span className={shippingFee === 0 ? "text-green-600 font-bold" : ""}>
                    {shippingFee === 0 ? "FREE" : `₱${shippingFee.toLocaleString()}`}
                  </span>
                </div>
                <hr className="border-none border-t border-[#e8f0eb]" />
                <div className="flex justify-between text-[17px] font-bold text-[#1a2e22]">
                  <span>Total</span>
                  <span>₱{total.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-center text-xs text-slate-400 pt-3 border-t border-[#f0f4f1] mt-2">
                🔒 Secure & Encrypted Checkout
              </div>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}