export interface Pagination {
  total: string;
  page: number;
  totalPages: string;
}

export interface TimeOfDay {
  hours: number;
  minutes: number;
  seconds: number;
  nanos: number;
}

export interface ServiceDate {
  year: number;
  month: number;
  day: number;
}

export enum Metrics {
  OnSceneTime = 'OnSceneTime',
  ChartClosure = 'ChartClosure',
  SurveyCapture = 'SurveyCapture',
  NPS = 'NPS',
}

export interface CommonDate {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
  nanos: number;
  timeZone: {
    id: string;
    version: string;
  };
}

export interface Provider {
  id: number;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  profile: ProviderProfile;
}

export interface ProviderProfile {
  position: string;
  credentials: string;
}

export interface Market {
  id: string;
  name: string;
  shortName: string;
}
