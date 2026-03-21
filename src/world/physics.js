import { clamp } from "../runtime/util/math.js";

export function aabbIntersect(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function expandRect(r, pad) {
  return { x: r.x - pad, y: r.y - pad, w: r.w + pad * 2, h: r.h + pad * 2 };
}

export function moveAndCollide(body, solids, dt) {
  // axis-separated AABB resolution
  body.onGround = false;

  body.x += body.vx * dt;
  for (const s of solids) {
    if (!aabbIntersect(body, s)) continue;
    if (body.vx > 0) body.x = s.x - body.w;
    else if (body.vx < 0) body.x = s.x + s.w;
    body.vx = 0;
  }

  body.y += body.vy * dt;
  for (const s of solids) {
    if (!aabbIntersect(body, s)) continue;
    if (body.vy > 0) {
      body.y = s.y - body.h;
      body.onGround = true;
    } else if (body.vy < 0) {
      body.y = s.y + s.h;
    }
    body.vy = 0;
  }
}

export function applyPlatformerForces(player, input, dt, params) {
  const {
    accel = 3200,
    maxSpeed = 440,
    friction = 2600,
    gravity = 2400,
    jumpVel = 820,
  } = params ?? {};

  const left = input.isDown("left");
  const right = input.isDown("right");
  const wantsJump = input.wasPressed("jump");

  if (left === right) {
    // friction towards 0
    const f = friction * dt;
    if (Math.abs(player.vx) <= f) player.vx = 0;
    else player.vx -= Math.sign(player.vx) * f;
  } else {
    player.vx += (right ? 1 : -1) * accel * dt;
    player.vx = clamp(player.vx, -maxSpeed, maxSpeed);
  }

  player.vy += gravity * dt;
  player.vy = clamp(player.vy, -2400, 2400);

  if (wantsJump && player.onGround) {
    player.vy = -jumpVel;
    player.onGround = false;
    return true;
  }
  return false;
}