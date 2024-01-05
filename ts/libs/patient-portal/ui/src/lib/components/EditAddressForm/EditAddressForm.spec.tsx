import { useForm } from 'react-hook-form';
import { render, renderHook, screen } from '../../../testUtils';
import EditAddressForm, { EditAddressFormProps } from './EditAddressForm';
import { EDIT_ADDRESS_FORM_TEST_IDS } from './testIds';
import { AddressPayload } from '../../types';

const defaultProps: Omit<EditAddressFormProps, 'control'> = {
  handleSubmit: vi.fn((e) => e.preventDefault()),
  handleDelete: vi.fn(),
  isSubmitButtonDisabled: false,
};

const setup = () => {
  const { result } = renderHook(() =>
    useForm<AddressPayload>({
      defaultValues: {
        streetAddress1: '',
        streetAddress2: '',
        locationDetails: '',
        city: '',
        state: '',
        zipCode: '',
      },
    })
  );

  return render(
    <EditAddressForm {...defaultProps} control={result.current.control} />
  );
};

describe('<EditAddressForm />', () => {
  it('should call handle submit when save button pressed', async () => {
    const { user } = setup();
    const submitButton = screen.getByTestId(
      EDIT_ADDRESS_FORM_TEST_IDS.SUBMIT_BUTTON
    );

    await user.click(submitButton);

    expect(defaultProps.handleSubmit).toHaveBeenCalledTimes(1);
  });

  it('should call handle delete when save button pressed', async () => {
    const { user } = setup();
    const deleteButton = screen.getByTestId(
      EDIT_ADDRESS_FORM_TEST_IDS.DELETE_BUTTON
    );

    await user.click(deleteButton);

    expect(defaultProps.handleDelete).toHaveBeenCalledTimes(1);
  });
});
