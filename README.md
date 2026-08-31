# 🎲 Dynamic Rubik's Cube Solver

<div align="center">

![Rubik's Cube](https://img.shields.io/badge/Rubik's%20Cube-Solver-FF5722?style=for-the-badge&logo=rubik&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)

**Point. Scan. Solve. Instantly.**

[Live Demo](#-getting-started) • [Features](#-features) • [How It Works](#-how-it-works) • [Tech Stack](#-tech-stack)

</div>

---

## 📖 The Story

Remember that feeling? You're at a party, someone pulls out a Rubik's cube, and suddenly you're back to being 12 years old — hopelessly turning it, hoping for a miracle. The red side looks good... until you realize you've destroyed the yellow one. Again.

**What if your phone could just... *see* the cube and tell you exactly what to do?**

That's the moment this project was born. Not as a replacement for the satisfaction of solving it yourself, but as a bridge — a way to understand the mechanics, learn the patterns, and maybe, just *maybe*, finally beat your friend who can solve it in under a minute.

This isn't just another cube solver. It's your **AI-powered Rubik's coach** that:
- 🎥 **Watches** your cube through your webcam in real-time
- 🧠 **Understands** all 43 quintillion possible positions
- ⚡ **Solves** it in under 20 moves using the legendary Kociemba algorithm
- 🎨 **Teaches** you with a beautiful 3D visualization of every turn

No apps to download. No accounts to create. Just you, your cube, and pure algorithmic magic.

---

## ✨ Features

### 🎯 **Real-Time Webcam Detection**
Point your camera at each face of the cube. Our computer vision engine detects all 54 stickers with precision, even handling glare and varying lighting conditions.

### 🔮 **Instant AI Solution**
The Kociemba algorithm computes the optimal solution path — typically 15-20 moves — in milliseconds. No brute force. Just pure mathematical elegance.

### 🎬 **Interactive 3D Playback**
Watch your solution come to life in a stunning 3D cube visualization. Pause, rewind, or jump to any step. It's like having a virtual coach guiding you.

### 🎨 **Beautiful Modern UI**
Built with Next.js and Three.js, featuring smooth animations, floating particles, and a design that feels as satisfying as the final click when all sides align.

### 🚀 **Lightning Fast**
Frontend powered by Next.js 16 with Turbopack. Backend running FastAPI. Response times measured in milliseconds, not seconds.

---

## 🎬 How It Works

### **Step 1: Scan Your Cube**
Hold each face up to your webcam. The grid overlay helps you align it perfectly. Press Space to capture each face in this order:

| Face | Description | Color (Center) |
|------|-------------|----------------|
| **U** | Top face | White |
| **R** | Right face | Red/Orange |
| **F** | Front face | Green |
| **D** | Bottom face | Yellow |
| **L** | Left face | Orange/Red |
| **B** | Back face | Blue |

### **Step 2: The Magic Happens**
Behind the scenes:
1. **OpenCV** processes each frame using HSV color space analysis
2. **Color classification** identifies each of the 54 stickers (6 colors × 9 stickers per face)
3. Cube state is converted to **Kociemba notation** — a standardized format
4. The **Kociemba algorithm** uses group theory to find the optimal solution path
5. Solution is sent back as a sequence of moves (e.g., `R U R' U' R' F R2 U'`)

### **Step 3: Watch & Learn**
The 3D cube animates each move step-by-step. Follow along with your physical cube, or just admire the mesmerizing rotations.

---

## 🛠️ Tech Stack

### **Frontend** 
```
Next.js 16      → React framework with Turbopack for blazing-fast dev experience
React 19        → Latest React with concurrent features
Three.js        → 3D graphics engine for cube visualization
React Three Fiber → React renderer for Three.js
Framer Motion   → Smooth animations and transitions
Zustand         → Lightweight state management
Tailwind CSS    → Utility-first styling
```

### **Backend**
```
Python 3.12     → Modern Python with type hints
FastAPI         → High-performance async web framework
Uvicorn         → Lightning-fast ASGI server
OpenCV          → Computer vision and image processing
NumPy           → Numerical computing for color analysis
Kociemba        → Optimal Rubik's Cube solving algorithm
```

### **Architecture**
```
┌─────────────────────┐
│   Next.js Frontend  │ ←── User interacts here
│   (localhost:3000)  │
└──────────┬──────────┘
           │ HTTP/REST
           ↓
┌─────────────────────┐
│  FastAPI Backend    │ ←── Computer vision & solving
│   (localhost:8000)  │
└─────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.8+
- A webcam (built-in or external)
- A Rubik's Cube (obviously! 😄)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/Dynamic-Rubiks-Cube-Solver.git
cd Dynamic-Rubiks-Cube-Solver
```

**2. Set up the Backend**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**3. Set up the Frontend** (in a new terminal)
```bash
cd frontend
npm install
npm run dev
```

**4. Open your browser**
Navigate to **http://localhost:3000** and start solving! 🎉

---

## 🎮 Usage

### Quick Start
1. Visit **http://localhost:3000**
2. Click **"Launch Scanner"**
3. Allow webcam access when prompted
4. Scan all 6 faces of your cube following the on-screen instructions
5. Hit **"Solve"** and watch the magic happen!

### Tips for Best Results
- ✅ Ensure good lighting (avoid harsh shadows)
- ✅ Hold the cube steady when capturing each face
- ✅ The center sticker determines the face color
- ✅ If detection fails, try adjusting the angle or lighting

---

## 📐 The Algorithm Behind the Magic

### Kociemba's Two-Phase Algorithm

The solver uses **Herbert Kociemba's two-phase algorithm**, which is the industry standard for optimal cube solving:

**Phase 1: Cube → "Good Group"**
- Positions edge and corner orientations
- Places four specific edges (UD-slice)
- Reduces 43 quintillion positions to ~20 billion

**Phase 2: "Good Group" → Solved**
- Uses only 180° turns and specific moves
- Guarantees optimal or near-optimal solution
- Typically finds solutions in 15-20 moves

This is the same algorithm used in competitions and professional cube-solving robots!

---

## 🎨 Project Structure

```
Dynamic-Rubiks-Cube-Solver/
├── frontend/
│   ├── app/
│   │   ├── page.tsx           # Landing page with 3D hero
│   │   └── scan/
│   │       └── page.tsx       # Scanning interface
│   ├── components/
│   │   ├── AnimatedCube3D.tsx # Three.js 3D cube
│   │   ├── CubeScanner.tsx    # Webcam scanner
│   │   ├── CubeSolutionPlayer.tsx # Solution animator
│   │   └── ...
│   └── lib/
│       └── api.ts             # Backend API client
│
├── backend/
│   ├── main.py                # FastAPI app & endpoints
│   ├── scanner.py             # OpenCV color detection
│   ├── solver.py              # Kociemba algorithm interface
│   ├── util.py                # HSV limits & color helpers
│   └── requirements.txt       # Python dependencies
│
└── README.md                  # You are here! 👋
```

---

## 🎯 Roadmap

- [x] Real-time webcam color detection
- [x] Full cube state scanning (6 faces)
- [x] Kociemba algorithm integration
- [x] 3D cube visualization
- [x] Solution playback with controls
- [ ] **Auto-detect face capture** (no keypress needed)
- [ ] **Pattern detection** (recognize common algorithms)
- [ ] **Tutorial mode** (learn beginner methods)
- [ ] **Speed cube timer** (track your personal bests)
- [ ] **Mobile app version** (iOS & Android)
- [ ] **AR overlay** (project solution onto real cube)

---

## 🤝 Contributing

Contributions are welcome! Whether you want to:
- 🐛 Report a bug
- 💡 Suggest a feature
- 🔧 Submit a pull request
- 📖 Improve documentation

Feel free to open an issue or PR. Let's make cube solving accessible to everyone!

---

## 🙏 Acknowledgments

- **Herbert Kociemba** for the groundbreaking two-phase algorithm
- **OpenCV community** for powerful computer vision tools
- **Three.js** for making 3D web graphics accessible
- **Everyone who's ever stared at a scrambled cube** and refused to give up

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🎓 Learn More

Want to understand the mathematics behind cube solving?
- [Rubik's Cube Group Theory](https://en.wikipedia.org/wiki/Rubik%27s_Cube_group)
- [Kociemba's Algorithm Explained](http://kociemba.org/cube.htm)
- [Computer Vision Color Detection](https://docs.opencv.org/4.x/df/d9d/tutorial_py_colorspaces.html)

---

<div align="center">

**Made with ❤️ and countless cube rotations**

If this project helped you finally solve that cube, consider giving it a ⭐!

[⬆ Back to Top](#-dynamic-rubiks-cube-solver)

</div>
