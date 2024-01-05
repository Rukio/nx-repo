import { Meta } from '@storybook/react';

import LinearProgress from '../index';
import { Box } from '../../../index';

export default {
  title: 'LinearProgress',
  component: LinearProgress,
} as Meta<typeof LinearProgress>;

export const Basic = () => (
  <Box sx={{ width: '100%' }}>
    <LinearProgress />
  </Box>
);
