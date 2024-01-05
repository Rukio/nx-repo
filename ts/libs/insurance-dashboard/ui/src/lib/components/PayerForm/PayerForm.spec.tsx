import { render, screen, within } from '../../../testUtils';

import PayerForm, { PayerFormProps } from './PayerForm';
import { PAYER_FORM_TEST_IDS } from './testIds';

const mockedProps: PayerFormProps = {
  payerName: 'Payer',
  active: true,
  payerNotes: 'Some notes',
  onChangeField: vi.fn(),
  onArchive: vi.fn(),
  payerGroups: [
    { payerGroupId: '1', name: 'Group 1' },
    { payerGroupId: '2', name: 'Group 2' },
  ],
  isEditingForm: true,
};

const getPayerNameInput = () =>
  screen.getByTestId(PAYER_FORM_TEST_IDS.PAYER_NAME_INPUT);
const getPayerCheckboxInactive = () =>
  within(
    screen.getByTestId(PAYER_FORM_TEST_IDS.PAYER_STATUS_INACTIVE_RADIO)
  ).getByLabelText('Status inactive');
const getPayerCheckboxActive = () =>
  within(
    screen.getByTestId(PAYER_FORM_TEST_IDS.PAYER_STATUS_ACTIVE_RADIO)
  ).getByLabelText('Status active');
const getPayerGroupSelect = () =>
  screen.getByRole('button', {
    ...screen.getByTestId(PAYER_FORM_TEST_IDS.PAYER_GROUP_SELECT),
    expanded: false,
  });
const findPayerGroupSelectOptions = async () => {
  const presentation = await screen.findByRole('presentation');

  return within(presentation).findAllByTestId(
    new RegExp(PAYER_FORM_TEST_IDS.PAYER_GROUP_SELECT_OPTION_PREFIX)
  );
};
const getPayerNotesInput = () =>
  screen.getByTestId(PAYER_FORM_TEST_IDS.PAYER_NOTES_INPUT);
const getArchivePayerButton = () =>
  screen.getByTestId(PAYER_FORM_TEST_IDS.ARCHIVE_BUTTON);

const setup = (overrideProps: Partial<PayerFormProps> = {}) => {
  return render(<PayerForm {...mockedProps} {...overrideProps} />);
};

describe('<PayerForm />', () => {
  it('should render properly', async () => {
    const { user } = setup();

    const nameInput = getPayerNameInput();
    const payerInactiveCheckBox = getPayerCheckboxInactive();
    const payerActiveCheckbox = getPayerCheckboxActive();
    const payerGroupSelect = getPayerGroupSelect();
    const payerNotesInput = getPayerNotesInput();
    const archiveButton = getArchivePayerButton();

    await user.click(payerGroupSelect);
    const payerGroupSelectOptions = await findPayerGroupSelectOptions();

    expect(nameInput).toHaveValue(mockedProps.payerName);
    expect(payerInactiveCheckBox).not.toBeChecked();
    expect(payerActiveCheckbox).toBeChecked();
    expect(payerNotesInput).toHaveValue(mockedProps.payerNotes);
    expect(archiveButton).toBeVisible();
    payerGroupSelectOptions.forEach((option, index) => {
      expect(option).toHaveTextContent(mockedProps.payerGroups[index].name);
      expect(option).toHaveAttribute(
        'data-value',
        mockedProps.payerGroups[index].payerGroupId
      );
    });
  });

  it('should update form fields value', async () => {
    const { user } = setup({
      payerName: '',
      payerNotes: '',
    });

    const nameInput = getPayerNameInput();
    const payerInactiveCheckBox = getPayerCheckboxInactive();
    const payerGroupSelect = getPayerGroupSelect();
    const payerNotesInput = getPayerNotesInput();

    await user.type(nameInput, '1');
    expect(mockedProps.onChangeField).toHaveBeenCalledWith('name', '1');
    await user.type(payerNotesInput, '1');
    expect(mockedProps.onChangeField).toHaveBeenCalledWith('notes', '1');

    await user.click(payerGroupSelect);
    const payerGroupSelectOptions = await findPayerGroupSelectOptions();

    await user.click(payerGroupSelectOptions[0]);
    expect(mockedProps.onChangeField).toHaveBeenCalledWith(
      'payerGroupId',
      mockedProps.payerGroups[0].payerGroupId
    );

    await user.click(payerInactiveCheckBox);
    expect(mockedProps.onChangeField).toHaveBeenCalledWith('active', false);
  });

  it('should call archive payer', async () => {
    const { user } = setup();

    const archiveButton = getArchivePayerButton();
    await user.click(archiveButton);

    expect(mockedProps.onArchive).toHaveBeenCalledTimes(1);
  });

  it('should render disabled form', () => {
    setup({ disabled: true });

    const nameInput = getPayerNameInput();
    const payerInactiveCheckBox = getPayerCheckboxInactive();
    const payerActiveCheckbox = getPayerCheckboxActive();
    const payerGroupSelect = getPayerGroupSelect();
    const payerNotesInput = getPayerNotesInput();
    const archiveButton = getArchivePayerButton();

    expect(nameInput).toHaveValue(mockedProps.payerName);
    expect(nameInput).toBeDisabled();

    expect(payerInactiveCheckBox).not.toBeChecked();
    expect(payerInactiveCheckBox).toBeDisabled();

    expect(payerActiveCheckbox).toBeChecked();
    expect(payerActiveCheckbox).toBeDisabled();

    expect(payerNotesInput).toHaveValue(mockedProps.payerNotes);
    expect(payerNotesInput).toBeDisabled();

    expect(archiveButton).toBeVisible();
    expect(archiveButton).toBeDisabled();

    expect(payerGroupSelect).toBeVisible();
    // we are not able to use .toBeDisabled here, since it works only with form elements
    // and in the meantime Mui generates button under the hood to work with list.
    expect(payerGroupSelect).toHaveAttribute('aria-disabled', 'true');
  });
});
