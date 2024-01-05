import { FC } from 'react';
import {
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { ServiceLineAppointmentType, Modality } from '../../../types';
import { NETWORKS_SERVICE_LINE_FORM_TEST_IDS } from '../testIds';

export enum ServiceLineAppointmentOption {
  ExistingPatients = 'existing',
  NewPatients = 'new',
  AllPatients = 'all',
}

export type AppointmentTypeServiceLine = {
  serviceLineId: string;
  serviceLineName: string;
  disabled?: boolean;
  newPatientAppointmentType?: string;
  existingPatientAppointmentType?: string;
};

export type NetworkAppointmentType = {
  networkId: string;
  serviceLineId: string;
  modalityType: string;
  newPatientAppointmentType?: string;
  existingPatientAppointmentType?: string;
};

export type ModalitiesGroupProps = {
  header: string;
  modalities: Modality[];
  serviceLine: AppointmentTypeServiceLine;
  serviceLineAppointmentOption: ServiceLineAppointmentOption;
  appointmentTypes: ServiceLineAppointmentType[];
  networkAppointmentTypes: NetworkAppointmentType[];
  handleSelectAppointmentType: (
    event: SelectChangeEvent<string>,
    modalityType: string,
    serviceLineId: string,
    serviceLineAppointmentOption: ServiceLineAppointmentOption
  ) => void;
  isDisabled?: boolean;
};

const makeStyles = () =>
  makeSxStyles({
    modalityHeader: {
      mb: 0.5,
    },
    newExistingPatientHeader: {
      fontSize: 12,
      fontWeight: 400,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      mb: 3,
      mt: 2,
    },
  });

const ModalitiesGroup: FC<ModalitiesGroupProps> = ({
  modalities,
  serviceLine,
  appointmentTypes,
  header,
  serviceLineAppointmentOption,
  networkAppointmentTypes,
  handleSelectAppointmentType,
  isDisabled = false,
}) => {
  const styles = makeStyles();

  const getSelectedAppointmentTypeValue = (modalityType: string) => {
    const selectedAppointmentType = networkAppointmentTypes.find(
      (appointmentType) =>
        appointmentType.serviceLineId === serviceLine.serviceLineId &&
        appointmentType.modalityType === modalityType
    );

    switch (serviceLineAppointmentOption) {
      case ServiceLineAppointmentOption.ExistingPatients:
        return selectedAppointmentType?.existingPatientAppointmentType;
      case ServiceLineAppointmentOption.AllPatients:
      case ServiceLineAppointmentOption.NewPatients:
      default:
        return selectedAppointmentType?.newPatientAppointmentType;
    }
  };

  return (
    <Grid
      data-testid={NETWORKS_SERVICE_LINE_FORM_TEST_IDS.getModalitiesGroupRoot(
        serviceLineAppointmentOption,
        serviceLine.serviceLineId
      )}
      item
      xs={5}
    >
      <Typography sx={styles.newExistingPatientHeader}>{header}</Typography>
      <Grid container direction="column" rowSpacing={3}>
        {modalities.map((modality) => {
          const selectLabelTestId =
            NETWORKS_SERVICE_LINE_FORM_TEST_IDS.getModalityAppointmentTypeSelectLabelTestId(
              serviceLineAppointmentOption,
              serviceLine.serviceLineId,
              modality.id
            );
          const modalityRootTestId =
            NETWORKS_SERVICE_LINE_FORM_TEST_IDS.getModalityRootTestId(
              serviceLineAppointmentOption,
              serviceLine.serviceLineId,
              modality.id
            );

          return (
            <Grid
              item
              key={modalityRootTestId}
              data-testid={modalityRootTestId}
            >
              <Typography
                data-testid={NETWORKS_SERVICE_LINE_FORM_TEST_IDS.getModalityHeaderTestId(
                  serviceLineAppointmentOption,
                  serviceLine.serviceLineId,
                  modality.id
                )}
                variant="subtitle2"
                sx={styles.modalityHeader}
              >
                {modality.displayName}
              </Typography>
              <FormControl fullWidth>
                <InputLabel
                  data-testid={selectLabelTestId}
                  id={selectLabelTestId}
                >
                  Select Appointment Type
                </InputLabel>
                <Select
                  labelId={selectLabelTestId}
                  label="Select Appointment Type"
                  name="appointmentTypes"
                  fullWidth
                  data-testid={NETWORKS_SERVICE_LINE_FORM_TEST_IDS.getModalityAppointmentTypeSelectTestId(
                    serviceLineAppointmentOption,
                    serviceLine.serviceLineId,
                    modality.id
                  )}
                  disabled={isDisabled}
                  value={getSelectedAppointmentTypeValue(modality.type) ?? ''}
                  onChange={(event) =>
                    handleSelectAppointmentType(
                      event,
                      modality.type,
                      serviceLine.serviceLineId,
                      serviceLineAppointmentOption
                    )
                  }
                >
                  {appointmentTypes.map((appointmentType) => {
                    const selector =
                      NETWORKS_SERVICE_LINE_FORM_TEST_IDS.getModalityAppointmentTypeSelectOptionTestId(
                        serviceLineAppointmentOption,
                        serviceLine.serviceLineId,
                        modality.id,
                        appointmentType.id
                      );

                    return (
                      <MenuItem
                        key={selector}
                        value={appointmentType.name}
                        data-testid={selector}
                      >
                        {appointmentType.name}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
          );
        })}
      </Grid>
    </Grid>
  );
};

export default ModalitiesGroup;
