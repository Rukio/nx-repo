import {
  LeaderHubIndividualProviderMetrics,
  LeaderHubProviderShiftsResponse,
} from '../../types';

export const mockedLeaderHubIndividualProviderMetrics: LeaderHubIndividualProviderMetrics =
  {
    provider: {
      avatarUrl: 'https://non-station.com/avatar',
      firstName: 'Tami',
      lastName: 'Hampson',
      id: 116600,
      profile: {
        position: 'APP',
        credentials: 'NP',
      },
    },
    onSceneTimeMedianSeconds: 40,
    chartClosureRate: 88.74552267163648,
    surveyCaptureRate: 71.48149726649712,
    netPromoterScoreAverage: 85.48242770125078,
    onTaskPercent: 87.5950477823281,
    escalationRate: 13.589378403168467,
    abxPrescribingRate: 0.2819291303741444,
  };

export const mockedProviderShifts: LeaderHubProviderShiftsResponse = {
  providerShifts: [
    {
      shiftTeamId: '88103',
      providerId: '35513',
      serviceDate: {
        year: 2023,
        month: 7,
        day: 1,
      },
      startTime: {
        hours: 16,
        minutes: 57,
        seconds: 24,
        nanos: 517071000,
      },
      endTime: {
        hours: 18,
        minutes: 57,
        seconds: 24,
        nanos: 517071000,
      },
      patientsSeen: 7,
      outTheDoorDurationSeconds: 4,
      onSceneDurationSeconds: 232,
      enRouteDurationSeconds: 152,
      onBreakDurationSeconds: 37,
      idleDurationSeconds: 21,
    },
    {
      shiftTeamId: '88104',
      providerId: '35513',
      serviceDate: {
        year: 2023,
        month: 6,
        day: 30,
      },
      startTime: {
        hours: 16,
        minutes: 57,
        seconds: 24,
        nanos: 517083000,
      },
      endTime: {
        hours: 18,
        minutes: 57,
        seconds: 24,
        nanos: 517083000,
      },
      patientsSeen: 5,
      outTheDoorDurationSeconds: 5,
      enRouteDurationSeconds: 177,
      onSceneDurationSeconds: 210,
      onBreakDurationSeconds: 37,
      idleDurationSeconds: 25,
    },
    {
      shiftTeamId: '88105',
      providerId: '35513',
      serviceDate: {
        year: 2023,
        month: 6,
        day: 29,
      },
      startTime: {
        hours: 16,
        minutes: 57,
        seconds: 24,
        nanos: 517095000,
      },
      endTime: {
        hours: 18,
        minutes: 57,
        seconds: 24,
        nanos: 517095000,
      },
      patientsSeen: 5,
      outTheDoorDurationSeconds: 6,
      enRouteDurationSeconds: 152,
      onSceneDurationSeconds: 220,
      onBreakDurationSeconds: 34,
      idleDurationSeconds: 20,
    },
  ],
  pagination: {
    total: '20',
    page: 1,
    totalPages: '2',
  },
};
