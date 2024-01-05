import { screen } from '@testing-library/react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { EpisodeFromJSON } from '@*company-data-covered*/caremanager/data-access-types';
import EpisodeOverview from '../EpisodeOverview';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';

const setup = () => {
  const episode = EpisodeFromJSON(JSONMocks.episode.episode);
  renderWithClient(<EpisodeOverview {...episode} />);
};

describe('Episode Overview page', () => {
  it('edit button is present', () => {
    setup();
    expect(
      screen.getByTestId('edit-episode-details-episode-button-1')
    ).toBeInTheDocument();
  });
});
