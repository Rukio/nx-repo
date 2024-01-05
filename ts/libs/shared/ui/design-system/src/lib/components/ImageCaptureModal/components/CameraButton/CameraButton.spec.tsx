import { render, screen, userEvent } from '../../../../../test-utils';
import CameraButton, { CameraButtonProps } from './CameraButton';
import { CAMERA_BUTTON_TEST_IDS } from './testIds';

const TEST_PREFIX_ID = 'test';

const mockDefaultProps: CameraButtonProps = {
  testIdPrefix: TEST_PREFIX_ID,
  handleCapture: jest.fn(),
  isDisabled: false,
  isMobileLandscape: false,
};

const setup = (props?: Partial<CameraButtonProps>) => ({
  ...render(<CameraButton {...mockDefaultProps} {...props} />),
});

describe('<CameraButton />', () => {
  test('should show camera button', async () => {
    setup();

    const captureButton = screen.getByTestId(
      CAMERA_BUTTON_TEST_IDS.getCaptureButton(TEST_PREFIX_ID)
    );

    expect(captureButton).toBeVisible();

    await userEvent.click(captureButton);

    expect(mockDefaultProps.handleCapture).toHaveBeenCalled();
  });
});
