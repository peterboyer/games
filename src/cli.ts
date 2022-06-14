import { createInterface } from "readline";
import { Game } from "./game";
import { type Coord, parseCoord } from "./coord";

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
  const game = Game({
    // players: ["B", "W", "X", "Y", "M", "S", "A", "B", "C", "D", "E", "F", "G"],
  });

  const { print = console.log } = options;

  while (true) {
    const valids = game
      .getNextValidCoords()
      .orThrow()
      .map((coord) => coord.join(","));
    for (let y = 0; y <= game.height; y++) {
      let row: string[] = [];
      for (let x = 0; x <= game.width; x++) {
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
    print(`Current Player: ${game.getCurrentPlayer().orThrow().id}`);

    let coord: Coord | undefined = undefined;
    while (!coord) {
      const input = await question("Move (x,y): ");
      const $coord = parseCoord(input);
      if ($coord.error) {
        print("Invalid coordinate. Try again.");
        continue;
      }
      coord = $coord.value;
      const $ = game.next(coord);
      if ($.error) {
        if ($.error.type === "NotValidCoord") {
          print("Invalid move. Try again.");
        } else {
          print(`Something went wrong. ${$.error.type}`);
        }
        coord = undefined;
      }
    }
  }
}
