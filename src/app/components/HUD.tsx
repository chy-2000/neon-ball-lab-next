'use client';

import React from 'react';

interface HUDProps {
  ballCount: number;
  fps: number;
  collisionCount: number;
  mousePos: string;
}

export default function HUD({ ballCount, fps, collisionCount, mousePos }: HUDProps) {
  const items = [
    { label: '🔮 小球数量 main更改一下', value: ballCount },
    { label: '⚡ FPSS', value: fps },
    { label: '💥 碰撞次数', value: collisionCount },
    { label: '📍 鼠标坐标', value: mousePos },
  ];

  return (
    <div
      id="hud"
      className="fixed top-5 left-5 z-10 min-w-[200px] rounded-xl border border-cyan-400/30 bg-black/60 p-4 text-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.15),inset_0_0_15px_rgba(0,255,255,0.05)] backdrop-blur-md"
    >
      {items.map((item, index) => (
        <div
          key={item.label}
          className={`flex items-center justify-between py-1.5 ${index < items.length - 1 ? 'border-b border-cyan-400/10' : ''}`}
        >
          <span className="text-[13px] tracking-wider text-cyan-400/70">{item.label}</span>
          <span className="min-w-[60px] text-right font-mono text-base font-bold text-cyan-400 [text-shadow:0_0_8px_rgba(0,255,255,0.8)]">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
