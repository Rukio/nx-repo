import { buildUrlQuery } from './query';

describe('buildUrlQuery', () => {
  it('should build correct query', () => {
    // encoded value
    const expectedQuery = 'search=test&ids%5B%5D=1%2C2%2C3&page=1';
    const generatedQuery = buildUrlQuery({
      search: 'test',
      ids: [1, 2, 3],
      page: 1,
      rows: '',
    });
    expect(generatedQuery).toEqual(expectedQuery);
  });

  it('should return empty string', () => {
    const expectedQuery = '';
    const generatedQuery = buildUrlQuery({});
    expect(generatedQuery).toEqual(expectedQuery);
  });
});
