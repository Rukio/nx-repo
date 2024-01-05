export enum NoteKind {
  General = 'general',
  DailyUpdate = 'daily_update',
  Clinical = 'clinical',
  Navigator = 'navigator',
}

export const NOTE_TYPES_TEXTS = {
  [NoteKind.General]: 'General Notes',
  [NoteKind.DailyUpdate]: 'Daily Updates',
  [NoteKind.Clinical]: 'Clinical Notes',
  [NoteKind.Navigator]: 'Navigator Notes',
};
