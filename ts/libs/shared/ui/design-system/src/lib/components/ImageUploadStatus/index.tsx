import { FC } from 'react';
import {
  alpha,
  Backdrop,
  Grid,
  CircularProgress,
  CheckIcon,
  ErrorIcon,
  makeSxStyles,
} from '../..';
import { IMAGE_UPLOAD_STATUS_TEST_IDS } from './testIds';

export enum ImageUploadStatusState {
  InProgress = 'InProgress',
  Completed = 'Completed',
  Error = 'Error',
  NotStarted = 'NotStarted',
}

export enum ImageUploadStatusAspectRatioType {
  /** ISO/IEC 7810 standard gives the dimensions, which are 85.60 × 53.98 mm with an aspect ratio of 1.586. */
  IdentificationCard = 1.586,
  /** Assumed to be similar in size to ImageUploadStatusAspectRatioType.IdentificationCard. */
  InsuranceCard = 1.586,
}

export type ImageUploadStatusProps = {
  imageUrl: string;
  status: ImageUploadStatusState;
  testIdPrefix: string;
  widthPx?: number;
  aspectRatioCoefficient?: ImageUploadStatusAspectRatioType | number;
};

type MakeStylesProps = {
  width: number;
  height: number;
};

const makeStyles = ({ width, height }: MakeStylesProps) =>
  makeSxStyles({
    imagePreview: {
      width,
      height,
      position: 'relative',
      zIndex: 0,
      '& > img': {
        width: '100%',
        height: '100%',
        borderRadius: '5px',
      },
    },
    backdrop: (theme) => ({
      position: 'absolute',
      borderRadius: '5px',
      color: theme.palette.common.white,
      zIndex: 1000,
    }),
    backdropColorInProgress: {},
    backdropColorNotStarted: {},
    backdropColorCompleted: (theme) => ({
      background: alpha(theme.palette.success.dark, 0.4),
    }),
    backdropColorError: (theme) => ({
      background: alpha(theme.palette.error.dark, 0.4),
    }),
  });

const ImageUploadStatus: FC<ImageUploadStatusProps> = ({
  imageUrl,
  status,
  testIdPrefix,
  widthPx = 148,
  aspectRatioCoefficient = ImageUploadStatusAspectRatioType.IdentificationCard,
}) => {
  const styles = makeStyles({
    width: widthPx,
    height: widthPx / aspectRatioCoefficient,
  });

  const renderStatusIcon = () => {
    switch (status) {
      case ImageUploadStatusState.Error:
        return (
          <ErrorIcon
            fontSize="large"
            data-testid={IMAGE_UPLOAD_STATUS_TEST_IDS.getErrorIndicatorTestId(
              testIdPrefix
            )}
          />
        );
      case ImageUploadStatusState.InProgress:
        return (
          <CircularProgress
            data-testid={IMAGE_UPLOAD_STATUS_TEST_IDS.getInProgressIndicatorTestId(
              testIdPrefix
            )}
            color="inherit"
          />
        );
      case ImageUploadStatusState.Completed:
        return (
          <CheckIcon
            fontSize="large"
            data-testid={IMAGE_UPLOAD_STATUS_TEST_IDS.getCompleteIndicatorTestId(
              testIdPrefix
            )}
          />
        );
      case ImageUploadStatusState.NotStarted:
      default:
        return null;
    }
  };

  return (
    <Grid
      data-testid={IMAGE_UPLOAD_STATUS_TEST_IDS.getImagePreviewTestId(
        testIdPrefix
      )}
      sx={styles.imagePreview}
    >
      <img src={imageUrl} alt={testIdPrefix} />
      <Backdrop
        sx={[styles.backdrop, styles[`backdropColor${status}`]]}
        open={true}
      >
        {renderStatusIcon()}
      </Backdrop>
    </Grid>
  );
};

export default ImageUploadStatus;
