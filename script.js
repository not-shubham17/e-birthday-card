/* ══════════════════════════════════════════════
   E-BIRTHDAY CARD — script.js
   ══════════════════════════════════════════════ */

// ── 1. MODULAR CONFIGURATION ──────────────────
const config = {
  name: "Chatuli Didi",
  message:
    "Happy Birthday Chatuli Didi! 🥳 Hope you take a break from pulling teeth and go on more crazy Ladakh adventures! (Just maybe pack a little less luggage next time? 😂) Love you to the mountains and back! 🏔️🦷💖"
};

// ── DOM REFERENCES ────────────────────────────
const $modal = document.getElementById("modal-overlay");
const $modalTitle = document.getElementById("modal-title");
const $modalSub = document.getElementById("modal-subtitle");
const $btnStart = document.getElementById("btn-start");
const $cakeScene = document.getElementById("cake-scene");
const $blowInstruct = document.getElementById("blow-instruction");
const $volumeBar = document.getElementById("volume-bar");
const $candlesRow = document.getElementById("candles-row");
const $particles = document.getElementById("particles");

// ── STATE ─────────────────────────────────────
let audioCtx = null;
let analyser = null;
let micStream = null;
let dataArray = null;
let animFrameId = null;
let candlesBlown = false;

// Blow detection: volume must exceed threshold for N consecutive frames
const VOLUME_THRESHOLD = 55;   // 0-255 scale
const SUSTAIN_FRAMES = 12;   // ~200ms at 60fps
let sustainCounter = 0;

// ── 2. INIT — Apply config to DOM ─────────────
(function init() {
  if ($modalTitle) $modalTitle.textContent = `Happy Birthday ${config.name}! 🎂`;

  if ($particles) spawnParticles();
})();

// ── 3. START BUTTON — request mic ─────────────
$btnStart.addEventListener("click", async () => {
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setupAudio(micStream);
    hideModal();
    showCakeScene();
  } catch (err) {
    alert(
      "Microphone access is needed to blow out the candles! 🎤\nPlease allow mic access and try again."
    );
    console.error("Mic denied:", err);
  }
});

// ── 4. WEB AUDIO ANALYSER ─────────────────────
function setupAudio(stream) {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const src = audioCtx.createMediaStreamSource(stream);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.3;
  src.connect(analyser);
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  pollVolume();
}

function pollVolume() {
  if (candlesBlown) return;
  analyser.getByteFrequencyData(dataArray);

  // Compute RMS-ish average
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
  const avg = sum / dataArray.length;

  // Update volume bar (cap at 100%)
  const pct = Math.min(100, (avg / 128) * 100);
  $volumeBar.style.width = pct + "%";

  // Blow detection
  if (avg > VOLUME_THRESHOLD) {
    sustainCounter++;
    if (sustainCounter >= SUSTAIN_FRAMES) {
      blowOutCandles();
      return;
    }
  } else {
    sustainCounter = Math.max(0, sustainCounter - 2); // decay
  }

  animFrameId = requestAnimationFrame(pollVolume);
}

// ── 5. BLOW-OUT LOGIC ─────────────────────────
function blowOutCandles() {
  candlesBlown = true;
  cancelAnimationFrame(animFrameId);

  // Stop mic
  if (micStream) micStream.getTracks().forEach((t) => t.stop());
  if (audioCtx) audioCtx.close();

  // Flip flames to "unlit" + activate smoke
  const flames = $candlesRow.querySelectorAll(".flame");
  const smokes = $candlesRow.querySelectorAll(".smoke-trail");

  flames.forEach((f) => {
    f.classList.remove("lit");
    f.classList.add("unlit");
  });
  smokes.forEach((s) => s.classList.add("active"));

  // Update instruction
  $blowInstruct.textContent = "🎉 You did it! The candles are out!";
  $blowInstruct.style.animation = "none";

  // Hide volume meter
  document.querySelector(".volume-meter").style.opacity = "0";

  // 🎊 Confetti
  fireConfetti();

  // Trigger feeding animation
  setTimeout(() => {
    const cakeWrapper = document.querySelector(".cake-wrapper");
    if (cakeWrapper) {
      cakeWrapper.style.transition = "opacity 0.5s";
      cakeWrapper.style.opacity = "0";
    }
    const feedAnim = document.getElementById("feeding-animation");
    if (feedAnim) feedAnim.classList.remove("hidden");
    const slice = document.getElementById("cake-slice-emoji");
    if (slice) slice.classList.add("feed");
    const text = document.getElementById("feed-text");
    if (text) text.classList.add("feed");
  }, 1000);
}

// ── 6. CONFETTI ───────────────────────────────
function fireConfetti() {
  const duration = 3000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.65 },
      colors: ["#f9a8d4", "#c4b5fd", "#93c5fd", "#6ee7b7", "#fde047"],
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.65 },
      colors: ["#f9a8d4", "#c4b5fd", "#93c5fd", "#6ee7b7", "#fde047"],
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  // Big burst
  setTimeout(() => {
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.55 },
      colors: ["#f9a8d4", "#c4b5fd", "#93c5fd", "#6ee7b7", "#fde047", "#fdba74"],
    });
  }, 200);
}

// ── 9. FLOATING PARTICLES ─────────────────────
function spawnParticles() {
  const colors = ["#f9a8d4", "#c4b5fd", "#93c5fd", "#6ee7b7", "#fde047", "#fdba74"];

  for (let i = 0; i < 30; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const size = Math.random() * 8 + 4;
    p.style.width = size + "px";
    p.style.height = size + "px";
    p.style.left = Math.random() * 100 + "%";
    p.style.bottom = -(Math.random() * 20) + "%";
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDuration = (Math.random() * 10 + 8) + "s";
    p.style.animationDelay = (Math.random() * 12) + "s";
    $particles.appendChild(p);
  }
}

// ── HELPERS ───────────────────────────────────
function hideModal() {
  $modal.style.animation = "fadeOut .4s ease forwards";
  setTimeout(() => $modal.classList.add("hidden"), 420);
}

function showCakeScene() {
  setTimeout(() => $cakeScene.classList.remove("hidden"), 450);
}
