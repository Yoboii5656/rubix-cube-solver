import numpy as np
import cv2

def get_limits(color):
    c = np.uint8([[color]])
    hsvC = cv2.cvtColor(c, cv2.COLOR_BGR2HSV)

    hue = int(hsvC[0][0][0])

    # Handle red hue wrap-around in HSV
    if hue <= 10:
        lowerLimit = np.array([0, 100, 100], dtype=np.uint8)
        upperLimit = np.array([hue + 10, 255, 255], dtype=np.uint8)
    elif hue >= 170:
        lowerLimit = np.array([hue - 10, 100, 100], dtype=np.uint8)
        upperLimit = np.array([180, 255, 255], dtype=np.uint8)
    else:
        lowerLimit = np.array([hue - 10, 100, 100], dtype=np.uint8)
        upperLimit = np.array([hue + 10, 255, 255], dtype=np.uint8)

    return lowerLimit, upperLimit


# Rubik's cube face colors in BGR
CUBE_COLORS_BGR = {
    'W': [255, 255, 255],  # White
    'Y': [0, 255, 255],    # Yellow
    'R': [0, 0, 255],      # Red
    'O': [0, 165, 255],    # Orange
    'B': [255, 0, 0],      # Blue
    'G': [0, 255, 0],      # Green
}

def classify_color_hsv(bgr_pixel):
    """Classify a BGR pixel into one of the 6 Rubik's cube colors."""
    pixel = np.uint8([[bgr_pixel]])
    hsv = cv2.cvtColor(pixel, cv2.COLOR_BGR2HSV)[0][0]
    h, s, v = int(hsv[0]), int(hsv[1]), int(hsv[2])

    if v < 50:
        return '?'
    if s < 50:
        return 'W'  # Low saturation = white/grey

    if (h <= 10) or (h >= 170):
        return 'R'
    elif 11 <= h <= 20:
        return 'O'
    elif 21 <= h <= 35:
        return 'Y'
    elif 36 <= h <= 85:
        return 'G'
    elif 86 <= h <= 130:
        return 'B'
    else:
        return '?'


def draw_color_label(frame, color_char, x, y, w, h):
    """Draw a colored rectangle with label on the frame."""
    color_map = {
        'W': (255, 255, 255),
        'Y': (0, 255, 255),
        'R': (0, 0, 255),
        'O': (0, 165, 255),
        'B': (255, 0, 0),
        'G': (0, 200, 0),
        '?': (100, 100, 100),
    }
    bgr = color_map.get(color_char, (100, 100, 100))
    cv2.rectangle(frame, (x, y), (x + w, y + h), bgr, -1)
    cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 0), 2)
    cv2.putText(frame, color_char, (x + w//4, y + 3*h//4),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)