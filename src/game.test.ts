import { Game } from "./game";

it("should have a correct default state", () => {
  const game = Game();

  expect(game.getCell([4, 4]).orUndefined()?.player.id).toBe("W");
  expect(game.getCell([5, 4]).orUndefined()?.player.id).toBe("B");
  expect(game.getCell([5, 5]).orUndefined()?.player.id).toBe("W");
  expect(game.getCell([4, 5]).orUndefined()?.player.id).toBe("B");
});

it("should tell us whose turn it is", () => {
  const game = Game();

  expect(game.getCurrentPlayer().orUndefined()?.id).toBe("B");
});

it("should get complete list of next valid coords", () => {
  const game = Game();

  const coords = new Set(
    game
      .getNextValidCoords()
      .orThrow()
      .map((coord) => coord.join(","))
  );
  expect(coords.has("3,4")).toBeTruthy();
  expect(coords.has("4,3")).toBeTruthy();
  expect(coords.has("5,6")).toBeTruthy();
  expect(coords.has("6,5")).toBeTruthy();
  expect(coords.size).toBe(4);
});

it("should prevent placing pieces on an invalid cell", () => {
  const game = Game();

  expect(game.next([4, 4])).toMatchObject({
    error: { type: "NotValidCoord" },
  });
});

it("should correctly advance the current player after a turn", () => {
  const game = Game();

  expect(game.next([3, 4])).toMatchObject({ error: undefined });
  expect(game.getCell([3, 4]).orUndefined()?.player.id).toBe("B");
  expect(game.getCurrentPlayer().orUndefined()?.id).toBe("W");
});

it("should convert tokens when sandwiched", () => {
  const game = Game();

  game.next([3, 4]).orThrow();
  expect(game.getCell([3, 4]).orThrow()?.player.id).toBe("B");
  expect(game.getCell([4, 4]).orThrow()?.player.id).toBe("B");
  expect(game.getCell([5, 4]).orThrow()?.player.id).toBe("B");
});
