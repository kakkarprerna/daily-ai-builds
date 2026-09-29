import { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import CheckPage from './components/CheckPage.jsx'
import Examples from './components/Examples.jsx'
import HowItWorks from './components/HowItWorks.jsx'

export default function App() {
  const [page, setPage] = useState('check')

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={setPage} />
      <main className="main">
        <div className="main-inner">
          {page === 'check' && <CheckPage />}
          {page === 'examples' && <Examples />}
          {page === 'how' && <HowItWorks />}
        </div>
      </main>
    </div>
  )
}
