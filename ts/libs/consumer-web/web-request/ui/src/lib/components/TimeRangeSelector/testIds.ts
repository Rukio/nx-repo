export const TIME_RANGE_SELECTOR_TEST_IDS = {
  getTitleTestId: (dataTestIdPrefix: string) => `${dataTestIdPrefix}-title`,
  getFieldTestId: (dataTestIdPrefix: string) => `${dataTestIdPrefix}-field`,
  getInputTestId: (dataTestIdPrefix: string) => `${dataTestIdPrefix}-input`,
  getCircularProgressTestId: (dataTestIdPrefix: string) =>
    `${dataTestIdPrefix}-circular-progress`,
  getRangeMenuItemTestId: (dataTestIdPrefix: string, label: string) =>
    `${dataTestIdPrefix}-range-menu-item-${label}`,
};
