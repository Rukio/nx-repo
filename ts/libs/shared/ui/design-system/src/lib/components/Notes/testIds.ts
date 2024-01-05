const tagPrefixText = 'notes-tag';
const filterOptionPrefixText = 'notes-filter-option';

export const NOTES_TEST_IDS = {
  EMPTY_MESSAGE: 'notes-empty-message',
  COMPOSE_INPUT: 'notes-compose-input',
  COMPOSE_DISCARD_BUTTON: 'notes-compose-discard-button',
  COMPOSE_POST_BUTTON: 'notes-compose-post-button',
  LIST_LABEL: 'notes-list-label',
  LIST: 'notes-list',
  TAGS_WRAPPER: 'notes-tags-wrapper',
  FILTER_SELECT: 'notes-filter-select',
  getFilterOptionTestIdByValue: (value: string) =>
    `${filterOptionPrefixText}-${value}`.toLowerCase(),
  getTagTestIdByName: (tagName: string) => `${tagPrefixText}-${tagName}`,
};
