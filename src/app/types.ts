export interface BallData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  trail: { x: number; y: number }[];
  mass: number;
}

export interface TrailPoint {
  x: number;
  y: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface Config {
  initialBalls: number;
  maxBalls: number;
  minRadius: number;
  maxRadius: number;
  minSpeed: number;
  maxSpeed: number;
  trailLength: number;
  connectionDist: number;
  mouseAttractForce: number;
  mouseAttractRadius: number;
  explodeForce: number;
  drag: number;
  colors: string[];
}
