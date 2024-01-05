export const MARQUEE_LEADER_GROUP_TEST_IDS = {
  getContainerTestId: (rank: number) =>
    `marquee-leader-group-container-${rank}`,
  getBadgeTestId: (rank: number) => `marquee-leader-group-badge-${rank}`,
  getAvatarsContainerTestId: (rank: number) =>
    `marquee-leader-group-avatars-container-${rank}`,
  getAvatarTestId: (index: number, rank: number) =>
    `marquee-leader-group-avatar-${rank}-${index}`,
  getAvatarPlaceholderTestId: (rank: number) =>
    `marquee-leader-group-avatar-placeholder-${rank}`,
  getTitleTestId: (rank: number) => `marquee-leader-group-title-${rank}`,
  getPositionTestId: (rank: number) => `'marquee-leader-group-position-${rank}`,
  getValueTestId: (rank: number) => `marquee-leader-group-value-${rank}`,
  getValueChangeTestId: (rank: number) =>
    `marquee-leader-group-value-change-${rank}`,
  getNextButtonTestId: (rank: number) =>
    `marquee-leader-group-next-button-${rank}`,
  getPreviousButtonTestId: (rank: number) =>
    `marquee-leader-group-previous-button-${rank}`,
  getPlaceholderTestId: (rank: number) =>
    `marquee-leader-group-placeholder-${rank}`,
};
