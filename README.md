# 🎛️ NoiseMixer — Generative Mandala & Particle Globe Visual Engine

NoiseMixer is a web-based generative art instrument that lets you mix algorithmic visuals in real time.
You can switch between:
- 2D Mode → evolving mandala built from noise-driven rings and slices
- 3D Mode → particle globe made from thousands of orbiting dots

Both modes react to your Mixer controls, palettes, and energy dynamics.
NoiseMixer is designed as a tiny VJ tool, creative playground, and a foundation for future algorithmic art experiments.

You can capture still frames or record live video directly from the canvas.

---

## ✨ Features

- **Dual Visual Engines** 
  - **2D Mandala**
    - Built from concentric rings
    - Dot patterns driven by seeded noise
    - Symmetry & slice logic
    - Organic growth controlled by Energy
    - Fade-in/out trails

  - **3D Particle Globe**
    - Hundreds to thousands of orbiting points
    - Spherical noise deformation
    - Energy-driven auto-rotation
    - Contrast slider controls point size
    - Minimalist cosmic aesthetic


- **HUD-style control panel** 
  - Density, Energy, Chaos, Contrast sliders  
  - Palette selector (Mono, Warm, Neon, Magenta)

- **Live video recording**
  - Uses `MediaRecorder` to capture the animation to WebM
  - Ideal for capturing live mixing sessions

- **Still frame capture**
  - One-click PNG export

- **Fullscreen mode**

- **Pure frontend**
  - No dependencies
  - No build system required
  - Works offline on any modern browser

---

## 🎛️ Controls

| Control      | 2D Mode                | 3D Mode                   |
| ------------ | ---------------------- | ------------------------- |
| **Density**  | number of rings / dots | number of rings × points  |
| **Energy**   | growth speed           | auto-rotation speed       |
| **Chaos**    | deformation amplitude  | spherical noise intensity |
| **Contrast** | brightness & dot size  | particle size             |


### **Palette**
Choose between:
- Mono (white/gray)
- Warm (gold)
- Neon (cyan)
- Magenta (pink)

---

## 🎥 Export

### **Record Video**
Click **Start Recording** to capture a live WebM video of the mandala,
including any real-time parameter changes you perform.

Click **Stop Recording** to save the resulting file.

### **Capture Frame**
Click **Capture Frame** to save a PNG snapshot of the current mandala.
