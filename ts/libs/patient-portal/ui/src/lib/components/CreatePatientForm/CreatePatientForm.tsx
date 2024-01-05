import { FC, FormEventHandler } from 'react';
import { Control } from 'react-hook-form';
import {
  Button,
  FormControl,
  FormHelperText,
  MenuItem,
  LocalizationProvider,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import {
  FormDatePicker,
  FormTextField,
  FormPatternFormat,
  FormSelect,
} from '@*company-data-covered*/shared/ui/forms';
import { CREATE_PATIENT_FORM_TEST_IDS } from './testIds';
import { PatientData } from '../../types/PatientData';
import { ASSIGNED_SEX_OPTIONS, GENDER_IDENTITY_OPTIONS } from '../../constants';

//TODO: PT-1767 implement legal sex
export type CreatePatientFormFields = Omit<PatientData, 'email' | 'legalSex'>;

export type CreatePatientFormProps = {
  handleSubmit: FormEventHandler<HTMLFormElement>;
  isSubmitButtonDisabled: boolean;
  control: Control<CreatePatientFormFields>;
};

const makeStyles = () =>
  makeSxStyles({
    formControl: {
      mt: 3,
    },
    input: {
      my: 1,
    },
    defaultSelectValue: {
      color: 'text.disabled',
    },
  });

const CreatePatientForm: FC<CreatePatientFormProps> = ({
  handleSubmit,
  control,
  isSubmitButtonDisabled,
}) => {
  const styles = makeStyles();

  return (
    <form onSubmit={handleSubmit}>
      <FormControl sx={styles.formControl} fullWidth>
        <Typography variant="label">Full Legal Name</Typography>
        <FormTextField
          name="firstName"
          control={control}
          textFieldProps={{
            'data-testid': CREATE_PATIENT_FORM_TEST_IDS.FIRST_NAME_FORM_CONTROL,
            sx: styles.input,
            fullWidth: true,
            inputProps: {
              'data-testid': CREATE_PATIENT_FORM_TEST_IDS.FIRST_NAME,
            },
            placeholder: 'First Name',
          }}
        />
        <FormTextField
          name="lastName"
          data-testid={CREATE_PATIENT_FORM_TEST_IDS.LAST_NAME_FORM_CONTROL}
          control={control}
          textFieldProps={{
            'data-testid': CREATE_PATIENT_FORM_TEST_IDS.LAST_NAME_FORM_CONTROL,
            sx: styles.input,
            fullWidth: true,
            inputProps: {
              'data-testid': CREATE_PATIENT_FORM_TEST_IDS.LAST_NAME,
            },
            placeholder: 'Last Name',
          }}
        />
      </FormControl>
      <FormControl sx={styles.formControl} fullWidth>
        <Typography variant="label">Phone Number</Typography>
        <FormPatternFormat
          name="phoneNumber"
          control={control}
          patternFormatProps={{
            'data-testid':
              CREATE_PATIENT_FORM_TEST_IDS.PHONE_NUMBER_FORM_CONTROL,
            inputProps: {
              'data-testid': CREATE_PATIENT_FORM_TEST_IDS.PHONE_NUMBER,
            },
            sx: styles.input,
            placeholder: 'Phone Number',
            mask: '_',
            format: '(###) ###-####',
            fullWidth: true,
          }}
        />
      </FormControl>
      <FormControl sx={styles.formControl} fullWidth>
        <Typography variant="label">Date of Birth</Typography>
        <LocalizationProvider>
          <FormDatePicker<CreatePatientFormFields, string, string>
            name="dateOfBirth"
            control={control}
            datePickerProps={{
              maxDate: new Date().toISOString(),
            }}
            textFieldProps={{
              'data-testid':
                CREATE_PATIENT_FORM_TEST_IDS.DATE_OF_BIRTH_FORM_CONTROL,
              fullWidth: true,
              inputProps: {
                'data-testid': CREATE_PATIENT_FORM_TEST_IDS.DATE_OF_BIRTH,
                placeholder: 'Date of Birth',
              },
              sx: styles.input,
            }}
          />
        </LocalizationProvider>
      </FormControl>
      <FormControl
        data-testid={CREATE_PATIENT_FORM_TEST_IDS.ASSIGNED_SEX_FORM_CONTROL}
        sx={styles.formControl}
        fullWidth
      >
        <Typography variant="label">Assigned Sex at Birth</Typography>
        <FormSelect
          name="assignedSexAtBirth"
          control={control}
          selectProps={{
            'data-testid': CREATE_PATIENT_FORM_TEST_IDS.ASSIGNED_SEX,
            sx: styles.input,
            fullWidth: true,
            renderValue: (value) => {
              if (!value) {
                return (
                  <Typography sx={styles.defaultSelectValue}>
                    Select Assigned Sex at Birth
                  </Typography>
                );
              }

              return <>{value}</>;
            },
            displayEmpty: true,
          }}
        >
          {ASSIGNED_SEX_OPTIONS.map((option) => (
            <MenuItem
              data-testid={CREATE_PATIENT_FORM_TEST_IDS.getCreatePatientFormAssignedSexOptionTestId(
                option.dataTestId
              )}
              key={option.value}
              value={option.value}
            >
              {option.label}
            </MenuItem>
          ))}
        </FormSelect>
      </FormControl>
      <FormControl
        data-testid={CREATE_PATIENT_FORM_TEST_IDS.GENDER_IDENTITY_FORM_CONTROL}
        sx={styles.formControl}
        fullWidth
      >
        <Typography variant="label">Gender Identity</Typography>

        <FormSelect
          name="genderIdentity"
          control={control}
          selectProps={{
            'data-testid': CREATE_PATIENT_FORM_TEST_IDS.GENDER_IDENTITY,
            sx: styles.input,
            fullWidth: true,
            displayEmpty: true,
            renderValue: (value) => {
              if (!value) {
                return (
                  <Typography sx={styles.defaultSelectValue}>
                    Select Gender Identity
                  </Typography>
                );
              }

              return <>{value}</>;
            },
          }}
        >
          {GENDER_IDENTITY_OPTIONS.map((option) => (
            <MenuItem
              data-testid={CREATE_PATIENT_FORM_TEST_IDS.getCreatePatientFormGenderIdentityOptionTestId(
                option.dataTestId
              )}
              key={option.value}
              value={option.value}
            >
              {option.label}
            </MenuItem>
          ))}
        </FormSelect>
        <FormHelperText>Optional</FormHelperText>
      </FormControl>
      <FormControl sx={styles.formControl} fullWidth>
        <Button
          data-testid={CREATE_PATIENT_FORM_TEST_IDS.SUBMIT_BUTTON}
          variant="contained"
          disabled={isSubmitButtonDisabled}
          type="submit"
          fullWidth
        >
          Save
        </Button>
      </FormControl>
    </form>
  );
};

export default CreatePatientForm;
