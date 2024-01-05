import { FORMATTED_LIST_TEST_IDS } from '../FormattedList';

export const SETTINGS_LIST_TEST_IDS = {
  getButtonListItemRootTestId: (testIdPrefix: string) =>
    `${testIdPrefix}-settings-list-button-list-item-list-item`,
  getButtonListItemButtonTestId: (testIdPrefix: string) =>
    `${testIdPrefix}-settings-list-button-list-item-button`,
  getEditableListItemTestId: FORMATTED_LIST_TEST_IDS.getListItemTestId,
  getEditableListItemEditButtonTestId:
    FORMATTED_LIST_TEST_IDS.getListItemButtonTestId,
  getInformableListItemTestId: FORMATTED_LIST_TEST_IDS.getListItemTestId,
  getInformableListItemInfoButtonTestId:
    FORMATTED_LIST_TEST_IDS.getListItemIconButtonTestId,
};
