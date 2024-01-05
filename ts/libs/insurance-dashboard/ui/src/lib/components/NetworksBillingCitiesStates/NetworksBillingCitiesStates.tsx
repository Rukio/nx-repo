import { FC } from 'react';
import NetworksBillingCitiesState, {
  NetworksBillingCitiesStateProps,
} from './NetworksBillingCitiesState';
import { Box, makeSxStyles } from '@*company-data-covered*/design-system';
import { NETWORKS_BILLING_CITIES_STATES_TEST_IDS } from './testIds';
import { ServiceLine, Modality, State, BillingCity } from '../../types';

const makeStyles = () =>
  makeSxStyles({
    statesRoot: {
      width: '100%',
      mt: 3,
      alignItems: 'center',
    },
  });

type ModalityId = Modality['id'];
type BillingCityId = BillingCity['id'];
type ServiceLineId = ServiceLine['id'];

export interface NetworksBillingCitiesStatesProps {
  states: State[];
  onChangeModality: NetworksBillingCitiesStateProps['onChangeModality'];
  serviceLines: ServiceLine[];
  modalities: Modality[];
  selectedModalityIdsForBillingCity: Record<
    BillingCityId,
    Record<ServiceLineId, ModalityId[]>
  >;
  activeStatesIds: string[];
  isDisabled?: boolean;
}

const NetworksBillingCitiesStates: FC<NetworksBillingCitiesStatesProps> = ({
  states,
  onChangeModality,
  serviceLines,
  modalities,
  selectedModalityIdsForBillingCity,
  activeStatesIds,
  isDisabled = false,
}) => {
  const classes = makeStyles();

  const handleSwitchModality = (
    billingCityId: BillingCityId,
    seviceLineId: ServiceLineId,
    modalityId: ModalityId
  ) => {
    onChangeModality(billingCityId, seviceLineId, modalityId);
  };

  return (
    <Box
      sx={classes.statesRoot}
      data-testid={NETWORKS_BILLING_CITIES_STATES_TEST_IDS.ROOT}
    >
      {states.map((state) => {
        return (
          <NetworksBillingCitiesState
            selectedModalityIdsForBillingCity={
              selectedModalityIdsForBillingCity
            }
            modalities={modalities}
            serviceLines={serviceLines}
            key={NETWORKS_BILLING_CITIES_STATES_TEST_IDS.getStateTestId(
              state.id
            )}
            state={state}
            isStateActive={activeStatesIds.includes(state.id)}
            onChangeModality={handleSwitchModality}
            isDisabled={isDisabled}
          />
        );
      })}
    </Box>
  );
};

export default NetworksBillingCitiesStates;
