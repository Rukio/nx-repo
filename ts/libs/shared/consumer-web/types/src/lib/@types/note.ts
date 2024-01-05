export interface Note {
  id: number;
  careRequestId: number;
  featured: boolean;
  note: string;
  inTimeline: boolean;
  metaData: Record<string, unknown>;
  noteType: string;
  user?: {
    id?: number;
    firstName: string;
    lastName: string;
  };
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface StationNote {
  id?: number;
  care_request_id: number;
  featured?: boolean;
  note?: string;
  in_timeline?: boolean;
  meta_data?: Record<string, unknown>;
  note_type?: string;
  user?: {
    id?: number;
    first_name: string;
    last_name: string;
  };
  user_id?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}
