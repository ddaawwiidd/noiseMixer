// ==== Canvas setup ====

const canvas = document.getElementById("noiseCanvas");
const ctx = canvas.getContext("2d", { alpha: false });

let width = window.innerWidth;
let height = window.innerHeight;
let animationId = null;
let isPlaying = true;

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ==== UI state ====

const sliders = {
  density: document.getElementById("density"),
  energy: document.getElementById("energy"),
  chaos: document.getElementById("chaos"),
  contrast: document.getElementById("contrast"),
};
const sliderLabels = {
  density: document.getElementById("densityValue"),
  energy: document.getElementById("energyValue"),
  chaos: document.getElementById("chaosValue"),
  contrast: document.getElementById("contrastValue"),
};

const state = {
  density: parseInt(sliders.density.value, 10),
  energy: parseInt(sliders.energy.value, 10), // -100 .. 100
  chaos: parseInt(sliders.chaos.value, 10),
  contrast: parseInt(sliders.contrast.value, 10),
};

function updateSliderLabels() {
  sliderLabels.density.textContent = state.density;
  sliderLabels.energy.textContent = state.energy;
  sliderLabels.chaos.textContent = state.chaos;
  sliderLabels.contrast.textContent = state.contrast;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

// Map energy [-100, 100] -> [0, 1] (very low when negative)
function getEnergyNorm() {
  // -100 => 0, 0 => 0.5, 100 => 1
  return (state.energy + 100) / 200;
}

// ==== Palette state ====

let paletteName = "mono"; // mono | warm | neon | magenta

const palettes = {
  mono: (alpha) => `rgba(229, 231, 235, ${alpha})`,
  warm: (alpha) => `rgba(251, 191, 36, ${alpha})`,
  neon: (alpha) => `rgba(34, 211, 238, ${alpha})`,
  magenta: (alpha) => `rgba(244, 114, 182, ${alpha})`,
};

// ==== Dot Mandala Engine ====

let time = 0;
let masterSeed = Math.random() * 99999;
let growthRadius = 0;

// stable pseudo-random
function seededNoise(x) {
  const n = Math.sin(x * 12.9898 + masterSeed) * 43758.5453;
  return n % 1;
}

function clearCanvas(fade = true) {
  if (!fade) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    return;
  }
  const energyNorm = getEnergyNorm();
  const fadeStrength = lerp(0.02, 0.18, energyNorm);
  ctx.fillStyle = `rgba(0,0,0,${fadeStrength})`;
  ctx.fillRect(0, 0, width, height);
}

function drawDotMandala() {
  const cx = width / 2;
  const cy = height / 2;

  const densityFactor = state.density / 100;
  const chaosFactor = state.chaos / 100;
  const contrastFactor = state.contrast / 100;
  const energyNorm = getEnergyNorm(); // 0..1

  const maxRadius = Math.min(width, height) * 0.48;

  // outward growth (very slow if energy is negative)
  const growthSpeed = lerp(0.05, 3.2, energyNorm);
  growthRadius += growthSpeed;

  if (growthRadius > maxRadius + 12) {
    growthRadius = 0;
    time = 0;
    masterSeed = Math.random() * 99999;
    clearCanvas(false);
  }

  clearCanvas(true);

  // dot color from palette
  const baseAlpha = lerp(0.2, 1, contrastFactor);
  const colorFn = palettes[paletteName] || palettes.mono;
  ctx.fillStyle = colorFn(baseAlpha);

  // symmetry slices
  const slices = Math.round(lerp(6, 48, densityFactor));

  // rings
  const ringSpacing = lerp(32, 12, densityFactor);
  const maxRings = Math.floor(maxRadius / ringSpacing);
  const currentRings = Math.min(
    maxRings,
    Math.floor(growthRadius / ringSpacing)
  );

  // dots per ring
  const dotsPerRing = Math.round(lerp(40, 160, densityFactor));
  const dotRadius = lerp(0.6, 2.2, contrastFactor);

  for (let ring = 1; ring <= currentRings; ring++) {
    const baseRadius = ring * ringSpacing;
    const ringProgress = baseRadius / maxRadius;
    const localChaos = chaosFactor * lerp(0.4, 1.0, ringProgress);

    for (let i = 0; i < dotsPerRing; i++) {
      const t = i / dotsPerRing;
      const angleBase = t * Math.PI * 2;

      // base radius wobble
      let r =
        baseRadius +
        Math.sin(time * 0.01 + ring * 0.7 + t * 12.0) * localChaos * 18 +
        (seededNoise(i + ring * 16.11) - 0.5) * localChaos * 24;

      if (r < 3) r = 3;
      if (r > maxRadius) r = maxRadius;

      for (let s = 0; s < slices; s++) {
        const sliceAngle = (s / slices) * Math.PI * 2;
        const aBase = angleBase + sliceAngle;

        // subtle angular wiggle
        const ang =
          aBase + Math.sin(ring * 0.5 + time * 0.005) * localChaos * 0.05;

        const x = cx + r * Math.cos(ang);
        const y = cy + r * Math.sin(ang);

        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // time progression (also affected by energy)
  const timeStep = lerp(0.002, 0.03, energyNorm);
  time += timeStep;
}

// ==== Main render loop ====

function render() {
  if (!isPlaying) return;
  drawDotMandala();
  animationId = requestAnimationFrame(render);
}

// ==== Slider controls ====

Object.entries(sliders).forEach(([key, input]) => {
  input.addEventListener("input", () => {
    state[key] = parseInt(input.value, 10);
    updateSliderLabels();
  });
});

// ==== Palette controls ====

document.querySelectorAll(".palette-swatch").forEach((swatch) => {
  swatch.addEventListener("click", () => {
    paletteName = swatch.dataset.palette || "mono";
    document.querySelectorAll(".palette-swatch").forEach((s) =>
      s.classList.toggle("active", s === swatch)
    );
  });
});

// ==== Play / pause ====

const togglePlayBtn = document.getElementById("togglePlay");
togglePlayBtn.addEventListener("click", () => {
  isPlaying = !isPlaying;
  togglePlayBtn.textContent = isPlaying ? "Pause" : "Play";

  if (isPlaying && !animationId) {
    render();
  } else if (!isPlaying && animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
});

// ==== Capture frame ====

const captureBtn = document.getElementById("captureFrame");
captureBtn.addEventListener("click", () => {
  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      a.download = `NoiseMixer_Mandala_${timestamp}.png`;
      a.click();
      URL.revokeObjectURL(url);
    },
    "image/png",
    0.95
  );
});

// ==== Video recording ====

const recordBtn = document.getElementById("recordVideo");
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;

recordBtn.addEventListener("click", () => {
  if (!isRecording) {
    // start recording
    const stream = canvas.captureStream(30); // 30 fps
    recordedChunks = [];
    try {
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
      });
    } catch (e) {
      // fallback if browser doesn't like vp9
      mediaRecorder = new MediaRecorder(stream);
    }

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      a.download = `NoiseMixer_Mandala_${timestamp}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    };

    mediaRecorder.start();
    isRecording = true;
    recordBtn.textContent = "Stop Recording";
  } else {
    // stop recording
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    isRecording = false;
    recordBtn.textContent = "Start Recording";
  }
});

// ==== Fullscreen ====

const fullscreenBtn = document.getElementById("toggleFullscreen");
fullscreenBtn.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.error("Fullscreen error:", err);
    });
  } else {
    document.exitFullscreen();
  }
});

// ==== Init ====

updateSliderLabels();
render();
