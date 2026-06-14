import time

# ─────────────────────────────────────────────────────────────────────────────
# CUBE REPRESENTATION
# ─────────────────────────────────────────────────────────────────────────────
# State = tuple of 54 ints (0-5), one per sticker.
# Face order: U=0, R=1, F=2, D=3, L=4, B=5
# Each face has 9 stickers, laid out:
#   0 1 2
#   3 4 5
#   6 7 8
# Global index = face*9 + position
# ─────────────────────────────────────────────────────────────────────────────

COLOR_TO_INT = {'W': 0, 'R': 1, 'G': 2, 'Y': 3, 'O': 4, 'B': 5}
FACE_ORDER = ['U', 'R', 'F', 'D', 'L', 'B']
U, R, F, D, L, B = 0, 1, 2, 3, 4, 5


def make_solved_state():
    state = []
    for face in range(6):
        state.extend([face] * 9)
    return tuple(state)

SOLVED_STATE = make_solved_state()


# ─────────────────────────────────────────────────────────────────────────────
# MOVE DEFINITIONS
# ─────────────────────────────────────────────────────────────────────────────
# Each move = list of 4-cycles. Cycle [a,b,c,d] means:
# new[b]=old[a], new[c]=old[b], new[d]=old[c], new[a]=old[d]  (clockwise rotation)
# ─────────────────────────────────────────────────────────────────────────────

def face(f):
    return f * 9

U_MOVE = [
    [face(U)+0, face(U)+2, face(U)+8, face(U)+6],
    [face(U)+1, face(U)+5, face(U)+7, face(U)+3],
    [face(R)+0, face(F)+0, face(L)+0, face(B)+0],
    [face(R)+1, face(F)+1, face(L)+1, face(B)+1],
    [face(R)+2, face(F)+2, face(L)+2, face(B)+2],
]

D_MOVE = [
    [face(R)+6, face(B)+6, face(L)+6, face(F)+6],
    [face(R)+7, face(B)+7, face(L)+7, face(F)+7],
    [face(R)+8, face(B)+8, face(L)+8, face(F)+8],
    [face(D)+0, face(D)+2, face(D)+8, face(D)+6],
    [face(D)+1, face(D)+5, face(D)+7, face(D)+3],
]

R_MOVE = [
    [face(U)+2, face(B)+6, face(D)+2, face(F)+2],
    [face(U)+5, face(B)+3, face(D)+5, face(F)+5],
    [face(U)+8, face(B)+0, face(D)+8, face(F)+8],
    [face(R)+0, face(R)+2, face(R)+8, face(R)+6],
    [face(R)+1, face(R)+5, face(R)+7, face(R)+3],
]

L_MOVE = [
    [face(U)+0, face(F)+0, face(D)+0, face(B)+8],
    [face(U)+3, face(F)+3, face(D)+3, face(B)+5],
    [face(U)+6, face(F)+6, face(D)+6, face(B)+2],
    [face(L)+0, face(L)+2, face(L)+8, face(L)+6],
    [face(L)+1, face(L)+5, face(L)+7, face(L)+3],
]

F_MOVE = [
    [face(U)+6, face(R)+0, face(D)+2, face(L)+8],
    [face(U)+7, face(R)+3, face(D)+1, face(L)+5],
    [face(U)+8, face(R)+6, face(D)+0, face(L)+2],
    [face(F)+0, face(F)+2, face(F)+8, face(F)+6],
    [face(F)+1, face(F)+5, face(F)+7, face(F)+3],
]

B_MOVE = [
    [face(U)+0, face(L)+6, face(D)+8, face(R)+2],
    [face(U)+1, face(L)+3, face(D)+7, face(R)+5],
    [face(U)+2, face(L)+0, face(D)+6, face(R)+8],
    [face(B)+0, face(B)+2, face(B)+8, face(B)+6],
    [face(B)+1, face(B)+5, face(B)+7, face(B)+3],
]

BASE_MOVES = {'U': U_MOVE, 'R': R_MOVE, 'F': F_MOVE, 'D': D_MOVE, 'L': L_MOVE, 'B': B_MOVE}


def apply_cycles(state, cycles):
    s = list(state)
    for a, b, c, d in cycles:
        tmp = s[d]
        s[d] = s[c]
        s[c] = s[b]
        s[b] = s[a]
        s[a] = tmp
    return tuple(s)


def apply_move(state, move_name):
    base = move_name[0]
    suffix = move_name[1:]
    cycles = BASE_MOVES[base]

    if suffix == '':
        return apply_cycles(state, cycles)
    elif suffix == "'":
        s = apply_cycles(state, cycles)
        s = apply_cycles(s, cycles)
        return apply_cycles(s, cycles)
    elif suffix == '2':
        s = apply_cycles(state, cycles)
        return apply_cycles(s, cycles)

    raise ValueError(f"Unknown move: {move_name}")


ALL_MOVES = [
    'U', "U'", 'U2', 'R', "R'", 'R2', 'F', "F'", 'F2',
    'D', "D'", 'D2', 'L', "L'", 'L2', 'B', "B'", 'B2',
]

INVERSE_MOVES = {
    'U': "U'", "U'": 'U', 'U2': 'U2',
    'R': "R'", "R'": 'R', 'R2': 'R2',
    'F': "F'", "F'": 'F', 'F2': 'F2',
    'D': "D'", "D'": 'D', 'D2': 'D2',
    'L': "L'", "L'": 'L', 'L2': 'L2',
    'B': "B'", "B'": 'B', 'B2': 'B2',
}


# ─────────────────────────────────────────────────────────────────────────────
# HEURISTIC
# ─────────────────────────────────────────────────────────────────────────────
# misplaced_stickers / 8
#
# NOTE — admissibility tradeoff:
# Strictly admissible bound would be /20 (one move can displace 20 stickers).
# /8 is INADMISSIBLE (overestimates) but prunes far more aggressively.
# This is "satisficing search" — trades a guaranteed-optimal solution for a
# much faster search that still finds A valid solution.
# ─────────────────────────────────────────────────────────────────────────────

def heuristic(state):
    misplaced = sum(1 for i in range(54) if state[i] != SOLVED_STATE[i])
    return misplaced // 8


# ─────────────────────────────────────────────────────────────────────────────
# IDA* SEARCH
# ─────────────────────────────────────────────────────────────────────────────
# Sentinel return values from search():
#   ("FOUND", f)     — goal reached, f is irrelevant
#   ("TIMEOUT", f)   — time limit hit, abort everything
#   ("PRUNE", f)     — branch exceeded bound; f = smallest f-value that
#                      exceeded the bound (used to set next iteration's bound)
# ─────────────────────────────────────────────────────────────────────────────

MAX_BOUND = 18     # ← absolute ceiling on threshold (God's number is 20)
TIME_LIMIT = 15    # ← seconds before giving up entirely


def search(state, g, bound, path, last_move, start_time, node_count):
    f = g + heuristic(state)

    if f > bound:
        return "PRUNE", f, node_count

    if state == SOLVED_STATE:
        return "FOUND", f, node_count

    # Check the clock every 2000 nodes — calling time.time() every
    # single node is itself a performance cost
    node_count += 1
    if node_count % 2000 == 0 and (time.time() - start_time) > TIME_LIMIT:
        return "TIMEOUT", f, node_count

    min_exceeded = float('inf')

    for move in ALL_MOVES:
        # Prune 1: don't undo the previous move
        if last_move and INVERSE_MOVES.get(last_move) == move:
            continue
        # Prune 2: don't make two moves on the same face in a row
        if last_move and last_move[0] == move[0]:
            continue

        new_state = apply_move(state, move)
        path.append(move)

        status, val, node_count = search(
            new_state, g + 1, bound, path, move, start_time, node_count
        )

        if status == "FOUND":
            return "FOUND", val, node_count
        if status == "TIMEOUT":
            return "TIMEOUT", val, node_count

        # status == "PRUNE" — track the smallest overflow for next iteration
        if val < min_exceeded:
            min_exceeded = val

        path.pop()  # backtrack — remove this move before trying the next

    return "PRUNE", min_exceeded, node_count


def ida_star_solve(start_state):
    """
    Returns (solution_moves, stats_dict) or (None, stats_dict) if not found.
    """
    if start_state == SOLVED_STATE:
        return [], {"iterations": 0, "nodes": 0}

    bound = heuristic(start_state)
    path = []
    start_time = time.time()
    total_nodes = 0
    iterations = 0

    while bound <= MAX_BOUND:
        iterations += 1
        status, result, total_nodes = search(
            start_state, 0, bound, path, None, start_time, total_nodes
        )

        if status == "FOUND":
            return path, {
                "iterations": iterations,
                "nodes": total_nodes,
                "time_sec": round(time.time() - start_time, 2),
            }

        if status == "TIMEOUT":
            return None, {
                "iterations": iterations,
                "nodes": total_nodes,
                "time_sec": round(time.time() - start_time, 2),
                "reason": "timeout",
            }

        # No solution found at this bound — raise threshold and try again
        # `result` here is the smallest f-value that got pruned
        if result == float('inf'):
            break  # genuinely no moves available (shouldn't happen)

        bound = result

    return None, {
        "iterations": iterations,
        "nodes": total_nodes,
        "time_sec": round(time.time() - start_time, 2),
        "reason": "max_bound_exceeded",
    }


# ─────────────────────────────────────────────────────────────────────────────
# CONVERT FRONTEND DICT → INTERNAL TUPLE
# ─────────────────────────────────────────────────────────────────────────────

def dict_to_tuple(cube_state: dict) -> tuple:
    """
    Frontend format: { 'U': ['W','W',...9], 'R': [...], ... }
    Maps colors → face ints using each face's center sticker (index 4).
    """
    color_to_face = {}
    for i, face_key in enumerate(FACE_ORDER):
        center_color = cube_state[face_key][4]
        color_to_face[center_color] = i

    state = []
    for face_key in FACE_ORDER:
        for color_char in cube_state[face_key]:
            face_int = color_to_face.get(color_char)
            if face_int is None:
                raise ValueError(f"Unrecognized color '{color_char}' in face {face_key}")
            state.append(face_int)

    return tuple(state)

def validate_cube_state(state: tuple) -> str | None:
    """
    Returns an error message if the state is invalid, else None.
    A valid cube must have exactly 9 stickers of each of the 6 colors.
    """
    from collections import Counter
    counts = Counter(state)

    for face_int in range(6):
        if counts.get(face_int, 0) != 9:
            color_name = FACE_ORDER[face_int]
            return (f"Invalid scan: color for face '{color_name}' appears "
                    f"{counts.get(face_int, 0)} times (expected 9). "
                    f"This usually means two colors got confused during scanning "
                    f"(e.g. red/orange or yellow/orange). Try rescanning with better lighting.")

    return None

# ─────────────────────────────────────────────────────────────────────────────
# MAIN ENTRY POINT — called by FastAPI
# ─────────────────────────────────────────────────────────────────────────────

def solve_cube(cube_state: dict) -> dict:
    try:
        start = dict_to_tuple(cube_state)

        # ── Validate before searching ────────────────────────────────────────
        error = validate_cube_state(start)
        if error:
            return {"success": False, "error": error}

        solution, stats = ida_star_solve(start)

        if solution is None:
            reason = stats.get("reason", "unknown")
            return {
                "success": False,
                "error": f"No solution found ({reason}). "
                         f"Explored {stats['nodes']} nodes in {stats['time_sec']}s "
                         f"across {stats['iterations']} iterations.",
                "stats": stats,
            }

        return {
            "success": True,
            "solution": solution,
            "move_count": len(solution),
            "stats": stats,   # ← nice to display in UI: "explored X nodes"
        }

    except ValueError as e:
        return {"success": False, "error": str(e)}
    except Exception as e:
        return {"success": False, "error": f"Solver error: {str(e)}"}