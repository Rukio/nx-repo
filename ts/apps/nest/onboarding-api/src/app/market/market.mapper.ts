import {
  StationMarket,
  Market,
  StationMarketStateLocaleCallCenterLine,
  MarketStateLocaleCallCenterLine,
} from '@*company-data-covered*/consumer-web-types';

const StationCallCenterLineToCallCenterLine = (
  line?: StationMarketStateLocaleCallCenterLine
): MarketStateLocaleCallCenterLine | null => {
  if (!line) {
    return null;
  }

  return {
    id: line.id,
    genesysId: line.genesys_id,
    phoneNumber: line.phone_number,
    queueName: line.queue_name,
    callCenterLineType: line.call_center_line_type,
    stateId: line.state_id,
  };
};

const StationMarketToMarket = (input: StationMarket): Market => {
  const output: Market = {
    id: input.id,
    name: input.name,
    marketName: input.market_name,
    timezone: input.timezone,
    contactEmail: input.contact_email,
    state: input.state,
    shortName: input.short_name,
    enabled: input.enabled,
    only911: input.only_911,
    primaryInsuranceSearchEnabled: input.primary_insurance_search_enabled,
    tzName: input.tz_name,
    tzShortName: input.tz_short_name,
    stateLocale: input.state_locale && {
      id: input.state_locale?.id,
      name: input.state_locale?.name,
      abbreviation: input.state_locale?.abbreviation,
      screenerLine: StationCallCenterLineToCallCenterLine(
        input.state_locale?.screener_line
      ),
      dispatcherLine: StationCallCenterLineToCallCenterLine(
        input.state_locale?.dispatcher_line
      ),
    },
    genesysId: input.genesys_id,
    allowEtaRangeModification: input.allow_eta_range_modification,
    autoAssignTypeOrDefault: input.auto_assign_type_or_default,
    autoAssignable: input.auto_assignable,
    nextDayEtaEnabled: input.next_day_eta_enabled,
    selfPayRate: input.self_pay_rate,
    schedules:
      input.schedules &&
      input.schedules.length &&
      input.schedules.map((schedule) => ({
        id: schedule.id,
        openAt: schedule.open_at,
        closeAt: schedule.close_at,
        openDuration: schedule.open_duration,
        days: schedule.days,
        createdAt: schedule.created_at,
        updatedAt: schedule.updated_at,
        schedulableType: schedule.schedulable_type,
        schedulableId: schedule.schedulable_id,
      })),
  };

  return output;
};

export default {
  StationMarketToMarket,
};
