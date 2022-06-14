import { Game, type Coord } from "./game";
import { createInterface } from "readline";

const read = createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    read.question(prompt, (result) => resolve(result));
  });
}

export async function CLI(options: { print?: (line: string) => void } = {}) {
  const grid = { width: 8, height: 8 };
  const game = Game({ grid });

  const { print = console.log } = options;

  while (true) {
    const valids = game
      .getNextValidCoords()
      .orThrow()
      .map((coord) => coord.join(","));
    for (let y = 0; y <= grid.height; y++) {
      let row: string[] = [];
      for (let x = 0; x <= grid.width; x++) {
        if (x === 0) {
          row.push(y === 0 ? " " : y.toString());
          continue;
        }
        if (y === 0) {
          row.push(x.toString());
          continue;
        }
        const coord: Coord = [x, y];
        const cell = game.getCell(coord).orThrow();
        if (!cell) {
          const isValid = valids.includes(coord.join(","));
          row.push(isValid ? "o" : "·");
          continue;
        }
        row.push(cell.player.id);
      }
      print(row.join(" "));
    }
    const input = await question("Move (x,y): ");
    print(input);
  }
}
