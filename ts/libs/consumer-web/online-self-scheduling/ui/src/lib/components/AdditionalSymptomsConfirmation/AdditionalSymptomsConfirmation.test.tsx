import { FieldValues, useForm } from 'react-hook-form';
import { render, renderHook, screen, within } from '../../../testUtils';
import AdditionalSymptomsConfirmation, {
  AdditionalSymptomsConfirmationProps,
} from './AdditionalSymptomsConfirmation';
import { ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS } from './testIds';

const defaultProps: Omit<
  AdditionalSymptomsConfirmationProps,
  'formFieldName' | 'formControl'
> = {
  symptomsList: [
    'Severe headaches',
    'Difficulty breathing',
    'Chest pain',
    'Fainting',
    'Seizures',
    'Uncontrolled or unexplained bleeding',
    'Stroke symptoms',
    'Pregnancy concerns',
    'Problems after surgery',
    'Rapidly worsening symptoms',
  ],
  alertMessage:
    'If the patient is experiencing any of the following symptoms, please call 911 or a doctor.',
  checkboxLabel:
    'The patient is not experiencing any of these additional symptoms.',
};

const setup = (
  props: Partial<AdditionalSymptomsConfirmationProps> = {},
  formFieldValues: FieldValues = {}
) => {
  const { result } = renderHook(() =>
    useForm<FieldValues>({ values: formFieldValues })
  );

  return render(
    <AdditionalSymptomsConfirmation
      {...defaultProps}
      {...props}
      formControl={result.current.control}
      formFieldName="test"
    />
  );
};

describe('<AdditionalSymptomsConfirmation />', () => {
  it('should correctly display additional symptoms confirmation section', () => {
    setup();

    const section = screen.getByTestId(
      ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS.ROOT
    );
    expect(section).toBeVisible();

    const title = screen.getByTestId(
      ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS.TITLE
    );
    expect(title).toBeVisible();
    expect(title).toHaveTextContent(defaultProps.alertMessage);

    const list = screen.getByTestId(
      ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS.LIST
    );
    expect(list).toBeVisible();

    defaultProps.symptomsList.forEach((symptom) => {
      const listItem = screen.getByTestId(
        ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS.getListItem(symptom)
      );
      expect(listItem).toBeVisible();
      expect(listItem).toHaveTextContent(symptom);
    });

    const checkboxFormControl = screen.getByTestId(
      ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS.CHECKBOX_FORM_CONTROL
    );
    expect(checkboxFormControl).toBeVisible();
    expect(checkboxFormControl).toHaveTextContent(defaultProps.checkboxLabel);

    const checkboxField = screen.getByTestId(
      ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS.CHECKBOX_FIELD
    );
    expect(checkboxField).toBeVisible();

    const checkboxInput = within(checkboxField).getByRole('checkbox');
    expect(checkboxInput).not.toBeChecked();
  });

  it('should display the checked checkbox by default', () => {
    setup({}, { test: true });

    const checkboxField = screen.getByTestId(
      ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS.CHECKBOX_FIELD
    );
    expect(checkboxField).toBeVisible();

    const checkboxInput = within(checkboxField).getByRole('checkbox');
    expect(checkboxInput).toBeChecked();
  });
});
