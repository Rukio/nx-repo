import { screen, render, exactRegexMatch } from '../../../../test/testUtils';
import {
  PatientInfoHeader,
  PatientInfoHeaderProps,
  SIDE_PANEL_HEADER_MOCKED_DATA,
} from '../PatientInfoHeader';
import { PATIENT_INFO_HEADER_TEST_IDS } from '../testIds';

const setup = (props?: Partial<PatientInfoHeaderProps>) =>
  render(<PatientInfoHeader {...SIDE_PANEL_HEADER_MOCKED_DATA} {...props} />);

describe('Header', () => {
  it('Should render correctly', () => {
    setup();

    expect(
      screen.getByTestId(PATIENT_INFO_HEADER_TEST_IDS.CONTAINER)
    ).toBeVisible();
    expect(
      screen.getByTestId(PATIENT_INFO_HEADER_TEST_IDS.NAME)
    ).toHaveTextContent(exactRegexMatch(SIDE_PANEL_HEADER_MOCKED_DATA.name));
    expect(
      screen.getByTestId(PATIENT_INFO_HEADER_TEST_IDS.EHR)
    ).toHaveTextContent(
      exactRegexMatch(`MRN ${SIDE_PANEL_HEADER_MOCKED_DATA.ehrId}`)
    );
    expect(
      screen.getByTestId(PATIENT_INFO_HEADER_TEST_IDS.AGE_AND_SEX)
    ).toHaveTextContent(
      exactRegexMatch(
        `${SIDE_PANEL_HEADER_MOCKED_DATA.age}yo ${SIDE_PANEL_HEADER_MOCKED_DATA.sex}`
      )
    );
    expect(
      screen.getByTestId(PATIENT_INFO_HEADER_TEST_IDS.PHONE_NUMBER)
    ).toHaveTextContent(SIDE_PANEL_HEADER_MOCKED_DATA.phoneNumber);
    expect(
      screen.getByTestId(PATIENT_INFO_HEADER_TEST_IDS.TIME_ZONE_CHIP)
    ).toBeVisible();
  });

  test('should render close button and onclose callback works', async () => {
    const closeButtonlClick = vi.fn();
    const { user } = setup({
      onClose: closeButtonlClick,
    });

    const closeButton = await screen.findByTestId(
      PATIENT_INFO_HEADER_TEST_IDS.CLOSE_BUTTON
    );
    expect(closeButton).toBeVisible();
    await user.click(closeButton);

    expect(closeButtonlClick).toBeCalledTimes(1);
  });

  test('should not render close button if onClose callback is undefined', () => {
    setup();

    expect(
      screen.queryByTestId(PATIENT_INFO_HEADER_TEST_IDS.CLOSE_BUTTON)
    ).not.toBeInTheDocument();
  });
});
