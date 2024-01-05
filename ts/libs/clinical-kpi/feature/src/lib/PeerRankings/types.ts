export type Provider = {
  id: number;
  name: string;
  value: number;
  valueChange: number;
  avatarUrl: string;
  position?: string;
  rank: number;
};

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export type MarqueeLeaderProvidersData = {
  firstPosition: Provider[];
  secondPosition: Provider[];
  thirdPosition: Provider[];
};

export type RankingsData = {
  currentProviderData?: Provider;
  marqueeLeaderProviders: MarqueeLeaderProvidersData;
  rankTableProviders: Provider[];
};
