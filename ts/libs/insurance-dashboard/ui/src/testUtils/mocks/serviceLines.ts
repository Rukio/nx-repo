import { ServiceLine } from '../../lib/types';

export const getServiceLinesMock = (
  serviceLinesCount?: number
): ServiceLine[] =>
  Array(serviceLinesCount ? serviceLinesCount : 2)
    .fill(0)
    .map((_, index) => ({
      id: `${index}`,
      name: 'Acute Care',
      default: index % 2 ? false : true,
    }));
