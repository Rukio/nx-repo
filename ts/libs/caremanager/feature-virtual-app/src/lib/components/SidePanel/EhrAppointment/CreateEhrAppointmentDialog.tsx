import { object, string, ObjectSchema } from 'yup';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import {
  DhDialog,
  DialogContent,
  FormControl,
  InputLabel,
  MenuItem,
  LocalizationProvider,
  Grid,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import {
  FormTimePicker,
  FormDatePicker,
  FormSelect,
  FormTextField,
  FormRadioGroup,
} from '@*company-data-covered*/shared/ui/forms';

import { CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS } from '../testIds';

interface EhrAppointmentDialogFieldValues {
  isNewAppointment: string;
  date?: string;
  time?: string;
  placeOfService?: string;
  appointmentType?: string;
  athenaPatientId?: string;
  athenaAppointmentId?: string;
}

const ehrAppointmentValidationSchema: ObjectSchema<EhrAppointmentDialogFieldValues> =
  object().shape({
    isNewAppointment: string().required(),
    date: string().when('isNewAppointment', {
      is: 'true',
      then: () => string().required('Date is required'),
      otherwise: () => string().notRequired(),
    }),
    time: string().when('isNewAppointment', {
      is: 'true',
      then: () => string().required('Time is required'),
      otherwise: () => string().notRequired(),
    }),
    placeOfService: string().when('isNewAppointment', {
      is: 'true',
      then: () => string().required('Place of Service is required'),
      otherwise: () => string().notRequired(),
    }),
    appointmentType: string().when('isNewAppointment', {
      is: 'true',
      then: () => string().required('Appointment Type is required'),
      otherwise: () => string().notRequired(),
    }),
    athenaPatientId: string().when('isNewAppointment', {
      is: 'false',
      then: () => string().required('Athena Patient ID is required'),
      otherwise: () => string().notRequired(),
    }),
    athenaAppointmentId: string().when('isNewAppointment', {
      is: 'false',
      then: () => string().required('Athena Appointment ID is required'),
      otherwise: () => string().notRequired(),
    }),
  });

export interface CreateEhrAppointmentDialogProps {
  name: string;
  birthDate: string;
  phoneNumber: string;
  sex: string;
  age: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const makeStyles = () =>
  makeSxStyles({
    container: {
      width: 700,
      height: 650,
    },
    modalHeader: {
      p: 2,
      border: (theme) => `1px solid ${theme.palette.divider}`,
      backgroundColor: (theme) => theme.palette.grey[50],
    },
    details: {
      mb: 1,
      'p:not(:last-child):after': {
        content: '"\\2022"',
        mx: 1,
        color: (theme) => theme.palette.text.disabled,
      },
    },
    newAppointment: {
      p: 2,
      border: (theme) => `1px solid ${theme.palette.divider}`,
      backgroundColor: (theme) => theme.palette.grey[50],
    },
    existingAppointment: {
      p: 2,
      border: (theme) => `1px solid ${theme.palette.divider}`,
      backgroundColor: (theme) => theme.palette.grey[50],
    },
    fieldWidth: { width: 256 },
    buttonText: { fontWeight: 600, fontSize: 14 },
  });

export const CreateEhrAppointmentDialog: React.FC<
  CreateEhrAppointmentDialogProps
> = ({ name, birthDate, phoneNumber, sex, age, isOpen, onClose, onSave }) => {
  const styles = makeStyles();

  const { control, handleSubmit } = useForm<EhrAppointmentDialogFieldValues>({
    mode: 'onSubmit',
    resolver: yupResolver(ehrAppointmentValidationSchema),
    defaultValues: {
      date: '',
      time: '',
      placeOfService: '',
      appointmentType: '',
      athenaPatientId: '',
      athenaAppointmentId: '',
      isNewAppointment: 'true',
    },
  });

  const isNewAppointment = useWatch({
    control,
    name: 'isNewAppointment',
  });

  const handleSave = () => {
    onSave();
    onClose();
  };

  return (
    <DhDialog
      isOpen={isOpen}
      handleClose={onClose}
      handleConfirm={handleSubmit(handleSave)}
      title="Create EHR Appointment"
      dialogProps={{ PaperProps: { sx: styles.container } }}
      content={
        <DialogContent
          data-testid={CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.CONTENT}
        >
          <Grid container flexDirection="column" gap={2}>
            <Grid container sx={styles.modalHeader} gap={2}>
              <Typography
                variant="h5"
                data-testid={CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.NAME}
              >
                {name}
              </Typography>
              <Grid container sx={styles.details}>
                <Typography
                  variant="body2"
                  data-testid={
                    CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.BIRTH_DATE
                  }
                >
                  {birthDate}
                </Typography>
                <Typography
                  variant="body2"
                  data-testid={
                    CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.AGE_AND_SEX
                  }
                >
                  {age}yo {sex}
                </Typography>
                <Typography
                  variant="body2"
                  data-testid={
                    CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.PHONE_NUMBER
                  }
                >
                  {phoneNumber}
                </Typography>
              </Grid>
            </Grid>
            <Grid container flexDirection="column" gap={2}>
              <Grid container sx={styles.newAppointment}>
                <FormRadioGroup
                  name="isNewAppointment"
                  control={control}
                  radioOptions={[
                    {
                      label: 'New Appointment',
                      value: 'true',
                      'data-testid':
                        CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.NEW_APPOINTMENT_RADIO_BUTTON,
                    },
                  ]}
                />
                {isNewAppointment === 'true' && (
                  <Grid>
                    <LocalizationProvider>
                      <Grid container gap={2} mb={2}>
                        <FormDatePicker
                          name="date"
                          control={control}
                          datePickerProps={{
                            maxDate: new Date().toString(),
                          }}
                          textFieldProps={{
                            sx: styles.fieldWidth,
                            'data-testid':
                              CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.DATE_PICKER,
                            inputProps: {
                              placeholder: 'Date',
                            },
                          }}
                        />
                        <FormTimePicker
                          name="time"
                          control={control}
                          textFieldProps={{
                            sx: styles.fieldWidth,
                            'data-testid':
                              CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.TIME_PICKER,
                            inputProps: {
                              placeholder: 'Time',
                            },
                          }}
                        />
                      </Grid>
                    </LocalizationProvider>
                    <Grid container gap={2}>
                      <FormControl sx={styles.fieldWidth}>
                        <InputLabel>Place of Service</InputLabel>
                        <FormSelect
                          name="placeOfService"
                          control={control}
                          selectProps={{
                            label: 'Place of Service',
                            'data-testid':
                              CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.PLACE_OF_SERVICE_SELECT,
                          }}
                        >
                          <MenuItem value="Clinic">Clinic</MenuItem>
                          <MenuItem value="Hospital">Hospital</MenuItem>
                        </FormSelect>
                      </FormControl>
                      <FormControl sx={styles.fieldWidth}>
                        <InputLabel>Appointment Type</InputLabel>
                        <FormSelect
                          name="appointmentType"
                          control={control}
                          selectProps={{
                            label: 'Appointment Type',
                            'data-testid':
                              CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.APPOINTMENT_TYPE_SELECT,
                          }}
                        >
                          <MenuItem value="General">General</MenuItem>
                          <MenuItem value="Specialist">Specialist</MenuItem>
                        </FormSelect>
                      </FormControl>
                    </Grid>
                  </Grid>
                )}
              </Grid>
              <Grid container sx={styles.existingAppointment}>
                <FormRadioGroup
                  name="isNewAppointment"
                  control={control}
                  radioOptions={[
                    {
                      label: 'Existing Appointment',
                      value: 'false',
                      'data-testid':
                        CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.EXISTING_APPOINTMENT_RADIO_BUTTON,
                    },
                  ]}
                />
                {isNewAppointment === 'false' && (
                  <Grid container gap={2} flexDirection={'column'}>
                    <FormControl>
                      <FormTextField
                        name="athenaPatientId"
                        control={control}
                        textFieldProps={{
                          sx: styles.fieldWidth,
                          label: 'Athena Patient ID',
                          'data-testid':
                            CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.ATHENA_PATIENT_ID_FIELD,
                        }}
                      />
                    </FormControl>
                    <FormControl>
                      <FormTextField
                        name="athenaAppointmentId"
                        control={control}
                        textFieldProps={{
                          sx: styles.fieldWidth,
                          label: 'Athena Appointment ID',
                          'data-testid':
                            CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.ATHENA_APPOINTMENT_ID_FIELD,
                        }}
                      />
                    </FormControl>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
      }
      cancelButtonLabel={
        <Typography
          sx={styles.buttonText}
          data-testid={CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.CANCEL_EHR_BUTTON}
        >
          Close
        </Typography>
      }
      confirmButtonLabel={
        <Typography
          sx={styles.buttonText}
          data-testid={CREATE_EHR_APPOINTMENT_DIALOG_TEST_IDS.SAVE_EHR_BUTTON}
        >
          Save Appointment
        </Typography>
      }
    />
  );
};
