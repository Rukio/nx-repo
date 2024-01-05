/* eslint-disable @typescript-eslint/no-explicit-any */

export interface DashboardCareRequestNote {
  id: number;
  care_request_id: number;
  note: string;
  created_at: Date;
  updated_at: Date;
  user_id?: number;
  featured?: any;
  in_timeline?: any;
  note_type: string;
  deleted_at?: Date;
  meta_data?: { companionTasks: string[]; completeCompanionTasks: string[] };
}

export type DashboardCareRequestNoteUpsert = Omit<
  DashboardCareRequestNote,
  'id' | 'created_at' | 'updated_at'
>;

export interface DashboardCareRequestNoteUpsertRequest {
  note: DashboardCareRequestNoteUpsert;
}

export type DashboardCareRequestNoteListResponse =
  Array<DashboardCareRequestNote>;
