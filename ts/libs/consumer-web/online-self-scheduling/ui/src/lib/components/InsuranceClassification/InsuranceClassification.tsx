import { FC } from 'react';
import {
  makeSxStyles,
  SearchIcon,
  Typography,
  InputLabel,
  FormControl,
  Box,
} from '@*company-data-covered*/design-system';
import { INSURANCE_CLASSIFICATION_TEST_IDS } from './testIds';
import { FormFooter } from '../FormFooter';
import { FormHeader } from '../FormHeader';
import {
  FormRadioGroup,
  FormSelect,
  FormMenuItem,
  FormTextField,
  getFormSelectMenuItems,
} from '@*company-data-covered*/shared/ui/forms';
import { InsuranceClassificationFormValues } from './contants';
import { Control } from 'react-hook-form';

export enum QuestionYesNoAnswer {
  Yes = 'Yes',
  No = 'No',
}

export enum InsuranceType {
  EmployerProvidedOrPrivate = 'EmployerProvidedOrPrivate',
  Medicare = 'Medicare',
  Medicaid = 'Medicaid',
  None = 'None',
}

export type StateOption = {
  id: number;
  name: string;
  abbreviation: string;
};

export type InsuranceClassificationProps = {
  isRequesterRelationshipSelf: boolean;
  showSelectState: boolean;
  showSearchInsurance: boolean;
  showSecondQuestion: boolean;
  insuranceValue: InsuranceType;
  selectedAdministered?: string;
  isSubmitButtonDisabled: boolean;
  stateOptions: StateOption[];
  formControl: Control<InsuranceClassificationFormValues>;
  onSubmit: () => void;
  onSearchInsuranceProvidersClick: () => void;
  formTitle: string;
  isLoading?: boolean;
};

const makeStyles = () =>
  makeSxStyles({
    title: {
      fontWeight: '600',
      pt: 3,
    },
    inputSearchIcon: {
      pr: 1,
    },
    input: {
      pt: 2,
    },
    insuranceProvidersInput: {
      input: {
        cursor: 'pointer',
      },
    },
    formFooter: {
      mt: 3,
    },
  });

type InsuranceTypeAnswer = {
  label: string;
  value: InsuranceType;
};

export const insuranceTypeAnswers: InsuranceTypeAnswer[] = [
  {
    label: 'Employer-provided or private insurance',
    value: InsuranceType.EmployerProvidedOrPrivate,
  },
  {
    label: 'Medicare',
    value: InsuranceType.Medicare,
  },
  {
    label: 'Medicaid',
    value: InsuranceType.Medicaid,
  },
  {
    label: 'I don’t have insurance',
    value: InsuranceType.None,
  },
];

const insuranceTypeAnswerOptions = insuranceTypeAnswers.map((answer) => ({
  value: answer.value,
  label: answer.label,
  'data-testid': INSURANCE_CLASSIFICATION_TEST_IDS.getInsuranceTypeRadioOption(
    answer.value
  ),
}));

type YesNoAnswerOption = {
  value: QuestionYesNoAnswer;
  label: QuestionYesNoAnswer;
  'data-testid': string;
};

const yesNoAnswerOptions: YesNoAnswerOption[] = [
  {
    label: QuestionYesNoAnswer.Yes,
    value: QuestionYesNoAnswer.Yes,
    'data-testid':
      INSURANCE_CLASSIFICATION_TEST_IDS.getIsPublicInsuranceThroughCompanyRadioOption(
        QuestionYesNoAnswer.Yes
      ),
  },
  {
    label: QuestionYesNoAnswer.No,
    value: QuestionYesNoAnswer.No,
    'data-testid':
      INSURANCE_CLASSIFICATION_TEST_IDS.getIsPublicInsuranceThroughCompanyRadioOption(
        QuestionYesNoAnswer.No
      ),
  },
];

const getInsuranceCompanyQuestion = (
  insuranceType: InsuranceType,
  isRequesterRelationshipSelf: boolean
) => {
  if (
    [InsuranceType.Medicaid, InsuranceType.Medicare].includes(insuranceType)
  ) {
    return `Is ${
      isRequesterRelationshipSelf ? 'your' : 'their'
    } ${insuranceType} administered through an insurance company? (for
    example, Blue Cross Blue Shield or Humana)`;
  }

  return `What company is ${
    isRequesterRelationshipSelf ? 'your' : 'their'
  } insurance provided through?`;
};

export const InsuranceClassification: FC<InsuranceClassificationProps> = ({
  isRequesterRelationshipSelf,
  showSearchInsurance,
  showSelectState,
  showSecondQuestion,
  insuranceValue,
  stateOptions,
  isSubmitButtonDisabled,
  formControl,
  isLoading,
  onSubmit,
  onSearchInsuranceProvidersClick,
  formTitle,
}) => {
  const styles = makeStyles();

  const stateMenuItems: FormMenuItem[] = stateOptions?.map((option) => ({
    value: option.abbreviation,
    label: option.name,
  }));

  return (
    <>
      <FormHeader title={formTitle} />
      <Typography
        variant="body1"
        sx={styles.title}
        data-testid={INSURANCE_CLASSIFICATION_TEST_IDS.INSURANCE_TYPE_QUESTION}
      >
        {isRequesterRelationshipSelf
          ? 'What type of insurance do you have?'
          : 'What type of insurance does the patient have?'}
      </Typography>
      <FormRadioGroup
        control={formControl}
        name="insuranceType"
        radioOptions={insuranceTypeAnswerOptions}
      />
      {showSecondQuestion && (
        <>
          <Typography
            data-testid={
              INSURANCE_CLASSIFICATION_TEST_IDS.INSURANCE_THROUGH_COMPANY_QUESTION
            }
            variant="body1"
            sx={styles.title}
          >
            {isRequesterRelationshipSelf
              ? `Is your ${insuranceValue} administered through an insurance company? (for
            example, Blue Cross Blue Shield or Humana)`
              : `Is their ${insuranceValue} administered through an insurance company? (for example, Blue Cross Blue Shield or Humana)`}
          </Typography>
          <FormRadioGroup
            control={formControl}
            name="isPublicInsuranceThroughCompany"
            radioOptions={yesNoAnswerOptions}
          />
        </>
      )}
      {showSearchInsurance && (
        <>
          <Typography
            variant="body1"
            sx={styles.title}
            data-testid={
              INSURANCE_CLASSIFICATION_TEST_IDS.INSURANCE_COMPANY_DETAILS_QUESTION
            }
          >
            {getInsuranceCompanyQuestion(
              insuranceValue,
              isRequesterRelationshipSelf
            )}
          </Typography>
          <FormTextField
            name="insurancePayerName"
            control={formControl}
            textFieldProps={{
              sx: styles.input,
              fullWidth: true,
              placeholder: 'Search insurance providers',
              onClick: onSearchInsuranceProvidersClick,
              focused: false,
              'data-testid':
                INSURANCE_CLASSIFICATION_TEST_IDS.INSURANCE_PROVIDERS_SEARCH_FIELD,
              InputProps: {
                startAdornment: <SearchIcon sx={styles.inputSearchIcon} />,
                error: false,
                readOnly: true,
                sx: styles.insuranceProvidersInput,
              },
            }}
          />
        </>
      )}
      {showSelectState && (
        <>
          <Typography
            variant="body1"
            sx={styles.title}
            data-testid={
              INSURANCE_CLASSIFICATION_TEST_IDS.INSURANCE_STATE_QUESTION
            }
          >
            {isRequesterRelationshipSelf
              ? `What state is your ${insuranceValue} offered through?`
              : `What state is their ${insuranceValue} offered through?`}
          </Typography>
          <Box sx={styles.input}>
            <FormControl fullWidth>
              <InputLabel>State</InputLabel>
              <FormSelect
                name="stateAbbr"
                control={formControl}
                selectProps={{
                  label: 'State',
                  fullWidth: true,
                  'data-testid':
                    INSURANCE_CLASSIFICATION_TEST_IDS.STATES_SELECT,
                }}
              >
                {getFormSelectMenuItems(
                  stateMenuItems,
                  INSURANCE_CLASSIFICATION_TEST_IDS.STATES_SELECT_ITEM_PREFIX
                )}
              </FormSelect>
            </FormControl>
          </Box>
        </>
      )}
      <Box sx={styles.formFooter}>
        <FormFooter
          onSubmit={onSubmit}
          isSubmitButtonDisabled={isSubmitButtonDisabled}
          isSubmitButtonLoading={isLoading}
        />
      </Box>
    </>
  );
};

export default InsuranceClassification;
