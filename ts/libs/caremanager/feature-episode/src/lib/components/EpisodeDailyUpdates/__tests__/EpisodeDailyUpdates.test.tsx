import { screen } from '@testing-library/react';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import EpisodeDailyUpdates from '../EpisodeDailyUpdates';

const setup = () => {
  const testUser = {
    id: '1',
    firstName: 'Test',
    lastName: 'User',
    email: 'testuser@yopmail.com',
    jobTitle: 'Doctor',
  };

  const notes = [
    {
      id: '1',
      details: 'This is the details',
      noteKind: 'daily_update',
      noteableId: '0',
      episodeId: '0',
      noteableType: 'CaremanagerEpisode',
      createdBy: testUser,
      lastUpdatedBy: testUser,
    },
  ];

  renderWithClient(
    <EpisodeDailyUpdates
      notes={notes}
      episodeId="0"
      dataTestId="testing-updates"
    />
  );
};

describe('Episode Daily Updates Tests', () => {
  it('Renders Episode Daily Updates Complete Component', async () => {
    setup();
    expect(
      await screen.findByTestId('note-overview-testing-updates')
    ).toBeInTheDocument();
  });

  it('Renders Episode Daily Updates List with one element', async () => {
    setup();
    expect(await screen.findByTestId('note-overview-1')).toBeInTheDocument();
  });
});
