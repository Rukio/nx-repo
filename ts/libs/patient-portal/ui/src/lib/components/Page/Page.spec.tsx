import { render, screen } from '../../../testUtils';
import Page from './Page';
import { PAGE_TEST_IDS } from './testIds';

const TEST_PREFIX_ID = 'test-page';

const setup = () => render(<Page testIdPrefix={TEST_PREFIX_ID} />);

describe('<Page />', () => {
  it('should render correctly', () => {
    setup();

    expect(
      screen.getByTestId(PAGE_TEST_IDS.getPageTestId(TEST_PREFIX_ID))
    ).toBeVisible();
  });
});
