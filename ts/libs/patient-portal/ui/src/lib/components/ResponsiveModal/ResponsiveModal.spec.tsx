import { render, screen } from '../../../testUtils';
import * as designSystem from '@*company-data-covered*/design-system';
import { mocked } from 'jest-mock';
import ResponsiveModal, { ResponsiveModalProps } from './ResponsiveModal';
import { RESPONSIVE_MODAL_TEST_IDS } from './testIds';
import { MODAL_TEST_IDS } from '../Modal';
import { DRAWER_TEST_IDS } from '../Drawer';

const RESPONSIVE_MODAL_CHILDREN_TEST_ID = 'modal-children';

const defaultProps: ResponsiveModalProps = {
  testIdPrefix: 'responsive-modal',
  open: true,
  title: 'Modal title',
  onClose: vi.fn(),
  children: (
    <div data-testid={RESPONSIVE_MODAL_CHILDREN_TEST_ID}>Modal children</div>
  ),
};

vi.mock('@*company-data-covered*/design-system', async () => {
  const actual = await vi.importActual<typeof designSystem>(
    '@*company-data-covered*/design-system'
  );

  return {
    ...actual,
    useMediaQuery: vi.fn(),
  };
});

const mockUseMediaQuery = mocked(designSystem.useMediaQuery);

const setup = (props?: Partial<ResponsiveModalProps>) => {
  return render(<ResponsiveModal {...defaultProps} {...props} />);
};

describe('<ResponsiveModal />', () => {
  it('should render correctly', () => {
    setup();

    const modalTitle = screen.getByTestId(
      RESPONSIVE_MODAL_TEST_IDS.getResponsiveModalTitleTestId(
        defaultProps.testIdPrefix
      )
    );

    expect(modalTitle).toBeVisible();
    expect(modalTitle).toHaveTextContent(defaultProps.title);

    expect(
      screen.getByTestId(
        RESPONSIVE_MODAL_TEST_IDS.getResponsiveCloseButtonTestId(
          defaultProps.testIdPrefix
        )
      )
    ).toBeVisible();

    expect(screen.getByTestId(RESPONSIVE_MODAL_CHILDREN_TEST_ID)).toBeVisible();
  });

  it('should render desktop variant', () => {
    mockUseMediaQuery.mockReturnValue(false);
    setup();

    expect(screen.getByTestId(RESPONSIVE_MODAL_CHILDREN_TEST_ID)).toBeVisible();

    expect(
      screen.getByTestId(
        MODAL_TEST_IDS.getModalTestId(defaultProps.testIdPrefix)
      )
    ).toBeVisible();

    expect(
      screen.queryByTestId(
        DRAWER_TEST_IDS.getDrawerTestId(defaultProps.testIdPrefix)
      )
    ).not.toBeInTheDocument();
  });

  it('should render mobile variant', () => {
    mockUseMediaQuery.mockReturnValue(true);
    setup();

    expect(screen.getByTestId(RESPONSIVE_MODAL_CHILDREN_TEST_ID)).toBeVisible();

    expect(
      screen.getByTestId(
        DRAWER_TEST_IDS.getDrawerTestId(defaultProps.testIdPrefix)
      )
    ).toBeVisible();

    expect(
      screen.queryByTestId(
        MODAL_TEST_IDS.getModalTestId(defaultProps.testIdPrefix)
      )
    ).not.toBeInTheDocument();
  });
});
