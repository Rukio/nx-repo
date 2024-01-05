import { FC, ReactElement, useState } from 'react';
import { FileRejection, useDropzone, DropzoneOptions } from 'react-dropzone';
import {
  Box,
  BackupIcon,
  ErrorIcon,
  Typography,
  makeSxStyles,
  SxStylesValue,
  ImageUploadStatusAspectRatioType,
} from '../..';
import { parseDragAndDropErrors } from './utils';
import { DRAG_AND_DROP_TEST_IDS as TEST_IDS } from './testIds';

export type DragAndDropUploadZoneProps = {
  testIdPrefix: string;
  /** Text to show by default on the drag-and-drop zone. */
  dragAndDropText?: string;
  /** Text to show while files are actively being dragged in the window. */
  dropText?: string;
  /** Callback function called when files are dropped. */
  onDrop: (files: File[]) => void;
  /** Custom styles for the component. */
  sx?: SxStylesValue;
  /** Custom styles for the component when in error state. */
  errorSx?: SxStylesValue;
  /** Custom icon to render at the bottom of the text */
  bottomIconComponent?: ReactElement;
  /** Custom icon to render at the bottom of the text when in error state. */
  errorIconComponent?: ReactElement;
  /** This options will pass to useDropzone*/
  dropzoneOptions: DropzoneOptions;
  /** Width of the component in pixels */
  widthPx?: number;
  /** Aspect Ratio Coefficient for dynamic calculation height of the component  */
  aspectRatioCoefficient?: ImageUploadStatusAspectRatioType | number;
};

type MakeStylesProps = {
  width: number;
  height: number;
};

const makeStyles = ({ height, width }: MakeStylesProps) =>
  makeSxStyles({
    defaultDropZone: (theme) => ({
      border: `1px dashed ${theme.palette.grey[400]}`,
      backgroundColor: theme.palette.grey[200],
      display: 'flex',
      justifyContent: 'space-between',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      borderRadius: '5px',
      padding: theme.spacing(1),
      width,
      height,
    }),
    defaultErrorDropZone: (theme) => ({
      border: `1px dashed ${theme.palette.error.main}`,
    }),
  });

const DEFAULT_ERROR_TEXT = 'Something went wrong';

const DragAndDropUploadZone: FC<DragAndDropUploadZoneProps> = ({
  dragAndDropText = 'Drag and drop files here or click to upload',
  dropText = 'Drop files here',
  sx = {},
  errorSx = {},
  onDrop,
  testIdPrefix,
  dropzoneOptions,
  widthPx = 148,
  aspectRatioCoefficient = ImageUploadStatusAspectRatioType.IdentificationCard,
  bottomIconComponent = (
    <BackupIcon
      sx={(theme) => ({
        color: theme.palette.grey[600],
      })}
    />
  ),
  errorIconComponent = <ErrorIcon color="error" />,
}) => {
  const [fileUploadErrors, setFileUploadErrors] = useState<string | null>(null);

  const styles = makeStyles({
    width: widthPx,
    height: widthPx / aspectRatioCoefficient,
  });

  const onFileDrop = (
    acceptedFiles: File[],
    rejectedFiles: FileRejection[]
  ) => {
    const acceptedFileTypes = dropzoneOptions.accept;

    if (rejectedFiles?.length) {
      setFileUploadErrors(
        parseDragAndDropErrors(rejectedFiles, acceptedFileTypes)
      );
    } else {
      setFileUploadErrors(null);
    }

    onDrop(acceptedFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    ...dropzoneOptions,
    onDrop: onFileDrop,
  });

  const dragAndDropZoneText = isDragActive ? dropText : dragAndDropText;

  const errorStyles = fileUploadErrors
    ? [styles.defaultErrorDropZone, errorSx]
    : [];

  return (
    <Box
      data-testid={TEST_IDS.getDragAndDropUploadZone(testIdPrefix)}
      component="div"
      sx={[styles.defaultDropZone, sx, ...errorStyles]}
      {...getRootProps()}
    >
      <input
        data-testid={TEST_IDS.getDragAndDropZoneUploadInput(testIdPrefix)}
        {...getInputProps()}
      />
      {!fileUploadErrors ? (
        <>
          <Typography
            data-testid={TEST_IDS.getDragAndDropUploadZoneText(testIdPrefix)}
            variant="body2"
          >
            {dragAndDropZoneText}
          </Typography>
          {bottomIconComponent}
        </>
      ) : (
        <>
          <Typography
            data-testid={TEST_IDS.getDragAndDropZoneUploadErrorText(
              testIdPrefix
            )}
            color="error"
            variant="body2"
          >
            {fileUploadErrors || DEFAULT_ERROR_TEXT}
          </Typography>
          {errorIconComponent}
        </>
      )}
    </Box>
  );
};

export default DragAndDropUploadZone;
