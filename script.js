// =======================================
// NoiseMixer — 2D Mandala + 3D Globe Switcher (DOM-safe)
// =======================================

import * as THREE from "https://unpkg.com/three@0.162.0/build/three.module.js";

let updateSliderLabels = () => {};
// ---- Global vars that will be filled after DOM is ready ----

let canvas2d, canvas3d;
let sliders = {};
let sliderLabels = {};
let state;

let paletteName = "mono";
const palettesHex = {
  mono: 0xe5e7eb,
  warm: 0xfbbf24,
  neon: 0x22d3ee,
  magenta: 0xf472b6,
};

// sizing
let width = window.innerWidth;
let height = window.innerHeight;

function updateSize() {
  width = window.innerWidth;
  height = window.innerHeight;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function getEnergyNorm() {
  return (state.energy + 100) / 200; // -100..100 -> 0..1
}

// 2D palette helper
function paletteColor2D(alpha) {
  switch (paletteName) {
    case "warm":
      return `rgba(251, 191, 36, ${alpha})`;
    case "neon":
      return `rgba(34, 211, 238, ${alpha})`;
    case "magenta":
      return `rgba(244, 114, 182, ${alpha})`;
    case "mono":
    default:
      return `rgba(229, 231, 235, ${alpha})`;
  }
}

// =======================================
// 2D MANDELA ENGINE
// =======================================

let ctx2d;
let time2D = 0;
let seed2D = Math.random() * 99999;
let growthRadius2D = 0;

function seededNoise2D(x) {
  const n = Math.sin(x * 12.9898 + seed2D) * 43758.5453;
  return n % 1;
}

function init2D() {
  ctx2d = canvas2d.getContext("2d");
  resize2D();
  clear2D(false);
}

function resize2D() {
  if (!ctx2d) return;
  const dpr = window.devicePixelRatio || 1;
  canvas2d.width = width * dpr;
  canvas2d.height = height * dpr;
  ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function clear2D(fade = true) {
  if (!ctx2d) return;
  if (!fade) {
    ctx2d.fillStyle = "#000";
    ctx2d.fillRect(0, 0, width, height);
    return;
  }
  const energyNorm = getEnergyNorm();
  const fadeStrength = lerp(0.02, 0.18, energyNorm);
  ctx2d.fillStyle = `rgba(0,0,0,${fadeStrength})`;
  ctx2d.fillRect(0, 0, width, height);
}

function drawMandala2D(dt) {
  if (!ctx2d) return;

  const cx = width / 2;
  const cy = height / 2;

  const densityFactor = state.density / 100;
  const chaosFactor = state.chaos / 100;
  const contrastFactor = state.contrast / 100;
  const energyNorm = getEnergyNorm();

  const maxRadius = Math.min(width, height) * 0.48;

  const growthSpeed = lerp(5, 80, energyNorm);
  growthRadius2D += growthSpeed * dt;

  if (growthRadius2D > maxRadius + 12) {
    growthRadius2D = 0;
    time2D = 0;
    seed2D = Math.random() * 99999;
    clear2D(false);
  }

  clear2D(true);

  const baseAlpha = lerp(0.2, 1, contrastFactor);
  ctx2d.fillStyle = paletteColor2D(baseAlpha);

  const slices = Math.round(lerp(6, 48, densityFactor));
  const ringSpacing = lerp(32, 12, densityFactor);
  const maxRings = Math.floor(maxRadius / ringSpacing);
  const currentRings = Math.min(
    maxRings,
    Math.floor(growthRadius2D / ringSpacing)
  );

  const dotsPerRing = Math.round(lerp(40, 160, densityFactor));
  const dotRadius = lerp(0.6, 2.2, contrastFactor);

  for (let ring = 1; ring <= currentRings; ring++) {
    const baseRadius = ring * ringSpacing;
    const ringProgress = baseRadius / maxRadius;
    const localChaos = chaosFactor * lerp(0.4, 1.0, ringProgress);

    for (let i = 0; i < dotsPerRing; i++) {
      const t = i / dotsPerRing;
      const angleBase = t * Math.PI * 2;

      let r =
        baseRadius +
        Math.sin(time2D * 0.6 + ring * 0.7 + t * 12.0) * localChaos * 18 +
        (seededNoise2D(i + ring * 16.11) - 0.5) * localChaos * 24;

      if (r < 3) r = 3;
      if (r > maxRadius) r = maxRadius;

      for (let s = 0; s < slices; s++) {
        const sliceAngle = (s / slices) * Math.PI * 2;
        const aBase = angleBase + sliceAngle;
        const ang =
          aBase +
          Math.sin(ring * 0.5 + time2D * 0.5) * localChaos * 0.05;

        const x = cx + r * Math.cos(ang);
        const y = cy + r * Math.sin(ang);

        ctx2d.beginPath();
        ctx2d.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx2d.fill();
      }
    }
  }

  const timeStep2D = lerp(0.4, 3.0, energyNorm);
  time2D += timeStep2D * dt;
}

// =======================================
// 3D GLOBE ENGINE
// =======================================

let renderer, scene, camera, globeGroup;
let particleGeometry, particleMaterial, particlePoints;
let particleMeta = { rings: 0, perRing: 0, total: 0 };

let time3D = 0;
let seed3D = Math.random() * 99999;

function seededNoise3D(x) {
  const n = Math.sin(x * 12.9898 + seed3D) * 43758.5453;
  return n % 1;
}

function init3D() {
  renderer = new THREE.WebGLRenderer({
    canvas: canvas3d,
    antialias: true,
    preserveDrawingBuffer: true,
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

  // SIZE: small → large
  const size = lerp(0.015, 0.12, contrastNorm);

  particleMaterial = new THREE.PointsMaterial({
  size,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0.9, // keep brightness constant
  color: palettesHex[paletteName] || palettesHex.mono,
  depthWrite: false,
  });

  particlePoints = new THREE.Points(particleGeometry, particleMaterial);
  globeGroup.add(particlePoints);

  particleMeta = { ...config };

  updateParticles3D(0);
}

function update3DMaterial() {
  if (!particleMaterial) return;
  const contrastNorm = state.contrast / 100;
  particleMaterial.size = lerp(0.015, 0.12, contrastNorm);
  particleMaterial.needsUpdate = true;
}

function resize3D() {
  if (!renderer || !camera) return;
  renderer.setSize(width, height, true);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function updateParticles3D(dt) {
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
    const ringNorm = (ring + 0.5) / rings;
    let phi = ringNorm * Math.PI;

    const equatorProximity = 1 - Math.abs(ringNorm - 0.5) * 2;
    const ringChaos = chaosFactor * lerp(0.3, 1.1, equatorProximity);

    for (let j = 0; j < perRing; j++) {
      const u = j / perRing;
      let theta = u * Math.PI * 2;

      const baseIndex = ring * perRing + j;

      const nPhase =
        time3D * 0.8 +
        ring * 0.7 +
        u * 14.0 +
        seededNoise3D(baseIndex * 3.17) * Math.PI * 2;

      const lobes = Math.round(lerp(4, 16, state.density / 100));
      const lobeWave = Math.cos(theta * lobes + time3D * 0.6);

      const angleOffset = ringChaos * 0.12 * Math.sin(nPhase);
      theta += angleOffset;

      const phiOffset =
        ringChaos * 0.18 * lobeWave * Math.sin(time3D * 0.4 + ring * 0.3);
      const phiLocal = phi + phiOffset;

      const radiusBreath =
        0.12 *
        Math.sin(time3D * lerp(0.3, 1.2, energyNorm) + ring * 0.4 + u * 5.0);
      const chaosRadial =
        ringChaos * 0.2 * (seededNoise3D(baseIndex * 1.91) - 0.5);
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

function render3D(dt) {
  const energyNorm = getEnergyNorm();
  const timeStep = lerp(0.2, 3.0, energyNorm) * dt;
  time3D += timeStep;

  updateParticles3D(dt);

  const rotationSpeed = (state.energy / 100) * 0.6;
  globeGroup.rotation.y += rotationSpeed * dt;
  globeGroup.rotation.x += rotationSpeed * 0.15 * dt;

  renderer.render(scene, camera);
}

// =======================================
// VIEW SWITCHING + LOOP + HUD
// =======================================

let activeView = "2d";
let isPlaying = true;
let lastTime = performance.now();
let animationId = null;

function getActiveCanvas() {
  return activeView === "3d" ? canvas3d : canvas2d;
}

// main loop
function loop(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  if (isPlaying) {
    if (activeView === "2d") {
      drawMandala2D(dt);
    } else {
      render3D(dt);
    }
  }

  animationId = requestAnimationFrame(loop);
}

// =======================================
// INIT AFTER DOM IS READY
// =======================================

window.addEventListener("load", () => {
  // Grab DOM elements safely
  canvas2d = document.getElementById("canvas2d");
  canvas3d = document.getElementById("canvas3d");

  if (!canvas2d || !canvas3d) {
    console.error("Canvas elements with ids canvas2d / canvas3d not found.");
    return;
  }

  sliders = {
    density: document.getElementById("density"),
    energy: document.getElementById("energy"),
    chaos: document.getElementById("chaos"),
    contrast: document.getElementById("contrast"),
  };
  sliderLabels = {
    density: document.getElementById("densityValue"),
    energy: document.getElementById("energyValue"),
    chaos: document.getElementById("chaosValue"),
    contrast: document.getElementById("contrastValue"),
  };

  state = {
    density: parseInt(sliders.density.value, 10),
    energy: parseInt(sliders.energy.value, 10),
    chaos: parseInt(sliders.chaos.value, 10),
    contrast: parseInt(sliders.contrast.value, 10),
  };

  function updateSliderLabelsLocal() {
    sliderLabels.density.textContent = state.density;
    sliderLabels.energy.textContent = state.energy;
    sliderLabels.chaos.textContent = state.chaos;
    sliderLabels.contrast.textContent = state.contrast;
  }

  // override global function pointer with closure that uses current state
  updateSliderLabels = updateSliderLabelsLocal;
  updateSliderLabels();

  // Slider listeners
  Object.entries(sliders).forEach(([key, input]) => {
    input.addEventListener("input", () => {
      state[key] = parseInt(input.value, 10);
      updateSliderLabels();

      if (key === "contrast") {
      update3DMaterial();
      }
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
        particleMaterial.color.setHex(
          palettesHex[paletteName] || palettesHex.mono
        );
      }
    });
  });

  // View buttons
  const viewButtons = document.querySelectorAll(".view-btn");
  function setView(view) {
    activeView = view === "3d" ? "3d" : "2d";
    viewButtons.forEach((btn) =>
      btn.classList.toggle("active", btn.dataset.view === activeView)
    );
    canvas2d.classList.toggle("hidden", activeView !== "2d");
    canvas3d.classList.toggle("hidden", activeView !== "3d");
  }
  viewButtons.forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.view));
  });

  // Play / pause
  const togglePlayBtn = document.getElementById("togglePlay");
  togglePlayBtn.addEventListener("click", () => {
    isPlaying = !isPlaying;
    togglePlayBtn.textContent = isPlaying ? "Pause" : "Play";
  });

  // Capture frame
  const captureBtn = document.getElementById("captureFrame");
  captureBtn.addEventListener("click", () => {
    const c = getActiveCanvas();
    c.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        a.download = `NoiseMixer_${activeView}_${timestamp}.png`;
        a.click();
        URL.revokeObjectURL(url);
      },
      "image/png",
      0.95
    );
  });

  // Video recording
  const recordBtn = document.getElementById("recordVideo");
  let mediaRecorder = null;
  let recordedChunks = [];
  let isRecording = false;

  recordBtn.addEventListener("click", () => {
    if (!isRecording) {
      const c = getActiveCanvas();
      const stream = c.captureStream(30);
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
        a.download = `NoiseMixer_${activeView}_${timestamp}.webm`;
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

  // Fullscreen
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

  // Resize
  window.addEventListener("resize", () => {
    updateSize();
    resize2D();
    resize3D();
  });

  // Init everything
  updateSize();
  init2D();
  init3D();
  setView("2d");

  lastTime = performance.now();
  animationId = requestAnimationFrame(loop);
});




