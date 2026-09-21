const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function PulseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...stroke} {...props}>
      <path d="M2 12h4l2-7 4 14 3-10 2 3h5" />
    </svg>
  );
}

export function TargetIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...stroke} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function UsersIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...stroke} {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15.5 14c2.5.4 4.5 2.5 4.5 6" />
    </svg>
  );
}

export function SmileIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...stroke} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 14c1 1.3 2.2 2 3.5 2s2.5-.7 3.5-2" />
      <line x1="8.7" y1="9.5" x2="8.7" y2="9.51" strokeWidth="2.6" />
      <line x1="15.3" y1="9.5" x2="15.3" y2="9.51" strokeWidth="2.6" />
    </svg>
  );
}

export function LifeBuoyIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...stroke} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.5" />
      <line x1="6" y1="6" x2="9.3" y2="9.3" />
      <line x1="14.7" y1="14.7" x2="18" y2="18" />
      <line x1="18" y1="6" x2="14.7" y2="9.3" />
      <line x1="9.3" y1="14.7" x2="6" y2="18" />
    </svg>
  );
}

export function TrendUpIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...stroke} {...props}>
      <polyline points="3 16 9 10 13 14 21 6" />
      <polyline points="15 6 21 6 21 12" />
    </svg>
  );
}

export function TrendDownIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...stroke} {...props}>
      <polyline points="3 8 9 14 13 10 21 18" />
      <polyline points="21 12 21 18 15 18" />
    </svg>
  );
}

export function AlertIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke} {...props}>
      <path d="M12 3.5 21.5 20h-19L12 3.5Z" />
      <line x1="12" y1="9.5" x2="12" y2="13.5" />
      <line x1="12" y1="16.2" x2="12" y2="16.21" strokeWidth="2.6" />
    </svg>
  );
}

export function ArrowRightIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke} {...props}>
      <line x1="4" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </svg>
  );
}

export function CompassIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...stroke} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <polygon points="15 9 13 13 9 15 11 11 15 9" />
    </svg>
  );
}

export function GridIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...stroke} {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function BookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...stroke} {...props}>
      <path d="M4 4.5A2 2 0 0 1 6 3h13v16.5H6a2 2 0 0 0-2 2Z" />
      <path d="M4 4.5v17" />
    </svg>
  );
}
