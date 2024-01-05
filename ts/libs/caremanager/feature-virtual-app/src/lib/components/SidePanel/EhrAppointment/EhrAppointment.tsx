import { FC, useState } from 'react';
import {
  Typography,
  makeSxStyles,
  Button,
  Grid,
} from '@*company-data-covered*/design-system';
import { EHR_APPOINTMENT_TEST_IDS } from '../testIds';
import {
  CreateEhrAppointmentDialog,
  CreateEhrAppointmentDialogProps,
} from './CreateEhrAppointmentDialog';

export const EHR_APPOINTMENT_MOCK = {
  ehrAppointment: {
    patientId: '32323',
    encounterId: 'Signa Commercial',
    orderId: '012324',
  },
};

const styles = makeSxStyles({
  container: {
    borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
    backgroundColor: (theme) => theme.palette.background.paper,
  },
  ehrDetails: {
    flexDirection: 'column',
  },
  textSecondary: {
    width: 150,
    color: (theme) => theme.palette.text.secondary,
  },
  text: {
    textAlign: 'left',
  },
  createEhrSection: {
    display: 'flex',
    justifyContent: 'center',
    p: 1,
    mb: 1,
  },
  button: {
    right: 8,
    top: 8,
  },
});

export const CREATE_EHR_APPOINTMENT_DIALOG_MOCKED_DATA: Omit<
  CreateEhrAppointmentDialogProps,
  'isOpen' | 'onClose' | 'onSave'
> = {
  name: 'Juan Pablo Ortiz',
  birthDate: '08/16/1967',
  phoneNumber: '(629) 555-0129',
  sex: 'M',
  age: '54',
};

export interface EhrAppointmentProps {
  ehrAppointment?: {
    patientId: string;
    encounterId: string;
    orderId: string;
  };
}

export const EhrAppointment: FC<EhrAppointmentProps> = ({ ehrAppointment }) => {
  const [isCreateEhrAppoitmentDialogOpen, setIsCreateEhrAppoitmentDialogOpen] =
    useState(false);

  const onCreateEhrAppointment = () => {
    setIsCreateEhrAppoitmentDialogOpen(!isCreateEhrAppoitmentDialogOpen);
  };

  const onSaveEhrAppointment = () => {
    //TODO(PE-2540): connect to the BE
    return;
  };

  return (
    <Grid
      container
      gap={2}
      sx={styles.container}
      data-testid={EHR_APPOINTMENT_TEST_IDS.CONTAINER}
    >
      <Typography variant="h6">EHR Appointment</Typography>
      {ehrAppointment ? (
        <Grid
          container
          gap={2}
          sx={styles.ehrDetails}
          data-testid={EHR_APPOINTMENT_TEST_IDS.EHR_DETAILS}
        >
          <Grid container>
            <Typography variant="body2" sx={styles.textSecondary}>
              Patient ID
            </Typography>
            <Typography
              variant="body2"
              data-testid={EHR_APPOINTMENT_TEST_IDS.EHR_DETAILS_PATIENT_ID}
            >
              YES - MRN {ehrAppointment.patientId}
            </Typography>
          </Grid>
          <Grid container>
            <Typography variant="body2" sx={styles.textSecondary}>
              Encounter ID
            </Typography>
            <Typography
              variant="body2"
              data-testid={EHR_APPOINTMENT_TEST_IDS.EHR_DETAILS_ENCOUNTER_ID}
            >
              {ehrAppointment.encounterId}
            </Typography>
          </Grid>
          <Grid container>
            <Typography variant="body2" sx={styles.textSecondary}>
              Order ID
            </Typography>
            <Typography
              variant="body2"
              data-testid={EHR_APPOINTMENT_TEST_IDS.EHR_DETAILS_ORDER_ID}
            >
              {ehrAppointment.orderId}
            </Typography>
          </Grid>
        </Grid>
      ) : (
        <Grid container sx={styles.createEhrSection}>
          {/* //TODO(PE-2540): change to the real data */}
          <Typography variant="body2">
            Cough/Upper Respiratory Infection/Dizziness
          </Typography>
          <Button
            variant="contained"
            sx={styles.button}
            data-testid={EHR_APPOINTMENT_TEST_IDS.CREATE_EHR_BUTTON}
            onClick={onCreateEhrAppointment}
          >
            Create EHR Appointment
          </Button>
        </Grid>
      )}
      <CreateEhrAppointmentDialog
        {...CREATE_EHR_APPOINTMENT_DIALOG_MOCKED_DATA}
        isOpen={isCreateEhrAppoitmentDialogOpen}
        onSave={onSaveEhrAppointment}
        onClose={() => setIsCreateEhrAppoitmentDialogOpen(false)}
      />
    </Grid>
  );
};
