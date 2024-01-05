import { render, screen } from '../../../testUtils';
import SettingsListItem, { SettingsListItemProps } from './SettingsListItem';
import { SETTINGS_LIST_TEST_IDS } from './testIds';

const MOCK_TEST_ID_PREFIX = 'test-id-prefix';

const setup = <T extends boolean>(props?: Partial<SettingsListItemProps<T>>) =>
  render(<SettingsListItem testIdPrefix={MOCK_TEST_ID_PREFIX} {...props} />);

describe('<SettingsListItem />', () => {
  it('should render Informable list item by default', () => {
    setup();

    expect(
      screen.getByTestId(
        SETTINGS_LIST_TEST_IDS.getInformableListItemTestId(MOCK_TEST_ID_PREFIX)
      )
    ).toBeVisible();
  });

  it('should render Editable list item if prop is enabled', () => {
    setup({ editable: true });

    expect(
      screen.getByTestId(
        SETTINGS_LIST_TEST_IDS.getEditableListItemTestId(MOCK_TEST_ID_PREFIX)
      )
    ).toBeVisible();
  });

  it('should render Informable list item if prop is disabled', () => {
    setup({ editable: false });

    expect(
      screen.getByTestId(
        SETTINGS_LIST_TEST_IDS.getInformableListItemTestId(MOCK_TEST_ID_PREFIX)
      )
    ).toBeVisible();
  });
});
