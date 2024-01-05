import {
  StationAssignTeamParam,
  AssignTeamParam,
} from '@*company-data-covered*/consumer-web-types';

const AssignTeamParamToStationAssignTeamParam = (
  input: AssignTeamParam
): StationAssignTeamParam => {
  const output: StationAssignTeamParam = {
    shift_team_id: input.shiftTeamId,
    reason_text: input.reasonText,
    reason_text_other: input.reasonTextOther,
    assignment_date: input.assignmentDate,
  };

  if (input.metaData && typeof input.metaData !== 'string') {
    output.meta_data = {
      why: input.metaData.why,
      drive_time: input.metaData.driveTime,
      auto_assigned: input.metaData.autoAssigned,
    };
  }

  return output;
};

export default {
  AssignTeamParamToStationAssignTeamParam,
};
