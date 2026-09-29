// Lightweight inline icon set — no external icon library needed.
const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export const IconRadar = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <path d="M12 3v3M21 12h-3" />
  </svg>
)

export const IconLayers = (props) => (
  <svg {...base} {...props}>
    <path d="M12 3 3 8l9 5 9-5-9-5Z" />
    <path d="m3 13 9 5 9-5" />
  </svg>
)

export const IconBook = (props) => (
  <svg {...base} {...props}>
    <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5v-18Z" />
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
  </svg>
)

export const IconClock = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </svg>
)

export const IconUsers = (props) => (
  <svg {...base} {...props}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.5 20c.7-3.4 3.2-5.5 6.5-5.5s5.8 2.1 6.5 5.5" />
    <circle cx="17.5" cy="8.5" r="2.5" />
    <path d="M16 14.8c2.4.5 4 2.2 4.5 4.7" />
  </svg>
)

export const IconGitCommit = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M3 12h6M15 12h6" />
  </svg>
)

export const IconArrowRight = (props) => (
  <svg {...base} {...props}>
    <path d="M4 12h16M13 5l7 7-7 7" />
  </svg>
)

export const IconCheckCircle = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12.5 2.5 2.5L16 9.5" />
  </svg>
)

export const IconAlertTriangle = (props) => (
  <svg {...base} {...props}>
    <path d="M12 3.5 2.5 20h19L12 3.5Z" />
    <path d="M12 10v4.5M12 17.5h.01" />
  </svg>
)

export const IconHelpCircle = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.2a2.5 2.5 0 1 1 3.4 2.3c-.9.4-1.4 1-1.4 2.1" />
    <path d="M12 17.5h.01" />
  </svg>
)

export const IconPlus = (props) => (
  <svg {...base} {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconSparkle = (props) => (
  <svg {...base} {...props}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M17.5 17.5 15 15M6 18l2.5-2.5M17.5 6.5 15 9" />
  </svg>
)

export const IconLoader = (props) => (
  <svg {...base} {...props} className={`spin ${props.className || ''}`}>
    <path d="M12 3a9 9 0 1 0 9 9" />
  </svg>
)

export const IconKey = (props) => (
  <svg {...base} {...props}>
    <circle cx="8" cy="15" r="4.5" />
    <path d="M11.5 11.5 20 3M16.5 5 19 7.5M14 7.5l2 2" />
  </svg>
)

export const IconRotate = (props) => (
  <svg {...base} {...props}>
    <path d="M3 12a9 9 0 1 1 3 6.7" />
    <path d="M3 21v-6h6" />
  </svg>
)
