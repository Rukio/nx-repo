import { useEffect, useMemo, useState } from 'react';
import {
  NetworksFilters as NetworkFiltersComponent,
  FilterOption,
} from '@*company-data-covered*/insurance/ui';
import {
  domainSelectStates,
  resetSelectedClassificationsToFilterNetworks,
  resetNetworksClassificationsFilter,
  resetNetworksStateFilter,
  resetSelectedStateAbbrsToFilterNetworks,
  selectSelectedNetworkFilterOptions,
  selectInsuranceClassifications,
  setSelectedClassificationsToFilterNetworks,
  setNetworksClassificationsFilter,
  setNetworksStateFilter,
  setSelectedStateAbbrsToFilterNetworks,
  useAppDispatch,
  useGetInsuranceClassificationsQuery,
  useGetStatesQuery,
  getVisibleFilterOptions,
} from '@*company-data-covered*/insurance/data-access';
import { useSelector } from 'react-redux';

export enum FilterOptionTitle {
  STATE = 'State',
  CLASSIFICATION = 'Classification',
}

const NetworksFilters = () => {
  useGetInsuranceClassificationsQuery();
  useGetStatesQuery();

  const { data: insuranceClassifications = [] } = useSelector(
    selectInsuranceClassifications
  );
  const { data: states = [] } = useSelector(domainSelectStates);
  const { selectedStateAbbrs, selectedInsuranceClassifications } = useSelector(
    selectSelectedNetworkFilterOptions
  );

  const dispatch = useAppDispatch();

  const getTransformedFilters = (): FilterOption[] => {
    const filters: FilterOption[] = [
      {
        title: FilterOptionTitle.STATE,
        optionsTitle: 'States',
        options: states.map((state) => ({
          id: state.abbreviation,
          name: state.name,
        })),
        filteredOptions: [],
        filterBy: selectedStateAbbrs,
        searchText: '',
      },
      {
        title: FilterOptionTitle.CLASSIFICATION,
        optionsTitle: 'Classifications',
        options: insuranceClassifications,
        filteredOptions: [],
        filterBy: selectedInsuranceClassifications,
        searchText: '',
      },
    ];

    return filters;
  };

  const networkFilters = getTransformedFilters();

  const networkFiltersInitialSearchValues = networkFilters.map(
    ({ searchText }) => searchText
  );

  const [networkFiltersSearchValues, setNetworkFiltersSearchValues] = useState(
    networkFiltersInitialSearchValues
  );

  const visibleNetworkFilters = useMemo(
    () => getVisibleFilterOptions(networkFilters, networkFiltersSearchValues),
    [networkFilters, networkFiltersSearchValues]
  );

  useEffect(() => {
    return () => {
      dispatch(resetSelectedStateAbbrsToFilterNetworks());
      dispatch(resetNetworksStateFilter());
      dispatch(resetSelectedClassificationsToFilterNetworks());
      dispatch(resetNetworksClassificationsFilter());
    };
  }, [dispatch]);

  const onFilterByChange = (filter: FilterOption, value?: string) => {
    if (!value) {
      return;
    }

    switch (filter.title) {
      case FilterOptionTitle.STATE:
        dispatch(setSelectedStateAbbrsToFilterNetworks(value));
        break;

      case FilterOptionTitle.CLASSIFICATION:
        dispatch(setSelectedClassificationsToFilterNetworks(value));
        break;

      default:
        break;
    }
  };

  const onChangeFilterOptionSearch = (filter: FilterOption, value: string) => {
    const networkFilterIndex = networkFilters.findIndex(
      (networkFilter) => networkFilter.title === filter.title
    );
    setNetworkFiltersSearchValues((prev) => {
      const current = [...prev];
      current[networkFilterIndex] = value;

      return current;
    });
  };

  const onClearFilterOptions = (filter: FilterOption) => {
    switch (filter.title) {
      case FilterOptionTitle.STATE:
        dispatch(resetSelectedStateAbbrsToFilterNetworks());
        dispatch(resetNetworksStateFilter());
        break;

      case FilterOptionTitle.CLASSIFICATION:
        dispatch(resetSelectedClassificationsToFilterNetworks());
        dispatch(resetNetworksClassificationsFilter());
        break;

      default:
        break;
    }

    setNetworkFiltersSearchValues(networkFiltersInitialSearchValues);
  };

  const onSelectFilterOptions = (filter: FilterOption) => {
    switch (filter.title) {
      case FilterOptionTitle.STATE:
        if (selectedStateAbbrs?.length > 0) {
          dispatch(setNetworksStateFilter(selectedStateAbbrs));
        }
        break;

      case FilterOptionTitle.CLASSIFICATION:
        if (selectedInsuranceClassifications?.length > 0) {
          dispatch(
            setNetworksClassificationsFilter(selectedInsuranceClassifications)
          );
        }
        break;

      default:
        break;
    }

    setNetworkFiltersSearchValues(networkFiltersInitialSearchValues);
  };

  return (
    <NetworkFiltersComponent
      filters={visibleNetworkFilters}
      onFilterByChange={onFilterByChange}
      onChangeFilterOptionSearch={onChangeFilterOptionSearch}
      onClearFilterOptions={onClearFilterOptions}
      onSelectFilterOptions={onSelectFilterOptions}
    />
  );
};

export default NetworksFilters;
