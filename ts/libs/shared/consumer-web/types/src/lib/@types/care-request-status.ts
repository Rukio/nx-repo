export interface CareRequestStatus {
  status: string;
  comment?: string;
  shiftTeamId?: number;
  reassignmentReasonText?: string;
  reassignmentReasonOtherText?: string;
}

export interface OssCareRequestStatusPayload {
  careRequestId: string;
  status: string;
  comment?: string;
  shiftTeamId?: number;
  reassignmentReasonText?: string;
  reassignmentReasonOtherText?: string;
}

export interface StationCareRequestStatusPayload {
  request_status: string;
  comment?: string;
  reassignment_reason?: string;
  reassignment_reason_other?: string;
  meta_data?: {
    shift_team_id: number;
  };
}

export type CareRequestAcceptIfFeasible = Omit<CareRequestStatus, 'status'> & {
  skipFeasibilityCheck?: boolean;
};

export interface OssCareRequestAcceptIfFeasible
  extends CareRequestAcceptIfFeasible {
  careRequestId: string;
}

export type StationAcceptCareRequestIfFeasiblePayload = Omit<
  StationCareRequestStatusPayload,
  'request_status'
> & {
  skip_feasibility_check: boolean;
};

export interface Status {
  comment: string;
  commentorName: string;
  id: number;
  metaData?: {
    shiftTeamId: number;
    eta: string;
    autoAssigned: boolean;
    driveTime: number;
    rto: boolean;
    why: string[];
    assignmentId: string;
  };
  name: string;
  startedAt: string;
  userId: number;
  userName: string;
}

export interface StationStatus {
  comment: string;
  commentor_name: string;
  id: number;
  meta_data?: {
    shift_team_id: number;
    eta: string;
    auto_assigned: boolean;
    drive_time: number;
    rto: boolean;
    assignment_id: string;
    why: string[];
  };
  name: string;
  started_at: string;
  user_id: number;
  user_name: string;
}
