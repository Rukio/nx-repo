import { FC, useRef } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  makeSxStyles,
} from '../../../../index';
import { PhotoModal } from '../PhotoModal';
import { CameraButton } from '../CameraButton';
import { useUserMedia } from '../../hooks/useUserMedia';
import { useOffsets } from '../../hooks/useOffsets';
import { useImageCanvasContainer } from '../../hooks/useImageCanvasContainer';
import { CAMERA_TEST_IDS } from './testIds';

export type CameraProps = {
  isOpen: boolean;
  onClose: () => void;
  onChangePhoto: (data: Blob) => void;
  topText?: string;
  bottomText?: string;
  testIdPrefix: string;
  onError?: () => void;
};

export const REQUESTED_MEDIA: MediaStreamConstraints = {
  video: { facingMode: { ideal: 'environment' } },
  audio: false,
};

interface StyleProps {
  isMobileLandscape: boolean;
}

const makeStyles = ({ isMobileLandscape }: StyleProps) =>
  makeSxStyles({
    topText: {
      mb: 2.75,
    },
    video: {
      position: 'absolute',
    },
    container: {
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
    },
    canvas: {
      position: 'absolute',
      top: '0',
      left: '0',
    },
    overlay: {
      position: 'absolute',
      top: '0',
      right: '0',
      bottom: '0',
      left: '0',
      boxShadow: '0px 0px 1px 300px rgb(0, 0, 0)',
      border: '1px solid #ffffff',
      borderRadius: '5px',
    },
    circularProgress: (theme) => ({
      position: 'absolute',
      top: `calc(50% - 40px)`,
      right: `calc(50% - 40px)`,
      color: theme.palette.common.white,
    }),
    bottomText: {
      mt: 5,
      width: isMobileLandscape ? '375px' : 'auto',
    },
    wrapper: {
      display: 'flex',
      flexFlow: 'column',
      alignItems: 'center',
      width: '100%',
      height: '100%',
      margin: 'auto',
    },
  });

const getBlobFromCanvas = (
  canvas: HTMLCanvasElement
): Promise<Blob | undefined> =>
  new Promise<Blob | undefined>((resolve) => {
    if (canvas) {
      canvas.toBlob(
        (blob) => {
          resolve(blob || undefined);
        },
        'image/png',
        1
      );
    }
  });

const Camera: FC<CameraProps> = ({
  isOpen,
  topText,
  bottomText,
  testIdPrefix,
  onClose,
  onChangePhoto,
  onError,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { containerSize, isMobileLandscape } = useImageCanvasContainer({
    isConfirmationContainer: false,
  });
  const { stopStream, isMediaReady } = useUserMedia(
    REQUESTED_MEDIA,
    isOpen,
    videoRef,
    onError
  );

  const styles = makeStyles({ isMobileLandscape });

  const offsets = useOffsets(
    (videoRef.current && videoRef.current?.videoWidth) || 0,
    (videoRef?.current && videoRef?.current?.videoHeight) || 0,
    containerSize.width,
    containerSize.height
  );

  const handleCapture = async () => {
    if (videoRef?.current && canvasRef?.current) {
      const context = canvasRef?.current?.getContext('2d');
      context?.drawImage(
        videoRef.current,
        offsets.x,
        offsets.y,
        containerSize.width,
        containerSize.height,
        0,
        0,
        containerSize.width,
        containerSize.height
      );

      const blob = await getBlobFromCanvas(canvasRef.current);
      if (blob) {
        onChangePhoto(blob);
        stopStream();
      }
    }
  };

  const handleClose = () => {
    onClose();
    stopStream();
  };

  if (!isOpen) {
    return null;
  }

  const { width: containerWidth, height: containerHeight } = containerSize;
  const { width: videoWidth, height: videoHeight } = videoRef?.current || {};

  return (
    <PhotoModal
      testIdPrefix={testIdPrefix}
      onClose={handleClose}
      hasBlackBackground
      isOpen
    >
      <Box sx={styles.wrapper}>
        <Typography
          data-testid={CAMERA_TEST_IDS.getCameraTopText(testIdPrefix)}
          textAlign="center"
          sx={styles.topText}
        >
          {topText}
        </Typography>
        {!isMediaReady && (
          <CircularProgress
            data-testid={CAMERA_TEST_IDS.getCameraLoadingIndicator(
              testIdPrefix
            )}
            sx={styles.circularProgress}
            variant="indeterminate"
            size={80}
          />
        )}
        <Box
          sx={styles.container}
          data-testid={CAMERA_TEST_IDS.getCameraBox(testIdPrefix)}
          style={{
            height: `${containerHeight}px`,
            width: `${containerWidth}px`,
            maxHeight: videoHeight ? `${videoHeight}px` : '',
            maxWidth: videoWidth ? `${videoWidth}px` : '',
          }}
        >
          <Box
            ref={videoRef}
            component="video"
            sx={styles.video}
            playsInline
            muted
            style={{
              top: `-${offsets.y}px`,
              left: `-${offsets.x}px`,
            }}
          />
          <Box sx={styles.overlay} />
          <Box
            component="canvas"
            sx={styles.canvas}
            data-testid={CAMERA_TEST_IDS.getCameraCanvasBox(testIdPrefix)}
            ref={canvasRef}
            width={containerSize.width}
            height={containerSize.height}
          />
        </Box>
        <Typography
          data-testid={CAMERA_TEST_IDS.getCameraBottomText(testIdPrefix)}
          textAlign="center"
          variant="body2"
          sx={styles.bottomText}
        >
          {bottomText}
        </Typography>
        <CameraButton
          testIdPrefix={testIdPrefix}
          isMobileLandscape={isMobileLandscape}
          isDisabled={!isMediaReady}
          handleCapture={handleCapture}
        />
      </Box>
    </PhotoModal>
  );
};

export default Camera;
