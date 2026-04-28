import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Header, Footer } from "../components/Layout";
import { getUserAddresses } from "../api/address";

const ph = (w, h, label = "") =>
  `https://placehold.co/${w}x${h}/edf4f0/4d7b65?text=${encodeURIComponent(label)}`;

const BASE = "http://127.0.0.1:8000/api";
const SHIPPING_FEE = 150;
const FREE_SHIPPING_MIN = 2000;

// ── Delivery rules configuration (standardized, PHP amounts) ───────────
const DELIVERY_CONFIG = {
  locations: {
    makati: {
      min_order_by_zone: { near: 5000, mid: 8000, far: 10000 },
      bag_delivery_minimum: 25000,
      default_methods: ["pre_delivery", "lalamove", "ap_cargo"],
    },
    pasig: { min_order: 30000, default_methods: ["courier"] },
    outside_metro_manila: { min_order: 50000, default_methods: ["ap_cargo"] },
    metro_manila_default: { min_order: 5000, default_methods: ["lalamove", "pre_delivery", "ap_cargo"] },
  },
  providers: {
    pre_delivery: { description: "In-house / scheduled delivery" },
    lalamove: {
      description: "On-demand intra-city delivery; request provider quotation and include in checkout",
      capacity_limits: { max_weight_kg: 150, max_volume_m3: 1.5 },
      fallback: "ap_cargo",
    },
    courier: { description: "Third-party courier (Pasig default)" },
    ap_cargo: { description: "Freight/cargo for outside-Manila or oversized shipments" },
  },
};

// Helpers: normalize and decision logic
const normalize = (s = "") => String(s || "").trim().toLowerCase();
const isMakati = (addr) => normalize(addr.city || addr.province).includes("makati");
const isPasig = (addr) => normalize(addr.city || addr.province).includes("pasig");
const isMetroManila = (addr) => {
  const city = normalize(addr.city || "");
  const metroKeywords = ["metro", "manila", "makati", "pasig", "quezon", "quezon city", "muntinlupa", "las piñas", "parañaque", "taguig", "navotas", "malabon", "caloocan", "valenzuela", "marikina", "san juan", "mandaluyong", "pateros", "pasay"];
  return metroKeywords.some((k) => city.includes(k) || normalize(addr.province).includes(k));
};

// Determine Makati zone. Lacking geo data, default to 'near' unless address has hints.
const determineMakatiZone = (addr) => {
  const hint = normalize([addr.street, addr.barangay, addr.zip].filter(Boolean).join(" "));
  if (!hint) return "near"; // conservative default
  // crude heuristics (can be replaced by admin override or geolocation)
  if (/poblacion|greenbelt|ayala|salcedo|rockwell/.test(hint)) return "near";
  if (/north|south|east|west|beltway|oxford|malugay|belt/.test(hint)) return "mid";
  return "far";
};

// Heuristic to detect "bag" deliveries (apply bag minimum)
const hasBagDelivery = (items) => items.some((it) => /bag/i.test(it.name || "") || /bag/i.test(it.cat || ""));

// If no weight/volume data available, use subtotal heuristic for capacity (placeholder)
const exceedsLalamoveCapacity = (items, subtotal) => {
  // Placeholder: treat very large orders as exceeding Lalamove capacity
  if (subtotal >= 100000) return true;
  if (items.length > 20) return true;
  return false;
};

const getMinOrderForAddress = (addr, items = [], subtotal = 0) => {
  if (isMakati(addr)) {
    if (hasBagDelivery(items)) return DELIVERY_CONFIG.locations.makati.bag_delivery_minimum;
    const zone = determineMakatiZone(addr);
    return DELIVERY_CONFIG.locations.makati.min_order_by_zone[zone] ?? DELIVERY_CONFIG.locations.makati.min_order_by_zone.near;
  }
  if (isPasig(addr)) return DELIVERY_CONFIG.locations.pasig.min_order;
  if (!isMetroManila(addr)) return DELIVERY_CONFIG.locations.outside_metro_manila.min_order;
  return DELIVERY_CONFIG.locations.metro_manila_default.min_order;
};

const chooseDeliveryProvider = (addr, items = [], subtotal = 0) => {
  if (!isMetroManila(addr)) return "ap_cargo";
  if (isPasig(addr)) return "courier";
  if (isMakati(addr)) {
    // prefer pre_delivery if small and near; else lalamove if within capacity
    const zone = determineMakatiZone(addr);
    if (zone === "near" && subtotal <= 20000) return "pre_delivery";
    if (!exceedsLalamoveCapacity(items, subtotal)) return "lalamove";
    return "ap_cargo";
  }
  // Metro Manila default
  if (!exceedsLalamoveCapacity(items, subtotal)) return "lalamove";
  return "ap_cargo";
};

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
      { name: "account_name", label: "GCash Account Name", placeholder: "Full Name on GCash" },
    ],
    note: "You will receive a GCash payment request after placing your order. Please complete payment within 1 hour.",
    requiresReceipt: true,
  },
  {
    id: "deposit",
    label: "Deposit",
    icon: "🏧",
    tag: "Deposit",
    tagColor: "#0ea5e9",
    desc: "Pay via bank or cash deposit",
    fields: [
      { name: "bank_name", label: "Bank Name", placeholder: "e.g. BPI, BDO, Metrobank" },
      { name: "account_name", label: "Account Name", placeholder: "Your account name" },
      { name: "reference_number", label: "Reference / Slip Number", placeholder: "Deposit slip or transaction reference" },
    ],
    note: "Deposit to: BPI Savings — JEM 8 Circle Trading Co. — Account No. 1234-5678-90. Upload your deposit slip or send proof of payment to our email.",
    requiresReceipt: true,
  },
  {
    id: "bank_transfer",
    label: "Bank Transfer",
    icon: "🏦",
    tag: "Bank",
    tagColor: "#6366f1",
    desc: "BPI, BDO, Metrobank, UnionBank, Landbank, PNB",
    fields: [
      { name: "bank_name", label: "Bank Name", placeholder: "e.g. BPI, BDO, Metrobank" },
      { name: "account_name", label: "Account Name", placeholder: "Your account name" },
      { name: "account_number", label: "Account Number", placeholder: "Your account number" },
      { name: "reference_number", label: "Reference Number", placeholder: "Transaction reference (after transfer)" },
    ],
    note: "Transfer to: BPI Savings — JEM 8 Circle Trading Co. — Account No. 1234-5678-90. Send proof of payment to our email.",
    requiresReceipt: true,
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
    requiresReceipt: false,
  },
  {
    id: "check",
    label: "Check Payment",
    icon: "📄",
    tag: "Check",
    tagColor: "#64748b",
    desc: "Pay by post-dated or manager's check",
    fields: [
      { name: "bank_name", label: "Issuing Bank", placeholder: "e.g. BDO, BPI" },
      { name: "check_number", label: "Check Number", placeholder: "Check number" },
      { name: "check_date", label: "Check Date", type: "date" },
      { name: "check_amount", label: "Check Amount (₱)", placeholder: "Amount in pesos", type: "number" },
    ],
    note: "Make check payable to: JEM 8 Circle Trading Co. Deliver check to our Makati office or hand to our sales representative.",
    requiresReceipt: false,
  },
];

// ── Validation rules per payment method field ─────────────────────────────────
const PAYMENT_VALIDATORS = {
  gcash: {
    mobile_number: (val) => {
      if (!val || val.trim() === "") return "GCash mobile number is required.";
      const digits = val.replace(/\D/g, "");
      if (digits.length !== 11) return "GCash mobile number must be exactly 11 digits.";
      if (!digits.startsWith("09")) return "GCash mobile number must start with 09.";
      return null;
    },
    account_name: (val) => {
      if (!val || val.trim() === "") return "GCash account name is required.";
      if (val.trim().length < 2) return "Please enter a valid account name.";
      return null;
    },
  },
  deposit: {
    bank_name: (val) => {
      if (!val || val.trim() === "") return "Bank name is required.";
      if (val.trim().length < 2) return "Please enter a valid bank name.";
      return null;
    },
    account_name: (val) => {
      if (!val || val.trim() === "") return "Account name is required.";
      if (val.trim().length < 2) return "Please enter a valid account name.";
      return null;
    },
    reference_number: (val) => {
      if (!val || val.trim() === "") return "Reference or slip number is required.";
      if (val.trim().length < 3) return "Please enter a valid reference number (at least 3 characters).";
      return null;
    },
  },
  bank_transfer: {
    bank_name: (val) => {
      if (!val || val.trim() === "") return "Bank name is required.";
      if (val.trim().length < 2) return "Please enter a valid bank name.";
      return null;
    },
    account_name: (val) => {
      if (!val || val.trim() === "") return "Account name is required.";
      if (val.trim().length < 2) return "Please enter a valid account name.";
      return null;
    },
    account_number: (val) => {
      if (!val || val.trim() === "") return "Account number is required.";
      const digits = val.replace(/\D/g, "");
      if (digits.length < 8) return "Account number must be at least 8 digits.";
      if (digits.length > 16) return "Account number must not exceed 16 digits.";
      return null;
    },
    reference_number: (val) => {
      if (!val || val.trim() === "") return "Reference number is required.";
      if (val.trim().length < 3) return "Please enter a valid reference number (at least 3 characters).";
      return null;
    },
  },
  cod: {},
  check: {
    bank_name: (val) => {
      if (!val || val.trim() === "") return "Issuing bank is required.";
      if (val.trim().length < 2) return "Please enter a valid bank name.";
      return null;
    },
    check_number: (val) => {
      if (!val || val.trim() === "") return "Check number is required.";
      if (!/^\d{6,10}$/.test(val.trim())) return "Check number must be 6–10 digits.";
      return null;
    },
    check_date: (val) => {
      if (!val || val.trim() === "") return "Check date is required.";
      const selected = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(selected.getTime())) return "Please enter a valid date.";
      if (selected < today) return "Check date cannot be in the past.";
      return null;
    },
    check_amount: (val) => {
      if (!val || val === "") return "Check amount is required.";
      const num = parseFloat(val);
      if (isNaN(num) || num <= 0) return "Check amount must be a positive number.";
      if (num < 1) return "Minimum check amount is ₱1.";
      return null;
    },
  },
};

// ── Run all validators for a given payment method ─────────────────────────────
const validatePaymentFields = (methodId, payFields) => {
  const rules = PAYMENT_VALIDATORS[methodId] || {};
  const errors = {};
  for (const [fieldName, validator] of Object.entries(rules)) {
    const error = validator(payFields[fieldName] || "");
    if (error) errors[fieldName] = error;
  }
  return errors;
};

const STEPS = ["Delivery", "Payment", "Review"];

const inputCls = "w-full px-3.5 py-2.5 border-[1.5px] border-[#d1e8da] rounded-xl text-sm text-[#1a2e22] bg-[#fafcfb] outline-none transition-colors focus:border-[#4d7b65] focus:bg-white placeholder-[#9ca3af] font-[inherit]";
const inputErrCls = "w-full px-3.5 py-2.5 border-[1.5px] border-red-400 rounded-xl text-sm text-[#1a2e22] bg-[#fff8f8] outline-none transition-colors focus:border-red-500 focus:bg-white placeholder-[#9ca3af] font-[inherit]";
const labelCls = "text-[13px] font-semibold text-slate-700";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedItems = location.state?.selectedItems ?? [];
  const selectedItemIds = new Set(selectedItems.map((i) => i.id));
  const reorderItems = location.state?.reorderItems ?? [];

  const [items, setItems] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [cartError, setCartError] = useState(null);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoadingCart(true);
        setCartError(null);

        if (reorderItems.length > 0) {
          const responses = await Promise.all(
            reorderItems.map((item) =>
              axios.post(
                `${BASE}/cart/add`,
                { product_id: item.productId, quantity: item.quantity },
                { withCredentials: true }
              )
            )
          );
          const newCartIds = new Set(
            responses.map((r) => r.data?.cart?.cart_id).filter(Boolean)
          );
          const res = await axios.get(`${BASE}/cart?isCheckout=false`, { withCredentials: true });
          const cartItems = res.data.cartItems ?? [];
          const formatted = cartItems
            .filter((c) => newCartIds.has(c.cart_id))
            .map((c) => ({
              id: c.cart_id,
              productId: c.product?.product_id,
              name: c.product?.product_name || "Unknown product",
              image:
                c.product?.primary_image_url ||
                (c.product?.images?.find((img) => img.is_primary)?.image_path
                  ? `http://127.0.0.1:8000/storage/${c.product.images.find((img) => img.is_primary).image_path}`
                  : "https://placehold.co/80x80"),
              rawPrice: Number(c.product?.price || 0),
              price: `₱${Number(c.product?.price || 0).toLocaleString()}`,
              qty: c.quantity,
              cat: c.product?.category_id || "Product",
              status: c.product?.status ?? "in_stock",
            }));
          setItems(formatted);
          setLoadingCart(false);
          return;
        }

        const res = await axios.get(`${BASE}/cart?isCheckout=false`, { withCredentials: true });
        const cartItems = res.data.cartItems ?? [];
        const formatted = cartItems.map((c) => ({
          id: c.cart_id,
          productId: c.product?.product_id,
          name: c.product?.product_name || "Unknown product",
          image:
            c.product?.primary_image_url ||
            (c.product?.images?.find((img) => img.is_primary)?.image_path
              ? `http://127.0.0.1:8000/storage/${c.product.images.find((img) => img.is_primary).image_path}`
              : "https://placehold.co/80x80"),
          rawPrice: Number(c.product?.price || 0),
          price: `₱${Number(c.product?.price || 0).toLocaleString()}`,
          qty: c.quantity,
          cat: c.product?.category_id || "Product",
          status: c.product?.status ?? "in_stock",
        }));

        const finalItems =
          selectedItemIds.size > 0
            ? formatted
                .filter((i) => selectedItemIds.has(i.id))
                .map((i) => {
                  const fromCart = selectedItems.find((s) => s.id === i.id);
                  return fromCart ? { ...i, qty: fromCart.qty } : i;
                })
            : formatted;

        setItems(finalItems);
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
    axios
      .get(`${BASE}/me`, { withCredentials: true })
      .then((res) => setUser(res.data?.data ?? res.data))
      .catch(() => {});
  }, []);

  const [step, setStep] = useState(0);
  const [payMethod, setPayMethod] = useState("gcash");
  const [payFields, setPayFields] = useState({});
  const [payFieldErrors, setPayFieldErrors] = useState({});
  const [payTouched, setPayTouched] = useState({});
  const [specialNote, setSpecialNote] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState(null);
  const [delivery, setDelivery] = useState({ address: "", barangay: "", city: "", province: "", zip: "" });
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddrId, setSelectedAddrId] = useState(null);
  const [addrMode, setAddrMode] = useState("detect");

  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const receiptInputRef = useRef(null);
  const [deliveryProvider, setDeliveryProvider] = useState(null);
  const [requiredMinimum, setRequiredMinimum] = useState(null);

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
  const deselectAddress = () => setSelectedAddrId(null);
  const selectedAddr = savedAddresses.find((a) => a.id === selectedAddrId) || null;

  const contactValid = !!(user?.first_name && user?.email);
  const deliveryValid =
    addrMode === "saved"
      ? contactValid && !!selectedAddrId
      : contactValid && delivery.address && delivery.city && delivery.province;

  const subtotal = items.reduce((sum, i) => sum + i.rawPrice * i.qty, 0);
  const shippingFee = subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;
  const remaining = FREE_SHIPPING_MIN - subtotal;

  const handleDeliveryChange = (e) =>
    setDelivery((d) => ({ ...d, [e.target.name]: e.target.value }));

  // ── Validate a single field on change ──────────────────────────────────────
  const handlePayFieldChange = (e) => {
    const name = e.target.name;
    let val = e.target.value;

    // Phone / mobile: digits only, max 11
    if (/mobile|phone/i.test(name)) {
      val = String(val).replace(/\D/g, "").slice(0, 11);
    }
    // Account number: digits only, max 16
    if (name === "account_number") {
      val = String(val).replace(/\D/g, "").slice(0, 16);
    }
    // Check number: digits only, max 10
    if (name === "check_number") {
      val = String(val).replace(/\D/g, "").slice(0, 10);
    }

    const newFields = { ...payFields, [name]: val };
    setPayFields(newFields);
    setPayTouched((t) => ({ ...t, [name]: true }));

    // Re-validate this field immediately
    const validator = PAYMENT_VALIDATORS[payMethod]?.[name];
    if (validator) {
      const error = validator(val);
      setPayFieldErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  // ── Mark field as touched on blur ─────────────────────────────────────────
  const handlePayFieldBlur = (e) => {
    const name = e.target.name;
    setPayTouched((t) => ({ ...t, [name]: true }));
    const validator = PAYMENT_VALIDATORS[payMethod]?.[name];
    if (validator) {
      const error = validator(payFields[name] || "");
      setPayFieldErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const activePayment = PAYMENT_METHODS.find((m) => m.id === payMethod);

  // ── Check if all required payment fields are valid ────────────────────────
  const isPaymentValid = () => {
    const errors = validatePaymentFields(payMethod, payFields);
    return Object.keys(errors).length === 0;
  };

  // ── Touch all fields and show errors when clicking "Review Order" ─────────
  const getResolvedAddress = () => {
    if (addrMode === "saved" && selectedAddr) {
      return {
        street: selectedAddr.street || "",
        barangay: selectedAddr.barangay || "",
        city: selectedAddr.city || "",
        province: selectedAddr.province || "",
        zip: selectedAddr.postal_code || "",
        country: selectedAddr.country || "Philippines",
      };
    }
    return {
      street: delivery.address || "",
      barangay: delivery.barangay || "",
      city: delivery.city || "",
      province: delivery.province || "",
      zip: delivery.zip || "",
      country: "Philippines",
    };
  };

  const handleProceedToReview = () => {
    setPlaceError(null);

    // Resolve address and determine required minimum + provider
    const resolved = getResolvedAddress();
    const minReq = getMinOrderForAddress(resolved, items, subtotal);
    setRequiredMinimum(minReq);
    if (subtotal < minReq) {
      setPlaceError(`Minimum order for this delivery location is ₱${Number(minReq).toLocaleString()}.`);
      // Move user back to delivery step if they somehow advanced
      setStep(0);
      return;
    }

    const provider = chooseDeliveryProvider(resolved, items, subtotal);
    setDeliveryProvider(provider);

    // Validate payment fields as before
    const errors = validatePaymentFields(payMethod, payFields);
    if (Object.keys(errors).length > 0) {
      const allTouched = {};
      (PAYMENT_VALIDATORS[payMethod] ? Object.keys(PAYMENT_VALIDATORS[payMethod]) : []).forEach(
        (f) => (allTouched[f] = true)
      );
      setPayTouched(allTouched);
      setPayFieldErrors(errors);
      return;
    }

    setStep(2);
  };

  const handleReceiptChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpg", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) {
      setPlaceError("Receipt must be a JPG or PNG image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPlaceError("Receipt image must be under 2MB.");
      return;
    }
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
    setPlaceError(null);
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (receiptInputRef.current) receiptInputRef.current.value = "";
  };

  const handlePayMethodChange = (id) => {
    setPayMethod(id);
    setPayFields({});
    setPayFieldErrors({});
    setPayTouched({});
    handleRemoveReceipt();
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);
    setPlaceError(null);

    let resolvedAddress;
    if (addrMode === "saved" && selectedAddr) {
      resolvedAddress = {
        street: selectedAddr.street || "",
        barangay: selectedAddr.barangay || "",
        city: selectedAddr.city || "",
        province: selectedAddr.province || "",
        zip: selectedAddr.postal_code || "",
        country: selectedAddr.country || "Philippines",
      };
    } else {
      resolvedAddress = {
        street: delivery.address || "",
        barangay: delivery.barangay || "",
        city: delivery.city || "",
        province: delivery.province || "",
        zip: delivery.zip || "",
        country: "Philippines",
      };
    }

    const paymentDetails = {
      ...payFields,
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
      phone: user?.phone_number || "",
      billing_address: resolvedAddress,
    };

    const cartIds = items.map((i) => i.id).filter(Boolean);
    if (cartIds.length === 0) {
      setPlaceError("No valid cart items found. Please go back to your cart.");
      setPlacing(false);
      return;
    }

    const formData = new FormData();
    cartIds.forEach((id) => formData.append("cart_ids[]", id));
    formData.append("payment_method", payMethod);
    formData.append("shipping_fee", shippingFee);
    // Provider chosen by rules (e.g., lalamove, ap_cargo, pre_delivery, courier)
    formData.append("shipping_provider", deliveryProvider || "lalamove");
    // If Lalamove quote is required, backend should request it; placeholder here
    formData.append("shipping_quote", "");
    if (specialNote) formData.append("special_instructions", specialNote);

    Object.entries(paymentDetails).forEach(([key, val]) => {
      if (val !== null && val !== undefined && val !== "") {
        if (key === "billing_address" && typeof val === "object") {
          formData.append(`payment_details[${key}]`, JSON.stringify(val));
        } else {
          formData.append(`payment_details[${key}]`, val);
        }
      }
    });

    if (receiptFile) formData.append("receipt_image", receiptFile);

    try {
      const res = await axios.post(`${BASE}/checkout`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate(`/orders?new=${res.data.checkout_id}`);
    } catch (err) {
      setPlaceError(
        err.response?.data?.message || "Failed to place order. Please try again."
      );
      setPlacing(false);
    }
  };

  const EmptyShell = ({ icon, title, desc, action }) => (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-4 text-5xl">{icon}</div>
          <h2 className="text-xl font-bold text-[#1a2e22] mb-2">{title}</h2>
          {desc && <p className="mb-5 text-sm text-slate-500">{desc}</p>}
          {action}
        </div>
      </div>
      <Footer />
    </div>
  );

  if (loadingCart) return <EmptyShell icon="⏳" title="Loading your cart…" />;
  if (cartError)
    return (
      <EmptyShell
        icon="⚠️"
        title="Something went wrong"
        desc={cartError}
        action={
          <button
            className="px-6 py-2.5 bg-[#4d7b65] text-white rounded-xl text-sm font-bold cursor-pointer border-none"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        }
      />
    );
  if (items.length === 0)
    return (
      <EmptyShell
        icon="🛒"
        title="No items to checkout"
        action={
          <Link
            to="/products"
            className="inline-block px-6 py-2.5 bg-[#4d7b65] text-white rounded-xl text-sm font-bold no-underline"
          >
            Browse Products →
          </Link>
        }
      />
    );

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <Header />

      {/* ── Breadcrumb ── */}
      <div className="bg-[#f8faf9] border-b border-[#e8f0eb] mt-[75px]">
        <div className="container mx-auto px-4 flex items-center gap-2 py-3 text-xs text-[#6b7c70] flex-wrap">
          <Link to="/" className="text-[#4d7b65] no-underline hover:underline">
            Home
          </Link>
          <span className="text-gray-300">›</span>
          <Link to="/cart" className="text-[#4d7b65] no-underline hover:underline">
            Cart
          </Link>
          <span className="text-gray-300">›</span>
          <span>Checkout</span>
        </div>
      </div>

      {/* ── Progress ── */}
      <div className="bg-white border-b border-[#e8f0eb] py-5">
        <div className="container flex items-center justify-center gap-0 px-4 mx-auto">
          {STEPS.map((s, i) => {
            const isDone = i < step;
            const isActive = i <= step;
            return (
              <div key={s} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 transition-all
                    ${
                      isDone
                        ? "bg-green-600 text-white"
                        : isActive
                        ? "bg-[#4d7b65] text-white"
                        : "bg-[#e8f0eb] text-[#9ca3af]"
                    }`}
                  >
                    {isDone ? "✓" : i + 1}
                  </div>
                  <span
                    className={`text-[13px] font-semibold transition-colors hidden sm:block
                    ${
                      isDone
                        ? "text-green-600"
                        : isActive
                        ? "text-[#4d7b65]"
                        : "text-[#9ca3af]"
                    }`}
                  >
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-10 sm:w-16 h-0.5 mx-2 transition-colors ${
                      isDone
                        ? "bg-green-600"
                        : isActive
                        ? "bg-[#4d7b65]"
                        : "bg-[#e8f0eb]"
                    }`}
                  />
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
                    {user
                      ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase()
                      : "…"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#1a1a1a] mb-0.5">
                      {user
                        ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
                        : "Loading…"}
                    </div>
                    <div className="text-xs text-[#666]">{user?.email || "—"}</div>
                    {user?.phone_number && (
                      <div className="text-xs text-[#666]">{user.phone_number}</div>
                    )}
                    {user?.company_name && (
                      <div className="text-xs text-[#4d7b65] font-medium mt-0.5">
                        🏢 {user.company_name}
                      </div>
                    )}
                    {user?.tin_number && (
                      <div className="text-xs text-[#666] mt-0.5">TIN: {user.tin_number}</div>
                    )}
                  </div>
                  <Link
                    to="/Profilepersonal"
                    className="text-xs text-[#4d7b65] font-medium no-underline px-2.5 py-1.5 rounded-lg border-[1.5px] border-[#c0ddd0] bg-white hover:bg-[#e8f5ef] transition-colors whitespace-nowrap"
                  >
                    ✏️ Edit
                  </Link>
                </div>

                {/* Mode toggle */}
                {savedAddresses.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setAddrMode("saved")}
                      className={`flex-1 px-3.5 py-2.5 rounded-xl border-[1.5px] text-[13px] font-medium cursor-pointer transition-all font-[inherit]
                        ${
                          addrMode === "saved"
                            ? "border-[#4d7b65] bg-[#4d7b65] text-white font-semibold"
                            : "border-[#e0e9e4] bg-[#fafafa] text-[#666] hover:border-[#4d7b65] hover:text-[#4d7b65]"
                        }`}
                    >
                      📍 My Saved Addresses
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddrMode("new");
                        setSelectedAddrId(null);
                      }}
                      className={`flex-1 px-3.5 py-2.5 rounded-xl border-[1.5px] text-[13px] font-medium cursor-pointer transition-all font-[inherit]
                        ${
                          addrMode === "new"
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
                    <div className="text-[11px] font-bold uppercase tracking-wide text-[#5a7a68] mb-3">
                      Select a delivery address
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {savedAddresses.map((addr) => {
                        const isCompany = addr.type === "company";
                        const isActive = selectedAddrId === addr.id;
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
                            onClick={() =>
                              isActive ? deselectAddress() : selectSavedAddress(addr)
                            }
                            className={`flex-1 min-w-[180px] text-left bg-white border-[1.5px] rounded-xl px-4 py-3.5 cursor-pointer transition-all font-[inherit]
                              ${
                                isActive
                                  ? "border-[#4d7b65] bg-[#f0f7f3] shadow-[0_0_0_3px_rgba(77,123,101,0.13)]"
                                  : "border-[#e0e9e4] hover:border-[#4d7b65] hover:shadow-[0_2px_10px_rgba(77,123,101,0.10)]"
                              }`}
                          >
                            <div className="text-[10px] font-bold uppercase tracking-wide text-[#5a7a68] mb-1.5">
                              {isCompany ? "🏢 Company" : "👤 Personal"}
                            </div>
                            {isCompany && addr.company_name && (
                              <div className="text-[13px] font-semibold text-[#1a1a1a] mb-0.5">
                                {addr.company_name}
                              </div>
                            )}
                            {lines.map((line, i) => (
                              <div key={i} className="text-[13px] text-[#444] leading-relaxed">
                                {line}
                              </div>
                            ))}
                            {isCompany && (addr.company_number || addr.company_email) && (
                              <div className="flex flex-col gap-0.5 mt-1.5 pt-1.5 border-t border-[#eee] text-[11px] text-[#888]">
                                {addr.company_number && <span>📞 {addr.company_number}</span>}
                                {addr.company_email && <span>✉ {addr.company_email}</span>}
                              </div>
                            )}
                            <div className="mt-2.5">
                              {isActive ? (
                                <span className="text-xs font-bold text-[#4d7b65]">
                                  ✓ Delivering here
                                </span>
                              ) : (
                                <span className="text-[11px] text-[#bbb]">Tap to select</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* New address form */}
                {addrMode === "new" && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                      <label className={labelCls}>Street Address / Building / Unit *</label>
                      <input
                        name="address"
                        value={delivery.address}
                        onChange={handleDeliveryChange}
                        placeholder="e.g. Unit 202, Cityland Tower, HV Dela Costa St."
                        className={inputCls}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelCls}>Barangay</label>
                      <input
                        name="barangay"
                        value={delivery.barangay}
                        onChange={handleDeliveryChange}
                        placeholder="Barangay name"
                        className={inputCls}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelCls}>City / Municipality *</label>
                      <input
                        name="city"
                        value={delivery.city}
                        onChange={handleDeliveryChange}
                        placeholder="Makati City"
                        className={inputCls}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelCls}>Province *</label>
                      <input
                        name="province"
                        value={delivery.province}
                        onChange={handleDeliveryChange}
                        placeholder="Metro Manila"
                        className={inputCls}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelCls}>ZIP Code</label>
                      <input
                        name="zip"
                        value={delivery.zip}
                        onChange={handleDeliveryChange}
                        placeholder="1227"
                        className={inputCls}
                      />
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
                        onClick={() => handlePayMethodChange(m.id)}
                        className={`flex items-center gap-3.5 px-4 py-4 border-[1.5px] rounded-2xl cursor-pointer transition-all
                          ${
                            isActive
                              ? "border-[#4d7b65] bg-[#f0f7f3] shadow-[0_0_0_3px_rgba(77,123,101,0.08)]"
                              : "border-[#e8f0eb] bg-[#fafcfb] hover:border-[#4d7b65] hover:bg-[#f3f8f5]"
                          }`}
                      >
                        <div
                          className={`w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 transition-all
                          ${isActive ? "border-[#4d7b65]" : "border-[#d1e8da]"}`}
                          style={
                            isActive
                              ? {
                                  background:
                                    "radial-gradient(circle at center, #4d7b65 6px, transparent 6px)",
                                }
                              : {}
                          }
                        />
                        <span className="flex-shrink-0 text-2xl">{m.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="block text-[15px] font-bold text-[#1a2e22]">{m.label}</span>
                          <span className="block text-xs text-[#6b7c70] mt-0.5">{m.desc}</span>
                        </div>
                        <span
                          className="text-[11px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0 whitespace-nowrap"
                          style={{
                            background: m.tagColor + "22",
                            color: m.tagColor,
                            borderColor: m.tagColor + "44",
                          }}
                        >
                          {m.tag}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Payment fields with validation */}
                {activePayment.fields.length > 0 && (
                  <div className="bg-[#f8faf9] border-[1.5px] border-[#e8f0eb] rounded-xl p-5 mb-4">
                    <h3 className="text-sm font-bold text-[#1a2e22] mb-4">
                      {activePayment.label} Details
                    </h3>
                    <div className="flex flex-col gap-4">
                      {activePayment.fields.map((f) => {
                        const hasError = payTouched[f.name] && payFieldErrors[f.name];
                        const isValid = payTouched[f.name] && !payFieldErrors[f.name] && payFields[f.name];
                        return (
                          <div key={f.name} className="flex flex-col gap-1.5">
                            <label className={labelCls}>{f.label}</label>
                            <div className="relative">
                              <input
                                name={f.name}
                                type={f.type || "text"}
                                inputMode={/mobile|phone/i.test(f.name) ? "numeric" : f.name === "account_number" || f.name === "check_number" ? "numeric" : undefined}
                                placeholder={f.placeholder || ""}
                                value={payFields[f.name] || ""}
                                onChange={handlePayFieldChange}
                                onBlur={handlePayFieldBlur}
                                className={hasError ? inputErrCls : inputCls}
                              />
                              {/* Inline valid/invalid icon */}
                              {payTouched[f.name] && (
                                <span
                                  className="absolute text-sm -translate-y-1/2 pointer-events-none right-3 top-1/2"
                                  style={{ color: hasError ? "#ef4444" : "#22c55e" }}
                                >
                                  {hasError ? "✗" : "✓"}
                                </span>
                              )}
                            </div>
                            {/* Error message */}
                            {hasError && (
                              <p className="text-[12px] text-red-500 mt-0.5 flex items-center gap-1">
                                <span>⚠</span>
                                <span>{payFieldErrors[f.name]}</span>
                              </p>
                            )}
                            {/* Helper hints */}
                            {!hasError && !isValid && (
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {f.name === "mobile_number" && "Must be 11 digits starting with 09 (e.g. 09171234567)"}
                                {f.name === "account_number" && "8–16 digits, no spaces or dashes"}
                                {f.name === "check_number" && "6–10 digit check number"}
                                {f.name === "check_date" && "Select a present or future date"}
                                {f.name === "check_amount" && "Enter the amount written on the check"}
                                {f.name === "reference_number" && "Found on your deposit slip or transfer confirmation"}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Receipt Image Upload ── */}
                {activePayment.requiresReceipt && (
                  <div className="bg-[#f8faf9] border-[1.5px] border-[#e8f0eb] rounded-xl p-5 mb-4">
                    <h3 className="text-sm font-bold text-[#1a2e22] mb-1">
                      🧾 Upload Payment Receipt
                      <span className="ml-1.5 text-[11px] font-normal text-slate-400">(optional)</span>
                    </h3>
                    <p className="text-[12px] text-[#6b7c70] mb-4">
                      Attach a screenshot or photo of your payment confirmation to speed up verification.
                    </p>

                    {receiptPreview ? (
                      <div className="flex flex-col gap-3">
                        <div className="relative w-full max-w-xs rounded-xl overflow-hidden border-[1.5px] border-[#d1e8da] bg-[#f0f7f3]">
                          <img
                            src={receiptPreview}
                            alt="Receipt preview"
                            className="block object-contain w-full max-h-52"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveReceipt}
                            className="absolute flex items-center justify-center text-sm font-bold leading-none text-white transition-colors bg-red-500 border-none rounded-full shadow-md cursor-pointer top-2 right-2 w-7 h-7 hover:bg-red-600"
                            title="Remove receipt"
                          >
                            ×
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-[12px] text-[#4d7b65] font-semibold">
                          <span>✓</span>
                          <span>{receiptFile?.name}</span>
                          <span className="font-normal text-slate-400">
                            ({(receiptFile?.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => receiptInputRef.current?.click()}
                          className="w-fit text-[12px] text-[#4d7b65] font-semibold bg-transparent border-none cursor-pointer p-0 hover:underline"
                        >
                          Replace image
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => receiptInputRef.current?.click()}
                        className="w-full border-[2px] border-dashed border-[#c0ddd0] rounded-xl py-7 px-4 flex flex-col items-center gap-2 bg-transparent cursor-pointer transition-all hover:border-[#4d7b65] hover:bg-[#f0f7f3] font-[inherit]"
                      >
                        <span className="text-3xl">📎</span>
                        <span className="text-sm font-semibold text-[#4d7b65]">
                          Click to upload receipt
                        </span>
                        <span className="text-[11px] text-slate-400">
                          JPG, JPEG, or PNG · Max 2MB
                        </span>
                      </button>
                    )}

                    <input
                      ref={receiptInputRef}
                      type="file"
                      accept="image/jpg,image/jpeg,image/png"
                      onChange={handleReceiptChange}
                      className="hidden"
                    />
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

                <div className="flex items-center justify-between gap-3 mt-6">
                  <button
                    onClick={() => setStep(0)}
                    className="px-6 py-3 bg-transparent border-[1.5px] border-[#e8f0eb] rounded-xl text-sm font-semibold text-slate-600 cursor-pointer hover:border-[#4d7b65] hover:text-[#4d7b65] transition-all"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleProceedToReview}
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
                    <button
                      onClick={() => setStep(0)}
                      className="bg-transparent border-none text-[13px] text-[#4d7b65] font-bold cursor-pointer p-0 hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="px-4 py-4 text-sm leading-relaxed text-slate-600">
                    <strong>
                      {user?.first_name} {user?.last_name}
                    </strong>
                    <br />
                    {user?.phone_number && <>{user.phone_number} · </>}
                    {user?.email}
                    <br />
                    {user?.company_name && (
                      <div className="text-[13px] text-[#4d7b65] font-medium mt-0.5">
                        🏢 {user.company_name}
                      </div>
                    )}
                    {user?.tin_number && (
                      <div className="text-[13px] text-[#666] mt-0.5">TIN: {user.tin_number}</div>
                    )}
                    {addrMode === "saved" && selectedAddr ? (
                      <>
                        {selectedAddr.street}
                        {selectedAddr.barangay ? `, ${selectedAddr.barangay}` : ""},{" "}
                        {selectedAddr.city}, {selectedAddr.province} {selectedAddr.postal_code}
                      </>
                    ) : (
                      <>
                        {delivery.address},{delivery.barangay && ` ${delivery.barangay},`}{" "}
                        {delivery.city}, {delivery.province} {delivery.zip}
                      </>
                    )}
                  </div>
                </div>

                {/* Payment block */}
                <div className="border-[1.5px] border-[#e8f0eb] rounded-xl overflow-hidden mb-4">
                  <div className="flex justify-between items-center px-4 py-3 bg-[#f8faf9] border-b border-[#e8f0eb] text-[13px] font-bold text-slate-700">
                    <span>💳 Payment Method</span>
                    <button
                      onClick={() => setStep(1)}
                      className="bg-transparent border-none text-[13px] text-[#4d7b65] font-bold cursor-pointer p-0 hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="px-4 py-4 text-sm text-slate-600">
                    <strong>
                      {activePayment.icon} {activePayment.label}
                    </strong>
                    {Object.entries(payFields).map(([k, v]) =>
                      v ? (
                        <div key={k} className="text-[13px] text-[#6b7c70] mt-1">
                          {k.replace(/_/g, " ")}: {v}
                        </div>
                      ) : null
                    )}
                    {receiptPreview && (
                      <div className="flex items-center gap-3 mt-3">
                        <img
                          src={receiptPreview}
                          alt="Receipt"
                          className="w-16 h-16 object-cover rounded-lg border border-[#d1e8da]"
                        />
                        <div>
                          <div className="text-[12px] font-semibold text-[#4d7b65]">
                            🧾 Receipt attached
                          </div>
                          <div className="text-[11px] text-slate-400">{receiptFile?.name}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-[1.5px] border-[#e8f0eb] rounded-xl overflow-hidden mb-4">
                  <div className="px-4 py-3 bg-[#f8faf9] border-b border-[#e8f0eb] text-[13px] font-bold text-slate-700">
                    🛒 Items ({items.length})
                  </div>
                  <div className="px-4">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3.5 py-3 border-b border-[#f0f4f1] last:border-b-0"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 rounded-xl object-cover bg-[#f3f8f5] flex-shrink-0"
                          onError={(e) => {
                            e.target.src = ph(60, 60, item.name);
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-[#1a2e22] truncate">
                            {item.name}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">Qty: {item.qty}</div>
                          {item.status === "pre_order" ? (
                            <div className="mt-1 inline-block text-[11px] font-semibold text-[#92400e] bg-[#FEF3C7] border border-[#FDE68A] px-2 py-1 rounded-full">
                              ⏳ Pre-Order — delivery may take longer
                            </div>
                          ) : (
                            <div className="mt-1 inline-block text-[11px] font-semibold text-[#059669] bg-[#D1FAE5] border border-[#6EE7B7] px-2 py-1 rounded-full">
                              ✅ In Stock
                            </div>
                          )}
                        </div>
                        <div className="text-[15px] font-bold text-[#4d7b65] flex-shrink-0">
                          ₱{(item.rawPrice * item.qty).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {specialNote && (
                  <div className="border-[1.5px] border-[#e8f0eb] rounded-xl overflow-hidden mb-4">
                    <div className="px-4 py-3 bg-[#f8faf9] border-b border-[#e8f0eb] text-[13px] font-bold text-slate-700">
                      📝 Special Instructions
                    </div>
                    <div className="px-4 py-4 text-sm text-slate-600">{specialNote}</div>
                  </div>
                )}

                {placeError && (
                  <div className="bg-[#fef2f2] border border-red-200 rounded-xl px-4 py-3 text-[13px] text-red-600 mb-4">
                    ⚠️ {placeError}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 mt-6">
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
                      ${
                        placing
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

              {subtotal > 0 && subtotal < FREE_SHIPPING_MIN ? (
                <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl px-4 py-3 mb-4 text-sm text-[#166534] flex flex-col gap-2">
                  <span>
                    🚚 Add <strong>₱{remaining.toLocaleString()}</strong> more for FREE shipping!
                  </span>
                  <div className="h-1.5 bg-[#d1fae5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#16a34a] rounded-full transition-all duration-400"
                      style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_MIN) * 100)}%` }}
                    />
                  </div>
                </div>
              ) : subtotal >= FREE_SHIPPING_MIN ? (
                <div className="bg-[#f0fdf4] border border-[#86efac] rounded-xl px-4 py-3 mb-4 text-sm text-[#166534]">
                  🎉 You qualify for <strong>FREE shipping!</strong>
                </div>
              ) : null}

              <div className="mb-4 bg-[#f8faf9] border border-[#e8f0eb] rounded-xl p-4">
                <p className="text-xs font-bold text-[#4d7b65] uppercase tracking-wide mb-3 m-0">
                  Items ({items.length})
                </p>
                <div className="flex flex-col gap-2.5">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2.5">
                      <div className="relative flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover bg-[#f3f8f5]"
                          onError={(e) => {
                            e.target.src = ph(48, 48, item.name);
                          }}
                        />
                        <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-[#4d7b65] text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                          {item.qty}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#1a2e22] m-0 truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-gray-400 m-0">
                          x{item.qty} · {item.price} each
                        </p>
                        {item.status === "pre_order" ? (
                          <p className="text-[10px] text-[#92400e] m-0 mt-0.5">⏳ Pre-order</p>
                        ) : (
                          <p className="text-[10px] text-[#059669] m-0 mt-0.5">✅ In stock</p>
                        )}
                      </div>
                      <span className="text-xs font-bold text-[#4d7b65] flex-shrink-0">
                        ₱{(item.rawPrice * item.qty).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2.5 mb-4">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal ({items.reduce((s, i) => s + i.qty, 0)} items)</span>
                  <span>₱{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Shipping</span>
                  <span className={shippingFee === 0 ? "text-green-600 font-bold" : ""}>
                    {shippingFee === 0 ? "FREE" : `₱${shippingFee.toLocaleString()}`}
                  </span>
                </div>
                <hr className="border-none border-t border-[#e8f0eb] my-0" />
                <div className="flex justify-between text-[17px] font-bold text-[#1a2e22]">
                  <span>Total</span>
                  <span>₱{total.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 justify-center mb-3">
                {["GCash", "Deposit", "Bank Transfer", "COD", "Check"].map((p) => (
                  <span
                    key={p}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#f3f8f5] text-[#4d7b65] border border-[#d1e8da]"
                  >
                    {p}
                  </span>
                ))}
              </div>

              <div className="text-center text-xs text-slate-400 pt-3 border-t border-[#f0f4f1]">
                🔒 Secure & Encrypted Checkout
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}