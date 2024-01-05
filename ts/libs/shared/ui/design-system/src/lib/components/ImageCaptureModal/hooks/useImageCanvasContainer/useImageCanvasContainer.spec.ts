import { renderHook, waitFor } from '../../../../../test-utils';
import { mocked } from 'jest-mock';
import { theme, useMediaQuery } from '../../../../index';
import { useMobileOrientation } from '../useMobileOrientation';
import useImageCanvasContainer, {
  calculatePortraitContainerSize,
  calculateLandscapeContainerSize,
  getSizeConstants,
} from './useImageCanvasContainer';
import { Orientation } from '../useMobileOrientation/useMobileOrientation';

const MOCKED_INNER_WIDTH = 1000;

Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: MOCKED_INNER_WIDTH,
});

jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: jest.fn(),
}));

jest.mock('../useMobileOrientation', () => ({
  ...jest.requireActual('../useMobileOrientation'),
  useMobileOrientation: jest.fn(),
}));

const { portraitHorizontalMargin, textSelectionSize } = getSizeConstants(theme);

const mockUseMediaQuery = mocked(useMediaQuery);
const mockUseMobileOrientation = mocked(useMobileOrientation);

describe('calculatePortraitContainerSize', () => {
  it('should return the correct container dimensions when isContainerConfirm is true', () => {
    const isContainerConfirm = true;

    const result = calculatePortraitContainerSize(
      isContainerConfirm,
      portraitHorizontalMargin
    );

    expect(result).toEqual({
      height: 570,
      width: 904,
    });
  });

  it('should return the correct container dimensions when isContainerConfirm is false', () => {
    const isContainerConfirm = false;

    const result = calculatePortraitContainerSize(
      isContainerConfirm,
      portraitHorizontalMargin
    );

    expect(result).toEqual({
      height: 601,
      width: 952,
    });
  });
});

describe('calculateLandscapeContainerSize', () => {
  it('should return the correct width and height for landscape orientation', () => {
    const result = calculateLandscapeContainerSize(textSelectionSize);

    expect(result).toEqual({
      height: 624,
      width: 1092,
    });
  });
});

describe('useImageCanvasContainer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(global, 'setTimeout');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should calculate container size for portrait orientation', async () => {
    mockUseMediaQuery.mockReturnValue(true);

    mockUseMobileOrientation.mockReturnValue({
      isLandscape: false,
      isPortrait: true,
      orientation: Orientation.Portrait,
    });

    const { result, rerender } = renderHook(() =>
      useImageCanvasContainer({
        isConfirmationContainer: false,
      })
    );

    expect(result.current.containerSize).toEqual({
      width: 0,
      height: 0,
    });

    expect(result.current.isMobileLandscape).toEqual(false);

    rerender();

    await waitFor(() => {
      expect(result.current.containerSize).toEqual({
        width: 952,
        height: 601,
      });
    });
  });

  it('should calculate container size for landscape orientation', async () => {
    mockUseMediaQuery.mockReturnValue(true);

    mockUseMobileOrientation.mockReturnValue({
      isLandscape: true,
      isPortrait: true,
      orientation: Orientation.Landscape,
    });

    const { result, rerender } = renderHook(() =>
      useImageCanvasContainer({
        isConfirmationContainer: false,
      })
    );

    expect(result.current.containerSize).toEqual({
      width: 0,
      height: 0,
    });

    expect(result.current.isMobileLandscape).toEqual(true);

    rerender();

    await waitFor(() => {
      expect(result.current.containerSize).toEqual({
        width: 1092,
        height: 624,
      });
    });
  });
});
