import { FC } from 'react';
import { Control } from 'react-hook-form';
import {
  makeSxStyles,
  Box,
  FormLabel,
  Alert,
  Typography,
  AlertProps,
} from '@*company-data-covered*/design-system';
import {
  FormPatternFormat,
  FormTextField,
} from '@*company-data-covered*/shared/ui/forms';
import { CONSENT_FORM_TEST_IDS } from './testIds';
import { FormFooter } from '../FormFooter';
import { ConsentQuestion, ConsentQuestionType } from './ConsentQuestion';
import { ConsentFormFieldValues, ConsentQuestionsOrder } from './constants';

export type ConsentFormProps = {
  isFirstQuestionDisplayed: boolean;
  isSecondQuestionDisplayed: boolean;
  isThirdQuestionDisplayed: boolean;
  isMedicalDecisionMakerSectionDisplayed: boolean;
  isSubmitButtonDisabled: boolean;
  isSubmitButtonDisplayed: boolean;
  isAlertDisplayed: boolean;
  isRelationToPatientSelf?: boolean;
  alertOptions?: Pick<AlertProps, 'title' | 'message'>;
  onSubmit: () => void;
  formControl: Control<ConsentFormFieldValues>;
};

export enum DefaultConsentQuestionAnswer {
  Yes = 'Yes',
  No = 'No',
}

export enum MedicalDecisionMakerQuestionAnswer {
  Me = 'Me',
  SomeoneElse = 'Someone Else',
}

const makeStyles = () =>
  makeSxStyles({
    title: {
      fontWeight: '600',
      pb: 2,
    },
    personalInfoForm: {
      pt: 3,
    },
    paddingMedium: {
      pt: 2,
    },
    paddingTop: {
      pt: 3,
    },
    alert: {
      width: '100%',
      pt: 3,
    },
  });

export const ConsentForm: FC<ConsentFormProps> = ({
  isFirstQuestionDisplayed,
  isSecondQuestionDisplayed,
  isThirdQuestionDisplayed,
  isMedicalDecisionMakerSectionDisplayed,
  alertOptions,
  isAlertDisplayed,
  isSubmitButtonDisabled,
  isSubmitButtonDisplayed,
  isRelationToPatientSelf = false,
  formControl,
  onSubmit,
}) => {
  const styles = makeStyles();

  const consentQuestions: ConsentQuestionType[] = [
    {
      order: ConsentQuestionsOrder.First,
      question: isRelationToPatientSelf
        ? 'Do you make your own medical decisions?'
        : 'Does the patient make their own medical decisions?',
      answerOptions: [
        DefaultConsentQuestionAnswer.Yes,
        DefaultConsentQuestionAnswer.No,
      ],
    },
    {
      order: ConsentQuestionsOrder.Second,
      question: isRelationToPatientSelf
        ? 'Will the individual who makes your medical decisions be on-scene during our visit?'
        : 'Will the individual who makes their medical decisions be on-scene during our visit?',
      answerOptions: [
        DefaultConsentQuestionAnswer.Yes,
        DefaultConsentQuestionAnswer.No,
      ],
    },
    {
      order: ConsentQuestionsOrder.Third,
      question: 'Who makes their medical decisions?',
      answerOptions: [
        MedicalDecisionMakerQuestionAnswer.Me,
        MedicalDecisionMakerQuestionAnswer.SomeoneElse,
      ],
    },
  ];

  return (
    <>
      {isFirstQuestionDisplayed && (
        <Box>
          <ConsentQuestion
            fieldName="firstConsentQuestion"
            formControl={formControl}
            consentQuestion={consentQuestions[0]}
          />
        </Box>
      )}
      {isSecondQuestionDisplayed && (
        <Box sx={styles.paddingTop}>
          <ConsentQuestion
            fieldName="secondConsentQuestion"
            formControl={formControl}
            consentQuestion={consentQuestions[1]}
          />
        </Box>
      )}
      {isThirdQuestionDisplayed && (
        <Box sx={styles.paddingTop}>
          <ConsentQuestion
            fieldName="thirdConsentQuestion"
            formControl={formControl}
            consentQuestion={consentQuestions[2]}
          />
        </Box>
      )}
      {isMedicalDecisionMakerSectionDisplayed && (
        <Box sx={styles.personalInfoForm}>
          {!isThirdQuestionDisplayed && (
            <Typography sx={styles.title}>
              Who makes your medical decisions?
            </Typography>
          )}
          <Box>
            <FormLabel>Full Name</FormLabel>
            <FormTextField
              name="firstName"
              control={formControl}
              textFieldProps={{
                fullWidth: true,
                inputProps: {
                  'data-testid': CONSENT_FORM_TEST_IDS.FIRST_NAME_INPUT,
                },
                'data-testid': CONSENT_FORM_TEST_IDS.FIRST_NAME_FIELD,
                placeholder: 'First name',
              }}
            />
          </Box>
          <Box sx={styles.paddingMedium}>
            <FormTextField
              name="lastName"
              control={formControl}
              textFieldProps={{
                fullWidth: true,
                inputProps: {
                  'data-testid': CONSENT_FORM_TEST_IDS.LAST_NAME_INPUT,
                },
                'data-testid': CONSENT_FORM_TEST_IDS.LAST_NAME_FIELD,
                placeholder: 'Last name',
              }}
            />
          </Box>
          <Box sx={styles.paddingMedium}>
            <FormLabel>Phone number</FormLabel>
            <FormPatternFormat
              name="phoneNumber"
              control={formControl}
              patternFormatProps={{
                inputProps: {
                  'data-testid': CONSENT_FORM_TEST_IDS.PHONE_INPUT,
                },
                'data-testid': CONSENT_FORM_TEST_IDS.PHONE_FIELD,
                placeholder: 'Phone Number',
                mask: '_',
                format: '(###) ###-####',
                fullWidth: true,
              }}
            />
          </Box>
        </Box>
      )}
      {isAlertDisplayed && alertOptions && (
        <Box sx={styles.alert}>
          <Alert
            data-testid={CONSENT_FORM_TEST_IDS.ALERT}
            severity="error"
            title={alertOptions.title}
            message={alertOptions.message}
          />
        </Box>
      )}
      {isSubmitButtonDisplayed && (
        <Box sx={styles.paddingTop}>
          <FormFooter
            onSubmit={onSubmit}
            isSubmitButtonDisabled={isSubmitButtonDisabled}
          />
        </Box>
      )}
    </>
  );
};
