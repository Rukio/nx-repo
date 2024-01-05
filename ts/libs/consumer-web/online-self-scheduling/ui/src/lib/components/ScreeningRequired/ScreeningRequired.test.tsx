import { render, screen, exactRegexMatch } from '../../../testUtils';
import { ScreeningRequired, ScreeningRequiredProps } from './ScreeningRequired';
import { SCREENING_REQUIRED_TEST_IDS } from './testIds';

const defaultProps: ScreeningRequiredProps = {
  isRelationshipSelf: true,
  phoneNumber: '833-555-2969',
  onClickCall: jest.fn(),
};

const setup = (props: Partial<ScreeningRequiredProps> = {}) =>
  render(<ScreeningRequired {...defaultProps} {...props} />);

describe('<ScreeningRequired />', () => {
  it('should render the ScreeningRequired correctly', () => {
    setup();

    const title = screen.getByTestId(SCREENING_REQUIRED_TEST_IDS.TITLE);
    expect(title).toBeVisible();
    expect(title).toHaveTextContent(
      exactRegexMatch('Our friendly team is standing by')
    );

    const root = screen.getByTestId(SCREENING_REQUIRED_TEST_IDS.ROOT);
    expect(root).toBeVisible();

    const contactUsMessage = screen.getByTestId(
      SCREENING_REQUIRED_TEST_IDS.CONTACT_US_MESSAGE
    );
    expect(contactUsMessage).toBeVisible();
    expect(contactUsMessage).toHaveTextContent(
      exactRegexMatch(
        `To complete your check-in and lock in your appointment time, please call us at ${defaultProps.phoneNumber}.`
      )
    );

    const helpScheduleAppointmentMessage = screen.getByTestId(
      SCREENING_REQUIRED_TEST_IDS.HELP_SCHEDULE_APPOINTMENT_MESSAGE
    );
    expect(helpScheduleAppointmentMessage).toBeVisible();
    expect(helpScheduleAppointmentMessage).toHaveTextContent(
      exactRegexMatch(
        "We know your time is important, and we want to help you schedule your appointment as fast as possible. We're excited to hear from you soon!"
      )
    );

    const callButton = screen.getByTestId(
      SCREENING_REQUIRED_TEST_IDS.CALL_BUTTON
    );
    expect(callButton).toBeVisible();
    expect(callButton).toBeEnabled();
    expect(callButton).toHaveTextContent(exactRegexMatch('Call Now'));
  });

  it('should render the message with relationship to someone else', () => {
    setup({
      isRelationshipSelf: false,
      patientFirstName: 'Hunter',
    });

    const contactUsMessage = screen.getByTestId(
      SCREENING_REQUIRED_TEST_IDS.CONTACT_US_MESSAGE
    );
    expect(contactUsMessage).toBeVisible();
    expect(contactUsMessage).toHaveTextContent(
      exactRegexMatch(
        `To complete your check-in and lock in an appointment time, please call us at ${defaultProps.phoneNumber}.`
      )
    );

    const helpScheduleAppointmentMessage = screen.getByTestId(
      SCREENING_REQUIRED_TEST_IDS.HELP_SCHEDULE_APPOINTMENT_MESSAGE
    );
    expect(helpScheduleAppointmentMessage).toBeVisible();
    expect(helpScheduleAppointmentMessage).toHaveTextContent(
      exactRegexMatch(
        "We know your time is important, and we want to help you schedule Hunter’s appointment as fast as possible. We're excited to hear from you soon!"
      )
    );
  });

  it("should render the message with relationship to someone else and without the patient's name", () => {
    setup({
      isRelationshipSelf: false,
    });

    const contactUsMessage = screen.getByTestId(
      SCREENING_REQUIRED_TEST_IDS.CONTACT_US_MESSAGE
    );
    expect(contactUsMessage).toBeVisible();
    expect(contactUsMessage).toHaveTextContent(
      exactRegexMatch(
        `To complete your check-in and lock in an appointment time, please call us at ${defaultProps.phoneNumber}.`
      )
    );

    const helpScheduleAppointmentMessage = screen.getByTestId(
      SCREENING_REQUIRED_TEST_IDS.HELP_SCHEDULE_APPOINTMENT_MESSAGE
    );
    expect(helpScheduleAppointmentMessage).toBeVisible();
    expect(helpScheduleAppointmentMessage).toHaveTextContent(
      exactRegexMatch(
        "We know your time is important, and we want to help you schedule an appointment as fast as possible. We're excited to hear from you soon!"
      )
    );
  });

  it("should call onClickCall on 'Call Now' button click", async () => {
    const { user } = setup();

    const callButton = screen.getByTestId(
      SCREENING_REQUIRED_TEST_IDS.CALL_BUTTON
    );
    expect(callButton).toBeVisible();
    expect(callButton).toBeEnabled();
    expect(callButton).toHaveTextContent(exactRegexMatch('Call Now'));

    await user.click(callButton);

    expect(defaultProps.onClickCall).toBeCalled();
  });
});
