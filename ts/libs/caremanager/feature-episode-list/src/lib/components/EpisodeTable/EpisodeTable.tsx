import React, { useCallback } from 'react';
import {
  Alert,
  Box,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  makeSxStyles,
  useMediaQuery,
  useTheme,
} from '@*company-data-covered*/design-system';
import { Episode } from '@*company-data-covered*/caremanager/data-access-types';
import { TablePagination } from '@*company-data-covered*/caremanager/ui';
import EpisodeTableRow from './EpisodeTableRow';
import NoEpisodesRow from './NoEpisodesRow';
import SkeletonRows from './SkeletonRows';

const styles = makeSxStyles({
  container: {
    marginBottom: 3,
    marginTop: 3,
    backgroundColor: (theme) => theme.palette.common.white,
    border: '1px solid',
    borderColor: (theme) => theme.palette.divider,
  },
  table: {
    bgcolor: 'background.paper',
    '& tr': {
      borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
    },
    '& td, & th': {
      border: 'none',
    },
  },
  tableHead: {
    display: {
      xs: 'none',
      md: 'table-header-group',
    },
  },
  paginationContainerMobile: { padding: '12px 0' },
  paginationContainerDesktop: {
    display: 'flex',
    alignItems: 'end',
  },
  tablePagination: { width: '100%' },
});

const tableTitles = [
  'Patient',
  'Episode Details',
  'Summary',
  'Notes',
  'Incomplete Tasks',
];

type EpisodeTableProps = {
  episodes: Episode[];
  rowsPerPage: number;
  page: number;
  totalPages: number;
  totalResults: number;
  setPage: (_p: number) => void;
  setRowsPerPage: (_p: number) => void;
  isLoading: boolean;
  isError: unknown;
};

const adjustPageNumberForAPI = (pageNumber: number) => pageNumber + 1;

const EpisodeTable = React.memo(
  ({
    isError,
    episodes,
    isLoading,
    rowsPerPage,
    page,
    totalPages,
    totalResults,
    setRowsPerPage,
    setPage,
  }: EpisodeTableProps) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const handleChangeRowsPerPage = (
      event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
    ) => {
      setRowsPerPage(parseInt(event.target.value, 10));
    };

    const handleChangePage = useCallback(
      (_: unknown, newPage: number) =>
        setPage(isMobile ? newPage : adjustPageNumberForAPI(newPage)),
      [setPage, isMobile]
    );

    if (isError) {
      return (
        <Alert
          message="Unable to load episodes. Please try again."
          severity="error"
        />
      );
    }

    const showLoading = isLoading;
    const showEpisodes = !showLoading && !!episodes.length;
    const showNoEpisodes = !showLoading && !episodes.length;

    return (
      <Box
        className="templates"
        data-testid="episode-table"
        sx={styles.container}
      >
        <Table sx={styles.table}>
          <TableHead sx={styles.tableHead}>
            <TableRow>
              {tableTitles.map((title) => (
                <TableCell
                  data-testid={`${title
                    .toLowerCase()
                    .replace(/\s+/g, '-')}-table-header`}
                  key={title}
                >
                  {title}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {showLoading && (
              <SkeletonRows rowsPerPage={rowsPerPage} isMobile={isMobile} />
            )}
            {showEpisodes &&
              episodes.map((episode) => (
                <EpisodeTableRow
                  key={episode.id}
                  episode={episode}
                  isMobile={isMobile}
                />
              ))}
            {showNoEpisodes && <NoEpisodesRow />}
          </TableBody>
        </Table>
        {isMobile ? (
          <Box
            display="flex"
            justifyContent="center"
            sx={styles.paginationContainerMobile}
          >
            <Pagination
              count={totalPages}
              page={page + 1}
              onChange={handleChangePage}
            />
          </Box>
        ) : (
          <Box sx={styles.paginationContainerDesktop}>
            <TablePagination
              data-testid="episode-table-footer"
              count={totalResults}
              rowsPerPage={rowsPerPage}
              page={page}
              onRowsPerPageChange={handleChangeRowsPerPage}
              onPageChange={handleChangePage}
              sx={styles.tablePagination}
            />
          </Box>
        )}
      </Box>
    );
  }
);

export default EpisodeTable;
