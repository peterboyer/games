import {Othello} from "./index"

it("should have a correct default state", () => {
  const othello = Othello();

  expect(othello.getCell([ 4, 4 ]).orUndefined()?.player.id).toBe("W")
  expect(othello.getCell([ 5, 4 ]).orUndefined()?.player.id).toBe("B")
  expect(othello.getCell([ 4, 5 ]).orUndefined()?.player.id).toBe("W")
  expect(othello.getCell([ 5, 5 ]).orUndefined()?.player.id).toBe("B")
})

it("should tell us who's turn it is", () => {
  const othello = Othello();

  expect(othello.getCurrentPlayer().orUndefined()?.id).toBe("B")
})

it("should stop placing pieces on a taken cell", () => {
  const othello = Othello();

  expect(othello.next([ 4, 4 ])).toMatchObject({
    error : {type : "CellOccupied"}
  })
})

it("should correctly advance the current player after a turn", () => {
  const othello = Othello();

  expect(othello.next([ 1, 1 ])).toMatchObject({error : undefined})

  expect(othello.getCell([ 1, 1 ]).orUndefined()?.player.id).toBe("B")
  expect(othello.getCurrentPlayer().orUndefined()?.id).toBe("W")
})
