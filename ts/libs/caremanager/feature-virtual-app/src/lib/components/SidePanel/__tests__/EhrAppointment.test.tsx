import { screen, render } from '../../../../test/testUtils';
import {
  EHR_APPOINTMENT_MOCK,
  EhrAppointment,
  EhrAppointmentProps,
} from '../EhrAppointment';
import { EHR_APPOINTMENT_TEST_IDS } from '../testIds';

const setup = (props?: EhrAppointmentProps) =>
  render(<EhrAppointment {...props} />);

describe('EhrAppointment', () => {
  it('should render correctly when EHR is created', () => {
    setup(EHR_APPOINTMENT_MOCK);

    expect(
      screen.getByTestId(EHR_APPOINTMENT_TEST_IDS.CONTAINER)
    ).toBeVisible();

    expect(
      screen.getByTestId(EHR_APPOINTMENT_TEST_IDS.EHR_DETAILS)
    ).toBeVisible();
  });

  it('should render Create EHR button', async () => {
    setup();

    expect(
      screen.getByTestId(EHR_APPOINTMENT_TEST_IDS.CONTAINER)
    ).toBeVisible();

    expect(
      screen.getByTestId(EHR_APPOINTMENT_TEST_IDS.CREATE_EHR_BUTTON)
    ).toBeVisible();
  });
});
