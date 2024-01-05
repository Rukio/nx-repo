import { useCallback, useEffect, useState } from 'react';
import { useMediaQuery, theme } from '../../../../index';

export enum Orientation {
  Portrait = 'portrait',
  Landscape = 'landscape',
}

export interface OrientationState {
  isPortrait: boolean;
  isLandscape: boolean;
  orientation: Orientation;
}

const useMobileOrientation = (): OrientationState => {
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  const [orientationState, setOrientationState] = useState(() => {
    const orientationAngle = window.innerWidth > window.innerHeight ? 90 : 0;

    return {
      isPortrait: orientationAngle === 0,
      isLandscape: orientationAngle === 90,
      orientation:
        orientationAngle === 0 ? Orientation.Portrait : Orientation.Landscape,
    };
  });
  const handleOrientationChange = useCallback(() => {
    const orientationAngle = window.innerWidth > window.innerHeight ? 90 : 0;
    const next = {
      isPortrait: orientationAngle === 0,
      isLandscape: orientationAngle === 90,
      orientation:
        orientationAngle === 0 ? Orientation.Portrait : Orientation.Landscape,
    };
    orientationState.orientation !== next.orientation &&
      setOrientationState(next);
  }, [orientationState.orientation]);
  useEffect(() => {
    if (typeof window !== undefined && isSmall) {
      handleOrientationChange();
      window.addEventListener('load', handleOrientationChange, false);
      window.addEventListener('resize', handleOrientationChange, false);
    }

    return () => {
      window.removeEventListener('resize', handleOrientationChange, false);
      window.removeEventListener('load', handleOrientationChange, false);
    };
  }, [handleOrientationChange, isSmall]);

  return orientationState;
};

export default useMobileOrientation;
