'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { BallData, Config } from '../types';
import {
  createBall,
  updateBall,
  resolveCollisions,
  triggerExplosion,
  hexToRgb,
} from '../lib/ball';

const CONFIG: Config = {
  initialBalls: 50,
  maxBalls: 500,
  minRadius: 6,
  maxRadius: 14,
  minSpeed: 1.5,
  maxSpeed: 4,
  trailLength: 18,
  connectionDist: 140,
  mouseAttractForce: 0.08,
  mouseAttractRadius: 200,
  explodeForce: 25,
  drag: 0.998,
  colors: [
    '#00ffff', '#ff00ff', '#00ff88', '#ff3366',
    '#ffff00', '#33ccff', '#ff6600', '#66ff33',
    '#cc33ff', '#00ffcc', '#ff0088', '#88ff00',
  ],
};

interface BallCanvasProps {
  onStatsUpdate: (stats: { ballCount: number; fps: number; collisionCount: number; mousePos: string }) => void;
  paused: boolean;
  onExplode: React.MutableRefObject<(() => void) | null>;
  onReset: React.MutableRefObject<(() => void) | null>;
}

export default function BallCanvas({ onStatsUpdate, paused, onExplode, onReset }: BallCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballsRef = useRef<BallData[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const pausedRef = useRef(paused);
  const collisionsRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsFramesRef = useRef(0);
  const fpsLastTimeRef = useRef(performance.now());
  const fpsRef = useRef(60);
  const rafRef = useRef<number>(0);

  pausedRef.current = paused;

  const initBalls = useCallback((count: number, canvasWidth: number, canvasHeight: number) => {
    ballsRef.current = [];
    for (let i = 0; i < count; i++) {
      ballsRef.current.push(createBall(canvasWidth, canvasHeight, CONFIG));
    }
  }, []);

  const drawBall = useCallback((ctx: CanvasRenderingContext2D, ball: BallData) => {
    const rgb = hexToRgb(ball.color);

    // 绘制拖尾
    for (let i = 0; i < ball.trail.length; i++) {
      const t = ball.trail[i];
      const alpha = (i / ball.trail.length) * 0.5;
      const size = ball.radius * (i / ball.trail.length);
      ctx.beginPath();
      ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
      ctx.fill();
    }

    // 外层光晕
    const glow = ctx.createRadialGradient(
      ball.x, ball.y, ball.radius * 0.2,
      ball.x, ball.y, ball.radius * 3
    );
    glow.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`);
    glow.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
    glow.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius * 3, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // 球体本身
    const grad = ctx.createRadialGradient(
      ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 0,
      ball.x, ball.y, ball.radius
    );
    grad.addColorStop(0, `rgba(${Math.min(rgb.r + 80, 255)}, ${Math.min(rgb.g + 80, 255)}, ${Math.min(rgb.b + 80, 255)}, 1)`);
    grad.addColorStop(1, ball.color);
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // 边缘发光
    ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, []);

  const drawConnections = useCallback((ctx: CanvasRenderingContext2D, balls: BallData[]) => {
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const dx = balls[j].x - balls[i].x;
        const dy = balls[j].y - balls[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONFIG.connectionDist) {
          const alpha = 1 - dist / CONFIG.connectionDist;
          const rgb1 = hexToRgb(balls[i].color);
          const rgb2 = hexToRgb(balls[j].color);
          ctx.beginPath();
          ctx.moveTo(balls[i].x, balls[i].y);
          ctx.lineTo(balls[j].x, balls[j].y);
          ctx.strokeStyle = `rgba(${(rgb1.r + rgb2.r) / 2}, ${(rgb1.g + rgb2.g) / 2}, ${(rgb1.b + rgb2.b) / 2}, ${alpha * 0.4})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }, []);

  const mainLoop = useCallback((timestamp: number) => {
    rafRef.current = requestAnimationFrame(mainLoop);

    if (pausedRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dt = Math.min((timestamp - lastTimeRef.current) / 16.667, 2);
    lastTimeRef.current = timestamp;

    // FPS 计算
    fpsFramesRef.current++;
    if (timestamp - fpsLastTimeRef.current >= 500) {
      fpsRef.current = Math.round((fpsFramesRef.current * 1000) / (timestamp - fpsLastTimeRef.current));
      fpsFramesRef.current = 0;
      fpsLastTimeRef.current = timestamp;
    }

    // 清屏（带半透明残留效果）
    ctx.fillStyle = 'rgba(10, 10, 18, 0.25)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 更新小球
    const balls = ballsRef.current;
    let frameCollisions = 0;
    balls.forEach((ball) => {
      frameCollisions += updateBall(ball, dt, canvas.width, canvas.height, mouseRef.current.x, mouseRef.current.y, CONFIG);
    });
    collisionsRef.current += frameCollisions;

    // 碰撞检测
    collisionsRef.current += resolveCollisions(balls);

    // 绘制连线
    drawConnections(ctx, balls);

    // 绘制小球
    balls.forEach((ball) => drawBall(ctx, ball));

    // 更新 HUD
    onStatsUpdate({
      ballCount: balls.length,
      fps: fpsRef.current,
      collisionCount: collisionsRef.current,
      mousePos: `${Math.round(mouseRef.current.x)}, ${Math.round(mouseRef.current.y)}`,
    });
  }, [onStatsUpdate, drawBall, drawConnections]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    handleResize();
    initBalls(CONFIG.initialBalls, canvas.width, canvas.height);
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(mainLoop);

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [initBalls, mainLoop]);

  useEffect(() => {
    onExplode.current = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      triggerExplosion(ballsRef.current, canvas.width, canvas.height, CONFIG);
    };
  }, [onExplode]);

  useEffect(() => {
    onReset.current = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      ballsRef.current = [];
      collisionsRef.current = 0;
      initBalls(CONFIG.initialBalls, canvas.width, canvas.height);
    };
  }, [onReset, initBalls]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    mouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -9999, y: -9999 };
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('#controls') || (e.target as HTMLElement).closest('#hud')) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const count = Math.min(10, CONFIG.maxBalls - ballsRef.current.length);
    for (let i = 0; i < count; i++) {
      const ball = createBall(canvas.width, canvas.height, CONFIG);
      ball.x = e.clientX;
      ball.y = e.clientY;
      ballsRef.current.push(ball);
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 block"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    />
  );
}
