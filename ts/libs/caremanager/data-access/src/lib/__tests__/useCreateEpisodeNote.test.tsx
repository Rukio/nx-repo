import { QueryClientProvider } from 'react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import {
  CreateEpisodeNote,
  CreateEpisodeNoteResponseFromJSON,
  NoteKind,
} from '@*company-data-covered*/caremanager/data-access-types';
import { useCreateEpisodeNote } from '../useCreateEpisodeNote';

const setup = () => {
  const testQueryClient = createTestQueryClient();

  return renderHook(() => useCreateEpisodeNote(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={testQueryClient}>
        <SnackbarProvider>{children}</SnackbarProvider>
      </QueryClientProvider>
    ),
  });
};

describe('useCreateEpisodeNote', () => {
  it('creates a new note for an episode', async () => {
    const { result } = setup();
    const newNoteMock: CreateEpisodeNote = {
      details: 'test note',
      noteKind: NoteKind.General,
    };
    const episodeIdMock = '5';

    act(() => {
      result.current.mutate({
        episodeId: episodeIdMock,
        body: {
          note: newNoteMock,
        },
      });
    });

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(
      CreateEpisodeNoteResponseFromJSON({
        note: {
          ...JSONMocks.note.note,
          episode_id: episodeIdMock,
          details: newNoteMock.details,
          note_kind: newNoteMock.noteKind,
        },
      })
    );
  });
});
