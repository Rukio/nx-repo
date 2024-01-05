import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  PayersTable,
  PayersFilters,
  FilterOption,
  PayersSortDirection,
  FilterOptionTitle,
  FilterOptionHeaderTitle,
  Payer,
  PayersSortFields,
} from '@*company-data-covered*/insurance/ui';
import {
  useLazyGetPayersQuery,
  useGetPayerGroupsQuery,
  selectPayersSort,
  selectPayersFilterOptions,
  setPayersSort,
  setPayersSearchString,
  useAppDispatch,
  PayersQuery,
  selectPaginatedPayersData,
  selectPage,
  selectRowsPerPage,
  setPage,
  setRowsPerPage,
  useGetStatesQuery,
  selectStatesData,
  setPayersStateFilter,
  setPayersActiveStateFilter,
  resetPayersStateFilter,
  InsurancePayer,
  getVisibleFilterOptions,
} from '@*company-data-covered*/insurance/data-access';
import { Box, makeSxStyles } from '@*company-data-covered*/design-system';
import { INSURANCE_DASHBOARD_ROUTES } from '../constants';
import { useDebouncedCallback } from '@*company-data-covered*/shared/util/hooks';

const makeStyles = () =>
  makeSxStyles({
    tableWrapper: {
      mt: 4,
    },
  });

export const transformPayersForUI = (payers: InsurancePayer[]): Payer[] =>
  payers.map((payer) => ({
    ...payer,
    link: INSURANCE_DASHBOARD_ROUTES.getPayerDetailsTabPath(payer.id),
  }));

const PayersList = () => {
  const dispatch = useAppDispatch();

  const { field: sortField, direction: sortDirection } =
    useSelector(selectPayersSort);
  const {
    payerName = '',
    stateAbbrs = [],
    activeStateAbbrs = [],
  } = useSelector(selectPayersFilterOptions);
  const query: PayersQuery = {
    sortField,
    sortDirection,
    payerName,
    stateAbbrs,
  };

  const [fetchPayers] = useLazyGetPayersQuery();
  useGetPayerGroupsQuery();
  useGetStatesQuery();

  useEffect(() => {
    fetchPayers(query);
    // warning ignored due to infinite number of requests due to query
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      dispatch(resetPayersStateFilter());
      dispatch(setPayersSearchString(''));
    };
  }, [dispatch]);

  const states = useSelector(selectStatesData);
  const { paginatedPayers: payers, total: payersLength } = useSelector(
    selectPaginatedPayersData(query)
  );
  const page = useSelector(selectPage);
  const rowsPerPage = useSelector(selectRowsPerPage);

  const styles = makeStyles();

  const getTransformedFilters = (): FilterOption[] => {
    const filters: FilterOption[] = [
      {
        title: FilterOptionTitle.STATE,
        optionsTitle: FilterOptionHeaderTitle.STATES,
        options: states.map((state) => ({
          id: state.abbreviation,
          name: state.name,
        })),
        filteredOptions: [],
        filterBy: activeStateAbbrs,
        searchText: '',
      },
    ];

    return filters;
  };

  const payerFilters = getTransformedFilters();

  const payerFiltersInitialSearchValues = payerFilters.map(
    ({ searchText }) => searchText
  );

  const [payerFiltersSearchValues, setPayerFiltersSearchValues] = useState(
    payerFiltersInitialSearchValues
  );

  const visiblePayerFilters = useMemo(
    () => getVisibleFilterOptions(payerFilters, payerFiltersSearchValues),
    [payerFilters, payerFiltersSearchValues]
  );

  const onChangeSortOrder = (
    sortFieldValue: PayersSortFields,
    value: PayersSortDirection
  ) => {
    if (value) {
      dispatch(setPayersSort({ field: sortFieldValue, direction: value }));
      fetchPayers({
        ...query,
        sortField: sortFieldValue,
        sortDirection: value,
      });
    }
  };

  const onFetchFiltredPayersList = (payerNameSearchString: string) => {
    fetchPayers({
      ...query,
      payerName: payerNameSearchString,
    });
  };

  const onSearchPayerByNameDebounced = useDebouncedCallback(
    onFetchFiltredPayersList
  );

  const onSearchPayerByName = (payerNameSearchString: string) => {
    dispatch(setPayersSearchString(payerNameSearchString));
    onSearchPayerByNameDebounced(payerNameSearchString);
  };

  const onSelectFilterOptions = (filter: FilterOption) => {
    switch (filter.title) {
      case FilterOptionTitle.STATE: {
        dispatch(setPayersStateFilter(activeStateAbbrs));
        fetchPayers({
          ...query,
          stateAbbrs: activeStateAbbrs,
        });
        break;
      }
      default:
        break;
    }

    setPayerFiltersSearchValues(payerFiltersInitialSearchValues);
  };

  const onFilterByChange = (filter: FilterOption, value?: string) => {
    if (!value) {
      return;
    }
    switch (filter.title) {
      case FilterOptionTitle.STATE: {
        dispatch(
          setPayersActiveStateFilter(
            !activeStateAbbrs.includes(value)
              ? [...activeStateAbbrs, value]
              : [...activeStateAbbrs].filter((stateAbbr) => stateAbbr !== value)
          )
        );
        break;
      }
      default:
        break;
    }
  };

  const onClearFilterOptions = (filter: FilterOption) => {
    switch (filter.title) {
      case FilterOptionTitle.STATE: {
        dispatch(resetPayersStateFilter());
        fetchPayers({
          ...query,
          stateAbbrs: [],
        });
        break;
      }
      default:
        break;
    }

    setPayerFiltersSearchValues(payerFiltersInitialSearchValues);
  };
  const onChangePage = (pageNew: number) => {
    dispatch(setPage({ page: pageNew }));
  };
  const onChangeRowsPerPage = (rowsPerPageNew: number) => {
    dispatch(setRowsPerPage({ rowsPerPage: rowsPerPageNew }));
    dispatch(setPage({ page: 0 }));
  };

  const onChangeFilterOptionSearch = (filter: FilterOption, value: string) => {
    const payerFilterIndex = payerFilters.findIndex(
      (payerFilter) => payerFilter.title === filter.title
    );
    setPayerFiltersSearchValues((prev) => {
      const current = [...prev];
      current[payerFilterIndex] = value;

      return current;
    });
  };

  return (
    <Box sx={styles.tableWrapper}>
      <PayersFilters
        searchText={payerName}
        filters={visiblePayerFilters}
        onFilterByChange={onFilterByChange}
        onChangeSearch={onSearchPayerByName}
        onChangeFilterOptionSearch={onChangeFilterOptionSearch}
        onClearFilterOptions={onClearFilterOptions}
        onSelectFilterOptions={onSelectFilterOptions}
      />
      <PayersTable
        total={payersLength}
        page={page}
        rowsPerPage={rowsPerPage}
        onChangeSortOrder={onChangeSortOrder}
        onChangePage={onChangePage}
        onChangeRowsPerPage={onChangeRowsPerPage}
        sortField={sortField}
        sortOrder={sortDirection}
        payers={transformPayersForUI(payers)}
      />
    </Box>
  );
};

export default PayersList;
