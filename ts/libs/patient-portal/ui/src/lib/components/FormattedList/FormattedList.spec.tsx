import { render, screen } from '../../../testUtils';
import FormattedList from './FormattedList';
import { FORMATTED_LIST_TEST_IDS } from './testIds';

const MOCK_TEST_ID_PREFIX = 'test-id-prefix';
const CHILD_TEST_ID_1 = 'child-test-id-1';
const CHILD_TEST_ID_2 = 'child-test-id-2';

const setup = () =>
  render(
    <FormattedList testIdPrefix={MOCK_TEST_ID_PREFIX}>
      <span data-testid={CHILD_TEST_ID_1}>test item 1</span>
      <li data-testid={CHILD_TEST_ID_2}>test item 2</li>
    </FormattedList>
  );

describe('<FormattedList />', () => {
  it('should render correctly', () => {
    setup();

    expect(
      screen.getByTestId(
        FORMATTED_LIST_TEST_IDS.getListRootTestId(MOCK_TEST_ID_PREFIX)
      )
    ).toBeVisible();
    expect(
      screen.getByTestId(
        FORMATTED_LIST_TEST_IDS.getListRootTestId(MOCK_TEST_ID_PREFIX)
      ).children
    ).toHaveLength(2);
    expect(screen.getByTestId(CHILD_TEST_ID_1)).toBeVisible();
    expect(screen.getByTestId(CHILD_TEST_ID_2)).toBeVisible();
  });
});
