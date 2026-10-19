import { litByStone, type Level } from "./game/level";

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
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function draw(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  level: Level,
  shadow: boolean[][],
  sunAngle: number,
  pip: PipState,
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

  // Blocks: darker = taller, with a height number.
  for (const b of level.blocks) {
    const shade = ["#8E7CC3", "#6A5499", "#4E3B78"][b.h - 1] ?? COLORS.plum;
    ctx.fillStyle = shade;
    roundRect(ctx, cellX(b.x) + gap, cellY(b.y) + gap, cell - gap * 2, cell - gap * 2, cell * 0.18);
    ctx.fill();
    ctx.fillStyle = COLORS.cream;
    ctx.font = `700 ${cell * 0.4}px ui-rounded, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(b.h), cellX(b.x) + cell / 2, cellY(b.y) + cell / 2);
  }

  drawPip(ctx, cellX(pip.x) + cell / 2, cellY(pip.y) + cell / 2, cell, pip.scale);

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

function drawPip(ctx: CanvasRenderingContext2D, cx: number, cy: number, cell: number, scale: number) {
  if (scale <= 0) return;
  const r = cell * 0.32 * scale;
  ctx.fillStyle = COLORS.lavender;
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
