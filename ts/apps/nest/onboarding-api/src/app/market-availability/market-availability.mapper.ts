import {
  MarketsAvailabilityZipcode,
  StationMarketsAvailabilityZipcode,
  CheckMarketAvailabilityBody,
  StationCheckMarketAvailabilityBody,
  MarketAvailabilityBody,
  StationMarketAvailabilityBody,
} from '@*company-data-covered*/consumer-web-types';

const StationMarketsAvailabilityZipcodeToMarketsAvailabilityZipcode = (
  input: StationMarketsAvailabilityZipcode
): MarketsAvailabilityZipcode => {
  const output: MarketsAvailabilityZipcode = {
    id: input.id,
    billingCityId: input.billing_city_id,
    marketId: input.market_id,
  };

  return output;
};

const CheckMarketAvailabilityBodyToStationCheckMarketAvailabilityBody = (
  input: CheckMarketAvailabilityBody
): StationCheckMarketAvailabilityBody => {
  const output: StationCheckMarketAvailabilityBody = {
    zipcode: input.zipcode,
    market_id: input.marketId,
    latitude: input.latitude,
    longitude: input.longitude,
    date: input.date,
    start_timestamp_sec: input.startTimeSec,
    end_timestamp_sec: input.endTimeSec,
    care_request_id: input.careRequestId,
    service_line_id: input.serviceLineId,
  };

  return output;
};

const MarketAvailabilityBodyToStationMarketAvailabilityBody = (
  input: MarketAvailabilityBody
): StationMarketAvailabilityBody => {
  const output: StationMarketAvailabilityBody = {
    market_id: input.market_id,
    service_date: input.service_date,
    requested_service_line: input.requested_service_line,
  };

  return output;
};

export default {
  StationMarketsAvailabilityZipcodeToMarketsAvailabilityZipcode,
  CheckMarketAvailabilityBodyToStationCheckMarketAvailabilityBody,
  MarketAvailabilityBodyToStationMarketAvailabilityBody,
};
