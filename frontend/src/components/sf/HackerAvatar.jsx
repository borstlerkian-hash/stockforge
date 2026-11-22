// Hacker-vibes avatar for the "Created by Kiki" credit.
// Enhanced: bigger, more detailed, animated face, matrix rain, circuit patterns, visor.
export const HackerAvatar = ({ size = 96, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 128 128"
    className={className}
    aria-hidden="true"
    style={{ filter: "drop-shadow(0 0 16px rgba(0,255,255,0.8))" }}
  >
    <defs>
      <linearGradient id="hood3" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1a1a4e" />
        <stop offset="40%" stopColor="#0d0d28" />
        <stop offset="100%" stopColor="#050510" />
      </linearGradient>
      <radialGradient id="eyeGlow3" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#00ffff" />
        <stop offset="40%" stopColor="#00aaff" />
        <stop offset="100%" stopColor="#003388" />
      </radialGradient>
      <radialGradient id="faceGrad3" cx="50%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#1a2a4a" />
        <stop offset="100%" stopColor="#050510" />
      </radialGradient>
      <filter id="glow3" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="glowStrong" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    {/* Background */}
    <circle cx="64" cy="64" r="62" fill="#050510" stroke="#00ffff" strokeWidth="1.5" opacity="0.5" />
    {/* Outer ring pulse */}
    <circle cx="64" cy="64" r="58" fill="none" stroke="#00ffff" strokeWidth="0.5" opacity="0.2">
      <animate attributeName="r" values="56;62;56" dur="3s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.1;0.35;0.1" dur="3s" repeatCount="indefinite" />
    </circle>
    {/* Hood */}
    <path d="M16 122 Q16 24 64 14 Q112 24 112 122 Z" fill="url(#hood3)" stroke="#00ffff" strokeWidth="1.5" opacity="0.95" />
    {/* Hood inner */}
    <path d="M24 115 Q24 34 64 24 Q104 34 104 115 Z" fill="url(#faceGrad3)" opacity="0.6" />
    {/* Face shadow */}
    <ellipse cx="64" cy="50" rx="24" ry="28" fill="#050508" opacity="0.9" />
    {/* Visor / glasses frame */}
    <rect x="38" y="42" width="52" height="14" rx="7" fill="none" stroke="#00ffff" strokeWidth="1.2" opacity="0.6" filter="url(#glow3)">
      <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite" />
    </rect>
    {/* Glowing eyes */}
    <ellipse cx="52" cy="49" rx="6" ry="3.5" fill="url(#eyeGlow3)" filter="url(#glowStrong)">
      <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
      <animate attributeName="ry" values="3.5;1.5;3.5" dur="4s" repeatCount="indefinite" />
    </ellipse>
    <ellipse cx="76" cy="49" rx="6" ry="3.5" fill="url(#eyeGlow3)" filter="url(#glowStrong)">
      <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" begin="0.3s" />
      <animate attributeName="ry" values="3.5;1.5;3.5" dur="4s" repeatCount="indefinite" begin="0.3s" />
    </ellipse>
    {/* Eye pupils */}
    <circle cx="52" cy="49" r="2" fill="#ffffff" opacity="0.95">
      <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="76" cy="49" r="2" fill="#ffffff" opacity="0.95">
      <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" begin="0.3s" />
    </circle>
    {/* Smiling mouth */}
    <path d="M50 64 Q64 78 78 64" fill="none" stroke="#00ffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" filter="url(#glow3)">
      <animate attributeName="d" values="M50 64 Q64 78 78 64;M48 66 Q64 80 80 66;M50 64 Q64 78 78 64" dur="3s" repeatCount="indefinite" />
    </path>
    {/* Teeth hint */}
    <path d="M56 68 L58 70 L60 68 M62 68 L64 70 L66 68 M68 68 L70 70 L72 68" stroke="#00ffff" strokeWidth="0.8" opacity="0.4" fill="none" />
    {/* Cheek glow */}
    <circle cx="42" cy="58" r="5" fill="#00ffff" opacity="0.12">
      <animate attributeName="opacity" values="0.08;0.25;0.08" dur="2.5s" repeatCount="indefinite" />
    </circle>
    <circle cx="86" cy="58" r="5" fill="#00ffff" opacity="0.12">
      <animate attributeName="opacity" values="0.08;0.25;0.08" dur="2.5s" repeatCount="indefinite" begin="0.5s" />
    </circle>
    {/* Matrix code rain */}
    <text x="20" y="82" fontFamily="monospace" fontSize="8" fill="#00ff88" opacity="0.7" filter="url(#glow3)">
      <animate attributeName="opacity" values="0.2;0.9;0.2" dur="1.5s" repeatCount="indefinite" />
      0110
    </text>
    <text x="46" y="92" fontFamily="monospace" fontSize="7" fill="#00ff88" opacity="0.5">
      <animate attributeName="opacity" values="0.1;0.8;0.1" dur="2s" repeatCount="indefinite" begin="0.5s" />
      1001
    </text>
    <text x="72" y="84" fontFamily="monospace" fontSize="8" fill="#00ff88" opacity="0.6" filter="url(#glow3)">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" repeatCount="indefinite" begin="1s" />
      1100
    </text>
    <text x="92" y="94" fontFamily="monospace" fontSize="7" fill="#00ff88" opacity="0.4">
      <animate attributeName="opacity" values="0.1;0.7;0.1" dur="2.2s" repeatCount="indefinite" begin="1.5s" />
      0011
    </text>
    {/* Circuit lines on hood */}
    <line x1="30" y1="26" x2="42" y2="40" stroke="#00ffff" strokeWidth="0.8" opacity="0.4" filter="url(#glow3)">
      <animate attributeName="opacity" values="0.1;0.6;0.1" dur="3s" repeatCount="indefinite" />
    </line>
    <line x1="98" y1="26" x2="86" y2="40" stroke="#00ffff" strokeWidth="0.8" opacity="0.4" filter="url(#glow3)">
      <animate attributeName="opacity" values="0.1;0.6;0.1" dur="3s" repeatCount="indefinite" begin="1s" />
    </line>
    <line x1="64" y1="24" x2="64" y2="32" stroke="#00ffff" strokeWidth="0.6" opacity="0.3">
      <animate attributeName="opacity" values="0.1;0.5;0.1" dur="2s" repeatCount="indefinite" />
    </line>
    {/* Hood rim glow */}
    <path d="M16 122 Q64 110 112 122" fill="none" stroke="#00ffff" strokeWidth="1.2" opacity="0.5" filter="url(#glow3)">
      <animate attributeName="opacity" values="0.2;0.7;0.2" dur="2.5s" repeatCount="indefinite" />
    </path>
    {/* Scan line on face */}
    <rect x="38" y="42" width="52" height="2" fill="#00ffff" opacity="0.3" filter="url(#glow3)">
      <animate attributeName="y" values="42;56;42" dur="3s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.1;0.5;0.1" dur="3s" repeatCount="indefinite" />
    </rect>
    {/* Data stream particles */}
    <g>
      <animateTransform attributeName="transform" type="rotate" from="0 64 64" to="360 64 64" dur="8s" repeatCount="indefinite" />
      <circle cx="64" cy="18" r="3" fill="#00ffff" filter="url(#glow3)">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="64" cy="110" r="3" fill="#00ffff" filter="url(#glow3)">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" begin="0.75s" />
      </circle>
    </g>
    <g>
      <animateTransform attributeName="transform" type="rotate" from="120 64 64" to="480 64 64" dur="8s" repeatCount="indefinite" />
      <circle cx="64" cy="18" r="2" fill="#00aaff" filter="url(#glow3)">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="64" cy="110" r="2" fill="#00aaff" filter="url(#glow3)">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" begin="1s" />
      </circle>
    </g>
  </svg>
);

export default HackerAvatar;