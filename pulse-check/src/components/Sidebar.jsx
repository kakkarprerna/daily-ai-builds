import { PulseIcon, GridIcon, BookIcon } from "./Icons";

const NAV_ITEMS = [
  { id: "score", label: "Score an account", icon: PulseIcon },
  { id: "method", label: "How it works", icon: BookIcon },
  { id: "examples", label: "Examples", icon: GridIcon },
];

export default function Sidebar({ view, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">
          <PulseIcon />
        </div>
        <div>
          <div className="brand-name">Pulse Check</div>
          <div className="brand-sub">Account health, shown in the open</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item${active ? " active" : ""}`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <p>
          Every score on this page comes from a fixed formula, not a model.
          See exactly how in <button className="link-btn" onClick={() => onNavigate("method")}>How it works</button>.
        </p>
      </div>
    </aside>
  );
}
