<<<<<<< HEAD
import Jem8HomePage from './Jem8HomePage'

function App() {
  return <Jem8HomePage />
}

export default App
=======
import { Routes, Route } from "react-router-dom";

// import Home from "./pages/Home";
import About from "./pages/about";
// import Products from "./pages/Products";
// import Contact from "./pages/Contact";

function App() {
  return (
    <Routes>
      {/* <Route path="/" element={<Home />} /> */}
      <Route path="/about" element={<About />} />
      {/* <Route path="/products" element={<Products />} /> */}
      {/* <Route path="/contact" element={<Contact />} /> */}
    </Routes>
  );
}

export default App;
>>>>>>> d6ccd29cc3480b4ae75c1aacd974d527c8098886
