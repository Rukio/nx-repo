import {
  screen,
  render,
  exactRegexMatch,
  within,
} from '../../../../test/testUtils';
import { CREATE_EHR_APPOINTMENT_DIALOG_MOCKED_DATA } from '../EhrAppointment';
import {
  CreateEhrAppointmentDialog,
  CreateEhrAppointmentDialogProps,
} from '../EhrAppointment/CreateEhrAppointmentDialog';
import { CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS } from '../testIds';

const setup = (
  props: Omit<
    CreateEhrAppointmentDialogProps,
    'name' | 'birthDate' | 'age' | 'sex' | 'phoneNumber'
  >
) =>
  render(
    <CreateEhrAppointmentDialog
      {...CREATE_EHR_APPOINTMENT_DIALOG_MOCKED_DATA}
      {...props}
    />
  );

describe('<CreateEhrAppointment />', () => {
  it('should render correctly when New Appointment RadioButton is checked', async () => {
    setup({
      isOpen: true,
      onClose: vi.fn(),
      onSave: vi.fn(),
    });

    expect(
      await screen.findByTestId(CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.CONTENT)
    ).toBeVisible();

    const newAppointmentRadioButton = await screen.findByTestId(
      CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.NEW_APPOINTMENT_RADIO_BUTTON
    );
    expect(within(newAppointmentRadioButton).getByRole('radio')).toBeChecked();

    const existingAppointmentRadioButton = await screen.findByTestId(
      CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.EXISTING_APPOINTMENT_RADIO_BUTTON
    );
    expect(
      within(existingAppointmentRadioButton).getByRole('radio')
    ).not.toBeChecked();

    expect(
      screen.getByTestId(CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.NAME)
    ).toHaveTextContent(
      exactRegexMatch(CREATE_EHR_APPOINTMENT_DIALOG_MOCKED_DATA.name)
    );
    expect(
      screen.getByTestId(CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.AGE_AND_SEX)
    ).toHaveTextContent(
      exactRegexMatch(
        `${CREATE_EHR_APPOINTMENT_DIALOG_MOCKED_DATA.age}yo ${CREATE_EHR_APPOINTMENT_DIALOG_MOCKED_DATA.sex}`
      )
    );
    expect(
      screen.getByTestId(CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.PHONE_NUMBER)
    ).toHaveTextContent(CREATE_EHR_APPOINTMENT_DIALOG_MOCKED_DATA.phoneNumber);

    expect(
      screen.getByTestId(
        CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.APPOINTMENT_TYPE_SELECT
      )
    ).toHaveTextContent('Appointment Type');
    expect(
      screen.getByTestId(
        CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.PLACE_OF_SERVICE_SELECT
      )
    ).toHaveTextContent('Place of Service');
    expect(
      screen.getByTestId(CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.DATE_PICKER)
    ).toBeVisible();
    expect(
      screen.getByTestId(CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.TIME_PICKER)
    ).toBeVisible();

    expect(
      screen.queryByTestId(
        CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.ATHENA_PATIENT_ID_FIELD
      )
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(
        CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.ATHENA_APPOINTMENT_ID_FIELD
      )
    ).not.toBeInTheDocument();
  });

  it('should render correctly when Existing Appointment RadioButton is checked', async () => {
    const { user } = setup({
      isOpen: true,
      onClose: vi.fn(),
      onSave: vi.fn(),
    });

    expect(
      await screen.findByTestId(CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.CONTENT)
    ).toBeVisible();

    const existingAppointmentRadioButton = await screen.findByTestId(
      CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.EXISTING_APPOINTMENT_RADIO_BUTTON
    );
    await user.click(existingAppointmentRadioButton);

    expect(
      within(existingAppointmentRadioButton).getByRole('radio')
    ).toBeChecked();

    const newAppointmentRadioButton = await screen.findByTestId(
      CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.NEW_APPOINTMENT_RADIO_BUTTON
    );

    expect(
      within(newAppointmentRadioButton).getByRole('radio')
    ).not.toBeChecked();

    expect(
      screen.queryByTestId(
        CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.APPOINTMENT_TYPE_SELECT
      )
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(
        CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.PLACE_OF_SERVICE_SELECT
      )
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.DATE_PICKER)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.TIME_PICKER)
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId(
        CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.ATHENA_PATIENT_ID_FIELD
      )
    ).toBeVisible();
    expect(
      screen.getByTestId(
        CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.ATHENA_APPOINTMENT_ID_FIELD
      )
    ).toBeVisible();
  });

  it('should click Close button', async () => {
    const onCloseClick = vi.fn();
    const { user } = setup({
      isOpen: true,
      onClose: onCloseClick,
      onSave: vi.fn(),
    });

    const closeButton = await screen.findByTestId(
      CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.CANCEL_EHR_BUTTON
    );
    expect(closeButton).toBeVisible();
    await user.click(closeButton);
    expect(onCloseClick).toBeCalledTimes(1);
  });
});
