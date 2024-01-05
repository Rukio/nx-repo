import { URL_SEGMENTS, buildAccountsPath } from './api-paths';

describe('api paths', () => {
  describe('buildAccountsPath', () => {
    it.each([
      {
        desc: 'should work without id',
        expected: URL_SEGMENTS.ACCOUNTS,
      },
      {
        desc: 'should work with id',
        input: '1',
        expected: `${URL_SEGMENTS.ACCOUNTS}/1`,
      },
    ])('$desc', ({ input, expected }) => {
      expect(buildAccountsPath(input)).toBe(expected);
    });
  });
});
