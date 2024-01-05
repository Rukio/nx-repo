import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { EpisodeFromJSON } from '@*company-data-covered*/caremanager/data-access-types';
import EpisodeHeader from '../EpisodeHeader';

const setup = () => {
  const episode = EpisodeFromJSON(JSONMocks.episode.episode);

  renderWithClient(
    <MemoryRouter initialEntries={['/episodes/1']}>
      <EpisodeHeader {...episode} tab="overview" onTabChange={vi.fn()} />
    </MemoryRouter>
  );
};

describe('Episode Header Tests', () => {
  it('Renders Episode Header', async () => {
    setup();

    expect(await screen.findByTestId('episode-header')).toBeInTheDocument();
  });

  it('Renders Episode Header Tabs', async () => {
    setup();

    expect(await screen.findByTestId('tabs-component')).toBeInTheDocument();
  });
});
