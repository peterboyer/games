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
  getCell(coord: Coord): Result<Cell | undefined, "CoordOutOfRange">;
  getCurrentPlayer(): Result<Player, "GameFinished">;
  getNextValidCoords(): Result<Coord[], "GameFinished" | "PlayerGetError">;
  next(
    coord: Coord
  ): Result<
    void,
    "CellGetError" | "NotValidCoord" | "PlayerGetError" | "CellSetError"
  >;
}

export type Grid = Map<string, Cell>;
export type Coord = [x: number, y: number];

function parseCoord(source: string): Result<Coord, "SourceInvalid"> {
  const [xString, yString] = source.split(",");
  if (!(xString && yString)) {
    return Result.error("SourceInvalid");
  }
  const [x, y] = [parseInt(xString), parseInt(yString)];
  return Result([x, y]);
}

export function Othello(
  options: { grid?: { width: number; height: number }; players?: string[] } = {}
): Othello {
  const grid: Grid = new Map();
  const gridWidth = options.grid?.width ?? 8;
  const gridHeight = options.grid?.height ?? 8;

  const players = new Map<string, Player>();
  const playerIds = options.players ?? ["B", "W"];
  if (!(playerIds.length >= 2)) {
    // TODO: use esresult instead
    throw new TypeError("NotEnoughPlayers");
  }
  for (const playerId of playerIds) {
    players.set(playerId, { id: playerId });
  }

  const isCoordInGrid = (coord: Coord): boolean => {
    const [x, y] = coord;
    return x >= 1 && x <= gridWidth && y >= 1 && y <= gridHeight;
  };

  const getPlayer = (playerId: string): Result<Player, "NotFound"> => {
    const player = players.get(playerId);
    if (!player) {
      return Result.error("NotFound");
    }
    return Result(player);
  };

  const setCell = (
    coord: Coord,
    player: Player
  ): Result<void, "CoordOutOfRange" | "PlayerNotFound"> => {
    if (!isCoordInGrid(coord)) {
      return Result.error("CoordOutOfRange");
    }
    const key = coord.join(",");
    grid.set(key, { player });
    return Result(undefined);
  };

  const getCell: Othello["getCell"] = (coord) => {
    const [x, y] = coord;
    if (!(x >= 1 && x <= 8 && y >= 1 && y <= 8)) {
      return Result.error("CoordOutOfRange");
    }
    const key = coord.join(",");
    const cell = grid.get(key);
    return Result(cell);
  };

  // setup the board to defaults
  // TODO: calculate the board's center using the grid width and height
  {
    const white = getPlayer("W").orThrow();
    const black = getPlayer("B").orThrow();

    setCell([4, 4], white);
    setCell([5, 4], black);
    setCell([5, 5], white);
    setCell([4, 5], black);
  }

  const turns: Turn[] = [];

  const getCurrentPlayer: Othello["getCurrentPlayer"] = () => {
    const _players = Array.from(players.values());
    const lastTurn = turns.length ? turns[turns.length - 1] : undefined;
    const firstPlayer = _players[0];
    if (!firstPlayer) {
      throw new TypeError("FirstPlayerMustBeDefined");
    }
    let nextPlayer = firstPlayer;
    if (lastTurn) {
      const playerIndex = _players.indexOf(lastTurn.player);
      if (playerIndex === -1) {
        throw new TypeError("PlayerMustBeFound");
      }
      const nextPlayerIndex = playerIndex + 1;
      const _nextPlayer =
        nextPlayerIndex > _players.length - 1
          ? _players[0]
          : _players[nextPlayerIndex];
      if (!_nextPlayer) {
        throw new TypeError("PlayerMustBeDefined");
      }
      nextPlayer = _nextPlayer;
    }
    return Result(nextPlayer);
  };

  let validcoords = new Set<string>();
  const getNextValidCoords: Othello["getNextValidCoords"] = () => {
    const $currentPlayer = getCurrentPlayer();
    if ($currentPlayer.error) {
      return Result.error("PlayerGetError", { cause: $currentPlayer });
    }
    const [currentPlayer] = $currentPlayer;
    const coords = new Set<string>();
    const walk = (
      coord: Coord,
      direction: Coord,
      seen: boolean = false
    ): void => {
      const nextcoord: Coord = [
        coord[0] + direction[0],
        coord[1] + direction[1],
      ];
      const $nextcell = getCell(nextcoord);
      if ($nextcell.error) {
        return;
      }
      const [nextcell] = $nextcell;
      if (!nextcell) {
        if (seen) {
          coords.add(nextcoord.join(","));
        }
        return;
      }
      const { player } = nextcell;
      if (player.id === currentPlayer.id) {
        return;
      }
      walk(nextcoord, direction, true);
    };
    for (const [coordString, cell] of grid.entries()) {
      if (cell.player !== currentPlayer) {
        continue;
      }
      const [x, y] = parseCoord(coordString).orThrow();
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) {
            continue;
          }
          walk([x, y], [dx, dy]);
        }
      }
    }
    // TODO: remove in favour of purity
    validcoords = coords;
    return Result(
      Array.from(coords.values()).map((coord) => parseCoord(coord).orThrow())
    );
  };

  // TODO: make this pure
  getNextValidCoords();

  const next: Othello["next"] = (coord) => {
    const coordString = coord.join(",");
    if (!validcoords.has(coordString)) {
      return Result.error("NotValidCoord");
    }
    const $currentPlayer = getCurrentPlayer();
    if ($currentPlayer.error) {
      return Result.error("PlayerGetError", { cause: $currentPlayer });
    }
    const [currentPlayer] = $currentPlayer;
    {
      const $ = setCell(coord, currentPlayer);
      if ($.error) {
        return Result.error("CellSetError", { cause: $ });
      }
    }
    const captureCoords: Coord[] = [];
    const walk = (
      coord: Coord,
      direction: Coord,
      seen: boolean = false
    ): void => {
      const nextcoord: Coord = [
        coord[0] + direction[0],
        coord[1] + direction[1],
      ];
      const $nextcell = getCell(nextcoord);
      if ($nextcell.error) {
        return;
      }
      const [nextcell] = $nextcell;
      // console.log(
      // coord,
      // "+",
      // direction,
      // "=",
      // nextcoord,
      // seen,
      // nextcell?.player.id
      // );
      if (!nextcell) {
        if (seen) {
          throw new TypeError("UnexpectedEmptyCell");
        }
        return;
      }
      const { player } = nextcell;
      if (player.id === currentPlayer.id) {
        return;
      }
      captureCoords.push(nextcoord);
      walk(nextcoord, direction, true);
    };
    const [x, y] = coord;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) {
          continue;
        }
        walk([x, y], [dx, dy]);
      }
    }
    // console.log(captureCoords);
    for (const captureCoord of captureCoords) {
      setCell(captureCoord, currentPlayer).orThrow();
    }
    turns.push({
      player: currentPlayer,
      coord,
    });
    // TODO: make pure, and use result and cached for interface func
    getNextValidCoords();
    return Result(undefined);
  };

  return {
    getCell,
    getCurrentPlayer,
    getNextValidCoords,
    next,
  };
}
