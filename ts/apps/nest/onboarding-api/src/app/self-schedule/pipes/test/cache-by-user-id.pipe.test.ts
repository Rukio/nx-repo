import { mockDeep } from 'jest-mock-extended';
import { CacheByUserIdPipe } from '../cache-by-user-id.pipe';
import SelfScheduleService from '../../self-schedule.service';
import {
  MOCK_OSS_USER_CACHE,
  MOCK_OSS_USER_ID,
} from '../../test/mocks/self-schedule.mock';

const mockSelfScheduleService = mockDeep<SelfScheduleService>();

describe(`${CacheByUserIdPipe.name}`, () => {
  it('should call self-schedule service and return user cache', async () => {
    mockSelfScheduleService.fetchCache.mockResolvedValueOnce(
      MOCK_OSS_USER_CACHE
    );
    const cacheByUserIdPipe = new CacheByUserIdPipe(mockSelfScheduleService);
    await expect(
      cacheByUserIdPipe.transform(MOCK_OSS_USER_ID)
    ).resolves.toEqual(MOCK_OSS_USER_CACHE);
    expect(mockSelfScheduleService.fetchCache).toHaveBeenCalledWith(
      MOCK_OSS_USER_ID
    );
  });

  it('should return null user cache is empty', async () => {
    mockSelfScheduleService.fetchCache.mockResolvedValueOnce(null);
    const cacheByUserIdPipe = new CacheByUserIdPipe(mockSelfScheduleService);
    await expect(
      cacheByUserIdPipe.transform(MOCK_OSS_USER_ID)
    ).resolves.toEqual(null);
    expect(mockSelfScheduleService.fetchCache).toHaveBeenCalledWith(
      MOCK_OSS_USER_ID
    );
  });
});
