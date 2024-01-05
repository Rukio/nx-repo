import { act, renderHook, waitFor } from '../../../testUtils';
import { useCreditCardForm, UseCreditCardFormProps } from './useCreditCardForm';

const mockUseCreditCardFormProps: UseCreditCardFormProps = {
  formFields: {
    nameOnCard: '',
    creditCardNumber: '',
    creditCardExpiration: '',
    creditCardCVV: '',
    billingAddress: '',
    billingZipCode: '',
    saveCardOnFile: false,
  },
  setFormFields: vi.fn(),
};

const setup = (props: Partial<UseCreditCardFormProps> = {}) =>
  renderHook(() =>
    useCreditCardForm({ ...mockUseCreditCardFormProps, ...props })
  );

describe('useCreditCardForm', () => {
  it('should call setFormFields on onFieldChange', () => {
    const { result } = setup();
    const { onFieldChange } = result.current;

    onFieldChange('nameOnCard', 'test');

    expect(mockUseCreditCardFormProps.setFormFields).toBeCalledWith(
      expect.any(Function)
    );
  });

  it('should change fieldValidations on onFieldBlur call', async () => {
    const { result } = setup({
      formFields: {
        ...mockUseCreditCardFormProps.formFields,
        nameOnCard: 'Test',
      },
    });

    act(() => {
      result.current.onFieldBlur('nameOnCard');
    });

    await waitFor(() => {
      expect(result.current.fieldValidations).toEqual(
        expect.objectContaining({
          nameOnCard: { isValid: true, errorMessage: '' },
        })
      );
    });
  });
});
