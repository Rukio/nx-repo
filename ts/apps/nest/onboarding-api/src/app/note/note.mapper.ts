import { Note, StationNote } from '@*company-data-covered*/consumer-web-types';
import InputNotSpecifiedException from '../common/exceptions/input-not-specified.exception';

const StationNoteToNote = (input: StationNote): Note => {
  if (!input) {
    throw new InputNotSpecifiedException(StationNoteToNote.name);
  }
  const output: Note = {
    id: input.id,
    careRequestId: input.care_request_id,
    featured: input.featured,
    note: input.note,
    inTimeline: input.in_timeline,
    metaData: input.meta_data,
    noteType: input.note_type,
    user: {
      id: input.user?.id,
      firstName: input.user?.first_name,
      lastName: input.user?.last_name,
    },
    userId: input.user_id,
    createdAt: input.created_at,
    updatedAt: input.updated_at,
    deletedAt: input.deleted_at,
  };

  return output;
};

const NoteToStationNote = (input: Partial<Note>): StationNote => {
  if (!input) {
    throw new InputNotSpecifiedException(NoteToStationNote.name);
  }
  const output: StationNote = {
    id: input.id,
    care_request_id: input.careRequestId,
    featured: input.featured,
    note: input.note,
    in_timeline: input.inTimeline,
    meta_data: input.metaData,
    note_type: input.noteType,
    user: {
      id: input.user?.id,
      first_name: input.user?.firstName,
      last_name: input.user?.lastName,
    },
    user_id: input.userId,
    created_at: input.createdAt,
    updated_at: input.updatedAt,
    deleted_at: input.deletedAt,
  };

  return output;
};

export default {
  StationNoteToNote,
  NoteToStationNote,
};
