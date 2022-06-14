# Othello

You will be implementing a game that runs in the terminal. The core structure
of the game will be provided and your task will be to implement the core logic
of the program.

- 8x8 Play Area
- 30 B pieces, 30 W pieces
- B W+ B (black surround any number of white pieces, replace all W with B)
- Diagonals also capture.

W _ _
_ B _
_ _ W     black captured

W _ _ _
_ B _ _
_ _ _ W   no capture

Search capture pairs:

W1 (0,0) -> W2 (0,4) - is in a line, search inbetween spaces for contiguous Bs
