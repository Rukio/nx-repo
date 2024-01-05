import { Id } from './shifts';

export type CARE_REQUEST_STATUS =
  | 'requested'
  | 'accepted'
  | 'committed'
  | 'on_route'
  | 'virtual_app_assigned'
  | 'on_scene';

export declare namespace CareRequests {
  type CareRequestId = Id;
  type Status = { status: CARE_REQUEST_STATUS };
  type Days = { days: number };
  type Statuses = {
    statuses: Array<CARE_REQUEST_STATUS>;
  };
  type MarketIDs = { marketIds: string };

  type GetAllCareRequests = MarketIDs & {
    lastPage?: number;
    requestList?: Array<CareRequests.CareRequestId>;
    currentPage?: number;
  };
  type GetCareRequests = MarketIDs & {
    page: number;
  };
}

export type UpdateCareRequestStatusParams = CareRequests.CareRequestId &
  CareRequests.Status & { shiftTeamId: string };
