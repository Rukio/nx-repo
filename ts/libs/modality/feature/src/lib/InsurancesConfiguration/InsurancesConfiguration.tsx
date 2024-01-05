import { useCallback, useMemo, ChangeEvent, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { skipToken } from '@reduxjs/toolkit/query';
import {
  Typography,
  Box,
  Select,
  InputLabel,
  FormControl,
  MenuItem,
  makeSxStyles,
  SelectChangeEvent,
} from '@*company-data-covered*/design-system';
import {
  useGetInsuranceClassificationsQuery,
  setInsuranceClassification,
  selectInsuranceClassifications,
  selectSelectedInsuranceClassification,
  selectInsurancesSearch,
  setInsurancesSearch,
  selectMarkets,
  selectSelectedMarket,
  setMarket,
  useGetMarketsQuery,
  useGetModalitiesQuery,
  selectModalities,
  useGetInsurancePlansQuery,
  selectSortedInsurancePlans,
  selectInsurancesCurrentPage,
  selectInsurancesRowsPerPage,
  setInsurancesCurrentPage,
  setInsurancesRowsPerPage,
  InsurancePlan,
  selectSelectedServiceLine,
  InsurancesConfigurationState,
  setInsuranceSortBy,
  setInsuranceSortOrder,
  useGetModalityConfigsQuery,
  selectSelectedModalityConfigs,
  updateModalityConfig,
  useAppDispatch,
} from '@*company-data-covered*/modality/data-access';
import { InsuranceFilters, InsurancesTable } from '@*company-data-covered*/modality/ui';
import { InsuranceClassification } from '@*company-data-covered*/station/data-access';
import usePagination from '../hooks/usePagination';

import { INSURANCE_CONFIGURATION_TEST_IDS } from './testIds';
import { useDebouncedCallback } from '@*company-data-covered*/shared/util/hooks';

const makeStyles = () =>
  makeSxStyles({
    sectionTitle: {
      fontWeight: 600,
    },
    description: {
      color: 'text.secondary',
      width: '100%',
    },
    container: {
      pt: 4,
      display: 'flex',
      alignItems: 'center',
      maxWidth: '70%',
      gap: 4,
    },
    controlsWrapper: {
      display: 'flex',
      justifyContent: 'flex-end',
      mt: 3,
    },
    submitButton: {
      ml: 3,
    },
  });

const InsurancesConfiguration: React.FC = () => {
  const classes = makeStyles();
  useGetModalitiesQuery();
  const dispatch = useAppDispatch();
  const { modalities } = useSelector(selectModalities);
  const selectedInsuranceClassification = useSelector(
    selectSelectedInsuranceClassification
  );
  const currentPage = useSelector(selectInsurancesCurrentPage);
  const rowsPerPage = useSelector(selectInsurancesRowsPerPage);
  const searchText = useSelector(selectInsurancesSearch);
  const { markets, isLoading: isLoadingMarkets } = useSelector(selectMarkets);
  const selectedMarket = useSelector(selectSelectedMarket);
  const modalityConfigs = useSelector(selectSelectedModalityConfigs);
  const {
    data: insuranceClassifications = [],
    isLoading: isLoadingInsuranceClassifications,
  } = useSelector(selectInsuranceClassifications);
  const selectedServiceLine = useSelector(selectSelectedServiceLine);

  useGetModalityConfigsQuery(selectedServiceLine?.id || skipToken, {
    skip: !selectedServiceLine?.id,
    refetchOnMountOrArgChange: true,
  });

  const insurancePlansQuery = useMemo(() => {
    if (!selectedMarket?.id) {
      return skipToken;
    }

    return {
      marketId: selectedMarket.id,
      search: searchText,
      classificationId: selectedInsuranceClassification?.id,
    };
  }, [selectedMarket?.id, searchText, selectedInsuranceClassification?.id]);

  const { insurancePlans, sortBy, sortOrder } = useSelector(
    selectSortedInsurancePlans(insurancePlansQuery)
  );

  const insurancePlansToShow = usePagination<InsurancePlan>(
    insurancePlans,
    currentPage,
    rowsPerPage
  );

  useGetInsuranceClassificationsQuery();
  useGetMarketsQuery();
  useGetInsurancePlansQuery(insurancePlansQuery);

  useEffect(() => {
    dispatch(setInsurancesCurrentPage({ currentPage: 0 }));
  }, [
    rowsPerPage,
    searchText,
    sortBy,
    sortOrder,
    selectedInsuranceClassification?.id,
    dispatch,
  ]);

  const onSelectInsuranceClassification = (value?: InsuranceClassification) =>
    dispatch(
      setInsuranceClassification({ selectedInsuranceClassification: value })
    );
  const onMarketChange = useCallback(
    (event: SelectChangeEvent<number>) => {
      const marketId = event.target.value;
      const market = markets.find((marketItem) => marketItem.id === marketId);
      if (market) {
        dispatch(setMarket({ selectedMarket: market }));
      }
    },
    [markets, dispatch]
  );
  const onChangePage = (page: number) =>
    dispatch(setInsurancesCurrentPage({ currentPage: page }));
  const onChangeRowsPerPage = (rows: number) =>
    dispatch(setInsurancesRowsPerPage({ rowsPerPage: rows }));
  const onChangeSearch = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => dispatch(setInsurancesSearch({ search: event.target.value }));
  const onChangeSearchDebounced = useDebouncedCallback(onChangeSearch);
  const onChangeSortOrder = (
    value: InsurancesConfigurationState['sortOrder']
  ) => dispatch(setInsuranceSortOrder({ sortOrder: value }));
  const onChangeSortBy = (value: InsurancesConfigurationState['sortBy']) =>
    dispatch(setInsuranceSortBy({ sortBy: value }));
  const onChangeModalityConfig = (value: {
    insurancePlanId: number;
    modalityId: number;
  }) => {
    if (selectedMarket?.id && selectedServiceLine?.id) {
      dispatch(
        updateModalityConfig({
          serviceLineId: selectedServiceLine.id,
          marketId: selectedMarket.id,
          ...value,
        })
      );
    }
  };

  return (
    <>
      <Typography variant="body1" sx={classes.sectionTitle}>
        Insurance Configuration
      </Typography>
      <Box sx={classes.container}>
        <FormControl fullWidth>
          <InputLabel id={INSURANCE_CONFIGURATION_TEST_IDS.MARKET_SELECT_LABEL}>
            Select a Market
          </InputLabel>
          <Select
            data-testid={INSURANCE_CONFIGURATION_TEST_IDS.MARKET_SELECT}
            labelId={INSURANCE_CONFIGURATION_TEST_IDS.MARKET_SELECT_LABEL}
            label="Select a Market"
            onChange={onMarketChange}
            value={selectedMarket?.id || ''}
            disabled={isLoadingMarkets}
          >
            {markets.map((item) => (
              <MenuItem
                data-testid={
                  INSURANCE_CONFIGURATION_TEST_IDS.MARKET_SELECT_OPTION
                }
                key={item.id}
                value={item.id}
              >
                {item.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography
          variant="body1"
          data-testid={INSURANCE_CONFIGURATION_TEST_IDS.MARKET_DESCRIPTION}
          sx={classes.description}
        >
          Available insurance plans are inherited from the{' '}
          <b>{selectedServiceLine?.name}</b>
          &nbsp; service line for the &nbsp;
          <b>{selectedMarket?.name}</b>
          &nbsp; market.
        </Typography>
      </Box>
      <InsuranceFilters
        searchText={searchText}
        filterOptions={insuranceClassifications}
        onChangeSearch={onChangeSearchDebounced}
        filterBy={selectedInsuranceClassification}
        onFilterByChange={onSelectInsuranceClassification}
        disableFilter={isLoadingInsuranceClassifications}
      />
      <InsurancesTable
        page={currentPage}
        modalities={modalities}
        onChangePage={onChangePage}
        insurances={insurancePlansToShow}
        total={insurancePlans.length}
        rowsPerPage={rowsPerPage}
        onChangeRowsPerPage={onChangeRowsPerPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onChangeSortOrder={onChangeSortOrder}
        onChangeSortBy={onChangeSortBy}
        selectedModalities={
          selectedMarket ? modalityConfigs?.[selectedMarket?.id] : {}
        }
        onChangeModality={onChangeModalityConfig}
      />
    </>
  );
};

export default InsurancesConfiguration;
