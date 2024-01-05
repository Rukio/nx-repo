export interface GeoModel {
  acceptedOrder?: number;
  assignmentDate?: string;
  assignmentStatus?: string;
  careRequestId?: number;
  createdAt?: string;
  crid?: string;
  etaWindow?: string[];
  etoc?: number;
  geoType?: string;
  id?: number;
  latitude?: number;
  longitude?: number;
  marketId?: number;
  nearbyMarketIds?: number[];
  onRouteAt?: string;
  onSceneAt?: string;
  requestStatus?: string;
  requiredSkillIds?: number[];
  requiredSkills?: {
    id: number;
    rejectMessage: string;
  }[];
  shiftTeamId?: number;
  skipReassign?: string | boolean;
  state?: string;
  stationRequestId?: string | number;
  updatedAt?: string;
  duration?: number;
  endTime?: string;
  hoursIntoShift?: number;
  marketBreakConfigId?: number;
  startTime?: string;
  thresholdInMinutes?: number;
  windowEnd?: number;
  windowStart?: number;
}

export interface StationGeoModel {
  accepted_order?: number;
  assignment_date?: string;
  assignment_status?: string;
  care_request_id?: number;
  created_at?: string;
  crid?: string;
  eta_window?: string[];
  etoc?: number;
  geo_type?: string;
  id?: number;
  latitude?: number;
  longitude?: number;
  market_id?: number;
  nearby_market_ids?: number[];
  on_route_at?: string;
  on_scene_at?: string;
  request_status?: string;
  required_skill_ids?: number[];
  required_skills?: {
    id: number;
    reject_message: string;
  }[];
  shift_team_id?: number;
  skip_reassign?: string | boolean;
  state?: string;
  station_request_id?: string | number;
  updated_at?: string;
  duration?: number;
  end_time?: string;
  hours_into_shift?: number;
  market_break_config_id?: number;
  start_time?: string;
  threshold_in_minutes?: number;
  window_end?: number;
  window_start?: number;
}

export interface MarketEstimate {
  acceptedOrder?: number;
  carId?: number;
  careRequestId?: number;
  departureSeconds?: number;
  departureTime?: string;
  distance?: number;
  driveTime?: number;
  eta?: number;
  etaTime?: string;
  etc?: number;
  etcTime?: string;
  geoModel?: GeoModel;
  latitude?: number;
  longitude?: number;
  marketId?: number;
  onTimeStatus?: string;
  shiftTeamId?: number;
  tzShortName?: string;
}

export interface StationMarketEstimate {
  accepted_order?: number;
  car_id?: number;
  care_request_id?: number;
  departure_seconds?: number;
  departure_time?: string;
  distance?: number;
  drive_time?: number;
  eta?: number;
  eta_time?: string;
  etc?: number;
  etc_time?: string;
  geo_model?: StationGeoModel;
  latitude?: number;
  longitude?: number;
  market_id?: number;
  on_time_status?: string;
  shift_team_id?: number;
  tz_short_name?: string;
}
