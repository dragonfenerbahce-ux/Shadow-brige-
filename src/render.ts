import { litByStone, type Cell, type Level } from "./game/level";

export const COLORS = {
  coral: "#FF8A65",
  sun: "#FFC857",
  plum: "#3B2A5C",
  lavender: "#8E7CC3",
  cream: "#FFF4E0",
};

export interface Layout {
  /** Canvas size in CSS pixels. */
  size: number;
  cell: number;
  /** Top-left of the board in CSS pixels. */
  originX: number;
  originY: number;
  center: number;
  sunOrbit: number;
  sunRadius: number;
}

export function computeLayout(size: number, level: Level): Layout {
  // The sun orbit must clear the board corners, so the board takes 60% of the canvas.
  const board = size * 0.6;
  const cell = board / level.size;
  const origin = (size - board) / 2;
  return {
    size,
    cell,
    originX: origin,
    originY: origin,
    center: size / 2,
    sunOrbit: (board / 2) * Math.SQRT2 + size * 0.04,
    sunRadius: Math.max(12, cell * 0.38),
  };
}

export function sunPosition(layout: Layout, angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: layout.center + Math.cos(rad) * layout.sunOrbit,
    y: layout.center + Math.sin(rad) * layout.sunOrbit,
  };
}

export interface PipState {
  /** Position in cell units (can be between cells while walking). */
  x: number;
  y: number;
  /** 1 = full size, 0 = fully melted. */
  scale: number;
  /** 0 = in shadow, up to 1 = glowing orange in the sun just before melting. */
  hot?: number;
  /** 0-1 height of the little hop Pip makes on each step. */
  hop?: number;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** First-play coach marks drawn over the board (see src/coach.ts). */
export interface CoachMarks {
  /** Pulse the sun and show the "Drag the sun" bubble. */
  pointAtSun: boolean;
  /** Cells Pip would walk with the current sun, starting at Pip; null for none. */
  preview: Cell[] | null;
  /** Glow the door: the previewed path reaches it. */
  doorGlow: boolean;
}

export function draw(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  level: Level,
  shadow: boolean[][],
  sunAngle: number,
  pip: PipState,
  /** 0-1 progress of the win sparkle at the exit, or null. */
  sparkle: number | null = null,
  coach: CoachMarks | null = null,
) {
  const { cell, originX, originY, size } = layout;
  ctx.clearRect(0, 0, size, size);

  // Sun orbit ring.
  ctx.strokeStyle = "rgba(255, 244, 224, 0.35)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.arc(layout.center, layout.center, layout.sunOrbit, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Sun stops: one dot per direction the sun can snap to.
  ctx.fillStyle = "rgba(255, 244, 224, 0.7)";
  for (let i = 0; i < level.directions; i++) {
    const stop = sunPosition(layout, (i * 360) / level.directions);
    ctx.beginPath();
    ctx.arc(stop.x, stop.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Board base.
  ctx.fillStyle = COLORS.cream;
  roundRect(ctx, originX - 6, originY - 6, cell * level.size + 12, cell * level.size + 12, 14);
  ctx.fill();

  const cellX = (x: number) => originX + x * cell;
  const cellY = (y: number) => originY + y * cell;
  const gap = cell * 0.06;

  // Floor tiles, shadows.
  for (let y = 0; y < level.size; y++) {
    for (let x = 0; x < level.size; x++) {
      ctx.fillStyle = shadow[y][x] ? "rgba(59, 42, 92, 0.55)" : litByStone(level, { x, y }) ? "#FFF6B0" : "#FFE6C2";
      roundRect(ctx, cellX(x) + gap, cellY(y) + gap, cell - gap * 2, cell - gap * 2, cell * 0.15);
      ctx.fill();
    }
  }

  // Light stones: a glowing gem that lights the cells beside it.
  for (const l of level.lights ?? []) {
    const cx = cellX(l.x) + cell / 2;
    const cy = cellY(l.y) + cell / 2;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, cell * 1.2);
    glow.addColorStop(0, "rgba(255, 200, 87, 0.55)");
    glow.addColorStop(1, "rgba(255, 200, 87, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, cell * 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.sun;
    ctx.beginPath();
    ctx.moveTo(cx, cy - cell * 0.3);
    ctx.lineTo(cx + cell * 0.22, cy);
    ctx.lineTo(cx, cy + cell * 0.3);
    ctx.lineTo(cx - cell * 0.22, cy);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COLORS.coral;
    ctx.lineWidth = Math.max(1.5, cell * 0.04);
    ctx.stroke();
  }

  // Start and exit.
  drawTile(ctx, cellX(level.start.x), cellY(level.start.y), cell, COLORS.lavender, gap);
  drawTile(ctx, cellX(level.exit.x), cellY(level.exit.y), cell, COLORS.coral, gap);
  drawDoor(ctx, cellX(level.exit.x), cellY(level.exit.y), cell);

  // Blocks: a stone with a lighter top face.
  for (const b of level.blocks) {
    ctx.fillStyle = COLORS.plum;
    roundRect(ctx, cellX(b.x) + gap, cellY(b.y) + gap, cell - gap * 2, cell - gap * 2, cell * 0.18);
    ctx.fill();
    ctx.fillStyle = "#6A5499";
    roundRect(ctx, cellX(b.x) + gap * 2, cellY(b.y) + gap * 2, cell - gap * 4, cell * 0.62, cell * 0.14);
    ctx.fill();
  }

  // Coach: dots on the cells Pip could walk, and a glow on the door when they reach it.
  const pulse = (Math.sin(performance.now() / 260) + 1) / 2;
  if (coach?.doorGlow) {
    const ex = cellX(level.exit.x) + cell / 2;
    const ey = cellY(level.exit.y) + cell / 2;
    const glow = ctx.createRadialGradient(ex, ey, 0, ex, ey, cell * (0.8 + pulse * 0.3));
    glow.addColorStop(0, "rgba(255, 138, 101, 0.7)");
    glow.addColorStop(1, "rgba(255, 138, 101, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(ex, ey, cell * 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const c of coach?.preview?.slice(1) ?? []) {
    ctx.fillStyle = COLORS.cream;
    ctx.beginPath();
    ctx.arc(cellX(c.x) + cell / 2, cellY(c.y) + cell / 2, Math.max(2.5, cell * 0.09), 0, Math.PI * 2);
    ctx.fill();
  }

  const hot = pip.hot ?? 0;
  const shake = hot > 0 ? Math.sin(performance.now() / 25) * cell * 0.05 : 0;
  const hop = (pip.hop ?? 0) * cell * 0.12;
  drawPip(ctx, cellX(pip.x) + cell / 2 + shake, cellY(pip.y) + cell / 2 - hop, cell, pip.scale, hot);
  if (sparkle !== null) drawSparkle(ctx, cellX(level.exit.x) + cell / 2, cellY(level.exit.y) + cell / 2, cell, sparkle);

  // Sun handle.
  const sun = sunPosition(layout, sunAngle);
  const glow = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, layout.sunRadius * 2.2);
  glow.addColorStop(0, "rgba(255, 200, 87, 0.8)");
  glow.addColorStop(1, "rgba(255, 200, 87, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(sun.x, sun.y, layout.sunRadius * 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.sun;
  ctx.beginPath();
  ctx.arc(sun.x, sun.y, layout.sunRadius, 0, Math.PI * 2);
  ctx.fill();

  if (coach?.pointAtSun) drawSunCoach(ctx, layout, sunAngle, pulse);
}

/** A pulsing ring around the sun, arrows along its orbit and a "Drag the sun" bubble. */
function drawSunCoach(ctx: CanvasRenderingContext2D, layout: Layout, sunAngle: number, pulse: number) {
  const sun = sunPosition(layout, sunAngle);
  const r = layout.sunRadius;

  ctx.strokeStyle = `rgba(255, 244, 224, ${0.9 - pulse * 0.6})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(sun.x, sun.y, r * (1.4 + pulse * 0.9), 0, Math.PI * 2);
  ctx.stroke();

  // Arrows on the orbit on both sides of the sun: it moves along the ring.
  const rad = (sunAngle * Math.PI) / 180;
  ctx.strokeStyle = COLORS.cream;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  for (const side of [-1, 1]) {
    const a0 = rad + side * 0.22;
    const a1 = rad + side * 0.42;
    ctx.beginPath();
    ctx.arc(layout.center, layout.center, layout.sunOrbit, Math.min(a0, a1), Math.max(a0, a1));
    ctx.stroke();
    const tip = { x: layout.center + Math.cos(a1) * layout.sunOrbit, y: layout.center + Math.sin(a1) * layout.sunOrbit };
    const tangent = a1 + (side * Math.PI) / 2;
    for (const wing of [-0.6, 0.6]) {
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(tip.x - Math.cos(tangent + wing) * 9, tip.y - Math.sin(tangent + wing) * 9);
      ctx.stroke();
    }
  }
  ctx.lineCap = "butt";

  // The bubble sits between the sun and the board centre, kept inside the canvas.
  const label = "Drag the sun";
  ctx.font = `700 ${Math.max(13, r * 0.9)}px ui-rounded, system-ui, sans-serif`;
  const w = ctx.measureText(label).width + 20;
  const h = Math.max(26, r * 1.6);
  const toward = { x: layout.center - sun.x, y: layout.center - sun.y };
  const len = Math.hypot(toward.x, toward.y) || 1;
  let bx = sun.x + (toward.x / len) * r * 3.4 - w / 2;
  let by = sun.y + (toward.y / len) * r * 3.4 - h / 2;
  bx = Math.min(Math.max(bx, 4), layout.size - w - 4);
  by = Math.min(Math.max(by, 4), layout.size - h - 4);
  ctx.fillStyle = COLORS.plum;
  roundRect(ctx, bx, by, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = COLORS.cream;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, bx + w / 2, by + h / 2 + 1);
}

function drawTile(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, color: string, gap: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, cell * 0.07);
  roundRect(ctx, x + gap * 2, y + gap * 2, cell - gap * 4, cell - gap * 4, cell * 0.15);
  ctx.stroke();
}

function drawDoor(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number) {
  const w = cell * 0.36;
  const h = cell * 0.5;
  ctx.fillStyle = COLORS.coral;
  ctx.beginPath();
  ctx.roundRect(x + (cell - w) / 2, y + (cell - h) / 2 + cell * 0.04, w, h, [w / 2, w / 2, 3, 3]);
  ctx.fill();
}

function drawPip(ctx: CanvasRenderingContext2D, cx: number, cy: number, cell: number, scale: number, hot: number) {
  if (scale <= 0) return;
  // Smaller than its cell so the cell's shade stays visible around Pip.
  const r = cell * 0.26 * scale;
  ctx.fillStyle = hot > 0 ? COLORS.coral : COLORS.lavender;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.plum;
  ctx.lineWidth = Math.max(1.5, cell * 0.04 * scale);
  ctx.stroke();
  // Eyes.
  ctx.fillStyle = COLORS.cream;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + side * r * 0.38, cy - r * 0.15, r * 0.26, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.plum;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + side * r * 0.38, cy - r * 0.1, r * 0.13, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Glowing dust rising from the exit when Pip arrives. `t` runs from 0 to 1. */
function drawSparkle(ctx: CanvasRenderingContext2D, cx: number, cy: number, cell: number, t: number) {
  const count = 16;
  ctx.save();
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + i * 0.7;
    const reach = cell * (0.3 + t * (1.1 + (i % 4) * 0.25));
    const x = cx + Math.cos(angle) * reach;
    const y = cy + Math.sin(angle) * reach * 0.7 - t * cell * 0.5;
    ctx.globalAlpha = Math.max(0, 1 - t) * (i % 2 ? 0.9 : 0.6);
    ctx.fillStyle = i % 3 === 0 ? COLORS.cream : COLORS.sun;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(2, cell * 0.09 * (1 - t * 0.5)), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
