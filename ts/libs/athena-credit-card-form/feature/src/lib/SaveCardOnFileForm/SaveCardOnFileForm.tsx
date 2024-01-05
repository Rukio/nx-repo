import { FC, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import {
  CreditCardFormLayout,
  CreditCardFormFields,
  FormFieldName,
  CreditCardPreview,
} from '@*company-data-covered*/athena-credit-card-form/ui';
import { useCreditCardQueryParams } from '../hooks/useCreditCardQueryParams';
import {
  selectCreditCardLoadingState,
  selectSavedCreditCardData,
  saveCreditCard,
  useAppDispatch,
  useGetCreditCardsQuery,
  SelectCreditCardsQuery,
  selectFirstExistingCreditCard,
  deleteCreditCard,
} from '@*company-data-covered*/athena-credit-card-form/data-access';
import { useSelector } from 'react-redux';
import {
  Alert,
  Box,
  CircularProgress,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { SAVE_CARD_ON_FILE_FORM_TEST_IDS } from './testIds';
import {
  getCreditCardLast4Digits,
  getCreditCardType,
} from '../util/creditCard';
import { MessageType, sendMessageToParent } from '../util/iframe';
import { FormFields, useCreditCardForm } from '../hooks/useCreditCardForm';

const makeStyles = () =>
  makeSxStyles({
    loaderContainer: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      py: 3,
    },
    alertContainer: {
      m: 3,
    },
  });

const SaveCardOnFileForm: FC = () => {
  const styles = makeStyles();
  const dispatch = useAppDispatch();

  const [formFields, setFormFields] = useState<FormFields>({
    nameOnCard: '',
    creditCardNumber: '',
    creditCardExpiration: '',
    creditCardCVV: '',
    billingAddress: '',
    billingZipCode: '',
  });

  const { fieldValidations, onFieldChange, onFieldBlur } = useCreditCardForm({
    formFields,
    setFormFields,
  });

  const { departmentId, patientId } = useCreditCardQueryParams();

  const creditCardsQuery: SelectCreditCardsQuery =
    departmentId && patientId ? { departmentId, patientId } : skipToken;

  useGetCreditCardsQuery(creditCardsQuery, { refetchOnMountOrArgChange: true });

  const { creditCard, isLoading: isExistingCreditCardLoading } = useSelector(
    selectFirstExistingCreditCard(creditCardsQuery)
  );

  const { isLoading, isSuccess, isError } = useSelector(
    selectCreditCardLoadingState
  );

  const savedCreditCardData = useSelector(selectSavedCreditCardData);

  const showSuccessStatus = isSuccess && !!savedCreditCardData?.success;

  const onDelete = () => {
    if (!departmentId || !patientId || !creditCard?.id) {
      return;
    }

    dispatch(
      deleteCreditCard({
        departmentId,
        patientId,
        creditCardId: creditCard.id,
      })
    );
  };

  const onSubmit = () => {
    if (!departmentId || !patientId) {
      return;
    }

    if (showSuccessStatus || creditCard) {
      return sendMessageToParent({
        type: MessageType.CloseModal,
        payload: {
          billingAddress: formFields.billingAddress,
        },
      });
    }

    const [expirationMonth, expirationYear] =
      formFields.creditCardExpiration.split('/');

    dispatch(
      saveCreditCard({
        accountNumber: formFields.creditCardNumber,
        billingZip: formFields.billingZipCode,
        billingAddress: formFields.billingAddress,
        cvv: +formFields.creditCardCVV,
        expirationMonth: +expirationMonth,
        expirationYear: +expirationYear,
        nameOnCard: formFields.nameOnCard,
        departmentId: +departmentId,
        patientId,
      })
    );
  };

  const isSubmitButtonDisabled =
    (Object.values(fieldValidations).some(({ isValid }) => !isValid) &&
      !creditCard) ||
    isExistingCreditCardLoading;

  const errorMessages: Partial<Record<FormFieldName, string>> = Object.entries(
    fieldValidations
  ).reduce(
    (prevErrorMessages, [key, value]) => ({
      ...prevErrorMessages,
      [key as FormFieldName]: value.errorMessage,
    }),
    {}
  );

  const buttonText =
    showSuccessStatus || creditCard ? 'Continue Onboarding' : 'Save Card';

  const getSuccessMessage = () => {
    const creditCardType =
      getCreditCardType(formFields.creditCardNumber) || 'Credit card';

    const creditCardLast4Digits = getCreditCardLast4Digits(
      formFields.creditCardNumber
    );

    return `${creditCardType} ending in ${creditCardLast4Digits} saved successfully.`;
  };

  const getErrorMessage = () => {
    if ((savedCreditCardData && !savedCreditCardData?.success) || isError) {
      return 'There was an error saving this card.';
    }

    return '';
  };

  const renderFormContent = () => {
    if (isExistingCreditCardLoading) {
      return (
        <Box
          sx={styles.loaderContainer}
          data-testid={SAVE_CARD_ON_FILE_FORM_TEST_IDS.LOADING_CONTAINER}
        >
          <CircularProgress />
        </Box>
      );
    }

    if (creditCard) {
      return (
        <CreditCardPreview
          creditCardExpiration={creditCard.expirationMonthYear}
          creditCardType={creditCard.cardType}
          creditCardNumberLastDigits={creditCard.numberLastFourDigits}
          onDelete={onDelete}
        />
      );
    }

    if (showSuccessStatus) {
      return (
        <Box sx={styles.alertContainer}>
          <Alert
            data-testid={SAVE_CARD_ON_FILE_FORM_TEST_IDS.SUCCESS_ALERT}
            message={getSuccessMessage()}
          />
        </Box>
      );
    }

    return (
      <CreditCardFormFields
        errorMessages={errorMessages}
        onFieldChange={onFieldChange}
        onFieldBlur={onFieldBlur}
      />
    );
  };

  return (
    <CreditCardFormLayout
      title="Save Card on File"
      buttonText={buttonText}
      isSubmitButtonDisabled={isSubmitButtonDisabled}
      isLoading={isLoading}
      onSubmit={onSubmit}
      errorMessage={getErrorMessage()}
    >
      {renderFormContent()}
    </CreditCardFormLayout>
  );
};

export default SaveCardOnFileForm;
