import { FC } from 'react';
import { Meta } from '@storybook/react';

import ImageUploadStatus, { ImageUploadStatusState } from '../index';
import { Box } from '../../../index';

const sampleIdUrl = 'ca-2018-real-id-dl.jpeg';

export default {
  title: 'Uploaded Image With Status',
  component: ImageUploadStatus,
} as Meta<typeof ImageUploadStatus>;

export const Basic: FC = (args) => (
  <Box
    sx={{
      margin: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    }}
  >
    <ImageUploadStatus
      imageUrl={sampleIdUrl}
      status={ImageUploadStatusState.InProgress}
      aspectRatioCoefficient={1.5}
      testIdPrefix="test"
      {...args}
    />
  </Box>
);
