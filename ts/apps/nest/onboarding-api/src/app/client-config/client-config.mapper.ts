import { LogDNAConfig } from '@*company-data-covered*/consumer-web-types';

const StationLogDNAConfigToLogDNAConfig = (
  input: LogDNAConfig
): LogDNAConfig => {
  const output: LogDNAConfig = {
    key: input.key,
    tier: input.tier,
    enabled: input.enabled,
  };

  return output;
};

export default {
  StationLogDNAConfigToLogDNAConfig,
};
