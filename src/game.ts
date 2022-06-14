import Result from "esresult";
import { type Coord, parseCoord } from "./coord";

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

export interface Game {
  width: number;
  height: number;
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

export function Game(
  options: { grid?: { width: number; height: number }; players?: string[] } = {}
): Game {
  const players = new Map<string, Player>();
  const playerIds = options.players ?? ["W", "B"];
  if (!(playerIds.length >= 2)) {
    // TODO: use esresult instead
    throw new TypeError("NotEnoughPlayers");
  }
  for (const playerId of playerIds) {
    players.set(playerId, { id: playerId });
  }

  const grid: Grid = new Map();
  const gridNorm = 6 + players.size;
  const gridWidth = options.grid?.width ?? gridNorm;
  const gridHeight = options.grid?.height ?? gridNorm;

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

  const getCell: Game["getCell"] = (coord) => {
    if (!isCoordInGrid(coord)) {
      return Result.error("CoordOutOfRange");
    }
    const key = coord.join(",");
    const cell = grid.get(key);
    return Result(cell);
  };

  // setup the board to defaults
  // TODO: calculate the board's center using the grid width and height
  const _players = Array.from(players.values());
  for (let y = 0; y <= _players.length - 1; y++) {
    for (let x = 0; x <= _players.length - 1; x++) {
      const i = (x + y) % _players.length;
      const player = _players[i];
      if (!player) {
        throw new TypeError("NoPlayer");
      }
      setCell([4 + x, 4 + y], player);
    }
  }

  const turns: Turn[] = [];

  const getCurrentPlayer: Game["getCurrentPlayer"] = () => {
    const _players = Array.from(players.values());
    const lastTurn = turns.length ? turns[turns.length - 1] : undefined;
    const lastPlayer = _players[_players.length - 1];
    if (!lastPlayer) {
      throw new TypeError("LastPlayerMustBeDefined");
    }
    let nextPlayer = lastPlayer;
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
  const getNextValidCoords: Game["getNextValidCoords"] = () => {
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

  const next: Game["next"] = (coord) => {
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
      if (!nextcell) {
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
    width: gridWidth,
    height: gridHeight,
    getCell,
    getCurrentPlayer,
    getNextValidCoords,
    next,
  };
}
