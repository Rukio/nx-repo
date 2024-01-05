import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import {
  EpisodeFromJSON,
  VisitFromJSON,
} from '@*company-data-covered*/caremanager/data-access-types';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { LatestVisits } from '../LatestVisits';

const setup = (
  numberOfVisits: number,
  visitData?: { providerUserIds?: string[] }
) => {
  const { id: episodeId } = EpisodeFromJSON(JSONMocks.episode.episode);
  const visit = {
    ...VisitFromJSON(JSONMocks.visit.visit),
    id: '1',
    episode_id: '1',
    ...visitData,
  };
  renderWithClient(
    <MemoryRouter>
      <LatestVisits
        episodeId={episodeId}
        visit={visit}
        numberOfVisits={numberOfVisits}
        serviceLineName={'Test Service Line'}
      />
    </MemoryRouter>
  );
};

describe('LatestVisits', () => {
  it('should render the 3 latest visits but without the current visit', async () => {
    setup(3);

    await screen.findByText('Latest Visits');

    expect(
      await screen.findByText(`See All Episode's Visits`)
    ).toBeInTheDocument();

    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(await screen.findAllByText(/Visit Id/)).toHaveLength(3);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    // one provider for each rendered visit
    expect(screen.getByText('Gustav Mahler')).toBeInTheDocument();
    expect(screen.getByText('Gabo Acosta')).toBeInTheDocument();
    expect(screen.getByText('Rodrigo Guinea')).toBeInTheDocument();
  });

  it('should render only the available visits in response', async () => {
    setup(10);

    await screen.findByText('Latest Visits');

    expect(
      await screen.findByText(`See All Episode's Visits`)
    ).toBeInTheDocument();
    // only 9 available in response, and not counting the current visit.
    expect(await screen.findAllByText(/Visit Id/)).toHaveLength(8);
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
  });

  it('should not render providers, if the provider id list is empty', async () => {
    setup(1, { providerUserIds: [] });

    expect(await screen.findByText('Latest Visits')).toBeInTheDocument();
    expect(
      await screen.findByText(`See All Episode's Visits`)
    ).toBeInTheDocument();

    expect(screen.queryByText('Visit id: 1')).not.toBeInTheDocument();
    expect((await screen.findAllByText(/Visit Id/)).length).toBe(1);
    expect(await screen.findByText('2')).toBeInTheDocument();
    expect(screen.queryAllByLabelText('John Doe').length).toBe(0);
  });

  it('should not render providers, if the provider id list is undefined', async () => {
    setup(1, { providerUserIds: undefined });

    expect(await screen.findByText('Latest Visits')).toBeInTheDocument();
    expect(
      await screen.findByText(`See All Episode's Visits`)
    ).toBeInTheDocument();

    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect((await screen.findAllByText(/Visit Id/)).length).toBe(1);
    expect(await screen.findByText('2')).toBeInTheDocument();
    expect(screen.queryAllByLabelText('John Doe').length).toBe(0);
  });
});
