import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { skipToken } from '@reduxjs/toolkit/query';
import {
  NetworksTable,
  Network,
  MuiSortDirection,
} from '@*company-data-covered*/insurance/ui';
import {
  useSearchNetworksListQuery,
  useGetInsuranceClassificationsQuery,
  selectPaginatedNetworks,
  InsuranceNetwork,
  setNetworksPage,
  setNetworksRowsPerPage,
  useAppDispatch,
  selectNetworksPage,
  selectNetworksRowsPerPage,
  selectAppliedNetworkFilterOptions,
  SearchInsuranceNetworkPayload,
  NetworksSortField,
  NetworksSortDirection,
  setNetworksSortDirection,
  setNetworksSortField,
} from '@*company-data-covered*/insurance/data-access';
import { Box, makeSxStyles } from '@*company-data-covered*/design-system';
import { INSURANCE_DASHBOARD_ROUTES, PayerPathParams } from '../constants';

const makeStyles = () =>
  makeSxStyles({
    tableWrapper: {
      mt: 4,
    },
  });

const buildNetworksWithUrlsList = (
  networks: InsuranceNetwork[],
  payerId?: string
): Network[] =>
  networks.map((network) => ({
    ...network,
    url: INSURANCE_DASHBOARD_ROUTES.getNetworkDetailsTabPath(
      payerId || '',
      network.id
    ),
  }));

const NetworksList = () => {
  const dispatch = useAppDispatch();
  const styles = makeStyles();
  const { payerId = '' } = useParams<PayerPathParams>();
  const { stateAbbrs, insuranceClassifications, sortField, sortDirection } =
    useSelector(selectAppliedNetworkFilterOptions);
  const searchInsuranceNetworkPayload: SearchInsuranceNetworkPayload = {
    payerIds: [payerId],
    stateAbbrs,
    insuranceClassifications,
    sortField,
    sortDirection,
    showInactive: true,
  };
  useGetInsuranceClassificationsQuery();
  useSearchNetworksListQuery(
    payerId ? searchInsuranceNetworkPayload : skipToken,
    { refetchOnMountOrArgChange: true }
  );
  const { displayedNetworks: networks = [], total = 0 } = useSelector(
    selectPaginatedNetworks(searchInsuranceNetworkPayload)
  );
  const page = useSelector(selectNetworksPage);
  const rowsPerPage = useSelector(selectNetworksRowsPerPage);

  const onChangePage = (pageNew: number) => {
    dispatch(setNetworksPage({ page: pageNew }));
  };
  const onChangeRowsPerPage = (rowsPerPageNew: number) => {
    dispatch(setNetworksRowsPerPage({ rowsPerPage: rowsPerPageNew }));
    dispatch(setNetworksPage({ page: 0 }));
  };
  const onChangeSortOptions = (
    sortBy: NetworksSortField,
    sortOrder: NetworksSortDirection
  ) => {
    if (sortBy === sortField) {
      dispatch(setNetworksSortDirection(sortOrder));
    } else {
      dispatch(setNetworksSortField(sortBy));
      dispatch(setNetworksSortDirection(sortOrder));
    }
  };

  const getSortDirection = (
    sortOrder: NetworksSortDirection
  ): MuiSortDirection => {
    switch (sortOrder) {
      case NetworksSortDirection.ASC:
        return MuiSortDirection.ASC;
      case NetworksSortDirection.DESC:
        return MuiSortDirection.DESC;
    }
  };

  return (
    <Box sx={styles.tableWrapper}>
      <NetworksTable
        networks={buildNetworksWithUrlsList(networks, payerId)}
        total={total}
        page={page}
        rowsPerPage={rowsPerPage}
        sortBy={sortField}
        sortDirection={getSortDirection(sortDirection)}
        onChangePage={onChangePage}
        onChangeRowsPerPage={onChangeRowsPerPage}
        onChangeSortOptions={onChangeSortOptions}
      />
    </Box>
  );
};

export default NetworksList;
