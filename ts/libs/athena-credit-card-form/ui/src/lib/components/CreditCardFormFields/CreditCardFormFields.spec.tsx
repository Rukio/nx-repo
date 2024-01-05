import { render, screen, waitFor } from '../../../testUtils';
import CreditCardFormFields, {
  CreditCardFormFieldsProps,
} from './CreditCardFormFields';
import { CREDIT_CARD_FORM_FIELDS_TEST_IDS } from './testIds';

const defaultProps: CreditCardFormFieldsProps = {
  onFieldChange: vi.fn(),
  onFieldBlur: vi.fn(),
};

const setup = (props: Partial<CreditCardFormFieldsProps> = {}) => {
  const { user, ...wrapper } = render(
    <CreditCardFormFields {...defaultProps} {...props} />
  );

  const getNameOnCardTextField = () =>
    screen.getByTestId(
      CREDIT_CARD_FORM_FIELDS_TEST_IDS.NAME_ON_CARD_TEXT_FIELD
    );

  const getCreditCardNumberTextField = () =>
    screen.getByTestId(
      CREDIT_CARD_FORM_FIELDS_TEST_IDS.CREDIT_CARD_NUMBER_TEXT_FIELD
    );

  const getCreditCardExpirationTextField = () =>
    screen.getByTestId(
      CREDIT_CARD_FORM_FIELDS_TEST_IDS.CREDIT_CARD_EXPIRATION_TEXT_FIELD
    );

  const getCreditCardCVVTextField = () =>
    screen.getByTestId(
      CREDIT_CARD_FORM_FIELDS_TEST_IDS.CREDIT_CARD_CVV_TEXT_FIELD
    );

  const getBillingZipCodeTextField = () =>
    screen.getByTestId(
      CREDIT_CARD_FORM_FIELDS_TEST_IDS.BILLING_ZIP_CODE_TEXT_FIELD
    );

  return {
    user,
    ...wrapper,
    getNameOnCardTextField,
    getCreditCardNumberTextField,
    getCreditCardExpirationTextField,
    getCreditCardCVVTextField,
    getBillingZipCodeTextField,
  };
};

describe('CreditCardFormFields', () => {
  it('should render form fields without "Save this card on file?" checkbox', () => {
    const {
      getNameOnCardTextField,
      getCreditCardNumberTextField,
      getCreditCardExpirationTextField,
      getCreditCardCVVTextField,
      getBillingZipCodeTextField,
    } = setup();

    const container = screen.getByTestId(
      CREDIT_CARD_FORM_FIELDS_TEST_IDS.CONTAINER
    );
    expect(container).toBeVisible();

    const nameOnCardTextField = getNameOnCardTextField();
    expect(nameOnCardTextField).toBeVisible();

    const creditCardNumberTextField = getCreditCardNumberTextField();
    expect(creditCardNumberTextField).toBeVisible();

    const creditCardExpirationTextField = getCreditCardExpirationTextField();
    expect(creditCardExpirationTextField).toBeVisible();

    const creditCardCVVTextField = getCreditCardCVVTextField();
    expect(creditCardCVVTextField).toBeVisible();

    const billingZipCodeTextField = getBillingZipCodeTextField();
    expect(billingZipCodeTextField).toBeVisible();

    const saveCardOnFileFormControl = screen.queryByTestId(
      CREDIT_CARD_FORM_FIELDS_TEST_IDS.SAVE_CARD_ON_FILE_FORM_CONTROL
    );
    expect(saveCardOnFileFormControl).not.toBeInTheDocument();
  });

  it('should render form fields with "Save this card on file?" checkbox', () => {
    const {
      getNameOnCardTextField,
      getCreditCardNumberTextField,
      getCreditCardExpirationTextField,
      getCreditCardCVVTextField,
      getBillingZipCodeTextField,
    } = setup({ showSaveCardOnFileCheckbox: true });

    const container = screen.getByTestId(
      CREDIT_CARD_FORM_FIELDS_TEST_IDS.CONTAINER
    );
    expect(container).toBeVisible();

    const nameOnCardTextField = getNameOnCardTextField();
    expect(nameOnCardTextField).toBeVisible();

    const creditCardNumberTextField = getCreditCardNumberTextField();
    expect(creditCardNumberTextField).toBeVisible();

    const creditCardExpirationTextField = getCreditCardExpirationTextField();
    expect(creditCardExpirationTextField).toBeVisible();

    const creditCardCVVTextField = getCreditCardCVVTextField();
    expect(creditCardCVVTextField).toBeVisible();

    const billingZipCodeTextField = getBillingZipCodeTextField();
    expect(billingZipCodeTextField).toBeVisible();

    const saveCardOnFileFormControl = screen.getByTestId(
      CREDIT_CARD_FORM_FIELDS_TEST_IDS.SAVE_CARD_ON_FILE_FORM_CONTROL
    );
    expect(saveCardOnFileFormControl).toBeVisible();
  });

  it('should call onFieldBlur with correct name on field blur', async () => {
    const { user } = setup();

    const nameOnCardInput = screen.getByTestId(
      CREDIT_CARD_FORM_FIELDS_TEST_IDS.NAME_ON_CARD_INPUT
    );
    expect(nameOnCardInput).toBeVisible();

    await user.click(nameOnCardInput);

    await user.click(document.body);

    await waitFor(() => {
      expect(defaultProps.onFieldBlur).toBeCalledWith('nameOnCard');
    });

    const creditCardNumberInput = screen.getByTestId(
      CREDIT_CARD_FORM_FIELDS_TEST_IDS.CREDIT_CARD_NUMBER_INPUT
    );
    expect(creditCardNumberInput).toBeVisible();

    await user.click(creditCardNumberInput);

    await user.click(document.body);

    await waitFor(() => {
      expect(defaultProps.onFieldBlur).toBeCalledWith('creditCardNumber');
    });
  });

  it('should call onFieldChange with correct name and value on checkbox change', async () => {
    const { user } = setup({ showSaveCardOnFileCheckbox: true });

    const saveCardOnFileFormControl = screen.getByTestId(
      CREDIT_CARD_FORM_FIELDS_TEST_IDS.SAVE_CARD_ON_FILE_FORM_CONTROL
    );
    expect(saveCardOnFileFormControl).toBeVisible();

    await user.click(saveCardOnFileFormControl);

    await waitFor(() => {
      expect(defaultProps.onFieldChange).toBeCalledWith('saveCardOnFile', true);
    });

    await user.click(saveCardOnFileFormControl);

    await waitFor(() => {
      expect(defaultProps.onFieldChange).toBeCalledWith(
        'saveCardOnFile',
        false
      );
    });
  });

  it('should call onFieldChange with correct name and masked value on credit card input change', async () => {
    const mockCreditCardNumber = '4242 4242 4242 4242';
    const { user } = setup();

    const creditCardNumberInput = screen.getByTestId(
      CREDIT_CARD_FORM_FIELDS_TEST_IDS.CREDIT_CARD_NUMBER_INPUT
    );
    expect(creditCardNumberInput).toBeVisible();

    await user.type(
      creditCardNumberInput,
      mockCreditCardNumber.replace(/\D/g, '')
    );

    await waitFor(() => {
      expect(defaultProps.onFieldChange).toHaveBeenLastCalledWith(
        'creditCardNumber',
        mockCreditCardNumber
      );
    });
  });

  it('should call onFieldChange with correct name and masked value on credit card expiration change', async () => {
    const mockCreditCardExpiration = '01/2030';
    const { user } = setup();

    const creditCardExpirationInput = screen.getByTestId(
      CREDIT_CARD_FORM_FIELDS_TEST_IDS.CREDIT_CARD_EXPIRATION_INPUT
    );
    expect(creditCardExpirationInput).toBeVisible();

    await user.type(
      creditCardExpirationInput,
      mockCreditCardExpiration.replace('/', '')
    );

    await waitFor(() => {
      expect(defaultProps.onFieldChange).toHaveBeenLastCalledWith(
        'creditCardExpiration',
        mockCreditCardExpiration
      );
    });
  });

  it('should show error helper texts if errorMessages exist', () => {
    const mockErrorMessages: Required<
      CreditCardFormFieldsProps['errorMessages']
    > = {
      nameOnCard: 'Name on Card error',
      creditCardNumber: 'Credit Card Number error',
      creditCardExpiration: 'Expiration error',
      creditCardCVV: 'CVV error',
      billingZipCode: 'Billing Zip Code error',
      billingAddress: 'Billing Address error',
    };
    const {
      getNameOnCardTextField,
      getCreditCardNumberTextField,
      getCreditCardExpirationTextField,
      getCreditCardCVVTextField,
      getBillingZipCodeTextField,
    } = setup({
      errorMessages: mockErrorMessages,
    });

    const nameOnCardTextField = getNameOnCardTextField();
    expect(nameOnCardTextField).toBeVisible();
    expect(nameOnCardTextField).toHaveTextContent(mockErrorMessages.nameOnCard);

    const creditCardNumberTextField = getCreditCardNumberTextField();
    expect(creditCardNumberTextField).toBeVisible();
    expect(creditCardNumberTextField).toHaveTextContent(
      mockErrorMessages.creditCardNumber
    );

    const creditCardExpirationTextField = getCreditCardExpirationTextField();
    expect(creditCardExpirationTextField).toBeVisible();
    expect(creditCardExpirationTextField).toHaveTextContent(
      mockErrorMessages.creditCardExpiration
    );

    const creditCardCVVTextField = getCreditCardCVVTextField();
    expect(creditCardCVVTextField).toBeVisible();
    expect(creditCardCVVTextField).toHaveTextContent(
      mockErrorMessages.creditCardCVV
    );

    const billingZipCodeTextField = getBillingZipCodeTextField();
    expect(billingZipCodeTextField).toBeVisible();
    expect(billingZipCodeTextField).toHaveTextContent(
      mockErrorMessages.billingZipCode
    );
  });
});
