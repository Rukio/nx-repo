import { render, screen, userEvent } from '../../../../../test-utils';
import { PHOTO_MODAL_TEST_IDS } from './testIds';
import PhotoModal, { PhotoModalProps } from './PhotoModal';

const TEST_PREFIX_ID = 'test';

const mockDefaultProps: PhotoModalProps = {
  isOpen: false,
  testIdPrefix: TEST_PREFIX_ID,
  onClose: jest.fn(),
};

const fakeChildrenTestId = 'fake-children';

const FakeChildren = () => (
  <div data-testid={fakeChildrenTestId}>fake children</div>
);

const setup = (props?: Partial<PhotoModalProps>, shouldHaveChildren = true) => {
  const componentProps = { ...mockDefaultProps, ...props };

  return {
    ...render(
      shouldHaveChildren ? (
        <PhotoModal {...componentProps}>
          <FakeChildren />
        </PhotoModal>
      ) : (
        <PhotoModal {...componentProps} />
      )
    ),
  };
};

describe('<PhotoModal />', () => {
  test('should not show component when isOpen=false', () => {
    setup();

    const photoModal = screen.queryByTestId(
      PHOTO_MODAL_TEST_IDS.getPhotoModalCloseButton(TEST_PREFIX_ID)
    );

    expect(photoModal).not.toBeInTheDocument();
  });

  test('should show component when isOpen=true', async () => {
    setup({ isOpen: true });

    const closeButton = screen.getByTestId(
      PHOTO_MODAL_TEST_IDS.getPhotoModalCloseButton(TEST_PREFIX_ID)
    );

    const fakeChildren = screen.getByTestId(fakeChildrenTestId);

    expect(fakeChildren).toBeVisible();

    expect(closeButton).toBeVisible();
  });

  test('should not have children wrapper without if children is missed', async () => {
    setup({ isOpen: true }, false);

    const childrenWrapper = screen.queryByTestId(
      PHOTO_MODAL_TEST_IDS.getPhotoModalPhotoModalChildrenWrapper(
        TEST_PREFIX_ID
      )
    );

    expect(childrenWrapper).not.toBeInTheDocument();
  });

  test('should call on close handler when press close button', async () => {
    setup({ isOpen: true });

    const closeButton = screen.getByTestId(
      PHOTO_MODAL_TEST_IDS.getPhotoModalCloseButton(TEST_PREFIX_ID)
    );

    await userEvent.click(closeButton);

    expect(mockDefaultProps.onClose).toHaveBeenCalled();
  });
});
