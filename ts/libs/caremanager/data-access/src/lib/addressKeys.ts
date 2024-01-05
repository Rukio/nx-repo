export const addressKeys = {
  all: [{ entity: 'addresses' }] as const,
  lists: () => [{ ...addressKeys.all[0], scope: 'list' }] as const,
  list: (ids?: string[]) => [{ ...addressKeys.lists()[0], ids }] as const,
};
