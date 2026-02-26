import { Routes, Route, Outlet } from 'react-router-dom'
import { Header, Footer } from './components/Layout'
import { CartProvider } from "./context/CartContext";

import Jem8HomePage from './Jem8HomePage'
import About from './pages/About'
import Blog from './pages/Blog'
import Products from "./pages/Products";
import ProductView from "./pages/ProductView";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import AdminProducts from "./pages/adminProducts";
import AdminDashboard from "./pages/adminDashboard";

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
// NOTE: AdminDashboard and AdminProducts each render their own
// AdminNav sidebar internally, so no extra nav wrapper needed here.
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
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductView />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<MyOrders />} />
        </Route>

        {/* Admin routes — sidebar nav is inside each page component via AdminNav */}
        <Route element={<AdminLayout />}>
          <Route path="/adminDashboard" element={<AdminDashboard />} />
          <Route path="/adminProducts" element={<AdminProducts />} />
        </Route>
      </Routes>
    </CartProvider>
  );
}