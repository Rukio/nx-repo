import React, { useCallback, useRef } from 'react';
import { useField } from 'formik';
import {
  Box,
  List,
  MenuList,
  Popover,
  Stack,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import {
  ROWS_PER_PAGE_OPTIONS,
  SEARCH_DEBOUNCE_TIME,
} from '@*company-data-covered*/caremanager/utils';
import { useGetTaskTemplates } from '@*company-data-covered*/caremanager/data-access';
import { TaskTemplate } from '@*company-data-covered*/caremanager/data-access-types';
import { useDebounce } from '@*company-data-covered*/caremanager/utils-react';
import { Search } from '@*company-data-covered*/caremanager/ui';
import TaskTemplateEmptyList from './TaskTemplateEmptyList';
import TaskTemplateMenuItem from './TaskTemplateMenuItem';
import AddedTaskTemplateItem from './AddedTaskTemplateItem';

const makeStyles = (menuWidth: number) =>
  makeSxStyles({
    wrapper: { width: menuWidth },
    menuList: {
      maxHeight: 300,
      overflow: 'auto',
      maxWidth: menuWidth,
    },
    addedList: { height: 250, overflow: 'auto' },
  });

type TaskTemplateSearchProps = {
  episodeTemplates?: TaskTemplate[];
};

export const TaskTemplateSearch = ({
  episodeTemplates = [],
}: TaskTemplateSearchProps) => {
  const menuWidth = useRef(0);
  const [serviceLineId] = useField('serviceLineId');
  const [templateIds, , { setValue: setTemplateIds }] =
    useField('applyTemplateIds');
  const [taskTemplateName, setTaskTemplateName] = React.useState('');
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [addedTemplates, setAddedTemplates] = React.useState<TaskTemplate[]>(
    []
  );
  const searchInput = useDebounce<string>(
    taskTemplateName,
    SEARCH_DEBOUNCE_TIME
  );

  const onSearchChange = useCallback((newTaskTemplateName: string) => {
    if (!/[^a-zA-Z0-9-' ]/g.test(newTaskTemplateName)) {
      setTaskTemplateName(newTaskTemplateName);
    }
  }, []);

  const requestFilters = {
    serviceLineId: serviceLineId.value,
    name: searchInput,
    pageSize: ROWS_PER_PAGE_OPTIONS[1].toString(),
  };
  const { data: queryTemplates, isLoading } = useGetTaskTemplates(
    requestFilters,
    {
      queryKey: ['getTaskTemplates', ...Object.values(requestFilters)],
    }
  );

  const open = Boolean(anchorEl);

  const handleClose = () => setAnchorEl(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    menuWidth.current = event.currentTarget.offsetWidth;
  };

  const handleRemove = (templateId: string) => {
    const filteredTemplates = addedTemplates.filter(
      (item) => item.id !== templateId
    );
    setAddedTemplates(filteredTemplates);
    const filteredIds = templateIds.value.filter(
      (item: string) => item !== templateId
    );
    setTemplateIds(filteredIds);
  };

  const styles = makeStyles(menuWidth.current);

  return (
    <Stack spacing={1} data-testid="task-template-edit-section">
      <Typography variant="body1" color="primary.contrast">
        Task Templates
      </Typography>
      <Typography variant="body2" color="text.disabled">
        You will only be able to select templates corresponding to the selected
        service line.
      </Typography>
      {/* TODO(tech-debt): find a way to only use a single Search component */}
      <Search
        testId="task-template-search-click-input"
        onClick={handleClick}
        value={taskTemplateName}
        placeholder="Search by template name"
        autoFocus={false}
      />
      <Popover
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        data-testid="search-template-menu-popover"
      >
        <Box sx={styles.wrapper}>
          <Search
            testId="task-template-search-input"
            inputTestid="task-template-search-dom-input"
            onChange={onSearchChange}
            value={taskTemplateName}
            placeholder="Search by template name"
            autoFocus
          />
          <MenuList sx={styles.menuList}>
            {!isLoading && queryTemplates?.meta?.totalResults ? (
              queryTemplates?.taskTemplates.map((template: TaskTemplate) => (
                <TaskTemplateMenuItem
                  key={template.id}
                  templateItem={template}
                  setTemplateList={setAddedTemplates}
                />
              ))
            ) : (
              <Typography
                variant="body2"
                color="text.disabled"
                padding="5px 20px"
                data-testid="task-template-query-not-found"
              >
                No templates were found. Please refine your search or create a
                new one.
              </Typography>
            )}
          </MenuList>
        </Box>
      </Popover>
      <Box data-testid="added-task-template-list">
        {episodeTemplates.length > 0 || addedTemplates.length > 0 ? (
          <List sx={styles.addedList}>
            {addedTemplates.map((template: TaskTemplate) => (
              <AddedTaskTemplateItem
                key={template.id}
                listItem={template}
                handleRemove={() => handleRemove(template.id)}
              />
            ))}
            {episodeTemplates.map((template) => (
              <AddedTaskTemplateItem listItem={template} key={template.id} />
            ))}
          </List>
        ) : (
          <TaskTemplateEmptyList />
        )}
      </Box>
    </Stack>
  );
};

TaskTemplateSearch.defaultProps = {
  episodeTemplates: [],
};
