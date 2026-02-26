import { Routes, Route } from 'react-router-dom'
import { Header, Footer } from './components/Layout'
import Jem8HomePage from './Jem8HomePage'
import About from './pages/About'
import Blog from './pages/Blog'

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Jem8HomePage />} />
        <Route path="/blog"    element={<Blog />} />   
        <Route path="/about" element={<About />} />
      </Routes>
      <Footer />
    </>
  )
}

export default App