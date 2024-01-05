import { MarketFeasibilityStatus } from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';

export const LIMITED_FEASIBILITY_TYPES = [
  MarketFeasibilityStatus.Limited,
  MarketFeasibilityStatus.LimitedLocation,
  MarketFeasibilityStatus.LimitedNearingCapacity,
  MarketFeasibilityStatus.LimitedServiceDuration,
];

export const isMarketFeasibilityLimited = (
  availability?: MarketFeasibilityStatus
) => {
  if (!availability) {
    return false;
  }

  return LIMITED_FEASIBILITY_TYPES.includes(availability);
};

export const isMarketFeasibilityAvailable = (
  availability?: MarketFeasibilityStatus
) => {
  if (!availability) {
    return false;
  }

  return (
    availability === MarketFeasibilityStatus.Available ||
    isMarketFeasibilityLimited(availability)
  );
};

export const getFiveDigitZipCode = (zipCode?: string): string => {
  if (!zipCode) {
    return '';
  }

  const [mainZipCodePart] = zipCode.split('-');

  return mainZipCodePart;
};
