export const CARE_TEAM_RANK_TABLE_TEST_IDS = {
  TABLE: 'care-team-rank-table',
  getRankTestId: (rank?: number) => `care-team-table-rank-${rank}`,
  getProviderNameTestId: (rank?: number) =>
    `care-team-rank-table-provider-name-${rank}`,
  getValueTestId: (rank?: number) => `care-team-rank-table-value-${rank}`,
  getValueChangeTestId: (rank?: number) =>
    `care-team-rank-table-value-change-${rank}`,
  getPlaceholderTestId: (rank?: number) =>
    `care-team-rank-table-placeholder-${rank}`,
};

export const CARE_TEAM_PLACEHOLDER_ROW_RANKS = [1, 2, 3, 4, 5, 6, 7];
