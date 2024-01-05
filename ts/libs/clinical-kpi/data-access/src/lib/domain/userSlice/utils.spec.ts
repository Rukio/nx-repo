import { sortMarketsAlphabetically } from './utils';
import { mockedAuthenticatedUser } from './mocks';

describe('utils', () => {
  it('should sort markets alphabetically', () => {
    const sortedMarkets = sortMarketsAlphabetically(
      mockedAuthenticatedUser.markets
    );

    expect(sortedMarkets).toEqual([
      {
        id: '176',
        name: 'Boise',
        shortName: 'BOI',
      },
      {
        id: '198',
        name: 'Columbus',
        shortName: 'COL',
      },
    ]);
  });
});
