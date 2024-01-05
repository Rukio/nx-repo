import { ChangeEventHandler, FC, useState, useEffect } from 'react';
import {
  Typography,
  RadioGroup,
  Radio,
  makeSxStyles,
  FormControl,
  FormControlLabel,
  SelectChangeEvent,
  Alert,
  Grid,
} from '@*company-data-covered*/design-system';
import { NETWORKS_SERVICE_LINE_FORM_TEST_IDS } from './testIds';
import { ServiceLineAppointmentType, Modality } from '../../types';
import {
  AppointmentTypeServiceLine,
  ModalitiesGroup,
  ServiceLineAppointmentOption,
  NetworkAppointmentType,
} from './ModalitiesGroup';

export type NetworksServiceLineFormProps = {
  onSelectAppointmentType: ({
    appointmentTypeName,
    modalityType,
    serviceLineId,
    serviceLineAppointmentOption,
  }: {
    appointmentTypeName: string;
    modalityType: string;
    serviceLineId: string;
    serviceLineAppointmentOption: ServiceLineAppointmentOption;
  }) => void;
  serviceLine: AppointmentTypeServiceLine;
  appointmentTypes: ServiceLineAppointmentType[];
  modalities: Modality[];
  networkAppointmentTypes: NetworkAppointmentType[];
  isDisabled?: boolean;
};

const makeStyles = () =>
  makeSxStyles({
    serviceLineHeader: {
      mb: 1,
    },
  });

const NetworksServiceLineForm: FC<NetworksServiceLineFormProps> = ({
  serviceLine,
  onSelectAppointmentType,
  appointmentTypes,
  modalities,
  networkAppointmentTypes,
  isDisabled = false,
}) => {
  const styles = makeStyles();
  const [isAppointmentTypesSameForBoth, setIsAppointmentTypesSameForBoth] =
    useState(false);

  useEffect(() => {
    const isAppointmentTypesSimilarCheck =
      !networkAppointmentTypes.length ||
      (!!networkAppointmentTypes.length &&
        networkAppointmentTypes.every(
          ({ newPatientAppointmentType, existingPatientAppointmentType }) =>
            newPatientAppointmentType === existingPatientAppointmentType
        ));

    setIsAppointmentTypesSameForBoth(isAppointmentTypesSimilarCheck);
  }, [networkAppointmentTypes]);

  const handleToggleServiceLineAppointmentOption: ChangeEventHandler<
    HTMLInputElement
  > = (event) => {
    const { value } = event.target;
    const isAppointmentTypesSameForBothUpdated = value === 'true';
    setIsAppointmentTypesSameForBoth(isAppointmentTypesSameForBothUpdated);
    if (isAppointmentTypesSameForBothUpdated) {
      networkAppointmentTypes.forEach((networkAppointmentType) => {
        onSelectAppointmentType({
          appointmentTypeName:
            networkAppointmentType.newPatientAppointmentType || '',
          modalityType: networkAppointmentType.modalityType,
          serviceLineId: serviceLine.serviceLineId,
          serviceLineAppointmentOption:
            ServiceLineAppointmentOption.AllPatients,
        });
      });
    }
  };

  const handleSelectAppointmentType = (
    event: SelectChangeEvent<string>,
    modalityType: string,
    serviceLineId: string,
    serviceLineAppointmentOption: ServiceLineAppointmentOption
  ) => {
    const { value } = event.target;
    onSelectAppointmentType({
      appointmentTypeName: value,
      modalityType,
      serviceLineId,
      serviceLineAppointmentOption,
    });
  };

  if (serviceLine.disabled) {
    const serviceLineAlertTestIdSelector =
      NETWORKS_SERVICE_LINE_FORM_TEST_IDS.getServiceLineAlertTestId(
        serviceLine.serviceLineId
      );

    return (
      <Grid item xs={12}>
        <Typography
          data-testid={NETWORKS_SERVICE_LINE_FORM_TEST_IDS.getServiceLineFormHeaderTestId(
            serviceLine.serviceLineId
          )}
          variant="h6"
          sx={styles.serviceLineHeader}
        >
          {serviceLine.serviceLineName}
        </Typography>
        <Alert
          data-testid={serviceLineAlertTestIdSelector}
          severity="info"
          message={`There are currently no billing cities configured for ${serviceLine.serviceLineName}`}
        />
      </Grid>
    );
  }

  return (
    <Grid
      xs={12}
      item
      data-testid={NETWORKS_SERVICE_LINE_FORM_TEST_IDS.getServiceLineFormTestId(
        serviceLine.serviceLineId
      )}
    >
      <Grid container>
        <FormControl>
          <Typography
            data-testid={NETWORKS_SERVICE_LINE_FORM_TEST_IDS.getServiceLineFormHeaderTestId(
              serviceLine.serviceLineId
            )}
            variant="h6"
            sx={styles.serviceLineHeader}
          >
            {serviceLine.serviceLineName}
          </Typography>
          <RadioGroup
            name={serviceLine.serviceLineName}
            value={isAppointmentTypesSameForBoth}
            onChange={handleToggleServiceLineAppointmentOption}
          >
            <FormControlLabel
              data-testid={NETWORKS_SERVICE_LINE_FORM_TEST_IDS.getServiceLineActiveAppointmentTypesRadioLabelTestId(
                serviceLine.serviceLineId
              )}
              control={<Radio inputProps={{ 'aria-label': 'Status active' }} />}
              label="Same for new and existing patients"
              value="true"
              disabled={isDisabled}
            />
            <FormControlLabel
              data-testid={NETWORKS_SERVICE_LINE_FORM_TEST_IDS.getServiceLineInactiveAppointmentTypesRadioLabelTestId(
                serviceLine.serviceLineId
              )}
              control={
                <Radio inputProps={{ 'aria-label': 'Status inactive' }} />
              }
              label="Different for new and existing patients"
              value="false"
              disabled={isDisabled}
            />
          </RadioGroup>
        </FormControl>
        <Grid container spacing={5}>
          {isAppointmentTypesSameForBoth ? (
            <ModalitiesGroup
              serviceLine={serviceLine}
              appointmentTypes={appointmentTypes}
              handleSelectAppointmentType={handleSelectAppointmentType}
              header={'New/Existing Patient'}
              modalities={modalities}
              serviceLineAppointmentOption={
                ServiceLineAppointmentOption.AllPatients
              }
              networkAppointmentTypes={networkAppointmentTypes}
              isDisabled={isDisabled}
            />
          ) : (
            <>
              <ModalitiesGroup
                serviceLine={serviceLine}
                appointmentTypes={appointmentTypes}
                handleSelectAppointmentType={handleSelectAppointmentType}
                header={'New Patient'}
                modalities={modalities}
                serviceLineAppointmentOption={
                  ServiceLineAppointmentOption.NewPatients
                }
                networkAppointmentTypes={networkAppointmentTypes}
                isDisabled={isDisabled}
              />
              <ModalitiesGroup
                serviceLine={serviceLine}
                appointmentTypes={appointmentTypes}
                handleSelectAppointmentType={handleSelectAppointmentType}
                header={'Existing Patient'}
                modalities={modalities}
                serviceLineAppointmentOption={
                  ServiceLineAppointmentOption.ExistingPatients
                }
                networkAppointmentTypes={networkAppointmentTypes}
                isDisabled={isDisabled}
              />
            </>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default NetworksServiceLineForm;
