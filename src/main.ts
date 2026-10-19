import { LEVELS, type Cell } from "./game/level";
import { computeShadows } from "./game/shadows";
import { resolveWalk, type WalkResult } from "./game/path";
import { computeLayout, draw, sunPosition, type Layout, type PipState } from "./render";

const WALK_CELLS_PER_SEC = 4;
const MELT_SECONDS = 0.7;
const MIN_MOVE_DEGREES = 1;

let levelIndex = 0;
let level = LEVELS[levelIndex];

const canvas = document.querySelector<HTMLCanvasElement>("#board")!;
const ctx = canvas.getContext("2d")!;
const levelEl = document.querySelector<HTMLSpanElement>("#level-label")!;
const movesEl = document.querySelector<HTMLSpanElement>("#moves")!;
const messageEl = document.querySelector<HTMLParagraphElement>("#message")!;
const goBtn = document.querySelector<HTMLButtonElement>("#go")!;
const restartBtn = document.querySelector<HTMLButtonElement>("#restart")!;
const nextBtn = document.querySelector<HTMLButtonElement>("#next")!;

type Phase = "idle" | "walking" | "won" | "melted";

let layout: Layout;
let sunAngle = level.sunAngle;
let shadow = computeShadows(level, sunAngle);
let moves = 0;
let phase: Phase = "idle";
let pip: PipState = { ...level.start, scale: 1 };
let dragStartAngle: number | null = null;
/** Bumped on restart so an old walk animation stops. */
let walkId = 0;

function render() {
  draw(ctx, layout, level, shadow, sunAngle, pip);
}

function resize() {
  const size = canvas.clientWidth;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  layout = computeLayout(size, level);
  render();
}

function setMessage(text: string) {
  messageEl.textContent = text;
}

function updateHud() {
  levelEl.textContent = `Level ${level.id} of ${LEVELS.length}`;
  movesEl.textContent = `Moves: ${moves}`;
  goBtn.disabled = phase !== "idle";
  const showNext = phase === "won" && levelIndex < LEVELS.length - 1;
  nextBtn.hidden = !showNext;
  goBtn.hidden = showNext;
}

function resetPip() {
  pip = { ...level.start, scale: 1 };
  phase = "idle";
}

function restart() {
  walkId++;
  sunAngle = level.sunAngle;
  shadow = computeShadows(level, sunAngle);
  moves = 0;
  resetPip();
  setMessage("Drag the sun to move the shadows.");
  updateHud();
  render();
}

function loadLevel(index: number) {
  levelIndex = index;
  level = LEVELS[index];
  layout = computeLayout(canvas.clientWidth, level);
  restart();
}

// --- Sun dragging -----------------------------------------------------------

function pointerPos(e: PointerEvent) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function angleAt(p: { x: number; y: number }): number {
  const deg = (Math.atan2(p.y - layout.center, p.x - layout.center) * 180) / Math.PI;
  return (deg + 360) % 360;
}

/** The sun can be grabbed on the sun itself or anywhere outside the board. */
function canGrab(p: { x: number; y: number }): boolean {
  const sun = sunPosition(layout, sunAngle);
  if (Math.hypot(p.x - sun.x, p.y - sun.y) <= layout.sunRadius * 2) return true;
  const end = layout.originX + layout.cell * level.size;
  return p.x < layout.originX || p.y < layout.originY || p.x > end || p.y > end;
}

function angleDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

canvas.addEventListener("pointerdown", (e) => {
  if (phase === "walking" || phase === "won") return;
  const p = pointerPos(e);
  if (!canGrab(p)) return;
  if (phase === "melted") {
    resetPip();
    setMessage("Drag the sun to move the shadows.");
  }
  canvas.setPointerCapture(e.pointerId);
  dragStartAngle = sunAngle;
  sunAngle = angleAt(p);
  shadow = computeShadows(level, sunAngle);
  updateHud();
  render();
});

canvas.addEventListener("pointermove", (e) => {
  if (dragStartAngle === null) return;
  sunAngle = angleAt(pointerPos(e));
  shadow = computeShadows(level, sunAngle);
  render();
});

function endDrag() {
  if (dragStartAngle === null) return;
  if (angleDiff(dragStartAngle, sunAngle) >= MIN_MOVE_DEGREES) moves++;
  dragStartAngle = null;
  updateHud();
}

canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);

// --- Pip walking -------------------------------------------------------------

function animateWalk(result: WalkResult) {
  phase = "walking";
  updateHud();
  const path: Cell[] = result.path;
  const walkTime = (path.length - 1) / WALK_CELLS_PER_SEC;
  const start = performance.now();
  const id = walkId;

  function frame(now: number) {
    if (id !== walkId) return;
    const t = Math.max(0, (now - start) / 1000);
    const steps = Math.min(t * WALK_CELLS_PER_SEC, path.length - 1);
    const i = Math.floor(steps);
    const f = steps - i;
    const a = path[i];
    const b = path[Math.min(i + 1, path.length - 1)];
    pip = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, scale: 1 };

    if (t >= walkTime && result.outcome !== "win") {
      pip.scale = Math.max(0, 1 - (t - walkTime) / MELT_SECONDS);
    }
    render();

    const done = result.outcome === "win" ? t >= walkTime : t >= walkTime + MELT_SECONDS;
    if (!done) {
      requestAnimationFrame(frame);
      return;
    }
    if (result.outcome === "win") {
      phase = "won";
      const last = levelIndex === LEVELS.length - 1;
      setMessage(last ? `Pip made it! All levels done. Moves: ${moves}` : `Pip made it! Moves: ${moves}`);
    } else {
      phase = "melted";
      setMessage(
        result.outcome === "melt" ? "Pip melted in the light. Drag the sun and try again." : "No way through.",
      );
    }
    updateHud();
  }
  requestAnimationFrame(frame);
}

goBtn.addEventListener("click", () => {
  if (phase !== "idle") return;
  animateWalk(resolveWalk(level, shadow));
});

restartBtn.addEventListener("click", restart);
nextBtn.addEventListener("click", () => loadLevel(levelIndex + 1));
window.addEventListener("resize", resize);

resize();
updateHud();
