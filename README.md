# Dynamic Rubik's Cube Solver

A real-time Rubik's cube scanner and solver built with Python and OpenCV. It uses your webcam to detect cube colors face by face, stores the cube state, and can generate a solution using the Kociemba algorithm.

---

## Features

- 🎥 Real-time webcam color detection
- 🟥🟧🟨🟩🟦⬜ Classifies all 6 Rubik's cube colors (R, O, Y, G, B, W)
- 🧩 Scans all 6 faces interactively via live grid overlay
- 📋 Stores cube state in standard Kociemba notation
- 🔍 Yellow object detector (original base feature)

---

## Project Structure

```
RubiksCube/
├── main.py       # Entry point — color detector & cube scanner modes
├── scanner.py    # Webcam scanning logic, grid overlay, face capture
└── util.py       # Color classification, HSV limits, drawing helpers
```

---

## Requirements

- Python 3.x
- OpenCV
- Pillow
- NumPy

Install dependencies:
```bash
pip install opencv-python pillow numpy
```

Optional — for solving the cube:
```bash
pip install kociemba
```

---

## Usage

```bash
python main.py
```

You'll be prompted to choose a mode:

```
1 - Yellow object detector
2 - Scan Rubik's cube
```

### Scanning a Cube

1. Choose mode `2`
2. Hold each face of the cube up to the camera
3. Align the stickers with the 3×3 grid overlay
4. Press **SPACE** to capture each face
5. Repeat for all 6 faces in this order:

| Step | Face Key | Description              |
|------|----------|--------------------------|
| 1    | U        | Top face (white center)  |
| 2    | R        | Right face               |
| 3    | F        | Front face               |
| 4    | D        | Bottom face              |
| 5    | L        | Left face                |
| 6    | B        | Back face                |

Press **Q** at any time to quit.

---

## Cube State Format

The scanned cube is stored as a Python dict:

```python
cube_state = {
  'U': ['W','W','W', 'W','W','W', 'W','W','W'],  # Top
  'R': ['R','R','R', 'R','R','R', 'R','R','R'],  # Right
  'F': ['G','G','G', 'G','G','G', 'G','G','G'],  # Front
  'D': ['Y','Y','Y', 'Y','Y','Y', 'Y','Y','Y'],  # Bottom
  'L': ['O','O','O', 'O','O','O', 'O','O','O'],  # Left
  'B': ['B','B','B', 'B','B','B', 'B','B','B'],  # Back
}
```

Each face is a list of **9 sticker colors**, read **left→right, top→bottom**:

```
[0] [1] [2]
[3] [4] [5]    ← index [4] is always the fixed center sticker
[6] [7] [8]
```

The flat string output follows **Kociemba notation**:
```
UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB
```

Color key: `W` = White · `Y` = Yellow · `R` = Red · `O` = Orange · `B` = Blue · `G` = Green

---

## Controls

| Key     | Action          |
|---------|-----------------|
| `SPACE` | Capture face    |
| `Q`     | Quit            |

---

## Roadmap

- [ ] Auto-detect face capture (no keypress needed)
- [ ] Cube solving via Kociemba algorithm
- [ ] Visual solution display (move-by-move)
- [ ] GUI interface

---

## License

<!-- Add your license here -->