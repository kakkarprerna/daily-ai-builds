import { NavLink } from 'react-router-dom'
import { Signpost, Compass, ListChecks, BookOpenCheck } from 'lucide-react'

const links = [
  { to: '/', end: true, icon: Compass, label: 'Home', desc: 'What this does' },
  { to: '/diagnose', icon: Signpost, label: 'Diagnose', desc: 'Find the likely owner' },
  { to: '/method', icon: BookOpenCheck, label: 'Method', desc: 'How it decides' },
  { to: '/examples', icon: ListChecks, label: 'Examples', desc: 'See it worked out' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="mark"><Signpost size={18} strokeWidth={2.4} /></div>
        <h1>Who Owns This?</h1>
      </div>
      <nav className="sidebar-nav">
        {links.map(({ to, end, icon: Icon, label, desc }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
          >
            <span className="icon-wrap"><Icon size={16} strokeWidth={2.4} /></span>
            <span>
              <span className="label" style={{ display: 'block' }}>{label}</span>
              <span className="desc">{desc}</span>
            </span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-foot">Daily AI builds · a routing aid, not a verdict</div>
    </aside>
  )
}
