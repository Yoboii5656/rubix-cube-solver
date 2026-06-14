import cv2
import numpy as np
from util import classify_color_hsv

# ─── GRID SETTINGS ────────────────────────────────────────────────────────────
# Must match GRID_SIZE in CubeScanner.tsx (default 180)
GRID_SIZE = 180
CELL_SIZE = GRID_SIZE // 3

def get_grid_origin(frame):
    """Returns top-left corner of the centered 3x3 grid."""
    h, w = frame.shape[:2]
    ox = w // 2 - GRID_SIZE // 2
    oy = h // 2 - GRID_SIZE // 2
    return ox, oy

def sample_face_from_image(frame):
    """
    Samples 9 color patches from the center 3x3 grid of a frame.
    Returns a list of 9 color characters e.g. ['W','R','G',...]
    """
    ox, oy = get_grid_origin(frame)
    face = []

    for row in range(3):
        for col in range(3):
            cx = ox + col * CELL_SIZE + CELL_SIZE // 2
            cy = oy + row * CELL_SIZE + CELL_SIZE // 2

            patch = frame[cy-18:cy+18, cx-18:cx+18]

            if patch.size == 0:
                face.append("?")
            else:
                face.append(classify_color_hsv(patch))

    return face