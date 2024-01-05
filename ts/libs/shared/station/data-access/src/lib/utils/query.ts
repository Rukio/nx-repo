export const buildUrlQuery = (
  query: Record<string, string | number | (string | number)[]>
): string => {
  const queries = Object.entries(query);

  if (!queries.length) {
    return '';
  }

  const searchParams = new URLSearchParams();

  queries.forEach(([key, value]) => {
    if (value) {
      if (Array.isArray(value)) {
        searchParams.append(`${key}[]`, value.join(','));
      } else {
        searchParams.append(`${key}`, value.toString());
      }
    }
  });

  return searchParams.toString();
};
