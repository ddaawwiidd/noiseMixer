# 🎛️ NoiseMixer — Generative Mandala Engine

NoiseMixer is a web-based generative art instrument that creates evolving
**dot-based mandalas** from the centre of the screen outward.  
The UI is minimal, allowing the user to “mix” the
visual growth in real time using a set of intuitive sliders.

You can capture still frames or record live video directly from the canvas.

---

## ✨ Features

- **Generative dot mandala engine**
  - Radial symmetry
  - Organic wobble and noise-driven evolution
  - Slow or fast bloom controlled by Energy slider (supports negative values)

- **HUD-style control panel**
  - Compact, bottom-centered, monochrome design  
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

### **Density**
Controls structural complexity:
- Low → minimal, airy mandalas  
- High → dense, intricate patterns  

### **Energy (supports negative values)**  
Controls bloom speed and time progression:
- **Negative** → extremely slow, meditative growth  
- Zero → slow bloom  
- High → fast expansion and more dynamic oscillation  

### **Chaos**  
Controls wobble, noise amplitude and organic distortion:
- Low → symmetrical, stable rings  
- High → noisy, organic, fluid movement  

### **Contrast**  
Controls dot brightness and dot size:
- Low → soft, subdued  
- High → crisp, bright, bold  

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
