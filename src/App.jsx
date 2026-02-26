import { Routes, Route, Outlet } from 'react-router-dom'
import { Header, Footer } from './components/Layout'
import { CartProvider } from "./context/CartContext";

import Jem8HomePage from './Jem8HomePage'
import About from './pages/About'
import Profilepersonal from './pages/Profilepersonal'
import Blog from './pages/Blog'
import Products from "./pages/Products";
import ProductView from "./pages/ProductView";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import AdminProducts from "./pages/adminProducts";
import AdminDashboard from "./pages/adminDashboard";
import AdminPanelSettings from "./pages/adminSettings";
import AdminLeadership from "./pages/adminLeadership";
import AdminOrders from './pages/adminOrders';
import AdminBackup from './pages/adminBackup';
import AdminContactMessages from './pages/adminContact';
import AdminReviews from './pages/adminReviews';

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
        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Jem8HomePage />} />
          {/* Keep BOTH routes - case sensitive paths */}
          <Route path="/about" element={<About />} />
          <Route path="/About" element={<About />} />
          <Route path="/Profilepersonal" element={<Profilepersonal />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductView />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<MyOrders />} />
        </Route>

        {/* Admin routes */}
        <Route element={<AdminLayout />}>
          <Route path="/adminDashboard" element={<AdminDashboard />} />
          <Route path="/adminProducts" element={<AdminProducts />} />
          <Route path="/adminSettings" element={<AdminPanelSettings />} />
          <Route path="/adminLeadership" element={<AdminLeadership />} />
          <Route path="/adminOrders" element={<AdminOrders />} />
          <Route path="/adminBackup" element={<AdminBackup />} />
          <Route path="/adminContact" element={<AdminContactMessages />} />
          <Route path="/adminReviews" element={<AdminReviews />} />
        </Route>
      </Routes>
    </CartProvider>
  );
}