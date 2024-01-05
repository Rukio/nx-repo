import { render, screen } from '../../../../../test-utils';
import { PHOTO_MODAL_TEST_IDS } from '../PhotoModal/testIds';
import ImageConfirmation, { ImageConfirmationProps } from './ImageConfirmation';
import { IMAGE_CONFIRMATION_TEST_IDS } from './testIds';

const TEST_PREFIX_ID = 'test';

const mockDefaultProps: Required<
  Omit<
    ImageConfirmationProps,
    'retakeButtonText' | 'confirmationButtonText' | 'emptyObjectUrlText'
  >
> = {
  isOpen: true,
  onClose: jest.fn(),
  onRetake: jest.fn(),
  onConfirm: jest.fn(),
  objectUrl: 'mock-image-confirmation-objectUrl',
  topText: 'Image Confirmation top text',
  testIdPrefix: TEST_PREFIX_ID,
  type: 'image',
};

const setup = (props?: Partial<ImageConfirmationProps>) =>
  render(<ImageConfirmation {...mockDefaultProps} {...props} />);

describe('<ImageConfirmation />', () => {
  test('should render correctly', () => {
    const retakeButtonText = 'Retake';
    const confirmationButtonText = 'Continue';
    setup({ retakeButtonText, confirmationButtonText });

    const topText = screen.getByTestId(
      IMAGE_CONFIRMATION_TEST_IDS.getImageConfirmationTopText(TEST_PREFIX_ID)
    );

    expect(topText).toBeVisible();
    expect(topText).toHaveTextContent(mockDefaultProps.topText);

    const retakeButton = screen.getByTestId(
      IMAGE_CONFIRMATION_TEST_IDS.getImageConfirmationRetakeButton(
        TEST_PREFIX_ID
      )
    );

    expect(retakeButton).toBeVisible();
    expect(retakeButton).toHaveTextContent(retakeButtonText);

    const confirmationButton = screen.getByTestId(
      IMAGE_CONFIRMATION_TEST_IDS.getImageConfirmationButton(TEST_PREFIX_ID)
    );

    expect(confirmationButton).toBeVisible();
    expect(confirmationButton).toHaveTextContent(confirmationButtonText);
  });

  test('should call handlers properly', async () => {
    const { user } = setup();

    const retakeButton = screen.getByTestId(
      IMAGE_CONFIRMATION_TEST_IDS.getImageConfirmationRetakeButton(
        TEST_PREFIX_ID
      )
    );

    await user.click(retakeButton);

    expect(mockDefaultProps.onRetake).toHaveBeenCalledTimes(1);

    const confirmationButton = screen.getByTestId(
      IMAGE_CONFIRMATION_TEST_IDS.getImageConfirmationButton(TEST_PREFIX_ID)
    );

    await user.click(confirmationButton);

    expect(mockDefaultProps.onConfirm).toHaveBeenCalledTimes(1);

    const closeButton = screen.getByTestId(
      PHOTO_MODAL_TEST_IDS.getPhotoModalCloseButton(TEST_PREFIX_ID)
    );

    await user.click(closeButton);

    expect(mockDefaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  test('should display image placeholder when objectUrl is empty', async () => {
    setup({ objectUrl: null });

    const confirmationImage = screen.queryByTestId(
      IMAGE_CONFIRMATION_TEST_IDS.getImageConfirmationImage(TEST_PREFIX_ID)
    );

    const confirmationImagePlaceholder = screen.getByTestId(
      IMAGE_CONFIRMATION_TEST_IDS.getImageConfirmationImagePlaceholder(
        TEST_PREFIX_ID
      )
    );

    expect(confirmationImage).not.toBeInTheDocument();

    expect(confirmationImagePlaceholder).toBeVisible();
  });
});
