import { render, screen } from '../../../testUtils';
import FormattedListItemButton from './FormattedListItemButton';
import { FORMATTED_LIST_TEST_IDS } from './testIds';

const MOCK_TEST_ID_PREFIX = 'test-id-prefix';

const setup = () =>
  render(<FormattedListItemButton testIdPrefix={MOCK_TEST_ID_PREFIX} />);

describe('<FormattedListItemButton />', () => {
  it('should render correctly', () => {
    setup();

    expect(
      screen.getByTestId(
        FORMATTED_LIST_TEST_IDS.getListItemButtonTestId(MOCK_TEST_ID_PREFIX)
      )
    ).toBeVisible();
  });
});
