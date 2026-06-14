from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import numpy as np
import cv2
from scanner import sample_face_from_image
from solver import solve_cube

app = FastAPI()

# ─── CORS — allows Next.js frontend to call this API ─────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "CubeSolver API running"}

# ─── SCAN FACE ────────────────────────────────────────────────────────────────
@app.post("/scan-face")
async def scan_face(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        return JSONResponse(status_code=400, content={"error": "Could not decode image"})

    colors = sample_face_from_image(frame)
    return {"colors": colors}

# ─── SOLVE ────────────────────────────────────────────────────────────────────
@app.post("/solve")
async def solve(body: dict):
    cube_state = body.get("state")
    if not cube_state:
        return JSONResponse(status_code=400, content={"error": "No cube state provided"})

    # ── TEMPORARY DEBUG ──────────────────────────────────────────────────────
    print("=== RAW CUBE STATE ===")
    for face_key, colors in cube_state.items():
        print(f"  {face_key}: {colors}")
    print("======================")
    # ─────────────────────────────────────────────────────────────────────────

    result = solve_cube(cube_state)
    return result