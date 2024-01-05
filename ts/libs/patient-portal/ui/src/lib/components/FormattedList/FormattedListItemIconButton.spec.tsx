import { render, screen } from '../../../testUtils';
import FormattedListItemIconButton from './FormattedListItemIconButton';
import { FORMATTED_LIST_TEST_IDS } from './testIds';

const MOCK_TEST_ID_PREFIX = 'test-id-prefix';
const TEST_ICON_ELEMENT_TEST_ID = 'test-icon-element';

const setup = () =>
  render(
    <FormattedListItemIconButton
      IconElement={() => (
        <span data-testid={TEST_ICON_ELEMENT_TEST_ID}>icon</span>
      )}
      testIdPrefix={MOCK_TEST_ID_PREFIX}
    />
  );

describe('<FormattedListItemIconButton />', () => {
  it('should render correctly', () => {
    setup();

    expect(
      screen.getByTestId(
        FORMATTED_LIST_TEST_IDS.getListItemIconButtonTestId(MOCK_TEST_ID_PREFIX)
      )
    ).toBeVisible();
    expect(screen.getByTestId(TEST_ICON_ELEMENT_TEST_ID)).toBeVisible();
  });
});
