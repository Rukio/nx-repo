import { act, renderHook, waitFor } from '../../../../../test-utils';
import useUserMedia from './useUserMedia';

const mockGetUserMedia = jest.fn(
  async () =>
    new Promise<void>((resolve) => {
      resolve();
    })
);

const mockGetUserMediaError = jest.fn(
  async () =>
    new Promise<void>((_resolve, reject) => {
      reject('MediaStream error');
    })
);

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
  configurable: true,
});

const MOCKED_REQUESTED_MEDIA = {
  video: true,
};

const setup = () => {
  global.HTMLVideoElement.prototype.play = jest.fn();
  global.HTMLVideoElement.prototype.srcObject = null;

  const videoRef = { current: document.createElement('video') };

  return {
    videoRef,
  };
};

describe('useUserMedia', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('should start the media stream if shouldStartStream is true', async () => {
    const { videoRef } = setup();

    const mockShouldStartStream = true;

    const { result } = renderHook(() =>
      useUserMedia(MOCKED_REQUESTED_MEDIA, mockShouldStartStream, videoRef)
    );

    expect(mockGetUserMedia).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(videoRef.current.play).toHaveBeenCalledTimes(1);
    });

    expect(result.current.isMediaReady).toBe(true);
  });

  it('should not start the media stream if shouldStartStream is false', () => {
    const { videoRef } = setup();

    const mockShouldStartStream = false;

    const { result } = renderHook(() =>
      useUserMedia(MOCKED_REQUESTED_MEDIA, mockShouldStartStream, videoRef)
    );

    expect(mockGetUserMedia).toHaveBeenCalledTimes(0);

    expect(videoRef.current.play).toHaveBeenCalledTimes(0);

    expect(result.current.isMediaReady).toBe(false);
  });

  it('should stop the media stream when stopStream is called', () => {
    const { videoRef } = setup();

    const mockShouldStartStream = false;

    const { result } = renderHook(() =>
      useUserMedia(MOCKED_REQUESTED_MEDIA, mockShouldStartStream, videoRef)
    );

    act(() => {
      result.current.stopStream();
    });

    expect(result.current.stream).toBe(null);
    expect(result.current.isMediaReady).toBe(false);
  });

  it('should call onError if an error occurs while starting the media stream', async () => {
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: mockGetUserMediaError,
      },
    });
    const { videoRef } = setup();

    const mockShouldStartStream = true;

    const onError = jest.fn();

    renderHook(() =>
      useUserMedia(
        MOCKED_REQUESTED_MEDIA,
        mockShouldStartStream,
        videoRef,
        onError
      )
    );

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });
});
