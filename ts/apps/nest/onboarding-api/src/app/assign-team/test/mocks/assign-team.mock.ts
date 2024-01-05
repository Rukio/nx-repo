import { EtaRange, StationEtaRange } from '@*company-data-covered*/consumer-web-types';
import AssignTeamQueryDto from '../../dto/assign-team-query.dto';
import EtaRangeQueryDTO from '../../dto/assign-team-eta-range.dto';

export const MOCK_ASSIGN_TEAM_PARAMS: AssignTeamQueryDto = {
  careRequestId: 612985,
  shiftTeamId: 70145,
  reasonText: 'Reason',
  reasonTextOther: 'Other text reason',
  assignmentDate: '02-02-2022',
  metaData: {
    why: 'Test',
    autoAssigned: true,
    driveTime: 548,
  },
};

export const MOCK_ETA_PARAMS: EtaRangeQueryDTO = {
  careRequestId: 614009,
  careRequestStatusId: 4004526,
  endsAt: '2022-04-04T14:00:00.585Z',
  startsAt: '2022-04-04T07:00:00.585Z',
};

export const MOCK_ASSIGN_TEAM_CREATE_ETA_RESPONSE: EtaRange = {
  careRequestStatusId: 4004526,
  careRequestId: 644228,
  createdAt: '2022-02-03T22:40:06.598Z',
  updatedAt: '2022-02-03T22:40:06.598Z',
  id: 5011,
  startsAt: '2022-02-04T07:00:00.585Z',
  endsAt: '2022-04-02T14:00:00.585Z',
  userId: 9999,
};

export const MOCK_STATION_ASSIGN_TEAM_CREATE_ETA_RESPONSE: StationEtaRange = {
  care_request_id: 644228,
  care_request_status_id: 4004526,
  created_at: '2022-02-03T22:40:06.598Z',
  updated_at: '2022-02-03T22:40:06.598Z',
  id: 5011,
  starts_at: '2022-02-04T07:00:00.585Z',
  ends_at: '2022-04-02T14:00:00.585Z',
  user_id: 9999,
};
