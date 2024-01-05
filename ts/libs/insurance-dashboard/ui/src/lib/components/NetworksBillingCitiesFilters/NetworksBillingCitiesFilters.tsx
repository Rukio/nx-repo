import { FC } from 'react';
import {
  Grid,
  Typography,
  SelectChangeEvent,
  Select,
  MenuItem,
  makeSxStyles,
  FormControl,
  Button,
} from '@*company-data-covered*/design-system';
import { NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS } from './testIds';
import { State, ServiceLine } from '../../types';

export enum NetworkBillingCitiesFilterOptionTitle {
  StateId = 'stateId',
  ServiceLineId = 'serviceLineId',
  StatesStatusOption = 'statesStatusOption',
}

export enum StatesStatusOptions {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export const normalizedStatesStatusOptions = Object.values(
  StatesStatusOptions
).map((key) => ({
  status: key,
  title: key.charAt(0).toUpperCase() + key.slice(1) + ' States',
}));

const makeStyles = () =>
  makeSxStyles({
    filtersRoot: {
      alignItems: 'center',
    },
    filterByLabel: {
      color: 'text.secondary',
      mr: 2,
    },
    select: {
      color: 'text.secondary',
    },
    filterRoot: {
      mr: 2,
    },
  });

export interface NetworksBillingCitiesFiltersProps {
  states: State[];
  serviceLines: ServiceLine[];
  stateId?: string;
  statesStatusOption?: string;
  serviceLineId?: string;
  onChangeFilterValue: (name: string, value: string) => void;
  onResetFilterOptions: () => void;
}

const NetworksBillingCitiesFilters: FC<NetworksBillingCitiesFiltersProps> = ({
  states,
  serviceLines,
  stateId,
  statesStatusOption,
  serviceLineId,
  onChangeFilterValue,
  onResetFilterOptions,
}) => {
  const classes = makeStyles();

  const handleChangeFilterValue = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    onChangeFilterValue(name, value);
  };

  return (
    <Grid
      container
      sx={classes.filtersRoot}
      data-testid={NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.ROOT}
    >
      <Typography variant="body2" sx={classes.filterByLabel}>
        Filter by
      </Typography>
      <Grid item xs={1.5} sx={classes.filterRoot}>
        <FormControl
          fullWidth
          data-testid={
            NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.STATES_SELECT_CONTAINER
          }
        >
          <Select
            displayEmpty
            fullWidth
            data-testid={NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.STATES_SELECT}
            sx={classes.select}
            onChange={handleChangeFilterValue}
            name={NetworkBillingCitiesFilterOptionTitle.StateId}
            value={stateId || ''}
          >
            <MenuItem disabled value="">
              All States
            </MenuItem>
            {states.map((stateOption) => {
              const selector =
                NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.getStatesSelectOptionTestId(
                  stateOption.id
                );

              return (
                <MenuItem
                  key={selector}
                  value={stateOption.id}
                  data-testid={selector}
                >
                  {stateOption.name}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={1.5} sx={classes.filterRoot}>
        <FormControl
          fullWidth
          data-testid={
            NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.SERVICE_LINES_SELECT_CONTAINER
          }
        >
          <Select
            displayEmpty
            fullWidth
            data-testid={
              NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.SERVICE_LINES_SELECT
            }
            sx={classes.select}
            onChange={handleChangeFilterValue}
            name={NetworkBillingCitiesFilterOptionTitle.ServiceLineId}
            value={serviceLineId || ''}
          >
            <MenuItem disabled value="">
              All Service Lines
            </MenuItem>
            {serviceLines.map((serviceLineOption) => {
              const selector =
                NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.getServiceLinesSelectOptionTestId(
                  serviceLineOption.id
                );

              return (
                <MenuItem
                  key={selector}
                  value={serviceLineOption.id}
                  data-testid={selector}
                >
                  {serviceLineOption.name}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={1.5} sx={classes.filterRoot}>
        <FormControl
          fullWidth
          data-testid={
            NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.STATES_STATUS_SELECT_CONTAINER
          }
        >
          <Select
            displayEmpty
            fullWidth
            data-testid={
              NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.STATES_STATUS_SELECT
            }
            sx={classes.select}
            onChange={handleChangeFilterValue}
            name={NetworkBillingCitiesFilterOptionTitle.StatesStatusOption}
            value={statesStatusOption || ''}
          >
            <MenuItem disabled value="">
              All States Statuses
            </MenuItem>
            {normalizedStatesStatusOptions.map((statesStatus) => {
              const selector =
                NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.getStatesStatusSelectOptionTestId(
                  statesStatus.status
                );

              return (
                <MenuItem
                  key={selector}
                  value={statesStatus.status}
                  data-testid={selector}
                >
                  {statesStatus.title}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Grid>
      {(stateId || serviceLineId || statesStatusOption) && (
        <Grid item>
          <Button
            onClick={onResetFilterOptions}
            data-testid={
              NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.RESET_FILTERS_BUTTON
            }
          >
            Reset Filters
          </Button>
        </Grid>
      )}
    </Grid>
  );
};

export default NetworksBillingCitiesFilters;
