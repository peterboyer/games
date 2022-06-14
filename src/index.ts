import Result from "esresult";

interface Player {
  id: string;
}

interface Cell {
  player: Player;
}

interface Turn {
  player: Player;
  coord: Coord;
}

export interface Othello {
  getCell(coord: Coord): Result<Cell|undefined, "CoordOutOfRange">;
  getCurrentPlayer(): Result<Player, "GameFinished">;
  next(coord: Coord):
      Result<void, "CellGetError"|"CellOccupied"|"PlayerError"|"CellSetError">;
}

export type Grid = Map<string, Cell>;
export type Coord = [ x: number, y: number ];

export function Othello(
    options: {grid?: {width: number, height: number}, players?: string[]} = {}):
    Othello {
  const grid: Grid = new Map();
  const gridWidth = options.grid?.width ?? 8;
  const gridHeight = options.grid?.height ?? 8;

  const players = new Map<string, Player>();
  const playerIds = options.players ?? [ "B", "W" ];
  if (!(playerIds.length >= 2)) {
    // TODO: use esresult instead
    throw new TypeError("NotEnoughPlayers");
  }
  for (const playerId of playerIds) {
    players.set(playerId, {id : playerId});
  }

  const isCoordInGrid = (coord: Coord):
      boolean => {
        const [x, y] = coord;
        return (x >= 1 && x <= gridWidth && y >= 1 && y <= gridHeight)
      }

  const getPlayer = (playerId: string):
      Result<Player, "NotFound"> => {
        const player = players.get(playerId);
        if (!player) {
          return Result.error("NotFound");
        }
        return Result(player);
      }

  const setCell = (coord: Coord, player: Player):
      Result<void, "CoordOutOfRange"|"PlayerNotFound"> => {
        if (!isCoordInGrid(coord)) {
          return Result.error("CoordOutOfRange");
        }
        const key = coord.join(",");
        grid.set(key, {player});
        return Result(undefined);
      }

  const getCell: Othello["getCell"] =
      (coord) => {
        const [x, y] = coord;
        if (!(x >= 1 && x <= 8 && y >= 1 && y <= 8)) {
          return Result.error("CoordOutOfRange");
        }
        const key = coord.join(",");
        const cell = grid.get(key);
        return Result(cell)
      }

  // setup the board to defaults
  // TODO: calculate the board's center using the grid width and height
  {
    const white = getPlayer("W").orThrow();
    const black = getPlayer("B").orThrow();

    setCell([ 4, 4 ], white)
    setCell([ 5, 4 ], black)
    setCell([ 4, 5 ], white)
    setCell([ 5, 5 ], black)
  }

  const turns: Turn[] = [];

  const getCurrentPlayer: Othello["getCurrentPlayer"] =
      () => {
        const _players = Array.from(players.values());
        const lastTurn = turns.length ? turns[turns.length - 1] : undefined;
        const firstPlayer = _players[0];
        if (!firstPlayer) {
          throw new TypeError("FirstPlayerMustBeDefined")
        }
        let nextPlayer = firstPlayer;
        if (lastTurn) {
          const playerIndex = _players.indexOf(lastTurn.player);
          if (playerIndex === -1) {
            throw new TypeError("PlayerMustBeFound");
          }
          const nextPlayerIndex = playerIndex + 1;
          const _nextPlayer = nextPlayerIndex > _players.length - 1
                                  ? _players[0]
                                  : _players[nextPlayerIndex];
          if (!_nextPlayer) {
            throw new TypeError("PlayerMustBeDefined");
          }
          nextPlayer = _nextPlayer;
        }
        return Result(nextPlayer);
      }

  const next: Othello["next"] =
      (coord) => {
        const $cell = getCell(coord);
        if ($cell.error) {
          return Result.error("CellGetError", {cause : $cell})
        }
        const [cell] = $cell;
        if (cell) {
          return Result.error("CellOccupied");
        }
        const $player = getCurrentPlayer();
        if ($player.error) {
          return Result.error("PlayerError", {cause : $player})
        }
        const [player] = $player;
        {
          const $ = setCell(coord, player)
          if ($.error) {
            return Result.error("CellSetError", {cause : $})
          }
        }
        turns.push({
          player,
          coord,
        })
        return Result(undefined);
      }

  return {
    getCell, getCurrentPlayer, next
  }
}
