import { render, screen } from '../../../testUtils';
import Drawer, { DrawerProps } from './Drawer';
import { DRAWER_TEST_IDS } from './testIds';

const DRAWER_CHILDREN_TEST_ID = 'modal-children';

const defaultProps: DrawerProps = {
  testIdPrefix: 'drawer',
  open: true,
  onClose: vi.fn(),
  children: <div data-testid={DRAWER_CHILDREN_TEST_ID}>Drawer children</div>,
};

const setup = (props?: Partial<DrawerProps>) => {
  return render(<Drawer {...defaultProps} {...props} />);
};

describe('<Drawer />', () => {
  it('should render correctly', () => {
    setup();

    expect(
      screen.getByTestId(
        DRAWER_TEST_IDS.getDrawerTestId(defaultProps.testIdPrefix)
      )
    ).toBeVisible();

    expect(screen.getByTestId(DRAWER_CHILDREN_TEST_ID)).toBeVisible();
  });

  it('should not render if drawer is not opened', () => {
    setup({ open: false });

    const drawerRoot = screen.queryByTestId(
      DRAWER_TEST_IDS.getDrawerTestId(defaultProps.testIdPrefix)
    );

    const drawerChildren = screen.queryByTestId(DRAWER_CHILDREN_TEST_ID);

    expect(drawerRoot).not.toBeInTheDocument();

    expect(drawerChildren).not.toBeInTheDocument();
  });
});
