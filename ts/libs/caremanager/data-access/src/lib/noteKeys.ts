type ListFilters = {
  parentEntity: 'ServiceRequest' | 'Episode';
  parentEntityId: string;
};

export const noteKeys = {
  all: [{ entity: 'notes' }] as const,
  lists: () => [{ ...noteKeys.all[0], scope: 'list' }] as const,
  list: (filters: ListFilters) =>
    [{ ...noteKeys.lists()[0], filters }] as const,
};
