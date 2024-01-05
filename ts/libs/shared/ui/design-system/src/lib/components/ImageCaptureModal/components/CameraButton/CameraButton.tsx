import { FC } from 'react';
import { Button, makeSxStyles } from '../../../../index';
import { CAMERA_BUTTON_TEST_IDS } from './testIds';

export type CameraButtonProps = {
  isDisabled: boolean;
  isMobileLandscape: boolean;
  handleCapture: () => void;
  testIdPrefix: string;
};

type StyleProps = Pick<CameraButtonProps, 'isDisabled'>;

const makeStyles = ({ isDisabled }: StyleProps) =>
  makeSxStyles({
    cameraButton: (theme) => ({
      width: 60,
      height: 60,
      borderRadius: '50%',
      border: 'none',
      background: isDisabled
        ? theme.palette.action.active
        : theme.palette.common.white,
    }),
    cameraButtonLandscape: {
      position: 'fixed',
      right: '0%',
      top: `calc(50% - 50px)`,
    },
    cameraButtonPortrait: {
      position: 'absolute',
      top: '110%',
      transform: `translate('-50%', 0)`,
    },
  });

const CameraButton: FC<CameraButtonProps> = ({
  isDisabled,
  isMobileLandscape,
  handleCapture,
  testIdPrefix,
}) => {
  const styles = makeStyles({ isDisabled });

  return (
    <Button
      onClick={handleCapture}
      disabled={isDisabled}
      data-testid={CAMERA_BUTTON_TEST_IDS.getCaptureButton(testIdPrefix)}
      sx={
        isMobileLandscape
          ? [styles.cameraButton, styles.cameraButtonLandscape]
          : [styles.cameraButton, styles.cameraButtonPortrait]
      }
    />
  );
};

export default CameraButton;
