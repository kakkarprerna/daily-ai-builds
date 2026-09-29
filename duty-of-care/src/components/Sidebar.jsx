import { ShieldCheck, MessageCircleHeart, BookOpen, FlaskConical } from 'lucide-react'

const NAV_ITEMS = [
  {
    id: 'check',
    label: 'Check a conversation',
    desc: 'Paste it in, get a private read',
    icon: MessageCircleHeart,
  },
  {
    id: 'examples',
    label: 'See it in action',
    desc: 'Three worked examples',
    icon: FlaskConical,
  },
  {
    id: 'how',
    label: 'How this works',
    desc: 'What it checks, and what it does not',
    icon: BookOpen,
  },
]

export default function Sidebar({ page, setPage }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">
          <ShieldCheck size={18} strokeWidth={2.4} />
        </div>
        <div className="sidebar-brand-text">
          <h1>Duty of Care</h1>
          <span>A quiet second opinion</span>
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
        A prototype, not a monitoring service. Nothing typed here is saved or reported to anyone.
      </div>
    </aside>
  )
}
