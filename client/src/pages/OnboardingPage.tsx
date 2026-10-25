import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import CommunityIllustration from '../components/CommunityIllustration';

const SKILL_OPTIONS = [
  {
    label: 'Pet Walking/Sitting',
    bg: '#d4edda',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#d4edda" rx="12"/>
        {/* Person */}
        <circle cx="38" cy="22" r="10" fill="#f4a261"/>
        <path d="M28 22 Q28 13 38 12 Q48 13 48 22 Q44 17 38 17 Q32 17 28 22Z" fill="#1a0f00"/>
        <rect x="30" y="32" width="16" height="18" rx="5" fill="#e76f51"/>
        <line x1="32" y1="50" x2="28" y2="64" stroke="#f4a261" strokeWidth="4" strokeLinecap="round"/>
        <line x1="44" y1="50" x2="48" y2="64" stroke="#f4a261" strokeWidth="4" strokeLinecap="round"/>
        {/* Leash */}
        <path d="M46 40 Q62 32 74 38" stroke="#4a4a4a" strokeWidth="1.5" strokeDasharray="3 2" strokeLinecap="round" fill="none"/>
        {/* Dog */}
        <ellipse cx="82" cy="54" rx="16" ry="9" fill="#c8763a"/>
        <circle cx="94" cy="46" r="10" fill="#c8763a"/>
        <ellipse cx="100" cy="49" rx="6" ry="4" fill="#b06528"/>
        <circle cx="103" cy="48" r="2" fill="#1a0f00"/>
        <ellipse cx="88" cy="41" rx="4" ry="7" fill="#b06528" transform="rotate(-15 88 41)"/>
        <line x1="70" y1="61" x2="66" y2="70" stroke="#b06528" strokeWidth="3" strokeLinecap="round"/>
        <line x1="78" y1="62" x2="76" y2="70" stroke="#b06528" strokeWidth="3" strokeLinecap="round"/>
        <line x1="86" y1="62" x2="84" y2="70" stroke="#b06528" strokeWidth="3" strokeLinecap="round"/>
        <line x1="94" y1="61" x2="96" y2="70" stroke="#b06528" strokeWidth="3" strokeLinecap="round"/>
        {/* Tree */}
        <circle cx="16" cy="50" r="12" fill="#4a9b6f" opacity="0.8"/>
        <rect x="13" y="58" width="5" height="14" rx="2" fill="#2d6a4f" opacity="0.7"/>
      </svg>
    ),
  },
  {
    label: 'Babysitting',
    bg: '#fde8d8',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#fde8d8" rx="12"/>
        {/* Adult */}
        <circle cx="45" cy="22" r="11" fill="#f4c5a0"/>
        <path d="M34 22 Q35 11 45 10 Q55 11 56 22 Q51 16 45 16 Q39 16 34 22Z" fill="#1a0f00"/>
        <rect x="35" y="33" width="20" height="20" rx="6" fill="#e9c46a"/>
        <rect x="40" y="52" width="6" height="16" rx="3" fill="#f4c5a0"/>
        <rect x="50" y="52" width="6" height="16" rx="3" fill="#f4c5a0"/>
        {/* Arm holding child */}
        <path d="M55 40 Q70 34 80 38" stroke="#f4c5a0" strokeWidth="7" strokeLinecap="round" fill="none"/>
        {/* Child */}
        <circle cx="84" cy="32" r="10" fill="#f4a261"/>
        <path d="M74 30 Q76 22 84 21 Q92 22 94 30 Q89 26 84 26 Q79 26 74 30Z" fill="#c8763a"/>
        <circle cx="80" cy="30" r="2" fill="#1a0f00"/>
        <circle cx="88" cy="30" r="2" fill="#1a0f00"/>
        <path d="M80 36 Q84 39 88 36" stroke="#1a0f00" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        <rect x="76" y="42" width="16" height="14" rx="5" fill="#a8d5b5"/>
        {/* Blocks toy */}
        <rect x="58" y="60" width="14" height="14" rx="3" fill="#4a9b6f"/>
        <rect x="64" y="58" width="12" height="12" rx="3" fill="#56ab7a"/>
        <rect x="76" y="62" width="12" height="12" rx="3" fill="#e9c46a"/>
      </svg>
    ),
  },
  {
    label: 'Home Repair',
    bg: '#e8f4fd',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#e8f4fd" rx="12"/>
        {/* House outline */}
        <path d="M20 72 L20 40 L60 18 L100 40 L100 72Z" fill="#fff" stroke="#4a9b6f" strokeWidth="2"/>
        <path d="M14 44 L60 14 L106 44" stroke="#4a9b6f" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        {/* Door */}
        <rect x="46" y="52" width="28" height="20" rx="3" fill="#c8a882"/>
        <circle cx="71" cy="63" r="2" fill="#8b6030"/>
        {/* Window */}
        <rect x="24" y="48" width="16" height="14" rx="2" fill="#c5e8f5"/>
        <line x1="32" y1="48" x2="32" y2="62" stroke="white" strokeWidth="1.5"/>
        <line x1="24" y1="55" x2="40" y2="55" stroke="white" strokeWidth="1.5"/>
        {/* Person with tool */}
        <circle cx="96" cy="36" r="8" fill="#8B5E3C"/>
        <rect x="90" y="44" width="12" height="14" rx="4" fill="#264653"/>
        {/* Wrench */}
        <path d="M100 50 L108 42" stroke="#c8a882" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="109" cy="41" r="4" fill="none" stroke="#c8a882" strokeWidth="2.5"/>
      </svg>
    ),
  },
  {
    label: 'Gardening',
    bg: '#e8f5e9',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#e8f5e9" rx="12"/>
        {/* Ground */}
        <rect x="0" y="60" width="120" height="20" fill="#8aba8a" opacity="0.4" rx="0"/>
        {/* Plants */}
        <circle cx="35" cy="42" r="16" fill="#4a9b6f"/>
        <circle cx="25" cy="50" r="11" fill="#3d8b5e"/>
        <circle cx="46" cy="48" r="12" fill="#56ab7a"/>
        <rect x="32" y="56" width="6" height="14" rx="3" fill="#2d6a4f"/>
        <circle cx="75" cy="38" r="12" fill="#56ab7a"/>
        <circle cx="68" cy="46" r="8" fill="#4a9b6f"/>
        <rect x="72" y="50" width="5" height="12" rx="2" fill="#2d6a4f"/>
        <circle cx="95" cy="48" r="10" fill="#4a9b6f"/>
        <rect x="92" y="56" width="5" height="10" rx="2" fill="#2d6a4f"/>
        {/* Person gardening */}
        <circle cx="95" cy="26" r="9" fill="#f4c5a0"/>
        <path d="M88 25 Q88 17 95 16 Q102 17 102 25 Q99 20 95 20 Q91 20 88 25Z" fill="#4a3728"/>
        <rect x="88" y="35" width="14" height="14" rx="4" fill="#a8d5b5"/>
        {/* Trowel */}
        <path d="M88 42 L78 54" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <ellipse cx="76" cy="56" rx="5" ry="3" fill="#c8763a" transform="rotate(-35 76 56)"/>
      </svg>
    ),
  },
  {
    label: 'Cooking',
    bg: '#fff8e1',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#fff8e1" rx="12"/>
        {/* Pot */}
        <ellipse cx="60" cy="52" rx="28" ry="8" fill="#d4a017"/>
        <rect x="32" y="38" width="56" height="18" rx="4" fill="#e9c46a"/>
        <rect x="30" y="36" width="6" height="6" rx="3" fill="#8b6030"/>
        <rect x="84" y="36" width="6" height="6" rx="3" fill="#8b6030"/>
        {/* Steam */}
        <path d="M48 34 Q44 26 48 20" stroke="#ccc" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M60 32 Q56 22 60 16" stroke="#ccc" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M72 34 Q68 26 72 20" stroke="#ccc" strokeWidth="2" strokeLinecap="round" fill="none"/>
        {/* Person */}
        <circle cx="97" cy="22" r="10" fill="#f4a261"/>
        <path d="M87 22 Q87 12 97 11 Q107 12 107 22 Q103 16 97 16 Q91 16 87 22Z" fill="#1a0f00"/>
        <rect x="89" y="32" width="16" height="16" rx="5" fill="#e76f51"/>
        {/* Chef hat */}
        <rect x="89" y="12" width="16" height="8" rx="4" fill="white"/>
        <rect x="93" y="8" width="8" height="8" rx="4" fill="white"/>
        {/* Ladle */}
        <path d="M89 40 L76 50" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="74" cy="52" r="4" fill="#d4a017" stroke="#c8a882" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    label: 'Tutoring',
    bg: '#ede7f6',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#ede7f6" rx="12"/>
        {/* Whiteboard */}
        <rect x="16" y="14" width="68" height="44" rx="6" fill="white" stroke="#b39ddb" strokeWidth="2"/>
        <line x1="24" y1="28" x2="76" y2="28" stroke="#b39ddb" strokeWidth="1.5"/>
        <line x1="24" y1="36" x2="60" y2="36" stroke="#b39ddb" strokeWidth="1.5"/>
        <line x1="24" y1="44" x2="68" y2="44" stroke="#b39ddb" strokeWidth="1.5"/>
        <text x="22" y="27" fontFamily="monospace" fontSize="9" fill="#7e57c2">2+2=4</text>
        <rect x="30" y="56" width="44" height="4" rx="2" fill="#b39ddb" opacity="0.5"/>
        {/* Teacher */}
        <circle cx="100" cy="28" r="10" fill="#f4c5a0"/>
        <path d="M90 28 Q90 18 100 17 Q110 18 110 28 Q106 22 100 22 Q94 22 90 28Z" fill="#1a0f00"/>
        <rect x="92" y="38" width="16" height="16" rx="5" fill="#7e57c2"/>
        {/* Pointer */}
        <line x1="92" y1="42" x2="78" y2="34" stroke="#c8a882" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Tech Help',
    bg: '#e3f2fd',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#e3f2fd" rx="12"/>
        {/* Laptop */}
        <rect x="22" y="30" width="64" height="38" rx="4" fill="#546e7a"/>
        <rect x="26" y="34" width="56" height="28" rx="2" fill="#c5e8f5"/>
        <rect x="14" y="68" width="80" height="5" rx="2" fill="#546e7a"/>
        {/* Screen glow lines */}
        <line x1="30" y1="42" x2="70" y2="42" stroke="#4a9b6f" strokeWidth="1.5" opacity="0.7"/>
        <line x1="30" y1="48" x2="58" y2="48" stroke="#4a9b6f" strokeWidth="1.5" opacity="0.7"/>
        <line x1="30" y1="54" x2="64" y2="54" stroke="#4a9b6f" strokeWidth="1.5" opacity="0.7"/>
        {/* Person */}
        <circle cx="97" cy="22" r="10" fill="#8B5E3C"/>
        <path d="M87 22 Q87 12 97 11 Q107 12 107 22 Q103 16 97 16 Q91 16 87 22Z" fill="#1a0f00"/>
        <rect x="89" y="32" width="16" height="14" rx="5" fill="#1565c0"/>
        {/* Pointing arm */}
        <path d="M89 38 L78 50" stroke="#8B5E3C" strokeWidth="6" strokeLinecap="round" fill="none"/>
        <circle cx="76" cy="52" r="4" fill="#8B5E3C"/>
      </svg>
    ),
  },
  {
    label: 'Transportation',
    bg: '#fce4ec',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#fce4ec" rx="12"/>
        {/* Road */}
        <rect x="0" y="58" width="120" height="14" fill="#546e7a" opacity="0.3"/>
        <line x1="10" y1="65" x2="30" y2="65" stroke="white" strokeWidth="2" strokeDasharray="8 4"/>
        <line x1="50" y1="65" x2="70" y2="65" stroke="white" strokeWidth="2" strokeDasharray="8 4"/>
        <line x1="90" y1="65" x2="110" y2="65" stroke="white" strokeWidth="2" strokeDasharray="8 4"/>
        {/* Car body */}
        <rect x="18" y="38" width="84" height="24" rx="6" fill="#e91e63"/>
        <path d="M32 38 Q38 24 52 22 L72 22 Q86 24 90 38Z" fill="#e91e63"/>
        {/* Windows */}
        <rect x="38" y="26" width="18" height="14" rx="3" fill="#c5e8f5"/>
        <rect x="60" y="26" width="18" height="14" rx="3" fill="#c5e8f5"/>
        {/* Wheels */}
        <circle cx="40" cy="62" r="10" fill="#263238"/>
        <circle cx="40" cy="62" r="5" fill="#546e7a"/>
        <circle cx="82" cy="62" r="10" fill="#263238"/>
        <circle cx="82" cy="62" r="5" fill="#546e7a"/>
        {/* Headlights */}
        <rect x="98" y="44" width="6" height="8" rx="2" fill="#fff9c4"/>
        {/* Passenger silhouette */}
        <circle cx="52" cy="30" r="5" fill="#f4c5a0"/>
        <circle cx="69" cy="30" r="5" fill="#8B5E3C"/>
      </svg>
    ),
  },
  {
    label: 'Cleaning',
    bg: '#e0f7fa',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#e0f7fa" rx="12"/>
        {/* Person */}
        <circle cx="52" cy="22" r="11" fill="#f4c5a0"/>
        <path d="M41 22 Q42 11 52 10 Q62 11 63 22 Q58 16 52 16 Q46 16 41 22Z" fill="#1a0f00"/>
        <rect x="42" y="33" width="20" height="20" rx="6" fill="#00acc1"/>
        {/* Mop */}
        <line x1="60" y1="40" x2="88" y2="68" stroke="#c8a882" strokeWidth="3" strokeLinecap="round"/>
        <rect x="80" y="64" width="22" height="8" rx="4" fill="#b0bec5" transform="rotate(-35 80 64)"/>
        {/* Bubbles */}
        <circle cx="78" cy="30" r="5" fill="none" stroke="#00acc1" strokeWidth="1.5"/>
        <circle cx="90" cy="22" r="4" fill="none" stroke="#00acc1" strokeWidth="1.5"/>
        <circle cx="100" cy="32" r="3" fill="none" stroke="#00acc1" strokeWidth="1.5"/>
        <circle cx="72" cy="20" r="3" fill="none" stroke="#00acc1" strokeWidth="1.5"/>
        {/* Legs */}
        <line x1="47" y1="53" x2="42" y2="68" stroke="#f4c5a0" strokeWidth="5" strokeLinecap="round"/>
        <line x1="57" y1="53" x2="62" y2="68" stroke="#f4c5a0" strokeWidth="5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Music',
    bg: '#fce4ec',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#fce4ec" rx="12"/>
        {/* Guitar */}
        <ellipse cx="55" cy="56" rx="16" ry="18" fill="#c8763a"/>
        <ellipse cx="55" cy="56" rx="8" ry="9" fill="#b06528"/>
        <rect x="52" y="22" width="6" height="36" rx="3" fill="#8b5e3c"/>
        <rect x="46" y="20" width="18" height="8" rx="3" fill="#8b5e3c"/>
        {/* Strings */}
        <line x1="51" y1="28" x2="51" y2="58" stroke="#d4a017" strokeWidth="0.8"/>
        <line x1="55" y1="28" x2="55" y2="58" stroke="#d4a017" strokeWidth="0.8"/>
        <line x1="59" y1="28" x2="59" y2="58" stroke="#d4a017" strokeWidth="0.8"/>
        {/* Music notes */}
        <text x="75" y="32" fontSize="16" fill="#e91e63">♪</text>
        <text x="88" y="22" fontSize="12" fill="#e91e63">♫</text>
        <text x="78" y="48" fontSize="10" fill="#e91e63">♩</text>
        {/* Person playing */}
        <circle cx="90" cy="48" r="9" fill="#f4a261"/>
        <path d="M81 48 Q82 39 90 38 Q98 39 99 48 Q95 43 90 43 Q85 43 81 48Z" fill="#1a0f00"/>
        <rect x="83" y="57" width="14" height="14" rx="4" fill="#e76f51"/>
      </svg>
    ),
  },
  {
    label: 'Languages',
    bg: '#f3e5f5',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#f3e5f5" rx="12"/>
        {/* Speech bubbles */}
        <rect x="10" y="12" width="46" height="28" rx="10" fill="#7e57c2"/>
        <path d="M20 40 L14 50 L30 40Z" fill="#7e57c2"/>
        <text x="18" y="26" fontFamily="serif" fontSize="11" fontWeight="bold" fill="white">Bonjour</text>
        <text x="16" y="36" fontFamily="serif" fontSize="8" fill="#d1c4e9">Hello • Salam</text>
        <rect x="64" y="30" width="46" height="28" rx="10" fill="#4a9b6f"/>
        <path d="M100 58 L106 68 L90 58Z" fill="#4a9b6f"/>
        <text x="70" y="44" fontFamily="serif" fontSize="11" fontWeight="bold" fill="white">Გამარჯობა</text>
        <text x="72" y="54" fontFamily="serif" fontSize="8" fill="#c8e6c9">გამარჯობა!</text>
        {/* Two people */}
        <circle cx="30" cy="66" r="8" fill="#f4c5a0"/>
        <rect x="24" y="74" width="12" height="10" rx="3" fill="#9c27b0" opacity="0.7"/>
        <circle cx="90" cy="66" r="8" fill="#8B5E3C"/>
        <rect x="84" y="74" width="12" height="10" rx="3" fill="#1a4731" opacity="0.7"/>
      </svg>
    ),
  },
  {
    label: 'Photography',
    bg: '#fafafa',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#fafafa" rx="12"/>
        {/* Camera body */}
        <rect x="28" y="28" width="64" height="42" rx="8" fill="#263238"/>
        <circle cx="60" cy="50" r="16" fill="#37474f"/>
        <circle cx="60" cy="50" r="12" fill="#546e7a"/>
        <circle cx="60" cy="50" r="8" fill="#263238"/>
        <circle cx="60" cy="50" r="5" fill="#c5e8f5" opacity="0.6"/>
        {/* Flash */}
        <rect x="40" y="22" width="14" height="8" rx="4" fill="#263238"/>
        <rect x="72" y="30" width="10" height="6" rx="2" fill="#fff9c4"/>
        {/* Shutter button */}
        <circle cx="80" cy="28" r="5" fill="#e76f51"/>
        {/* Viewfinder */}
        <rect x="32" y="32" width="12" height="8" rx="2" fill="#546e7a"/>
        {/* Person holding camera */}
        <circle cx="100" cy="20" r="9" fill="#f4c5a0"/>
        <rect x="93" y="29" width="14" height="14" rx="4" fill="#e76f51"/>
        <path d="M93 36 L76 44" stroke="#f4c5a0" strokeWidth="6" strokeLinecap="round" fill="none"/>
        <circle cx="74" cy="45" r="4" fill="#f4c5a0"/>
      </svg>
    ),
  },
  {
    label: 'Health & Wellness',
    bg: '#e8f5e9',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#e8f5e9" rx="12"/>
        {/* Yoga mat */}
        <ellipse cx="55" cy="66" rx="40" ry="8" fill="#a5d6a7" opacity="0.5"/>
        <rect x="16" y="62" width="78" height="6" rx="3" fill="#4a9b6f" opacity="0.4"/>
        {/* Person in tree pose */}
        <circle cx="55" cy="18" r="11" fill="#f4c5a0"/>
        <path d="M44 18 Q45 7 55 6 Q65 7 66 18 Q61 12 55 12 Q49 12 44 18Z" fill="#1a0f00"/>
        <rect x="47" y="29" width="16" height="18" rx="5" fill="#a5d6a7"/>
        {/* Arms up */}
        <path d="M47 34 Q38 24 34 18" stroke="#f4c5a0" strokeWidth="6" strokeLinecap="round" fill="none"/>
        <path d="M63 34 Q72 24 76 18" stroke="#f4c5a0" strokeWidth="6" strokeLinecap="round" fill="none"/>
        {/* Standing leg */}
        <line x1="53" y1="47" x2="51" y2="64" stroke="#f4c5a0" strokeWidth="6" strokeLinecap="round"/>
        {/* Bent leg */}
        <path d="M57 47 Q64 54 60 64" stroke="#f4c5a0" strokeWidth="6" strokeLinecap="round" fill="none"/>
        {/* Decorative leaves */}
        <circle cx="96" cy="30" r="10" fill="#4a9b6f" opacity="0.6"/>
        <circle cx="104" cy="40" r="8" fill="#56ab7a" opacity="0.6"/>
        <circle cx="14" cy="42" r="8" fill="#4a9b6f" opacity="0.5"/>
      </svg>
    ),
  },
  {
    label: 'Courier Services',
    bg: '#e8eaf6',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#e8eaf6" rx="12"/>
        {/* Delivery bike / scooter */}
        <rect x="20" y="44" width="50" height="20" rx="5" fill="#3949ab"/>
        <rect x="26" y="36" width="36" height="14" rx="4" fill="#5c6bc0"/>
        {/* Package on back */}
        <rect x="58" y="32" width="22" height="20" rx="3" fill="#e9c46a"/>
        <line x1="69" y1="32" x2="69" y2="52" stroke="#d4a017" strokeWidth="1.5"/>
        <line x1="58" y1="42" x2="80" y2="42" stroke="#d4a017" strokeWidth="1.5"/>
        {/* Wheels */}
        <circle cx="34" cy="64" r="10" fill="#263238"/>
        <circle cx="34" cy="64" r="5" fill="#546e7a"/>
        <circle cx="68" cy="64" r="10" fill="#263238"/>
        <circle cx="68" cy="64" r="5" fill="#546e7a"/>
        {/* Rider */}
        <circle cx="50" cy="26" r="9" fill="#f4a261"/>
        <rect x="42" y="35" width="14" height="12" rx="4" fill="#3949ab"/>
        {/* Helmet */}
        <path d="M41 24 Q42 14 50 13 Q58 14 59 24 Q55 20 50 20 Q45 20 41 24Z" fill="#e53935"/>
        {/* Arrow/motion lines */}
        <line x1="10" y1="52" x2="20" y2="52" stroke="#3949ab" strokeWidth="2" strokeDasharray="3 2"/>
        <line x1="6" y1="58" x2="16" y2="58" stroke="#3949ab" strokeWidth="2" strokeDasharray="3 2"/>
      </svg>
    ),
  },
  {
    label: 'Business Help',
    bg: '#e8f4fd',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#e8f4fd" rx="12"/>
        {/* Briefcase */}
        <rect x="30" y="40" width="60" height="34" rx="6" fill="#1565c0"/>
        <rect x="44" y="34" width="32" height="12" rx="4" fill="#1565c0"/>
        <rect x="48" y="38" width="24" height="6" rx="3" fill="#0d47a1"/>
        <line x1="30" y1="54" x2="90" y2="54" stroke="#1976d2" strokeWidth="2"/>
        {/* Clasp */}
        <rect x="52" y="50" width="16" height="8" rx="3" fill="#e9c46a"/>
        {/* Person */}
        <circle cx="90" cy="20" r="10" fill="#f4c5a0"/>
        <path d="M80 20 Q80 10 90 9 Q100 10 100 20 Q96 14 90 14 Q84 14 80 20Z" fill="#1a0f00"/>
        <rect x="82" y="30" width="16" height="14" rx="5" fill="#1565c0"/>
        {/* Chart */}
        <rect x="12" y="28" width="8" height="20" rx="2" fill="#4a9b6f" opacity="0.7"/>
        <rect x="22" y="18" width="8" height="30" rx="2" fill="#56ab7a" opacity="0.7"/>
        <rect x="32" y="22" width="8" height="26" rx="2" fill="#4a9b6f" opacity="0.7"/>
      </svg>
    ),
  },
  {
    label: 'Arts & Crafts',
    bg: '#fff8e1',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#fff8e1" rx="12"/>
        {/* Canvas */}
        <rect x="12" y="14" width="56" height="50" rx="4" fill="white" stroke="#d4a017" strokeWidth="2"/>
        <rect x="30" y="10" width="4" height="8" rx="2" fill="#c8a882"/>
        <rect x="46" y="10" width="4" height="8" rx="2" fill="#c8a882"/>
        {/* Painting on canvas */}
        <circle cx="30" cy="36" r="12" fill="#a8d5b5" opacity="0.7"/>
        <circle cx="50" cy="32" r="8" fill="#fce4ec" opacity="0.8"/>
        <path d="M18 50 Q30 40 50 46 Q60 48 66 42" stroke="#e76f51" strokeWidth="2" fill="none"/>
        {/* Paint palette */}
        <ellipse cx="88" cy="50" rx="18" ry="14" fill="#f5f5f5" stroke="#d4a017" strokeWidth="1.5"/>
        <circle cx="80" cy="46" r="4" fill="#e76f51"/>
        <circle cx="88" cy="42" r="4" fill="#4a9b6f"/>
        <circle cx="96" cy="46" r="4" fill="#3949ab"/>
        <circle cx="92" cy="54" r="4" fill="#e9c46a"/>
        <circle cx="82" cy="54" r="4" fill="#e91e63"/>
        {/* Brush */}
        <line x1="92" y1="24" x2="82" y2="44" stroke="#c8a882" strokeWidth="3" strokeLinecap="round"/>
        <ellipse cx="91" cy="22" rx="4" ry="3" fill="#e76f51" transform="rotate(-35 91 22)"/>
        {/* Person */}
        <circle cx="100" cy="18" r="9" fill="#8B5E3C"/>
        <rect x="93" y="27" width="14" height="12" rx="4" fill="#9c27b0"/>
      </svg>
    ),
  },
  {
    label: 'Moving Help',
    bg: '#fce4ec',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#fce4ec" rx="12"/>
        {/* Boxes */}
        <rect x="14" y="46" width="28" height="24" rx="3" fill="#e9c46a"/>
        <line x1="28" y1="46" x2="28" y2="70" stroke="#d4a017" strokeWidth="1.5"/>
        <line x1="14" y1="56" x2="42" y2="56" stroke="#d4a017" strokeWidth="1.5"/>
        <rect x="44" y="52" width="22" height="18" rx="3" fill="#e9c46a"/>
        <line x1="55" y1="52" x2="55" y2="70" stroke="#d4a017" strokeWidth="1.5"/>
        <rect x="62" y="40" width="30" height="30" rx="3" fill="#d4a017"/>
        <line x1="77" y1="40" x2="77" y2="70" stroke="#c8a832" strokeWidth="2"/>
        <line x1="62" y1="54" x2="92" y2="54" stroke="#c8a832" strokeWidth="2"/>
        {/* Person carrying */}
        <circle cx="104" cy="24" r="10" fill="#f4a261"/>
        <path d="M94 24 Q95 14 104 13 Q113 14 114 24 Q110 18 104 18 Q98 18 94 24Z" fill="#1a0f00"/>
        <rect x="96" y="34" width="16" height="14" rx="5" fill="#e76f51"/>
        {/* Arms on box */}
        <path d="M96 38 L88 44" stroke="#f4a261" strokeWidth="6" strokeLinecap="round" fill="none"/>
        <path d="M112 38 L104 42" stroke="#f4a261" strokeWidth="6" strokeLinecap="round" fill="none"/>
        {/* Carrying box */}
        <rect x="84" y="42" width="28" height="20" rx="3" fill="#e9c46a"/>
      </svg>
    ),
  },
  {
    label: 'Other',
    bg: '#f5f5f5',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#f5f5f5" rx="12"/>
        {/* Plus sign in circle */}
        <circle cx="60" cy="40" r="26" fill="#a8d5b5" opacity="0.5"/>
        <circle cx="60" cy="40" r="20" fill="#4a9b6f" opacity="0.2"/>
        <line x1="60" y1="26" x2="60" y2="54" stroke="#1a4731" strokeWidth="4" strokeLinecap="round"/>
        <line x1="46" y1="40" x2="74" y2="40" stroke="#1a4731" strokeWidth="4" strokeLinecap="round"/>
        <circle cx="22" cy="20" r="8" fill="#e9c46a" opacity="0.6"/>
        <circle cx="98" cy="20" r="6" fill="#e76f51" opacity="0.6"/>
        <circle cx="16" cy="62" r="5" fill="#4a9b6f" opacity="0.5"/>
        <circle cx="104" cy="62" r="7" fill="#3949ab" opacity="0.4"/>
      </svg>
    ),
  },
];

const NEED_OPTIONS = [
  {
    label: 'Fix something at home',
    bg: '#e8f4fd',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#e8f4fd" rx="12"/>
        <path d="M20 72 L20 40 L60 18 L100 40 L100 72Z" fill="#fff" stroke="#4a9b6f" strokeWidth="2"/>
        <path d="M14 44 L60 14 L106 44" stroke="#4a9b6f" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <rect x="46" y="52" width="28" height="20" rx="3" fill="#c8a882"/>
        <circle cx="71" cy="63" r="2" fill="#8b6030"/>
        <rect x="24" y="48" width="16" height="14" rx="2" fill="#c5e8f5"/>
        <line x1="32" y1="48" x2="32" y2="62" stroke="white" strokeWidth="1.5"/>
        <line x1="24" y1="55" x2="40" y2="55" stroke="white" strokeWidth="1.5"/>
        <path d="M100 50 L108 42" stroke="#c8a882" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="109" cy="41" r="4" fill="none" stroke="#c8a882" strokeWidth="2.5"/>
      </svg>
    ),
  },
  {
    label: 'Learn a language',
    bg: '#f3e5f5',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#f3e5f5" rx="12"/>
        <rect x="10" y="12" width="46" height="28" rx="10" fill="#7e57c2"/>
        <path d="M20 40 L14 50 L30 40Z" fill="#7e57c2"/>
        <text x="18" y="26" fontFamily="serif" fontSize="11" fontWeight="bold" fill="white">Bonjour</text>
        <text x="16" y="36" fontFamily="serif" fontSize="8" fill="#d1c4e9">Hello • Salam</text>
        <rect x="64" y="30" width="46" height="28" rx="10" fill="#4a9b6f"/>
        <path d="M100 58 L106 68 L90 58Z" fill="#4a9b6f"/>
        <text x="72" y="44" fontFamily="serif" fontSize="9" fontWeight="bold" fill="white">Hola! こんにちは</text>
        <circle cx="30" cy="66" r="8" fill="#f4c5a0"/>
        <rect x="24" y="74" width="12" height="10" rx="3" fill="#9c27b0" opacity="0.7"/>
        <circle cx="90" cy="66" r="8" fill="#8B5E3C"/>
        <rect x="84" y="74" width="12" height="10" rx="3" fill="#1a4731" opacity="0.7"/>
      </svg>
    ),
  },
  {
    label: 'Pet care',
    bg: '#d4edda',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#d4edda" rx="12"/>
        <circle cx="38" cy="22" r="10" fill="#f4a261"/>
        <path d="M28 22 Q28 13 38 12 Q48 13 48 22 Q44 17 38 17 Q32 17 28 22Z" fill="#1a0f00"/>
        <rect x="30" y="32" width="16" height="18" rx="5" fill="#e76f51"/>
        <line x1="32" y1="50" x2="28" y2="64" stroke="#f4a261" strokeWidth="4" strokeLinecap="round"/>
        <line x1="44" y1="50" x2="48" y2="64" stroke="#f4a261" strokeWidth="4" strokeLinecap="round"/>
        <path d="M46 40 Q62 32 74 38" stroke="#4a4a4a" strokeWidth="1.5" strokeDasharray="3 2" strokeLinecap="round" fill="none"/>
        <ellipse cx="82" cy="54" rx="16" ry="9" fill="#c8763a"/>
        <circle cx="94" cy="46" r="10" fill="#c8763a"/>
        <ellipse cx="100" cy="49" rx="6" ry="4" fill="#b06528"/>
        <circle cx="103" cy="48" r="2" fill="#1a0f00"/>
        <ellipse cx="88" cy="41" rx="4" ry="7" fill="#b06528" transform="rotate(-15 88 41)"/>
        <line x1="70" y1="61" x2="66" y2="70" stroke="#b06528" strokeWidth="3" strokeLinecap="round"/>
        <line x1="78" y1="62" x2="76" y2="70" stroke="#b06528" strokeWidth="3" strokeLinecap="round"/>
        <line x1="86" y1="62" x2="84" y2="70" stroke="#b06528" strokeWidth="3" strokeLinecap="round"/>
        <line x1="94" y1="61" x2="96" y2="70" stroke="#b06528" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="16" cy="50" r="12" fill="#4a9b6f" opacity="0.8"/>
        <rect x="13" y="58" width="5" height="14" rx="2" fill="#2d6a4f" opacity="0.7"/>
      </svg>
    ),
  },
  {
    label: 'Package Pick Up',
    bg: '#e8eaf6',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#e8eaf6" rx="12"/>
        <rect x="20" y="44" width="50" height="20" rx="5" fill="#3949ab"/>
        <rect x="26" y="36" width="36" height="14" rx="4" fill="#5c6bc0"/>
        <rect x="58" y="32" width="22" height="20" rx="3" fill="#e9c46a"/>
        <line x1="69" y1="32" x2="69" y2="52" stroke="#d4a017" strokeWidth="1.5"/>
        <line x1="58" y1="42" x2="80" y2="42" stroke="#d4a017" strokeWidth="1.5"/>
        <circle cx="34" cy="64" r="10" fill="#263238"/>
        <circle cx="34" cy="64" r="5" fill="#546e7a"/>
        <circle cx="68" cy="64" r="10" fill="#263238"/>
        <circle cx="68" cy="64" r="5" fill="#546e7a"/>
        <circle cx="50" cy="26" r="9" fill="#f4a261"/>
        <rect x="42" y="35" width="14" height="12" rx="4" fill="#3949ab"/>
        <path d="M41 24 Q42 14 50 13 Q58 14 59 24 Q55 20 50 20 Q45 20 41 24Z" fill="#e53935"/>
        <line x1="10" y1="52" x2="20" y2="52" stroke="#3949ab" strokeWidth="2" strokeDasharray="3 2"/>
        <line x1="6" y1="58" x2="16" y2="58" stroke="#3949ab" strokeWidth="2" strokeDasharray="3 2"/>
      </svg>
    ),
  },
  {
    label: 'Carpool',
    bg: '#fce4ec',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#fce4ec" rx="12"/>
        <rect x="0" y="58" width="120" height="14" fill="#546e7a" opacity="0.3"/>
        <line x1="10" y1="65" x2="30" y2="65" stroke="white" strokeWidth="2" strokeDasharray="8 4"/>
        <line x1="50" y1="65" x2="70" y2="65" stroke="white" strokeWidth="2" strokeDasharray="8 4"/>
        <line x1="90" y1="65" x2="110" y2="65" stroke="white" strokeWidth="2" strokeDasharray="8 4"/>
        <rect x="18" y="38" width="84" height="24" rx="6" fill="#e91e63"/>
        <path d="M32 38 Q38 24 52 22 L72 22 Q86 24 90 38Z" fill="#e91e63"/>
        <rect x="38" y="26" width="18" height="14" rx="3" fill="#c5e8f5"/>
        <rect x="60" y="26" width="18" height="14" rx="3" fill="#c5e8f5"/>
        <circle cx="40" cy="62" r="10" fill="#263238"/>
        <circle cx="40" cy="62" r="5" fill="#546e7a"/>
        <circle cx="82" cy="62" r="10" fill="#263238"/>
        <circle cx="82" cy="62" r="5" fill="#546e7a"/>
        <rect x="98" y="44" width="6" height="8" rx="2" fill="#fff9c4"/>
        <circle cx="52" cy="30" r="5" fill="#f4c5a0"/>
        <circle cx="69" cy="30" r="5" fill="#8B5E3C"/>
      </svg>
    ),
  },
  {
    label: 'Tutoring',
    bg: '#ede7f6',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#ede7f6" rx="12"/>
        <rect x="16" y="14" width="68" height="44" rx="6" fill="white" stroke="#b39ddb" strokeWidth="2"/>
        <line x1="24" y1="28" x2="76" y2="28" stroke="#b39ddb" strokeWidth="1.5"/>
        <line x1="24" y1="36" x2="60" y2="36" stroke="#b39ddb" strokeWidth="1.5"/>
        <line x1="24" y1="44" x2="68" y2="44" stroke="#b39ddb" strokeWidth="1.5"/>
        <text x="22" y="27" fontFamily="monospace" fontSize="9" fill="#7e57c2">2+2=4</text>
        <rect x="30" y="56" width="44" height="4" rx="2" fill="#b39ddb" opacity="0.5"/>
        <circle cx="100" cy="28" r="10" fill="#f4c5a0"/>
        <rect x="92" y="38" width="16" height="16" rx="5" fill="#7e57c2"/>
        <line x1="92" y1="42" x2="78" y2="34" stroke="#c8a882" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Gardening help',
    bg: '#e8f5e9',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#e8f5e9" rx="12"/>
        <rect x="0" y="60" width="120" height="20" fill="#8aba8a" opacity="0.4"/>
        <circle cx="35" cy="42" r="16" fill="#4a9b6f"/>
        <circle cx="25" cy="50" r="11" fill="#3d8b5e"/>
        <circle cx="46" cy="48" r="12" fill="#56ab7a"/>
        <rect x="32" y="56" width="6" height="14" rx="3" fill="#2d6a4f"/>
        <circle cx="75" cy="38" r="12" fill="#56ab7a"/>
        <circle cx="68" cy="46" r="8" fill="#4a9b6f"/>
        <rect x="72" y="50" width="5" height="12" rx="2" fill="#2d6a4f"/>
        <circle cx="95" cy="26" r="9" fill="#f4c5a0"/>
        <rect x="88" y="35" width="14" height="14" rx="4" fill="#a8d5b5"/>
        <path d="M88 42 L78 54" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <ellipse cx="76" cy="56" rx="5" ry="3" fill="#c8763a" transform="rotate(-35 76 56)"/>
      </svg>
    ),
  },
  {
    label: 'Babysitting',
    bg: '#fde8d8',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#fde8d8" rx="12"/>
        <circle cx="45" cy="22" r="11" fill="#f4c5a0"/>
        <path d="M34 22 Q35 11 45 10 Q55 11 56 22 Q51 16 45 16 Q39 16 34 22Z" fill="#1a0f00"/>
        <rect x="35" y="33" width="20" height="20" rx="6" fill="#e9c46a"/>
        <path d="M55 40 Q70 34 80 38" stroke="#f4c5a0" strokeWidth="7" strokeLinecap="round" fill="none"/>
        <circle cx="84" cy="32" r="10" fill="#f4a261"/>
        <path d="M74 30 Q76 22 84 21 Q92 22 94 30 Q89 26 84 26 Q79 26 74 30Z" fill="#c8763a"/>
        <circle cx="80" cy="30" r="2" fill="#1a0f00"/>
        <circle cx="88" cy="30" r="2" fill="#1a0f00"/>
        <path d="M80 36 Q84 39 88 36" stroke="#1a0f00" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        <rect x="76" y="42" width="16" height="14" rx="5" fill="#a8d5b5"/>
        <rect x="58" y="60" width="14" height="14" rx="3" fill="#4a9b6f"/>
        <rect x="76" y="62" width="12" height="12" rx="3" fill="#e9c46a"/>
      </svg>
    ),
  },
  {
    label: 'Cooking help',
    bg: '#fff8e1',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#fff8e1" rx="12"/>
        <ellipse cx="60" cy="52" rx="28" ry="8" fill="#d4a017"/>
        <rect x="32" y="38" width="56" height="18" rx="4" fill="#e9c46a"/>
        <rect x="30" y="36" width="6" height="6" rx="3" fill="#8b6030"/>
        <rect x="84" y="36" width="6" height="6" rx="3" fill="#8b6030"/>
        <path d="M48 34 Q44 26 48 20" stroke="#ccc" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M60 32 Q56 22 60 16" stroke="#ccc" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M72 34 Q68 26 72 20" stroke="#ccc" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <circle cx="97" cy="22" r="10" fill="#f4a261"/>
        <rect x="89" y="32" width="16" height="16" rx="5" fill="#e76f51"/>
        <rect x="89" y="12" width="16" height="8" rx="4" fill="white"/>
        <rect x="93" y="8" width="8" height="8" rx="4" fill="white"/>
        <path d="M89 40 L76 50" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="74" cy="52" r="4" fill="#d4a017" stroke="#c8a882" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    label: 'Tech help',
    bg: '#e3f2fd',
    illustration: (
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="120" height="80" fill="#e3f2fd" rx="12"/>
        <rect x="22" y="30" width="64" height="38" rx="4" fill="#546e7a"/>
        <rect x="26" y="34" width="56" height="28" rx="2" fill="#c5e8f5"/>
        <rect x="14" y="68" width="80" height="5" rx="2" fill="#546e7a"/>
        <line x1="30" y1="42" x2="70" y2="42" stroke="#4a9b6f" strokeWidth="1.5" opacity="0.7"/>
        <line x1="30" y1="48" x2="58" y2="48" stroke="#4a9b6f" strokeWidth="1.5" opacity="0.7"/>
        <line x1="30" y1="54" x2="64" y2="54" stroke="#4a9b6f" strokeWidth="1.5" opacity="0.7"/>
        <circle cx="97" cy="22" r="10" fill="#8B5E3C"/>
        <rect x="89" y="32" width="16" height="14" rx="5" fill="#1565c0"/>
        <path d="M89 38 L78 50" stroke="#8B5E3C" strokeWidth="6" strokeLinecap="round" fill="none"/>
        <circle cx="76" cy="52" r="4" fill="#8B5E3C"/>
      </svg>
    ),
  },
];

// Green header bar shared by all steps
function StepHeader({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  const totalSteps = 4;
  return (
    <div className="flex-shrink-0 px-6 pt-8 pb-0" style={{ background: '#4a9b6f' }}>
      {/* Back + logo row */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
          <img src="/logo.svg" alt="" className="w-5 h-5" />
        </div>
        <span className="text-white/80 text-xs font-medium tracking-wider uppercase">Boomerang</span>
        <div className="ml-auto text-white/60 text-xs">{step}/{totalSteps}</div>
      </div>
      {/* Progress bar */}
      <div className="flex gap-1.5 mb-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all ${i < step ? 'bg-white flex-1' : i === step - 1 ? 'bg-white flex-[2]' : 'bg-white/30 flex-1'}`} />
        ))}
      </div>
      <h2 className="text-xl font-bold text-white mb-1 px-0">{title}</h2>
      <p className="text-white/70 text-xs leading-relaxed mb-4">{subtitle}</p>
      {/* Illustration strip */}
      <CommunityIllustration className="w-full" style={{ maxHeight: '130px' }} />
    </div>
  );
}

export default function OnboardingPage() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [cityCoords, setCityCoords] = useState<{ lat: number; lng: number } | null>(null);
  const cityDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { api.getCategories().catch(() => {}); }, []);

  const handleCityChange = (val: string) => {
    setCity(val); setCityCoords(null);
    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
    if (val.length < 3) { setCitySuggestions([]); return; }
    setGeocoding(true);
    cityDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5&addressdetails=1`, { headers: { 'User-Agent': 'Boomerang/1.0' } });
        setCitySuggestions(await res.json());
      } catch {}
      setGeocoding(false);
    }, 500);
  };

  const selectCitySuggestion = async (s: any) => {
    const lat = parseFloat(s.lat); const lng = parseFloat(s.lon);
    const a = s.address || {};
    const displayCity = a.neighbourhood || a.suburb || a.city_district || a.city || a.town || a.village || s.display_name.split(',')[0];
    setCity(displayCity); setCityCoords({ lat, lng }); setCitySuggestions([]);
    await api.updateProfile({ city: displayCity, latitude: lat, longitude: lng });
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const detected = data.address?.city || data.address?.town || data.address?.village || '';
          setCity(detected); setCityCoords({ lat: latitude, lng: longitude });
          await api.updateProfile({ city: detected, latitude, longitude });
        } catch {}
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const toggleSkill = (s: string) => setSelectedSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  const toggleNeed = (s: string) => setSelectedNeeds(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const handleFinish = async () => {
    const finalBio = bio || (selectedSkills.length > 0 ? `I offer: ${selectedSkills.join(', ')}` : '');
    if (finalBio) await api.updateProfile({ bio: finalBio });
    if (selectedNeeds.length > 0) await api.updateProfile({ interests: selectedNeeds.join(',') });
    localStorage.setItem('onboarding_done', 'true');
    await refreshUser();
    navigate('/services/new');
  };

  const skipAll = async () => {
    localStorage.setItem('onboarding_done', 'true');
    await refreshUser();
    navigate('/dashboard');
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-white">

      {/* ── STEP 1 — Location ── */}
      {step === 1 && (
        <>
          <StepHeader step={1} title="Where are you?" subtitle="We'll show you services and requests within 500m of your home." />
          <div className="flex-1 overflow-y-auto bg-white rounded-t-3xl -mt-4 px-6 pt-7 pb-10 shadow-2xl">
            {/* GPS button */}
            <button onClick={detectLocation} disabled={locating}
              className={`w-full py-4 rounded-2xl text-white text-sm font-bold mb-3 flex items-center justify-center gap-2 transition-all ${cityCoords ? 'bg-[#4a9b6f]' : 'bg-[#1a4731]'} disabled:opacity-60`}>
              {locating ? (
                <><span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Detecting…</>
              ) : cityCoords ? (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> {city} — GPS saved</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg> Use GPS (recommended)</>
              )}
            </button>

            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-gray-100" /><span className="text-xs text-gray-300">or type your address</span><div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Address search */}
            <div className="relative mb-1">
              <input value={city} onChange={e => handleCityChange(e.target.value)}
                placeholder="e.g. Tbilisi, Vake or Rue de Hollerich…"
                className="w-full pl-4 pr-8 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#4a9b6f] transition-all" />
              {geocoding && <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-block w-3.5 h-3.5 border-2 border-[#4a9b6f]/30 border-t-[#4a9b6f] rounded-full animate-spin" />}
              {citySuggestions.length > 0 && !cityCoords && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 overflow-hidden">
                  {citySuggestions.map((s: any, i: number) => (
                    <button key={i} type="button" onClick={() => selectCitySuggestion(s)}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-[#edf7f1] border-b border-gray-50 last:border-0 transition-colors">
                      <p className="font-medium truncate">{s.display_name.split(',').slice(0,2).join(',')}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{s.display_name.split(',').slice(2).join(',').trim()}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-6">🔒 Your exact location is never shown to others</p>

            <button onClick={async () => {
              if (city && !cityCoords) await api.updateProfile({ city });
              setStep(2);
            }} disabled={!city.trim()}
              className="w-full py-4 rounded-2xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: '#1a4731' }}>
              Continue <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
            </button>
            <button onClick={skipAll} className="w-full text-center text-xs text-gray-300 hover:text-gray-400 mt-3 py-2">Skip for now</button>
          </div>
        </>
      )}

      {/* ── STEP 2 — Provider: skills ── */}
      {step === 2 && (
        <>
          <StepHeader step={2} title="Provider" subtitle="Pick what services you are open to providing." />
          <div className="flex-1 overflow-y-auto bg-white rounded-t-3xl -mt-4 px-6 pt-7 pb-10 shadow-2xl">
            <div className="grid grid-cols-2 gap-3 mb-6">
              {SKILL_OPTIONS.map(s => (
                <button key={s.label} onClick={() => toggleSkill(s.label)}
                  className={`rounded-2xl border-2 text-left transition-all overflow-hidden ${selectedSkills.includes(s.label) ? 'border-[#4a9b6f] ring-2 ring-[#4a9b6f]/20' : 'border-gray-100 hover:border-[#4a9b6f]/40'}`}>
                  {/* Illustration */}
                  <div className="w-full h-[88px] relative" style={{ background: s.bg }}>
                    {s.illustration}
                    {selectedSkills.includes(s.label) && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#1a4731] flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      </div>
                    )}
                  </div>
                  {/* Label */}
                  <div className={`px-3 py-2.5 ${selectedSkills.includes(s.label) ? 'bg-[#edf7f1]' : 'bg-white'}`}>
                    <span className={`text-xs font-semibold leading-tight ${selectedSkills.includes(s.label) ? 'text-[#1a4731]' : 'text-gray-700'}`}>{s.label}</span>
                  </div>
                </button>
              ))}
            </div>
            {selectedSkills.length > 0 && (
              <p className="text-xs text-[#4a9b6f] font-medium text-center mb-4">{selectedSkills.length} selected</p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-2xl border-2 border-gray-100 text-gray-500 text-sm font-semibold hover:border-gray-200 transition-colors">
                ← Back
              </button>
              <button onClick={() => setStep(3)} disabled={selectedSkills.length === 0}
                className="flex-[2] py-4 rounded-2xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: '#1a4731' }}>
                Continue <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
              </button>
            </div>
            {selectedSkills.length === 0 && <p className="text-xs text-gray-300 text-center mt-2">Select at least one to continue</p>}
          </div>
        </>
      )}

      {/* ── STEP 3 — Almost there: needs ── */}
      {step === 3 && (
        <>
          <StepHeader step={3} title="Almost there!" subtitle="Pick what services you are open to receiving." />
          <div className="flex-1 overflow-y-auto bg-white rounded-t-3xl -mt-4 px-6 pt-7 pb-10 shadow-2xl">
            <div className="grid grid-cols-2 gap-3 mb-6">
              {NEED_OPTIONS.map(s => (
                <button key={s.label} onClick={() => toggleNeed(s.label)}
                  className={`rounded-2xl border-2 text-left transition-all overflow-hidden ${selectedNeeds.includes(s.label) ? 'border-[#4a9b6f] ring-2 ring-[#4a9b6f]/20' : 'border-gray-100 hover:border-[#4a9b6f]/40'}`}>
                  <div className="w-full h-[88px] relative" style={{ background: s.bg }}>
                    {s.illustration}
                    {selectedNeeds.includes(s.label) && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#1a4731] flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      </div>
                    )}
                  </div>
                  <div className={`px-3 py-2.5 ${selectedNeeds.includes(s.label) ? 'bg-[#edf7f1]' : 'bg-white'}`}>
                    <span className={`text-xs font-semibold leading-tight ${selectedNeeds.includes(s.label) ? 'text-[#1a4731]' : 'text-gray-700'}`}>{s.label}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)}
                className="flex-1 py-4 rounded-2xl border-2 border-gray-100 text-gray-500 text-sm font-semibold hover:border-gray-200 transition-colors">
                ← Back
              </button>
              <button onClick={() => setStep(4)}
                className="flex-[2] py-4 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: '#1a4731' }}>
                Continue <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── STEP 4 — Bio ── */}
      {step === 4 && (
        <>
          <StepHeader step={4} title="Tell us about you" subtitle="A short bio builds trust with your first customers." />
          <div className="flex-1 overflow-y-auto bg-white rounded-t-3xl -mt-4 px-6 pt-7 pb-10 shadow-2xl">
            {/* Skills summary */}
            {selectedSkills.length > 0 && (
              <div className="bg-[#edf7f1] border border-[#4a9b6f]/20 rounded-2xl p-4 mb-5">
                <p className="text-xs font-semibold text-[#1a4731] mb-2">Your skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSkills.map(s => (
                    <span key={s} className="text-xs bg-white border border-[#4a9b6f]/30 text-[#1a4731] px-2.5 py-1 rounded-full font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}

            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">About you</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4}
              placeholder="e.g. I'm a guitar teacher based in Vake. I also do home repairs and gardening."
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm resize-none outline-none focus:ring-2 focus:ring-[#4a9b6f] transition-all mb-4" />

            <div className="bg-[#edf7f1] border border-[#4a9b6f]/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
              <span className="text-xl shrink-0">🎉</span>
              <div>
                <p className="text-sm font-semibold text-[#1a4731] mb-0.5">Almost done!</p>
                <p className="text-xs text-[#4a9b6f] leading-relaxed">Next step: post your first service listing. It takes 2 minutes and you'll start receiving requests straight away.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)}
                className="flex-1 py-4 rounded-2xl border-2 border-gray-100 text-gray-500 text-sm font-semibold hover:border-gray-200 transition-colors">
                ← Back
              </button>
              <button onClick={handleFinish}
                className="flex-[2] py-4 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: '#1a4731' }}>
                Post my first service →
              </button>
            </div>
            <button onClick={skipAll} className="w-full text-center text-xs text-gray-300 hover:text-gray-400 mt-3 py-2">Skip for now</button>
          </div>
        </>
      )}
    </div>
  );
}
