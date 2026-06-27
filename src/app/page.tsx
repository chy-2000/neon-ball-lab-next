'use client';

import React, { useState, useRef, useCallback } from 'react';
import BallCanvas from './components/BallCanvas';
import HUD from './components/HUD';
import Controls from './components/Controls';

interface Stats {
  ballCount: number;
  fps: number;
  collisionCount: number;
  mousePos: string;
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({
    ballCount: 0,
    fps: 60,
    collisionCount: 0,
    mousePos: '0, 0',
  });
  const [paused, setPaused] = useState(false);
  const [explodeActive, setExplodeActive] = useState(false);

  const explodeRef = useRef<(() => void) | null>(null);
  const resetRef = useRef<(() => void) | null>(null);

  const handleStatsUpdate = useCallback((newStats: Stats) => {
    setStats(newStats);
  }, []);

  const handlePauseToggle = useCallback(() => {
    setPaused((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    if (resetRef.current) {
      resetRef.current();
    }
  }, []);

  const handleExplode = useCallback(() => {
    if (explodeRef.current) {
      explodeRef.current();
      setExplodeActive(true);
      setTimeout(() => setExplodeActive(false), 800);
    }
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#0a0a12] cursor-crosshair">
      {/* 扫描线效果 */}
      <div
        className="pointer-events-none fixed inset-0 z-[5]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.015) 2px, rgba(0, 255, 255, 0.015) 4px)',
        }}
      />

      <BallCanvas
        onStatsUpdate={handleStatsUpdate}
        paused={paused}
        onExplode={explodeRef}
        onReset={resetRef}
      />

      <HUD
        ballCount={stats.ballCount}
        fps={stats.fps}
        collisionCount={stats.collisionCount}
        mousePos={stats.mousePos}
      />

      <Controls
        paused={paused}
        onPauseToggle={handlePauseToggle}
        onReset={handleReset}
        onExplode={handleExplode}
        explodeActive={explodeActive}
      />
    </main>
  );
}
