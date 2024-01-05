import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
  useGetServiceLinesQuery,
  useGetModalitiesQuery,
  selectServiceLines,
  selectModalities,
  useGetMarketsQuery,
  selectMarkets,
  selectCurrentPage,
  setCurrentPage,
  selectRowsPerPage,
  setRowsPerPage,
  Market,
  selectSelectedServiceLine,
  setServiceLine,
  useGetMarketsModalityConfigsQuery,
  selectSelectedMarketsModalityConfigs,
  updateMarketModalityConfig,
} from '@*company-data-covered*/modality/data-access';
import { MarketsTable } from '@*company-data-covered*/modality/ui';
import usePagination from '../hooks/usePagination';
import { MARKETS_CONFIGURATION_TEST_IDS } from './testIds';

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
      maxWidth: '70%',
      gap: 4,
    },
  });

const selectLabelId = 'select-label';

const MarketsConfiguration: React.FC = () => {
  const classes = makeStyles();
  const dispatch = useDispatch();
  useGetServiceLinesQuery();
  useGetMarketsQuery();
  useGetModalitiesQuery();
  const { serviceLines, isLoading, isSuccess } =
    useSelector(selectServiceLines);
  const { markets, total } = useSelector(selectMarkets);
  const { modalities } = useSelector(selectModalities);
  const currentPage = useSelector(selectCurrentPage);
  const rowsPerPage = useSelector(selectRowsPerPage);
  const selectedServiceLine = useSelector(selectSelectedServiceLine);
  const marketsModalityConfigs = useSelector(
    selectSelectedMarketsModalityConfigs
  );

  useGetMarketsModalityConfigsQuery(selectedServiceLine?.id ?? skipToken, {
    refetchOnMountOrArgChange: true,
    skip: !selectedServiceLine?.id,
  });

  useEffect(() => {
    if (!isLoading && isSuccess) {
      const defaultServiceLine = serviceLines.find((sl) => sl.default);
      dispatch(setServiceLine({ selectedServiceLine: defaultServiceLine }));
    }
  }, [isLoading, isSuccess, serviceLines, dispatch]);

  const onChangePage = (page: number) =>
    dispatch(setCurrentPage({ currentPage: page }));
  const onChangeRowsPerPage = (rows: number) => {
    dispatch(setRowsPerPage({ rowsPerPage: rows }));
    onChangePage(0);
  };
  const onChangeServiceLine = (event: SelectChangeEvent<number>) => {
    const serviceLine = serviceLines.find((sl) => sl.id === event.target.value);
    dispatch(setServiceLine({ selectedServiceLine: serviceLine }));
  };
  const onChangeMarketModalityConfig = (value: {
    marketId: number;
    modalityId: number;
  }) => {
    if (selectedServiceLine?.id) {
      dispatch(
        updateMarketModalityConfig({
          serviceLineId: selectedServiceLine.id,
          ...value,
        })
      );
    }
  };

  const marketsToShow = usePagination<Market>(
    markets,
    currentPage,
    rowsPerPage
  );

  return (
    <>
      <Typography variant="body1" sx={classes.sectionTitle}>
        Market Modality Configuration
      </Typography>
      <Box sx={classes.container}>
        <FormControl fullWidth>
          <InputLabel id={selectLabelId}>Select Service Line</InputLabel>
          <Select
            data-testid={MARKETS_CONFIGURATION_TEST_IDS.SERVICE_LINE_SELECT}
            labelId={selectLabelId}
            label="Select Service Line"
            disabled={isLoading}
            onChange={onChangeServiceLine}
            value={selectedServiceLine?.id ?? ''}
          >
            {serviceLines.map((serviceLine) => {
              const selector =
                MARKETS_CONFIGURATION_TEST_IDS.getServiceLineOptionTestId(
                  serviceLine.id
                );

              return (
                <MenuItem
                  data-testid={selector}
                  key={selector}
                  value={serviceLine.id}
                >
                  {serviceLine.name}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
        <Typography variant="body1" sx={classes.description}>
          Use the toggles to enable/disable modalities for{' '}
          <b>{selectedServiceLine?.name || ''}</b>
          &nbsp; markets.
        </Typography>
      </Box>
      <MarketsTable
        page={currentPage}
        onChangePage={onChangePage}
        markets={marketsToShow}
        modalities={modalities}
        selectedModalities={marketsModalityConfigs}
        onChangeModality={onChangeMarketModalityConfig}
        total={total}
        rowsPerPage={rowsPerPage}
        onChangeRowsPerPage={onChangeRowsPerPage}
      />
    </>
  );
};

export default MarketsConfiguration;
