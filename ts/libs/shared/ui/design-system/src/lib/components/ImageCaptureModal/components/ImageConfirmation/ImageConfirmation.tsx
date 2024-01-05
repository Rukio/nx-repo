import { FC } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  makeSxStyles,
  Typography,
} from '../../../../index';
import { PhotoModal } from '../PhotoModal';
import {
  useImageCanvasContainer,
  ContainerDimensions,
} from '../../hooks/useImageCanvasContainer';
import { IMAGE_CONFIRMATION_TEST_IDS } from './testIds';

export interface ImageConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onRetake: () => void;
  onConfirm: () => void;
  objectUrl: string | null;
  emptyObjectUrlText?: string;
  topText?: string;
  retakeButtonText?: string;
  confirmationButtonText?: string;
  testIdPrefix: string;
  type: string;
}
interface StyleProps {
  containerSize: ContainerDimensions;
  isMobileLandscape: boolean;
}

const makeStyles = ({ containerSize, isMobileLandscape }: StyleProps) =>
  makeSxStyles({
    container: {
      display: 'flex',
      flexDirection: 'column',
    },
    topText: (theme) => ({
      width: isMobileLandscape ? '325px' : 'auto',
      margin: theme.spacing(0, 'auto', 2.75, 'auto'),
    }),
    imagePreview: {
      height: containerSize.height,
      borderRadius: 8,
      width: containerSize.width,
      objectFit: 'cover',
      margin: 'auto',
    },
    imagePlaceholder: {
      height: containerSize.height,
      borderRadius: 8,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      border: '1px solid black',
    },
    customButton: {
      width: '100%',
    },
  });

const ImageConfirmation: FC<ImageConfirmationProps> = ({
  isOpen,
  objectUrl,
  topText,
  retakeButtonText = 'Retake',
  confirmationButtonText = 'Continue',
  emptyObjectUrlText = 'Something went wrong with your image. Please try again.',
  testIdPrefix,
  onClose,
  type,
  onRetake,
  onConfirm,
}) => {
  const { containerSize, isMobileLandscape } = useImageCanvasContainer({
    isConfirmationContainer: true,
  });

  const styles = makeStyles({ containerSize, isMobileLandscape });

  return (
    <PhotoModal testIdPrefix={testIdPrefix} onClose={onClose} isOpen={isOpen}>
      <Container maxWidth="sm" sx={styles.container}>
        <Typography
          data-testid={IMAGE_CONFIRMATION_TEST_IDS.getImageConfirmationTopText(
            testIdPrefix
          )}
          textAlign="center"
          sx={styles.topText}
        >
          {topText}
        </Typography>
        {objectUrl ? (
          <Box
            data-testid={IMAGE_CONFIRMATION_TEST_IDS.getImageConfirmationImage(
              testIdPrefix
            )}
            component="img"
            sx={styles.imagePreview}
            src={objectUrl ?? undefined}
            alt={type}
          />
        ) : (
          <Box
            data-testid={IMAGE_CONFIRMATION_TEST_IDS.getImageConfirmationImagePlaceholder(
              testIdPrefix
            )}
            sx={styles.imagePlaceholder}
          >
            <Alert severity="error" message={emptyObjectUrlText} />
          </Box>
        )}
        <Grid
          container
          spacing={2}
          justifyContent="center"
          alignItems="center"
          mt={2}
        >
          <Grid item xs={6}>
            <Button
              data-testid={IMAGE_CONFIRMATION_TEST_IDS.getImageConfirmationRetakeButton(
                testIdPrefix
              )}
              sx={styles.customButton}
              variant="outlined"
              onClick={onRetake}
            >
              {retakeButtonText}
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              data-testid={IMAGE_CONFIRMATION_TEST_IDS.getImageConfirmationButton(
                testIdPrefix
              )}
              sx={styles.customButton}
              variant="contained"
              disabled={!objectUrl}
              onClick={onConfirm}
            >
              {confirmationButtonText}
            </Button>
          </Grid>
        </Grid>
      </Container>
    </PhotoModal>
  );
};

export default ImageConfirmation;
