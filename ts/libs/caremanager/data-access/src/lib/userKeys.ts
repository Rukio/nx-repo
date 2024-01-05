export const userKeys = {
  all: [{ entity: 'users' }] as const,
  lists: () => [{ ...userKeys.all[0], scope: 'list' }] as const,
  list: (userIDs?: string[]) => [{ ...userKeys.lists()[0], userIDs }] as const,
  details: () => [{ ...userKeys.all[0], scope: 'details' }] as const,
  detail: (id: string) => [{ ...userKeys.details()[0], id: id }] as const,
};
