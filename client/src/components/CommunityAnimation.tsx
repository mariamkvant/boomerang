import React from 'react';

interface CommunityAnimationProps {
  className?: string;
  height?: number;
}

export default function CommunityAnimation({ className = '', height = 320 }: CommunityAnimationProps) {
  return (
    <div className={className} style={{ position: 'relative', width: '100%', height, overflow: 'hidden', borderRadius: '16px' }}>
      <style>{`
        @keyframes bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes bobSlow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes walk { 0%{transform:translateX(-80px)} 100%{transform:translateX(calc(100vw + 80px))} }
        @keyframes slideIn { 0%{transform:translateX(40px);opacity:0} 100%{transform:translateX(0);opacity:1} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        @keyframes leafSway { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} }
        @keyframes fadeFloat { 0%,100%{transform:translateY(0);opacity:0.9} 50%{transform:translateY(-6px);opacity:1} }
        .anim-bob { animation: bob 3s ease-in-out infinite; }
        .anim-bob-slow { animation: bobSlow 4s ease-in-out infinite; }
        .anim-bob-delay { animation: bob 3s ease-in-out 1s infinite; }
        .anim-walk { animation: walk 8s linear infinite; }
        .anim-slide-in { animation: slideIn 0.8s ease-out 0.3s both; }
        .anim-pulse { animation: pulse 2.5s ease-in-out infinite; }
        .anim-leaf { animation: leafSway 2s ease-in-out infinite; transform-origin: bottom center; }
        .anim-float { animation: fadeFloat 3.5s ease-in-out infinite; }
      `}</style>

      {/* Background */}
      <svg width="100%" height={height} viewBox={`0 0 400 ${height}`} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        {/* Sky / wall background */}
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b2d8c4" />
            <stop offset="100%" stopColor="#d4ead9" />
          </linearGradient>
        </defs>
        <rect width="400" height={height} fill="url(#bgGrad)" />

        {/* Brick pattern — subtle */}
        {[0,1,2,3,4,5,6,7].map(row => (
          [0,1,2,3,4,5,6,7,8,9].map(col => (
            <rect
              key={`${row}-${col}`}
              x={col * 44 + (row % 2 === 0 ? 0 : 22)}
              y={row * 22 + Math.floor(height * 0.25)}
              width="40" height="18" rx="1"
              fill="none" stroke="#9dc9af" strokeWidth="0.5" opacity="0.4"
            />
          ))
        ))}

        {/* Ground */}
        <rect x="0" y={height - 40} width="400" height="40" fill="#8aba8a" opacity="0.5" rx="0" />
        <rect x="0" y={height - 40} width="400" height="4" fill="#6aa06a" opacity="0.4" />

        {/* ── Left window + person ── */}
        <g className="anim-bob" style={{ transformOrigin: '90px 120px' }}>
          {/* Window frame */}
          <rect x="30" y="40" width="80" height="90" rx="6" fill="white" opacity="0.85" />
          <rect x="36" y="46" width="68" height="55" rx="4" fill="#c8e8f0" opacity="0.7" />
          {/* Window cross */}
          <line x1="70" y1="46" x2="70" y2="101" stroke="white" strokeWidth="2" opacity="0.6" />
          <line x1="36" y1="73" x2="104" y2="73" stroke="white" strokeWidth="2" opacity="0.6" />
          {/* Window sill */}
          <rect x="28" y="128" width="84" height="8" rx="4" fill="#c8a882" />
          {/* Person — warm orange top */}
          <circle cx="70" cy="62" r="12" fill="#f4a261" /> {/* head */}
          <circle cx="66" cy="59" r="2" fill="#4a3728" /> {/* eye */}
          <circle cx="74" cy="59" r="2" fill="#4a3728" />
          <path d="M65 66 Q70 70 75 66" stroke="#4a3728" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <rect x="56" y="74" width="28" height="18" rx="6" fill="#e76f51" /> {/* body */}
          {/* Arm reaching out */}
          <path d="M84 80 Q100 75 110 78" stroke="#f4a261" strokeWidth="6" strokeLinecap="round" fill="none" />
          <circle cx="112" cy="78" r="5" fill="#f4a261" />
        </g>

        {/* ── Plant being passed (between windows) ── */}
        <g className="anim-float" style={{ transformOrigin: '155px 100px' }}>
          <rect x="140" y="100" width="30" height="20" rx="4" fill="#8b5e3c" />
          <circle cx="155" cy="90" r="14" fill="#4a9b6f" />
          <circle cx="145" cy="95" r="9" fill="#3d8b5e" />
          <circle cx="164" cy="93" r="9" fill="#56ab7a" />
          <path d="M155 104 Q150 95 145 88" stroke="#2d6a4f" strokeWidth="1.5" fill="none" opacity="0.6" />
        </g>

        {/* ── Right window + person ── */}
        <g className="anim-bob-delay" style={{ transformOrigin: '310px 120px' }}>
          {/* Window — arched */}
          <rect x="265" y="50" width="85" height="85" rx="8" fill="white" opacity="0.85" />
          <rect x="271" y="56" width="73" height="55" rx="4" fill="#c8e8f0" opacity="0.7" />
          <line x1="307" y1="56" x2="307" y2="111" stroke="white" strokeWidth="2" opacity="0.6" />
          <line x1="271" y1="83" x2="344" y2="83" stroke="white" strokeWidth="2" opacity="0.6" />
          <rect x="263" y="133" width="89" height="8" rx="4" fill="#c8a882" />
          {/* Person 2 — yellow top */}
          <circle cx="307" cy="68" r="11" fill="#e9c46a" />
          <ellipse cx="303" cy="65" rx="2" ry="2.5" fill="#4a3728" />
          <ellipse cx="311" cy="65" rx="2" ry="2.5" fill="#4a3728" />
          <path d="M303 73 Q307 77 311 73" stroke="#4a3728" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <rect x="295" y="79" width="24" height="16" rx="5" fill="#264653" />
          {/* Arm reaching to receive plant */}
          <path d="M295 84 Q278 80 268 82" stroke="#e9c46a" strokeWidth="6" strokeLinecap="round" fill="none" />
          <circle cx="266" cy="82" r="4.5" fill="#e9c46a" />
          {/* Plant on sill */}
          <g className="anim-leaf">
            <rect x="335" y="126" width="14" height="12" rx="3" fill="#8b5e3c" />
            <circle cx="342" cy="118" r="8" fill="#4a9b6f" />
            <circle cx="337" cy="122" r="5" fill="#3d8b5e" />
          </g>
        </g>

        {/* ── Floating service card ── */}
        <g className="anim-slide-in anim-pulse" style={{ transformOrigin: '230px 55px' }}>
          <rect x="155" y="20" width="150" height="65" rx="12" fill="white" opacity="0.95"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.12))' }} />
          {/* Avatar */}
          <circle cx="178" cy="40" r="12" fill="#e0e0e0" />
          <circle cx="178" cy="37" r="5" fill="#f4a261" />
          <ellipse cx="178" cy="46" rx="7" ry="5" fill="#f4a261" />
          {/* Text lines */}
          <rect x="197" y="30" width="65" height="7" rx="3.5" fill="#e0e0e0" />
          <rect x="197" y="42" width="45" height="5" rx="2.5" fill="#e0e0e0" />
          {/* Category badge */}
          <rect x="295" y="28" width="0" height="0" />
          <rect x="262" y="27" width="36" height="16" rx="8" fill="#edf7f1" />
          <rect x="266" y="32" width="28" height="6" rx="3" fill="#4a9b6f" opacity="0.6" />
          {/* Price chip */}
          <rect x="197" y="52" width="35" height="14" rx="7" fill="#edf7f1" />
          <rect x="202" y="56" width="25" height="6" rx="3" fill="#4a9b6f" opacity="0.5" />
          {/* Button */}
          <rect x="240" y="50" width="55" height="20" rx="10" fill="#1a4731" />
          <rect x="248" y="57" width="39" height="6" rx="3" fill="white" opacity="0.8" />
        </g>
      </svg>

      {/* Dog walker — CSS animated across the bottom */}
      <div className="anim-walk" style={{ position: 'absolute', bottom: '8px', left: 0, display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
        <svg width="100" height="60" viewBox="0 0 100 60" fill="none">
          {/* Person body */}
          <circle cx="30" cy="12" r="10" fill="#f4a261" />
          <circle cx="27" cy="9" r="2" fill="#4a3728" />
          <circle cx="33" cy="9" r="2" fill="#4a3728" />
          <rect x="22" y="22" width="16" height="18" rx="5" fill="#e76f51" />
          {/* Legs walking */}
          <line x1="26" y1="40" x2="20" y2="56" stroke="#f4a261" strokeWidth="5" strokeLinecap="round" />
          <line x1="34" y1="40" x2="40" y2="56" stroke="#f4a261" strokeWidth="5" strokeLinecap="round" />
          {/* Arm + leash */}
          <path d="M38 28 Q55 20 68 30" stroke="#f4a261" strokeWidth="3" strokeLinecap="round" fill="none" strokeDasharray="3 2" />
          {/* Dog */}
          <ellipse cx="72" cy="44" rx="14" ry="9" fill="#c8763a" />
          <circle cx="83" cy="38" r="8" fill="#c8763a" />
          <circle cx="86" cy="36" r="2" fill="#4a3728" />
          {/* Dog ears */}
          <ellipse cx="79" cy="33" rx="4" ry="6" fill="#b06528" transform="rotate(-20 79 33)" />
          <ellipse cx="89" cy="33" rx="3" ry="5" fill="#b06528" transform="rotate(15 89 33)" />
          {/* Dog legs */}
          <line x1="62" y1="52" x2="58" y2="60" stroke="#c8763a" strokeWidth="4" strokeLinecap="round" />
          <line x1="70" y1="52" x2="68" y2="60" stroke="#c8763a" strokeWidth="4" strokeLinecap="round" />
          <line x1="78" y1="52" x2="76" y2="60" stroke="#c8763a" strokeWidth="4" strokeLinecap="round" />
          <line x1="85" y1="52" x2="88" y2="60" stroke="#c8763a" strokeWidth="4" strokeLinecap="round" />
          {/* Tail */}
          <path d="M58 42 Q50 30 54 25" stroke="#c8763a" strokeWidth="4" strokeLinecap="round" fill="none" />
          {/* Tree */}
          <circle cx="10" cy="25" r="14" fill="#4a9b6f" opacity="0.8" />
          <rect x="7" y="37" width="6" height="16" rx="3" fill="#2d6a4f" opacity="0.7" />
        </svg>
      </div>
    </div>
  );
}
