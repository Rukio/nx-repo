import { render, screen } from '../../../testUtils';
import InformableFormattedListItem, {
  InformableFormattedListItemProps,
} from './InformableFormattedListItem';
import { SETTINGS_LIST_TEST_IDS } from './testIds';

const MOCK_TEST_ID_PREFIX = 'test-id-prefix';

const setup = (props?: Partial<InformableFormattedListItemProps>) =>
  render(
    <InformableFormattedListItem
      testIdPrefix={MOCK_TEST_ID_PREFIX}
      {...props}
    />
  );

describe('<InformableFormattedListItem />', () => {
  it('should render correctly', () => {
    setup();

    expect(
      screen.getByTestId(
        SETTINGS_LIST_TEST_IDS.getInformableListItemTestId(MOCK_TEST_ID_PREFIX)
      )
    ).toBeVisible();
    expect(
      screen.getByTestId(
        SETTINGS_LIST_TEST_IDS.getInformableListItemInfoButtonTestId(
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
        SETTINGS_LIST_TEST_IDS.getInformableListItemInfoButtonTestId(
          MOCK_TEST_ID_PREFIX
        )
      )
    );

    expect(onClickHandler).toHaveBeenCalled();
  });
});
