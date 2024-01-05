export type LeaderHubRankTableRow = {
  id: number;
  rank: number;
  name: string;
  value?: number;
  valueChange: number;
  position?: string;
};

export const careTeamRankingsMock: LeaderHubRankTableRow[] = [
  {
    id: 1,
    name: 'Luigi Martiniello',
    rank: 1,
    value: 5.67,
    valueChange: -11.67,
    position: 'DHMT',
  },
  {
    id: 2,
    name: 'Connie Garcia',
    rank: 2,
    value: 6,
    valueChange: -0.02,
    position: 'APP',
  },
  {
    id: 3,
    name: 'Steve Tomis',
    rank: 3,
    value: 6.17,
    valueChange: 1.67,
    position: 'APP',
  },
  {
    id: 4,
    name: 'Veerle de Bree',
    rank: 4,
    value: 7.02,
    valueChange: 0,
    position: 'APP',
  },
  {
    id: 5,
    name: '',
    rank: 5,
    value: 7.5,
    valueChange: 0.17,
    position: 'DHMT',
  },
];
