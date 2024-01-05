export const FORMATTED_LIST_TEST_IDS = {
  getListRootTestId: (testIdPrefix: string) =>
    `${testIdPrefix}-formatted-list-root`,
  getListItemTestId: (testIdPrefix: string) =>
    `${testIdPrefix}-formatted-list-list-item`,
  getListItemTitleTestId: (testIdPrefix: string) =>
    `${testIdPrefix}-formatted-list-list-item-title`,
  getListItemActionTestId: (testIdPrefix: string) =>
    `${testIdPrefix}-formatted-list-list-item-action`,
  getListItemChildrenContainerTestId: (testIdPrefix: string) =>
    `${testIdPrefix}-formatted-list-list-item-children-container`,
  getListItemButtonTestId: (testIdPrefix: string) =>
    `${testIdPrefix}-formatted-list-list-item-button`,
  getListItemIconButtonTestId: (testIdPrefix: string) =>
    `${testIdPrefix}-formatted-list-list-item-icon-button`,
};
