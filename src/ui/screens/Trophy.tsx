import { useId } from "react";

// Hand-drawn trophy art, one per honour. Original shapes -- none of them
// reproduces a real trophy. Drawn on a 64x64 grid so every icon shares a
// baseline and reads at the same weight from 18px to 160px.

interface Props {
  id: string;
  size?: number;
  className?: string;
}

export function Trophy({ id, size = 24, className }: Props) {
  const uid = useId().replace(/:/g, "");
  const g = (name: string) => `${name}-${uid}`;
  const common = { width: size, height: size, viewBox: "0 0 64 64", className, "aria-hidden": true } as const;

  switch (id) {
    case "cfpTitle":
      // A tall gold cup on a black plinth, a football riding the lid.
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={g("gold")} x1="0" x2="1">
              <stop offset="0" stopColor="#a8740c" />
              <stop offset="0.45" stopColor="#ffe28a" />
              <stop offset="0.7" stopColor="#ffc940" />
              <stop offset="1" stopColor="#b8820f" />
            </linearGradient>
          </defs>
          <rect x="18" y="54" width="28" height="7" rx="1.5" fill="#1a1a1a" />
          <rect x="21" y="50" width="22" height="5" rx="1" fill="#2b2b2b" />
          <path d="M28 50 L30 40 L34 40 L36 50 Z" fill={`url(#${g("gold")})`} />
          <path d="M17 14 H47 V22 C47 33 40 40 32 40 C24 40 17 33 17 22 Z" fill={`url(#${g("gold")})`} />
          <path d="M17 17 C9 17 9 29 19 31" fill="none" stroke={`url(#${g("gold")})`} strokeWidth="3" />
          <path d="M47 17 C55 17 55 29 45 31" fill="none" stroke={`url(#${g("gold")})`} strokeWidth="3" />
          <ellipse cx="32" cy="9" rx="8" ry="4.6" fill="#7a3f12" />
          <path d="M27 9 H37 M30 7.4 V10.6 M32 7.2 V10.8 M34 7.4 V10.6" stroke="#fff" strokeWidth="0.9" />
          <path d="M22 18 V24 C22 30 26 34 30 35" fill="none" stroke="#fff6cf" strokeWidth="1.6" opacity="0.7" />
        </svg>
      );
    case "confTitle":
      // A wide silver cup with two loop handles.
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={g("silver")} x1="0" x2="1">
              <stop offset="0" stopColor="#7d8794" />
              <stop offset="0.45" stopColor="#ffffff" />
              <stop offset="0.75" stopColor="#c6d0dc" />
              <stop offset="1" stopColor="#7d8794" />
            </linearGradient>
          </defs>
          <rect x="17" y="53" width="30" height="8" rx="1.5" fill="#22324d" />
          <path d="M27 53 L29 43 H35 L37 53 Z" fill={`url(#${g("silver")})`} />
          <path d="M12 12 H52 C52 30 44 43 32 43 C20 43 12 30 12 12 Z" fill={`url(#${g("silver")})`} />
          <path d="M12 16 C3 16 4 30 15 31" fill="none" stroke={`url(#${g("silver")})`} strokeWidth="3.2" />
          <path d="M52 16 C61 16 60 30 49 31" fill="none" stroke={`url(#${g("silver")})`} strokeWidth="3.2" />
          <path d="M26 22 L32 18 L38 22 L35.5 29 H28.5 Z" fill="#ffc940" opacity="0.9" />
          <path d="M17 16 C17 28 22 36 28 39" fill="none" stroke="#fff" strokeWidth="1.6" opacity="0.7" />
        </svg>
      );
    case "bowlWin":
      // A literal bowl: glass, on a wooden base, with a football in it.
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={g("glass")} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#d9f6ff" stopOpacity="0.95" />
              <stop offset="1" stopColor="#6fb6d6" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <rect x="16" y="52" width="32" height="9" rx="2" fill="#6b3f1d" />
          <rect x="16" y="52" width="32" height="2.5" rx="1" fill="#8c5a2e" />
          <path d="M27 52 L29 44 H35 L37 52 Z" fill="#a9d9ec" />
          <ellipse cx="32" cy="30" rx="12" ry="7" fill="#7a3f12" transform="rotate(-18 32 30)" />
          <path d="M25 32 L39 27" stroke="#fff" strokeWidth="1" />
          <path d="M8 24 H56 C56 37 45 45 32 45 C19 45 8 37 8 24 Z" fill={`url(#${g("glass")})`} />
          <ellipse cx="32" cy="24" rx="24" ry="4" fill="none" stroke="#e8fbff" strokeWidth="1.5" />
          <path d="M13 28 C15 36 22 41 29 42" fill="none" stroke="#fff" strokeWidth="1.6" opacity="0.8" />
        </svg>
      );
    case "heisman":
      // A bronze ball carrier mid-stride on a stone plinth. Generic, not a likeness.
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={g("bronze")} x1="0" x2="1">
              <stop offset="0" stopColor="#6e3f17" />
              <stop offset="0.5" stopColor="#e2a46a" />
              <stop offset="1" stopColor="#8a5222" />
            </linearGradient>
          </defs>
          <rect x="15" y="53" width="34" height="8" rx="1.5" fill="#3a3a3a" />
          <rect x="18" y="49" width="28" height="5" rx="1" fill="#555" />
          <g fill={`url(#${g("bronze")})`}>
            <circle cx="35" cy="10" r="5" />
            <path d="M31 15 C35 14 40 16 40 21 L38 31 L33 31 L30 22 Z" />
            <path d="M39 18 L49 15 L50 18 L40 23 Z" />
            <ellipse cx="29" cy="22" rx="5" ry="3.2" transform="rotate(-30 29 22)" />
            <path d="M33 30 L38 30 L41 40 L46 47 L42 49 L36 41 Z" />
            <path d="M33 30 L37 33 L31 40 L24 44 L22 41 L28 37 Z" />
          </g>
        </svg>
      );
    case "allAmerican":
      // A star medal on a striped ribbon.
      return (
        <svg {...common}>
          <path d="M22 4 L32 24 L42 4 Z" fill="#c8102e" />
          <path d="M27 4 L32 14 L37 4 Z" fill="#f2f5fa" />
          <circle cx="32" cy="39" r="18" fill="#c6d0dc" />
          <circle cx="32" cy="39" r="14.5" fill="#1f3a6b" />
          <path
            d="M32 28 L35 35.5 L43 36 L37 41 L39 49 L32 44.6 L25 49 L27 41 L21 36 L29 35.5 Z"
            fill="#f2f5fa"
          />
        </svg>
      );
    case "allConference":
      // A shield with a single star.
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={g("shield")} x1="0" x2="1">
              <stop offset="0" stopColor="#8a5a2c" />
              <stop offset="0.5" stopColor="#e9b884" />
              <stop offset="1" stopColor="#8a5a2c" />
            </linearGradient>
          </defs>
          <path d="M32 4 L54 12 V30 C54 45 44 55 32 60 C20 55 10 45 10 30 V12 Z" fill={`url(#${g("shield")})`} />
          <path d="M32 9 L49 15.5 V30 C49 42 41 50 32 54.5 C23 50 15 42 15 30 V15.5 Z" fill="#22324d" />
          <path d="M32 20 L35 28 L43.5 28.3 L37 33.5 L39.2 42 L32 37.2 L24.8 42 L27 33.5 L20.5 28.3 L29 28 Z" fill="#f0c49c" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="20" fill="#ffc940" />
        </svg>
      );
  }
}
