// Hacker-vibes avatar for the "Created by Kiki" credit.
// Bigger, more detailed, with a smiling face and matrix-rain aesthetic.
export const HackerAvatar = ({ size = 96, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 128 128"
    className={className}
    aria-hidden="true"
    style={{ filter: "drop-shadow(0 0 12px rgba(0,255,255,0.7))" }}
  >
    <defs>
      <linearGradient id="hood2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1a1a3e" />
        <stop offset="50%" stopColor="#0d0d20" />
        <stop offset="100%" stopColor="#050510" />
      </linearGradient>
      <radialGradient id="eyeGlow2" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#00ffff" />
        <stop offset="60%" stopColor="#00aaff" />
        <stop offset="100%" stopColor="#0044cc" />
      </radialGradient>
      <radialGradient id="faceGrad" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#1a2a3a" />
        <stop offset="100%" stopColor="#0a0a14" />
      </radialGradient>
      <filter id="glow2" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    {/* Background circle */}
    <circle cx="64" cy="64" r="62" fill="#050510" stroke="#00ffff" strokeWidth="1.5" opacity="0.6" />
    {/* Hood */}
    <path d="M20 118 Q20 30 64 18 Q108 30 108 118 Z" fill="url(#hood2)" stroke="#00ffff" strokeWidth="1.5" opacity="0.95" />
    {/* Hood inner shadow */}
    <path d="M28 110 Q28 40 64 28 Q100 40 100 110 Z" fill="url(#faceGrad)" opacity="0.7" />
    {/* Face area */}
    <ellipse cx="64" cy="52" rx="22" ry="26" fill="#0a1520" opacity="0.9" />
    {/* Glowing eyes */}
    <ellipse cx="54" cy="48" rx="5" ry="3" fill="url(#eyeGlow2)" filter="url(#glow2)">
      <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
      <animate attributeName="ry" values="3;1.5;3" dur="4s" repeatCount="indefinite" />
    </ellipse>
    <ellipse cx="74" cy="48" rx="5" ry="3" fill="url(#eyeGlow2)" filter="url(#glow2)">
      <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" begin="0.3s" />
      <animate attributeName="ry" values="3;1.5;3" dur="4s" repeatCount="indefinite" begin="0.3s" />
    </ellipse>
    {/* Eye pupils */}
    <circle cx="54" cy="48" r="1.5" fill="#ffffff" opacity="0.9">
      <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="74" cy="48" r="1.5" fill="#ffffff" opacity="0.9">
      <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" begin="0.3s" />
    </circle>
    {/* Smiling mouth */}
    <path d="M52 60 Q64 72 76 60" fill="none" stroke="#00ffff" strokeWidth="2" strokeLinecap="round" opacity="0.9">
      <animate attributeName="d" values="M52 60 Q64 72 76 60;M52 62 Q64 74 76 62;M52 60 Q64 72 76 60" dur="3s" repeatCount="indefinite" />
    </path>
    {/* Cheek glow */}
    <circle cx="46" cy="56" r="4" fill="#00ffff" opacity="0.15">
      <animate attributeName="opacity" values="0.1;0.25;0.1" dur="2.5s" repeatCount="indefinite" />
    </circle>
    <circle cx="82" cy="56" r="4" fill="#00ffff" opacity="0.15">
      <animate attributeName="opacity" values="0.1;0.25;0.1" dur="2.5s" repeatCount="indefinite" begin="0.5s" />
    </circle>
    {/* Matrix code rain */}
    <text x="22" y="80" fontFamily="monospace" fontSize="7" fill="#00ff88" opacity="0.6">
      <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.5s" repeatCount="indefinite" />
      0110
    </text>
    <text x="48" y="88" fontFamily="monospace" fontSize="6" fill="#00ff88" opacity="0.4">
      <animate attributeName="opacity" values="0.1;0.7;0.1" dur="2s" repeatCount="indefinite" begin="0.5s" />
      1001
    </text>
    <text x="72" y="82" fontFamily="monospace" fontSize="7" fill="#00ff88" opacity="0.5">
      <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1.8s" repeatCount="indefinite" begin="1s" />
      1100
    </text>
    <text x="92" y="90" fontFamily="monospace" fontSize="6" fill="#00ff88" opacity="0.3">
      <animate attributeName="opacity" values="0.1;0.6;0.1" dur="2.2s" repeatCount="indefinite" begin="1.5s" />
      0011
    </text>
    {/* Hood rim glow line */}
    <path d="M20 118 Q64 108 108 118" fill="none" stroke="#00ffff" strokeWidth="1" opacity="0.4">
      <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2.5s" repeatCount="indefinite" />
    </path>
    {/* Circuit lines on hood */}
    <line x1="32" y1="28" x2="40" y2="40" stroke="#00ffff" strokeWidth="0.5" opacity="0.3">
      <animate attributeName="opacity" values="0.1;0.5;0.1" dur="3s" repeatCount="indefinite" />
    </line>
    <line x1="96" y1="28" x2="88" y2="40" stroke="#00ffff" strokeWidth="0.5" opacity="0.3">
      <animate attributeName="opacity" values="0.1;0.5;0.1" dur="3s" repeatCount="indefinite" begin="1s" />
    </line>
    {/* Outer ring pulse */}
    <circle cx="64" cy="64" r="60" fill="none" stroke="#00ffff" strokeWidth="0.5" opacity="0.2">
      <animate attributeName="r" values="58;62;58" dur="3s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite" />
    </circle>
  </svg>
);

export default HackerAvatar;