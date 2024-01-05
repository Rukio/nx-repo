import { useState } from 'react';
import {
  AccordionDetails,
  AccordionSummary,
  Box,
  Divider,
  ExpandMoreIcon,
  FormControlLabel,
  Grid,
  List,
  Stack,
  Switch,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { formatDataTestId } from '@*company-data-covered*/caremanager/utils';
import { useCreateEpisodeTasks } from '@*company-data-covered*/caremanager/data-access';
import {
  Task,
  TaskStatusEnum,
  TaskTypeEnum,
} from '@*company-data-covered*/caremanager/data-access-types';
import { useHash } from '@*company-data-covered*/caremanager/utils-react';
import { Accordion } from '@*company-data-covered*/caremanager/ui';
import {
  TaskForm,
  TaskItem,
  defaultExpandedState,
  taskTypes,
} from '@*company-data-covered*/caremanager/feature-task-template-form';
import TaskProgressBar from './TaskProgressBar';

const styles = makeSxStyles({
  accordionSummary: { flexDirection: 'row-reverse', p: 2 },
  accordionTitle: {
    width: { xs: 'auto', md: '33%' },
    flexShrink: 0,
    pl: 1.5,
  },
  accordionStatus: {
    textAlign: 'right',
    flexGrow: 1,
    color: 'text.secondary',
  },
  accordionDetails: { paddingTop: 0 },
});

type EpisodeTasksProps = {
  tasks: Task[];
  episodeId: string;
};

const EpisodeTasks: React.FC<EpisodeTasksProps> = ({ tasks, episodeId }) => {
  const { mutate: createEpisodeTasks } = useCreateEpisodeTasks(episodeId);
  const { hash, handleChange } = useHash({
    initialState: defaultExpandedState,
    hashPattern: 'header',
  });
  const [hideCompletedTasks, setHideCompletedTasks] = useState<boolean>(true);

  const taskList = tasks.reduce((previous, current) => {
    const group = current.taskType;
    const acc = previous;

    if (!acc[group]) {
      acc[group] = [];
    }

    acc[group]?.push(current);

    return acc;
  }, {} as Record<string, Task[]>);

  const handleToggleChange = () => {
    setHideCompletedTasks(!hideCompletedTasks);
  };

  const addNewTask = (taskDescriptions: string[], taskType: TaskTypeEnum) => {
    createEpisodeTasks({
      episodeId,
      body: {
        tasks: taskDescriptions.map((description) => ({
          task: description,
          taskType,
        })),
      },
    });
  };

  return (
    <Box padding={{ xs: '32px 16px', sm: '40px' }}>
      <Grid
        container
        alignItems="center"
        justifyContent="space-between"
        marginBottom="20px"
      >
        <Stack direction="row" spacing={2} width="fit-content">
          <Typography variant="h6" data-testid="tasks-header">
            Tasks
          </Typography>
          <TaskProgressBar
            completedTasks={
              tasks.filter((task) => task.status === TaskStatusEnum.Completed)
                .length
            }
            totalTasks={tasks.length}
          />
        </Stack>
        <FormControlLabel
          componentsProps={{ typography: { variant: 'body2' } }}
          labelPlacement="start"
          control={
            <Switch
              data-testid="hide-completed-tasks-switch"
              checked={hideCompletedTasks}
              onChange={handleToggleChange}
            />
          }
          label="Hide Completed Tasks"
          data-testid="hide-completed-tasks"
        />
      </Grid>

      {Object.keys(taskTypes).map((key) => {
        // casting needed as key is typed as string by keys function
        const taskType = key as TaskTypeEnum;

        return (
          <Accordion
            data-testid={`${formatDataTestId(taskType)}-test`}
            key={taskType}
            expanded={hash[taskType]}
            onChange={handleChange(taskType)}
          >
            <AccordionSummary
              sx={styles.accordionSummary}
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`${taskType}-content`}
              id={`${taskType}-header`}
            >
              <Typography variant="h6" sx={styles.accordionTitle}>
                {taskTypes[taskType]} Tasks
              </Typography>
              <Typography variant="body2" sx={styles.accordionStatus}>
                {taskList[taskType]
                  ? taskList[taskType].filter(
                      (item) => item.status === 'pending'
                    ).length
                  : '0'}{' '}
                incomplete
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={styles.accordionDetails}>
              <List>
                <TaskForm taskType={taskType} addNewTask={addNewTask} />
                <Divider />
                {taskList[taskType]?.map((task) => (
                  <TaskItem
                    key={`task-${task.id}`}
                    task={{ ...task, taskType }}
                    hiddenIfCompleted={hideCompletedTasks}
                  />
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};

export default EpisodeTasks;
