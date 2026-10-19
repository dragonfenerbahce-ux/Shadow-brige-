import { sameCell, snapAngle, type Cell } from "./game/level";
import { LEVELS } from "./game/levels";
import { computeShadows } from "./game/shadows";
import { exitDistances, isSafe, nextStep } from "./game/path";
import { computeLayout, draw, sunPosition, type Layout, type PipState } from "./render";
import { browserStore, isUnlocked, loadProgress, recordWin, saveProgress } from "./progress";

const STEP_MS = 420;
const MELT_SECONDS = 0.7;
const HINT = "Set the sun, press Go, and keep turning it while Pip walks.";

let levelIndex = 0;
let level = LEVELS[levelIndex];
let toExit = exitDistances(level);

const canvas = document.querySelector<HTMLCanvasElement>("#board")!;
const ctx = canvas.getContext("2d")!;
const levelEl = document.querySelector<HTMLSpanElement>("#level-label")!;
const movesEl = document.querySelector<HTMLSpanElement>("#moves")!;
const messageEl = document.querySelector<HTMLParagraphElement>("#message")!;
const goBtn = document.querySelector<HTMLButtonElement>("#go")!;
const restartBtn = document.querySelector<HTMLButtonElement>("#restart")!;
const nextBtn = document.querySelector<HTMLButtonElement>("#next")!;
const backBtn = document.querySelector<HTMLButtonElement>("#back")!;
const selectScreen = document.querySelector<HTMLElement>("#select-screen")!;
const playScreen = document.querySelector<HTMLElement>("#play-screen")!;
const levelGrid = document.querySelector<HTMLDivElement>("#level-grid")!;
const doneCountEl = document.querySelector<HTMLSpanElement>("#done-count")!;

const store = browserStore();
let progress = loadProgress(store);

type Phase = "idle" | "walking" | "melting" | "won" | "melted";

let layout: Layout;
let sunAngle = level.sunAngle;
let shadow = computeShadows(level, sunAngle);
let moves = 0;
let phase: Phase = "idle";
let pip: PipState = { ...level.start, scale: 1 };
let dragStartAngle: number | null = null;
/** Bumped on restart so an old animation loop stops. */
let loopId = 0;

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

function restart() {
  loopId++;
  sunAngle = level.sunAngle;
  shadow = computeShadows(level, sunAngle);
  moves = 0;
  pip = { ...level.start, scale: 1 };
  phase = "idle";
  setMessage(HINT);
  updateHud();
  render();
}

function loadLevel(index: number) {
  levelIndex = index;
  level = LEVELS[index];
  toExit = exitDistances(level);
  layout = computeLayout(canvas.clientWidth, level);
  restart();
}

// --- Screens -------------------------------------------------------------------

function renderLevelGrid() {
  const done = LEVELS.filter((l) => progress[l.id] !== undefined).length;
  doneCountEl.textContent = `${done} of ${LEVELS.length} done`;
  levelGrid.replaceChildren(
    ...LEVELS.map((l, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "level-btn";
      const best = progress[l.id];
      const open = isUnlocked(progress, l.id);
      btn.disabled = !open;
      if (best !== undefined) btn.classList.add("done");
      const label = best !== undefined ? `best ${best}` : open ? "new" : "locked";
      btn.innerHTML = `${l.id}<small>${label}</small>`;
      btn.addEventListener("click", () => showPlay(i));
      return btn;
    }),
  );
}

function showSelect() {
  loopId++;
  playScreen.hidden = true;
  selectScreen.hidden = false;
  renderLevelGrid();
}

function showPlay(index: number) {
  selectScreen.hidden = true;
  playScreen.hidden = false;
  levelIndex = index;
  level = LEVELS[index];
  toExit = exitDistances(level);
  resize();
  restart();
}

// --- Sun dragging (allowed before Go and while Pip walks) --------------------

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

function setSun(angle: number) {
  angle = snapAngle(level, angle);
  if (angle === sunAngle) return;
  sunAngle = angle;
  shadow = computeShadows(level, sunAngle);
  if (phase !== "walking") render();
}

canvas.addEventListener("pointerdown", (e) => {
  if (phase !== "idle" && phase !== "walking") return;
  const p = pointerPos(e);
  if (!canGrab(p)) return;
  canvas.setPointerCapture(e.pointerId);
  dragStartAngle = sunAngle;
  setSun(angleAt(p));
});

canvas.addEventListener("pointermove", (e) => {
  if (dragStartAngle === null) return;
  setSun(angleAt(pointerPos(e)));
});

function endDrag() {
  if (dragStartAngle === null) return;
  if (dragStartAngle !== sunAngle) moves++;
  dragStartAngle = null;
  updateHud();
}

canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);

// --- Pip walking ---------------------------------------------------------------

function startWalk() {
  phase = "walking";
  setMessage("Keep Pip in the shadow!");
  updateHud();

  const id = ++loopId;
  let from: Cell = level.start;
  let to: Cell | null = null;
  let stepStart = 0;
  let meltStart = 0;

  function frame(now: number) {
    if (id !== loopId) return;

    if (phase === "walking") {
      if (!to) {
        to = nextStep(level, shadow, from, toExit);
        stepStart = now;
      }
      let f = 0;
      if (to) {
        f = Math.min(1, Math.max(0, (now - stepStart) / STEP_MS));
        if (f >= 1) {
          from = to;
          to = null;
          f = 0;
        }
      }
      const target = to ?? from;
      pip = { x: from.x + (target.x - from.x) * f, y: from.y + (target.y - from.y) * f, scale: 1 };

      if (sameCell(from, level.exit) && !to) {
        phase = "won";
        progress = recordWin(progress, level.id, moves);
        saveProgress(store, progress);
        const last = levelIndex === LEVELS.length - 1;
        setMessage(last ? `Pip made it! All levels done. Moves: ${moves}` : `Pip made it! Moves: ${moves}`);
        updateHud();
      } else {
        // Pip counts as standing on whichever cell holds most of its body.
        const standing = to && f >= 0.5 ? to : from;
        if (!isSafe(level, shadow, standing)) {
          phase = "melting";
          meltStart = now;
          dragStartAngle = null;
          setMessage("Pip melted in the light.");
          updateHud();
        }
      }
    } else if (phase === "melting") {
      pip.scale = Math.max(0, 1 - (now - meltStart) / 1000 / MELT_SECONDS);
      if (pip.scale === 0) {
        phase = "melted";
        setMessage("Pip melted in the light. Press Restart to try again.");
        updateHud();
      }
    }

    render();
    if (phase === "walking" || phase === "melting") requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

goBtn.addEventListener("click", () => {
  if (phase === "idle") startWalk();
});

restartBtn.addEventListener("click", restart);
nextBtn.addEventListener("click", () => loadLevel(levelIndex + 1));
backBtn.addEventListener("click", showSelect);
window.addEventListener("resize", resize);

showSelect();
