export const virtualVisitsKeys = {
  all: [{ entity: 'virtualVisits' }] as const,
  details: () => [{ ...virtualVisitsKeys.all[0], scope: 'details' }] as const,
  detail: (shift_team_id: string, market_ids: string[], user_id: string) =>
    [
      {
        ...virtualVisitsKeys.details()[0],
        shift_team_id,
        ...market_ids,
        user_id,
      },
    ] as const,
};
