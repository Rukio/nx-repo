import { useState, useEffect, RefObject } from 'react';

const useUserMedia = (
  requestedMedia: MediaStreamConstraints,
  shouldStartStream: boolean,
  videoRef: RefObject<HTMLVideoElement>,
  onError?: () => void
) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMediaReady, setIsMediaReady] = useState(false);

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(function (track) {
        track.stop();
      });
    }
    setIsMediaReady(false);
  };

  useEffect(() => {
    const startStream = async () => {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia(
          requestedMedia
        );

        setStream(newStream);

        if (videoRef?.current) {
          setIsMediaReady(true);
          videoRef.current.srcObject = newStream;
          await videoRef.current.play?.();
        }
      } catch (err) {
        setIsMediaReady(false);

        if (onError) {
          onError();
        }
      }
    };
    if (shouldStartStream && !isMediaReady) {
      startStream();
    }
  }, [shouldStartStream, isMediaReady, onError, requestedMedia, videoRef]);

  return {
    stream,
    isMediaReady,
    stopStream,
  };
};

export default useUserMedia;
