import { NoteKind } from '@*company-data-covered*/caremanager/data-access-types';

type NoteEditSectionProps = {
  details: string;
  noteKind: NoteKind;
  onCancelEdit: () => void;
  onSave: (newNoteValue: string, noteKind: NoteKind) => void;
};

type InputRefType = {
  value: string;
};

export type { NoteEditSectionProps, InputRefType };
