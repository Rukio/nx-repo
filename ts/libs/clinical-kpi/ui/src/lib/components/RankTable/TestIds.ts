const HEADING_SUFFIX = 'heading';

export const RANK_TABLE_TEST_IDS = {
  TABLE: 'rank-table',
  getRankTestId: (rank?: number) => `rank-table-rank-${rank ?? HEADING_SUFFIX}`,
  getProviderNameTestId: (rank?: number) =>
    `rank-table-provider-name-${rank || HEADING_SUFFIX}`,
  getPositionTestId: (rank?: number) =>
    `rank-table-provider-position-${rank || HEADING_SUFFIX}`,
  getValueTestId: (rank?: number) =>
    `rank-table-value-${rank || HEADING_SUFFIX}`,
  getValueChangeTestId: (rank?: number) =>
    `rank-table-value-change-${rank || HEADING_SUFFIX}`,
  getPlaceholderTestId: (rank?: number) =>
    `rank-table-placeholder-${rank || HEADING_SUFFIX}`,
};

export const PLACEHOLDER_ROW_RANKS = [1, 2, 3, 4, 5, 6, 7];
