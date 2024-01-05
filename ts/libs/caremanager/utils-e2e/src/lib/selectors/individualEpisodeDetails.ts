import { formatDataTestId } from '@*company-data-covered*/caremanager/utils';

export const SNACKBAR = '#notistack-snackbar';
export enum EpisodeTasksTab {
  DELETE_MENU_ITEM = 'task-delete-menu-item',
  EPISODE_TASKS_TAB = 'episode-tasks-tab',
  TASKS_TAB = 'episode-tasks-tab',
  COMPLETED_TASKS_SWITCH = 'hide-completed-tasks-switch',
  TASK_ITEM = 'task-item',
  TASK_INPUT = 'new-task-input',
  TASK_SUBMIT_BUTTON = 'submit-new-task',
  COMPLETED_TASK_ITEM = 'completed-task-item',
  TASK_MENU_BUTTON = 'task-menu-button',
  UPDATE_TASK_INPUT = 'taskupdate-input',
  UPDATE_TASK_BUTTON = 'update-task-button',
  EDIT_MENU_ITEM = 'task-edit-menu-item',
  DEFAULT_SNACKBAR_ERROR_MESSAGE = 'Unknown error',
  TASK_HEADER = 'tasks-header',
  PROGRESS_BAR = 'task-progress-bar',
  PROGRESS_BAR_LABEL = 'task-progress-bar-label',
  HIDE_COMPLETED_TASK = 'hide-completed-tasks',
  DAILY_AND_ONBOARDING_TASKS = 'daily-and-onboarding-test',
  NURSE_NAVIGATOR_TASKS = 'nurse_navigator-test',
  T1_TASKS = 't1-test',
  T2_TASKS = 't2-test',
  EXPAND_MORE_ICON = 'ExpandMoreIcon',
}

export const taskTypes = [
  'daily_and_onboarding',
  'nurse_navigator',
  't1',
  't2',
];

export enum EpisodeNotesTab {
  EPISODE_NOTE_COMPOSE_HEADER = 'episode-note-compose-header',
  CREATE_NOTE_TAGS_HEADER = 'create-note-tags-header',
  CREATE_NOTE_GENERAL_CHIP = 'create-note-general-chip',
  CREATE_NOTE_DAILY_UPDATE_CHIP = 'create-note-daily-update-chip',
  CREATE_NOTE_DISCARD_BUTTON = 'create-note-discard-button',
  CREATE_NOTE_TEXT_FIELD = 'create-note-text-field',
  CREATE_NOTE_POST_BUTTON = 'create-note-post-button',
  NOTE_OVERVIEW_EDIT_INPUT = 'note-overview-edit-input',
  NOTE_OVERVIEW_EDIT_SAVE_BUTTON = 'note-overview-edit-save-button',
  EPISODE_NOTE_LIST_SELECT = 'episode-note-list-select',
  DEFAULT_SNACKBAR_ERROR_MESSAGE = 'Unknown error',
  EDIT_MENU_ITEM = 'note-overview-edit-menu-item',
  DELETE_MENU_ITEM = 'note-overview-delete-menu-item',
  CREATE_NOTE_CLINICAL_CHIP = 'create-note-clinical-chip',
  CREATE_NOTE_NAVIGATOR_CHIP = 'create-note-navigator-chip',
}

export const getNoteMoreButton = (id: string) =>
  `note-overview-more-button-${id}`;
export const getNoteOverview = (id: string) => `note-overview-${id}`;
export const getTaskTextSelector = (id: string) => `task-text-${id}`;
export const getCompletedIconSelector = (id: string) => `completed-icon-${id}`;
export const getCompletedAvatarSelector = (id: string) =>
  `completed-avatar-${id}`;
export const getCompletedDateSelector = (id: string) => `completed-date-${id}`;

export const getNoteListItemMenuButton = (id: number) =>
  `note-overview-more-button-${id}`;
export const getNoteListItemOverview = (id: string) => `note-overview-${id}`;
export const getNoteListItemDetails = (id: string) =>
  `note-overview-details-${id}`;
export const getNoteListItemEditButton = (option: string) =>
  `note-overview-${option}-menu-item`;

export const getNoteOverviewSubtitleLabel = (id: string, type: string) =>
  `note-subtitle-${type}-label-${id}`;

export const getCreateNoteChip = (kind: string) => `create-note-${kind}-chip`;

export const getNoteOverviewAvatar = (id: string) =>
  `note-overview-avatar-${id}`;

export const getTaskAccordion = (type: string) => {
  return `${formatDataTestId(type)}-test`;
};
