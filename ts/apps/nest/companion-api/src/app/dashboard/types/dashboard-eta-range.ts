export interface DashboardEtaRange {
  id: number;
  starts_at: string;
  ends_at: string;
  user_id?: number;
  care_request_id: number;
  care_request_status_id: number;
  created_at: string;
  updated_at: string;
}
