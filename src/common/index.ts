import { RectGrid } from "./rectGrid";
import { reviver, replacer } from "./serialization";
import { shuffle } from "./shuffle";
import { UserFacingError } from "./errors";

export { RectGrid, reviver, replacer, shuffle, UserFacingError };

export type DirectionsCardinal = "N" | "E" | "S" | "W";
export type DirectionsDiagonal = "NE" | "SE" | "SW" | "NW";
export type Directions = DirectionsCardinal | DirectionsDiagonal;
