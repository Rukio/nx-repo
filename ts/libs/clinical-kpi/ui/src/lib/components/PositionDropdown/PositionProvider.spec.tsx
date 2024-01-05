import { render, screen, within } from '../../../testUtils';
import { PositionDropdown, ProfilePosition } from './PositionDropdown';
import { POSITION_DROPDOWN_TEST_IDS } from './TestIds';

describe('PositionSection', () => {
  it('should render correctly', async () => {
    const onPositionChange = jest.fn();
    const { user } = render(
      <PositionDropdown
        selectedPositionName={ProfilePosition.App}
        onPositionChange={onPositionChange}
      />
    );
    const positionDropdownSelect = within(
      screen.getByTestId(POSITION_DROPDOWN_TEST_IDS.SELECT)
    ).getByRole('button');
    const positionDropdownManagerLabel = screen.getByTestId(
      POSITION_DROPDOWN_TEST_IDS.LABEL
    );
    expect(positionDropdownManagerLabel).toBeVisible();
    await user.click(positionDropdownSelect);
    const dhmtPosition = await screen.findByTestId(
      POSITION_DROPDOWN_TEST_IDS.getSelectItem(ProfilePosition.Dhmt)
    );
    await user.click(dhmtPosition);
    expect(positionDropdownManagerLabel).toBeVisible();
  });

  it('onPositionChange should be called', async () => {
    const onPositionChange = jest.fn();
    const { user } = render(
      <PositionDropdown
        selectedPositionName={ProfilePosition.App}
        onPositionChange={onPositionChange}
      />
    );
    const positionDropdownSelect = within(
      screen.getByTestId(POSITION_DROPDOWN_TEST_IDS.SELECT)
    ).getByRole('button');
    await user.click(positionDropdownSelect);
    const dhmtPosition = await screen.findByTestId(
      POSITION_DROPDOWN_TEST_IDS.getSelectItem(ProfilePosition.Dhmt)
    );
    await user.click(dhmtPosition);
    expect(onPositionChange).toBeCalledWith(ProfilePosition.Dhmt);
  });
});
