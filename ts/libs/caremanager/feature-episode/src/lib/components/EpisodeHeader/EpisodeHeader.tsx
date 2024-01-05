import { Box, makeSxStyles } from '@*company-data-covered*/design-system';
import {
  calculateAge,
  calculateDays,
  getFullName,
} from '@*company-data-covered*/caremanager/utils';
import { useGetServiceLines } from '@*company-data-covered*/caremanager/data-access';
import { Episode, Task } from '@*company-data-covered*/caremanager/data-access-types';
import { BackButton } from '@*company-data-covered*/caremanager/ui';
import Details from './Details';
import PageTabs from './PageTabs';

type Tab = 'overview' | 'tasks' | 'notes';

type EpisodeHeaderProps = Episode & {
  tab: Tab;
  onTabChange: (_: React.SyntheticEvent<Element, Event>, newTab: Tab) => void;
};

const styles = makeSxStyles({
  headerContainer: {
    backgroundColor: (theme) => theme.palette.background.paper,
    padding: { xs: '22px 10px 0', sm: '16px 40px 0' },
    position: { xs: 'static', md: 'fixed' },
    width: '100%',
    zIndex: 1,
  },
  detailsContainer: {
    marginBottom: '8px',
  },
});

const getPendingTasks = (tasks: Task[] | undefined) => {
  let pendingTasks = 0;
  if (tasks) {
    pendingTasks = tasks.filter((task) => task.status !== 'completed').length;
  }

  return pendingTasks;
};

const EpisodeHeader: React.FC<EpisodeHeaderProps> = ({
  id,
  admittedAt,
  dischargedAt,
  patient,
  carePhase,
  tasks,
  tab,
  onTabChange,
  isWaiver,
  ...props
}) => {
  const [getServiceLine] = useGetServiceLines();
  const serviceLine = getServiceLine(props.serviceLineId) ?? props.serviceLine;

  const lengthOfStay = calculateDays(
    new Date(admittedAt),
    dischargedAt ? new Date(dischargedAt) : new Date()
  );
  const TABS = [
    { value: 'Overview', icon: 'note', route: 'overview' },
    {
      value: 'Tasks',
      icon: 'check',
      pendingTasks: getPendingTasks(tasks),
      route: 'tasks',
    },
    { value: 'Notes', icon: 'comment', route: 'notes' },
    { value: 'Visits', icon: 'car', route: 'visits' },
  ];

  return (
    <Box sx={styles.headerContainer} data-testid="episode-header">
      <Box sx={styles.detailsContainer}>
        <BackButton>Episodes</BackButton>
        <Details
          data-testid="episode-header-details"
          patient={patient ? getFullName(patient) : 'No patient found'}
          age={patient?.dateOfBirth ? calculateAge(patient.dateOfBirth) : 0}
          id={id}
          athenaMedicalRecordNumber={patient?.athenaMedicalRecordNumber}
          lengthOfStay={lengthOfStay}
          gender={patient?.sex.charAt(0).toUpperCase() || ''}
          serviceLine={serviceLine?.name || 'Unknown service line'}
          carePhase={carePhase?.name || 'Unknown care phase'}
          isWaiver={isWaiver}
        />
      </Box>
      <PageTabs tabs={TABS} currentTab={tab} onTabChange={onTabChange} />
    </Box>
  );
};

export default EpisodeHeader;
