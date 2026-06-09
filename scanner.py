import cv2
import numpy as np
from util import classify_color_hsv, draw_color_label

FACE_NAMES = ['U (Top/Up)', 'R (Right)', 'F (Front)', 'D (Down)', 'L (Left)', 'B (Back)']
FACE_KEYS  = ['U', 'R', 'F', 'D', 'L', 'B']

# Grid: sample 9 cells from a 3x3 area centered in frame
GRID_SIZE   = 180   # total grid width/height in pixels
CELL_SIZE   = GRID_SIZE // 3


def get_grid_origin(frame):
    h, w = frame.shape[:2]
    ox = w // 2 - GRID_SIZE // 2
    oy = h // 2 - GRID_SIZE // 2
    return ox, oy


def sample_face(frame):
    """Sample the 9 cell colors from the 3x3 grid overlay."""
    ox, oy = get_grid_origin(frame)
    face = []
    for row in range(3):
        for col in range(3):
            cx = ox + col * CELL_SIZE + CELL_SIZE // 2
            cy = oy + row * CELL_SIZE + CELL_SIZE // 2
            # Average a small patch for stability
            patch = frame[cy-10:cy+10, cx-10:cx+10]
            avg_color = patch.mean(axis=(0, 1)).astype(int).tolist()
            face.append(classify_color_hsv(avg_color))
    return face  # list of 9 color chars, row-major


def draw_grid_overlay(frame, face_colors=None):
    """Draw the 3x3 scanning grid on the frame."""
    ox, oy = get_grid_origin(frame)
    for row in range(3):
        for col in range(3):
            x = ox + col * CELL_SIZE
            y = oy + row * CELL_SIZE
            if face_colors:
                idx = row * 3 + col
                draw_color_label(frame, face_colors[idx], x, y, CELL_SIZE, CELL_SIZE)
            else:
                cv2.rectangle(frame, (x, y), (x + CELL_SIZE, y + CELL_SIZE), (255, 255, 255), 2)


def scan_all_faces():
    """
    Interactively scan all 6 faces of the Rubik's cube.
    Returns a dict: { 'U': [...9 colors...], 'R': [...], ... }
    """
    cap = cv2.VideoCapture(0)
    cube_state = {}
    face_index = 0

    print("\n=== Rubik's Cube Scanner ===")
    print("Hold each face of the cube in front of the camera.")
    print("Align the 3x3 grid with the cube face.")
    print("Press SPACE to capture, Q to quit.\n")

    while face_index < 6:
        ret, frame = cap.read()
        if not ret:
            break

        face_name = FACE_NAMES[face_index]
        face_key  = FACE_KEYS[face_index]

        # Live preview of detected colors
        preview_colors = sample_face(frame)
        draw_grid_overlay(frame, preview_colors)

        # Instructions overlay
        cv2.putText(frame, f"Scan face {face_index+1}/6: {face_name}",
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        cv2.putText(frame, "SPACE = capture | Q = quit",
                    (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)

        cv2.imshow('Rubiks Cube Scanner', frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord(' '):
            cube_state[face_key] = preview_colors
            print(f"  Captured {face_name}: {preview_colors}")
            face_index += 1
        elif key == ord('q'):
            print("Scan aborted.")
            break

    cap.release()
    cv2.destroyAllWindows()
    return cube_state