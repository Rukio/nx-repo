import { mocked } from 'jest-mock';
import { render, screen, waitFor } from '../../../test-utils';
import ImageCaptureModal, { ImageCaptureModalProps } from './ImageCaptureModal';
import { PHOTO_MODAL_TEST_IDS } from './components/PhotoModal/testIds';
import { IMAGE_CAPTURE_MODAL_TEST_IDS } from './testIds';
import { useUserMedia } from './hooks/useUserMedia';
import { CAMERA_BUTTON_TEST_IDS } from './components/CameraButton/testIds';
import { IMAGE_CONFIRMATION_TEST_IDS } from './components/ImageConfirmation/testIds';

const TEST_PREFIX_ID = 'image-capture-modal';

const mockDefaultProps: Required<ImageCaptureModalProps> = {
  imageCapturePrimaryText: 'Take a photo of your ID',
  imageCaptureSecondaryText: 'Make sure the photo is clear and legible',
  imageConfirmationPrimaryText: 'Confirm your photo',
  retakeButtonText: 'Retake',
  continueButtonText: 'Continue',
  isOpen: true,
  type: 'id-image',
  testIdPrefix: TEST_PREFIX_ID,
  onCameraError: jest.fn(),
  onCancel: jest.fn(),
  onConfirm: jest.fn(),
};

jest.mock('./hooks/useUserMedia', () => ({
  ...jest.requireActual('./hooks/useUserMedia'),
  useUserMedia: jest.fn(),
}));

const setup = (props?: Partial<ImageCaptureModalProps>) =>
  render(<ImageCaptureModal {...mockDefaultProps} {...props} />);

const mockCreateObjectURL = jest.fn();

const revokeObjectURLMock = jest.fn();

const mockUseUserMedia = mocked(useUserMedia);

describe('<ImageCaptureModal />', () => {
  beforeEach(() => {
    mockUseUserMedia.mockReturnValue({
      isMediaReady: true,
      stream: null,
      stopStream: () => null,
    });

    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: mockCreateObjectURL,
    });

    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: revokeObjectURLMock,
    });
  });

  test('should render correctly', async () => {
    setup();

    const cameraContainer = screen.getByTestId(
      PHOTO_MODAL_TEST_IDS.getPhotoModalDialog(
        IMAGE_CAPTURE_MODAL_TEST_IDS.getCameraTestId(
          mockDefaultProps.testIdPrefix
        )
      )
    );

    expect(cameraContainer).toBeVisible();

    const confirmationContainer = screen.queryByTestId(
      PHOTO_MODAL_TEST_IDS.getPhotoModalDialog(
        IMAGE_CAPTURE_MODAL_TEST_IDS.getImageConfirmationTestId(
          mockDefaultProps.testIdPrefix
        )
      )
    );

    expect(confirmationContainer).not.toBeInTheDocument();
  });

  test('should handle capture photo', async () => {
    const { user } = setup();

    const captureButton = screen.getByTestId(
      CAMERA_BUTTON_TEST_IDS.getCaptureButton(
        IMAGE_CAPTURE_MODAL_TEST_IDS.getCameraTestId(
          mockDefaultProps.testIdPrefix
        )
      )
    );

    await user.click(captureButton);

    await waitFor(() => {
      const confirmationContainer = screen.queryByTestId(
        PHOTO_MODAL_TEST_IDS.getPhotoModalDialog(
          IMAGE_CAPTURE_MODAL_TEST_IDS.getImageConfirmationTestId(
            mockDefaultProps.testIdPrefix
          )
        )
      );

      expect(confirmationContainer).toBeVisible();
    });

    const cameraContainer = screen.queryByTestId(
      PHOTO_MODAL_TEST_IDS.getPhotoModalDialog(
        IMAGE_CAPTURE_MODAL_TEST_IDS.getCameraTestId(
          mockDefaultProps.testIdPrefix
        )
      )
    );

    expect(cameraContainer).not.toBeInTheDocument();
  });

  test('should handle close photo modal', async () => {
    const { user } = setup();

    const closeButton = screen.getByTestId(
      PHOTO_MODAL_TEST_IDS.getPhotoModalCloseButton(
        IMAGE_CAPTURE_MODAL_TEST_IDS.getCameraTestId(
          mockDefaultProps.testIdPrefix
        )
      )
    );

    await user.click(closeButton);

    expect(mockDefaultProps.onCancel).toHaveBeenCalled();
  });

  test('should handle retake photo photo modal', async () => {
    const { user } = setup();

    const captureButton = screen.getByTestId(
      CAMERA_BUTTON_TEST_IDS.getCaptureButton(
        IMAGE_CAPTURE_MODAL_TEST_IDS.getCameraTestId(
          mockDefaultProps.testIdPrefix
        )
      )
    );

    await user.click(captureButton);

    await waitFor(() => {
      const confirmationContainer = screen.queryByTestId(
        PHOTO_MODAL_TEST_IDS.getPhotoModalDialog(
          IMAGE_CAPTURE_MODAL_TEST_IDS.getImageConfirmationTestId(
            mockDefaultProps.testIdPrefix
          )
        )
      );

      expect(confirmationContainer).toBeVisible();
    });

    const retakeButton = screen.getByTestId(
      IMAGE_CONFIRMATION_TEST_IDS.getImageConfirmationRetakeButton(
        IMAGE_CAPTURE_MODAL_TEST_IDS.getImageConfirmationTestId(
          mockDefaultProps.testIdPrefix
        )
      )
    );

    await user.click(retakeButton);

    await waitFor(() => {
      const confirmationContainer = screen.queryByTestId(
        PHOTO_MODAL_TEST_IDS.getPhotoModalDialog(
          IMAGE_CAPTURE_MODAL_TEST_IDS.getImageConfirmationTestId(
            mockDefaultProps.testIdPrefix
          )
        )
      );

      expect(confirmationContainer).not.toBeInTheDocument();
    });

    const cameraContainer = screen.getByTestId(
      PHOTO_MODAL_TEST_IDS.getPhotoModalDialog(
        IMAGE_CAPTURE_MODAL_TEST_IDS.getCameraTestId(
          mockDefaultProps.testIdPrefix
        )
      )
    );

    expect(cameraContainer).toBeVisible();
  });
});
