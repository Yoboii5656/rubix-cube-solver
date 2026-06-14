from solver import SOLVED_STATE, apply_move, ALL_MOVES

# ─── TEST 1: Each move applied 4 times (or 2 for "2" moves) returns to start ──
print("Test 1: Move order correctness")
for move in ['U', 'R', 'F', 'D', 'L', 'B']:
    state = SOLVED_STATE
    for _ in range(4):
        state = apply_move(state, move)
    status = "PASS" if state == SOLVED_STATE else "FAIL"
    print(f"  {move} x4 == solved? {status}")

# ─── TEST 2: Move followed by its inverse returns to start ────────────────────
print("\nTest 2: Move + inverse cancels out")
for move in ['U', 'R', 'F', 'D', 'L', 'B']:
    state = apply_move(SOLVED_STATE, move)
    state = apply_move(state, move + "'")
    status = "PASS" if state == SOLVED_STATE else "FAIL"
    print(f"  {move} then {move}' == solved? {status}")

# ─── TEST 3: Solve a 1-move scramble ───────────────────────────────────────────
print("\nTest 3: Solve scrambles of increasing depth")
from solver import ida_star_solve

for depth in [1, 2, 3, 4, 5]:
    state = SOLVED_STATE
    scramble = []
    import random
    for _ in range(depth):
        m = random.choice(ALL_MOVES)
        state = apply_move(state, m)
        scramble.append(m)

    solution, stats = ida_star_solve(state)
    found = "PASS" if solution is not None else "FAIL"
    print(f"  Depth {depth} scramble {scramble} -> "
          f"{found} (solution: {solution}, nodes: {stats['nodes']})")
    
print("\nTest 4: Fixed 3-move scramble")
state = SOLVED_STATE
for m in ['U', 'R', "F'"]:
    state = apply_move(state, m)

solution, stats = ida_star_solve(state)
print(f"  Solution: {solution}")
print(f"  Stats: {stats}")