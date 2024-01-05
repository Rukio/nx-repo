import { useForm } from 'react-hook-form';
import { render, renderHook, screen } from '../../../testUtils';
import CreateAddressForm, { CreateAddressFormProps } from './CreateAddressForm';
import { CREATE_ADDRESS_FORM_TEST_IDS } from './testIds';
import { AddressPayload } from '../../types';

const defaultProps: Omit<CreateAddressFormProps, 'control'> = {
  handleSubmit: vi.fn((e) => e.preventDefault()),
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
    <CreateAddressForm {...defaultProps} control={result.current.control} />,
    { withRouter: true }
  );
};

describe('<CreateAddressForm />', () => {
  it('should call handle submit when save button pressed', async () => {
    const { user } = setup();
    const submitButton = screen.getByTestId(
      CREATE_ADDRESS_FORM_TEST_IDS.SUBMIT_BUTTON
    );

    await user.click(submitButton);

    expect(defaultProps.handleSubmit).toHaveBeenCalledTimes(1);
  });
});
