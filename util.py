import numpy as np
import cv2

# ─── HSV ranges tuned for real-world Rubik's cube stickers ───────────────────
# Format: (lower_hsv, upper_hsv)
# Red wraps around 0/180 in HSV, so it needs two ranges

COLOR_RANGES = {
    'W': [
        (np.array([0,   0,  160], dtype=np.uint8),
         np.array([180, 55, 255], dtype=np.uint8)),
    ],
    'Y': [
        (np.array([22,  100, 100], dtype=np.uint8),
         np.array([35,  255, 255], dtype=np.uint8)),
    ],
    'O': [
        (np.array([8,   150, 100], dtype=np.uint8),
         np.array([21,  255, 255], dtype=np.uint8)),
    ],
    'R': [
        (np.array([0,   150,  80], dtype=np.uint8),   # lower red
         np.array([7,   255, 255], dtype=np.uint8)),
        (np.array([170, 150,  80], dtype=np.uint8),   # upper red
         np.array([180, 255, 255], dtype=np.uint8)),
    ],
    'G': [
        (np.array([45,  80,  60], dtype=np.uint8),
         np.array([90, 255, 255], dtype=np.uint8)),
    ],
    'B': [
        (np.array([95,  80,  60], dtype=np.uint8),
         np.array([135, 255, 255], dtype=np.uint8)),
    ],
}

def preprocess_patch(patch):
    """
    Reduce glare/reflection before classifying.
    - Convert to LAB and apply CLAHE to L channel (contrast normalization)
    - This helps recover color under bright reflections
    """
    lab = cv2.cvtColor(patch, cv2.COLOR_BGR2LAB)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4, 4))
    lab[:, :, 0] = clahe.apply(lab[:, :, 0])
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)


def classify_color_hsv(bgr_pixel_or_patch):
    """
    Classify a BGR pixel or small patch into one of 6 Rubik's cube colors.
    Uses voting across the patch + range matching with scores.
    """
    # Accept both a single pixel list and a patch array
    if isinstance(bgr_pixel_or_patch, list):
        patch = np.uint8([[bgr_pixel_or_patch]])
    else:
        patch = bgr_pixel_or_patch

    # Preprocess to reduce glare
    patch = preprocess_patch(patch)
    hsv_patch = cv2.cvtColor(patch, cv2.COLOR_BGR2HSV)

    scores = {c: 0 for c in COLOR_RANGES}

    for color, ranges in COLOR_RANGES.items():
        for (lo, hi) in ranges:
            mask = cv2.inRange(hsv_patch, lo, hi)
            scores[color] += int(np.sum(mask) / 255)

    best = max(scores, key=scores.get)

    # If no color scored at all, fall back to nearest-centroid in HSV
    if scores[best] == 0:
        best = _nearest_centroid(hsv_patch)

    return best


def _nearest_centroid(hsv_patch):
    """Fallback: compare mean HSV to known color centroids."""
    centroids = {
        'W': np.array([0,    0,   210]),
        'Y': np.array([28,  200,  200]),
        'O': np.array([14,  210,  190]),
        'R': np.array([3,   210,  180]),
        'G': np.array([65,  180,  150]),
        'B': np.array([110, 180,  150]),
    }
    mean_hsv = hsv_patch.reshape(-1, 3).mean(axis=0)

    # Weight hue differences more for saturated colors
    def dist(c):
        diff = mean_hsv - centroids[c]
        # Circular hue distance
        diff[0] = min(abs(diff[0]), 180 - abs(diff[0]))
        return np.dot(diff, diff)

    return min(centroids, key=dist)


def get_limits(color):
    """Original get_limits kept for backward compatibility."""
    c = np.uint8([[color]])
    hsvC = cv2.cvtColor(c, cv2.COLOR_BGR2HSV)
    hue = int(hsvC[0][0][0])

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


def draw_color_label(frame, color_char, x, y, w, h):
    color_map = {
        'W': (255, 255, 255),
        'Y': (0,   255, 255),
        'R': (0,   0,   255),
        'O': (0,   165, 255),
        'B': (255, 0,   0  ),
        'G': (0,   200, 0  ),
        '?': (100, 100, 100),
    }
    bgr = color_map.get(color_char, (100, 100, 100))
    cv2.rectangle(frame, (x, y), (x + w, y + h), bgr, -1)
    cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 0), 2)
    cv2.putText(frame, color_char, (x + w//4, y + 3*h//4),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)