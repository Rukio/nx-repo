import { useMemo } from 'react';

/**
 * @param {T[]} data array of elements.
 * @param {number} page The current page. Must be greater than or equal to 0.
 * @param {number} elementsToShow Number of elements to show per page. Must be greater than or equal to 0.
 * @returns {T[]} Returns paginated array of elements
 * @description React hook for paginating an array of elements.
 */
const usePagination = <T>(
  data: T[],
  page: number,
  elementsToShow: number
): T[] => {
  return useMemo(() => {
    if (elementsToShow < 0 || page < 0) {
      return [];
    }
    const startPoint = page * elementsToShow;

    return data.slice(startPoint, startPoint + elementsToShow);
  }, [data, page, elementsToShow]);
};

export default usePagination;
