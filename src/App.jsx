import { Routes, Route, Outlet } from 'react-router-dom'
import { Header, Footer } from './components/Layout'
import { CartProvider } from "./context/CartContext";

// ── PUBLIC PAGES ──
import Jem8HomePage from './Jem8HomePage'
import About from './pages/About'
import Profilepersonal from './pages/Profilepersonal'
import Blog from './pages/Blog'
import Products from "./pages/Products";
import ProductView from "./pages/ProductView";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Messages from "./pages/Messages";

// ── AUTH PAGES ──
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import AccountVerification from './pages/AccountVerification'
import PasswordReset from './pages/PasswordReset';
import ForgotPasswordCode from './pages/ForgotPasswordCode';

// ── ADMIN PAGES ──
import AdminProducts from "./pages/adminProducts";
import AdminDashboard from "./pages/adminDashboard";
import AdminPanelSettings from "./pages/adminSettings";
import AdminLeadership from "./pages/adminLeadership";
import AdminBlogpost from "./pages/adminBlogpost";
import AdminActivitylogs from "./pages/adminActivitylogs";
import AdminAccountManagement from "./pages/adminAccountmanagement";
import AdminOrders from './pages/adminOrders';
import AdminBackup from './pages/adminBackup';
import AdminContactMessages from './pages/adminContact';
import AdminReviews from './pages/adminReviews';
import AdminMessage from './pages/adminMessage';

// Layout for public pages (with main Header & Footer)
function PublicLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}

// Layout for admin pages
function AdminLayout() {
  return <Outlet />;
}

export default function App() {
  return (
    <CartProvider>
      <Routes>
        {/* ── PUBLIC ROUTES ── */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Jem8HomePage />} />
          <Route path="/about" element={<About />} />
          <Route path="/About" element={<About />} />
          <Route path="/Profilepersonal" element={<Profilepersonal />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductView />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/messages" element={<Messages />} />

          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/account-verification" element={<AccountVerification />} />
          <Route path="/password-reset" element={<PasswordReset />} />
          <Route path="/forgot-password-code" element={<ForgotPasswordCode />} />
        </Route>

        {/* ── ADMIN ROUTES ── */}
        <Route element={<AdminLayout />}>
          <Route path="/adminDashboard" element={<AdminDashboard />} />
          <Route path="/adminProducts" element={<AdminProducts />} />
          <Route path="/adminSettings" element={<AdminPanelSettings />} />
          <Route path="/adminLeadership" element={<AdminLeadership />} />
          <Route path="/adminOrders" element={<AdminOrders />} />
          <Route path="/adminBlogpost" element={<AdminBlogpost />} />
          <Route path="/adminActivitylogs" element={<AdminActivitylogs />} />
          <Route path="/adminAccountmanagement" element={<AdminAccountManagement />} />
          <Route path="/adminBackup" element={<AdminBackup />} />
          <Route path="/adminContact" element={<AdminContactMessages />} />
          <Route path="/adminReviews" element={<AdminReviews />} />
          <Route path="/adminMessage" element={<AdminMessage />} />
        </Route>
      </Routes>
    </CartProvider>
  );
}