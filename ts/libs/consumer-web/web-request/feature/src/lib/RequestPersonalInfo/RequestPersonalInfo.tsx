import { ChangeEvent, FC, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  FormHelperText,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  Grid,
  DesktopDatePicker,
  LocalizationProvider,
  SelectChangeEvent,
} from '@*company-data-covered*/design-system';
import {
  StatsigEvents,
  StatsigActions,
  StatsigPageCategory,
} from '@*company-data-covered*/consumer-web-types';
import { PageLayout } from '../components/PageLayout';
import {
  selectCaller,
  selectPatient,
  setPatient,
  setCaller,
  RelationshipToPatient,
  useAppDispatch,
} from '@*company-data-covered*/consumer-web/web-request/data-access';
import {
  InputField,
  PhoneNumberInput,
} from '@*company-data-covered*/consumer-web/web-request/ui';
import {
  useValidation,
  transformValueFromPhone,
  phoneNumberWithoutCountry,
  PATIENT_ELSE_VALIDATION_RULE,
  PATIENT_MYSELF_VALIDATION_RULE,
  StatsigLogEvent,
} from '../utils';
import { REQUEST_PERSONAL_INFO_TEST_IDS } from './testIds';

const LOG_EVENT: StatsigLogEvent = {
  eventName: StatsigEvents.REQUEST_PERSONAL_INFO_EVENT,
  value: StatsigActions.ADDED_PERSONAL_INFO,
  metadata: {
    page: StatsigPageCategory.REQUEST_DETAILS,
    origin: window.location.host,
  },
};

const RequestPersonalInfo: FC = () => {
  const dispatch = useAppDispatch();

  const caller = useSelector(selectCaller);
  const patient = useSelector(selectPatient);

  const { showCareSelect, showPersonalFields, showBirthdayFields } = useMemo(
    () => ({
      showCareSelect:
        caller.relationshipToPatient !== RelationshipToPatient.myself,
      showPersonalFields:
        caller.relationshipToPatient &&
        caller.relationshipToPatient !== RelationshipToPatient.myself &&
        caller.relationshipToPatient !== RelationshipToPatient.else,
      showBirthdayFields:
        caller.relationshipToPatient &&
        caller.relationshipToPatient !== RelationshipToPatient.else,
    }),
    [caller.relationshipToPatient]
  );

  const formValidationRules =
    caller.relationshipToPatient === RelationshipToPatient.myself
      ? PATIENT_MYSELF_VALIDATION_RULE
      : PATIENT_ELSE_VALIDATION_RULE;
  const formValidations = useValidation(patient, formValidationRules);

  const onChangeDate = (date: string | null) => {
    if (date) {
      dispatch(setPatient({ birthday: date }));
    }
  };

  const onChangePatientField = (
    ev:
      | ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
      | SelectChangeEvent<string>
  ) => {
    const {
      target: { name, value },
    } = ev;
    dispatch(setPatient({ [name]: value }));
  };
  const onChangeRelationToPatient = (ev: SelectChangeEvent<string>) => {
    const {
      target: { value },
    } = ev;
    dispatch(setCaller({ relationshipToPatient: value }));
  };

  const onPhoneNumberChange = (
    ev: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    dispatch(setPatient({ phone: transformValueFromPhone(ev.target.value) }));
  };

  const birthdayMessage = showCareSelect
    ? 'Used to verify their identity for appointments'
    : 'Used to verify your identity for appointments';

  return (
    <PageLayout
      titleOptions={{
        text: !showCareSelect
          ? 'Tell us more about yourself'
          : 'Tell us more about the person receiving care',
        dataTestId: REQUEST_PERSONAL_INFO_TEST_IDS.PERSONAL_INFO_HEADER,
      }}
      continueOptions={{
        showBtn: true,
        disabled:
          !formValidations.isValidForm ||
          !caller.relationshipToPatient ||
          caller.relationshipToPatient === RelationshipToPatient.else,
        logEventData: LOG_EVENT,
        dataTestId: REQUEST_PERSONAL_INFO_TEST_IDS.CONTINUE_BUTTON,
      }}
    >
      <LocalizationProvider>
        <FormHelperText
          sx={{ mt: 2.5, fontSize: 14 }}
          data-testid={
            REQUEST_PERSONAL_INFO_TEST_IDS.PERSONAL_INFO_DETAILS_LABEL
          }
        >
          {!showCareSelect
            ? 'We need a few more details to schedule your visit.'
            : 'We need a few more details to schedule their care visit.'}
        </FormHelperText>
        {showCareSelect && (
          <FormControl fullWidth sx={{ mt: 3 }}>
            <FormLabel
              data-testid={REQUEST_PERSONAL_INFO_TEST_IDS.RELATIONSHIP_LABEL}
            >
              Your Relationship to the Patient
            </FormLabel>
            <Select
              value={caller.relationshipToPatient || RelationshipToPatient.else}
              name="relationshipToPatient"
              onChange={onChangeRelationToPatient}
              data-testid={REQUEST_PERSONAL_INFO_TEST_IDS.RELATIONSHIP_DROPDOWN}
            >
              <MenuItem
                value={RelationshipToPatient.else}
                disabled
                data-testid={
                  REQUEST_PERSONAL_INFO_TEST_IDS.RELATIONSHIP_DROPDOWN_OPTION_DEFAULT
                }
              >
                Select relationship
              </MenuItem>
              <MenuItem
                value={RelationshipToPatient.familyFriend}
                data-testid={
                  REQUEST_PERSONAL_INFO_TEST_IDS.RELATIONSHIP_DROPDOWN_OPTION_FAMILY_FRIEND
                }
              >
                Friend / Family Member
              </MenuItem>
              <MenuItem
                value={RelationshipToPatient.clinicianOrganization}
                data-testid={
                  REQUEST_PERSONAL_INFO_TEST_IDS.RELATIONSHIP_DROPDOWN_OPTION_CLINICIAN_ORGANIZATION
                }
              >
                Clinician / Organization
              </MenuItem>
              <MenuItem
                value={RelationshipToPatient.other}
                data-testid={
                  REQUEST_PERSONAL_INFO_TEST_IDS.RELATIONSHIP_DROPDOWN_OPTION_OTHER
                }
              >
                Other
              </MenuItem>
            </Select>
          </FormControl>
        )}
        {showPersonalFields && (
          <Grid container>
            <FormControl fullWidth sx={{ mt: 3 }}>
              <FormLabel
                sx={{ mb: 2 }}
                data-testid={REQUEST_PERSONAL_INFO_TEST_IDS.FULL_NAME_LABEL}
              >
                Full Name
              </FormLabel>
              <Grid container spacing={2} wrap="nowrap">
                <Grid item sm={6}>
                  <InputField
                    label="First Name"
                    name="firstName"
                    error={
                      formValidations.fields.firstName.isTouched &&
                      !formValidations.fields.firstName.isValid
                    }
                    helperText={
                      formValidations.fields.firstName.isTouched &&
                      formValidations.fields.firstName.error
                    }
                    fullWidth
                    value={patient.firstName}
                    onChange={onChangePatientField}
                    data-testid={
                      REQUEST_PERSONAL_INFO_TEST_IDS.FIRST_NAME_FIELD
                    }
                    inputProps={{
                      'data-testid':
                        REQUEST_PERSONAL_INFO_TEST_IDS.FIRST_NAME_INPUT,
                    }}
                  />
                </Grid>
                <Grid item sm={6}>
                  <InputField
                    label="Last Name"
                    name="lastName"
                    error={
                      formValidations.fields.lastName.isTouched &&
                      !formValidations.fields.lastName.isValid
                    }
                    helperText={
                      formValidations.fields.lastName.isTouched &&
                      formValidations.fields.lastName.error
                    }
                    fullWidth
                    value={patient.lastName}
                    onChange={onChangePatientField}
                    data-testid={REQUEST_PERSONAL_INFO_TEST_IDS.LAST_NAME_FIELD}
                    inputProps={{
                      'data-testid':
                        REQUEST_PERSONAL_INFO_TEST_IDS.LAST_NAME_INPUT,
                    }}
                  />
                </Grid>
              </Grid>
            </FormControl>
          </Grid>
        )}
        {showBirthdayFields && (
          <>
            <FormControl fullWidth sx={{ mt: 3 }}>
              <FormLabel
                data-testid={REQUEST_PERSONAL_INFO_TEST_IDS.DATE_OF_BIRTH_LABEL}
              >
                Date of Birth
              </FormLabel>
              <DesktopDatePicker
                value={patient.birthday}
                maxDate={new Date().toString()}
                renderInput={(props) => (
                  <InputField
                    {...props}
                    error={
                      formValidations.fields.birthday.isTouched &&
                      !formValidations.fields.birthday.isValid
                    }
                    FormHelperTextProps={{ sx: { ml: 0 } }}
                    helperText={birthdayMessage}
                    errorMessage={
                      formValidations.fields.birthday.isTouched &&
                      formValidations.fields.birthday.error
                        ? formValidations.fields.birthday.error
                        : ''
                    }
                    variant="outlined"
                    data-testid={
                      REQUEST_PERSONAL_INFO_TEST_IDS.DATE_OF_BIRTH_FIELD
                    }
                    inputProps={{
                      ...props.inputProps,
                      'data-testid':
                        REQUEST_PERSONAL_INFO_TEST_IDS.DATE_OF_BIRTH_INPUT,
                    }}
                    placeholder="MM/DD/YYYY"
                  />
                )}
                onChange={onChangeDate}
              />
            </FormControl>
            <FormControl fullWidth sx={{ mt: 3 }}>
              <FormLabel
                data-testid={REQUEST_PERSONAL_INFO_TEST_IDS.LEGAL_SEX_LABEL}
              >
                Legal Sex
              </FormLabel>
              <Select
                value={patient.sex}
                name="sex"
                onChange={onChangePatientField}
                error={
                  formValidations.fields.sex.isTouched &&
                  !formValidations.fields.sex.isValid
                }
                displayEmpty
                data-testid={REQUEST_PERSONAL_INFO_TEST_IDS.LEGAL_SEX_DROPDOWN}
              >
                <MenuItem
                  value=""
                  disabled
                  data-testid={
                    REQUEST_PERSONAL_INFO_TEST_IDS.LEGAL_SEX_DROPDOWN_OPTION_DEFAULT
                  }
                >
                  Select Legal Sex
                </MenuItem>
                <MenuItem
                  value="M"
                  data-testid={
                    REQUEST_PERSONAL_INFO_TEST_IDS.LEGAL_SEX_DROPDOWN_OPTION_MALE
                  }
                >
                  Male
                </MenuItem>
                <MenuItem
                  value="F"
                  data-testid={
                    REQUEST_PERSONAL_INFO_TEST_IDS.LEGAL_SEX_DROPDOWN_OPTION_FEMALE
                  }
                >
                  Female
                </MenuItem>
              </Select>
              <FormHelperText
                sx={{ ml: 0 }}
                data-testid={
                  REQUEST_PERSONAL_INFO_TEST_IDS.LEGAL_SEX_INSURANCE_LABEL
                }
              >
                {!showCareSelect
                  ? 'For billing purposes, what sex does your insurance have on record for you?'
                  : 'For billing purposes, what sex does your insurance have on record for them?'}
              </FormHelperText>
            </FormControl>
          </>
        )}
        {showPersonalFields && (
          <FormControl fullWidth sx={{ mt: 3 }}>
            <FormLabel
              data-testid={REQUEST_PERSONAL_INFO_TEST_IDS.PHONE_NUMBER_LABEL}
            >
              Phone Number
            </FormLabel>
            <PhoneNumberInput
              label=""
              placeholder="(555) 555-5555"
              value={phoneNumberWithoutCountry(patient.phone)}
              onChangeField={onPhoneNumberChange}
              inputTestIdPrefix={
                REQUEST_PERSONAL_INFO_TEST_IDS.PHONE_NUMBER_INPUT
              }
              error={
                formValidations.fields.phone.isTouched &&
                !formValidations.fields.phone.isValid
              }
              helperText={
                formValidations.fields.phone.isTouched &&
                formValidations.fields.phone.error
              }
            />
          </FormControl>
        )}
      </LocalizationProvider>
    </PageLayout>
  );
};

export default RequestPersonalInfo;
