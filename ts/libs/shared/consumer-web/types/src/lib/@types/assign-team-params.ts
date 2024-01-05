export interface StationAssignTeamParam {
  reason_text?: string;
  reason_text_other?: string;
  shift_team_id: number | string;
  meta_data?:
    | {
        why?: string;
        auto_assigned?: boolean;
        drive_time?: number;
      }
    | string;
  assignment_date?: Date | string;
}

export interface AssignTeamParam {
  reasonText?: string;
  reasonTextOther?: string;
  shiftTeamId: number | string;
  metaData?:
    | {
        why?: string;
        autoAssigned?: boolean;
        driveTime?: number;
      }
    | string;
  assignmentDate?: Date | string;
}
