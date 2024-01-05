import { render, screen } from '../../../testUtils';
import SelfSchedulingConfirmation, {
  SelfSchedulingConfirmationProps,
} from './SelfSchedulingConfirmation';
import { FORM_HEADER_TEST_IDS } from '../FormHeader';
import { SELF_SCHEDULING_CONFIRMATION_TEST_IDS } from './testIds';

const defaultProps: Required<SelfSchedulingConfirmationProps> = {
  *company-data-covered*PhoneNumber: '333-333-333',
  subtitle: `Your medical team will be out to see you today 10:00 AM and 15:00 PM. Check your text messages to check-in for your appointment and receive status updates.`,
};

const getHeaderTitle = () => screen.getByTestId(FORM_HEADER_TEST_IDS.TITLE);
const getHeaderSubtitle = () =>
  screen.getByTestId(FORM_HEADER_TEST_IDS.SUBTITLE);
const getMedicalConcernsMessage = () =>
  screen.getByTestId(
    SELF_SCHEDULING_CONFIRMATION_TEST_IDS.MEDICAL_CONCERNS_MESSAGE
  );

const setup = (props: Partial<SelfSchedulingConfirmationProps> = {}) =>
  render(<SelfSchedulingConfirmation {...defaultProps} {...props} />);

describe('<SelfSchedulingConfirmation />', () => {
  it('should render correctly', () => {
    setup();

    const title = getHeaderTitle();
    expect(title).toBeVisible();
    expect(title).toHaveTextContent('Appointment confirmed!');

    const subtitle = getHeaderSubtitle();
    expect(subtitle).toBeVisible();
    expect(subtitle).toHaveTextContent(defaultProps.subtitle as string);

    const medicalConcernsMessage = getMedicalConcernsMessage();
    expect(medicalConcernsMessage).toBeVisible();
    expect(medicalConcernsMessage).toHaveTextContent(
      `Medical conditions may change quickly. If you have new or worsening symptoms before our team arrives, please call us at ${defaultProps.*company-data-covered*PhoneNumber}, call 911, or go to the emergency department if you feel that may be necessary.`
    );
  });
});
