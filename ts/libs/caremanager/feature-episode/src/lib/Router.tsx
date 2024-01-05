import { FC } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Episode } from '@*company-data-covered*/caremanager/data-access-types';
import EpisodeOverview from './components/EpisodeOverview';
import EpisodeVisits from './components/EpisodeVisits';
import EpisodeTask from './components/EpisodeTasks';
import EpisodeNotes from './components/EpisodeNotes';

type EpisodePageProps = {
  episodeData: Episode;
  isSuccess: boolean;
};

const EpisodeRoutes: FC<EpisodePageProps> = ({ episodeData, isSuccess }) => (
  <Routes>
    <Route path="overview" element={<EpisodeOverview {...episodeData} />} />
    <Route path="visits" element={<EpisodeVisits episode={episodeData} />} />
    <Route
      path="tasks"
      element={
        isSuccess && (
          <EpisodeTask
            tasks={episodeData.tasks || []}
            episodeId={episodeData.id}
          />
        )
      }
    />
    <Route path="notes" element={<EpisodeNotes {...episodeData} />} />
  </Routes>
);

export default EpisodeRoutes;
