import { FC } from 'react';
import {
  Box,
  CircularProgress,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { LAYOUT_LOADER_TEST_IDS } from './testIds';

const makeStyles = () =>
  makeSxStyles({
    layoutLoaderWrapper: {
      display: 'flex',
      position: 'fixed',
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

const LayoutLoader: FC = () => {
  const styles = makeStyles();

  return (
    <Box
      sx={styles.layoutLoaderWrapper}
      data-testid={LAYOUT_LOADER_TEST_IDS.ROOT}
    >
      <CircularProgress
        size={100}
        data-testid={LAYOUT_LOADER_TEST_IDS.CIRCULAR_PROGRESS}
      />
    </Box>
  );
};

export default LayoutLoader;
