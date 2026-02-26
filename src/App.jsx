import { Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";

import Jem8HomePage from "./Jem8HomePage";
import About        from "./pages/About";
import Products     from "./pages/Products";
import ProductView  from "./pages/ProductView";
import Cart         from "./pages/Cart";
import Checkout     from "./pages/Checkout";
import MyOrders     from "./pages/MyOrders";

export default function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/"              element={<Jem8HomePage />} />
        <Route path="/about"         element={<About />} />
        <Route path="/products"      element={<Products />} />
        <Route path="/products/:id"  element={<ProductView />} />
        <Route path="/cart"          element={<Cart />} />
        <Route path="/checkout"      element={<Checkout />} />
        <Route path="/orders"        element={<MyOrders />} />
      </Routes>
    </CartProvider>
  );
}