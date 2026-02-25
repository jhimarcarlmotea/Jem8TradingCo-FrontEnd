import { Routes, Route } from 'react-router-dom'
import Jem8HomePage from './Jem8HomePage'
import About from './pages/About'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Jem8HomePage />} />
      <Route path="/about" element={<About />} />
    </Routes>
  )
}

export default App