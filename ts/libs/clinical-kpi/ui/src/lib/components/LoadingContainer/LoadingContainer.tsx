import {
  Box,
  CircularProgress,
  CircularProgressProps,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { LOADING_CONTAINER_TEST_IDS } from './TestIds';

/*
 * renders container with centered circular progress indicator
 * @param {String} prefix to prepend to data-testid -loading
 * @param {String} CSS container min-width value. Defaults to inherit
 * @param {String} CSS container min-height value. Defaults to inherit
 * @param {CircularProgressProps['size]} spinner size passed to MUI <CircularProgress>. Defaults to 100
 */
interface Props {
  testIdPrefix: string;
  cssWidth?: string;
  cssHeight?: string;
  spinnerSize?: CircularProgressProps['size'];
}

type StyleProps = Pick<Props, 'cssHeight' | 'cssWidth' | 'spinnerSize'>;

const makeStyles = ({ cssWidth, cssHeight, spinnerSize }: StyleProps) => {
  const halfSpinnerSize = spinnerSize && +spinnerSize / 2;

  return makeSxStyles({
    container: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginTop: `-${halfSpinnerSize}px`,
      marginLeft: `-${halfSpinnerSize}px`,
      minWidth: cssWidth,
      minHeight: cssHeight,
    },
  });
};

const LoadingContainer = ({
  testIdPrefix,
  cssWidth = 'inherit',
  cssHeight = 'inherit',
  spinnerSize = 100,
}: Props) => {
  const styles = makeStyles({
    cssWidth,
    cssHeight,
    spinnerSize,
  });

  return (
    <Box sx={styles.container}>
      <CircularProgress
        size={spinnerSize}
        data-testid={LOADING_CONTAINER_TEST_IDS.SPINNER(testIdPrefix)}
      />
    </Box>
  );
};

export default LoadingContainer;
