// Hacker-vibes avatar for the "Created by Kiki" credit.
export const HackerAvatar = ({ size = 48, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    className={className}
    aria-hidden="true"
    style={{ filter: "drop-shadow(0 0 6px rgba(0,255,255,0.6))" }}
  >
    <defs>
      <linearGradient id="hood" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1a1a2e" />
        <stop offset="100%" stopColor="#0a0a14" />
      </linearGradient>
      <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#00ffff" />
        <stop offset="100%" stopColor="#0066ff" />
      </radialGradient>
    </defs>
    {/* Hood */}
    <path d="M12 58 Q12 18 32 10 Q52 18 52 58 Z" fill="url(#hood)" stroke="#00ffff" strokeWidth="1.2" opacity="0.95" />
    {/* Face shadow */}
    <ellipse cx="32" cy="34" rx="13" ry="15" fill="#050508" opacity="0.85" />
    {/* Glowing eyes */}
    <ellipse cx="25" cy="32" rx="3.5" ry="2" fill="url(#eyeGlow)">
      <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
    </ellipse>
    <ellipse cx="39" cy="32" rx="3.5" ry="2" fill="url(#eyeGlow)">
      <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" begin="0.3s" />
    </ellipse>
    {/* Matrix code rain lines */}
    <text x="18" y="46" fontFamily="monospace" fontSize="5" fill="#00ff88" opacity="0.7">
      <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1.8s" repeatCount="indefinite" />
      01
    </text>
    <text x="30" y="50" fontFamily="monospace" fontSize="5" fill="#00ff88" opacity="0.5">
      <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2.2s" repeatCount="indefinite" />
      10
    </text>
    <text x="42" y="46" fontFamily="monospace" fontSize="5" fill="#00ff88" opacity="0.6">
      <animate attributeName="opacity" values="0.4;1;0.4" dur="1.6s" repeatCount="indefinite" />
      11
    </text>
    {/* Hood rim glow */}
    <path d="M12 58 Q32 52 52 58" fill="none" stroke="#00ffff" strokeWidth="0.8" opacity="0.5">
      <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.5s" repeatCount="indefinite" />
    </path>
  </svg>
);

export default HackerAvatar;