import { Children, FC, PropsWithChildren } from 'react';
import {
  ClearIcon,
  Dialog,
  Grid,
  makeSxStyles,
  alpha,
  dialogClasses,
} from '../../../../index';
import { PHOTO_MODAL_TEST_IDS } from './testIds';

export type PhotoModalProps = PropsWithChildren<{
  onClose: () => void;
  hasBlackBackground?: boolean;
  isOpen: boolean;
  testIdPrefix: string;
}>;

type StylesProps = Pick<PhotoModalProps, 'hasBlackBackground'>;

const makeStyles = ({ hasBlackBackground }: StylesProps) => {
  return makeSxStyles({
    dialog: (theme) => ({
      [`& .${dialogClasses.paper}`]: {
        backgroundColor: hasBlackBackground
          ? alpha(theme.palette.common.black, 0.95)
          : theme.palette.common.white,
        overflow: 'hidden',
      },
      '& p': {
        color: hasBlackBackground
          ? theme.palette.common.white
          : theme.palette.common.black,
      },
    }),
    clearIcon: (theme) => ({
      position: 'absolute',
      top: '10%',
      left: '90%',
      color: hasBlackBackground
        ? theme.palette.common.white
        : theme.palette.common.black,
      zIndex: 1000,
      fontSize: theme.typography.pxToRem(36),
      transform: 'translate(-50%, -50%)',
      '& p': {
        color: theme.palette.common.white,
      },
    }),
    childrenWrapper: {
      width: '85%',
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    },
  });
};

const PhotoModal: FC<PhotoModalProps> = ({
  children,
  onClose,
  hasBlackBackground,
  isOpen,
  testIdPrefix,
}) => {
  const styles = makeStyles({ hasBlackBackground });

  return (
    <Dialog
      data-testid={PHOTO_MODAL_TEST_IDS.getPhotoModalDialog(testIdPrefix)}
      fullScreen
      open={isOpen}
      sx={styles.dialog}
    >
      <ClearIcon
        onClick={onClose}
        sx={styles.clearIcon}
        data-testid={PHOTO_MODAL_TEST_IDS.getPhotoModalCloseButton(
          testIdPrefix
        )}
      />
      {!!Children.count(children) && (
        <Grid
          data-testid={PHOTO_MODAL_TEST_IDS.getPhotoModalPhotoModalChildrenWrapper(
            testIdPrefix
          )}
          sx={styles.childrenWrapper}
        >
          {children}
        </Grid>
      )}
    </Dialog>
  );
};

export default PhotoModal;
