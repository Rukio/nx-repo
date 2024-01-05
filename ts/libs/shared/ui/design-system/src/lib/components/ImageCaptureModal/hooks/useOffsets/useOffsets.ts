import { useMemo } from 'react';

/**
 * In the event that the video (v) is larger than it's parent container (c), calculate offsets
 * to center the container in the middle of the video.
 * @param {number} childrenWidth - the video width
 * @param {number} childrenHeight - the video height
 * @param {number} containerWidth - the parent container width
 * @param {number} containerHeight - the parent container height
 **/
const useOffsets = (
  childrenWidth: number,
  childrenHeight: number,
  containerWidth: number,
  containerHeight: number
) => {
  return useMemo(() => {
    if (childrenWidth && childrenHeight && containerWidth && containerHeight) {
      const x =
        childrenWidth > containerWidth
          ? Math.round((childrenWidth - containerWidth) / 2)
          : 0;
      const y =
        childrenHeight > containerHeight
          ? Math.round((childrenHeight - containerHeight) / 2)
          : 0;

      return { x, y };
    }

    return { x: 0, y: 0 };
  }, [childrenWidth, childrenHeight, containerWidth, containerHeight]);
};

export default useOffsets;
