import { BallData, Config } from '../types';

export function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randColor(colors: string[]): string {
  return colors[Math.floor(Math.random() * colors.length)];
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

export function createBall(
  canvasWidth: number,
  canvasHeight: number,
  config: Config
): BallData {
  const radius = rand(config.minRadius, config.maxRadius);
  const x = rand(radius, canvasWidth - radius);
  const y = rand(radius, canvasHeight - radius);
  const angle = rand(0, Math.PI * 2);
  const speed = rand(config.minSpeed, config.maxSpeed);
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;
  return {
    x,
    y,
    vx,
    vy,
    radius,
    color: randColor(config.colors),
    trail: [],
    mass: radius * radius,
  };
}

export function updateBall(
  ball: BallData,
  dt: number,
  canvasWidth: number,
  canvasHeight: number,
  mouseX: number,
  mouseY: number,
  config: Config
): number {
  let collisions = 0;

  // 保存轨迹
  ball.trail.push({ x: ball.x, y: ball.y });
  if (ball.trail.length > config.trailLength) {
    ball.trail.shift();
  }

  // 鼠标吸引力
  const dx = mouseX - ball.x;
  const dy = mouseY - ball.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < config.mouseAttractRadius && dist > 1) {
    const force = config.mouseAttractForce * (1 - dist / config.mouseAttractRadius);
    ball.vx += (dx / dist) * force;
    ball.vy += (dy / dist) * force;
  }

  // 速度衰减
  ball.vx *= config.drag;
  ball.vy *= config.drag;

  // 更新位置
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  // 边界反弹
  if (ball.x - ball.radius < 0) {
    ball.x = ball.radius;
    ball.vx = Math.abs(ball.vx);
    collisions++;
  }
  if (ball.x + ball.radius > canvasWidth) {
    ball.x = canvasWidth - ball.radius;
    ball.vx = -Math.abs(ball.vx);
    collisions++;
  }
  if (ball.y - ball.radius < 0) {
    ball.y = ball.radius;
    ball.vy = Math.abs(ball.vy);
    collisions++;
  }
  if (ball.y + ball.radius > canvasHeight) {
    ball.y = canvasHeight - ball.radius;
    ball.vy = -Math.abs(ball.vy);
    collisions++;
  }

  return collisions;
}

export function resolveCollisions(balls: BallData[]): number {
  let collisions = 0;
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const b1 = balls[i];
      const b2 = balls[j];
      const dx = b2.x - b1.x;
      const dy = b2.y - b1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = b1.radius + b2.radius;

      if (dist < minDist && dist > 0) {
        // 位置修正
        const overlap = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        const totalMass = b1.mass + b2.mass;
        b1.x -= nx * overlap * (b2.mass / totalMass);
        b1.y -= ny * overlap * (b2.mass / totalMass);
        b2.x += nx * overlap * (b1.mass / totalMass);
        b2.y += ny * overlap * (b1.mass / totalMass);

        // 速度交换（弹性碰撞）
        const dvx = b2.vx - b1.vx;
        const dvy = b2.vy - b1.vy;
        const dvDotN = dvx * nx + dvy * ny;

        if (dvDotN > 0) continue;

        const impulse = (2 * dvDotN) / totalMass;
        b1.vx += impulse * b2.mass * nx;
        b1.vy += impulse * b2.mass * ny;
        b2.vx -= impulse * b1.mass * nx;
        b2.vy -= impulse * b1.mass * ny;

        collisions++;
      }
    }
  }
  return collisions;
}

export function triggerExplosion(
  balls: BallData[],
  canvasWidth: number,
  canvasHeight: number,
  config: Config
): void {
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;

  balls.forEach((ball) => {
    const dx = ball.x - cx;
    const dy = ball.y - cy;
    const angle = Math.atan2(dy, dx);
    const spread = rand(-0.5, 0.5);
    ball.vx = Math.cos(angle + spread) * rand(10, config.explodeForce);
    ball.vy = Math.sin(angle + spread) * rand(10, config.explodeForce);
  });
}
