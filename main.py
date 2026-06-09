import cv2
from PIL import Image
from util import get_limits
from scanner import scan_all_faces, FACE_KEYS


# ─── PART 2: Rubik's cube face scanner ────────────────────────────────────────
def run_cube_scanner():
    cube_state = scan_all_faces()
    if cube_state:
        print_cube_state(cube_state)
    return cube_state


# ─── PART 3: Pretty-print the cube state ──────────────────────────────────────
def print_cube_state(cube_state):
    """
    Prints the cube state in standard Rubik's cube notation.

    State format (kociemba / WCA standard):
    ┌──────────────────────────────────────────────────┐
    │ cube_state = {                                    │
    │   'U': ['W','W','W', 'W','W','W', 'W','W','W'], │  ← Top face
    │   'R': ['R','R','R', 'R','R','R', 'R','R','R'], │  ← Right face
    │   'F': ['G','G','G', 'G','G','G', 'G','G','G'], │  ← Front face
    │   'D': ['Y','Y','Y', 'Y','Y','Y', 'Y','Y','Y'], │  ← Bottom face
    │   'L': ['O','O','O', 'O','O','O', 'O','O','O'], │  ← Left face
    │   'B': ['B','B','B', 'B','B','B', 'B','B','B'], │  ← Back face
    │ }                                                 │
    │                                                   │
    │ Each face is a list of 9 cells, READ LEFT→RIGHT, │
    │ TOP→BOTTOM (row-major), when the face is facing  │
    │ you directly:                                     │
    │                                                   │
    │   [0][1][2]                                       │
    │   [3][4][5]   index 4 is always the center       │
    │   [6][7][8]                                       │
    └──────────────────────────────────────────────────┘
    """
    face_order = ['U', 'R', 'F', 'D', 'L', 'B']
    color_display = {
        'W': '\033[97mW\033[0m',  # White
        'Y': '\033[93mY\033[0m',  # Yellow
        'R': '\033[91mR\033[0m',  # Red
        'O': '\033[33mO\033[0m',  # Orange
        'B': '\033[94mB\033[0m',  # Blue
        'G': '\033[92mG\033[0m',  # Green
        '?': '\033[90m?\033[0m',  # Unknown
    }

    print("\n========== CUBE STATE ==========")
    for face in face_order:
        if face not in cube_state:
            continue
        cells = cube_state[face]
        print(f"\n  Face {face}:")
        for row in range(3):
            row_str = "  "
            for col in range(3):
                c = cells[row * 3 + col]
                row_str += color_display.get(c, c) + " "
            print(row_str)

    # Also print as a single string (kociemba solver input format)
    flat = ""
    for face in face_order:
        if face in cube_state:
            flat += "".join(cube_state[face])
    print(f"\n  Kociemba string: {flat}")
    print("  Format: UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB")
    print("=================================\n")


# ─── Entry point ──────────────────────────────────────────────────────────────
if __name__ == '__main__':
        run_cube_scanner()