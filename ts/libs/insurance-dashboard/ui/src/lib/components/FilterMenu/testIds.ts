export const filterMenuOptionPrefixText = 'filter-menu-option';
export const filterMenuItemPrefixText = 'filter-menu-item';
export const filterMenuChipPrefixText = 'filter-menu-chip';

export const FILTER_MENU_TESTS_IDS = {
  FILTER_CLEAR_BUTTON: 'filter-menu-clear-button',
  FILTER_DONE_BUTTON: 'filter-menu-done-button',
  FILTER_OPTION_SEARCH_FIELD: `${filterMenuOptionPrefixText}-search-field`,
  getFilterChipsTestId: (filterMenuName: string) =>
    `${filterMenuChipPrefixText}-${filterMenuName}`,
  getFilterChipsMenuTestId: (filterMenuName: string) =>
    `${filterMenuChipPrefixText}-menu-${filterMenuName}`,
  getFilterOptionTestId: (
    filterMenuName: string,
    filterMenuOptionId: number | string
  ) => `${filterMenuOptionPrefixText}-${filterMenuName}-${filterMenuOptionId}`,
  getFilterMenuItemTestid: (
    filterMenuName: string,
    filterMenuItemId: number | string
  ) => `${filterMenuItemPrefixText}-${filterMenuName}-${filterMenuItemId}`,
};
