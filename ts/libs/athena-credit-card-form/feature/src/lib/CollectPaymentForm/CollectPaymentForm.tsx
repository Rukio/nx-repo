import { FC, useState } from 'react';
import {
  CreditCardFormLayout,
  CreditCardFormFields,
  FormFieldErrorMessages,
} from '@*company-data-covered*/athena-credit-card-form/ui';
import {
  collectPayment,
  CollectPaymentPayload,
  saveCreditCard,
  SaveCreditCardPayload,
  selectCollectPaymentLoadingState,
  selectCreditCardLoadingState,
  selectPayment,
  selectSavedCreditCardData,
  useAppDispatch,
} from '@*company-data-covered*/athena-credit-card-form/data-access';
import { useSelector } from 'react-redux';
import { Alert, Box } from '@*company-data-covered*/design-system';
import { useCreditCardQueryParams } from '../hooks/useCreditCardQueryParams';
import {
  getCreditCardLast4Digits,
  getCreditCardType,
} from '../util/creditCard';
import { COLLECT_PAYMENT_FORM_TEST_IDS } from './testIds';
import { MessageType, sendMessageToParent } from '../util/iframe';
import { FormFields, useCreditCardForm } from '../hooks/useCreditCardForm';

const CollectPaymentForm: FC = () => {
  const dispatch = useAppDispatch();

  const [formFields, setFormFields] = useState<FormFields>({
    nameOnCard: '',
    creditCardNumber: '',
    creditCardExpiration: '',
    creditCardCVV: '',
    billingAddress: '',
    billingZipCode: '',
    saveCardOnFile: false,
  });

  const { departmentId, patientId, amount } = useCreditCardQueryParams();

  const { fieldValidations, onFieldChange, onFieldBlur } = useCreditCardForm({
    formFields,
    setFormFields,
  });

  const { isLoading, isSuccess, isError } = useSelector(
    selectCollectPaymentLoadingState
  );

  const payment = useSelector(selectPayment);

  const {
    isLoading: isSaveCreditCardLoading,
    isSuccess: isSaveCreditCardSuccess,
    isError: isSaveCreditCardError,
  } = useSelector(selectCreditCardLoadingState);

  const savedCreditCardData = useSelector(selectSavedCreditCardData);

  const isPaymentSuccess = isSuccess && !!payment?.success;

  const isSaveCardOnFileSuccess =
    isSaveCreditCardSuccess && !!savedCreditCardData?.success;

  const showSuccessStatus =
    isPaymentSuccess && (!formFields.saveCardOnFile || isSaveCardOnFileSuccess);

  const onSubmit = () => {
    if (!departmentId || !amount || !patientId) {
      return;
    }

    if (showSuccessStatus) {
      return sendMessageToParent({
        type: MessageType.CloseModal,
        payload: {
          billingAddress: formFields.billingAddress,
        },
      });
    }

    const [expirationMonth, expirationYear] =
      formFields.creditCardExpiration.split('/');

    const creditCardPayload: SaveCreditCardPayload | CollectPaymentPayload = {
      accountNumber: formFields.creditCardNumber,
      billingZip: formFields.billingZipCode,
      billingAddress: formFields.billingAddress,
      cvv: +formFields.creditCardCVV,
      expirationMonth: +expirationMonth,
      expirationYear: +expirationYear,
      nameOnCard: formFields.nameOnCard,
      departmentId: +departmentId,
      patientId,
    };

    if (formFields.saveCardOnFile) {
      dispatch(saveCreditCard(creditCardPayload));
    }

    dispatch(
      collectPayment({
        ...creditCardPayload,
        amount,
      })
    );
  };

  const isSubmitButtonDisabled = Object.values(fieldValidations).some(
    ({ isValid }) => !isValid
  );

  const errorMessages: FormFieldErrorMessages = Object.entries(
    fieldValidations
  ).reduce(
    (prevErrorMessages, [key, value]) => ({
      ...prevErrorMessages,
      [key]: value.errorMessage,
    }),
    {}
  );

  const buttonText = showSuccessStatus
    ? 'Continue Onboarding'
    : 'Submit Payment';

  const totalToBeChargedText = showSuccessStatus ? null : amount;

  const getSuccessMessage = () => {
    const creditCardType =
      getCreditCardType(formFields.creditCardNumber) || 'card';

    const creditCardLast4Digits = getCreditCardLast4Digits(
      formFields.creditCardNumber
    );

    return `Payment for $${amount} processed successfully to ${creditCardType} ending in ${creditCardLast4Digits}.`;
  };

  const getErrorMessage = () => {
    if ((payment && !payment?.success) || isError) {
      return 'There was an error processing this payment.';
    }

    if (
      (savedCreditCardData && !savedCreditCardData?.success) ||
      isSaveCreditCardError
    ) {
      return 'There was an error saving this card.';
    }

    return '';
  };

  return (
    <CreditCardFormLayout
      title="Collect Payment"
      buttonText={buttonText}
      isSubmitButtonDisabled={isSubmitButtonDisabled}
      isLoading={isLoading || isSaveCreditCardLoading}
      onSubmit={onSubmit}
      totalToBeChargedText={totalToBeChargedText}
      errorMessage={getErrorMessage()}
    >
      {showSuccessStatus ? (
        <Box sx={{ m: 3 }}>
          <Alert
            data-testid={COLLECT_PAYMENT_FORM_TEST_IDS.SUCCESS_ALERT}
            message={getSuccessMessage()}
          />
        </Box>
      ) : (
        <CreditCardFormFields
          showSaveCardOnFileCheckbox
          errorMessages={errorMessages}
          onFieldChange={onFieldChange}
          onFieldBlur={onFieldBlur}
        />
      )}
    </CreditCardFormLayout>
  );
};

export default CollectPaymentForm;
