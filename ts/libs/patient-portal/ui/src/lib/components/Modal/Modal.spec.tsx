import { render, screen } from '../../../testUtils';
import Modal, { ModalProps } from './Modal';
import { MODAL_TEST_IDS } from './testIds';

const MODAL_CHILDREN_TEST_ID = 'modal-children';

const defaultProps: ModalProps = {
  testIdPrefix: 'modal',
  open: true,
  onClose: vi.fn(),
  children: <div data-testid={MODAL_CHILDREN_TEST_ID}>Modal children</div>,
};

const setup = (props?: Partial<ModalProps>) => {
  return render(<Modal {...defaultProps} {...props} />);
};

describe('<Modal />', () => {
  it('should render correctly', () => {
    setup();

    expect(
      screen.getByTestId(
        MODAL_TEST_IDS.getModalTestId(defaultProps.testIdPrefix)
      )
    ).toBeVisible();

    expect(screen.getByTestId(MODAL_CHILDREN_TEST_ID)).toBeVisible();
  });

  it('should not render if modal is not opened', () => {
    setup({ open: false });

    const modalRoot = screen.queryByTestId(
      MODAL_TEST_IDS.getModalTestId(defaultProps.testIdPrefix)
    );

    const modalChildren = screen.queryByTestId(MODAL_CHILDREN_TEST_ID);

    expect(modalRoot).not.toBeInTheDocument();

    expect(modalChildren).not.toBeInTheDocument();
  });
});
