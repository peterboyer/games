import { Othello } from "./index";

it("should have a correct default state", () => {
  const othello = Othello();

  expect(othello.getCell([4, 4]).orUndefined()?.player.id).toBe("W");
  expect(othello.getCell([5, 4]).orUndefined()?.player.id).toBe("B");
  expect(othello.getCell([5, 5]).orUndefined()?.player.id).toBe("W");
  expect(othello.getCell([4, 5]).orUndefined()?.player.id).toBe("B");
});

it("should tell us who's turn it is", () => {
  const othello = Othello();

  expect(othello.getCurrentPlayer().orUndefined()?.id).toBe("B");
});

it("should get complete list of next valid coords", () => {
  const othello = Othello();

  const coords = new Set(
    othello
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
  const othello = Othello();

  expect(othello.next([4, 4])).toMatchObject({
    error: { type: "CellOccupied" },
  });
});

it("should correctly advance the current player after a turn", () => {
  const othello = Othello();

  expect(othello.next([1, 1])).toMatchObject({ error: undefined });

  expect(othello.getCell([1, 1]).orUndefined()?.player.id).toBe("B");
  expect(othello.getCurrentPlayer().orUndefined()?.id).toBe("W");
});

it("should convert tokens when sandwiched", () => {
  const othello = Othello();

  othello.next([3, 4]).orThrow();
  expect(othello.getCell([3, 4]).orThrow()?.player.id).toBe("B");
  expect(othello.getCell([4, 4]).orThrow()?.player.id).toBe("B");
  expect(othello.getCell([5, 4]).orThrow()?.player.id).toBe("B");
});
