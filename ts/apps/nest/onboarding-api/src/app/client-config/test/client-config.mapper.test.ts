import mapper from '../client-config.mapper';
import {
  mockLogDNAConfig,
  mockStationLogDNAConfig,
} from '../mocks/client-config.mock';

describe('ClientConfigMapper tests', () => {
  it('transform station logDNA config', async () => {
    const transformedResult = mapper.StationLogDNAConfigToLogDNAConfig(
      mockStationLogDNAConfig
    );
    expect(transformedResult).toEqual(mockLogDNAConfig);
  });
});
