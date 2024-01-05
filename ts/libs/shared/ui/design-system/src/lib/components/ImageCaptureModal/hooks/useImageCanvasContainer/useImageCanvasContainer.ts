import { useState, useEffect } from 'react';
import {
  useMediaQuery,
  Theme,
  useTheme,
  ImageUploadStatusAspectRatioType,
} from '../../../../index';
import { useMobileOrientation } from '../useMobileOrientation';

/** ISO/IEC 7810 standard gives the dimensions, which are 85.60 × 53.98 mm with an aspect ratio of 1.586. */
const ASPECT_RATIO_PORTRAIT =
  ImageUploadStatusAspectRatioType.IdentificationCard;
/** The same but it is relative to screen  height */
const ASPECT_RATIO_LANDSCAPE = 1.75;

export type ContainerDimensions = {
  width: number;
  height: number;
};

interface UseImageCanvasContainerProps {
  isConfirmationContainer: boolean;
}

interface UseImageCanvasContainerResponse {
  containerSize: ContainerDimensions;
  isMobileLandscape: boolean;
}

export const getSizeConstants = (theme: Theme) => {
  const rem1Size = parseInt(theme.spacing(1), 10);
  const lineHeight = rem1Size * 3;
  const portraitHorizontalMargin = rem1Size * 6;
  const textSelectionSize = lineHeight * 6;

  return { portraitHorizontalMargin, textSelectionSize };
};

export const calculatePortraitContainerSize = (
  isContainerConfirm: boolean,
  portraitHorizontalMargin: number
): ContainerDimensions => {
  const base = window.innerWidth;
  const width = Math.ceil(
    base -
      (isContainerConfirm
        ? portraitHorizontalMargin * 2
        : portraitHorizontalMargin)
  );

  const height = Math.ceil(width / ASPECT_RATIO_PORTRAIT);

  return { width, height };
};

export const calculateLandscapeContainerSize = (
  textSelectionSize: number
): ContainerDimensions => {
  const base = window.innerHeight;
  const height = base - textSelectionSize;
  const width = height * ASPECT_RATIO_LANDSCAPE;

  return { width, height };
};

const delay = (func: () => void) => setTimeout(func, 1);

/**
 * Used to calculate the size of the image canvas container based on the device's orientation and aspect ratio.
 * @param {boolean} isConfirmationContainer - whether or not the container is the confirmation container, because it has different margins
 **/
const useImageCanvasContainer = ({
  isConfirmationContainer,
}: UseImageCanvasContainerProps): UseImageCanvasContainerResponse => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));
  const { portraitHorizontalMargin, textSelectionSize } =
    getSizeConstants(theme);

  const { isLandscape } = useMobileOrientation();
  const [containerSize, setContainerSize] = useState<ContainerDimensions>({
    width: 0,
    height: 0,
  });
  const [isMobileLandscape, setIsMobileLandscape] = useState(
    isLandscape && isSmall
  );

  useEffect(() => {
    if (isLandscape && isSmall) {
      delay(() => {
        setIsMobileLandscape(true);
        const { width, height } =
          calculateLandscapeContainerSize(textSelectionSize);
        setContainerSize({
          width,
          height,
        });
      });
    } else {
      delay(() => {
        setIsMobileLandscape(false);
        const { width, height } = calculatePortraitContainerSize(
          isConfirmationContainer,
          portraitHorizontalMargin
        );
        setContainerSize({
          width,
          height,
        });
      });
    }
  }, [
    isLandscape,
    isSmall,
    isConfirmationContainer,
    portraitHorizontalMargin,
    textSelectionSize,
  ]);

  return { containerSize, isMobileLandscape };
};

export default useImageCanvasContainer;
