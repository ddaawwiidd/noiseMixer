// =======================================
// NoiseMixer 3D — Point-Cloud Mandala Globe (module version)
// =======================================

import * as THREE from "https://unpkg.com/three@0.162.0/build/three.module.js";

// ---- DOM & HUD ----

const canvas = document.getElementById("noiseCanvas");

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
  energy: parseInt(sliders.energy.value, 10), // -100..100
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

// Map energy [-100, 100] -> [0, 1]
function getEnergyNorm() {
  return (state.energy + 100) / 200;
}

// ---- Palette ----

let paletteName = "mono";

const palettes = {
  mono: 0xe5e7eb,
  warm: 0xfbbf24,
  neon: 0x22d3ee,
  magenta: 0xf472b6,
};

// ---- Three.js setup ----

let renderer, scene, camera, globeGroup;
let particleGeometry, particleMaterial, particlePoints;
let particleMeta = { rings: 0, perRing: 0, total: 0 };

let width = window.innerWidth;
let height = window.innerHeight;

let time = 0;
let masterSeed = Math.random() * 99999;

// stable pseudo-random
function seededNoise(x) {
  const n = Math.sin(x * 12.9898 + masterSeed) * 43758.5453;
  return n % 1;
}

function initThree() {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(width, height, true);
  renderer.setClearColor(0x000000, 1);

  scene = new THREE.Scene();

  const fov = 45;
  const aspect = width / height;
  const near = 0.1;
  const far = 100;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 0, 6);
  camera.lookAt(0, 0, 0);

  globeGroup = new THREE.Group();
  scene.add(globeGroup);

  const cfg = computeParticleConfig();
  buildParticleSystem(cfg);
}

function computeParticleConfig() {
  const densityFactor = state.density / 100;
  const rings = Math.round(lerp(12, 64, densityFactor));
  const perRing = Math.round(lerp(80, 220, densityFactor));
  const total = rings * perRing;
  return { rings, perRing, total };
}

function buildParticleSystem(config) {
  if (particlePoints) {
    globeGroup.remove(particlePoints);
    particleGeometry.dispose();
    particleMaterial.dispose();
  }

  const positions = new Float32Array(config.total * 3);

  particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  const contrastNorm = state.contrast / 100;
  const size = lerp(0.025, 0.08, contrastNorm);

  particleMaterial = new THREE.PointsMaterial({
    size,
    sizeAttenuation: true,
    transparent: true,
    opacity: lerp(0.45, 1, contrastNorm),
    color: palettes[paletteName] || palettes.mono,
    depthWrite: false,
  });

  particlePoints = new THREE.Points(particleGeometry, particleMaterial);
  globeGroup.add(particlePoints);

  particleMeta = { ...config };

  // Initialize positions so you see something immediately
  updateParticles(0);
}

// ---- Resize ----

function handleResize() {
  width = window.innerWidth;
  height = window.innerHeight;

  if (!renderer || !camera) return;

  renderer.setSize(width, height, true);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", handleResize);

// ---- Particle update ----

function updateParticles(dt) {
  if (!particleGeometry) return;

  const cfg = computeParticleConfig();
  if (cfg.rings !== particleMeta.rings || cfg.perRing !== particleMeta.perRing) {
    buildParticleSystem(cfg);
  }

  const positions = particleGeometry.attributes.position.array;
  const { rings, perRing } = particleMeta;

  const chaosFactor = state.chaos / 100;
  const energyNorm = getEnergyNorm();
  const sphereRadius = 2.2;

  let i = 0;

  for (let ring = 0; ring < rings; ring++) {
    const ringNorm = (ring + 0.5) / rings; // 0..1
    let phi = ringNorm * Math.PI; // polar

    const equatorProximity = 1 - Math.abs(ringNorm - 0.5) * 2;
    const ringChaos = chaosFactor * lerp(0.3, 1.1, equatorProximity);

    for (let j = 0; j < perRing; j++) {
      const u = j / perRing;
      let theta = u * Math.PI * 2;

      const baseIndex = ring * perRing + j;

      const nPhase =
        time * 0.8 +
        ring * 0.7 +
        u * 14.0 +
        seededNoise(baseIndex * 3.17) * Math.PI * 2;

      const lobes = Math.round(lerp(4, 16, state.density / 100));
      const lobeWave = Math.cos(theta * lobes + time * 0.6);

      const angleOffset = ringChaos * 0.12 * Math.sin(nPhase);
      theta += angleOffset;

      const phiOffset =
        ringChaos * 0.18 * lobeWave * Math.sin(time * 0.4 + ring * 0.3);
      const phiLocal = phi + phiOffset;

      const radiusBreath =
        0.12 *
        Math.sin(time * lerp(0.3, 1.2, energyNorm) + ring * 0.4 + u * 5.0);
      const chaosRadial =
        ringChaos * 0.2 * (seededNoise(baseIndex * 1.91) - 0.5);
      const radius =
        sphereRadius *
        (1 + radiusBreath * (0.5 + energyNorm) + chaosRadial);

      const sinPhi = Math.sin(phiLocal);
      const x = radius * sinPhi * Math.cos(theta);
      const y = radius * Math.cos(phiLocal);
      const z = radius * sinPhi * Math.sin(theta);

      positions[i++] = x;
      positions[i++] = y;
      positions[i++] = z;
    }
  }

  particleGeometry.attributes.position.needsUpdate = true;
}

// ---- Animation loop ----

let isPlaying = true;
let lastTime = performance.now();
let animationId = null;

function animate(now) {
  if (!isPlaying || !renderer) return;

  const dt = (now - lastTime) / 1000;
  lastTime = now;

  const energyNorm = getEnergyNorm();
  const timeStep = lerp(0.2, 3.0, energyNorm) * dt;
  time += timeStep;

  updateParticles(dt);

  const rotationSpeed = (state.energy / 100) * 0.6;
  globeGroup.rotation.y += rotationSpeed * dt;
  globeGroup.rotation.x += rotationSpeed * 0.15 * dt;

  renderer.render(scene, camera);

  animationId = requestAnimationFrame(animate);
}

// ---- HUD interactions ----

Object.entries(sliders).forEach(([key, input]) => {
  input.addEventListener("input", () => {
    state[key] = parseInt(input.value, 10);
    updateSliderLabels();
  });
});

// Palette
document.querySelectorAll(".palette-swatch").forEach((swatch) => {
  swatch.addEventListener("click", () => {
    paletteName = swatch.dataset.palette || "mono";

    document.querySelectorAll(".palette-swatch").forEach((s) =>
      s.classList.toggle("active", s === swatch)
    );

    if (particleMaterial) {
      particleMaterial.color.setHex(palettes[paletteName] || palettes.mono);
    }
  });
});

// Play / pause
const togglePlayBtn = document.getElementById("togglePlay");
togglePlayBtn.addEventListener("click", () => {
  isPlaying = !isPlaying;
  togglePlayBtn.textContent = isPlaying ? "Pause" : "Play";

  if (isPlaying && !animationId) {
    lastTime = performance.now();
    animationId = requestAnimationFrame(animate);
  } else if (!isPlaying && animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
});

// ---- Capture frame ----

const captureBtn = document.getElementById("captureFrame");
captureBtn.addEventListener("click", () => {
  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      a.download = `NoiseMixer_Globe_${timestamp}.png`;
      a.click();
      URL.revokeObjectURL(url);
    },
    "image/png",
    0.95
  );
});

// ---- Video recording (WebM) ----

const recordBtn = document.getElementById("recordVideo");
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;

recordBtn.addEventListener("click", () => {
  if (!isRecording) {
    const stream = canvas.captureStream(30);
    recordedChunks = [];

    try {
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
      });
    } catch (e) {
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
      a.download = `NoiseMixer_Globe_${timestamp}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    };

    mediaRecorder.start();
    isRecording = true;
    recordBtn.textContent = "Stop Recording";
  } else {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    isRecording = false;
    recordBtn.textContent = "Start Recording";
  }
});

// ---- Fullscreen ----

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

// ---- Init ----

updateSliderLabels();
initThree();
lastTime = performance.now();
animationId = requestAnimationFrame(animate);
