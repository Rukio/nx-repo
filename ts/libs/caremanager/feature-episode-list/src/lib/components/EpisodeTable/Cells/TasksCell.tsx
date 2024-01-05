import { Link as RouterLink } from 'react-router-dom';
import {
  Link,
  Stack,
  SxStylesValue,
  TableCell,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { IncompleteTasks } from '@*company-data-covered*/caremanager/data-access-types';

const styles = makeSxStyles({
  link: { textDecoration: 'none' },
});

const taskNameMap: { [key: string]: string } = {
  dailyAndOnboarding: 'Daily & Onboarding',
  nurseNavigator: 'Nurse Navigator',
  t1: 'T1',
  t2: 'T2',
};

const allTasksClear = (tasks: IncompleteTasks): boolean => {
  const sum = Object.values(tasks).reduce(
    (partialSum, a) => partialSum + (a || 0),
    0
  );

  return !sum;
};

type Props = {
  episodeId: string;
  tasks: IncompleteTasks | undefined;
  testId: string;
  containerStyles: SxStylesValue;
};

const taskLinkProps = (episodeId: string, taskName: string) => {
  const taskNameSnakeCase: Record<string, string> = {
    dailyAndOnboarding: 'daily_and_onboarding',
    nurseNavigator: 'nurse_navigator',
  };
  const hash = `#${taskNameSnakeCase[taskName] || taskName}-header`;

  return {
    to: { pathname: `/episodes/${episodeId}/tasks`, hash },
    component: RouterLink,
  };
};

const TasksCell = ({ episodeId, tasks, testId, containerStyles }: Props) => {
  if (!tasks || allTasksClear(tasks)) {
    return (
      <Typography color="primary" variant="body2">
        _
      </Typography>
    );
  }

  return (
    <TableCell data-testid={testId} sx={containerStyles}>
      <Stack>
        {Object.entries(tasks)
          .filter(([_, incompleteNum]) => incompleteNum > 0)
          .map(([taskName, incompleteNum]) => (
            <Link
              key={`${taskName}-link`}
              sx={styles.link}
              {...taskLinkProps(episodeId, taskName)}
            >
              <Typography
                key={taskName}
                color="primary"
                variant="body2"
                data-testid={`${taskName}-${testId}`}
              >
                {`${taskNameMap[taskName] || taskName}: ${incompleteNum}`}
              </Typography>
            </Link>
          ))}
      </Stack>
    </TableCell>
  );
};

export default TasksCell;
