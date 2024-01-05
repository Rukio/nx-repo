import { FC, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { NetworksTable, NetworksFilters } from '@*company-data-covered*/modality/ui';
import { Typography, makeSxStyles } from '@*company-data-covered*/design-system';
import {
  useAppDispatch,
  useGetMarketsQuery,
  useGetModalitiesQuery,
  selectModalities,
  selectNetworksModalityConfigsHierarchy,
  selectDisplayedNetworks,
  selectNetworksSelectedMarket,
  useGetNetworksModalityConfigsQuery,
  useSearchInsuranceNetworksQuery,
  selectNetworksConfigurationSearchParams,
  setNetworksCurrentPage,
  setNetworksRowsPerPage,
  setNetworksSortBy,
  setNetworksSortOrder,
  NetworksSortBy,
  NetworksSortOrder,
  transformNetworksSearchParamsToDomain,
  selectSelectedServiceLine,
  selectMarkets,
  setNetworksMarket,
  setNetworksSearch,
  transformNetworksModalityConfigsQueryTo,
} from '@*company-data-covered*/modality/data-access';
import { useDebouncedCallback } from '@*company-data-covered*/shared/util/hooks';

const makeStyles = () =>
  makeSxStyles({
    sectionTitle: {
      fontWeight: 600,
      mb: 2.5,
    },
  });

const NetworksConfiguration: FC = () => {
  const styles = makeStyles();
  const dispatch = useAppDispatch();

  const selectedServiceLine = useSelector(selectSelectedServiceLine);
  const networksSearchParams = useSelector(
    selectNetworksConfigurationSearchParams
  );
  const { modalities } = useSelector(selectModalities);
  const { networks, total: totalNetworks } = useSelector(
    selectDisplayedNetworks(networksSearchParams)
  );
  const selectedNetworksModalityConfigs = useSelector(
    selectNetworksModalityConfigsHierarchy({
      serviceLineId: selectedServiceLine?.id,
    })
  );
  const { markets } = useSelector(selectMarkets);
  const selectedMarket = useSelector(selectNetworksSelectedMarket);

  useSearchInsuranceNetworksQuery(
    transformNetworksSearchParamsToDomain(networksSearchParams)
  );
  useGetNetworksModalityConfigsQuery(
    transformNetworksModalityConfigsQueryTo({
      serviceLineId: selectedServiceLine?.id,
    })
  );
  useGetModalitiesQuery();
  useGetMarketsQuery();

  useEffect(() => {
    dispatch(setNetworksCurrentPage({ page: 0 }));
  }, [
    networksSearchParams.rowsPerPage,
    networksSearchParams.search,
    networksSearchParams.sortBy,
    networksSearchParams.sortOrder,
    dispatch,
  ]);

  const handleChangePage = (page: number) => {
    dispatch(setNetworksCurrentPage({ page }));
  };
  const handleChangeRowsPerPage = (rowsPerPage: number) => {
    dispatch(setNetworksRowsPerPage({ rowsPerPage }));
  };
  const handleChangeSortBy = (sortBy: NetworksSortBy) => {
    dispatch(setNetworksSortBy({ sortBy }));
  };
  const handleChangeSortOrder = (sortOrder: NetworksSortOrder) => {
    dispatch(setNetworksSortOrder({ sortOrder }));
  };
  const handleChangeMarket = (marketId: number) => {
    const marketToSet = markets.find((market) => market.id === marketId);
    if (marketToSet) {
      dispatch(setNetworksMarket({ selectedMarket: marketToSet }));
    }
  };
  const handleChangeSearch = (search: string) => {
    dispatch(setNetworksSearch({ search }));
  };
  const handleChangeSearchDebounced = useDebouncedCallback(handleChangeSearch);

  return (
    <>
      <Typography sx={styles.sectionTitle} variant="body1">
        Insurance Networks
      </Typography>
      <NetworksFilters
        selectedMarket={selectedMarket}
        onChangeMarket={handleChangeMarket}
        defaultSearch={networksSearchParams.search}
        onChangeSearch={handleChangeSearchDebounced}
        markets={markets}
      />
      <NetworksTable
        modalities={modalities}
        networks={networks}
        selectedModalities={selectedNetworksModalityConfigs}
        page={networksSearchParams.page}
        rowsPerPage={networksSearchParams.rowsPerPage}
        onChangePage={handleChangePage}
        onChangeRowsPerPage={handleChangeRowsPerPage}
        onChangeSortBy={handleChangeSortBy}
        onChangeSortOrder={handleChangeSortOrder}
        sortBy={networksSearchParams.sortBy}
        sortOrder={networksSearchParams.sortOrder}
        total={totalNetworks}
      />
    </>
  );
};

export default NetworksConfiguration;
