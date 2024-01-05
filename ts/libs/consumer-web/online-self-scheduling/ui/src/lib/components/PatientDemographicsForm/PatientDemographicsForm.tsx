import { FC, ReactNode, useRef } from 'react';
import { Control } from 'react-hook-form';
import {
  Box,
  Button,
  Collapse,
  ExpandMoreIcon,
  FormControl,
  FormLabel,
  FormHelperText,
  LocalizationProvider,
  Typography,
  makeSxStyles,
  Alert,
} from '@*company-data-covered*/design-system';
import {
  DatadogPrivacyOption,
  getDataDogPrivacyHTMLAttributes,
} from '@*company-data-covered*/shared/datadog/util';
import {
  FormRadioGroup,
  FormTextField,
  FormPatternFormat,
  FormDatePicker,
  FormSelect,
  getFormSelectMenuItems,
} from '@*company-data-covered*/shared/ui/forms';
import { useDebouncedCallback } from '@*company-data-covered*/shared/util/hooks';
import { FormHeader } from '../FormHeader';
import { FormFooter } from '../FormFooter';
import { PATIENT_DEMOGRAPHICS_FORM_TEST_IDS } from './testIds';

export interface PatientDemographicsFormFieldValues {
  selectedPatientId?: string;
  requesterFirstName?: string;
  requesterLastName?: string;
  requesterPhone?: string;
  patientFirstName?: string;
  patientLastName?: string;
  patientMiddleName?: string;
  patientSuffix?: string;
  patientPhone?: string;
  birthday?: string;
  legalSex?: string;
  assignedSexAtBirth?: string;
  genderIdentity?: string;
  genderIdentityDetails?: string;
}

export const DEFAULT_FORM_FIELD_VALUES: PatientDemographicsFormFieldValues = {
  selectedPatientId: '',
  requesterFirstName: '',
  requesterLastName: '',
  requesterPhone: '',
  patientFirstName: '',
  patientLastName: '',
  patientMiddleName: '',
  patientSuffix: '',
  patientPhone: '',
  birthday: '',
  legalSex: '',
  assignedSexAtBirth: '',
  genderIdentity: '',
};

export type FormOption = { value: string; label: string };

export type PatientDemographicsFormProps = {
  formHeaderTitle: string;
  formHeaderSubtitle?: string;
  isReturningPatientSectionVisible: boolean;
  isRequesterSectionVisible: boolean;
  isPatientSectionVisible: boolean;
  isGenderIdentityDetailsFieldVisible?: boolean;
  formControl: Control<PatientDemographicsFormFieldValues>;
  relationshipToPatientOptions?: FormOption[];
  legalSexOptions: FormOption[];
  assignedSexAtBirthOptions: FormOption[];
  genderIdentityOptions: FormOption[];
  isSexAndGenderDetailsExpanded?: boolean;
  onClickAddSexAndGenderDetails: () => void;
  isSubmitButtonDisabled?: boolean;
  isSubmitButtonLoading?: boolean;
  onSubmit: () => void;
};

const makeStyles = () =>
  makeSxStyles({
    topIndents: { mt: 3 },
    formBody: { my: 3 },
    returningPatientSection: { pl: 1 },
    radioOption: { ml: 1 },
    requesterSection: (theme) => ({
      borderBottom: `1px solid ${theme.palette.grey[200]}`,
      pb: 3,
    }),
    patientSection: { mb: 3 },
    formTitle: { my: 3 },
    formLabel: (theme) => ({
      fontSize: 12,
      color: theme.palette.warning.contrastText,
    }),
    textFieldIndents: { mt: 1 },
    selectPlaceholder: (theme) => ({
      lineHeight: 'inherit',
      color: theme.palette.text.disabled,
    }),
    sexAndGenderDetailsSection: { mt: 1 },
  });

const PatientDemographicsForm: FC<PatientDemographicsFormProps> = ({
  formHeaderTitle,
  formHeaderSubtitle,
  isReturningPatientSectionVisible,
  isRequesterSectionVisible,
  isPatientSectionVisible,
  isGenderIdentityDetailsFieldVisible = false,
  formControl,
  relationshipToPatientOptions = [],
  legalSexOptions,
  assignedSexAtBirthOptions,
  genderIdentityOptions,
  isSexAndGenderDetailsExpanded = false,
  onClickAddSexAndGenderDetails,
  isSubmitButtonDisabled = false,
  isSubmitButtonLoading = false,
  onSubmit,
}) => {
  const styles = makeStyles();

  const relationshipToPatientRadioOptions = relationshipToPatientOptions.map(
    (option) => ({
      ...option,
      'data-testid':
        PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.getReturningPatientRadioOption(
          option.value
        ),
      ...getDataDogPrivacyHTMLAttributes(DatadogPrivacyOption.Mask),
    })
  );

  const collapseSexAndGenderDetailsRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useDebouncedCallback<void>(() => {
    collapseSexAndGenderDetailsRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  });

  const onChangeSexAndGenderDetailsExpanded = () => {
    onClickAddSexAndGenderDetails();
    scrollToBottom();
  };

  const renderLegalSexValue = (value: string): string | ReactNode => {
    const selectedLabel = legalSexOptions.find(
      (option) => option.value === value
    )?.label;

    if (selectedLabel) {
      return selectedLabel;
    }

    return (
      <Typography sx={styles.selectPlaceholder}>Select Legal Sex</Typography>
    );
  };

  const renderAssignedSexAtBirthValue = (value: string): string | ReactNode => {
    const selectedLabel = assignedSexAtBirthOptions.find(
      (option) => option.value === value
    )?.label;

    if (selectedLabel) {
      return selectedLabel;
    }

    return (
      <Typography sx={styles.selectPlaceholder}>
        Select Assigned Sex at Birth
      </Typography>
    );
  };

  const renderGenderIdentityValue = (value: string): string | ReactNode => {
    const selectedLabel = genderIdentityOptions.find(
      (option) => option.value === value
    )?.label;

    if (selectedLabel) {
      return selectedLabel;
    }

    return (
      <Typography sx={styles.selectPlaceholder}>
        Select Gender Identity
      </Typography>
    );
  };

  const getFullLegalNameAlertMessage = () => {
    if (isRequesterSectionVisible) {
      return (
        <>
          Make sure to enter the patient’s <b>full legal name</b> as it appears
          on their health insurance card.
        </>
      );
    }

    return (
      <>
        Make sure to enter your <b>full legal name</b> as it appears on your
        health insurance card.
      </>
    );
  };

  return (
    <Box data-testid={PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.ROOT}>
      <FormHeader title={formHeaderTitle} subtitle={formHeaderSubtitle} />
      <Box sx={styles.formBody}>
        {isReturningPatientSectionVisible && (
          <Box
            sx={styles.returningPatientSection}
            data-testid={
              PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.RETURNING_PATIENT_SECTION
            }
          >
            <FormRadioGroup
              name="selectedPatientId"
              control={formControl}
              radioOptions={relationshipToPatientRadioOptions}
              optionSx={styles.radioOption}
            />
          </Box>
        )}
        {isRequesterSectionVisible && (
          <Box
            sx={styles.requesterSection}
            data-testid={PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.REQUESTER_SECTION}
          >
            <Typography variant="h6" sx={styles.formTitle}>
              About You
            </Typography>
            <Box>
              <FormLabel
                sx={styles.formLabel}
                data-testid={
                  PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.REQUESTER_FULL_LEGAL_NAME_LABEL
                }
              >
                Full Legal Name
              </FormLabel>
              <FormTextField
                name="requesterFirstName"
                control={formControl}
                textFieldProps={{
                  placeholder: 'First Name',
                  fullWidth: true,
                  sx: styles.textFieldIndents,
                  'data-testid':
                    PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.REQUESTER_FIRST_NAME_FIELD,
                  inputProps: {
                    'data-testid':
                      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.REQUESTER_FIRST_NAME_INPUT,
                  },
                }}
              />
              <FormTextField
                name="requesterLastName"
                control={formControl}
                textFieldProps={{
                  placeholder: 'Last Name',
                  fullWidth: true,
                  sx: styles.textFieldIndents,
                  'data-testid':
                    PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.REQUESTER_LAST_NAME_FIELD,
                  inputProps: {
                    'data-testid':
                      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.REQUESTER_LAST_NAME_INPUT,
                  },
                }}
              />
            </Box>
            <Box sx={styles.topIndents}>
              <FormLabel
                sx={styles.formLabel}
                data-testid={
                  PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.REQUESTER_PHONE_NUMBER_LABEL
                }
              >
                Phone Number
              </FormLabel>
              <FormPatternFormat
                name="requesterPhone"
                control={formControl}
                patternFormatProps={{
                  format: '(###) ###-####',
                  mask: '_',
                  placeholder: 'Phone Number',
                  fullWidth: true,
                  sx: styles.textFieldIndents,
                  'data-testid':
                    PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.REQUESTER_PHONE_NUMBER_FIELD,
                  inputProps: {
                    'data-testid':
                      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.REQUESTER_PHONE_NUMBER_INPUT,
                  },
                }}
              />
            </Box>
          </Box>
        )}
        {isPatientSectionVisible && (
          <Box
            sx={styles.patientSection}
            data-testid={PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_SECTION}
          >
            {isRequesterSectionVisible && (
              <Typography variant="h6" sx={styles.formTitle}>
                Who Needs Care?
              </Typography>
            )}
            <Alert
              sx={styles.topIndents}
              severity="info"
              message={getFullLegalNameAlertMessage()}
              data-testid={
                PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_FULL_LEGAL_NAME_ALERT
              }
            />
            <LocalizationProvider>
              <Box sx={styles.topIndents}>
                <FormLabel
                  sx={styles.formLabel}
                  data-testid={
                    PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_FULL_LEGAL_NAME_LABEL
                  }
                >
                  Full Legal Name
                </FormLabel>
                <FormTextField
                  name="patientFirstName"
                  control={formControl}
                  textFieldProps={{
                    placeholder: 'First Name',
                    fullWidth: true,
                    sx: styles.textFieldIndents,
                    'data-testid':
                      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_FIRST_NAME_FIELD,
                    inputProps: {
                      'data-testid':
                        PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_FIRST_NAME_INPUT,
                    },
                  }}
                />
                <FormTextField
                  name="patientMiddleName"
                  control={formControl}
                  textFieldProps={{
                    placeholder: 'Middle Name (optional)',
                    fullWidth: true,
                    sx: styles.textFieldIndents,
                    'data-testid':
                      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_MIDDLE_NAME_FIELD,
                    inputProps: {
                      'data-testid':
                        PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_MIDDLE_NAME_INPUT,
                    },
                  }}
                />
                <FormTextField
                  name="patientLastName"
                  control={formControl}
                  textFieldProps={{
                    placeholder: 'Last Name',
                    fullWidth: true,
                    sx: styles.textFieldIndents,
                    'data-testid':
                      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_LAST_NAME_FIELD,
                    inputProps: {
                      'data-testid':
                        PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_LAST_NAME_INPUT,
                    },
                  }}
                />
                <FormTextField
                  name="patientSuffix"
                  control={formControl}
                  textFieldProps={{
                    placeholder: 'Suffix (optional)',
                    fullWidth: true,
                    sx: styles.textFieldIndents,
                    'data-testid':
                      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_SUFFIX_FIELD,
                    inputProps: {
                      'data-testid':
                        PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_SUFFIX_INPUT,
                    },
                  }}
                />
              </Box>
              <Box sx={styles.topIndents}>
                <FormLabel
                  sx={styles.formLabel}
                  data-testid={
                    PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_PHONE_NUMBER_LABEL
                  }
                >
                  Phone Number
                </FormLabel>
                <FormPatternFormat
                  name="patientPhone"
                  control={formControl}
                  patternFormatProps={{
                    format: '(###) ###-####',
                    mask: '_',
                    placeholder: 'Phone Number',
                    fullWidth: true,
                    sx: styles.textFieldIndents,
                    'data-testid':
                      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_PHONE_NUMBER_FIELD,
                    inputProps: {
                      'data-testid':
                        PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_PHONE_NUMBER_INPUT,
                    },
                  }}
                />
              </Box>
              <Box sx={styles.topIndents}>
                <FormLabel
                  sx={styles.formLabel}
                  data-testid={
                    PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_DATE_OF_BIRTH_LABEL
                  }
                >
                  Date of Birth
                </FormLabel>
                <FormDatePicker
                  name="birthday"
                  control={formControl}
                  datePickerProps={{
                    maxDate: new Date().toString(),
                  }}
                  textFieldProps={{
                    fullWidth: true,
                    sx: styles.textFieldIndents,
                    'data-testid':
                      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_DATE_OF_BIRTH_FIELD,
                    inputProps: {
                      placeholder: 'MM/DD/YYYY',
                      'data-testid':
                        PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_DATE_OF_BIRTH_INPUT,
                    },
                  }}
                />
              </Box>
              <FormControl fullWidth sx={styles.topIndents}>
                <FormLabel
                  focused={false}
                  sx={styles.formLabel}
                  data-testid={
                    PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_LEGAL_SEX_LABEL
                  }
                >
                  Legal Sex
                </FormLabel>
                <FormSelect
                  name="legalSex"
                  control={formControl}
                  selectProps={{
                    displayEmpty: true,
                    fullWidth: true,
                    renderValue: renderLegalSexValue,
                    sx: styles.textFieldIndents,
                    'data-testid':
                      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_LEGAL_SEX_FIELD,
                    inputProps: {
                      'data-testid':
                        PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_LEGAL_SEX_INPUT,
                    },
                  }}
                >
                  {getFormSelectMenuItems(
                    legalSexOptions,
                    PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_LEGAL_SEX_SELECT_ITEM_PREFIX
                  )}
                </FormSelect>
              </FormControl>
              <Box sx={styles.sexAndGenderDetailsSection}>
                {!isSexAndGenderDetailsExpanded && (
                  <Button
                    size="large"
                    fullWidth
                    endIcon={<ExpandMoreIcon />}
                    onClick={onChangeSexAndGenderDetailsExpanded}
                    data-testid={
                      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_ADD_SEX_AND_GENDER_DETAILS_BUTTON
                    }
                  >
                    Add Sex and Gender Details
                  </Button>
                )}
                <Collapse
                  ref={collapseSexAndGenderDetailsRef}
                  in={isSexAndGenderDetailsExpanded}
                  data-testid={
                    PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_SEX_AND_GENDER_DETAILS_COLLAPSE_SECTION
                  }
                >
                  <FormControl fullWidth sx={styles.topIndents}>
                    <FormLabel
                      focused={false}
                      sx={styles.formLabel}
                      data-testid={
                        PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_ASSIGNED_SEX_AT_BIRTH_LABEL
                      }
                    >
                      Assigned Sex at Birth
                    </FormLabel>
                    <FormSelect
                      name="assignedSexAtBirth"
                      control={formControl}
                      selectProps={{
                        displayEmpty: true,
                        fullWidth: true,
                        renderValue: renderAssignedSexAtBirthValue,
                        sx: styles.textFieldIndents,
                        'data-testid':
                          PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_ASSIGNED_SEX_AT_BIRTH_FIELD,
                        inputProps: {
                          'data-testid':
                            PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_ASSIGNED_SEX_AT_BIRTH_INPUT,
                        },
                      }}
                    >
                      {getFormSelectMenuItems(
                        assignedSexAtBirthOptions,
                        PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_ASSIGNED_SEX_AT_BIRTH_SELECT_ITEM_PREFIX
                      )}
                    </FormSelect>
                    <FormHelperText>Optional</FormHelperText>
                  </FormControl>
                  <FormControl fullWidth sx={styles.topIndents}>
                    <FormLabel
                      focused={false}
                      sx={styles.formLabel}
                      data-testid={
                        PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_GENDER_IDENTITY_LABEL
                      }
                    >
                      Gender Identity
                    </FormLabel>
                    <FormSelect
                      name="genderIdentity"
                      control={formControl}
                      selectProps={{
                        displayEmpty: true,
                        fullWidth: true,
                        renderValue: renderGenderIdentityValue,
                        sx: styles.textFieldIndents,
                        'data-testid':
                          PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_GENDER_IDENTITY_FIELD,
                        inputProps: {
                          'data-testid':
                            PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_GENDER_IDENTITY_INPUT,
                        },
                      }}
                    >
                      {getFormSelectMenuItems(
                        genderIdentityOptions,
                        PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_GENDER_IDENTITY_SELECT_ITEM_PREFIX
                      )}
                    </FormSelect>
                    <FormHelperText>Optional</FormHelperText>
                  </FormControl>
                  {isGenderIdentityDetailsFieldVisible && (
                    <FormControl fullWidth sx={styles.topIndents}>
                      <FormLabel
                        focused={false}
                        sx={styles.formLabel}
                        data-testid={
                          PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_GENDER_IDENTITY_DETAILS_LABEL
                        }
                      >
                        Gender Identity Details
                      </FormLabel>
                      <FormTextField
                        name="genderIdentityDetails"
                        control={formControl}
                        textFieldProps={{
                          placeholder: 'Enter gender identity details',
                          multiline: true,
                          rows: 3,
                          fullWidth: true,
                          sx: styles.textFieldIndents,
                          'data-testid':
                            PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_GENDER_IDENTITY_DETAILS_FIELD,
                          inputProps: {
                            'data-testid':
                              PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_GENDER_IDENTITY_DETAILS_INPUT,
                          },
                        }}
                      />
                    </FormControl>
                  )}
                </Collapse>
              </Box>
            </LocalizationProvider>
          </Box>
        )}
      </Box>
      <FormFooter
        isSubmitButtonDisabled={isSubmitButtonDisabled}
        isSubmitButtonLoading={isSubmitButtonLoading}
        onSubmit={onSubmit}
      />
    </Box>
  );
};

export default PatientDemographicsForm;
