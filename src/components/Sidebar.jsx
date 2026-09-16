import { IconRadar, IconBook, IconLayers } from '../icons.jsx'

const NAV = [
  {
    id: 'diagnose',
    label: 'Diagnose a bug',
    desc: 'Pattern or one-off, with a confidence read',
    icon: IconRadar,
  },
  {
    id: 'how',
    label: 'How it works',
    desc: 'What the verdict is based on',
    icon: IconBook,
  },
  {
    id: 'examples',
    label: 'Examples',
    desc: 'Three worked reports, no key needed',
    icon: IconLayers,
  },
]

export default function Sidebar({ active, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">
          <IconRadar width={22} height={22} />
        </div>
        <div>
          <div className="brand-title">Pattern or One-Off?</div>
          <div className="brand-sub">Bug triage, without pulling in engineering yet</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              className={`nav-item ${active === item.id ? 'nav-item-active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon width={18} height={18} />
              <span className="nav-text">
                <span className="nav-label">{item.label}</span>
                <span className="nav-desc">{item.desc}</span>
              </span>
            </button>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        Daily AI builds · a PM tool, not an engineering one
      </div>
    </aside>
  )
}
