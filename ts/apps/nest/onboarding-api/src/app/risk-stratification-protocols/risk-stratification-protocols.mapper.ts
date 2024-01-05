import {
  Protocol,
  StationProtocol,
  RiskStratificationProtocol,
  RiskStratificationProtocolSearchParam,
  StationRiskStratificationProtocol,
  StationRiskStratificationProtocolSearchParam,
} from '@*company-data-covered*/consumer-web-types';

const StationProtocolToProtocol = (input: StationProtocol): Protocol => {
  const output: Protocol = {
    id: input.id,
    weight: input.weight,
    name: input.name,
    highRisk: input.high_risk,
    general: input.general,
    dob: input.dob,
    gender: input.gender,
    tags: input.tags,
  };

  return output;
};

const SearchRSPToStationRSP = (
  input: RiskStratificationProtocolSearchParam
): StationRiskStratificationProtocolSearchParam => {
  const output: StationRiskStratificationProtocolSearchParam = {
    dob: input.dob,
    gender: input.gender,
    keywords: input.keywords,
    service_line_id: input.serviceLineId,
    market_id: input.marketId,
    high_risk: input.highRisk,
  };

  return output;
};

const StationRSPToRSP = (
  input: StationRiskStratificationProtocol
): RiskStratificationProtocol => {
  const output: RiskStratificationProtocol = {
    key: input.key,
    protocols: input.protocols.map(StationProtocolToProtocol),
  };

  return output;
};

export default {
  SearchRSPToStationRSP,
  StationRSPToRSP,
};
