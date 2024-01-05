export interface EtaRange {
  careRequestId?: number;
  careRequestStatusId: number;
  createdAt?: string;
  updatedAt?: string;
  id?: number;
  startsAt: string;
  endsAt: string;
  userId?: number;
  displayTimeWindow?: string;
}

export interface StationEtaRange {
  care_request_id?: number;
  care_request_status_id: number;
  created_at?: string;
  updated_at?: string;
  id?: number;
  starts_at: string;
  ends_at: string;
  user_id?: number;
  display_time_window?: string;
}
