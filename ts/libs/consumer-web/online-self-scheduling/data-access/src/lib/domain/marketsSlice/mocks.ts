import { DomainMarket, CallCenterLineType } from '../../types';

export const mockMarket: Omit<DomainMarket, 'stateLocale'> & {
  stateLocale: Required<NonNullable<DomainMarket['stateLocale']>>;
} = {
  id: 1,
  name: 'Denver',
  allowEtaRangeModification: true,
  autoAssignTypeOrDefault: 'default',
  autoAssignable: true,
  nextDayEtaEnabled: true,
  only911: false,
  primaryInsuranceSearchEnabled: true,
  selfPayRate: 5,
  shortName: 'DEN',
  timezone: 'America/Denver',
  state: 'CO',
  tzName: 'MST',
  tzShortName: 'MST',
  enabled: true,
  stateLocale: {
    id: 1,
    name: 'CO',
    abbreviation: 'CO',
    screenerLine: {
      id: 1,
      phoneNumber: '+phoneNumber',
      genesysId: '12345',
      queueName: 'queue',
      callCenterLineType: CallCenterLineType.screener,
      stateId: 1,
    },
    dispatcherLine: {
      id: 1,
      phoneNumber: '+phoneNumber',
      genesysId: '12345',
      queueName: 'queue',
      callCenterLineType: CallCenterLineType.dispatcher,
      stateId: 1,
    },
  },
  schedules: [
    {
      id: 1,
      openAt: '2022-11-02T07:00:00.403Z',
      closeAt: '2022-11-02T23:00:00.530Z',
      openDuration: 57600,
      days: [],
      createdAt: '2022-11-02T19:00:32.403Z',
      updatedAt: '2022-11-02T19:00:32.530Z',
      schedulableType: 'Market',
      schedulableId: 1,
    },
  ],
};
