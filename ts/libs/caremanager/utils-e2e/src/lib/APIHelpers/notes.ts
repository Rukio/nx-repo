// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  CareManagerServiceCreateEpisodeNoteOperationRequest,
  GetEpisodeResponse,
  NoteKind,
} from '@*company-data-covered*/caremanager/data-access-types';
import { sendDELETERequest, sendPOSTRequest } from './request';

const NOTE_BODY = {
  details: 'This is the best note in the world',
  noteable_type: 'Caremanager::Episode',
};

function createNote(noteType: NoteKind) {
  const noteBody: CareManagerServiceCreateEpisodeNoteOperationRequest['body'] =
    {
      note: {
        details: NOTE_BODY.details,
        noteKind: noteType || NOTE_BODY.noteable_type,
      },
    };

  return sendPOSTRequest({
    url: `${Cypress.env('API_URL')}/v1/episodes/1/notes`,
    body: noteBody,
    headers: { authorization: `Bearer ${Cypress.env('token')}` },
  }).then((createNoteResp) => createNoteResp.body.note.id);
}

function deleteNote(noteId: string) {
  return sendDELETERequest({
    url: `${Cypress.env('API_URL')}/v1/notes/${noteId}`,
    headers: { authorization: `Bearer ${Cypress.env('token')}` },
  }).then((deleteNoteResp) => deleteNoteResp.body);
}

function deleteEpisodeNotes(episodeId: string) {
  cy.getEpisode(episodeId).then((resp: GetEpisodeResponse) => {
    resp.episode?.notes?.forEach((note) => {
      cy.deleteNote(note.id);
    });
  });
}

function hasPathname(pathname: string) {
  cy.location('pathname').should('equal', pathname);
}

export { createNote, deleteNote, deleteEpisodeNotes, hasPathname };
