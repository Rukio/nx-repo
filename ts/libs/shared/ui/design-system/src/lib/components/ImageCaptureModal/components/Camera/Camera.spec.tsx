import { render, screen } from '../../../../../test-utils';
import { CAMERA_TEST_IDS } from './testIds';
import { mocked } from 'jest-mock';
import Camera, { CameraProps } from './Camera';
import { useUserMedia } from '../../hooks/useUserMedia';
import { CAMERA_BUTTON_TEST_IDS } from '../CameraButton/testIds';
import { PHOTO_MODAL_TEST_IDS } from '../PhotoModal/testIds';

const TEST_PREFIX_ID = 'test';

const mockDefaultProps: CameraProps = {
  isOpen: true,
  onClose: jest.fn(),
  onChangePhoto: jest.fn(),
  topText: 'Top text',
  bottomText: 'Bottom text',
  testIdPrefix: TEST_PREFIX_ID,
  onError: jest.fn(),
};

jest.mock('../../hooks/useUserMedia', () => ({
  useUserMedia: jest.fn(),
}));

const mockUseUserMedia = mocked(useUserMedia);

const setup = (props?: Partial<CameraProps>) => {
  const componentProps = { ...mockDefaultProps, ...props };

  return render(<Camera {...componentProps} />);
};

describe('<Camera />', () => {
  test('should render correct', () => {
    mockUseUserMedia.mockReturnValue({
      isMediaReady: false,
      stream: null,
      stopStream: () => null,
    });

    setup();

    expect(
      screen.getByTestId(CAMERA_TEST_IDS.getCameraTopText(TEST_PREFIX_ID))
    ).toBeVisible();

    expect(
      screen.getByTestId(CAMERA_TEST_IDS.getCameraBox(TEST_PREFIX_ID))
    ).toBeVisible();

    expect(
      screen.getByTestId(CAMERA_TEST_IDS.getCameraCanvasBox(TEST_PREFIX_ID))
    ).toBeVisible();

    expect(
      screen.getByTestId(CAMERA_TEST_IDS.getCameraBottomText(TEST_PREFIX_ID))
    ).toBeVisible();

    expect(
      screen.getByTestId(
        CAMERA_TEST_IDS.getCameraLoadingIndicator(TEST_PREFIX_ID)
      )
    ).toBeVisible();
  });

  test('should not display loading indication when media is not ready', () => {
    mockUseUserMedia.mockReturnValue({
      isMediaReady: true,
      stream: null,
      stopStream: () => null,
    });

    setup();

    expect(
      screen.queryByTestId(
        CAMERA_TEST_IDS.getCameraLoadingIndicator(TEST_PREFIX_ID)
      )
    ).not.toBeInTheDocument();
  });

  test('should not render anything when isOpen false', () => {
    mockUseUserMedia.mockReturnValue({
      isMediaReady: false,
      stream: null,
      stopStream: () => null,
    });

    setup({ isOpen: false });

    expect(
      screen.queryByTestId(
        PHOTO_MODAL_TEST_IDS.getPhotoModalDialog(TEST_PREFIX_ID)
      )
    ).not.toBeInTheDocument();
  });

  test('should call handleCapture when capture button pressed', async () => {
    mockUseUserMedia.mockReturnValue({
      isMediaReady: true,
      stream: null,
      stopStream: () => null,
    });

    const { user } = setup();

    const captureButton = screen.getByTestId(
      CAMERA_BUTTON_TEST_IDS.getCaptureButton(TEST_PREFIX_ID)
    );

    await user.click(captureButton);

    expect(mockDefaultProps.onChangePhoto).toHaveBeenCalled();
  });
});
