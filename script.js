const INITIAL_TIME = 30;
const POINTS_PER_STAR = 10;
const MAX_STARS_ON_SCREEN = 6;
const STORAGE_KEY = "neonStarCatcherBestScore2026";

const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const bestEl = document.getElementById("best");
const arenaEl = document.getElementById("arena");
const startOverlayEl = document.getElementById("startOverlay");
const startButtonEl = document.getElementById("startButton");
const actionBtnEl = document.getElementById("actionBtn");
const statusFeedbackEl = document.getElementById("statusFeedback");
const newHighBannerEl = document.getElementById("newHighBanner");
const highScoreValueEl = document.getElementById("highScoreValue");

let score = 0;
let timeLeft = INITIAL_TIME;
let bestScore = Number(localStorage.getItem(STORAGE_KEY)) || 0;
let isPlaying = false;
let countdownInterval = null;
let spawnInterval = null;
let animFrameId = null;
let stars = [];
let lastFrameTime = 0;

bestEl.textContent = bestScore;

function createStarSvg(idSuffix) {
  const gradId = `starGrad_${idSuffix}`;
  return `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff078" />
          <stop offset="55%" stop-color="#ffd01a" />
          <stop offset="100%" stop-color="#f59e0b" />
        </linearGradient>
      </defs>
      <polygon
        points="32,4 40.7,22.2 60.7,25.1 46.2,39.2 49.6,59.1 32,49.7 14.4,59.1 17.8,39.2 3.3,25.1 23.3,22.2"
        fill="url(#${gradId})"
        stroke="#ffe875"
        stroke-width="2"
        stroke-linejoin="round"
      />
    </svg>
  `;
}

function clearStars() {
  stars.forEach((star) => star.el.remove());
  stars = [];
  arenaEl.querySelectorAll(".pop-text").forEach((pop) => pop.remove());
}

function showFloatingPop(x, y, text) {
  const pop = document.createElement("span");
  pop.className = "pop-text";
  pop.textContent = text;
  pop.style.left = `${x}px`;
  pop.style.top = `${y}px`;
  arenaEl.appendChild(pop);

  setTimeout(() => {
    pop.remove();
  }, 550);
}

function spawnStar() {
  if (!isPlaying) return;
  if (stars.length >= MAX_STARS_ON_SCREEN) return;

  const rect = arenaEl.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const size = Math.random() < 0.35 ? 46 : 54;
  const padding = size * 0.7;
  const minX = padding;
  const maxX = Math.max(padding + 10, rect.width - padding);
  const minY = padding;
  const maxY = Math.max(padding + 10, rect.height - padding);

  const x = minX + Math.random() * (maxX - minX);
  const y = minY + Math.random() * (maxY - minY);

  const speed = 22 + Math.random() * 28;
  const angle = Math.random() * Math.PI * 2;
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;

  const el = document.createElement("div");
  el.className = "star";
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.innerHTML = createStarSvg(`${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);

  const starObj = {
    el,
    x,
    y,
    vx,
    vy,
    size,
    caught: false
  };

  const handleCatch = (event) => {
    event.stopPropagation();
    if (!isPlaying || starObj.caught) return;

    starObj.caught = true;
    score += POINTS_PER_STAR;
    scoreEl.textContent = score;
    statusFeedbackEl.textContent = `+${POINTS_PER_STAR} POINTS! ✨`;

    showFloatingPop(starObj.x, starObj.y, `+${POINTS_PER_STAR}`);
    el.classList.add("caught");

    stars = stars.filter((item) => item !== starObj);
    setTimeout(() => el.remove(), 140);

    if (stars.length < 2) {
      spawnStar();
    }
  };

  el.addEventListener("pointerdown", handleCatch);
  arenaEl.appendChild(el);
  stars.push(starObj);
}

function updateStars(now) {
  if (!isPlaying) return;

  if (!lastFrameTime) lastFrameTime = now;
  const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;

  const rect = arenaEl.getBoundingClientRect();
  for (const star of stars) {
    if (star.caught) continue;

    star.x += star.vx * dt;
    star.y += star.vy * dt;

    const half = star.size * 0.55;
    if (star.x < half) {
      star.x = half;
      star.vx = Math.abs(star.vx);
    } else if (star.x > rect.width - half) {
      star.x = rect.width - half;
      star.vx = -Math.abs(star.vx);
    }

    if (star.y < half) {
      star.y = half;
      star.vy = Math.abs(star.vy);
    } else if (star.y > rect.height - half) {
      star.y = rect.height - half;
      star.vy = -Math.abs(star.vy);
    }

    star.el.style.left = `${star.x}px`;
    star.el.style.top = `${star.y}px`;
  }

  animFrameId = requestAnimationFrame(updateStars);
}

function startGame() {
  clearInterval(countdownInterval);
  clearInterval(spawnInterval);
  cancelAnimationFrame(animFrameId);
  clearStars();

  score = 0;
  timeLeft = INITIAL_TIME;
  isPlaying = true;
  lastFrameTime = 0;

  scoreEl.textContent = score;
  timeEl.textContent = timeLeft;
  statusFeedbackEl.textContent = "Ayo tangkap bintangnya!";
  newHighBannerEl.classList.add("hidden");
  startOverlayEl.classList.add("hidden");

  actionBtnEl.disabled = true;
  actionBtnEl.textContent = "PLAYING...";
  actionBtnEl.classList.add("playing-state");

  spawnStar();
  spawnStar();
  spawnStar();

  spawnInterval = setInterval(() => {
    spawnStar();
  }, 650);

  countdownInterval = setInterval(() => {
    timeLeft -= 1;
    timeEl.textContent = Math.max(0, timeLeft);

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);

  animFrameId = requestAnimationFrame(updateStars);
}

function endGame() {
  isPlaying = false;
  clearInterval(countdownInterval);
  clearInterval(spawnInterval);
  cancelAnimationFrame(animFrameId);
  clearStars();

  const isNewRecord = score > bestScore && score > 0;
  if (isNewRecord) {
    bestScore = score;
    localStorage.setItem(STORAGE_KEY, String(bestScore));
    bestEl.textContent = bestScore;
    highScoreValueEl.textContent = bestScore;
    newHighBannerEl.classList.remove("hidden");
  }

  statusFeedbackEl.textContent = `TIME'S UP! FINAL SCORE: ${score}`;
  actionBtnEl.disabled = false;
  actionBtnEl.textContent = "PLAY AGAIN";
  actionBtnEl.classList.remove("playing-state");
}

startButtonEl.addEventListener("click", startGame);
actionBtnEl.addEventListener("click", () => {
  if (!isPlaying) {
    startGame();
  }
});
