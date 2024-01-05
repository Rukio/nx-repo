import { render, screen } from '../../../testUtils';
import FormattedListItem, { FormattedListItemProps } from './FormattedListItem';
import { FORMATTED_LIST_TEST_IDS } from './testIds';

const MOCK_TEST_ID_PREFIX = 'test-id-prefix';

const setup = (props?: Partial<FormattedListItemProps>) =>
  render(<FormattedListItem testIdPrefix={MOCK_TEST_ID_PREFIX} {...props} />);

describe('<FormattedListItem />', () => {
  it('should render correctly', () => {
    setup();

    expect(
      screen.getByTestId(
        FORMATTED_LIST_TEST_IDS.getListItemTestId(MOCK_TEST_ID_PREFIX)
      )
    ).toBeVisible();
    expect(
      screen.getByTestId(
        FORMATTED_LIST_TEST_IDS.getListItemChildrenContainerTestId(
          MOCK_TEST_ID_PREFIX
        )
      )
    ).toBeVisible();
  });

  it('should render title', () => {
    const TITLE = 'TEST_TITLE';
    setup({ title: TITLE });

    expect(
      screen.getByTestId(
        FORMATTED_LIST_TEST_IDS.getListItemTitleTestId(MOCK_TEST_ID_PREFIX)
      )
    ).toHaveTextContent(TITLE);
  });

  it('should render action', () => {
    const ACTION_TEST_ID = 'test-action';
    setup({ action: <button data-testid={ACTION_TEST_ID} /> });

    expect(screen.getByTestId(ACTION_TEST_ID)).toBeVisible();
  });
});
