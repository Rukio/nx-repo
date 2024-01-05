export type ActiveStatusMetadata = {
  shift_team_id?: number;
  eta?: string;
  auto_assigned?: true;
  why?: Array<unknown>;
  drive_time?: number;
  [key: string]: unknown;
};

export interface DashboardActiveStatus {
  id: number;
  name: string;
  user_id?: unknown;
  started_at: string;
  comment?: string;
  meta_data?: ActiveStatusMetadata;
  user_name: string;
  commentor_name: string;
}
