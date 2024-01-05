import { Market } from '../../types/common';

export const sortMarketsAlphabetically = (markets: Market[]) =>
  [...markets].sort((a, b) => a.name.localeCompare(b.name));
