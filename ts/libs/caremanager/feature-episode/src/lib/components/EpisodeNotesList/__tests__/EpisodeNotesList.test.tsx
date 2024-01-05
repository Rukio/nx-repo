import { screen } from '@testing-library/react';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import EpisodeNotesList from '../EpisodeNotesList';

const setup = () => {
  const note = {
    id: '1',
    details: 'This is the note text',
    noteKind: 'daily_update',
    noteableType: '',
    createdBy: {
      id: '1',
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@yopmail.com',
    },
    noteableId: '1',
    episodeId: '1',
    updatedAt: '2022-03-17T02:53:21',
    createdAt: '2022-03-17T02:53:21',
  };
  const { container } = renderWithClient(<EpisodeNotesList notes={[note]} />);

  return { container };
};

describe('Episode NotesList tests', () => {
  it('Renders Episode NotesList', async () => {
    setup();
    expect(await screen.findByTestId('episode-notes-list')).toBeInTheDocument();
  });

  it('Renders Episode NotesList Select', async () => {
    setup();
    expect(
      await screen.findByTestId('episode-note-list-select')
    ).toBeInTheDocument();
  });
});
