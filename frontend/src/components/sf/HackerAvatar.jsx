// Hacker-vibes avatar for the "Created by Kiki" credit.
// Enhanced: holographic visor, particle effects, advanced animations, more detail.
export const HackerAvatar = ({ size = 96, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 128 128"
    className={className}
    aria-hidden="true"
    style={{ filter: "drop-shadow(0 0 18px rgba(0,255,255,0.85))" }}
  >
    <defs>
      <linearGradient id="hood4" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1a1a5e" />
        <stop offset="30%" stopColor="#0d0d38" />
        <stop offset="70%" stopColor="#080820" />
        <stop offset="100%" stopColor="#030310" />
      </linearGradient>
      <radialGradient id="eyeGlow4" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="30%" stopColor="#00ffff" />
        <stop offset="70%" stopColor="#0088ff" />
        <stop offset="100%" stopColor="#002266" />
      </radialGradient>
      <radialGradient id="faceGrad4" cx="50%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#1a3a5a" />
        <stop offset="50%" stopColor="#0a1525" />
        <stop offset="100%" stopColor="#030308" />
      </radialGradient>
      <linearGradient id="visorGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#00ffff" stopOpacity="0.1" />
        <stop offset="50%" stopColor="#00ffff" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#00ffff" stopOpacity="0.1" />
      </linearGradient>
      <filter id="glow4" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="glowStrong4" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="holo" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.8 0" result="colored" />
        <feMerge>
          <feMergeNode in="colored" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    {/* Background with subtle grid */}
    <circle cx="64" cy="64" r="62" fill="#030308" stroke="#00ffff" strokeWidth="1.5" opacity="0.6" />
    <circle cx="64" cy="64" r="62" fill="none" stroke="#00ffff" strokeWidth="0.3" opacity="0.15" strokeDasharray="4 8" />
    {/* Outer rotating ring */}
    <g>
      <animateTransform attributeName="transform" type="rotate" from="0 64 64" to="360 64 64" dur="12s" repeatCount="indefinite" />
      <circle cx="64" cy="64" r="58" fill="none" stroke="#00ffff" strokeWidth="0.8" opacity="0.3" strokeDasharray="8 16" />
      <circle cx="64" cy="6" r="2.5" fill="#00ffff" filter="url(#glow4)">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
      </circle>
    </g>
    {/* Inner counter-rotating ring */}
    <g>
      <animateTransform attributeName="transform" type="rotate" from="360 64 64" to="0 64 64" dur="8s" repeatCount="indefinite" />
      <circle cx="64" cy="64" r="50" fill="none" stroke="#0088ff" strokeWidth="0.5" opacity="0.25" strokeDasharray="4 12" />
      <circle cx="64" cy="14" r="2" fill="#0088ff" filter="url(#glow4)">
        <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1.5s" repeatCount="indefinite" />
      </circle>
    </g>
    {/* Hood */}
    <path d="M14 126 Q14 20 64 10 Q114 20 114 126 Z" fill="url(#hood4)" stroke="#00ffff" strokeWidth="1.5" opacity="0.95" />
    {/* Hood inner shadow */}
    <path d="M22 118 Q22 30 64 20 Q106 30 106 118 Z" fill="url(#faceGrad4)" opacity="0.5" />
    {/* Face area */}
    <ellipse cx="64" cy="48" rx="26" ry="30" fill="#050508" opacity="0.85" />
    {/* Holographic visor */}
    <rect x="34" y="38" width="60" height="18" rx="9" fill="url(#visorGrad)" stroke="#00ffff" strokeWidth="1.5" opacity="0.7" filter="url(#glow4)">
      <animate attributeName="opacity" values="0.5;0.85;0.5" dur="2.5s" repeatCount="indefinite" />
    </rect>
    {/* Visor scan line */}
    <rect x="34" y="44" width="60" height="1.5" fill="#00ffff" opacity="0.6" filter="url(#glow4)">
      <animate attributeName="y" values="38;56;38" dur="2s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2s" repeatCount="indefinite" />
    </rect>
    {/* Glowing eyes */}
    <ellipse cx="50" cy="47" rx="7" ry="4" fill="url(#eyeGlow4)" filter="url(#glowStrong4)">
      <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
      <animate attributeName="ry" values="4;2;4" dur="4s" repeatCount="indefinite" />
    </ellipse>
    <ellipse cx="78" cy="47" rx="7" ry="4" fill="url(#eyeGlow4)" filter="url(#glowStrong4)">
      <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" begin="0.3s" />
      <animate attributeName="ry" values="4;2;4" dur="4s" repeatCount="indefinite" begin="0.3s" />
    </ellipse>
    {/* Eye pupils */}
    <circle cx="50" cy="47" r="2.5" fill="#ffffff" opacity="0.95">
      <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="78" cy="47" r="2.5" fill="#ffffff" opacity="0.95">
      <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" begin="0.3s" />
    </circle>
    {/* Eye tracking movement */}
    <circle cx="50" cy="47" r="1" fill="#00ffff" opacity="0.6">
      <animate attributeName="cx" values="48;52;48" dur="3s" repeatCount="indefinite" />
    </circle>
    <circle cx="78" cy="47" r="1" fill="#00ffff" opacity="0.6">
      <animate attributeName="cx" values="76;80;76" dur="3s" repeatCount="indefinite" begin="0.5s" />
    </circle>
    {/* Smiling mouth */}
    <path d="M48 66 Q64 82 80 66" fill="none" stroke="#00ffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" filter="url(#glow4)">
      <animate attributeName="d" values="M48 66 Q64 82 80 66;M46 68 Q64 84 82 68;M48 66 Q64 82 80 66" dur="3s" repeatCount="indefinite" />
    </path>
    {/* Teeth */}
    <path d="M54 70 L56 72 L58 70 M60 70 L62 72 L64 70 M66 70 L68 72 L70 70 M72 70 L74 72 L76 70" stroke="#00ffff" strokeWidth="0.8" opacity="0.35" fill="none" />
    {/* Cheek glow */}
    <circle cx="40" cy="56" r="6" fill="#00ffff" opacity="0.12">
      <animate attributeName="opacity" values="0.06;0.22;0.06" dur="2.5s" repeatCount="indefinite" />
    </circle>
    <circle cx="88" cy="56" r="6" fill="#00ffff" opacity="0.12">
      <animate attributeName="opacity" values="0.06;0.22;0.06" dur="2.5s" repeatCount="indefinite" begin="0.5s" />
    </circle>
    {/* Matrix code rain */}
    <text x="18" y="88" fontFamily="monospace" fontSize="9" fill="#00ff88" opacity="0.7" filter="url(#glow4)">
      <animate attributeName="opacity" values="0.2;0.9;0.2" dur="1.5s" repeatCount="indefinite" />
      0110
    </text>
    <text x="44" y="98" fontFamily="monospace" fontSize="8" fill="#00ff88" opacity="0.5">
      <animate attributeName="opacity" values="0.1;0.8;0.1" dur="2s" repeatCount="indefinite" begin="0.5s" />
      1001
    </text>
    <text x="70" y="90" fontFamily="monospace" fontSize="9" fill="#00ff88" opacity="0.6" filter="url(#glow4)">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" repeatCount="indefinite" begin="1s" />
      1100
    </text>
    <text x="92" y="100" fontFamily="monospace" fontSize="8" fill="#00ff88" opacity="0.4">
      <animate attributeName="opacity" values="0.1;0.7;0.1" dur="2.2s" repeatCount="indefinite" begin="1.5s" />
      0011
    </text>
    {/* Circuit lines on hood */}
    <line x1="28" y1="24" x2="40" y2="38" stroke="#00ffff" strokeWidth="0.8" opacity="0.4" filter="url(#glow4)">
      <animate attributeName="opacity" values="0.1;0.6;0.1" dur="3s" repeatCount="indefinite" />
    </line>
    <line x1="100" y1="24" x2="88" y2="38" stroke="#00ffff" strokeWidth="0.8" opacity="0.4" filter="url(#glow4)">
      <animate attributeName="opacity" values="0.1;0.6;0.1" dur="3s" repeatCount="indefinite" begin="1s" />
    </line>
    <line x1="64" y1="20" x2="64" y2="30" stroke="#00ffff" strokeWidth="0.6" opacity="0.3">
      <animate attributeName="opacity" values="0.1;0.5;0.1" dur="2s" repeatCount="indefinite" />
    </line>
    {/* Hood rim glow */}
    <path d="M14 126 Q64 112 114 126" fill="none" stroke="#00ffff" strokeWidth="1.5" opacity="0.5" filter="url(#glow4)">
      <animate attributeName="opacity" values="0.2;0.7;0.2" dur="2.5s" repeatCount="indefinite" />
    </path>
    {/* Data stream particles */}
    <g>
      <animateTransform attributeName="transform" type="rotate" from="0 64 64" to="360 64 64" dur="6s" repeatCount="indefinite" />
      <circle cx="64" cy="14" r="3.5" fill="#00ffff" filter="url(#glow4)">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="64" cy="114" r="3.5" fill="#00ffff" filter="url(#glow4)">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" begin="0.75s" />
      </circle>
    </g>
    <g>
      <animateTransform attributeName="transform" type="rotate" from="120 64 64" to="480 64 64" dur="6s" repeatCount="indefinite" />
      <circle cx="64" cy="14" r="2.5" fill="#00aaff" filter="url(#glow4)">
        <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="64" cy="114" r="2.5" fill="#00aaff" filter="url(#glow4)">
        <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2s" repeatCount="indefinite" begin="1s" />
      </circle>
    </g>
    <g>
      <animateTransform attributeName="transform" type="rotate" from="240 64 64" to="600 64 64" dur="6s" repeatCount="indefinite" />
      <circle cx="64" cy="14" r="3" fill="#00ffff" filter="url(#glow4)">
        <animate attributeName="opacity" values="0.35;1;0.35" dur="1.8s" repeatCount="indefinite" />
      </circle>
      <circle cx="64" cy="114" r="3" fill="#00ffff" filter="url(#glow4)">
        <animate attributeName="opacity" values="0.35;1;0.35" dur="1.8s" repeatCount="indefinite" begin="0.9s" />
      </circle>
    </g>
    {/* Hexagon grid pattern on hood */}
    <g opacity="0.15">
      <polygon points="64,28 74,33 74,43 64,48 54,43 54,33" fill="none" stroke="#00ffff" strokeWidth="0.5" />
      <polygon points="64,50 74,55 74,65 64,70 54,65 54,55" fill="none" stroke="#00ffff" strokeWidth="0.5" />
      <polygon points="54,38 64,43 64,53 54,58 44,53 44,43" fill="none" stroke="#00ffff" strokeWidth="0.5" />
      <polygon points="74,38 84,43 84,53 74,58 64,53 64,43" fill="none" stroke="#00ffff" strokeWidth="0.5" />
    </g>
  </svg>
);

export default HackerAvatar;