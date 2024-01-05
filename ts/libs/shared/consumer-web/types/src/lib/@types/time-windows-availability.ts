export interface StationTimeWindow {
  display_time_window: string;
  end: string;
  part_of_day: string;
  start: string;
}

export interface StationAvailableTimeWindow extends StationTimeWindow {
  is_recommended: boolean;
}

export interface StationTimeWindowsAvailability {
  available_time_windows: StationAvailableTimeWindow[];
  service_date: string;
  unavailable_time_windows: StationTimeWindow[];
}

export interface TimeWindow {
  displayTimeWindow: string;
  end: string;
  isRecommended?: boolean;
  partOfDay: string;
  start: string;
}

export interface TimeWindowsAvailability {
  availableTimeWindows: TimeWindow[];
  serviceDate: string;
  unavailableTimeWindows: TimeWindow[];
}
