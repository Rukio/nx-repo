import React, { FC, useCallback } from 'react';
import {
  Box,
  CircularProgress,
  Pagination,
  Table,
  TableBody,
  makeSxStyles,
  useMediaQuery,
  useTheme,
} from '@*company-data-covered*/design-system';
import { useGetServiceLines } from '@*company-data-covered*/caremanager/data-access';
import { TaskTemplate } from '@*company-data-covered*/caremanager/data-access-types';
import {
  HeadCell,
  SortableTableHeader,
  TablePagination,
} from '@*company-data-covered*/caremanager/ui';
import NoTemplatesContainer from './NoTemplatesContainer';
import TemplateRow from './TemplateRow';

const styles = makeSxStyles({
  container: {
    marginBottom: 2,
    marginTop: 3,
    backgroundColor: (theme) => theme.palette.common.white,
    border: '1px solid',
    borderColor: (theme) => theme.palette.divider,
  },
  table: {
    '& tr': {
      borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
    },
    '& td, & th': { border: 'none' },
  },
  paginationWrapper: { display: 'flex', alignItems: 'end' },
  pagination: { width: '100%' },
  mobilePaginationWrapper: { padding: '12px 0' },
});

const headCells: readonly HeadCell[] = [
  {
    id: 'name',
    label: 'Template Name',
    sortable: true,
    align: 'left',
  },
  {
    id: 'service_line_id',
    label: 'Service Line',
    sortable: true,
    align: 'left',
  },
  {
    id: 'care_phase_id',
    label: 'Care Phase',
    sortable: true,
    align: 'left',
  },
  { id: 'summary', label: 'Summary', sortable: false, align: 'left' },
  { id: 'updated_at', label: 'Last Edit', sortable: true, align: 'left' },
  { id: 'actions', label: 'Actions', sortable: false, align: 'right' },
];

interface Props {
  isLoading: boolean;
  onSortChange: (sortBy: string) => void;
  order: 'asc' | 'desc';
  orderBy: string;
  page: string;
  pageSize: string;
  setPage: (page: string) => void;
  setPageSize: (pageSize: string) => void;
  templates: TaskTemplate[];
  totalCount: string;
  totalPages: string;
}

const TaskTemplatesTable: FC<Props> = React.memo(
  ({
    isLoading,
    onSortChange,
    order,
    orderBy,
    page,
    pageSize,
    setPage,
    setPageSize,
    templates,
    totalCount,
    totalPages,
  }) => {
    const [getServiceLine] = useGetServiceLines();
    const isMobile = useMediaQuery(useTheme().breakpoints.down('md'));

    const handleChangePage = useCallback(
      (_: unknown, newPage: number) => {
        setPage((isMobile ? newPage : newPage + 1).toString());
      },
      [setPage, isMobile]
    );

    const handleChangeRowsPerPage = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setPageSize(event.target.value);
      },
      [setPageSize]
    );

    if (isLoading) {
      return (
        <Box
          width="100%"
          display="flex"
          alignItems="center"
          justifyContent="center"
          height="70vh"
          data-testid="loading-task-templates-list"
        >
          <CircularProgress size={100} />
        </Box>
      );
    }

    const pageNumber = parseInt(page);
    const totalCountNumber = parseInt(totalCount);
    const pageSizeNumber = parseInt(pageSize);

    return (
      <Box className="templates" sx={styles.container}>
        {!templates.length ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            width="100%"
            height="100%"
            flex="1 1 auto"
          >
            <NoTemplatesContainer />
          </Box>
        ) : (
          <>
            <Table sx={styles.table} data-testid="task-templates-table">
              {!isMobile && (
                <SortableTableHeader
                  headCells={headCells}
                  onSortChange={onSortChange}
                  orderBy={orderBy}
                  order={order}
                />
              )}
              <TableBody data-testid="table-body">
                {templates.map((template) => (
                  <TemplateRow
                    key={template.id}
                    name={template.name}
                    templateId={template.id}
                    serviceLine={
                      (
                        getServiceLine(template.serviceLineId) ??
                        template.serviceLine
                      )?.name
                    }
                    carePhase={template.carePhase?.name}
                    summary={template.summary}
                    updatedByUserFallback={template.lastUpdatedBy}
                    updatedByUserId={template.updatedByUserId}
                    updatedAt={template.updatedAt}
                    isMobile={isMobile}
                  />
                ))}
              </TableBody>
            </Table>
            {isMobile ? (
              <Box
                display="flex"
                justifyContent="center"
                sx={styles.mobilePaginationWrapper}
              >
                <Pagination
                  data-testid="table-pagination"
                  count={Number(totalPages)}
                  page={pageNumber}
                  onChange={handleChangePage}
                />
              </Box>
            ) : (
              <Box sx={styles.paginationWrapper}>
                <TablePagination
                  data-testid="table-pagination"
                  count={totalCountNumber}
                  rowsPerPage={pageSizeNumber}
                  page={pageNumber - 1}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  sx={styles.pagination}
                />
              </Box>
            )}
          </>
        )}
      </Box>
    );
  }
);

export default TaskTemplatesTable;
