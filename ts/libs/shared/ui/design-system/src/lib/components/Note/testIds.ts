const notePrefixText = 'note';
const noteContainerPrefixText = 'note-action';

export const NOTE_TEST_IDS = {
  getNoteByTestId: (noteId: number) => `${notePrefixText}-${noteId}`,
  getNoteActionByTestId: (noteId: number) =>
    `${noteContainerPrefixText}-${noteId}`,
  INITIALS: 'note-initials',
  DISPLAY_NAME: 'note-display-name',
  SECONDARY_LABEL: 'note-secondary-label',
  TEXT: 'note-text',
  MORE_BUTTON: 'note-more-button',
  EDIT_MENU_ITEM: 'note-edit-menu-item',
  TOGGLE_FEATURED_MENU_ITEM: 'note-toggle-featured-menu-item',
  FEATURED_NOTE_CHIP: 'note-featured-note-chip',
  DELETE_MENU_ITEM: 'note-delete-menu-item',
  DELETED_ALERT: 'note-deleted-alert',
  UNDO_DELETE_BUTTON: 'note-undo-delete-button',
  EDIT_INPUT: 'note-edit-input',
  EDIT_CANCEL_BUTTON: 'note-edit-cancel-button',
  EDIT_SAVE_CHANGES_BUTTON: 'note-edit-save-changes-button',
};
