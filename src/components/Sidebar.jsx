import { HeartHandshake, MessagesSquare, BookOpen, FlaskConical } from 'lucide-react'

const NAV_ITEMS = [
  {
    id: 'check',
    label: 'Get a way to open it',
    desc: 'Describe what you noticed',
    icon: MessagesSquare,
  },
  {
    id: 'examples',
    label: 'See it in action',
    desc: 'Three worked situations',
    icon: FlaskConical,
  },
  {
    id: 'how',
    label: 'How this works',
    desc: 'What it does, and its limits',
    icon: BookOpen,
  },
]

export default function Sidebar({ page, setPage }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">
          <HeartHandshake size={18} strokeWidth={2.4} />
        </div>
        <div className="sidebar-brand-text">
          <h1>How to Bring It Up</h1>
          <span>A way in, not an ambush</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item${page === item.id ? ' active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              <Icon size={17} strokeWidth={2.2} />
              <div>
                <div className="sidebar-nav-item-label">{item.label}</div>
                <div className="sidebar-nav-item-desc">{item.desc}</div>
              </div>
            </button>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        A prototype, not therapy or legal advice. Nothing typed here is saved.
      </div>
    </aside>
  )
}
