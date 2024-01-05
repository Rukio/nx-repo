import {
  CREDIT_CARD_SEGMENT,
  environment,
  mockCollectPaymentPayload,
  PATIENTS_PATH,
} from '@*company-data-covered*/athena-credit-card-form/data-access';
import {
  CREDIT_CARD_FORM_FIELDS_TEST_IDS,
  CREDIT_CARD_FORM_LAYOUT_TEST_IDS,
} from '@*company-data-covered*/athena-credit-card-form/ui';
import { rest } from 'msw';
import { MemoryRouterProps } from 'react-router-dom';
import { render, screen } from '../../testUtils';
import { mswServer } from '../../testUtils/server';
import { MessageType, sendMessageToParent } from '../util/iframe';
import CollectPaymentForm from './CollectPaymentForm';
import { COLLECT_PAYMENT_FORM_TEST_IDS } from './testIds';

vi.mock('../util/iframe');

const mockSendMessageToParent = vi.mocked(sendMessageToParent);

const setup = ({ routerProps }: { routerProps?: MemoryRouterProps } = {}) => {
  const { user, ...wrapper } = render(<CollectPaymentForm />, {
    withRouter: true,
    routerProps,
  });

  const blurInput = () => user.tab();

  const getSubmitButton = () =>
    screen.getByTestId(CREDIT_CARD_FORM_LAYOUT_TEST_IDS.SUBMIT_BUTTON);

  const getNameOnCardInput = () =>
    screen.getByTestId(CREDIT_CARD_FORM_FIELDS_TEST_IDS.NAME_ON_CARD_INPUT);

  const getCreditCardNumberInput = () =>
    screen.getByTestId(
      CREDIT_CARD_FORM_FIELDS_TEST_IDS.CREDIT_CARD_NUMBER_INPUT
    );

  const getCreditCardExpirationInput = () =>
    screen.getByTestId(
      CREDIT_CARD_FORM_FIELDS_TEST_IDS.CREDIT_CARD_EXPIRATION_INPUT
    );

  const getCreditCardCvvInput = () =>
    screen.getByTestId(CREDIT_CARD_FORM_FIELDS_TEST_IDS.CREDIT_CARD_CVV_INPUT);

  const getBillingZipCodeInput = () =>
    screen.getByTestId(CREDIT_CARD_FORM_FIELDS_TEST_IDS.BILLING_ZIP_CODE_INPUT);

  const getBillingAddressInput = () =>
    screen.getByTestId(CREDIT_CARD_FORM_FIELDS_TEST_IDS.BILLING_ADDRESS_INPUT);

  const getSaveCardOnFileFormControl = () =>
    screen.getByTestId(
      CREDIT_CARD_FORM_FIELDS_TEST_IDS.SAVE_CARD_ON_FILE_FORM_CONTROL
    );

  return {
    ...wrapper,
    user,
    blurInput,
    getSubmitButton,
    getNameOnCardInput,
    getCreditCardNumberInput,
    getCreditCardExpirationInput,
    getCreditCardCvvInput,
    getBillingAddressInput,
    getBillingZipCodeInput,
    getSaveCardOnFileFormControl,
  };
};

describe('CollectPaymentForm', () => {
  it('should render correctly', () => {
    const {
      getSubmitButton,
      getNameOnCardInput,
      getCreditCardNumberInput,
      getCreditCardExpirationInput,
      getCreditCardCvvInput,
      getBillingAddressInput,
      getBillingZipCodeInput,
      getSaveCardOnFileFormControl,
    } = setup();

    const title = screen.getByTestId(CREDIT_CARD_FORM_LAYOUT_TEST_IDS.TITLE);
    expect(title).toBeVisible();
    expect(title).toHaveTextContent('Collect Payment');

    const nameOnCardInput = getNameOnCardInput();
    expect(nameOnCardInput).toBeVisible();
    expect(nameOnCardInput).toHaveValue('');

    const creditCardNumberInput = getCreditCardNumberInput();
    expect(creditCardNumberInput).toBeVisible();
    expect(creditCardNumberInput).toHaveValue('');

    const creditCardExpirationInput = getCreditCardExpirationInput();
    expect(creditCardExpirationInput).toBeVisible();
    expect(creditCardExpirationInput).toHaveValue('');

    const creditCardCvvInput = getCreditCardCvvInput();
    expect(creditCardCvvInput).toBeVisible();
    expect(creditCardCvvInput).toHaveValue('');

    const billingAddressInput = getBillingAddressInput();
    expect(billingAddressInput).toBeVisible();
    expect(billingAddressInput).toHaveValue('');

    const billingZipCodeInput = getBillingZipCodeInput();
    expect(billingZipCodeInput).toBeVisible();
    expect(billingZipCodeInput).toHaveValue('');

    const saveCardOnFileFormControl = getSaveCardOnFileFormControl();
    expect(saveCardOnFileFormControl).toBeVisible();

    const submitButton = getSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).toHaveTextContent('Submit Payment');
    expect(submitButton).toBeDisabled();
  });

  it('should show enabled submit button if all text fields are valid', async () => {
    const {
      user,
      getSubmitButton,
      getNameOnCardInput,
      getCreditCardNumberInput,
      getCreditCardExpirationInput,
      getCreditCardCvvInput,
      getBillingAddressInput,
      getBillingZipCodeInput,
      getSaveCardOnFileFormControl,
    } = setup();

    const nameOnCardInput = getNameOnCardInput();
    expect(nameOnCardInput).toBeVisible();

    await user.type(nameOnCardInput, mockCollectPaymentPayload.nameOnCard);

    const creditCardNumberInput = getCreditCardNumberInput();
    expect(creditCardNumberInput).toBeVisible();

    await user.type(
      creditCardNumberInput,
      mockCollectPaymentPayload.accountNumber
    );

    const creditCardExpirationInput = getCreditCardExpirationInput();
    expect(creditCardExpirationInput).toBeVisible();

    await user.type(
      creditCardExpirationInput,
      `${mockCollectPaymentPayload.expirationMonth}/${mockCollectPaymentPayload.expirationYear}`
    );

    const creditCardCvvInput = getCreditCardCvvInput();
    expect(creditCardCvvInput).toBeVisible();

    await user.type(
      creditCardCvvInput,
      mockCollectPaymentPayload.cvv.toString()
    );

    const billingAddressInput = getBillingAddressInput();
    expect(billingAddressInput).toBeVisible();

    await user.type(
      billingAddressInput,
      mockCollectPaymentPayload.billingAddress
    );

    const billingZipCodeInput = getBillingZipCodeInput();
    expect(billingZipCodeInput).toBeVisible();

    await user.type(billingZipCodeInput, mockCollectPaymentPayload.billingZip);

    const saveCardOnFileFormControl = getSaveCardOnFileFormControl();
    expect(saveCardOnFileFormControl).toBeVisible();

    await user.click(saveCardOnFileFormControl);

    const submitButton = getSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeEnabled();
  });

  it('should show correct error for name on card input if no value was typed', async () => {
    const { user, blurInput, getNameOnCardInput } = setup();

    const nameOnCardTextField = screen.getByTestId(
      CREDIT_CARD_FORM_FIELDS_TEST_IDS.NAME_ON_CARD_TEXT_FIELD
    );

    expect(nameOnCardTextField).toBeVisible();

    const nameOnCardInput = getNameOnCardInput();
    expect(nameOnCardInput).toBeVisible();

    await user.click(nameOnCardInput);

    await blurInput();

    expect(nameOnCardTextField).toHaveTextContent('This field is required');
  });

  it('should show success message if form is submitted', async () => {
    const mockAmount = 100;

    const {
      user,
      getSubmitButton,
      getNameOnCardInput,
      getCreditCardNumberInput,
      getCreditCardExpirationInput,
      getCreditCardCvvInput,
      getBillingAddressInput,
      getBillingZipCodeInput,
      getSaveCardOnFileFormControl,
    } = setup({
      routerProps: {
        initialEntries: [
          `/?departmentId=123&patientId=12&amount=${mockAmount}`,
        ],
      },
    });

    const nameOnCardInput = getNameOnCardInput();
    expect(nameOnCardInput).toBeVisible();

    await user.type(nameOnCardInput, mockCollectPaymentPayload.nameOnCard);

    const creditCardNumberInput = getCreditCardNumberInput();
    expect(creditCardNumberInput).toBeVisible();

    await user.type(
      creditCardNumberInput,
      mockCollectPaymentPayload.accountNumber
    );

    const creditCardExpirationInput = getCreditCardExpirationInput();
    expect(creditCardExpirationInput).toBeVisible();

    await user.type(
      creditCardExpirationInput,
      `${mockCollectPaymentPayload.expirationMonth}/${mockCollectPaymentPayload.expirationYear}`
    );

    const creditCardCvvInput = getCreditCardCvvInput();
    expect(creditCardCvvInput).toBeVisible();

    await user.type(
      creditCardCvvInput,
      mockCollectPaymentPayload.cvv.toString()
    );

    const billingAddressInput = getBillingAddressInput();
    expect(billingAddressInput).toBeVisible();

    await user.type(
      billingAddressInput,
      mockCollectPaymentPayload.billingAddress
    );

    const billingZipCodeInput = getBillingZipCodeInput();
    expect(billingZipCodeInput).toBeVisible();

    await user.type(billingZipCodeInput, mockCollectPaymentPayload.billingZip);

    const saveCardOnFileFormControl = getSaveCardOnFileFormControl();
    expect(saveCardOnFileFormControl).toBeVisible();

    await user.click(saveCardOnFileFormControl);

    const submitButton = getSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    const successAlert = await screen.findByTestId(
      COLLECT_PAYMENT_FORM_TEST_IDS.SUCCESS_ALERT
    );

    const last4Digits = mockCollectPaymentPayload.accountNumber.split(' ')[3];

    expect(successAlert).toBeVisible();
    expect(successAlert).toHaveTextContent(
      `Payment for $${mockAmount} processed successfully to Visa ending in ${last4Digits}`
    );
  });

  it('should call sendMessageToParent with billing address on submit button click after success', async () => {
    const {
      user,
      getSubmitButton,
      getNameOnCardInput,
      getCreditCardNumberInput,
      getCreditCardExpirationInput,
      getCreditCardCvvInput,
      getBillingAddressInput,
      getBillingZipCodeInput,
      getSaveCardOnFileFormControl,
    } = setup({
      routerProps: {
        initialEntries: [`/?departmentId=123&patientId=12&amount=100`],
      },
    });

    const nameOnCardInput = getNameOnCardInput();
    expect(nameOnCardInput).toBeVisible();

    await user.type(nameOnCardInput, mockCollectPaymentPayload.nameOnCard);

    const creditCardNumberInput = getCreditCardNumberInput();
    expect(creditCardNumberInput).toBeVisible();

    await user.type(
      creditCardNumberInput,
      mockCollectPaymentPayload.accountNumber
    );

    const creditCardExpirationInput = getCreditCardExpirationInput();
    expect(creditCardExpirationInput).toBeVisible();

    await user.type(
      creditCardExpirationInput,
      `${mockCollectPaymentPayload.expirationMonth}/${mockCollectPaymentPayload.expirationYear}`
    );

    const creditCardCvvInput = getCreditCardCvvInput();
    expect(creditCardCvvInput).toBeVisible();

    await user.type(
      creditCardCvvInput,
      mockCollectPaymentPayload.cvv.toString()
    );

    const billingAddressInput = getBillingAddressInput();
    expect(billingAddressInput).toBeVisible();

    await user.type(
      billingAddressInput,
      mockCollectPaymentPayload.billingAddress
    );

    const billingZipCodeInput = getBillingZipCodeInput();
    expect(billingZipCodeInput).toBeVisible();

    await user.type(billingZipCodeInput, mockCollectPaymentPayload.billingZip);

    const saveCardOnFileFormControl = getSaveCardOnFileFormControl();
    expect(saveCardOnFileFormControl).toBeVisible();

    await user.click(saveCardOnFileFormControl);

    const submitButton = getSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    const successAlert = await screen.findByTestId(
      COLLECT_PAYMENT_FORM_TEST_IDS.SUCCESS_ALERT
    );

    expect(successAlert).toBeVisible();

    await user.click(submitButton);

    expect(mockSendMessageToParent).toBeCalledWith({
      type: MessageType.CloseModal,
      payload: { billingAddress: mockCollectPaymentPayload.billingAddress },
    });
  });

  it('should show save card on file error message if save credit card response failed', async () => {
    mswServer.use(
      rest.post(
        `${environment.serviceURL}${PATIENTS_PATH}/:patientId${CREDIT_CARD_SEGMENT}`,
        (_req, res, ctx) => {
          return res.once(
            ctx.status(400),
            ctx.json({
              success: false,
            })
          );
        }
      )
    );

    const {
      user,
      getSubmitButton,
      getNameOnCardInput,
      getCreditCardNumberInput,
      getCreditCardExpirationInput,
      getCreditCardCvvInput,
      getBillingAddressInput,
      getBillingZipCodeInput,
      getSaveCardOnFileFormControl,
    } = setup({
      routerProps: {
        initialEntries: [`/?departmentId=123&patientId=12&amount=100`],
      },
    });

    const nameOnCardInput = getNameOnCardInput();
    expect(nameOnCardInput).toBeVisible();

    await user.type(nameOnCardInput, mockCollectPaymentPayload.nameOnCard);

    const creditCardNumberInput = getCreditCardNumberInput();
    expect(creditCardNumberInput).toBeVisible();

    await user.type(
      creditCardNumberInput,
      mockCollectPaymentPayload.accountNumber
    );

    const creditCardExpirationInput = getCreditCardExpirationInput();
    expect(creditCardExpirationInput).toBeVisible();

    await user.type(
      creditCardExpirationInput,
      `${mockCollectPaymentPayload.expirationMonth}/${mockCollectPaymentPayload.expirationYear}`
    );

    const creditCardCvvInput = getCreditCardCvvInput();
    expect(creditCardCvvInput).toBeVisible();

    await user.type(
      creditCardCvvInput,
      mockCollectPaymentPayload.cvv.toString()
    );

    const billingAddressInput = getBillingAddressInput();
    expect(billingAddressInput).toBeVisible();

    await user.type(
      billingAddressInput,
      mockCollectPaymentPayload.billingAddress
    );

    const billingZipCodeInput = getBillingZipCodeInput();
    expect(billingZipCodeInput).toBeVisible();

    await user.type(billingZipCodeInput, mockCollectPaymentPayload.billingZip);

    const saveCardOnFileFormControl = getSaveCardOnFileFormControl();
    expect(saveCardOnFileFormControl).toBeVisible();

    await user.click(saveCardOnFileFormControl);

    const submitButton = getSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    const errorAlert = await screen.findByTestId(
      CREDIT_CARD_FORM_LAYOUT_TEST_IDS.ERROR_ALERT
    );

    expect(errorAlert).toBeVisible();
    expect(errorAlert).toHaveTextContent(
      'There was an error saving this card.'
    );
  });

  it.each([
    {
      name: 'credit card',
      textFieldDataTestId:
        CREDIT_CARD_FORM_FIELDS_TEST_IDS.CREDIT_CARD_NUMBER_TEXT_FIELD,
      inputDataTestId:
        CREDIT_CARD_FORM_FIELDS_TEST_IDS.CREDIT_CARD_NUMBER_INPUT,
      value: '4242',
      expectedErrorMessage: 'Invalid credit card number',
    },
    {
      name: 'expiration date',
      textFieldDataTestId:
        CREDIT_CARD_FORM_FIELDS_TEST_IDS.CREDIT_CARD_EXPIRATION_TEXT_FIELD,
      inputDataTestId:
        CREDIT_CARD_FORM_FIELDS_TEST_IDS.CREDIT_CARD_EXPIRATION_INPUT,
      value: '12/3000',
      expectedErrorMessage: 'Invalid credit card expiration date',
    },
    {
      name: 'credit card cvv',
      textFieldDataTestId:
        CREDIT_CARD_FORM_FIELDS_TEST_IDS.CREDIT_CARD_CVV_TEXT_FIELD,
      inputDataTestId: CREDIT_CARD_FORM_FIELDS_TEST_IDS.CREDIT_CARD_CVV_INPUT,
      value: '12345',
      expectedErrorMessage: 'Invalid credit card CVV',
    },
    {
      name: 'billing zip code',
      textFieldDataTestId:
        CREDIT_CARD_FORM_FIELDS_TEST_IDS.BILLING_ZIP_CODE_TEXT_FIELD,
      inputDataTestId: CREDIT_CARD_FORM_FIELDS_TEST_IDS.BILLING_ZIP_CODE_INPUT,
      value: '12',
      expectedErrorMessage: 'Invalid zip code',
    },
    {
      name: 'billing street address',
      textFieldDataTestId:
        CREDIT_CARD_FORM_FIELDS_TEST_IDS.BILLING_ADDRESS_TEXT_FIELD,
      inputDataTestId: CREDIT_CARD_FORM_FIELDS_TEST_IDS.BILLING_ADDRESS_INPUT,
      value: 'Too long billing street address',
      expectedErrorMessage: 'Invalid billing street address',
    },
  ])(
    'should show correct error for $name input',
    async ({
      textFieldDataTestId,
      inputDataTestId,
      value,
      expectedErrorMessage,
    }) => {
      const { user, blurInput } = setup();

      const textField = screen.getByTestId(textFieldDataTestId);

      expect(textField).toBeVisible();

      const input = screen.getByTestId(inputDataTestId);
      expect(input).toBeVisible();

      await user.type(input, value);

      await blurInput();

      expect(textField).toHaveTextContent(expectedErrorMessage);
    }
  );
});
