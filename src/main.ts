import { sameCell, snapAngle, type Cell } from "./game/level";
import { LEVELS } from "./game/levels";
import { computeShadows } from "./game/shadows";
import { exitDistances, isSafe, nextStep, walkUntilStop } from "./game/path";
import { computeLayout, draw, sunPosition, type CoachMarks, type Layout, type PipState } from "./render";
import { browserStore, isUnlocked, loadProgress, recordWin, saveProgress } from "./progress";
import { COACH_MESSAGES, PREVIEW_LEVEL, coachView, coachesLevel, startsInFirstLevel } from "./coach";
import { initAudio, isMuted, playHot, playMelt, playStep, playTick, playWin, toggleMuted, unlockAudio } from "./audio";

const STEP_MS = 420;
const MELT_SECONDS = 0.7;
/** In the first levels Pip glows orange for a moment in the sun before it melts. */
const WARNING_LEVELS = 10;
const WARNING_MS = 800;
/** How long the exit sparkles before the result card appears. */
const SPARKLE_MS = 1100;
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
const backBtn = document.querySelector<HTMLButtonElement>("#back")!;
const selectScreen = document.querySelector<HTMLElement>("#select-screen")!;
const playScreen = document.querySelector<HTMLElement>("#play-screen")!;
const levelGrid = document.querySelector<HTMLDivElement>("#level-grid")!;
const doneCountEl = document.querySelector<HTMLSpanElement>("#done-count")!;
const titleEl = document.querySelector<HTMLSpanElement>("#game-title")!;
const soundBtn = document.querySelector<HTMLButtonElement>("#sound")!;
const resultEl = document.querySelector<HTMLDivElement>("#result")!;
const resultCard = resultEl.querySelector<HTMLDivElement>(".result-card")!;
const resultTitle = document.querySelector<HTMLHeadingElement>("#result-title")!;
const resultDetail = document.querySelector<HTMLParagraphElement>("#result-detail")!;
const resultNextBtn = document.querySelector<HTMLButtonElement>("#result-next")!;
const resultRetryBtn = document.querySelector<HTMLButtonElement>("#result-retry")!;
const resultLevelsBtn = document.querySelector<HTMLButtonElement>("#result-levels")!;

const store = browserStore();
const UNLOCK_KEY = "shadowbridge.unlockAll";
/** Test mode opens every level: a link ending with #unlock, or tapping the title 5 times. */
let unlockAll = location.hash === "#unlock" || readFlag(UNLOCK_KEY);

function readFlag(key: string): boolean {
  try {
    return store?.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string, on: boolean) {
  try {
    store?.setItem(key, on ? "1" : "0");
  } catch {
    // Test mode then lasts only until the page reloads.
  }
}
let progress = loadProgress(store);

type Phase = "idle" | "walking" | "melting" | "celebrating" | "won" | "melted";

let layout: Layout;
let sunAngle = level.sunAngle;
let shadow = computeShadows(level, sunAngle);
let moves = 0;
let phase: Phase = "idle";
let pip: PipState = { ...level.start, scale: 1 };
let dragStartAngle: number | null = null;
/** Bumped on restart so an old animation loop stops. */
let loopId = 0;
/** Progress of the exit sparkle, 0-1, or null when not celebrating. */
let sparkle: number | null = null;
/** Coach: the player has turned the sun on this level. */
let coachDragged = false;
/** Coach: until this time (ms) the sun pulses after a tap on the board. */
let nudgeUntil = 0;
let coachLoopOn = false;

function render() {
  draw(ctx, layout, level, shadow, sunAngle, pip, sparkle, coachMarks());
}

// --- First-play coach (levels 1-3, path preview on level 1 only) ----------------

/** The coach's view for the current sun, plus Pip's walk when it is previewed. */
function currentCoach() {
  const walk = level.id === PREVIEW_LEVEL ? walkUntilStop(level, shadow, level.start, toExit) : null;
  const reachesExit = walk !== null && sameCell(walk[walk.length - 1], level.exit);
  return { view: coachView(level.id, coachDragged, reachesExit), walk };
}

function coachMarks(): CoachMarks | null {
  if (phase !== "idle" || !coachesLevel(level.id)) return null;
  const { view, walk } = currentCoach();
  return {
    pointAtSun: view.pointAtSun || performance.now() < nudgeUntil,
    preview: view.preview ? walk : null,
    doorGlow: view.pathReady,
  };
}

/** Updates the coach message and the Go pulse, and keeps the coach animating while needed. */
function applyCoach() {
  const coaching = phase === "idle" && coachesLevel(level.id);
  const view = coaching ? currentCoach().view : null;
  goBtn.classList.toggle("pulse", view?.pathReady ?? false);
  if (view?.message && messageEl.textContent !== view.message) setMessage(view.message);
  if (coaching) runCoachLoop();
}

function runCoachLoop() {
  if (coachLoopOn) return;
  coachLoopOn = true;
  const tick = () => {
    const marks = coachMarks();
    render();
    if (!marks || playScreen.hidden || !(marks.pointAtSun || marks.doorGlow)) {
      coachLoopOn = false;
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function nudgeTowardSun() {
  setMessage(COACH_MESSAGES.tapBoard);
  nudgeUntil = performance.now() + 1500;
  runCoachLoop();
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
}

/** Shows the result card. `previousBest` is the best move count before this win. */
function showResult(won: boolean, previousBest?: number) {
  const last = levelIndex === LEVELS.length - 1;
  resultCard.classList.toggle("melted", !won);
  if (won) {
    resultTitle.textContent = last ? "All levels done!" : "Wonderful!";
    const best = previousBest === undefined || moves < previousBest ? "New best!" : `Best: ${previousBest}`;
    resultDetail.textContent = `Pip made it in ${moves} ${moves === 1 ? "move" : "moves"}. ${best}`;
  } else {
    resultTitle.textContent = "Pip melted";
    resultDetail.textContent = "The sun reached Pip. Try another way.";
  }
  resultNextBtn.hidden = !won || last;
  resultEl.hidden = false;
  (resultNextBtn.hidden ? resultRetryBtn : resultNextBtn).focus();
}

function hideResult() {
  resultEl.hidden = true;
}

function restart() {
  loopId++;
  hideResult();
  sparkle = null;
  sunAngle = level.sunAngle;
  shadow = computeShadows(level, sunAngle);
  moves = 0;
  pip = { ...level.start, scale: 1 };
  phase = "idle";
  setMessage(level.hint ?? HINT);
  updateHud();
  render();
  applyCoach();
}

function loadLevel(index: number) {
  levelIndex = index;
  level = LEVELS[index];
  toExit = exitDistances(level);
  coachDragged = false;
  // The new level may have a different board size, so shadows must match it before anything draws.
  sunAngle = level.sunAngle;
  shadow = computeShadows(level, sunAngle);
  resize();
  restart();
}

// --- Screens -------------------------------------------------------------------

function renderLevelGrid() {
  const done = LEVELS.filter((l) => progress[l.id] !== undefined).length;
  doneCountEl.textContent = unlockAll ? `${done}/${LEVELS.length} · test mode` : `${done} of ${LEVELS.length} done`;
  levelGrid.replaceChildren(
    ...LEVELS.map((l, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "level-btn";
      const best = progress[l.id];
      const open = isUnlocked(progress, l.id, unlockAll);
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
  hideResult();
  playScreen.hidden = true;
  selectScreen.hidden = false;
  renderLevelGrid();
}

function showPlay(index: number) {
  selectScreen.hidden = true;
  playScreen.hidden = false;
  loadLevel(index);
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
  playTick();
  if (dragStartAngle !== null) coachDragged = true;
  if (phase !== "walking") render();
  applyCoach();
}

canvas.addEventListener("pointerdown", (e) => {
  if (phase !== "idle" && phase !== "walking") return;
  const p = pointerPos(e);
  if (!canGrab(p)) {
    if (coachesLevel(level.id)) nudgeTowardSun();
    return;
  }
  canvas.setPointerCapture(e.pointerId);
  nudgeUntil = 0;
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
  goBtn.classList.remove("pulse");
  updateHud();

  const id = ++loopId;
  let from: Cell = level.start;
  let to: Cell | null = null;
  let stepStart = 0;
  let meltStart = 0;
  let hotSince: number | null = null;
  let winAt = 0;
  let previousBest: number | undefined;
  /** Coach: since when Pip has been waiting with no dark path, and whether that was said. */
  let waitingSince: number | null = null;
  let waitingShown = false;

  function frame(now: number) {
    if (id !== loopId) return;

    if (phase === "walking") {
      if (!to) {
        to = nextStep(level, shadow, from, toExit);
        stepStart = now;
        if (to) playStep();
      }
      let f = 0;
      if (to) {
        f = Math.min(1, Math.max(0, (now - stepStart) / STEP_MS));
        if (f < 0.5 && !isSafe(level, shadow, to) && isSafe(level, shadow, from)) {
          // The next cell was lit before Pip got there: walk back instead.
          [from, to] = [to, from];
          f = 1 - f;
          stepStart = now - f * STEP_MS;
        }
        if (f >= 1) {
          from = to;
          to = null;
          f = 0;
        }
      }
      if (to) {
        if (waitingShown) setMessage("Keep Pip in the shadow!");
        waitingSince = null;
        waitingShown = false;
      } else if (coachesLevel(level.id) && hotSince === null) {
        waitingSince ??= now;
        if (!waitingShown && now - waitingSince > 1000) {
          setMessage(COACH_MESSAGES.waiting);
          waitingShown = true;
        }
      }
      const target = to ?? from;
      // Pip hops a little on every step.
      pip = { x: from.x + (target.x - from.x) * f, y: from.y + (target.y - from.y) * f, scale: 1, hop: Math.sin(f * Math.PI) };

      if (sameCell(from, level.exit) && !to) {
        phase = "celebrating";
        winAt = now;
        playWin();
        previousBest = progress[level.id];
        progress = recordWin(progress, level.id, moves);
        saveProgress(store, progress);
        setMessage(`Pip made it! Moves: ${moves}`);
        updateHud();
      } else {
        // Pip counts as standing on whichever cell holds most of its body.
        const standing = to && f >= 0.5 ? to : from;
        if (isSafe(level, shadow, standing)) {
          if (hotSince !== null) setMessage("Keep Pip in the shadow!");
          hotSince = null;
        } else {
          if (hotSince === null) {
            hotSince = now;
            setMessage("Pip is in the sun! Shade it!");
            playHot();
          }
          const warning = level.id <= WARNING_LEVELS ? WARNING_MS : 0;
          pip.hot = Math.min(1, (now - hotSince) / WARNING_MS);
          if (now - hotSince >= warning) {
            phase = "melting";
            meltStart = now;
            playMelt();
            dragStartAngle = null;
            setMessage("Pip melted in the light.");
            updateHud();
          }
        }
      }
    } else if (phase === "melting") {
      pip.scale = Math.max(0, 1 - (now - meltStart) / 1000 / MELT_SECONDS);
      if (pip.scale === 0) {
        phase = "melted";
        setMessage("Pip melted in the light.");
        updateHud();
        showResult(false);
      }
    } else if (phase === "celebrating") {
      sparkle = Math.min(1, (now - winAt) / SPARKLE_MS);
      if (sparkle === 1) {
        phase = "won";
        sparkle = null;
        showResult(true, previousBest);
      }
    }

    render();
    if (phase === "walking" || phase === "melting" || phase === "celebrating") requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

goBtn.addEventListener("click", () => {
  if (phase === "idle") startWalk();
});

restartBtn.addEventListener("click", restart);
resultNextBtn.addEventListener("click", () => loadLevel(levelIndex + 1));
resultRetryBtn.addEventListener("click", restart);
resultLevelsBtn.addEventListener("click", showSelect);
backBtn.addEventListener("click", showSelect);

// Hidden test switch: five quick taps on the title turn "all levels open" on or off.
let titleTaps: number[] = [];
titleEl.addEventListener("click", () => {
  const now = Date.now();
  titleTaps = [...titleTaps.filter((t) => now - t < 2000), now];
  if (titleTaps.length < 5) return;
  titleTaps = [];
  unlockAll = !unlockAll;
  writeFlag(UNLOCK_KEY, unlockAll);
  renderLevelGrid();
});
window.addEventListener("resize", resize);

// --- Sound ---------------------------------------------------------------------

initAudio(store);

function updateSoundButton() {
  const off = isMuted();
  soundBtn.setAttribute("aria-pressed", String(off));
  soundBtn.setAttribute("aria-label", off ? "Turn sound on" : "Turn sound off");
}

// Browsers allow sound only after a tap, so the first tap anywhere starts it.
document.addEventListener("pointerdown", unlockAudio);
soundBtn.addEventListener("click", () => {
  toggleMuted();
  updateSoundButton();
});
updateSoundButton();

// New players (no finished level) start right in level 1; everyone else sees the level list.
if (startsInFirstLevel(progress)) showPlay(0);
else showSelect();
