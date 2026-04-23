import { Routes, Route, Outlet, useLocation} from 'react-router-dom'
import { useEffect } from 'react';
import { Header, Footer } from './components/Layout'
import { CartProvider } from "./context/CartContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
import Privacypolicy from "./pages/Privacypolicy";

// ── AUTH PAGES ──
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import AccountVerification from './pages/AccountVerification'
import PasswordReset from './pages/PasswordReset';
import ForgotPasswordCode from './pages/ForgotPasswordCode';
import GoogleCallback from "./pages/GoogleCallback";
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
import AdminProductView from './components/Adminproductview';

import BlogCategory from './pages/BlogCategory'
import BlogPost from './pages/BlogPost'
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
  // Apply saved appearance settings (global initializer)
  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('appearance') : null;
      const appearance = stored ? JSON.parse(stored) : null;
      if (!appearance) return;

      if (appearance.primaryColor) {
        document.documentElement.style.setProperty('--brand-green', appearance.primaryColor);
        document.documentElement.style.setProperty('--brand-green-dark', appearance.primaryColor);
      }

      const applyDark = (isDark) => {
        try {
          if (isDark) document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
        } catch (e) {}
      };

      if (appearance.theme === 'dark') applyDark(true);
      else if (appearance.theme === 'light') applyDark(false);
      else {
        const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
        applyDark(mq ? mq.matches : false);
        const handler = (ev) => applyDark(ev.matches);
        if (mq && mq.addEventListener) mq.addEventListener('change', handler);
        else if (mq && mq.addListener) mq.addListener(handler);
        return () => {
          try {
            if (mq && mq.removeEventListener) mq.removeEventListener('change', handler);
            else if (mq && mq.removeListener) mq.removeListener(handler);
          } catch (e) {}
        };
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Poll server settings periodically to sync appearance across sessions/devices
  useEffect(() => {
    let mounted = true;

    const applyAppearance = (appearance) => {
      try {
        if (appearance.primaryColor) {
          document.documentElement.style.setProperty('--brand-green', appearance.primaryColor);
          document.documentElement.style.setProperty('--brand-green-dark', appearance.primaryColor);
        }

        const applyDark = (isDark) => {
          try {
            if (isDark) document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
          } catch (e) {}
        };

        if (appearance.theme === 'dark') applyDark(true);
        else if (appearance.theme === 'light') applyDark(false);
      } catch (e) {}
    };

    const fetchAppearance = async () => {
      try {
        const res = await fetch('/api/admin/settings', { credentials: 'include' });
        if (!res.ok) return;
        const payload = await res.json();
        const appearance = payload?.data?.appearance ?? payload?.appearance ?? null;
        if (!appearance) return;

        const storedRaw = localStorage.getItem('appearance');
        const stored = storedRaw ? JSON.parse(storedRaw) : null;

        // If different, update and apply
        if (JSON.stringify(stored) !== JSON.stringify(appearance)) {
          localStorage.setItem('appearance', JSON.stringify(appearance));
          applyAppearance(appearance);
        }
      } catch (e) {
        // ignore network errors
      }
    };

    // Initial fetch + periodic polling
    fetchAppearance();
    const id = setInterval(fetchAppearance, 20000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

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
          <Route path="/blog/:category"            element={<BlogCategory />} />
                    <Route path="/blog/:category/:id"        element={<BlogPost />} />
                    <Route path="/Privacypolicy" element={<Privacypolicy />} />
          
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/account-verification" element={<AccountVerification />} />
          <Route path="/password-reset" element={<PasswordReset />} />
          <Route path="/forgot-password-code" element={<ForgotPasswordCode />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
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
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/products/:id" element={<AdminProductView />} />
          <Route path="/admin/products/:id/edit" element={<AdminProductView />} />
        </Route>
      </Routes>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </CartProvider>
  );
}