const s = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
}

export const ChevronDown = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export const Headset = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
    <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
    <rect x="3" y="13" width="4" height="6" rx="1.6" />
    <rect x="17" y="13" width="4" height="6" rx="1.6" />
    <path d="M20 19v.5a2.5 2.5 0 0 1-2.5 2.5H13" />
  </svg>
)

export const BadgeCheck = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
    <path d="M12 3.2 14.2 5l2.7-.4 1 2.6 2.3 1.5-.9 2.6.9 2.6-2.3 1.5-1 2.6-2.7-.4L12 20.8 9.8 19l-2.7.4-1-2.6-2.3-1.5.9-2.6-.9-2.6 2.3-1.5 1-2.6 2.7.4z" />
    <path d="m9.2 12.2 2 2 3.8-4.2" />
  </svg>
)

export const Clock = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
)

export const Search = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

export const Metro = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
    <rect x="5" y="3" width="14" height="15" rx="3" />
    <path d="M5 12h14M9 18l-2 3M15 18l2 3" />
    <circle cx="8.5" cy="14.5" r="0.9" fill="currentColor" />
    <circle cx="15.5" cy="14.5" r="0.9" fill="currentColor" />
  </svg>
)

export const ArrowRight = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

/* 全站返回按钮统一图标：纯 chevron，粗描边 */
export const ChevronLeft = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 6-6 6 6 6" />
  </svg>
)

export const ArrowUpRight = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
)

export const Check = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
    <path d="M4 12.5 9.5 18 20 6.5" />
  </svg>
)

export const Copy = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

export const Close = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const Globe = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" />
  </svg>
)

export const Doc = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
    <path d="M7 3h7l4 4v14H7z" />
    <path d="M14 3v4h4M9.5 12.5h6M9.5 16h6" />
  </svg>
)

export const Home = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
    <path d="M4 11 12 4l8 7" />
    <path d="M6 10v10h12V10" />
    <path d="M10 20v-5h4v5" />
  </svg>
)

export const Chat = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
    <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
  </svg>
)

export const Mail = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </svg>
)

export const Phone = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
    <path d="M5 4h4l1.5 4.5L8 10a12 12 0 0 0 6 6l1.5-2.5L20 15v4a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4Z" />
  </svg>
)

export const WhatsApp = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor">
    <path d="M16 3C9 3 3.4 8.6 3.4 15.6c0 2.2.6 4.4 1.7 6.3L3.3 29l7.3-1.9a12.8 12.8 0 0 0 5.4 1.2h.1c7 0 12.6-5.6 12.6-12.6S23 3 16 3Zm0 22.9h-.1c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-4.3 1.1 1.1-4.2-.2-.4a10.3 10.3 0 0 1-1.6-5.5c0-5.7 4.7-10.3 10.5-10.3 2.8 0 5.4 1.1 7.3 3a10.2 10.2 0 0 1 3 7.3c0 5.7-4.7 10.3-10 10.7Zm5.8-7.7c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.9-.8 2.1-1.5.3-.7.3-1.3.2-1.5-.1-.1-.3-.2-.6-.4Z" />
  </svg>
)

export const WeChat = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor">
    <path d="M12.4 4C6.7 4 2 8 2 13c0 2.8 1.5 5.3 3.9 7l-1 3 3.5-1.7c1.2.3 2.5.5 3.9.5h.7a8 8 0 0 1-.3-2.2c0-4.5 4.3-8.1 9.5-8.1h.7C22 7.2 17.7 4 12.4 4Zm-3.3 5.2a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6Zm6.9 0a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6Z" />
    <path d="M30 19.7c0-3.8-3.6-6.9-8-6.9s-8 3.1-8 6.9 3.6 6.9 8 6.9c.9 0 1.8-.1 2.7-.4l2.8 1.5-.8-2.4c2-1.3 3.3-3.3 3.3-5.6Zm-10.6-1.2a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Zm5.3 0a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z" />
  </svg>
)

export const TikTok = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.53 0c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.1 2.7 1.65 4.2 1.72v3.49c-1.61-.03-3.21-.44-4.57-1.26-.07 2.32.02 4.65-.01 6.96-.19 2.86-2.31 5.35-5.04 6.04-2.12.57-4.52-.09-6.08-1.76-1.72-1.8-2.29-4.5-1.39-6.78.78-2.07 2.73-3.57 4.92-3.82.25-.02.5-.04.75-.04l.01 3.6c-.45-.09-.92-.11-1.38-.03-1.23.19-2.28 1.14-2.55 2.35-.34 1.47.39 3.04 1.7 3.72 1.23.67 2.86.38 3.76-.68.53-.62.82-1.43.84-2.25.03-3.62.01-7.25.02-10.87.01-1.35-.02-2.7.16-4.02z" />
  </svg>
)

export const Sparkle = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.5c.4 3.7 1.8 5.1 5.5 5.5-3.7.4-5.1 1.8-5.5 5.5-.4-3.7-1.8-5.1-5.5-5.5 3.7-.4 5.1-1.8 5.5-5.5Z" />
    <path d="M18.5 13c.2 2 .9 2.8 2.9 3-2 .2-2.7 1-2.9 3-.2-2-.9-2.8-2.9-3 2-.2 2.7-1 2.9-3Z" />
  </svg>
)

export const FX = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
    <path d="M4 8h13M14 5l3 3-3 3M20 16H7M10 13l-3 3 3 3" />
  </svg>
)

export const Heart = ({ size = 22, filled = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20.5s-7.5-4.7-9.6-9.1C1 7.8 2.9 4.8 6 4.5c1.9-.2 3.6.9 4.6 2.4l1.4 2 1.4-2c1-1.5 2.7-2.6 4.6-2.4 3.1.3 5 3.3 3.6 6.9-2.1 4.4-9.6 9.1-9.6 9.1Z" />
  </svg>
)

export const Star = ({ size = 18, filled = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinejoin="round"
  >
    <path d="m12 3.4 2.6 5.3 5.8.9-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.9Z" />
  </svg>
)

export const ChevronRight = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...s} strokeWidth={2.2}>
    <path d="m9 5 7 7-7 7" />
  </svg>
)

export const iconMap = { globe: Globe, doc: Doc, home: Home, chat: Chat }

export const VideoCam = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
    <rect x="2.5" y="6" width="13" height="12" rx="2.5" />
    <path d="m15.5 10.5 6-3.4v9.8l-6-3.4" />
  </svg>
)

export const Plane = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
    <path d="M10.5 13.5 3 11l1-2 8 .5 4.2-5c.7-.9 2.1-1 2.7-.1.6.8.4 2-.4 2.6l-5 4.2.6 8-2 1-2.6-6.7Z" />
  </svg>
)

export const Passport = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
    <rect x="5" y="2.5" width="14" height="19" rx="2.5" />
    <circle cx="12" cy="10" r="3.4" />
    <path d="M8.8 16.2h6.4M9 5.5h6" />
  </svg>
)

export const Broom = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
    <path d="M13.5 2.8 21 6.5l-4.2 3.9-3.7-3.9z" />
    <path d="m13.1 10.4-7.9 7.9c-.9.9-2 1.5-2 2.7h3.5c1.1 0 2.2-.5 3-1.3l6.6-6.6" />
  </svg>
)

export const Truck = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
    <path d="M2.5 6.5h11v10h-11z" />
    <path d="M13.5 9.5h4l4 3.5v3.5h-8" />
    <circle cx="6.8" cy="17.8" r="1.7" />
    <circle cx="17.2" cy="17.8" r="1.7" />
  </svg>
)

export const Briefcase = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
    <rect x="2.8" y="7" width="18.4" height="12.5" rx="2.5" />
    <path d="M9 7V5.2A2.2 2.2 0 0 1 11.2 3h1.6A2.2 2.2 0 0 1 15 5.2V7M2.8 12.4h18.4" />
  </svg>
)

export const HouseDeal = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
    <path d="M3.5 11.2 11 4.8l7.5 6.4" />
    <path d="M5.5 9.8V20h13V9.8" />
    <path d="m9.6 14.6 2 2 3.3-3.7" />
  </svg>
)

export const extraIconMap = {
  video: VideoCam,
  plane: Plane,
  passport: Passport,
  broom: Broom,
  truck: Truck,
  briefcase: Briefcase,
  house: HouseDeal,
  sparkle: Sparkle
}
