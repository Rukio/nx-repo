import {
  MOCK_OSS_USER_CACHE,
  MOCK_OSS_USER_CACHE_WITHOUT_CR_ID,
} from '../../test/mocks/self-schedule.mock';
import { CareRequestIdFromCachePipe } from '../care-request-id-from-cache.pipe';

describe(`${CareRequestIdFromCachePipe.name}`, () => {
  it('returns care request id from user cache', () => {
    const cacheByUserIdPipe = new CareRequestIdFromCachePipe();
    expect(cacheByUserIdPipe.transform(MOCK_OSS_USER_CACHE)).toEqual(
      MOCK_OSS_USER_CACHE.careRequestId
    );
  });

  it('throws error when user cache is empty', () => {
    const cacheByUserIdPipe = new CareRequestIdFromCachePipe();
    expect(() => cacheByUserIdPipe.transform(null)).toThrow(
      'User cache is empty'
    );
  });

  it('throws error when user cache has empty care request id', () => {
    const cacheByUserIdPipe = new CareRequestIdFromCachePipe();
    expect(() =>
      cacheByUserIdPipe.transform(MOCK_OSS_USER_CACHE_WITHOUT_CR_ID)
    ).toThrow('No care request ID in self schedule cache');
  });
});
