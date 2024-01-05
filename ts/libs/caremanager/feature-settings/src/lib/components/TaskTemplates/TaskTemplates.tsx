import { FC } from 'react';
import { Box, Grid, makeSxStyles } from '@*company-data-covered*/design-system';
import { Search, SectionHeader } from '@*company-data-covered*/caremanager/ui';
import { FiltersSection } from '@*company-data-covered*/caremanager/feature-episode-list';
import TaskTemplatesTable from '../TaskTemplatesTable';
import useTaskTemplates from '../../useTaskTemplates';

const styles = makeSxStyles({
  container: {
    paddingTop: 2,
    paddingX: 2,
  },
  search: { borderRadius: '4px' },
});

const TaskTemplates: FC = () => {
  const {
    config,
    isLoading,
    onSearchChange,
    onSortChange,
    order,
    orderBy,
    page,
    pageSize,
    resetFilters,
    selectedCarePhases,
    selectedServiceLines,
    setPage,
    setPageSize,
    setSelectedCarePhases,
    setSelectedServiceLines,
    taskTemplateName,
    taskTemplates,
    totalCount,
    totalPages,
  } = useTaskTemplates();

  return (
    <Box sx={styles.container}>
      <span data-testid="task-templates-section">
        <SectionHeader
          sectionName="Task Templates"
          href="/settings/task-templates/new"
          buttonText="Create Template"
        />
      </span>
      <Grid container spacing={0.5}>
        <Grid item xs={12} md={3} mb={1}>
          <Search
            placeholder="Search by template name"
            testId="template-search-input"
            onChange={onSearchChange}
            value={taskTemplateName}
            sx={styles.search}
          />
        </Grid>
        <Grid item xs={12} md={9}>
          <FiltersSection
            configData={config}
            setSelectedCarePhases={setSelectedCarePhases}
            setSelectedServiceLines={setSelectedServiceLines}
            selectedCarePhases={selectedCarePhases}
            selectedServiceLines={selectedServiceLines}
            handleClearAll={resetFilters}
          />
        </Grid>
      </Grid>
      <TaskTemplatesTable
        orderBy={orderBy}
        order={order}
        templates={taskTemplates}
        isLoading={isLoading}
        onSortChange={onSortChange}
        pageSize={pageSize}
        page={page}
        setPageSize={setPageSize}
        setPage={setPage}
        totalCount={totalCount}
        totalPages={totalPages}
      />
    </Box>
  );
};

export default TaskTemplates;
