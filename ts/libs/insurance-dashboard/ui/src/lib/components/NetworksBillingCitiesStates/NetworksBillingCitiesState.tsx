import { FC, useState } from 'react';
import {
  Switch,
  Box,
  Grid,
  Typography,
  Paper,
  makeSxStyles,
  ExpandLessIcon,
  ExpandMoreIcon,
  Chip,
  colorManipulator,
} from '@*company-data-covered*/design-system';
import { NETWORKS_BILLING_CITIES_STATES_TEST_IDS } from './testIds';
import { BillingCity, Modality, ServiceLine, State } from '../../types';

const makeStyles = ({
  expanded,
  active,
}: {
  expanded: boolean;
  active: boolean;
}) =>
  makeSxStyles({
    stateRoot: {
      mt: 3,
    },
    stateHeader: (theme) => ({
      p: 3,
      alignItems: 'center',
      justifyContent: 'space-between',
      background: !active
        ? theme.palette.grey[100]
        : colorManipulator.alpha(theme.palette.success.main, 0.08),
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
      borderBottomLeftRadius: !expanded ? 6 : 0,
      borderBottomRightRadius: !expanded ? 6 : 0,
    }),
    stateTitle: {
      ml: 3,
    },
    expandContainer: {
      display: 'flex',
    },
    billingCityContainer: (theme) => ({
      m: 3,
      pb: 3,
      '&:not(:last-child)': {
        borderBottom: `1px solid ${theme.palette.divider}`,
      },
    }),
    serviceLinesContainer: {
      rowGap: 3,
      columnGap: 17,
      mt: 3,
    },
    modalityContainer: {
      width: 'max-content',
      alignItems: 'center',
      ml: -1.5,
    },
  });

type ModalityId = Modality['id'];
type BillingCityId = BillingCity['id'];
type ServiceLineId = ServiceLine['id'];

export interface NetworksBillingCitiesStateProps {
  state: State;
  serviceLines: ServiceLine[];
  modalities: Modality[];
  isStateActive: boolean;
  selectedModalityIdsForBillingCity: Record<
    BillingCityId,
    Record<ServiceLineId, ModalityId[]>
  >;
  onChangeModality(
    billingCityId: BillingCityId,
    seviceLineId: ServiceLineId,
    modalityId: ModalityId
  ): void;
  isDisabled?: boolean;
}

const NetworksBillingCitiesState: FC<NetworksBillingCitiesStateProps> = ({
  state,
  serviceLines,
  modalities,
  onChangeModality,
  isStateActive,
  selectedModalityIdsForBillingCity,
  isDisabled = false,
}) => {
  const [isStateExpanded, setIsStateExpanded] = useState<boolean>(false);
  const classes = makeStyles({
    expanded: isStateExpanded,
    active: isStateActive,
  });

  const handleSwitchModality = ({
    billingCityId,
    seviceLineId,
    modalityId,
  }: {
    billingCityId: BillingCityId;
    seviceLineId: ServiceLineId;
    modalityId: ModalityId;
  }) => {
    onChangeModality(billingCityId, seviceLineId, modalityId);
  };

  const toggleExpanded = () =>
    setIsStateExpanded((prevIsStateExpanded) => !prevIsStateExpanded);

  const renderBillingCity = (billingCity: BillingCity) => {
    const billingCityTestIdSelctor =
      NETWORKS_BILLING_CITIES_STATES_TEST_IDS.getBillingCityTestId(
        state.id,
        billingCity.id
      );

    return (
      <Box
        key={billingCityTestIdSelctor}
        sx={classes.billingCityContainer}
        data-testid={billingCityTestIdSelctor}
      >
        <Typography variant="h5">
          {billingCity.name} ({billingCity.shortName})
        </Typography>
        <Grid container sx={classes.serviceLinesContainer}>
          {serviceLines.map((serviceLine) => {
            const serviceLineTestIdSelctor =
              NETWORKS_BILLING_CITIES_STATES_TEST_IDS.getServiceLineTestId(
                state.id,
                billingCity.id,
                serviceLine.id
              );

            return (
              <Grid
                item
                key={serviceLineTestIdSelctor}
                data-testid={serviceLineTestIdSelctor}
                xs={3}
              >
                <Typography variant="h6">{serviceLine.name}</Typography>

                {modalities.map((modality) => {
                  const isModalityChecked = !!selectedModalityIdsForBillingCity[
                    billingCity.id
                  ]?.[serviceLine.id]?.includes(modality.id);

                  const modalityTestIdSelctor =
                    NETWORKS_BILLING_CITIES_STATES_TEST_IDS.getModalityTestId(
                      state.id,
                      billingCity.id,
                      serviceLine.id,
                      modality.id
                    );

                  return (
                    <Grid
                      key={modalityTestIdSelctor}
                      container
                      sx={classes.modalityContainer}
                    >
                      <Switch
                        color="success"
                        data-testid={modalityTestIdSelctor}
                        checked={isModalityChecked}
                        onChange={() =>
                          handleSwitchModality({
                            billingCityId: billingCity.id,
                            seviceLineId: serviceLine.id,
                            modalityId: modality.id,
                          })
                        }
                        disabled={isDisabled}
                      />
                      <Typography>{modality.displayName}</Typography>
                    </Grid>
                  );
                })}
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  return (
    <Paper sx={classes.stateRoot}>
      <Grid
        container
        sx={classes.stateHeader}
        data-testid={NETWORKS_BILLING_CITIES_STATES_TEST_IDS.getStateTestId(
          state.id
        )}
        onClick={toggleExpanded}
      >
        <Grid item sx={classes.expandContainer}>
          {isStateExpanded ? (
            <ExpandLessIcon
              color="primary"
              data-testid={NETWORKS_BILLING_CITIES_STATES_TEST_IDS.getStateExpandedArrowTestId(
                state.id
              )}
            />
          ) : (
            <ExpandMoreIcon
              color="primary"
              data-testid={NETWORKS_BILLING_CITIES_STATES_TEST_IDS.getStateCollapsedArrowTestId(
                state.id
              )}
            />
          )}
          <Typography variant="h5" sx={classes.stateTitle}>
            {state.name}
          </Typography>
        </Grid>
        <Chip
          data-testid={NETWORKS_BILLING_CITIES_STATES_TEST_IDS.getStateActiveChip(
            state.id
          )}
          color={isStateActive ? 'success' : 'default'}
          label={isStateActive ? 'Active' : 'Inactive'}
        />
      </Grid>
      {isStateExpanded && state.billingCities.map(renderBillingCity)}
    </Paper>
  );
};

export default NetworksBillingCitiesState;
