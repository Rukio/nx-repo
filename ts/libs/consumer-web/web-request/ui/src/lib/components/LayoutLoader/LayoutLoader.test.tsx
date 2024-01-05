import { render, screen } from '../../../testUtils';
import LayoutLoader from './LayoutLoader';
import { LAYOUT_LOADER_TEST_IDS } from './testIds';

describe('<LayoutLoader />', () => {
  it('should render correctly', () => {
    render(<LayoutLoader />);

    const root = screen.getByTestId(LAYOUT_LOADER_TEST_IDS.ROOT);
    expect(root).toBeVisible();

    const circularProgress = screen.getByTestId(
      LAYOUT_LOADER_TEST_IDS.CIRCULAR_PROGRESS
    );
    expect(circularProgress).toBeVisible();
  });
});
