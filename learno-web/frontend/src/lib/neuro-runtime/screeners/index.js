import { comfortScreener } from "./comfort.js";
import { focusScreener } from "./focus.js";
import { mathScreener } from "./math.js";
import { readingScreener } from "./reading.js";
import { reflectionScreener } from "./reflection.js";

export const SCREENERS = [
  focusScreener,
  readingScreener,
  mathScreener,
  comfortScreener,
  reflectionScreener,
];

export const SCREENER_MAP = Object.fromEntries(
  SCREENERS.map((screener) => [screener.id, screener])
);
