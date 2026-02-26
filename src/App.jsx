import { Routes, Route, Outlet } from 'react-router-dom'  // <- Add Outlet
import { Header, Footer } from './components/Layout'
import { CartProvider } from "./context/CartContext";

import Jem8HomePage from './Jem8HomePage'
import Blog from './pages/Blog'
import Products from "./pages/Products";
import ProductView from "./pages/ProductView";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import AdminProducts from "./pages/adminProducts";
import AdminPanelSettings from "./pages/adminSettings";

// Layout component for public pages
function PublicLayout() {  // <- Remove 'children' parameter
  return (
    <>
      <Header />
      <Outlet />  {/* <- Add Outlet here - ito ang magre-render ng child routes */}
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <CartProvider>
      <Routes>
        {/* Public routes with layout */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Jem8HomePage />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductView />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<MyOrders />} />
        </Route>
        
        {/* Admin route - no layout */}
        <Route path="/adminProducts" element={<AdminProducts />} />
        <Route path="/adminSettings" element={<AdminPanelSettings />} />
      </Routes>
    </CartProvider>
  )
}