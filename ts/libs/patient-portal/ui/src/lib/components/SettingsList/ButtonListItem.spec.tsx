import { render, screen } from '../../../testUtils';
import ButtonListItem from './ButtonListItem';
import { SETTINGS_LIST_TEST_IDS } from './testIds';

const MOCK_TEST_ID_PREFIX = 'test-id-prefix';

const setup = () =>
  render(<ButtonListItem testIdPrefix={MOCK_TEST_ID_PREFIX} />);

describe('<ButtonListItem />', () => {
  it('should render correctly', () => {
    setup();

    expect(
      screen.getByTestId(
        SETTINGS_LIST_TEST_IDS.getButtonListItemRootTestId(MOCK_TEST_ID_PREFIX)
      )
    ).toBeVisible();
    expect(
      screen.getByTestId(
        SETTINGS_LIST_TEST_IDS.getButtonListItemButtonTestId(
          MOCK_TEST_ID_PREFIX
        )
      )
    ).toBeVisible();
  });
});
