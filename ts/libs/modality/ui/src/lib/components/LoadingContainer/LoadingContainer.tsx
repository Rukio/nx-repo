import { FC, CSSProperties } from 'react';
import {
  Box,
  CircularProgress,
  CircularProgressProps,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { LOADING_CONTAINER_TEST_IDS } from './testIds';

interface LoadingContainerProps {
  testIdPrefix: string;
  containerWidth?: CSSProperties['width'];
  containerHeight?: CSSProperties['height'];
  spinnerSize?: CircularProgressProps['size'];
}

const makeStyles = ({
  containerWidth,
  containerHeight,
}: Pick<LoadingContainerProps, 'containerWidth' | 'containerHeight'>) =>
  makeSxStyles({
    container: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: containerWidth,
      height: containerHeight,
    },
  });

const LoadingContainer: FC<LoadingContainerProps> = ({
  containerWidth = 'initial',
  containerHeight = 'initial',
  testIdPrefix,
  spinnerSize,
}) => {
  const styles = makeStyles({
    containerWidth,
    containerHeight,
  });

  return (
    <Box sx={styles.container}>
      <CircularProgress
        size={spinnerSize}
        data-testid={LOADING_CONTAINER_TEST_IDS.getProgressTestId(testIdPrefix)}
      />
    </Box>
  );
};

export default LoadingContainer;
