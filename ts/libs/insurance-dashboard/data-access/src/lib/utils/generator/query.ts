export type Query = Record<string, string | number | (string | number)[]>;

export const generateQuery = (query: Query): string => {
  if (!Object.keys(query).length) {
    return '';
  }

  const resultQuery = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach((item) => resultQuery.append(key, item.toString()));
      } else {
        resultQuery.append(key, value.toString());
      }
    }
  });

  return resultQuery.toString();
};
