import { Metrics } from './common';
import { ProfilePosition } from './peerRankings';

export enum CareTeamRankingsSortBy {
  OnSceneTime = 'METRICS_SORT_BY_ON_SCENE_TIME',
  ChartClosure = 'METRICS_SORT_BY_CHART_CLOSURE_RATE',
  SurveyCapture = 'METRICS_SORT_BY_SURVEY_CAPTURE_RATE',
  NPS = 'METRICS_SORT_BY_NET_PROMOTER_SCORE',
}

export interface CareTeamRankingsParams {
  market_id: string | undefined;
  page: string;
  search_text: string;
  provider_job_title: ProfilePosition;
  sort_by: CareTeamRankingsSortBy;
  per_page: string;
}

export interface CareTeamRankingsState {
  searchText: string;
  page: number;
  tabSelected: Metrics;
  selectedPositionName: ProfilePosition;
}
