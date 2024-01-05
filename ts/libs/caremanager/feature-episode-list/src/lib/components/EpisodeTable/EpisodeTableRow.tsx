import { FC } from 'react';
import { TableRow, makeSxStyles } from '@*company-data-covered*/design-system';
import { Episode } from '@*company-data-covered*/caremanager/data-access-types';
import { useGetServiceLines } from '@*company-data-covered*/caremanager/data-access';
import DetailsCell from './Cells/DetailsCell';
import MobileCell from './Cells/MobileCell';
import PatientCell from './Cells/PatientCell';
import TextCell from './Cells/TextCell';
import TasksCell from './Cells/TasksCell';

const styles = makeSxStyles({
  patientCell: { width: '20%' },
  serviceLineCell: { width: '15%' },
  summaryCell: { width: '25%' },
  notesCell: { width: '25%' },
  tasksCell: { width: '15%' },
});

export type Props = {
  episode: Episode;
  isMobile: boolean;
};

const EpisodeTableBody: FC<Props> = ({ episode, isMobile }) => {
  const [getServiceLine] = useGetServiceLines();
  const serviceLine =
    getServiceLine(episode.serviceLineId) ?? episode.serviceLine;

  return (
    <TableRow key={episode.id} hover data-testid="episode-row">
      {isMobile ? (
        <MobileCell episode={episode} serviceLine={serviceLine} />
      ) : (
        <>
          {episode.patient ? (
            <PatientCell
              episodeId={episode.id}
              patient={episode.patient}
              containerStyles={styles.patientCell}
            />
          ) : (
            <TextCell
              text="No patient found."
              testId="no-patient-found"
              containerStyles={styles.patientCell}
            />
          )}
          <DetailsCell
            episode={episode}
            serviceLine={serviceLine}
            containerStyles={styles.serviceLineCell}
          />
          <TextCell
            text={episode.patientSummary}
            testId={`summary-cell-${episode.id}`}
            containerStyles={styles.summaryCell}
          />
          <TextCell
            text={
              episode.lastNote?.details ||
              episode.mostRelevantNote?.details ||
              ''
            }
            testId={`note-cell-${episode.id}`}
            containerStyles={styles.notesCell}
          />
          <TasksCell
            episodeId={episode.id}
            tasks={episode.incompleteTasks}
            testId={`task-cell-${episode.id}`}
            containerStyles={styles.tasksCell}
          />
        </>
      )}
    </TableRow>
  );
};

export default EpisodeTableBody;
