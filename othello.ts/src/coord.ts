import Result from "esresult";

export type Coord = [x: number, y: number];

export function parseCoord(source: string): Result<Coord, "SourceInvalid"> {
  const [xString, yString] = source.split(",");
  if (!(xString && yString)) {
    return Result.error("SourceInvalid");
  }
  const [x, y] = [parseInt(xString), parseInt(yString)];
  return Result([x, y]);
}
