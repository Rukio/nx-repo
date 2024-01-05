const defaultDataTestIdPrefix = 'time-range-selector';

export const TIME_RANGE_SELECTOR_TEST_IDS = {
  DEFAULT_DATA_TEST_ID_PREFIX: defaultDataTestIdPrefix,
  getTitleTestId: (dataTestIdPrefix: string) => `${dataTestIdPrefix}-title`,
  getFieldTestId: (dataTestIdPrefix: string) => `${dataTestIdPrefix}-field`,
  getInputTestId: (dataTestIdPrefix: string) => `${dataTestIdPrefix}-input`,
  getCircularProgressTestId: (dataTestIdPrefix: string) =>
    `${dataTestIdPrefix}-circular-progress`,

  getMenuItemTestIdPrefix: (dataTestIdPrefix: string) =>
    `${dataTestIdPrefix}-menu-item`,
};
