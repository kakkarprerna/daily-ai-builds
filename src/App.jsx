import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import Home from './pages/Home.jsx'
import Diagnose from './pages/Diagnose.jsx'
import Method from './pages/Method.jsx'
import Examples from './pages/Examples.jsx'

export default function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <div className="main-inner">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/diagnose" element={<Diagnose />} />
            <Route path="/method" element={<Method />} />
            <Route path="/examples" element={<Examples />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
