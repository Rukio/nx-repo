import { Suspense } from 'react';
import { rest } from 'msw';
import {
  CREDIT_CARDS_SEGMENT,
  environment,
  mockCreditCards,
  mockSaveCreditCardPayload,
  PATIENTS_PATH,
} from '@*company-data-covered*/athena-credit-card-form/data-access';
import {
  CREDIT_CARD_FORM_FIELDS_TEST_IDS,
  CREDIT_CARD_FORM_LAYOUT_TEST_IDS,
  CREDIT_CARD_PREVIEW_TEST_IDS,
} from '@*company-data-covered*/athena-credit-card-form/ui';
import { MemoryRouterProps } from 'react-router-dom';
import { render, screen, waitFor } from '../../testUtils';
import { mswServer } from '../../testUtils/server';
import { MessageType, sendMessageToParent } from '../util/iframe';
import SaveCardOnFileForm from './SaveCardOnFileForm';
import { SAVE_CARD_ON_FILE_FORM_TEST_IDS } from './testIds';

vi.mock('../util/iframe');

const mockSendMessageToParent = vi.mocked(sendMessageToParent);

const findLoadingContainer = () =>
  screen.findByTestId(SAVE_CARD_ON_FILE_FORM_TEST_IDS.LOADING_CONTAINER);

const getSubmitButton = () =>
  screen.getByTestId(CREDIT_CARD_FORM_LAYOUT_TEST_IDS.SUBMIT_BUTTON);

const setupWithExistingCreditCard = ({
  routerProps,
}: { routerProps?: MemoryRouterProps } = {}) => {
  const { user, ...wrapper } = render(
    <Suspense>
      <SaveCardOnFileForm />
    </Suspense>,
    {
      withRouter: true,
      routerProps,
    }
  );

  const getCreditCardPreviewContainer = () =>
    screen.getByTestId(CREDIT_CARD_PREVIEW_TEST_IDS.CONTAINER);

  const getCreditCardPreviewTypeAndNumber = () =>
    screen.getByTestId(CREDIT_CARD_PREVIEW_TEST_IDS.CARD_TYPE_AND_NUMBER);

  const getCreditCardPreviewExpiration = () =>
    screen.getByTestId(CREDIT_CARD_PREVIEW_TEST_IDS.EXPIRATION);

  const getCreditCardDeleteButton = () =>
    screen.getByTestId(CREDIT_CARD_PREVIEW_TEST_IDS.DELETE_BUTTON);

  const getCreditCardFormFieldsContainer = () =>
    screen.getByTestId(CREDIT_CARD_FORM_FIELDS_TEST_IDS.CONTAINER);

  const findCreditCardConfirmDeleteButton = () =>
    screen.findByTestId(CREDIT_CARD_PREVIEW_TEST_IDS.CONFIRM_DELETE_BUTTON);

  return {
    ...wrapper,
    user,
    getCreditCardPreviewContainer,
    getCreditCardPreviewTypeAndNumber,
    getCreditCardPreviewExpiration,
    getCreditCardDeleteButton,
    getCreditCardFormFieldsContainer,
    findCreditCardConfirmDeleteButton,
  };
};

const setup = ({ routerProps }: { routerProps?: MemoryRouterProps } = {}) => {
  mswServer.use(
    rest.get(
      `${environment.serviceURL}${PATIENTS_PATH}/:patientId${CREDIT_CARDS_SEGMENT}`,
      (_req, res, ctx) => {
        return res.once(ctx.status(200), ctx.json([]), ctx.delay(100));
      }
    )
  );
  const { user, ...wrapper } = render(<SaveCardOnFileForm />, {
    withRouter: true,
    routerProps,
  });

  const blurInput = async () => await user.click(document.body);

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

  const getBillingAddressInput = () =>
    screen.getByTestId(CREDIT_CARD_FORM_FIELDS_TEST_IDS.BILLING_ADDRESS_INPUT);

  const getBillingZipCodeInput = () =>
    screen.getByTestId(CREDIT_CARD_FORM_FIELDS_TEST_IDS.BILLING_ZIP_CODE_INPUT);

  return {
    ...wrapper,
    user,
    blurInput,
    getNameOnCardInput,
    getCreditCardNumberInput,
    getCreditCardExpirationInput,
    getCreditCardCvvInput,
    getBillingAddressInput,
    getBillingZipCodeInput,
  };
};

describe('SaveCardOnFileForm', () => {
  it('should render correctly', () => {
    const {
      getNameOnCardInput,
      getCreditCardNumberInput,
      getCreditCardExpirationInput,
      getCreditCardCvvInput,
      getBillingAddressInput,
      getBillingZipCodeInput,
    } = setup();

    const title = screen.getByTestId(CREDIT_CARD_FORM_LAYOUT_TEST_IDS.TITLE);
    expect(title).toBeVisible();
    expect(title).toHaveTextContent('Save Card on File');

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

    const submitButton = getSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).toHaveTextContent('Save Card');
    expect(submitButton).toBeDisabled();
  });

  it('should show enabled submit button if all text fields are valid', async () => {
    const {
      user,
      getNameOnCardInput,
      getCreditCardNumberInput,
      getCreditCardExpirationInput,
      getCreditCardCvvInput,
      getBillingAddressInput,
      getBillingZipCodeInput,
    } = setup();

    const nameOnCardInput = getNameOnCardInput();
    expect(nameOnCardInput).toBeVisible();

    await user.type(nameOnCardInput, mockSaveCreditCardPayload.nameOnCard);

    const creditCardNumberInput = getCreditCardNumberInput();
    expect(creditCardNumberInput).toBeVisible();

    await user.type(
      creditCardNumberInput,
      mockSaveCreditCardPayload.accountNumber
    );

    const creditCardExpirationInput = getCreditCardExpirationInput();
    expect(creditCardExpirationInput).toBeVisible();

    await user.type(
      creditCardExpirationInput,
      `${mockSaveCreditCardPayload.expirationMonth}/${mockSaveCreditCardPayload.expirationYear}`
    );

    const creditCardCvvInput = getCreditCardCvvInput();
    expect(creditCardCvvInput).toBeVisible();

    await user.type(
      creditCardCvvInput,
      mockSaveCreditCardPayload.cvv.toString()
    );

    const billingAddressInput = getBillingAddressInput();
    expect(billingAddressInput).toBeVisible();

    await user.type(
      billingAddressInput,
      mockSaveCreditCardPayload.billingAddress
    );

    const billingZipCodeInput = getBillingZipCodeInput();
    expect(billingZipCodeInput).toBeVisible();

    await user.type(billingZipCodeInput, mockSaveCreditCardPayload.billingZip);

    await user.click(document.body);

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
    const {
      user,
      blurInput,
      getNameOnCardInput,
      getCreditCardNumberInput,
      getCreditCardExpirationInput,
      getCreditCardCvvInput,
      getBillingAddressInput,
      getBillingZipCodeInput,
    } = setup({
      routerProps: {
        initialEntries: [`/?departmentId=123&patientId=12`],
      },
    });

    const loadingContainer = await findLoadingContainer();
    expect(loadingContainer).toBeVisible();

    await waitFor(() => {
      expect(loadingContainer).not.toBeInTheDocument();
    });

    const nameOnCardInput = await getNameOnCardInput();
    expect(nameOnCardInput).toBeVisible();

    await user.type(nameOnCardInput, mockSaveCreditCardPayload.nameOnCard);

    const creditCardNumberInput = getCreditCardNumberInput();
    expect(creditCardNumberInput).toBeVisible();

    await user.type(
      creditCardNumberInput,
      mockSaveCreditCardPayload.accountNumber
    );

    const creditCardExpirationInput = getCreditCardExpirationInput();
    expect(creditCardExpirationInput).toBeVisible();

    await user.type(
      creditCardExpirationInput,
      `${mockSaveCreditCardPayload.expirationMonth}${mockSaveCreditCardPayload.expirationYear}`
    );

    const creditCardCvvInput = getCreditCardCvvInput();
    expect(creditCardCvvInput).toBeVisible();

    await user.type(
      creditCardCvvInput,
      mockSaveCreditCardPayload.cvv.toString()
    );

    const billingAddressInput = getBillingAddressInput();
    expect(billingAddressInput).toBeVisible();

    await user.type(
      billingAddressInput,
      mockSaveCreditCardPayload.billingAddress
    );

    const billingZipCodeInput = getBillingZipCodeInput();
    expect(billingZipCodeInput).toBeVisible();

    await user.type(billingZipCodeInput, mockSaveCreditCardPayload.billingZip);

    await blurInput();

    const submitButton = getSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    const successAlert = await screen.findByTestId(
      SAVE_CARD_ON_FILE_FORM_TEST_IDS.SUCCESS_ALERT
    );

    const last4Digits = mockSaveCreditCardPayload.accountNumber.split(' ')[3];

    expect(successAlert).toBeVisible();
    expect(successAlert).toHaveTextContent(
      `Visa ending in ${last4Digits} saved successfully`
    );
  });

  it('should call sendMessageToParent with billing address on submit button click after success', async () => {
    const {
      user,
      blurInput,
      getNameOnCardInput,
      getCreditCardNumberInput,
      getCreditCardExpirationInput,
      getCreditCardCvvInput,
      getBillingAddressInput,
      getBillingZipCodeInput,
    } = setup({
      routerProps: {
        initialEntries: [`/?departmentId=123&patientId=12`],
      },
    });

    const loadingContainer = await findLoadingContainer();
    expect(loadingContainer).toBeVisible();

    await waitFor(() => {
      expect(loadingContainer).not.toBeInTheDocument();
    });

    const nameOnCardInput = getNameOnCardInput();
    expect(nameOnCardInput).toBeVisible();

    await user.type(nameOnCardInput, mockSaveCreditCardPayload.nameOnCard);

    const creditCardNumberInput = getCreditCardNumberInput();
    expect(creditCardNumberInput).toBeVisible();

    await user.type(
      creditCardNumberInput,
      mockSaveCreditCardPayload.accountNumber
    );

    const creditCardExpirationInput = getCreditCardExpirationInput();
    expect(creditCardExpirationInput).toBeVisible();

    await user.type(
      creditCardExpirationInput,
      `${mockSaveCreditCardPayload.expirationMonth}${mockSaveCreditCardPayload.expirationYear}`
    );

    const creditCardCvvInput = getCreditCardCvvInput();
    expect(creditCardCvvInput).toBeVisible();

    await user.type(
      creditCardCvvInput,
      mockSaveCreditCardPayload.cvv.toString()
    );

    const billingAddressInput = getBillingAddressInput();
    expect(billingAddressInput).toBeVisible();

    await user.type(
      billingAddressInput,
      mockSaveCreditCardPayload.billingAddress
    );

    const billingZipCodeInput = getBillingZipCodeInput();
    expect(billingZipCodeInput).toBeVisible();

    await user.type(billingZipCodeInput, mockSaveCreditCardPayload.billingZip);

    await blurInput();

    const submitButton = getSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    const successAlert = await screen.findByTestId(
      SAVE_CARD_ON_FILE_FORM_TEST_IDS.SUCCESS_ALERT
    );
    expect(successAlert).toBeVisible();

    await user.click(submitButton);

    expect(mockSendMessageToParent).toBeCalledWith({
      type: MessageType.CloseModal,
      payload: { billingAddress: mockSaveCreditCardPayload.billingAddress },
    });
  });

  it('should render credit card preview correctly and call sendMessageToParent on submit button click', async () => {
    const {
      user,
      getCreditCardPreviewContainer,
      getCreditCardPreviewTypeAndNumber,
      getCreditCardPreviewExpiration,
    } = setupWithExistingCreditCard({
      routerProps: {
        initialEntries: [`/?departmentId=123&patientId=12`],
      },
    });

    const mockExistingCard = mockCreditCards[0];

    const loadingContainer = await findLoadingContainer();
    expect(loadingContainer).toBeVisible();

    await waitFor(() => {
      expect(loadingContainer).not.toBeInTheDocument();
    });

    const creditCardPreviewContainer = getCreditCardPreviewContainer();
    expect(creditCardPreviewContainer).toBeVisible();

    const creditCardPreviewTypeAndNumber = getCreditCardPreviewTypeAndNumber();
    expect(creditCardPreviewTypeAndNumber).toBeVisible();
    expect(creditCardPreviewTypeAndNumber).toHaveTextContent(
      `${mockExistingCard.cardType} ending in ${mockExistingCard.numberLastFourDigits}`
    );

    const creditCardPreviewExpiration = getCreditCardPreviewExpiration();
    expect(creditCardPreviewExpiration).toBeVisible();
    expect(creditCardPreviewExpiration).toHaveTextContent(
      `Exp. ${mockExistingCard.expirationMonthYear}`
    );

    const submitButton = getSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    expect(mockSendMessageToParent).toBeCalledWith({
      type: MessageType.CloseModal,
      payload: { billingAddress: '' },
    });
  });

  it('should delete existing credit card and show form', async () => {
    const {
      user,
      getCreditCardPreviewContainer,
      getCreditCardDeleteButton,
      getCreditCardFormFieldsContainer,
      findCreditCardConfirmDeleteButton,
    } = setupWithExistingCreditCard({
      routerProps: {
        initialEntries: [`/?departmentId=123&patientId=12`],
      },
    });

    const loadingContainer = await findLoadingContainer();
    expect(loadingContainer).toBeVisible();

    await waitFor(() => {
      expect(loadingContainer).not.toBeInTheDocument();
    });

    const creditCardPreviewContainer = getCreditCardPreviewContainer();
    expect(creditCardPreviewContainer).toBeVisible();

    const creditCardDeleteButton = getCreditCardDeleteButton();
    expect(creditCardDeleteButton).toBeVisible();
    expect(creditCardDeleteButton).toBeEnabled();

    await user.click(creditCardDeleteButton);

    const creditCardConfirmDeleteButton =
      await findCreditCardConfirmDeleteButton();
    expect(creditCardConfirmDeleteButton).toBeVisible();
    expect(creditCardConfirmDeleteButton).toBeEnabled();

    // mock empty response as credit card was deleted
    mswServer.use(
      rest.get(
        `${environment.serviceURL}${PATIENTS_PATH}/:patientId${CREDIT_CARDS_SEGMENT}`,
        (_req, res, ctx) => {
          return res.once(
            ctx.status(200),
            ctx.json({ creditCards: [] }),
            ctx.delay(100)
          );
        }
      )
    );

    await user.click(creditCardConfirmDeleteButton);

    const deleteLoadingContainer = await findLoadingContainer();
    expect(deleteLoadingContainer).toBeVisible();

    await waitFor(() => {
      expect(deleteLoadingContainer).not.toBeInTheDocument();
    });

    const creditCardFormFieldsContainer = getCreditCardFormFieldsContainer();
    expect(creditCardFormFieldsContainer).toBeVisible();
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
