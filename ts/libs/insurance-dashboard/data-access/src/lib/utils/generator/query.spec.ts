import { generateQuery } from './query';
import { mockedPayersFiltersData } from '../../feature';

describe('generateQuery', () => {
  it('should generate correct query', () => {
    const expectedQuery =
      'sortField=1&sortDirection=1&payerName=test&stateAbbrs=QW&stateAbbrs=WE';
    const generatedQuery = generateQuery(mockedPayersFiltersData);
    expect(generatedQuery).toEqual(expectedQuery);
  });

  it('should return empty string', () => {
    const expectedQuery = '';
    const generatedQuery = generateQuery({});
    expect(generatedQuery).toEqual(expectedQuery);
  });

  it('should generate correct query with array', () => {
    const expectedQuery = 'arrayItems=1&arrayItems=2';
    const generatedQuery = generateQuery({ arrayItems: [1, 2] });
    expect(generatedQuery).toEqual(expectedQuery);
  });
});
