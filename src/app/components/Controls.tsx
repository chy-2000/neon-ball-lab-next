'use client';

import React from 'react';

interface ControlsProps {
  paused: boolean;
  onPauseToggle: () => void;
  onReset: () => void;
  onExplode: () => void;
  explodeActive: boolean;
}

export default function Controls({ paused, onPauseToggle, onReset, onExplode, explodeActive }: ControlsProps) {
  const buttons = [
    { id: 'pause', label: paused ? '▶ 继续' : '⏸ 暂停', onClick: onPauseToggle },
    { id: 'reset', label: '🔄 重置', onClick: onReset },
    { id: 'explode', label: '💣 爆炸', onClick: onExplode, active: explodeActive },
  ];

  return (
    <div id="controls" className="fixed bottom-6 right-6 z-10 flex gap-3">
      {buttons.map((btn) => (
        <button
          key={btn.id}
          onClick={btn.onClick}
          className={`
            relative overflow-hidden rounded-lg border px-6 py-3
            text-sm font-bold tracking-widest transition-all duration-300 ease-out
            hover:-translate-y-0.5 active:translate-y-0
            ${
              btn.active
                ? 'border-fuchsia-500 text-fuchsia-500 shadow-[0_0_25px_rgba(255,0,255,0.3),inset_0_0_20px_rgba(255,0,255,0.1)] animate-pulse'
                : 'border-cyan-400/40 bg-cyan-400/[0.08] text-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.1),inset_0_0_10px_rgba(0,255,255,0.05)] hover:border-cyan-400/80 hover:bg-cyan-400/15 hover:shadow-[0_0_25px_rgba(0,255,255,0.3),inset_0_0_20px_rgba(0,255,255,0.1)] hover:text-white'
            }
            [text-shadow:0_0_6px_rgba(0,255,255,0.6)]
            hover:[text-shadow:0_0_12px_rgba(0,255,255,1)]
            active:bg-cyan-400/25 active:shadow-[0_0_35px_rgba(0,255,255,0.5),inset_0_0_25px_rgba(0,255,255,0.15)]
            before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-cyan-400/20 before:to-transparent before:transition-transform before:duration-500 hover:before:translate-x-full
          `}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
