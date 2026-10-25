import React from 'react';

/**
 * CommunityIllustration
 * Static flat SVG illustration mimicking the NEAR/Boomerang design mockup:
 * - Sage green brick wall background
 * - Two apartment windows with neighbours
 * - Woman with plant sitting in window
 * - Dog walker at bottom
 * - Floating service request card
 */

interface Props {
  className?: string;
  style?: React.CSSProperties;
}

export default function CommunityIllustration({ className = '', style }: Props) {
  return (
    <svg
      viewBox="0 0 480 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label="Community neighbours illustration"
    >
      {/* ── BACKGROUND: sage green wall ── */}
      <rect width="480" height="320" fill="#a8d5b5" />

      {/* Brick pattern */}
      {[0,1,2,3,4,5,6,7,8,9,10,11,12].map(row =>
        [0,1,2,3,4,5,6,7,8,9,10,11].map(col => (
          <rect
            key={`b${row}-${col}`}
            x={col * 42 + (row % 2 === 0 ? 0 : 21) - 5}
            y={row * 24}
            width="38" height="20" rx="1"
            fill="none"
            stroke="#8ec4a0"
            strokeWidth="0.8"
            opacity="0.5"
          />
        ))
      )}

      {/* ── GROUND ── */}
      <ellipse cx="240" cy="305" rx="240" ry="18" fill="#7ab87a" opacity="0.4" />
      <rect x="0" y="294" width="480" height="26" fill="#85bb85" opacity="0.35" />

      {/* ── LEFT WINDOW ── person in yellow jacket + plant ── */}
      {/* Window frame */}
      <rect x="28" y="30" width="100" height="120" rx="8" fill="white" opacity="0.9" />
      <rect x="35" y="37" width="86" height="78" rx="5" fill="#c5e8f5" opacity="0.85" />
      {/* Window dividers */}
      <line x1="78" y1="37" x2="78" y2="115" stroke="white" strokeWidth="3" opacity="0.7" />
      <line x1="35" y1="76" x2="121" y2="76" stroke="white" strokeWidth="3" opacity="0.7" />
      {/* Window sill */}
      <rect x="24" y="148" width="108" height="9" rx="4" fill="#d4a76a" />
      {/* Person — dark skin, yellow jacket */}
      {/* Head */}
      <circle cx="78" cy="55" r="14" fill="#8B5E3C" />
      {/* Hair */}
      <path d="M64 50 Q65 38 78 37 Q91 38 92 50 Q85 44 78 44 Q71 44 64 50Z" fill="#1a0f00" />
      {/* Eyes */}
      <circle cx="73" cy="54" r="2.5" fill="#1a0f00" />
      <circle cx="83" cy="54" r="2.5" fill="#1a0f00" />
      {/* Smile */}
      <path d="M72 61 Q78 66 84 61" stroke="#5a3020" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Yellow jacket body */}
      <path d="M60 115 Q58 95 63 80 L93 80 Q98 95 96 115Z" fill="#e9c46a" />
      {/* Neck */}
      <rect x="73" y="68" width="10" height="12" rx="3" fill="#8B5E3C" />
      {/* Arm reaching out (right side) */}
      <path d="M93 90 Q112 82 128 86 Q136 88 140 92" stroke="#8B5E3C" strokeWidth="8" strokeLinecap="round" fill="none" />
      <circle cx="142" cy="93" r="6" fill="#8B5E3C" />

      {/* Plant in pot — left window sill */}
      <rect x="32" y="140" width="18" height="14" rx="3" fill="#c8763a" />
      <circle cx="41" cy="132" r="9" fill="#4a9b6f" />
      <circle cx="35" cy="136" r="6" fill="#3d8b5e" />
      <circle cx="47" cy="135" r="6" fill="#56ab7a" />
      <line x1="41" y1="140" x2="41" y2="134" stroke="#2d6a4f" strokeWidth="1.5" />

      {/* ── CENTRE: woman in floral dress sitting in lower window ── */}
      {/* Window frame */}
      <rect x="158" y="120" width="90" height="100" rx="8" fill="white" opacity="0.9" />
      <rect x="164" y="126" width="78" height="68" rx="5" fill="#c5e8f5" opacity="0.85" />
      <line x1="203" y1="126" x2="203" y2="194" stroke="white" strokeWidth="2.5" opacity="0.7" />
      <line x1="164" y1="160" x2="242" y2="160" stroke="white" strokeWidth="2.5" opacity="0.7" />
      <rect x="154" y="218" width="98" height="8" rx="4" fill="#d4a76a" />
      {/* Person — lighter skin, floral print dress, dark hair in bun */}
      <circle cx="203" cy="142" r="12" fill="#f4c5a0" />
      {/* Hair bun */}
      <path d="M191 137 Q192 126 203 125 Q214 126 215 137 Q208 131 203 131 Q198 131 191 137Z" fill="#1a0f00" />
      <circle cx="203" cy="123" r="5" fill="#1a0f00" />
      {/* Eyes */}
      <circle cx="199" cy="141" r="2" fill="#2a1a10" />
      <circle cx="207" cy="141" r="2" fill="#2a1a10" />
      {/* Dress — floral white with dots */}
      <path d="M190 194 Q188 175 192 154 L214 154 Q218 175 216 194Z" fill="#f8f0e3" />
      {/* Floral dots on dress */}
      <circle cx="197" cy="164" r="2.5" fill="#e9c46a" />
      <circle cx="207" cy="170" r="2" fill="#e76f51" />
      <circle cx="202" cy="180" r="2.5" fill="#4a9b6f" />
      <circle cx="210" cy="162" r="2" fill="#e9c46a" />
      <circle cx="194" cy="175" r="2" fill="#e76f51" />
      {/* Neck */}
      <rect x="198" y="153" width="10" height="10" rx="3" fill="#f4c5a0" />
      {/* Arm pointing up-left */}
      <path d="M192 165 Q178 155 162 148 Q155 144 148 142" stroke="#f4c5a0" strokeWidth="7" strokeLinecap="round" fill="none" />
      <circle cx="145" cy="141" r="5.5" fill="#f4c5a0" />
      {/* Plants on windowsill */}
      <rect x="160" y="212" width="12" height="10" rx="2" fill="#8b5e3c" />
      <circle cx="166" cy="205" r="7" fill="#56ab7a" />
      <circle cx="161" cy="208" r="5" fill="#4a9b6f" />

      {/* ── RIGHT WINDOW: older person with white hair, dark top + plant ── */}
      <rect x="340" y="50" width="110" height="120" rx="10" fill="white" opacity="0.9" />
      <rect x="347" y="57" width="96" height="80" rx="6" fill="#c5e8f5" opacity="0.85" />
      <line x1="395" y1="57" x2="395" y2="137" stroke="white" strokeWidth="3" opacity="0.7" />
      <line x1="347" y1="97" x2="443" y2="97" stroke="white" strokeWidth="3" opacity="0.7" />
      <rect x="336" y="168" width="118" height="9" rx="4" fill="#d4a76a" />
      {/* Arched top detail */}
      <path d="M347 57 Q395 45 443 57" fill="#c5e8f5" opacity="0.3" />
      {/* Person — older, white/grey hair, dark top, medium skin */}
      <circle cx="395" cy="76" r="13" fill="#c49a6c" />
      {/* White/grey hair */}
      <path d="M382 70 Q383 59 395 58 Q407 59 408 70 Q401 65 395 65 Q389 65 382 70Z" fill="#d0d0d0" />
      <circle cx="395" cy="56" r="4" fill="#d0d0d0" />
      {/* Eyes */}
      <circle cx="390" cy="75" r="2.5" fill="#2a1a10" />
      <circle cx="400" cy="75" r="2.5" fill="#2a1a10" />
      {/* Glasses */}
      <rect x="385" y="71" width="11" height="8" rx="3" fill="none" stroke="#8a6030" strokeWidth="1.5" />
      <rect x="398" y="71" width="11" height="8" rx="3" fill="none" stroke="#8a6030" strokeWidth="1.5" />
      <line x1="396" y1="75" x2="398" y2="75" stroke="#8a6030" strokeWidth="1.5" />
      {/* Dark top */}
      <path d="M378 137 Q376 118 380 90 L410 90 Q414 118 412 137Z" fill="#264653" />
      {/* Neck */}
      <rect x="390" y="88" width="10" height="10" rx="3" fill="#c49a6c" />
      {/* Arms — one holding plant branch out the window */}
      <path d="M378 100 Q360 92 344 88 Q336 86 330 84" stroke="#c49a6c" strokeWidth="7" strokeLinecap="round" fill="none" />
      <circle cx="327" cy="83" r="5.5" fill="#c49a6c" />
      {/* Plant/branch being held */}
      <circle cx="316" cy="78" r="10" fill="#4a9b6f" />
      <circle cx="308" cy="82" r="7" fill="#3d8b5e" />
      <circle cx="322" cy="85" r="7" fill="#56ab7a" />
      <circle cx="312" cy="72" r="6" fill="#4a9b6f" />
      {/* Plant on right sill */}
      <rect x="430" y="161" width="16" height="12" rx="3" fill="#c8763a" />
      <circle cx="438" cy="153" r="10" fill="#4a9b6f" />
      <circle cx="431" cy="157" r="7" fill="#3d8b5e" />
      <circle cx="445" cy="156" r="7" fill="#56ab7a" />

      {/* ── FLOATING SERVICE REQUEST CARD ── */}
      {/* Card shadow */}
      <rect x="244" y="32" width="148" height="74" rx="14" fill="#000" opacity="0.08" transform="translate(3,4)" />
      {/* Card */}
      <rect x="244" y="28" width="148" height="74" rx="14" fill="white" />
      {/* Top row: avatar + name + category */}
      <circle cx="263" cy="50" r="12" fill="#e8e0d8" />
      {/* Avatar face */}
      <circle cx="263" cy="47" r="5" fill="#f4c5a0" />
      <ellipse cx="263" cy="56" rx="7" ry="5" fill="#f4c5a0" />
      {/* Name */}
      <text x="280" y="46" fontFamily="system-ui, sans-serif" fontSize="10" fontWeight="700" fill="#1a2e1a">Tata</text>
      {/* Category badge */}
      <rect x="334" y="36" width="50" height="16" rx="8" fill="#edf7f1" />
      <text x="337" y="48" fontFamily="system-ui, sans-serif" fontSize="8" fontWeight="600" fill="#2d6a4f">Pet care</text>
      {/* Description */}
      <text x="280" y="59" fontFamily="system-ui, sans-serif" fontSize="8" fill="#666">Need a sitter for this</text>
      <text x="280" y="69" fontFamily="system-ui, sans-serif" fontSize="8" fill="#666">weekend!</text>
      {/* Price chip */}
      <rect x="249" y="72" width="36" height="16" rx="8" fill="#f0f0f0" />
      <text x="257" y="84" fontFamily="system-ui, sans-serif" fontSize="8" fontWeight="600" fill="#444">10 Gel</text>
      {/* Offer Help button */}
      <rect x="292" y="72" width="92" height="22" rx="11" fill="#1a4731" />
      <text x="338" y="87" fontFamily="system-ui, sans-serif" fontSize="9" fontWeight="700" fill="white" textAnchor="middle">Offer Help</text>

      {/* ── TREE (bottom centre-left) ── */}
      <circle cx="310" cy="270" r="30" fill="#5aaa6a" />
      <circle cx="295" cy="280" r="20" fill="#4a9b6f" />
      <circle cx="326" cy="278" r="22" fill="#56ab7a" />
      <rect x="306" y="290" width="8" height="22" rx="4" fill="#4a7a3a" />

      {/* ── DOG WALKER ── woman in orange jacket, dachshund ── */}
      {/* Person */}
      <circle cx="186" cy="253" r="14" fill="#f4c5a0" />
      {/* Dark hair */}
      <path d="M172 247 Q173 235 186 234 Q199 235 200 247 Q193 241 186 241 Q179 241 172 247Z" fill="#1a0f00" />
      {/* Orange jacket */}
      <path d="M170 295 Q168 273 172 260 L200 260 Q204 273 202 295Z" fill="#e76f51" />
      {/* Green pants */}
      <rect x="173" y="292" width="8" height="18" rx="4" fill="#3d6b3d" />
      <rect x="186" y="292" width="8" height="18" rx="4" fill="#3d6b3d" />
      {/* Neck */}
      <rect x="181" y="266" width="10" height="10" rx="3" fill="#f4c5a0" />
      {/* Arm holding leash */}
      <path d="M200 270 Q220 262 238 265" stroke="#f4c5a0" strokeWidth="6" strokeLinecap="round" fill="none" />
      {/* Leash — dashed line to dog */}
      <path d="M238 267 Q252 260 264 268" stroke="#4a4a4a" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" fill="none" />

      {/* Dachshund */}
      {/* Body */}
      <ellipse cx="282" cy="285" rx="22" ry="11" fill="#c8763a" />
      {/* Head */}
      <circle cx="300" cy="276" r="12" fill="#c8763a" />
      {/* Snout */}
      <ellipse cx="309" cy="279" rx="7" ry="5" fill="#b06528" />
      {/* Nose */}
      <circle cx="313" cy="278" r="2.5" fill="#2a1a00" />
      {/* Eye */}
      <circle cx="303" cy="273" r="2.5" fill="#2a1a00" />
      {/* Ear */}
      <ellipse cx="293" cy="270" rx="6" ry="9" fill="#b06528" transform="rotate(-15 293 270)" />
      {/* Legs */}
      <rect x="264" y="293" width="6" height="14" rx="3" fill="#b06528" />
      <rect x="274" y="294" width="6" height="13" rx="3" fill="#b06528" />
      <rect x="288" y="294" width="6" height="13" rx="3" fill="#b06528" />
      <rect x="298" y="293" width="6" height="14" rx="3" fill="#b06528" />
      {/* Tail */}
      <path d="M260 281 Q248 265 252 258" stroke="#c8763a" strokeWidth="5" strokeLinecap="round" fill="none" />

      {/* ── SMALL DECORATIVE PLANTS ── */}
      {/* Bottom left corner plant */}
      <rect x="8" y="286" width="14" height="22" rx="4" fill="#a0622a" />
      <circle cx="15" cy="278" r="12" fill="#4a9b6f" />
      <circle cx="9" cy="283" r="8" fill="#3d8b5e" />
      <circle cx="22" cy="282" r="8" fill="#56ab7a" />

      {/* Bottom right corner */}
      <rect x="456" y="289" width="12" height="18" rx="4" fill="#a0622a" />
      <circle cx="462" cy="281" r="10" fill="#4a9b6f" />
      <circle cx="457" cy="285" r="7" fill="#3d8b5e" />
      <circle cx="467" cy="284" r="7" fill="#56ab7a" />
    </svg>
  );
}
