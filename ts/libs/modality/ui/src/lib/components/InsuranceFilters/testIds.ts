const insuranceFiltersSelectOptionPrefixText =
  'insurance-filters-filter-by-option';

export const INSURANCE_FILTERS_TESTS_IDS = {
  SEARCH_FIELD: 'insurance-filters-search-field',
  FILTER_BY_SELECT: 'insurance-filters-filter-by-select',
  FILTER_BY_OPTION_PREFIX: 'insurance-filters-filter-by-option',
  getFilterByOptionTestId: (insuranceClassificationId: number) =>
    `${insuranceFiltersSelectOptionPrefixText}-${insuranceClassificationId}`,
};
