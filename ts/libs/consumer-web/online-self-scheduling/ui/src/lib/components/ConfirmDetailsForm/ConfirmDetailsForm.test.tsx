import { render, renderHook, screen } from '../../../testUtils';
import {
  ConfirmDetailsForm,
  ConfirmDetailsFormFieldValues,
  ConfirmDetailsFormProps,
  Details,
  DetailsSection,
} from './ConfirmDetailsForm';
import { CONFIRM_DETAILS_FORM_TEST_IDS } from './testIds';
import { FORM_HEADER_TEST_IDS } from '../FormHeader';
import { FORM_FOOTER_TEST_IDS } from '../FormFooter';
import { useForm } from 'react-hook-form';

const mockDetailsItem: Details = { label: 'Test', value: 'test' };

const defaultProps: Omit<ConfirmDetailsFormProps, 'formControl'> = {
  formHeaderSubtitle:
    'One last step! Please review your details below before booking your appointment.',
  aboutYouDetails: [],
  primaryInsuranceDetails: [mockDetailsItem],
  secondaryInsuranceDetails: [mockDetailsItem],
  appointmentDetails: [],
  onEditDetails: jest.fn(),
  isSubmitButtonDisabled: false,
  onSubmit: jest.fn(),
};

const setup = (props: Partial<ConfirmDetailsFormProps> = {}) => {
  const { result } = renderHook(() =>
    useForm<ConfirmDetailsFormFieldValues>({
      values: { isConsented: true },
    })
  );

  return render(
    <ConfirmDetailsForm
      formControl={result.current.control}
      {...defaultProps}
      {...props}
    />
  );
};

describe('<ConfirmDetailsForm />', () => {
  it('should correctly display confirm details form', () => {
    setup();

    const headerTitle = screen.getByTestId(FORM_HEADER_TEST_IDS.TITLE);
    expect(headerTitle).toBeVisible();
    expect(headerTitle).toHaveTextContent('Confirm appointment details');

    const headerSubtitle = screen.getByTestId(FORM_HEADER_TEST_IDS.SUBTITLE);
    expect(headerSubtitle).toBeVisible();
    expect(headerSubtitle).toHaveTextContent(defaultProps.formHeaderSubtitle);

    const confirmDetailsForm = screen.getByTestId(
      CONFIRM_DETAILS_FORM_TEST_IDS.ROOT
    );
    expect(confirmDetailsForm).toBeVisible();

    const aboutYouDetailsSection = screen.getByTestId(
      CONFIRM_DETAILS_FORM_TEST_IDS.getDetailsSection(DetailsSection.AboutYou)
    );
    expect(aboutYouDetailsSection).toBeVisible();

    const aboutPatientDetailsSection = screen.queryByTestId(
      CONFIRM_DETAILS_FORM_TEST_IDS.getDetailsSection(
        DetailsSection.AboutPatient
      )
    );
    expect(aboutPatientDetailsSection).not.toBeInTheDocument();

    const primaryInsuranceDetailsSection = screen.getByTestId(
      CONFIRM_DETAILS_FORM_TEST_IDS.getDetailsSection(
        DetailsSection.PrimaryInsurance
      )
    );
    expect(primaryInsuranceDetailsSection).toBeVisible();

    const secondaryInsuranceDetailsSection = screen.getByTestId(
      CONFIRM_DETAILS_FORM_TEST_IDS.getDetailsSection(
        DetailsSection.SecondaryInsurance
      )
    );
    expect(secondaryInsuranceDetailsSection).toBeVisible();

    const appointmentDetailsSection = screen.getByTestId(
      CONFIRM_DETAILS_FORM_TEST_IDS.getDetailsSection(
        DetailsSection.Appointment
      )
    );
    expect(appointmentDetailsSection).toBeVisible();

    const confirmSection = screen.getByTestId(
      CONFIRM_DETAILS_FORM_TEST_IDS.CONFIRM_SECTION
    );
    expect(confirmSection).toBeVisible();

    const continueButton = screen.getByTestId(
      FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON
    );
    expect(continueButton).toBeVisible();
    expect(continueButton).toHaveTextContent('Book Appointment');
  });

  it('should correctly display loading submit button', () => {
    setup({ isSubmitButtonLoading: true });

    const submitButton = screen.getByTestId(FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON);
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeDisabled();
  });

  it('should correctly display confirm section', () => {
    setup();

    const confirmSection = screen.getByTestId(
      CONFIRM_DETAILS_FORM_TEST_IDS.CONFIRM_SECTION
    );
    expect(confirmSection).toBeVisible();

    const checkboxControlLabel = screen.getByTestId(
      CONFIRM_DETAILS_FORM_TEST_IDS.CHECKBOX_CONTROL_LABEL
    );
    expect(checkboxControlLabel).toBeVisible();
    expect(checkboxControlLabel).toHaveTextContent(
      'By checking this box, you confirm:'
    );

    const checkboxInput = screen.getByTestId(
      CONFIRM_DETAILS_FORM_TEST_IDS.CHECKBOX_INPUT
    );
    expect(checkboxInput).toBeVisible();

    const confirmSectionList = screen.getByTestId(
      CONFIRM_DETAILS_FORM_TEST_IDS.LIST
    );
    expect(confirmSectionList).toBeVisible();

    const expectListItems = [
      'You are over the age of 21',
      "You agree to *company-data-covered*'s Privacy Policy and Terms of Service",
      'You agree to receive automated SMS notifications and phone calls/voicemails about the appointment at the phone numbers provided',
    ];

    expectListItems.forEach((item) => {
      expect(confirmSectionList).toHaveTextContent(item);
    });
  });

  it.each([
    {
      name: 'About You section',
      detailsPropsName: 'aboutYouDetails',
      section: DetailsSection.AboutYou,
      sectionTitle: 'About You',
    },
    {
      name: 'About the Patient section',
      detailsPropsName: 'aboutPatientDetails',
      section: DetailsSection.AboutPatient,
      sectionTitle: 'About the Patient',
    },
    {
      name: 'Primary insurance section',
      detailsPropsName: 'primaryInsuranceDetails',
      section: DetailsSection.PrimaryInsurance,
      sectionTitle: 'Insurance',
    },
    {
      name: 'Appointment section',
      detailsPropsName: 'appointmentDetails',
      section: DetailsSection.Appointment,
      sectionTitle: 'Appointment Details',
    },
  ])(
    `should display the details for $name`,
    async ({ detailsPropsName, section, sectionTitle }) => {
      const mockDetails: Details[] = [
        { label: 'label1', value: 'value1' },
        { label: 'label2', value: 'value2' },
        { label: 'label3', value: 'value3' },
      ];

      const { user } = setup({
        [detailsPropsName]: mockDetails,
        isEditingEnabled: true,
      });

      const detailsSection = screen.getByTestId(
        CONFIRM_DETAILS_FORM_TEST_IDS.getDetailsSection(section)
      );
      expect(detailsSection).toBeVisible();
      expect(detailsSection).toHaveTextContent(sectionTitle);

      const editButton = screen.getByTestId(
        CONFIRM_DETAILS_FORM_TEST_IDS.getDetailsItemEditButton(section)
      );
      expect(editButton).toBeVisible();

      await user.click(editButton);

      expect(defaultProps.onEditDetails).toBeCalledWith(section);

      mockDetails.forEach((item) => {
        const detailsItemLabel = screen.getByTestId(
          CONFIRM_DETAILS_FORM_TEST_IDS.getDetailsItemLabel(section, item.label)
        );
        expect(detailsItemLabel).toBeVisible();
        expect(detailsItemLabel).toHaveTextContent(item.label);

        const detailsItemValue = screen.getByTestId(
          CONFIRM_DETAILS_FORM_TEST_IDS.getDetailsItemValue(section, item.value)
        );
        expect(detailsItemValue).toBeVisible();
        expect(detailsItemValue).toHaveTextContent(item.value);
      });
    }
  );

  it('should not display edit button if isEditingEnabled is truthy', () => {
    setup({
      aboutYouDetails: [{ label: 'label1', value: 'value1' }],
    });

    const detailsSection = screen.getByTestId(
      CONFIRM_DETAILS_FORM_TEST_IDS.getDetailsSection(DetailsSection.AboutYou)
    );
    expect(detailsSection).toBeVisible();

    const editButton = screen.queryByTestId(
      CONFIRM_DETAILS_FORM_TEST_IDS.getDetailsItemEditButton(
        DetailsSection.AboutYou
      )
    );
    expect(editButton).not.toBeInTheDocument();
  });

  it('should call onSubmit on continue button click', async () => {
    const { user } = setup();

    const continueButton = screen.getByTestId(
      FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON
    );
    expect(continueButton).toBeVisible();
    expect(continueButton).toBeEnabled();

    await user.click(continueButton);

    expect(defaultProps.onSubmit).toBeCalled();
  });
});
