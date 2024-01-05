import { FC } from 'react';
import { Meta } from '@storybook/react';

import ImageCaptureModal from '../index';
import { Box } from '../../../index';

export default {
  title: 'Image Capture Modal',
  component: ImageCaptureModal,
} as Meta<typeof ImageCaptureModal>;

export const Basic: FC = (args) => (
  <Box
    sx={{
      margin: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    }}
  >
    <ImageCaptureModal
      imageCapturePrimaryText={'Take a photo of your ID'}
      imageCaptureSecondaryText={'Make sure the photo is clear and legible'}
      imageConfirmationPrimaryText={'Confirm your photo'}
      retakeButtonText={'Retake'}
      continueButtonText={'Continue'}
      isOpen
      type={'id-image'}
      testIdPrefix={'image-capture-modal'}
      onCameraError={() => null}
      onCancel={() => null}
      onConfirm={() => null}
      {...args}
    />
  </Box>
);
