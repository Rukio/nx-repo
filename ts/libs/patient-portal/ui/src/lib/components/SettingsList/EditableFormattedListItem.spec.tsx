import { render, screen } from '../../../testUtils';
import EditableFormattedListItem, {
  EditableFormattedListItemProps,
} from './EditableFormattedListItem';
import { SETTINGS_LIST_TEST_IDS } from './testIds';

const MOCK_TEST_ID_PREFIX = 'test-id-prefix';

const setup = (props?: Partial<EditableFormattedListItemProps>) =>
  render(
    <EditableFormattedListItem testIdPrefix={MOCK_TEST_ID_PREFIX} {...props} />
  );

describe('<EditableFormattedListItem />', () => {
  it('should render correctly', () => {
    setup();

    expect(
      screen.getByTestId(
        SETTINGS_LIST_TEST_IDS.getEditableListItemTestId(MOCK_TEST_ID_PREFIX)
      )
    ).toBeVisible();
    expect(
      screen.getByTestId(
        SETTINGS_LIST_TEST_IDS.getEditableListItemEditButtonTestId(
          MOCK_TEST_ID_PREFIX
        )
      )
    ).toBeVisible();
  });

  it('should call handler on click', async () => {
    const onClickHandler = vi.fn();

    const { user } = setup({ onClick: onClickHandler });

    await user.click(
      screen.getByTestId(
        SETTINGS_LIST_TEST_IDS.getEditableListItemEditButtonTestId(
          MOCK_TEST_ID_PREFIX
        )
      )
    );

    expect(onClickHandler).toHaveBeenCalled();
  });
});
