import React from 'react';

const CHIP_COLORS = {
  red: '#c0392b',
  blue: '#2980b9',
  black: '#222222',
  green: '#27ae60',
  purple: '#8e44ad',
  white: '#bdc3c7',
};

const CHIP_SIZE = 68;

const CHIPS = [
  { label: 'BJ', color: 'black', top: '4%', left: '3%', rotate: -15 },
  { label: '$10', color: 'red', top: '20%', left: '-1%', rotate: 10 },
  { label: '$25', color: 'blue', top: '4%', left: '74%', rotate: 20 },
  { label: 'BJ', color: 'black', top: '2%', left: '56%', rotate: -8 },
  { label: '$100', color: 'black', top: '1%', left: '32%', rotate: 5 },
  { label: '$10', color: 'red', top: '72%', left: '2%', rotate: 18 },
  { label: 'BJ', color: 'black', top: '82%', left: '70%', rotate: -20 },
  { label: '$25', color: 'blue', top: '80%', left: '84%', rotate: 12 },
  { label: '$10', color: 'red', top: '90%', left: '32%', rotate: -5 },
  { label: '$50', color: 'green', top: '76%', left: '52%', rotate: 25 },
  { label: 'BJ', color: 'black', top: '62%', left: '87%', rotate: -12 },
  { label: '$25', color: 'blue', top: '46%', left: '90%', rotate: 8 },
];

function PokerChip({ label, color, size }) {
  const bg = CHIP_COLORS[color];
  const textColor = color === 'white' ? '#1a1a1a' : '#ffffff';
  const r = size / 2;
  const outerR = r - 1;
  const ridgeDepth = size * 0.085;
  const ridgeWidth = 6;
  const ridgeCount = 16;
  const whiteR = outerR - ridgeDepth - 1;
  const innerR = whiteR - size * 0.1;
  const fontSize = size * 0.22;

  const ridges = Array.from({ length: ridgeCount }, (_, i) => {
    const angle = (i / ridgeCount) * 2 * Math.PI;
    const a1 = angle - (ridgeWidth * Math.PI) / 180;
    const a2 = angle + (ridgeWidth * Math.PI) / 180;
    const inner = outerR - ridgeDepth;
    const x1 = r + outerR * Math.cos(a1), y1 = r + outerR * Math.sin(a1);
    const x2 = r + outerR * Math.cos(a2), y2 = r + outerR * Math.sin(a2);
    const xi1 = r + inner * Math.cos(a1), yi1 = r + inner * Math.sin(a1);
    const xi2 = r + inner * Math.cos(a2), yi2 = r + inner * Math.sin(a2);
    return (
      <path
        key={i}
        d={`M${x1},${y1} L${xi1},${yi1} L${xi2},${yi2} L${x2},${y2} Z`}
        fill="white"
        opacity={0.9}
      />
    );
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      <circle cx={r} cy={r} r={outerR} fill={bg} />
      {ridges}
      <circle cx={r} cy={r} r={whiteR} fill="white" />
      <circle cx={r} cy={r} r={innerR} fill={bg} />
      <text
        x={r} y={r + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill={textColor}
        fontFamily="Impact, 'Arial Narrow', 'Franklin Gothic Heavy', sans-serif"
        fontSize={fontSize}
        letterSpacing="1"
      >
        {label}
      </text>
    </svg>
  );
}

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-casino-green flex items-center justify-center relative overflow-hidden">
      {CHIPS.map((chip, i) => (
        <div
          key={i}
          className="absolute pointer-events-none select-none"
          style={{ top: chip.top, left: chip.left, transform: `rotate(${chip.rotate}deg)` }}
        >
          <PokerChip label={chip.label} color={chip.color} size={CHIP_SIZE} />
        </div>
      ))}
      <div className="relative z-10 w-full max-w-[22rem] sm:max-w-md bg-casino-panel p-8 sm:p-12 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] flex flex-col items-center">
        {children}
      </div>
    </div>
  );
};

export default Layout;