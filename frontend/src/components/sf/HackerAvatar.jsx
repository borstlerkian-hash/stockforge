// Hacker-vibes avatar for the "Created by Kiki" credit.
// Optimized: fewer DOM nodes, simpler filters, GPU-friendly animations.
export const HackerAvatar = ({ size = 96, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 128 128"
    className={className}
    aria-hidden="true"
    style={{ filter: "drop-shadow(0 0 12px rgba(0,255,255,0.6))" }}
  >
    <defs>
      <linearGradient id="hood5" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1a1a5e" />
        <stop offset="100%" stopColor="#030310" />
      </linearGradient>
      <radialGradient id="eyeGlow5" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#00ffff" />
        <stop offset="100%" stopColor="#003388" />
      </radialGradient>
    </defs>
    {/* Background */}
    <circle cx="64" cy="64" r="62" fill="#030308" stroke="#00ffff" strokeWidth="1" opacity="0.5" />
    {/* Hood */}
    <path d="M16 124 Q16 22 64 12 Q112 22 112 124 Z" fill="url(#hood5)" stroke="#00ffff" strokeWidth="1.2" opacity="0.9" />
    <path d="M24 116 Q24 32 64 22 Q104 32 104 116 Z" fill="#050510" opacity="0.6" />
    {/* Face */}
    <ellipse cx="64" cy="50" rx="24" ry="28" fill="#050508" opacity="0.9" />
    {/* Visor */}
    <rect x="36" y="40" width="56" height="16" rx="8" fill="none" stroke="#00ffff" strokeWidth="1.2" opacity="0.6">
      <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite" />
    </rect>
    {/* Eyes */}
    <ellipse cx="50" cy="47" rx="6" ry="3.5" fill="url(#eyeGlow5)">
      <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
      <animate attributeName="ry" values="3.5;1.5;3.5" dur="4s" repeatCount="indefinite" />
    </ellipse>
    <ellipse cx="78" cy="47" rx="6" ry="3.5" fill="url(#eyeGlow5)">
      <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" begin="0.3s" />
      <animate attributeName="ry" values="3.5;1.5;3.5" dur="4s" repeatCount="indefinite" begin="0.3s" />
    </ellipse>
    <circle cx="50" cy="47" r="2" fill="#fff" opacity="0.9">
      <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="78" cy="47" r="2" fill="#fff" opacity="0.9">
      <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" begin="0.3s" />
    </circle>
    {/* Smiling mouth */}
    <path d="M48 66 Q64 80 80 66" fill="none" stroke="#00ffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.9">
      <animate attributeName="d" values="M48 66 Q64 80 80 66;M46 68 Q64 82 82 68;M48 66 Q64 80 80 66" dur="3s" repeatCount="indefinite" />
    </path>
    {/* Teeth */}
    <path d="M54 70 L56 72 L58 70 M60 70 L62 72 L64 70 M66 70 L68 72 L70 70 M72 70 L74 72 L76 70" stroke="#00ffff" strokeWidth="0.8" opacity="0.3" fill="none" />
    {/* Cheek glow */}
    <circle cx="40" cy="56" r="5" fill="#00ffff" opacity="0.1">
      <animate attributeName="opacity" values="0.05;0.2;0.05" dur="2.5s" repeatCount="indefinite" />
    </circle>
    <circle cx="88" cy="56" r="5" fill="#00ffff" opacity="0.1">
      <animate attributeName="opacity" values="0.05;0.2;0.05" dur="2.5s" repeatCount="indefinite" begin="0.5s" />
    </circle>
    {/* Matrix code rain */}
    <text x="20" y="88" fontFamily="monospace" fontSize="8" fill="#00ff88" opacity="0.6">
      <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.5s" repeatCount="indefinite" />
      0110
    </text>
    <text x="46" y="98" fontFamily="monospace" fontSize="7" fill="#00ff88" opacity="0.4">
      <animate attributeName="opacity" values="0.1;0.7;0.1" dur="2s" repeatCount="indefinite" begin="0.5s" />
      1001
    </text>
    <text x="72" y="90" fontFamily="monospace" fontSize="8" fill="#00ff88" opacity="0.5">
      <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1.8s" repeatCount="indefinite" begin="1s" />
      1100
    </text>
    {/* Circuit lines */}
    <line x1="28" y1="24" x2="40" y2="38" stroke="#00ffff" strokeWidth="0.8" opacity="0.3">
      <animate attributeName="opacity" values="0.1;0.5;0.1" dur="3s" repeatCount="indefinite" />
    </line>
    <line x1="100" y1="24" x2="88" y2="38" stroke="#00ffff" strokeWidth="0.8" opacity="0.3">
      <animate attributeName="opacity" values="0.1;0.5;0.1" dur="3s" repeatCount="indefinite" begin="1s" />
    </line>
    {/* Hood rim glow */}
    <path d="M16 124 Q64 112 112 124" fill="none" stroke="#00ffff" strokeWidth="1.2" opacity="0.4">
      <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2.5s" repeatCount="indefinite" />
    </path>
    {/* Orbiting particles */}
    <g style={{ animation: "spin 6s linear infinite", transformOrigin: "64px 64px" }}>
      <circle cx="64" cy="14" r="3" fill="#00ffff" opacity="0.8">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="64" cy="114" r="3" fill="#00ffff" opacity="0.8">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" begin="0.75s" />
      </circle>
    </g>
    <g style={{ animation: "spin 6s linear infinite reverse", transformOrigin: "64px 64px" }}>
      <circle cx="64" cy="14" r="2" fill="#0088ff" opacity="0.6">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="64" cy="114" r="2" fill="#0088ff" opacity="0.6">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" begin="1s" />
      </circle>
    </g>
    {/* Hexagon grid on hood */}
    <g opacity="0.12">
      <polygon points="64,28 74,33 74,43 64,48 54,43 54,33" fill="none" stroke="#00ffff" strokeWidth="0.5" />
      <polygon points="64,50 74,55 74,65 64,70 54,65 54,55" fill="none" stroke="#00ffff" strokeWidth="0.5" />
      <polygon points="54,38 64,43 64,53 54,58 44,53 44,43" fill="none" stroke="#00ffff" strokeWidth="0.5" />
      <polygon points="74,38 84,43 84,53 74,58 64,53 64,43" fill="none" stroke="#00ffff" strokeWidth="0.5" />
    </g>
  </svg>
);

export default HackerAvatar;